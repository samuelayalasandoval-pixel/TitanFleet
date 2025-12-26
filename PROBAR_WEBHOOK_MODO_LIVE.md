# 🔴 Probar Webhook en Modo LIVE

**En modo LIVE, Stripe NO permite enviar eventos de prueba desde el dashboard.**

Esto es normal y por seguridad. Aquí tienes las opciones:

---

## ✅ Opción 1: Probar con un Pago Real (Recomendado)

La mejor forma de probar el webhook en modo LIVE es hacer un **pago real pequeño**:

### Pasos:

1. **Abre tu aplicación** en producción
2. **Ve a la página de pagos**
3. **Selecciona un plan** con un monto pequeño (ej: $10 MXN)
4. **Completa el checkout** con una **tarjeta real**
5. **Completa el pago**

### Verificar:

1. **En Stripe Dashboard:**
   - Ve a **Payments** (modo Live)
   - Deberías ver el pago procesado

2. **En Railway Logs:**
   - Ve a Railway > Logs
   - Deberías ver:
     ```
     ✅ Pago completado: cs_live_...
     ✅ Pago exitoso: pi_live_...
     ```

3. **En Stripe Dashboard > Webhooks:**
   - Ve a tu webhook
   - Pestaña **"Entregas de eventos"** (Event deliveries)
   - Deberías ver el evento entregado exitosamente

**Si ves el evento en los logs de Railway, ¡el webhook está funcionando!** ✅

---

## ✅ Opción 2: Usar Stripe CLI (Avanzado)

Si tienes Stripe CLI instalado, puedes enviar eventos de prueba incluso en modo LIVE:

```bash
# Instalar Stripe CLI (si no lo tienes)
# https://stripe.com/docs/stripe-cli

# Enviar evento de prueba
stripe trigger checkout.session.completed
```

Pero esto requiere instalar Stripe CLI, así que la Opción 1 es más simple.

---

## ✅ Opción 3: Cambiar Temporalmente a Modo TEST

Si quieres probar sin hacer un pago real:

1. **Cambiar a modo TEST en Stripe Dashboard**
2. **Crear un webhook nuevo en modo TEST** (o usar el mismo endpoint)
3. **Probar con eventos de prueba**
4. **Volver a modo LIVE** cuando termines

**Nota:** Necesitarías cambiar también las claves en Railway y el frontend.

---

## 🎯 Recomendación

**La mejor opción es la Opción 1:** Hacer un pago real pequeño.

**Ventajas:**
- ✅ Prueba el flujo completo real
- ✅ Verifica que todo funcione en producción
- ✅ No necesitas cambiar configuraciones
- ✅ Puedes reembolsar el pago después si quieres

**Pasos:**
1. Haz un pago de $10-50 MXN (monto pequeño)
2. Verifica que el webhook reciba el evento
3. Si quieres, reembolsa el pago desde Stripe Dashboard

---

## 📊 Verificar que el Webhook Funciona

Después de hacer un pago real:

### 1. En Stripe Dashboard

1. Ve a **Webhooks** > Tu webhook
2. Pestaña **"Entregas de eventos"** (Event deliveries)
3. Deberías ver:
   - Evento `checkout.session.completed`
   - Estado: "Succeeded" (éxito) ✅
   - Tiempo de respuesta

### 2. En Railway Logs

1. Ve a Railway > Logs
2. Busca mensajes como:
   ```
   ✅ Pago completado: cs_live_...
   ✅ Pago exitoso: pi_live_...
   ```

### 3. Verificar Variable en Railway

Asegúrate de que `STRIPE_WEBHOOK_SECRET` esté configurada:
- Ve a Railway > Variables
- Verifica que `STRIPE_WEBHOOK_SECRET` tenga el valor correcto (`whsec_...`)

---

## ✅ Checklist

- [x] Webhook creado en Stripe
- [x] URL configurada
- [ ] **Webhook Secret configurado en Railway** (verificar)
- [ ] **Hacer un pago real pequeño para probar**
- [ ] Verificar evento en Stripe Dashboard
- [ ] Verificar evento en Railway Logs

---

## 🎉 Después de Probar

Una vez que confirmes que el webhook funciona:

- ✅ Recibirás notificaciones automáticas de pagos
- ✅ El sistema será más confiable
- ✅ Podrás procesar eventos en tiempo real

---

**¿Ya configuraste el Webhook Secret en Railway?** Si sí, haz un pago pequeño para probar el webhook. 🚀

