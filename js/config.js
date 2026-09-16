// ============================================================
// SAD - Equipment Borrowing and Return Monitoring System
// Supabase configuration
//
// INSTRUCTIONS:
//  1. Go to Supabase Dashboard > Project > Settings > API
//  2. Copy the "Project URL" and the "publishable / anon public" key
//  3. Paste them below (between the quotes)
// ============================================================

const SUPABASE_URL = "https://xbngjebfemyjminokllk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tWEry3NJKmK_2spHZWQ73g_ZncKnqno";

// Do not modify below this line
const SUPABASE = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);