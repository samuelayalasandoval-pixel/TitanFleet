/**
 * Backend para Stripe - TitanFleet ERP
 * 
 * Este backend procesa pagos con Stripe de forma segura
 * 
 * 📋 INSTALACIÓN:
 * npm install express stripe cors dotenv
 * 
 * 📋 CONFIGURACIÓN:
 * 1. Crea un archivo .env en esta carpeta con:
 *    STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
 *    PORT=3000
 * 
 * 2. Obtén tu Secret Key en: https://dashboard.stripe.com/apikeys
 *    - Haz clic en "Reveal test key" para verla
 *    - Copia la clave que empieza con sk_test_...
 * 
 * 3. Ejecuta: npm start
 * 
 * El servidor estará en: http://localhost:3000
 */

// IMPORTANTE: Cargar dotenv PRIMERO antes de usar process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// IMPORTANTE: El webhook debe estar ANTES de express.json()
// porque Stripe necesita el body RAW (sin parsear) para verificar la firma
/**
 * Webhook para recibir eventos de Stripe (opcional pero recomendado)
 * 
 * Este endpoint DEBE estar antes de express.json() para recibir el body RAW
 */
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Error verificando webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ Pago completado:', session.id);
      console.log('📧 Email del cliente:', session.customer_email);
      console.log('💰 Monto total:', session.amount_total / 100, session.currency.toUpperCase());
      // Aquí puedes generar la licencia automáticamente
      // y enviar el correo al cliente
      break;
    
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Pago exitoso:', paymentIntent.id);
      break;
    
    default:
      console.log(`ℹ️ Evento no manejado: ${event.type}`);
  }

  res.json({ received: true });
});

// Ahora sí, aplicar express.json() para los demás endpoints
app.use(express.json());

/**
 * Función para verificar si es la primera compra del usuario
 * Verifica si el usuario (por email o tenantId) tiene pagos anteriores en Stripe
 */
