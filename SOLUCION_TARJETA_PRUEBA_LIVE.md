# 🔧 Solución: Tarjeta de Prueba Rechazada en Modo LIVE

**Problema:** Estás en modo LIVE de Stripe, pero intentas usar una tarjeta de prueba.

**Solución:** Las tarjetas de prueba (`4242 4242 4242 4242`) **solo funcionan en modo TEST**.

---

## ✅ Opción 1: Cambiar Temporalmente a Modo TEST (Recomendado para Pruebas)

Para probar el flujo completo sin usar una tarjeta real, cambia temporalmente a modo TEST:

### 1. Cambiar Modo a TEST

Abre `assets/scripts/stripe-config.js` y cambia:

```javascript
mode: 'test'  // Cambiar temporalmente a 'test' para pruebas
```

### 2. Usar Publishable Key TEST

También necesitas cambiar a tu Publishable Key de TEST:

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Cambia a modo **"Test"** (toggle en la parte superior)
3. Ve a **Developers** > **API keys**
4. Copia la **Publishable key** (`pk_test_...`)
5. Actualiza `stripe-config.js`:

```javascript
publishableKey: 'pk_test_TU_CLAVE_TEST_AQUI', // Clave TEST
```

### 3. Actualizar Backend (Railway)

También necesitas cambiar la variable de entorno en Railway:

1. Ve a Railway > Variables
2. Cambia `STRIPE_SECRET_KEY` a tu Secret Key de TEST (`sk_test_...`)
3. Railway redesplegará automáticamente

### 4. Probar

Ahora puedes usar la tarjeta de prueba:
- **Tarjeta:** `4242 4242 4242 4242`
- **Fecha:** Cualquier fecha futura
- **CVV:** Cualquier 3 dígitos

---

## ✅ Opción 2: Usar Tarjeta Real (Solo para Producción Real)

Si quieres probar en modo LIVE, necesitas usar una **tarjeta real** con un **monto pequeño**.

**⚠️ IMPORTANTE:** 
- Esto procesará un pago REAL
- Asegúrate de usar un monto pequeño para pruebas
- Puedes reembolsar el pago después si es necesario

---

## 🎯 Recomendación

**Para desarrollo y pruebas:**
- Usa modo **TEST** con tarjetas de prueba
- Es más seguro y no procesa pagos reales

**Para producción real:**
- Usa modo **LIVE** con tarjetas reales
- Solo cuando estés 100% seguro de que todo funciona

---

## 📋 Pasos para Cambiar a Modo TEST

1. **Cambiar `stripe-config.js`:**
   - `mode: 'test'`
   - `publishableKey: 'pk_test_...'`

2. **Cambiar variable en Railway:**
   - `STRIPE_SECRET_KEY=sk_test_...`

3. **Esperar redeploy de Railway** (1-2 min)

4. **Probar con tarjeta de prueba**

---

## 🔄 Volver a Modo LIVE

Cuando estés listo para producción real:

1. Cambiar `mode: 'live'` en `stripe-config.js`
2. Cambiar a Publishable Key LIVE
3. Cambiar `STRIPE_SECRET_KEY` a LIVE en Railway
4. Deploy del frontend

---

**¿Quieres que te ayude a cambiar a modo TEST para hacer las pruebas?** 🚀

