export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      blockchain_transactions: {
        Row: {
          action_type: string
          actor_id: string
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          metadata: Json | null
          order_id: string | null
          product_id: string | null
          timestamp: string
          transaction_id: string
        }
        Insert: {
          action_type: string
          actor_id: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          metadata?: Json | null
          order_id?: string | null
          product_id?: string | null
          timestamp?: string
          transaction_id: string
        }
        Update: {
          action_type?: string
          actor_id?: string
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          metadata?: Json | null
          order_id?: string | null
          product_id?: string | null
          timestamp?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blockchain_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_checkpoints: {
        Row: {
          blockchain_tx_id: string | null
          checkpoint_type: Database["public"]["Enums"]["checkpoint_type"]
          created_at: string
          delivery_agent_id: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          notes: string | null
          order_id: string
          qr_scanned: boolean | null
        }
        Insert: {
          blockchain_tx_id?: string | null
          checkpoint_type: Database["public"]["Enums"]["checkpoint_type"]
          created_at?: string
          delivery_agent_id: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          notes?: string | null
          order_id: string
          qr_scanned?: boolean | null
        }
        Update: {
          blockchain_tx_id?: string | null
          checkpoint_type?: Database["public"]["Enums"]["checkpoint_type"]
          created_at?: string
          delivery_agent_id?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          notes?: string | null
          order_id?: string
          qr_scanned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_checkpoints_blockchain_tx_id_fkey"
            columns: ["blockchain_tx_id"]
            isOneToOne: false
            referencedRelation: "blockchain_transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "delivery_checkpoints_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          certification_number: string | null
          created_at: string
          farm_name: string
          farmer_id: string
          id: string
          location: string
          organic_certified: boolean | null
          updated_at: string
        }
        Insert: {
          certification_number?: string | null
          created_at?: string
          farm_name: string
          farmer_id: string
          id?: string
          location: string
          organic_certified?: boolean | null
          updated_at?: string
        }
        Update: {
          certification_number?: string | null
          created_at?: string
          farm_name?: string
          farmer_id?: string
          id?: string
          location?: string
          organic_certified?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          delivery_address: string
          id: string
          product_id: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          delivery_address: string
          id?: string
          product_id: string
          quantity: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          delivery_address?: string
          id?: string
          product_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          blockchain_tx_id: string | null
          created_at: string
          description: string | null
          farm_id: string
          harvest_date: string
          id: string
          pesticide_details: string | null
          pesticide_used: boolean | null
          price_per_unit: number
          product_name: string
          qr_code: string | null
          quantity: number
          status: Database["public"]["Enums"]["product_status"] | null
          unit: string
          updated_at: string
        }
        Insert: {
          blockchain_tx_id?: string | null
          created_at?: string
          description?: string | null
          farm_id: string
          harvest_date: string
          id?: string
          pesticide_details?: string | null
          pesticide_used?: boolean | null
          price_per_unit: number
          product_name: string
          qr_code?: string | null
          quantity: number
          status?: Database["public"]["Enums"]["product_status"] | null
          unit?: string
          updated_at?: string
        }
        Update: {
          blockchain_tx_id?: string | null
          created_at?: string
          description?: string | null
          farm_id?: string
          harvest_date?: string
          id?: string
          pesticide_details?: string | null
          pesticide_used?: boolean | null
          price_per_unit?: number
          product_name?: string
          qr_code?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["product_status"] | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          blockchain_tx_id: string | null
          comment: string | null
          created_at: string
          customer_id: string
          farmer_id: string
          id: string
          order_id: string
          rating: number
        }
        Insert: {
          blockchain_tx_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id: string
          farmer_id: string
          id?: string
          order_id: string
          rating: number
        }
        Update: {
          blockchain_tx_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string
          farmer_id?: string
          id?: string
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_blockchain_tx_id_fkey"
            columns: ["blockchain_tx_id"]
            isOneToOne: false
            referencedRelation: "blockchain_transactions"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "farmer" | "customer" | "delivery_agent"
      checkpoint_type:
        | "harvest"
        | "farm_pickup"
        | "warehouse"
        | "in_transit"
        | "customer_delivery"
      order_status:
        | "pending"
        | "confirmed"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "verified"
      product_status: "harvested" | "in_transit" | "delivered" | "verified"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "farmer", "customer", "delivery_agent"],
      checkpoint_type: [
        "harvest",
        "farm_pickup",
        "warehouse",
        "in_transit",
        "customer_delivery",
      ],
      order_status: [
        "pending",
        "confirmed",
        "picked_up",
        "in_transit",
        "delivered",
        "verified",
      ],
      product_status: ["harvested", "in_transit", "delivered", "verified"],
    },
  },
} as const
