/**
 * Configuración de Stripe
 *
 * IMPORTANTE: Reemplaza estas claves con tus claves reales de Stripe
 *
 * Para obtener tus claves:
 * 1. Ve a https://stripe.com y crea una cuenta
 * 2. Ve al Dashboard > Developers > API keys
 * 3. Copia tu Publishable key (pk_test_... o pk_live_...)
 * 4. Para producción, usa pk_live_... (claves de producción)
 * 5. Para desarrollo, usa pk_test_... (claves de prueba)
 */

window.STRIPE_CONFIG = {
  // ============================================
  // CONFIGURACIÓN DE STRIPE
  // ============================================

  // Clave pública de Stripe (Publishable Key)
  // Obtén tu clave en: https://dashboard.stripe.com/apikeys
  // Para desarrollo: usa pk_test_...
  // Para producción: usa pk_live_...
  publishableKey:
    'pk_test_51SejR9JaRzbzvXVdSOJCppC51WxwB6szvoxSrUqs0fJ6H02Ky3aec0XKL4Nz28MKT9SyevEc8SYcz1bYxT5gDcvM00EMlb7RYY', // ⚠️ REEMPLAZA CON TU CLAVE REAL

  // URL de tu backend para crear sesiones de checkout
  // En desarrollo local: 'http://localhost:3000'
  // En producción: 'https://tu-dominio.com'
  backendUrl: 'http://localhost:3000', // ⚠️ CAMBIAR EN PRODUCCIÓN

  // Moneda por defecto
  currency: 'mxn', // 'mxn' para pesos mexicanos, 'usd' para dólares

  // Modo: 'test' para pruebas, 'live' para producción
  mode: 'test' // ⚠️ CAMBIAR A 'live' EN PRODUCCIÓN
};

// Función para verificar si Stripe está configurado
window.isStripeConfigured = function () {
  if (!window.STRIPE_CONFIG) {
    return false;
  }

  const hasValidKey =
    window.STRIPE_CONFIG.publishableKey &&
    window.STRIPE_CONFIG.publishableKey !== 'pk_test_51Q...' &&
    window.STRIPE_CONFIG.publishableKey.length > 20; // Validar que tenga longitud razonable

  const hasBackendUrl =
    window.STRIPE_CONFIG.backendUrl && window.STRIPE_CONFIG.backendUrl.length > 0;

  return hasValidKey && hasBackendUrl;
};

// Logs de configuración
console.log('📝 Stripe Config cargado');
console.log(
  '🔑 Publishable Key:',
  window.STRIPE_CONFIG?.publishableKey
    ? `${window.STRIPE_CONFIG.publishableKey.substring(0, 20)}...`
    : 'No configurada'
);
console.log('🌐 Backend URL:', window.STRIPE_CONFIG?.backendUrl || 'No configurada');
console.log('💰 Moneda:', window.STRIPE_CONFIG?.currency || 'mxn');
console.log('🔧 Modo:', window.STRIPE_CONFIG?.mode || 'test');

if (window.isStripeConfigured()) {
  console.log('✅ Stripe está configurado correctamente');
} else {
  console.warn('⚠️ Stripe no está configurado completamente.');
  console.warn('   Por favor, edita assets/scripts/stripe-config.js y agrega:');
  console.warn('   1. Tu Publishable Key de Stripe');
  console.warn('   2. La URL de tu backend (si tienes uno)');
}

