# 🔔 Configurar Webhooks de Stripe

**Los webhooks permiten recibir notificaciones automáticas cuando ocurren eventos en Stripe (pagos completados, etc.)**

---

## 📋 Paso 1: Obtener URL del Webhook

Tu backend ya tiene el endpoint configurado en:
```
https://titanfleet-production.up.railway.app/api/stripe-webhook
```

**Copia esta URL** - la necesitarás en Stripe.

---

## 📋 Paso 2: Configurar Webhook en Stripe Dashboard

### 2.1 Ir a Stripe Dashboard

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. **Asegúrate de estar en modo "Live"** (toggle en la parte superior)
3. Ve a **Developers** > **Webhooks**

### 2.2 Agregar Endpoint

1. Haz clic en **"+ Add endpoint"** o **"Add endpoint"**
2. En **"Endpoint URL"**, pega:
   ```
   https://titanfleet-production.up.railway.app/api/stripe-webhook
   ```
3. Haz clic en **"Add endpoint"**

### 2.3 Seleccionar Eventos

Stripe te pedirá seleccionar qué eventos quieres recibir. Selecciona:

**Eventos Recomendados:**
- ✅ `checkout.session.completed` - Cuando se completa un pago
- ✅ `payment_intent.succeeded` - Cuando un pago es exitoso
- ✅ `payment_intent.payment_failed` - Cuando un pago falla (opcional pero útil)

**Para seleccionar:**
1. Haz clic en **"Select events"** o **"Add events"**
2. Busca y selecciona los eventos mencionados arriba
3. Haz clic en **"Add events"** o **"Save"**

### 2.4 Guardar

Haz clic en **"Add endpoint"** o **"Save"** para crear el webhook.

---

## 📋 Paso 3: Obtener Webhook Secret

Después de crear el webhook:

1. Haz clic en el webhook que acabas de crear
2. En la sección **"Signing secret"**, verás algo como:
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Haz clic en **"Reveal"** o **"Click to reveal"**
4. **Copia el Webhook Secret** - lo necesitarás para Railway

**⚠️ IMPORTANTE:** Guarda este secret de forma segura. Lo necesitarás para verificar que los webhooks vienen realmente de Stripe.

---

## 📋 Paso 4: Configurar en Railway

### 4.1 Agregar Variable de Entorno

1. Ve a [Railway](https://railway.app)
2. Haz clic en tu servicio **"TitanFleet"**
3. Ve a la pestaña **"Variables"**
4. Haz clic en **"New Variable"** o **"+ New Variable"**

### 4.2 Configurar Variable

- **Nombre:** `STRIPE_WEBHOOK_SECRET`
- **Valor:** `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (tu Webhook Secret de Stripe)
- **Descripción:** Secret del webhook de Stripe (opcional)

### 4.3 Guardar

**Guarda** la variable. Railway redesplegará automáticamente (espera 1-2 minutos).

---

## 📋 Paso 5: Verificar que Funciona

### 5.1 Verificar Logs de Railway

1. Ve a la pestaña **"Logs"** en Railway
2. Deberías ver que el servidor se reinició correctamente
3. No deberías ver errores relacionados con webhooks

### 5.2 Probar Webhook desde Stripe

1. En Stripe Dashboard, ve a tu webhook
2. Haz clic en **"Send test webhook"** o **"Send test event"**
3. Selecciona un evento (ej: `checkout.session.completed`)
4. Haz clic en **"Send test webhook"**

### 5.3 Verificar en Logs

1. Ve a Railway > Logs
2. Deberías ver algo como:
   ```
   ✅ Pago completado: cs_test_...
   ```
   O el evento que enviaste.

Si ves el evento en los logs, **¡el webhook está funcionando!** ✅

---

## 📋 Paso 6: Verificar Endpoint en el Backend

Tu backend ya tiene el código para manejar webhooks en `backend-example/server.js`:

```javascript
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Maneja eventos de Stripe
});
```

**El código ya está listo** - solo necesitas configurar el secret en Railway.

---

## ✅ Checklist

- [ ] Webhook creado en Stripe Dashboard
- [ ] URL del webhook configurada: `https://titanfleet-production.up.railway.app/api/stripe-webhook`
- [ ] Eventos seleccionados (`checkout.session.completed`, `payment_intent.succeeded`)
- [ ] Webhook Secret obtenido (`whsec_...`)
- [ ] Variable `STRIPE_WEBHOOK_SECRET` configurada en Railway
- [ ] Railway redesplegado
- [ ] Webhook probado desde Stripe Dashboard
- [ ] Eventos recibidos en logs de Railway

---

## 🎯 Eventos que se Manejan

Tu backend actualmente maneja:

1. **`checkout.session.completed`**
   - Se dispara cuando un pago se completa
   - Puedes generar la licencia automáticamente aquí

2. **`payment_intent.succeeded`**
   - Se dispara cuando un pago es exitoso
   - Confirmación adicional del pago

---

## 🔧 Mejorar el Manejo de Webhooks (Opcional)

Puedes mejorar el código del webhook para:

1. **Generar licencias automáticamente** cuando se recibe `checkout.session.completed`
2. **Enviar emails** al cliente con la licencia
3. **Actualizar estado en Firestore** automáticamente
4. **Registrar eventos** en logs

**Ejemplo mejorado:**
```javascript
case 'checkout.session.completed':
  const session = event.data.object;
  console.log('✅ Pago completado:', session.id);
  
  // Generar licencia automáticamente
  // Enviar email al cliente
  // Actualizar Firestore
  break;
```

---

## 🐛 Solución de Problemas

### Webhook no recibe eventos

1. **Verificar URL:** Asegúrate de que la URL sea correcta y accesible
2. **Verificar Secret:** Verifica que `STRIPE_WEBHOOK_SECRET` esté correcto en Railway
3. **Verificar Logs:** Revisa los logs de Railway para ver errores
4. **Probar desde Stripe:** Usa "Send test webhook" en Stripe Dashboard

### Error "Webhook Error: Invalid signature"

- Verifica que `STRIPE_WEBHOOK_SECRET` sea correcto
- Asegúrate de que no tenga espacios
- Verifica que sea el secret del webhook correcto (no otro secret)

### Webhook no aparece en logs

- Verifica que el endpoint esté accesible públicamente
- Verifica que Railway esté funcionando
- Prueba enviando un test webhook desde Stripe

---

## 📊 Monitorear Webhooks

En Stripe Dashboard:
1. Ve a **Developers** > **Webhooks**
2. Haz clic en tu webhook
3. Verás:
   - **Recent events** - Eventos recientes
   - **Event logs** - Historial completo
   - **Status** - Estado del webhook

---

## 🎉 ¡Listo!

Una vez configurado, los webhooks:
- ✅ Notificarán automáticamente cuando haya pagos
- ✅ Mejorarán la confiabilidad del sistema
- ✅ Permitirán procesar eventos en tiempo real

---

**¿Necesitas ayuda con algún paso específico?** 🚀

