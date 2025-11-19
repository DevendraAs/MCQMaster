import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// CONFIGURATION: Update these values with your Supabase Project Keys
// ------------------------------------------------------------------
// You can find these in your Supabase Dashboard -> Project Settings -> API
// If using a .env file, you can use VITE_, NEXT_PUBLIC_, or REACT_APP_ prefixes.

export const SUPABASE_URL = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.REACT_APP_SUPABASE_URL || 
  'https://yvpllnogvepjtowwoeli.supabase.co';

export const SUPABASE_ANON_KEY = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.REACT_APP_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cGxsbm9ndmVwanRvd3dvZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjA5NjcsImV4cCI6MjA3OTEzNjk2N30.FKZ56uivJ5Hu0Hm4RyWq6KUQxTCNK09FYcSnWFcum5c';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
  console.warn('⚠️ Supabase URL is missing. Please update lib/supabase.ts with your actual URL and Key.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);