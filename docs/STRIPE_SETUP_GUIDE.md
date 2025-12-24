# Guía de Configuración de Stripe - TitanFleet ERP

## ¿Qué opción elegir en Stripe?

Cuando configures tu cuenta de Stripe, te preguntará cómo quieres aceptar pagos. Para el sistema ERP con planes de suscripción, **debes seleccionar:**

### ✅ **"Formulario de proceso" o "Stripe Checkout" (Redirección)**

Esta es la opción recomendada porque:
- ✅ **Seguridad**: Cumple automáticamente con PCI DSS (no necesitas certificarte)
- ✅ **Suscripciones**: Soporta pagos recurrentes (mensuales/anuales) fácilmente
- ✅ **Simplicidad**: No necesitas manejar datos de tarjetas directamente
- ✅ **UX**: Experiencia de pago optimizada y profesional
- ✅ **Implementación**: Ya está implementado en tu código

### ❌ **NO uses estas opciones:**

- **Enlaces de pago**: Son para pagos únicos simples, no para suscripciones
- **Componentes integrados**: Más complejo, requiere más código y manejo de seguridad

## Pasos de Configuración

### 1. Crear cuenta en Stripe
1. Ve a https://stripe.com
2. Crea una cuenta (puedes usar modo de prueba primero)
3. Cuando te pregunte cómo aceptar pagos, selecciona **"Formulario de proceso"** o **"Stripe Checkout"**

### 2. Obtener claves API
1. En el Dashboard de Stripe, ve a **Developers** → **API keys**
2. Copia tu **Publishable key** (empieza con `pk_test_` o `pk_live_`)
3. Copia tu **Secret key** (empieza con `sk_test_` o `sk_live_`)
   - ⚠️ **NUNCA** compartas tu Secret key públicamente
   - Guárdala solo en variables de entorno del servidor

### 3. Configurar en el código del cliente
```javascript
// En tu código JavaScript (cliente)
window.paymentIntegration.setupStripe('pk_test_...'); // Tu Publishable key
```

### 4. Configurar en el servidor
```javascript
// En tu servidor (Node.js/Express ejemplo)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Endpoint para crear sesión de checkout
app.post('/api/create-checkout-session', async (req, res) => {
  // Ver código completo en PAYMENT_SETUP.md
});
```

### 5. Configurar Webhooks (Opcional pero recomendado)
Los webhooks permiten que Stripe notifique a tu servidor cuando ocurren eventos (pagos, suscripciones, etc.)

1. En Stripe Dashboard, ve a **Developers** → **Webhooks**
2. Agrega endpoint: `https://tu-dominio.com/api/stripe-webhook`
3. Selecciona eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copia el **Webhook signing secret** y guárdalo en variables de entorno

## Flujo de Pago

1. **Usuario selecciona plan** → Plan Básico, Estándar, Premium o Enterprise
2. **Usuario selecciona período** → Mensual o Anual
3. **Usuario hace clic en "Pagar con Stripe"** → Se crea sesión de checkout
4. **Usuario es redirigido a Stripe Checkout** → Página segura de Stripe
5. **Usuario ingresa datos de tarjeta** → Stripe procesa el pago
6. **Pago exitoso** → Usuario es redirigido de vuelta con `session_id`
7. **Sistema actualiza plan** → Se actualiza el plan del usuario manteniendo tenantId

## Modo de Prueba vs Producción

### Modo de Prueba (Testing)
- Usa claves que empiezan con `pk_test_` y `sk_test_`
- Puedes usar tarjetas de prueba:
  - **Éxito**: `4242 4242 4242 4242`
  - **Rechazo**: `4000 0000 0000 0002`
  - Cualquier fecha futura y CVC

### Modo de Producción (Live)
- Usa claves que empiezan con `pk_live_` y `sk_live_`
- Solo se activa cuando tu cuenta está verificada
- Procesa pagos reales

## Seguridad

- ✅ **NUNCA** expongas tu Secret key en el código del cliente
- ✅ Usa variables de entorno para claves sensibles
- ✅ Valida webhooks usando el signing secret
- ✅ Usa HTTPS en producción
- ✅ Implementa rate limiting en endpoints de pago

## Soporte

Para más información, consulta:
- [Documentación oficial de Stripe](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
