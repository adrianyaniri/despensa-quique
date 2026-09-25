import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

export const sbClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
