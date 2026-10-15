// The URL and anon key are safe to expose publicly — access control is
// enforced by Row Level Security policies in the database. Env vars, when
// present, take precedence so the project can be pointed at another instance.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://sgrouzjfpdwoxknkoqaq.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNncm91empmcGR3b3hrbmtvcWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDEyNDIsImV4cCI6MjA5NTQ3NzI0Mn0.rMwC5r144d1jFy33xVMlrCY_Jw7fuW3k4_Gb1qEEmGI";
