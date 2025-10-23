-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'farmer', 'customer', 'delivery_agent');
CREATE TYPE public.product_status AS ENUM ('harvested', 'in_transit', 'delivered', 'verified');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'verified');
CREATE TYPE public.checkpoint_type AS ENUM ('harvest', 'farm_pickup', 'warehouse', 'in_transit', 'customer_delivery');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Farms table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_name TEXT NOT NULL,
  location TEXT NOT NULL,
  organic_certified BOOLEAN DEFAULT false,
  certification_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  description TEXT,
  harvest_date DATE NOT NULL,
  pesticide_used BOOLEAN DEFAULT false,
  pesticide_details TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit NUMERIC NOT NULL,
  status product_status DEFAULT 'harvested',
  qr_code TEXT UNIQUE,
  blockchain_tx_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  delivery_address TEXT NOT NULL,
  status order_status DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blockchain transactions table
CREATE TABLE public.blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery checkpoints table
CREATE TABLE public.delivery_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_agent_id UUID NOT NULL REFERENCES auth.users(id),
  checkpoint_type checkpoint_type NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  qr_scanned BOOLEAN DEFAULT false,
  notes TEXT,
  blockchain_tx_id TEXT REFERENCES public.blockchain_transactions(transaction_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  farmer_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  blockchain_tx_id TEXT REFERENCES public.blockchain_transactions(transaction_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies

-- user_roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- farms policies
CREATE POLICY "Anyone can view farms"
  ON public.farms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Farmers can manage own farms"
  ON public.farms FOR ALL
  USING (auth.uid() = farmer_id OR public.has_role(auth.uid(), 'admin'));

-- products policies
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Farmers can manage own products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.farms
      WHERE farms.id = products.farm_id
      AND farms.farmer_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- orders policies
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.farms f ON p.farm_id = f.id
      WHERE p.id = orders.product_id AND f.farmer_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'delivery_agent')
  );

CREATE POLICY "Customers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers and farmers can update orders"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = customer_id
    OR EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.farms f ON p.farm_id = f.id
      WHERE p.id = orders.product_id AND f.farmer_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'delivery_agent')
  );

-- blockchain_transactions policies
CREATE POLICY "Anyone can view blockchain transactions"
  ON public.blockchain_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create blockchain transactions"
  ON public.blockchain_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- delivery_checkpoints policies
CREATE POLICY "Related users can view checkpoints"
  ON public.delivery_checkpoints FOR SELECT
  USING (
    auth.uid() = delivery_agent_id
    OR EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = delivery_checkpoints.order_id
      AND orders.customer_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Delivery agents can create checkpoints"
  ON public.delivery_checkpoints FOR INSERT
  WITH CHECK (
    auth.uid() = delivery_agent_id
    AND public.has_role(auth.uid(), 'delivery_agent')
  );

-- reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews for their orders"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = reviews.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_farms_updated_at
  BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();