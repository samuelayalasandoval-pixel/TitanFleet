# ✅ Plan de Prueba Creado - $10 MXN

**¡Perfecto! He creado un plan de prueba con precio de $10 MXN.**

---

## ✅ Lo que se Actualizó

- ✅ Plan "prueba" agregado en `demo-utils.js`
- ✅ Precios actualizados en `plan-limits-manager.js`
- ✅ Validación actualizada en `pago.html`
- ✅ Precios actualizados en `pago-success.html`
- ✅ Precios actualizados en `license-ui.html`

---

## 🚀 Cómo Usar el Plan de Prueba

### Opción 1: URL Directa (Más Rápida)

**Copia y pega esta URL en tu navegador:**

```
https://tu-dominio.firebaseapp.com/pages/pago.html?plan=Plan de Prueba&periodo=Mensual&precio=10&planLevel=prueba&paymentPeriod=mensual
```

**Reemplaza `tu-dominio.firebaseapp.com` con tu URL real de Firebase.**

**O desde localhost:**
```
http://localhost:3000/pages/pago.html?plan=Plan de Prueba&periodo=Mensual&precio=10&planLevel=prueba&paymentPeriod=mensual
```

---

### Opción 2: Desde la Consola del Navegador

1. Abre tu aplicación
2. Abre la consola (F12)
3. Ejecuta:

```javascript
window.location.href = '/pages/pago.html?plan=Plan de Prueba&periodo=Mensual&precio=10&planLevel=prueba&paymentPeriod=mensual';
```

---

## ✅ Pasos para Probar el Webhook

### 1. Acceder al Plan de Prueba

Usa la **Opción 1** (URL directa) - es la más rápida.

### 2. Completar el Pago

1. Verás el plan de prueba con precio de **$10 MXN**
2. Haz clic en **"Continuar con Stripe Checkout"**
3. Completa el checkout con una **tarjeta real**
4. Completa el pago

### 3. Verificar Webhook

**En Stripe Dashboard:**
- Ve a **Webhooks** > Tu webhook > **"Entregas de eventos"**
- Deberías ver `checkout.session.completed` ✅

**En Railway Logs:**
- Ve a Railway > **Logs**
- Deberías ver: `✅ Pago completado: cs_live_...` ✅

---

## 🔄 Reembolsar el Pago (Opcional)

Si quieres reembolsar el pago de prueba:

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com) (modo Live)
2. Ve a **Payments**
3. Busca el pago de $10 MXN
4. Haz clic en **"Refund"** (Reembolsar)

---

## ✅ Checklist

- [x] Plan de prueba creado ($10 MXN)
- [ ] Acceder a la URL con plan de prueba
- [ ] Completar pago con tarjeta real
- [ ] Verificar evento en Stripe Dashboard
- [ ] Verificar evento en Railway Logs
- [ ] (Opcional) Reembolsar el pago

---

## 🎯 URL Rápida

**Copia esta URL y reemplaza `tu-dominio` con tu dominio real:**

```
https://tu-dominio.firebaseapp.com/pages/pago.html?plan=Plan de Prueba&periodo=Mensual&precio=10&planLevel=prueba&paymentPeriod=mensual
```

---

**¿Listo para probar?** Usa la URL de arriba y completa el pago de $10 MXN para probar el webhook. 🚀

