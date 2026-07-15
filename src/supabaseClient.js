import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://itzuoztxxcfldeitzvbs.supabase.co";

const supabaseAnonKey = "TU_PUBLISHABLE_KEY_AQUI";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
