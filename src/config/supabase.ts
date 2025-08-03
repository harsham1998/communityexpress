import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gdmfonqvadznfijudeuc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkbWZvbnF2YWR6bmZpanVkZXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDAwMjUsImV4cCI6MjA2OTc3NjAyNX0.V7wHfnDY_OPblGKfHLb9T01eoK3bIsLPIBG0Qqw-KFI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);