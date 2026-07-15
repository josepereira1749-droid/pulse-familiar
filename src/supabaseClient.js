import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://itzuoztxxcfldeitzvbs.supabase.co";

const supabaseAnonKey = "sb_publishable_KCB1DDaFMYgvuHSLOYsOSQ_8XQj5mci";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
