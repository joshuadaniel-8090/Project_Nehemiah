import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("dgfnjwizsduxlxeaylps")
) {
  console.warn(
    "Supabase environment variables not configured. Please update .env.local with your actual Supabase credentials."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Registration = {
  id: string;
  name: string;
  phone: string;
  email: string;
  raffle_numbers?: string;
  ticket_count: number;
  payment_screenshot_url?: string;
  status: "pending" | "verified" | "rejected";
  created_at: string;
  updated_at: string;
};
