import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eilpafndxtzsmxozrpnm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbHBhZm5keHR6c214b3pycG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTcwMzUsImV4cCI6MjA4MDg3MzAzNX0.yFiNZ1W9YmrJbMx-2_YPdgfgZ2qYWUMk4xjPLDlN9hk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
