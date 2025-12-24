# Guía de Integración con Stripe - TitanFleet ERP

## 📋 Pasos para Integrar Stripe

### Paso 1: Crear Cuenta en Stripe

1. Ve a https://stripe.com
2. Crea una cuenta (es gratis)
3. Completa la información de tu negocio
4. Ve al Dashboard > Developers > API keys
5. Copia tu **Publishable key** (pk_test_...) y **Secret key** (sk_test_...)

### Paso 2: Configurar las Claves en el Código

1. Abre el archivo `assets/scripts/stripe-config.js`
2. Reemplaza `pk_test_51Q...` con tu **Publishable key** real
3. Configura la URL de tu backend (por defecto: `http://localhost:3000`)

```javascript
window.STRIPE_CONFIG = {
    publishableKey: 'pk_test_TU_CLAVE_AQUI', // ⚠️ CAMBIAR
    backendUrl: 'http://localhost:3000',     // ⚠️ CAMBIAR EN PRODUCCIÓN
    currency: 'mxn',
    mode: 'test' // 'live' para producción
};
```

### Paso 3: Configurar el Backend

#### Opción A: Usar el Ejemplo Incluido (Node.js)

1. Ve a la carpeta `backend-example`
2. Instala las dependencias:
   ```bash
   npm install express stripe cors dotenv
   ```

3. Crea un archivo `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA
   PORT=3000
   ```

4. Ejecuta el servidor:
   ```bash
   node server.js
   ```

#### Opción B: Usar tu Propio Backend

Necesitas crear dos endpoints:

**1. POST `/api/create-checkout-session`**
- Recibe: `{ plan, periodo, precio, cliente, solicitudId, currency, successUrl, cancelUrl }`
- Retorna: `{ id: sessionId }`

**2. GET `/api/verify-payment?session_id=xxx`**
- Retorna: Información del pago completado

Ver `backend-example/server.js` para el código completo.

### Paso 4: Probar la Integración

1. **Modo de Prueba:**
   - Usa tarjetas de prueba de Stripe:
     - Tarjeta exitosa: `4242 4242 4242 4242`
     - CVC: cualquier 3 dígitos
     - Fecha: cualquier fecha futura
     - ZIP: cualquier código postal

2. **Flujo de Prueba:**
   - Abre `pages/demo.html`
   - Selecciona un plan y método "Tarjeta"
   - Completa el formulario
   - Serás redirigido a Stripe Checkout
   - Usa una tarjeta de prueba
   - Serás redirigido a `pago-success.html` con tu licencia

### Paso 5: Configurar para Producción

1. **Cambiar a Claves de Producción:**
   - En Stripe Dashboard, cambia a modo "Live"
   - Copia tus claves de producción (pk_live_... y sk_live_...)
   - Actualiza `stripe-config.js` con las claves de producción
   - Cambia `mode: 'live'` en la configuración

2. **Configurar Webhooks (Recomendado):**
   - En Stripe Dashboard > Developers > Webhooks
   - Agrega endpoint: `https://tu-dominio.com/api/stripe-webhook`
   - Selecciona eventos: `checkout.session.completed`, `payment_intent.succeeded`
   - Copia el Webhook Secret y agrégalo a tu `.env`

3. **Configurar Dominio:**
   - Actualiza `backendUrl` en `stripe-config.js` con tu dominio real
   - Asegúrate de que tu backend esté accesible públicamente

## 🔒 Seguridad

- ✅ **Nunca expongas tu Secret Key** en el código del frontend
- ✅ **Solo usa Publishable Key** en el frontend
- ✅ **Valida todos los pagos** en el backend antes de generar licencias
- ✅ **Usa HTTPS** en producción
- ✅ **Verifica webhooks** usando el Webhook Secret

## 📧 Envío Automático de Emails

Para enviar emails automáticamente después del pago:

1. **Opción 1: Usar Webhooks de Stripe**
   - Cuando recibas `checkout.session.completed`
   - Genera la licencia
   - Envía el email usando un servicio (SendGrid, Mailgun, etc.)

2. **Opción 2: En el Endpoint de Verificación**
   - Cuando el cliente regrese a `pago-success.html`
   - El backend verifica el pago
   - Genera la licencia
   - Envía el email

## 🐛 Solución de Problemas

### Error: "Stripe no está configurado"
- Verifica que `stripe-config.js` tenga tu Publishable Key
- Asegúrate de que el archivo se esté cargando correctamente

### Error: "No se pudo conectar con el servidor"
- Verifica que tu backend esté corriendo
- Verifica que `backendUrl` sea correcta
- Revisa la consola del navegador para más detalles

### Error: "Invalid API Key"
- Verifica que estés usando la clave correcta (test vs live)
- Asegúrate de que la clave no tenga espacios extra

### El pago se procesa pero no se genera la licencia
- Verifica que el endpoint `/api/verify-payment` esté funcionando
- Revisa los logs del backend
- Verifica que `generate-licenses.js` y `license-admin.js` estén cargados

## 📝 Notas Importantes

1. **Modo de Desarrollo:**
   - Si Stripe no está configurado, el sistema usa modo simulación
   - Esto permite probar el flujo sin backend

2. **Modo de Producción:**
   - Siempre valida los pagos en el backend
   - No confíes solo en el frontend
   - Usa webhooks para mayor seguridad

3. **Moneda:**
   - Por defecto está configurado en MXN (pesos mexicanos)
   - Puedes cambiar a USD u otra moneda en `stripe-config.js`

## 🎯 Próximos Pasos

1. ✅ Configurar Stripe
2. ✅ Configurar backend
3. ✅ Probar con tarjetas de prueba
4. ⏳ Configurar envío automático de emails
5. ⏳ Configurar webhooks
6. ⏳ Probar en producción
7. ⏳ Lanzar

---

¿Necesitas ayuda? Revisa la documentación de Stripe: https://stripe.com/docs