async function isFirstPurchase(customerEmail, tenantId) {
  try {
    // Si no hay email ni tenantId, asumir que es primera compra
    if (!customerEmail && !tenantId) {
      return true;
    }

    // Buscar pagos anteriores por email del cliente
    if (customerEmail) {
      try {
        // Buscar customers en Stripe con este email
        const customers = await stripe.customers.list({
          email: customerEmail,
          limit: 10
        });

        if (customers.data && customers.data.length > 0) {
          // Si hay customers, verificar si tienen pagos exitosos
          for (const customer of customers.data) {
            const paymentIntents = await stripe.paymentIntents.list({
              customer: customer.id,
              limit: 10
            });

            // Si hay algún pago exitoso, no es primera compra
            const hasSuccessfulPayment = paymentIntents.data.some(
              pi => pi.status === 'succeeded'
            );

            if (hasSuccessfulPayment) {
              console.log(`📋 Usuario ${customerEmail} tiene pagos anteriores - NO es primera compra`);
              return false;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error buscando customers por email:', error.message);
      }

      // También buscar sesiones de checkout completadas con este email
      try {
        const sessions = await stripe.checkout.sessions.list({
          limit: 100
        });

        const hasCompletedSession = sessions.data.some(session => {
          return session.customer_email === customerEmail &&
                 session.payment_status === 'paid';
        });

        if (hasCompletedSession) {
          console.log(`📋 Usuario ${customerEmail} tiene sesiones de checkout completadas - NO es primera compra`);
          return false;
        }
      } catch (error) {
        console.warn('⚠️ Error buscando sesiones por email:', error.message);
      }
    }

    // Si llegamos aquí, es primera compra
    console.log(`✅ Es primera compra para ${customerEmail || tenantId || 'usuario desconocido'}`);
    return true;
  } catch (error) {
    console.error('❌ Error verificando primera compra:', error);
    // En caso de error, asumir que es primera compra para no perder la venta
    return true;
  }
}

/**
 * Endpoint para crear sesión de checkout
 * 
 * IMPORTANTE: Este endpoint requiere que STRIPE_SECRET_KEY esté configurado en .env
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY no está configurada');
      return res.status(500).json({ 
        error: 'Configuración de Stripe incompleta. Por favor, configura STRIPE_SECRET_KEY en el archivo .env' 
      });
    }
    
    // Validar formato básico de la clave
    if (process.env.STRIPE_SECRET_KEY.length < 20 || 
        (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && 
         !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_'))) {
      console.error('❌ STRIPE_SECRET_KEY tiene formato inválido');
      return res.status(500).json({ 
        error: 'La clave de Stripe tiene un formato inválido. Debe comenzar con sk_test_ o sk_live_' 
      });
    }

    const { plan, periodo, precio, cliente, solicitudId, currency = 'mxn', successUrl, cancelUrl } = req.body;

    // Validar datos requeridos
    if (!plan || !precio || !cliente || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: 'Datos incompletos. Se requieren: plan, precio, cliente, successUrl, cancelUrl' 
      });
    }

    // Validar que el precio sea un número válido
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
    }

    // Validar que la moneda sea válida
    const validCurrencies = ['mxn', 'usd', 'eur', 'cad'];
    const currencyLower = currency.toLowerCase();
    if (!validCurrencies.includes(currencyLower)) {
      return res.status(400).json({ 
        error: `Moneda no válida. Monedas soportadas: ${validCurrencies.join(', ')}` 
      });
    }

    // Validar formato de email si se proporciona
    if (cliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
      return res.status(400).json({ error: 'Email del cliente no válido' });
    }

    console.log(`📝 Creando sesión de checkout para plan: ${plan}, precio: ${precio} ${currency}`);
    console.log(`🔑 Usando STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);

    // Verificar si es primera compra para aplicar descuento del 20%
    const customerEmail = cliente.email || undefined;
    const tenantId = req.body.tenantId || '';
    const isFirst = await isFirstPurchase(customerEmail, tenantId);
    
    // Calcular precio con descuento si es primera compra
    let precioFinal = precioNum;
    let descuentoAplicado = 0;
    let descuentoPorcentaje = 0;
    
    if (isFirst) {
      descuentoPorcentaje = 20; // 20% de descuento
      descuentoAplicado = precioNum * (descuentoPorcentaje / 100);
      precioFinal = precioNum - descuentoAplicado;
      console.log(`🎉 Primera compra detectada - Aplicando descuento del ${descuentoPorcentaje}%`);
      console.log(`💰 Precio original: $${precioNum.toFixed(2)} ${currency.toUpperCase()}`);
      console.log(`💰 Descuento: $${descuentoAplicado.toFixed(2)} ${currency.toUpperCase()}`);
      console.log(`💰 Precio final: $${precioFinal.toFixed(2)} ${currency.toUpperCase()}`);
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currencyLower,
          product_data: {
            name: `TitanFleet ERP - ${plan}`,
            description: `Plan: ${plan} - Periodo: ${periodo || 'N/A'}`,
          },
          unit_amount: Math.round(precioFinal * 100), // Stripe usa centavos (precio con descuento si aplica)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: cliente.email || undefined,
      metadata: {
        plan: plan,
        periodo: periodo || '',
        solicitudId: solicitudId || '',
        clienteNombre: cliente.nombre || '',
        clienteTelefono: cliente.telefono || '',
        clienteEmpresa: cliente.empresa || '',
        // Incluir información de actualización si existe
        isPlanUpdate: req.body.isPlanUpdate ? 'true' : 'false',
        tenantId: req.body.tenantId || '',
        planLevel: req.body.planLevel || '',
        paymentPeriod: req.body.paymentPeriod || '',
        // Información del descuento
        isFirstPurchase: isFirst ? 'true' : 'false',
        discountApplied: isFirst ? descuentoPorcentaje.toString() : '0',
        originalPrice: precioNum.toString(),
        finalPrice: precioFinal.toString()
      },
      // Configuración adicional
      payment_intent_data: {
        metadata: {
          plan: plan,
          periodo: periodo || '',
          solicitudId: solicitudId || '',
          isPlanUpdate: req.body.isPlanUpdate ? 'true' : 'false',
          tenantId: req.body.tenantId || '',
          planLevel: req.body.planLevel || '',
          paymentPeriod: req.body.paymentPeriod || '',
          // Información del descuento
          isFirstPurchase: isFirst ? 'true' : 'false',
          discountApplied: isFirst ? descuentoPorcentaje.toString() : '0',
          originalPrice: precioNum.toString(),
          finalPrice: precioFinal.toString()
        }
      }
    });

    if (!session || !session.id) {
      throw new Error('Stripe no retornó una sesión válida');
    }

    console.log(`✅ Sesión de checkout creada: ${session.id}`);
    res.json({ 
      id: session.id,
      isFirstPurchase: isFirst,
      discountApplied: isFirst ? descuentoPorcentaje : 0,
      originalPrice: precioNum,
      finalPrice: precioFinal
    });
  } catch (error) {
    console.error('❌ Error creando sesión de checkout:', error);
    
    // Manejar errores específicos de Stripe
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: `Error en la solicitud a Stripe: ${error.message}` 
      });
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Error de autenticación con Stripe. Verifica tu STRIPE_SECRET_KEY' 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor al crear la sesión de checkout' 
    });
  }
});

/**
 * Endpoint para verificar el pago
 * 
 * Este endpoint verifica el estado de una sesión de checkout de Stripe
 */
app.get('/api/verify-payment', async (req, res) => {
  try {
    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY no está configurada');
      return res.status(500).json({ 
        error: 'Configuración de Stripe incompleta. Por favor, configura STRIPE_SECRET_KEY en el archivo .env' 
      });
    }
    
    // Validar formato básico de la clave
    if (process.env.STRIPE_SECRET_KEY.length < 20 || 
        (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && 
         !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_'))) {
      console.error('❌ STRIPE_SECRET_KEY tiene formato inválido');
      return res.status(500).json({ 
        error: 'La clave de Stripe tiene un formato inválido. Debe comenzar con sk_test_ o sk_live_' 
      });
    }

    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id es requerido' });
    }

    // Validar formato básico del session_id
    if (typeof session_id !== 'string' || session_id.length < 10) {
      return res.status(400).json({ error: 'session_id no válido' });
    }

    console.log(`🔍 Verificando sesión de pago: ${session_id}`);

    // Obtener la sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Obtener el payment intent si existe
    let paymentIntent = null;
    if (session.payment_intent) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      } catch (error) {
        console.warn('⚠️ No se pudo obtener el payment intent:', error.message);
      }
    }

    // Calcular precio desde amount_total (está en centavos)
    const precioEnPesos = session.amount_total ? session.amount_total / 100 : 0;
    
    // Preparar respuesta
    const response = {
      id: session.id,
      status: session.payment_status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      precio: precioEnPesos, // Precio en pesos (convertido de centavos)
      currency: session.currency,
      customer_email: session.customer_email,
      customer_details: session.customer_details,
      metadata: session.metadata || {},
      plan: session.metadata?.plan || '',
      periodo: session.metadata?.periodo || '',
      solicitudId: session.metadata?.solicitudId || '',
      cliente: {
        nombre: session.metadata?.clienteNombre || '',
        email: session.customer_email || '',
        telefono: session.metadata?.clienteTelefono || '',
        empresa: session.metadata?.clienteEmpresa || ''
      },
      created: session.created,
      payment_intent: paymentIntent ? {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount
      } : null
    };

    console.log(`✅ Sesión verificada: ${session.id}, Estado: ${session.payment_status}`);
    res.json(response);
  } catch (error) {
    console.error('❌ Error verificando pago:', error);
    
    // Manejar errores específicos de Stripe
    if (error.type === 'StripeInvalidRequestError') {
      if (error.message.includes('No such checkout session')) {
        return res.status(404).json({ 
          error: 'Sesión de checkout no encontrada' 
        });
      }
      return res.status(400).json({ 
        error: `Error en la solicitud a Stripe: ${error.message}` 
      });
    }
    
    if (error.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Error de autenticación con Stripe. Verifica tu STRIPE_SECRET_KEY' 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Error interno del servidor al verificar el pago' 
    });
  }
});


