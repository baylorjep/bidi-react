import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://splafvfbznewlbeqaocv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwbGFmdmZiem5ld2xiZXFhb2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI5MDMzMzYsImV4cCI6MjAzODQ3OTMzNn0.dXaaFmPzf3Hy2Nw5tvfB4-UefnyiegdsnQuxygH5ixU';
export const supabase = createClient(supabaseUrl, supabaseKey);