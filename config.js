// Configuración general de Despensa Quique
window.QUIQUE_CONFIG = {
  // Número de WhatsApp (código de país + área + número sin espacios ni guiones).
  WHATSAPP_NUMBER: "5491166168970",
  NEGOCIO: "Despensa Quique",

  // Enlace a tu perfil de Instagram
  INSTAGRAM_URL: "https://instagram.com/despensaquique",

  // Conexión a Base de Datos Supabase
  SUPABASE_URL: "https://sdmyxjmdyewpotflprwu.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbXl4am1keWV3cG90Zmxwcnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyODA0ODUsImV4cCI6MjEwNTg1NjQ4NX0.gHnXfhFjkpRB9O6zme90lm47jOX5YiLQMd6StY5iP_E",

  // Mensaje al hacer clic en el botón de WhatsApp del header
  MENSAJE_CONSULTA: "¡Hola! ¿Cómo están? Quería hacerles una consulta sobre los productos de {negocio}. ¡Muchas gracias!",

  // Plantilla para los pedidos que se arman desde el carrito
  MENSAJE_PEDIDO: {
    saludo: "¡Hola {negocio}! ¿Cómo están? Les comparto mi pedido:",
    pie: "¡Muchas gracias y que tengan un excelente día!"
  }
};
