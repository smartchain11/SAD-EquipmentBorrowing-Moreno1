// ============================================================
// SAD - Equipment Borrowing and Return Monitoring System
// Supabase configuration
//
// INSTRUCTIONS:
//  1. Go to Supabase Dashboard > Project > Settings > API
//  2. Copy the "Project URL" and the "publishable / anon public" key
//  3. Paste them below (between the quotes)
// ============================================================

const SUPABASE_URL = "https://goghypbfnxochcuftjne.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wizUH1y0NTnU3do1UBbPlg_9je7Nzxy";

// Do not modify below this line
const SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);