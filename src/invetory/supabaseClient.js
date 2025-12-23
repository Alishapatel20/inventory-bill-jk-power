import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://nxyfigbmgisszqrlndvx.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_V2xVtiVrfr4HahyWSwF7CA_A4pwyClq";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
