import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

export const sbClient = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
  : {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: "Configurá las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY." } }),
        signOut: async () => {}
      },
      from: () => ({
        select: () => ({
          order: async () => ({ data: null, error: { message: "Faltan variables de entorno de Supabase." } })
        })
      })
    };