// Verificar configuración antes de iniciar
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY no está configurada en .env');
  console.error('   Por favor, crea un archivo .env con:');
  console.error('   STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui');
  console.error('   PORT=3000');
  process.exit(1);
}

// Validar que la clave tenga formato válido
if (process.env.STRIPE_SECRET_KEY.length < 20 || 
    (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && 
     !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_'))) {
  console.warn('⚠️ ADVERTENCIA: STRIPE_SECRET_KEY parece no tener un formato válido');
  console.warn('   Las claves de Stripe deben comenzar con sk_test_ (pruebas) o sk_live_ (producción)');
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`✅ STRIPE_SECRET_KEY configurada`);
  console.log(`📝 Endpoints disponibles:`);
  console.log(`   POST /api/create-checkout-session - Crear sesión de checkout`);
  console.log(`   GET  /api/verify-payment - Verificar estado de pago`);
  console.log(`   POST /api/stripe-webhook - Webhook de Stripe (opcional)`);
  console.log(`\n💡 Para producción:`);
  console.log(`   1. Cambia STRIPE_SECRET_KEY a una clave de producción (sk_live_...)`);
  console.log(`   2. Configura STRIPE_WEBHOOK_SECRET en .env`);
  console.log(`   3. Actualiza backendUrl en stripe-config.js con tu dominio real`);
});










