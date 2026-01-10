
import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in your .env file
// VITE_SUPABASE_URL=your-project-url
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail-safe: Return null if keys are missing so the app doesn't crash
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
