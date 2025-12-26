# 🧪 Guía: Usar Plan de Prueba para Probar Webhook

**Plan de prueba creado: $10 MXN**

---

## 🚀 Forma Más Rápida: Página Dedicada

He creado una página especial para acceder al plan de prueba:

### Opción 1: Página Dedicada (Recomendada)

**Abre esta URL en tu navegador:**

```
https://tu-dominio.firebaseapp.com/pages/pago-prueba.html
```

**O desde localhost:**
```
http://localhost:3000/pages/pago-prueba.html
```

Esta página:
- ✅ Configura automáticamente el plan de prueba
- ✅ Precio de $10 MXN
- ✅ Un solo clic para ir al pago

---

## 📋 Pasos para Probar el Webhook

### 1. Acceder al Plan de Prueba

Abre la URL de arriba o usa una de las opciones siguientes.

### 2. Completar el Pago

1. Verás el plan de prueba con precio de **$10 MXN**
2. Haz clic en **"Continuar al Pago"** o **"Continuar con Stripe Checkout"**
3. Completa el checkout con una **tarjeta real** (en modo LIVE)
4. Completa el pago

### 3. Verificar Webhook

**En Stripe Dashboard:**
1. Ve a **Webhooks** > Tu webhook
2. Pestaña **"Entregas de eventos"** (Event deliveries)
3. Deberías ver el evento `checkout.session.completed` ✅

**En Railway Logs:**
1. Ve a Railway > **Logs**
2. Deberías ver:
   ```
   ✅ Pago completado: cs_live_...
   ✅ Pago exitoso: pi_live_...
   ```

**Si ves el evento en ambos lugares, ¡el webhook está funcionando!** ✅

---

## 🔄 Otras Opciones

### Opción 2: URL Directa con Parámetros

```
https://tu-dominio.firebaseapp.com/pages/pago.html?plan=Plan de Prueba&periodo=Mensual&precio=10&planLevel=prueba&paymentPeriod=mensual
```

### Opción 3: Desde la Consola del Navegador

1. Abre tu aplicación
2. Abre la consola (F12)
3. Ejecuta:

```javascript
sessionStorage.setItem('titanfleet_payment_data', JSON.stringify({
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
  },
  solicitudId: `PRUEBA-${Date.now()}`
}));

window.location.href = '/pages/pago.html';
```

---

## 🔄 Reembolsar el Pago (Opcional)

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
- [x] Página `pago-prueba.html` creada
- [ ] Acceder a la página de plan de prueba
- [ ] Completar pago con tarjeta real
- [ ] Verificar evento en Stripe Dashboard
- [ ] Verificar evento en Railway Logs
- [ ] (Opcional) Reembolsar el pago

---

## 🎯 URL Rápida

**Copia y pega esta URL (reemplaza `tu-dominio` con tu dominio real):**

```
https://tu-dominio.firebaseapp.com/pages/pago-prueba.html
```

---

**¿Listo para probar?** Abre la URL de arriba y completa el pago de $10 MXN. 🚀

