import { createClient } from '@supabase/supabase-js';

// In a production environment, these should be loaded from secure environment variables.
// The values below are provided as a fallback for convenience in this development context.
const supabaseUrl = process.env.SUPABASE_URL || 'https://cwcffnmtyngkgdkfqhkg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3Y2Zmbm10eW5na2dka2ZxaGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzkyMDYsImV4cCI6MjA3NDkxNTIwNn0.jlof9meY3iKFlZgGa_0oDpu3DPII_X15YJOiS_7ZuUs';

if (!supabaseUrl || !supabaseAnonKey) {
    // This message will now only appear if both environment variables and the fallback values are missing.
    console.error("Supabase environment variables are not set. Features requiring Supabase will be disabled.");
}

// Initialize the client. The fallback values ensure this works even without environment variables.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);