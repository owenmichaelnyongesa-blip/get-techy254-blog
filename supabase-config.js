const SUPABASE_URL      = "https://pulixlinwpledouracnz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1bGl4bGlud3BsZWRvdXJhY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MDE1MTEsImV4cCI6MjA5NjI3NzUxMX0.s1WMBVsaXV0Jj3RDIBihG0Lbq91tTXmw_OtHcXVsZEM";

const { createClient } = supabase;
const supabaseClient   = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
