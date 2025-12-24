/**
 * Integración con Stripe Checkout - TitanFleet ERP
 *
 * Esta integración usa Stripe Checkout para procesar pagos de forma segura
 * No maneja datos de tarjeta directamente (PCI compliant)
 */

class StripeIntegration {
  constructor() {
    this.stripe = null;
    this.isInitialized = false;
  }

  /**
   * Inicializar Stripe
   */
  async initialize() {
    if (this.isInitialized && this.stripe) {
      return true;
    }

    // Verificar configuración
    if (!window.STRIPE_CONFIG || !window.STRIPE_CONFIG.publishableKey) {
      console.error('❌ Stripe no está configurado. Por favor, configura stripe-config.js');
      return false;
    }

    // Cargar Stripe.js si no está cargado
    if (!window.Stripe) {
      await this.loadStripeScript();
    }

    // Inicializar Stripe
    try {
      this.stripe = window.Stripe(window.STRIPE_CONFIG.publishableKey);
      this.isInitialized = true;
      console.log('✅ Stripe inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Stripe:', error);
      return false;
    }
  }

  /**
   * Cargar el script de Stripe.js
   */
  loadStripeScript() {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        console.log('✅ Stripe.js cargado');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Error cargando Stripe.js');
        reject(new Error('No se pudo cargar Stripe.js'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Crear sesión de checkout en el backend
   */
  async createCheckoutSession(paymentData) {
    try {
      const { backendUrl } = window.STRIPE_CONFIG;
      const requestBody = {
        plan: paymentData.plan,
        periodo: paymentData.periodo,
        precio: paymentData.precio,
        cliente: paymentData.cliente,
        solicitudId: paymentData.solicitudId,
        currency: window.STRIPE_CONFIG.currency || 'mxn',
        successUrl: `${window.location.origin}/pages/pago-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pages/pago.html?canceled=true`
      };

      // Incluir información de actualización si existe
      if (paymentData.isPlanUpdate) {
        requestBody.isPlanUpdate = true;
        if (paymentData.tenantId) {
          requestBody.tenantId = paymentData.tenantId;
        }
        if (paymentData.planLevel) {
          requestBody.planLevel = paymentData.planLevel;
        }
        if (paymentData.paymentPeriod) {
          requestBody.paymentPeriod = paymentData.paymentPeriod;
        }
        console.log('🔄 Enviando información de actualización al backend:', {
          isPlanUpdate: true,
          tenantId: paymentData.tenantId,
          planLevel: paymentData.planLevel,
          paymentPeriod: paymentData.paymentPeriod
        });
      }

      const response = await fetch(`${backendUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const session = await response.json();
      if (!session || !session.id) {
        throw new Error('El servidor no retornó una sesión válida');
      }

      // Incluir información del descuento si está disponible
      return {
        success: true,
        sessionId: session.id,
        isFirstPurchase: session.isFirstPurchase || false,
        discountApplied: session.discountApplied || 0,
        originalPrice: session.originalPrice,
        finalPrice: session.finalPrice
      };
    } catch (error) {
      // En producción, no usar simulación - mostrar error claro
      console.error('❌ Error creando sesión de checkout:', error);

      let errorMessage = error.message || 'No se pudo conectar con el servidor de pagos';
      let errorCode = 'CONNECTION_ERROR';

      if (
        error.message.includes('ERR_CONNECTION_REFUSED') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      ) {
        errorCode = 'BACKEND_NOT_AVAILABLE';
        errorMessage =
          'No se pudo conectar con el servidor de pagos. Por favor, verifica que el backend esté corriendo y la URL sea correcta.';
      }

      return {
        success: false,
        error: errorCode,
        message: errorMessage
      };
    }
  }

  /**
   * Redirigir a Stripe Checkout
   */
  async redirectToCheckout(sessionId) {
    try {
      if (!this.stripe) {
        const initialized = await this.initialize();
        if (!initialized) {
          return { success: false, error: 'Stripe no está inicializado' };
        }
      }

      const result = await this.stripe.redirectToCheckout({
        sessionId: sessionId
      });

      if (result.error) {
        console.error('❌ Error en Stripe Checkout:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error redirigiendo a Stripe:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar el estado de una sesión de pago
   */
  async verifyPaymentSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID es requerido para verificar el pago');
      }

      const { backendUrl } = window.STRIPE_CONFIG;
      if (!backendUrl) {
        throw new Error('Backend URL no está configurada');
      }

      const response = await fetch(`${backendUrl}/api/verify-payment?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data) {
        throw new Error('El servidor no retornó datos válidos');
      }

      return { success: true, payment: data };
    } catch (error) {
      console.error('❌ Error verificando pago:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al verificar el pago'
      };
    }
  }

  /**
   * Procesar pago completo (crear sesión + redirigir)
   */
  async processPayment(paymentData) {
    try {
      // 1. Inicializar Stripe
      const initialized = await this.initialize();
      if (!initialized) {
        return {
          success: false,
          error:
            'Stripe no está configurado correctamente. Por favor, configura tus claves en stripe-config.js'
        };
      }

      // 2. Crear sesión de checkout
      const sessionResult = await this.createCheckoutSession(paymentData);
      if (!sessionResult.success) {
        return sessionResult;
      }

      // 3. Redirigir a Stripe Checkout
      const redirectResult = await this.redirectToCheckout(sessionResult.sessionId);
      return redirectResult;
    } catch (error) {
      console.error('❌ Error procesando pago:', error);
      return { success: false, error: error.message };
    }
  }
}

// Inicializar integración global
window.stripeIntegration = new StripeIntegration();

console.log('✅ StripeIntegration cargado');
console.log('💡 Para usar Stripe, asegúrate de:');
console.log('   1. Configurar tu Publishable Key en stripe-config.js');
console.log('   2. Tener tu backend corriendo en la URL configurada');
console.log('   3. Configurar tu Secret Key en el backend (.env)');
