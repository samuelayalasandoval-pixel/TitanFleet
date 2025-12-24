// Integración con Sistemas de Pago - TitanFleet ERP
// Soporta Stripe, PayPal y otros métodos de pago

class PaymentIntegration {
  constructor() {
    this.stripePublicKey = null; // Configurar con tu clave pública de Stripe
    this.paypalClientId = null; // Configurar con tu Client ID de PayPal
  }

  // Configurar Stripe
  setupStripe(publicKey) {
    this.stripePublicKey = publicKey;
    // Cargar Stripe.js si no está cargado
    if (!window.Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        this.stripe = window.Stripe(publicKey);
        console.log('✅ Stripe inicializado');
      };
      document.head.appendChild(script);
    } else {
      this.stripe = window.Stripe(publicKey);
    }
  }

  // Crear sesión de pago para Stripe
  async createStripeCheckout(licenseType, amount, currency = 'usd') {
    try {
      // Aquí deberías llamar a tu servidor para crear la sesión
      // Por ahora, ejemplo de cómo sería:
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseType: licenseType,
          amount: amount,
          currency: currency
        })
      });

      const session = await response.json();

      // Redirigir a Stripe Checkout
      if (this.stripe && session.id) {
        const result = await this.stripe.redirectToCheckout({
          sessionId: session.id
        });

        if (result.error) {
          console.error('Error en Stripe:', result.error);
          return { success: false, error: result.error.message };
        }
      }

      return { success: true, session: session };
    } catch (error) {
      console.error('Error creando sesión de pago:', error);
      return { success: false, error: error.message };
    }
  }

  // Procesar pago con PayPal
  async processPayPalPayment(licenseType, amount) {
    try {
      // Integración con PayPal
      // Esto requiere configuración en el servidor
      const response = await fetch('/api/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseType: licenseType,
          amount: amount
        })
      });

      const order = await response.json();
      return { success: true, order: order };
    } catch (error) {
      console.error('Error procesando pago PayPal:', error);
      return { success: false, error: error.message };
    }
  }

  // Generar licencia después de pago exitoso
  async generateLicenseAfterPayment(paymentId, licenseType, customerInfo) {
    try {
      // Generar licencia
      const generator = new LicenseGenerator();
      const licenseKey =
        licenseType === 'venta'
          ? generator.generateSaleLicense()
          : generator.generateRentalLicense();

      // Guardar en el administrador
      if (window.licenseAdmin) {
        window.licenseAdmin.addLicenses([licenseKey], licenseType);
        window.licenseAdmin.markAsActivated(licenseKey, customerInfo);
      }

      // Enviar licencia al cliente por email (requiere servidor)
      await fetch('/api/send-license-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerInfo.email,
          licenseKey: licenseKey,
          licenseType: licenseType
        })
      });

      return { success: true, licenseKey: licenseKey };
    } catch (error) {
      console.error('Error generando licencia:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar estado de pago
  async verifyPayment(paymentId, provider = 'stripe') {
    try {
      const response = await fetch(
        `/api/verify-payment?paymentId=${paymentId}&provider=${provider}`
      );
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error verificando pago:', error);
      return { success: false, error: error.message };
    }
  }
}

// Inicializar integración de pagos
window.paymentIntegration = new PaymentIntegration();

// Función para iniciar proceso de compra
window.initiatePurchase = async function (licenseType, amount) {
  // Mostrar modal de selección de método de pago
  const paymentMethod = prompt(
    'Selecciona método de pago:\n1. Stripe (Tarjeta)\n2. PayPal\n3. Transferencia Bancaria'
  );

  if (paymentMethod === '1' || paymentMethod.toLowerCase() === 'stripe') {
    // Procesar con Stripe
    const result = await window.paymentIntegration.createStripeCheckout(licenseType, amount);
    if (result.success) {
      alert('Redirigiendo a Stripe...');
    } else {
      alert(`Error: ${result.error}`);
    }
  } else if (paymentMethod === '2' || paymentMethod.toLowerCase() === 'paypal') {
    // Procesar con PayPal
    const result = await window.paymentIntegration.processPayPalPayment(licenseType, amount);
    if (result.success) {
      alert('Redirigiendo a PayPal...');
    } else {
      alert(`Error: ${result.error}`);
    }
  } else {
    // Transferencia bancaria - generar licencia manualmente
    alert(
      'Para transferencia bancaria, contacta al vendedor para obtener tu licencia después del pago.'
    );
  }
};

console.log('✅ PaymentIntegration inicializado');
console.log(
  '💡 Para usar Stripe, configura: window.paymentIntegration.setupStripe("tu_clave_publica")'
);
