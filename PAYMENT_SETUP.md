# Configuración de Pagos - TitanFleet ERP

## Integración con Stripe

### Paso 1: Crear cuenta en Stripe
1. Ve a https://stripe.com
2. Crea una cuenta
3. Obtén tus claves API (Publishable Key y Secret Key)
4. **IMPORTANTE**: Cuando Stripe te pregunte cómo quieres aceptar pagos, selecciona **"Formulario de proceso"** o **"Stripe Checkout"** (redirección). Esta es la opción recomendada para suscripciones recurrentes.

### Paso 2: Configurar en el código
```javascript
// En la consola o en tu código de inicialización:
window.paymentIntegration.setupStripe('pk_test_...'); // Clave pública
```

### Paso 3: Crear endpoint en tu servidor
Necesitas crear un endpoint que cree la sesión de checkout. **IMPORTANTE**: Para suscripciones recurrentes (planes mensuales/anuales), usa `mode: 'subscription'`:

```javascript
// Ejemplo en Node.js/Express
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  const { planLevel, paymentPeriod, tenantId, currency = 'mxn' } = req.body;
  
  try {
    // Precios según el plan y período
    const prices = {
      basico: { mensual: 1999, anual: 21989 },
      estandar: { mensual: 4999, anual: 54989 },
      premium: { mensual: 8999, anual: 98989 },
      enterprise: { mensual: 14999, anual: 164989 }
    };
    
    const amount = prices[planLevel]?.[paymentPeriod] || 0;
    const planNames = {
      basico: 'Básico',
      estandar: 'Estándar',
      premium: 'Premium',
      enterprise: 'Enterprise'
    };
    
    // Para suscripciones recurrentes, usa mode: 'subscription'
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Plan ${planNames[planLevel]} - TitanFleet ERP`,
            description: `Plan ${planNames[planLevel]} (${paymentPeriod === 'mensual' ? 'Mensual' : 'Anual'})`,
          },
          unit_amount: amount * 100, // Stripe usa centavos
          recurring: paymentPeriod === 'mensual' 
            ? { interval: 'month' } 
            : { interval: 'year' },
        },
        quantity: 1,
      }],
      mode: paymentPeriod === 'mensual' || paymentPeriod === 'anual' ? 'subscription' : 'payment',
      success_url: `${req.headers.origin}/pages/configuracion.html?session_id={CHECKOUT_SESSION_ID}&success=true&tenantId=${tenantId}`,
      cancel_url: `${req.headers.origin}/pages/configuracion.html?canceled=true`,
      metadata: {
        tenantId: tenantId,
        planLevel: planLevel,
        paymentPeriod: paymentPeriod
      },
      // Para suscripciones, permite que el cliente cancele desde el portal
      subscription_data: {
        metadata: {
          tenantId: tenantId,
          planLevel: planLevel
        }
      }
    });
    
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook para manejar eventos de Stripe (suscripciones, pagos, etc.)
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar diferentes eventos
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Aquí actualizas el plan del usuario en tu base de datos
      // usando session.metadata.tenantId y session.metadata.planLevel
      console.log('Pago completado:', session);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Manejar cambios en suscripciones
      console.log('Suscripción actualizada:', subscription);
      break;
  }

  res.json({received: true});
});
```

## Integración con PayPal

### Paso 1: Crear cuenta en PayPal
1. Ve a https://developer.paypal.com
2. Crea una aplicación
3. Obtén tu Client ID y Secret

### Paso 2: Configurar
```javascript
window.paymentIntegration.paypalClientId = 'tu_client_id';
```

## Flujo de Venta con Pagos

1. **Cliente selecciona tipo de licencia** → Ve precios
2. **Cliente hace clic en "Comprar"** → Se abre modal de pago
3. **Cliente paga** → Stripe/PayPal procesa el pago
4. **Pago exitoso** → Sistema genera licencia automáticamente
5. **Licencia enviada por email** → Cliente recibe su clave
6. **Cliente activa licencia** → Sistema configurado

## Precios Premium Actualizados (2024)

### Plan Básico
- **Precio Mensual**: $1,999 MXN/mes
- **Precio Anual**: $21,989 MXN (1 mes gratis = $1,999 de ahorro)
- **Registros**: Hasta 100 registros/mes
- **Almacenamiento**: 10 GB
- **Incluye**: Todos los módulos, sin límites de usuarios, soporte por email

### Plan Estándar ⭐ Recomendado
- **Precio Mensual**: $4,999 MXN/mes
- **Precio Anual**: $54,989 MXN (1 mes gratis = $4,999 de ahorro)
- **Registros**: Hasta 500 registros/mes
- **Almacenamiento**: 25 GB
- **Incluye**: Todos los módulos, sin límites de usuarios, soporte prioritario (email + chat)

### Plan Premium
- **Precio Mensual**: $8,999 MXN/mes
- **Precio Anual**: $98,989 MXN (1 mes gratis = $8,999 de ahorro)
- **Registros**: Hasta 2,000 registros/mes
- **Almacenamiento**: 100 GB
- **Incluye**: Todos los módulos, sin límites de usuarios, soporte 24/7, SLA garantizado

### Plan Enterprise
- **Precio Mensual**: $14,999 MXN/mes
- **Precio Anual**: $164,989 MXN (1 mes gratis = $14,999 de ahorro)
- **Registros**: Ilimitados
- **Almacenamiento**: Ilimitado
- **Incluye**: Todos los módulos, sin límites de usuarios, soporte dedicado, consultoría personalizada

**Nota**: Todos los planes incluyen los 11 módulos completos del ERP sin límites de usuarios.

## Seguridad

- ✅ Todos los pagos se procesan a través de Stripe/PayPal (PCI compliant)
- ✅ Las licencias se generan solo después de pago confirmado
- ✅ Cada licencia tiene un tenantId único
- ✅ Los datos del cliente están separados

## Próximos Pasos

1. Configurar Stripe o PayPal
2. Crear endpoints en tu servidor
3. Configurar emails automáticos
4. Probar el flujo completo
5. Lanzar al mercado







