export const CONFIG = {
  WHATSAPP_NUMBER: import.meta.env?.VITE_WHATSAPP_NUMBER || "5491166168970",
  NEGOCIO: import.meta.env?.VITE_NEGOCIO || "Despensa Quique",
  INSTAGRAM_URL: import.meta.env?.VITE_INSTAGRAM_URL || "https://instagram.com/despensaquique",
  INSTAGRAM_HANDLE: import.meta.env?.VITE_INSTAGRAM_HANDLE || "@despensaquique",
  CATALOGO_URL: import.meta.env?.VITE_CATALOGO_URL || "https://despensa-quique.vercel.app/precios",
  SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || "https://sdmyxjmdyewpotflprwu.supabase.co",
  SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbXl4am1keWV3cG90Zmxwcnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODA0ODUsImV4cCI6MjEwNTg1NjQ4NX0.gHnXfhFjkpRB9O6zme90lm47jOX5YiLQMd6StY5iP_E",
  MENSAJE_CONSULTA: "¡Hola! ¿Cómo están? Quería hacerles una consulta sobre los productos de {negocio}. ¡Muchas gracias!",
  MENSAJE_PEDIDO: {
    saludo: "¡Hola {negocio}! ¿Cómo están? Les comparto mi pedido:",
    pie: "¡Muchas gracias y que tengan un excelente día!"
  }
};

if (typeof window !== 'undefined') {
  window.QUIQUE_CONFIG = CONFIG;
}
