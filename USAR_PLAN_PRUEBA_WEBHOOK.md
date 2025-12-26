# 🧪 Usar Plan de Prueba para Probar Webhook

**He creado un plan de prueba con precio de $10 MXN para probar el webhook.**

---

## 📋 Cómo Usar el Plan de Prueba

### Opción 1: Acceder Directamente por URL

Puedes acceder directamente a la página de pago con el plan de prueba usando esta URL:

```
https://tu-dominio.firebaseapp.com/pages/pago.html?plan=prueba&periodo=mensual&precio=10
```

O si estás en localhost:
```
http://localhost:3000/pages/pago.html?plan=prueba&periodo=mensual&precio=10
```

**Parámetros:**
- `plan=prueba` - Plan de prueba
- `periodo=mensual` - Período mensual (o `anual`)
- `precio=10` - Precio de $10 MXN

---

### Opción 2: Desde la Consola del Navegador

1. Abre tu aplicación
2. Abre la consola del navegador (F12)
3. Ejecuta:

```javascript
// Configurar datos del plan de prueba
window.paymentData = {
  plan: 'Plan de Prueba',
  planLevel: 'prueba',
  periodo: 'Mensual',
  paymentPeriod: 'mensual',
  precio: 10,
  cliente: {
    nombre: 'Prueba Webhook',
    email: 'prueba@ejemplo.com',
    telefono: '5551234567',
    empresa: 'Empresa de Prueba'
  }
};

// Redirigir a página de pago
window.location.href = '/pages/pago.html';
```

---

### Opción 3: Modificar Temporalmente la Página de Demo

Si quieres agregar el plan de prueba a la página de demo visiblemente, puedes agregarlo manualmente en `pages/demo.html` o usar la Opción 1 o 2 que son más rápidas.

---

## ✅ Pasos para Probar el Webhook

### 1. Acceder al Plan de Prueba

Usa la **Opción 1** (URL directa) o **Opción 2** (consola).

### 2. Completar el Pago

1. En la página de pago, verás:
   - **Plan:** Plan de Prueba
   - **Precio:** $10 MXN
2. Haz clic en **"Continuar con Stripe Checkout"**
3. Completa el checkout con una **tarjeta real** (en modo LIVE)
4. Completa el pago

### 3. Verificar Webhook

**En Stripe Dashboard:**
1. Ve a **Webhooks** > Tu webhook
2. Pestaña **"Entregas de eventos"** (Event deliveries)
3. Deberías ver el evento `checkout.session.completed` ✅

**En Railway Logs:**
1. Ve a Railway > Logs
2. Deberías ver:
   ```
   ✅ Pago completado: cs_live_...
   ✅ Pago exitoso: pi_live_...
   ```

**Si ves el evento en ambos lugares, ¡el webhook está funcionando!** ✅

---

## 🔄 Después de Probar

### Reembolsar el Pago (Opcional)

Si quieres reembolsar el pago de prueba:

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com) (modo Live)
2. Ve a **Payments**
3. Busca el pago de $10 MXN
4. Haz clic en el pago
5. Haz clic en **"Refund"** (Reembolsar)
6. Confirma el reembolso

---

## ✅ Checklist

- [x] Plan de prueba creado ($10 MXN)
- [ ] Acceder a la página de pago con plan de prueba
- [ ] Completar pago con tarjeta real
- [ ] Verificar evento en Stripe Dashboard
- [ ] Verificar evento en Railway Logs
- [ ] (Opcional) Reembolsar el pago

---

## 🎯 URL Rápida

**Copia y pega esta URL en tu navegador:**

```
https://tu-dominio.firebaseapp.com/pages/pago.html?plan=prueba&periodo=mensual&precio=10
```

(Reemplaza `tu-dominio.firebaseapp.com` con tu URL real de Firebase)

---

**¿Listo para probar?** Usa la URL de arriba y completa el pago de $10 MXN. 🚀

