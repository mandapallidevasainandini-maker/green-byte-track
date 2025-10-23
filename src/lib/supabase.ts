import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRole = Database['public']['Enums']['app_role'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Farm = Database['public']['Tables']['farms']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type BlockchainTransaction = Database['public']['Tables']['blockchain_transactions']['Row'];
export type DeliveryCheckpoint = Database['public']['Tables']['delivery_checkpoints']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];

export { supabase };

// Helper to generate blockchain transaction ID
export const generateBlockchainTxId = () => {
  return `0x${Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
};

// Helper to generate QR code data
export const generateQRData = (productId: string, txId: string) => {
  return JSON.stringify({
    productId,
    txId,
    timestamp: Date.now(),
  });
};