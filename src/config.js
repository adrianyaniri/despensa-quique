// Configuración cargada 100% desde variables de entorno (.env)
export const CONFIG = {
  WHATSAPP_NUMBER: import.meta.env?.VITE_WHATSAPP_NUMBER || "",
  NEGOCIO: import.meta.env?.VITE_NEGOCIO || "Almacén Quique",
  INSTAGRAM_URL: import.meta.env?.VITE_INSTAGRAM_URL || "https://instagram.com/almacen.quique",
  INSTAGRAM_HANDLE: import.meta.env?.VITE_INSTAGRAM_HANDLE || "@almacen.quique",
  CATALOGO_URL: import.meta.env?.VITE_CATALOGO_URL || "",
  SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || "",

  MENSAJE_CONSULTA: "¡Hola! ¿Cómo están? Quería hacerles una consulta sobre los productos de {negocio}. ¡Muchas gracias!",
  MENSAJE_PEDIDO: {
    saludo: "¡Hola {negocio}! ¿Cómo están? Les comparto mi pedido:",
    pie: "¡Muchas gracias y que tengan un excelente día!"
  }
};

if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
  console.error("Configuración incompleta: Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en tu entorno.");
}

if (typeof window !== 'undefined') {
  window.QUIQUE_CONFIG = CONFIG;
}
