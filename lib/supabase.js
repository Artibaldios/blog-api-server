import { createClient } from "@supabase/supabase-js";

let client;

export const assertSupabaseConfig = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SECRET_KEY environment variables are required"
    );
  }
};

export const getSupabase = () => {
  if (!client) {
    assertSupabaseConfig();
    client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );
  }

  return client;
};