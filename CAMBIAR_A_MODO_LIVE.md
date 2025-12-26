# 🔴 Cambiar a Modo LIVE - Producción Real

**⚠️ IMPORTANTE:** En modo LIVE se procesan pagos REALES. Asegúrate de estar listo.

---

## ✅ Lo que Ya Está Hecho

- ✅ Publishable Key LIVE actualizada en `stripe-config.js`
- ✅ Modo cambiado a 'live' en `stripe-config.js`

---

## 📋 Paso 1: Cambiar Secret Key en Railway

**⚠️ CRÍTICO:** Necesitas cambiar la Secret Key en Railway a modo LIVE.

### 1.1 Obtener Secret Key LIVE

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. **Asegúrate de estar en modo "Live"** (toggle en la parte superior)
3. Ve a **Developers** > **API keys**
4. Haz clic en **"Reveal live key"** para ver tu Secret Key
5. Copia la **Secret key** (`sk_live_...`)

### 1.2 Actualizar en Railway

1. Ve a [Railway](https://railway.app)
2. Haz clic en tu servicio **"TitanFleet"**
3. Ve a la pestaña **"Variables"**
4. Busca `STRIPE_SECRET_KEY`
5. Cambia el valor a tu **Secret Key LIVE** (`sk_live_...`)
6. **Guarda** los cambios

**⚠️ IMPORTANTE:**
- Asegúrate de que NO tenga espacios
- Debe empezar exactamente con `sk_live_`
- Railway redesplegará automáticamente (espera 1-2 minutos)

---

## 📋 Paso 2: Verificar Logs de Railway

1. Ve a la pestaña **"Logs"** en Railway
2. Espera a que termine el redeploy
3. Deberías ver:
   ```
   🚀 Servidor corriendo en http://localhost:3000
   ✅ STRIPE_SECRET_KEY configurada
   ```

---

## 📋 Paso 3: Deploy del Frontend

Después de que Railway termine el redeploy, haz deploy del frontend:

```bash
npm run build
firebase deploy --only hosting
```

O si prefieres:

```bash
npm run deploy
```

---

## ⚠️ IMPORTANTE: Tarjetas de Prueba NO Funcionan en LIVE

**En modo LIVE:**
- ❌ NO puedes usar tarjetas de prueba (`4242 4242 4242 4242`)
- ✅ Solo puedes usar **tarjetas reales**
- ⚠️ Los pagos son **REALES** y se procesarán de verdad

**Para probar en modo LIVE:**
- Usa una tarjeta real con un **monto pequeño** para pruebas
- Puedes reembolsar el pago después si es necesario
- O vuelve a modo TEST para hacer pruebas

---

## ✅ Checklist para Modo LIVE

- [x] Publishable Key LIVE configurada en `stripe-config.js`
- [x] Modo cambiado a 'live' en `stripe-config.js`
- [ ] **Secret Key LIVE actualizada en Railway** (hazlo ahora)
- [ ] Verificar logs de Railway
- [ ] Deploy del frontend
- [ ] Probar con tarjeta real (monto pequeño)

---

## 🔄 Si Necesitas Volver a Modo TEST

Si necesitas volver a modo TEST para hacer más pruebas:

1. Cambiar en `stripe-config.js`:
   - `publishableKey` → tu clave TEST
   - `mode: 'test'`

2. Cambiar en Railway:
   - `STRIPE_SECRET_KEY` → tu Secret Key TEST

3. Deploy del frontend

---

## 🎯 Después de Cambiar a LIVE

Una vez que todo esté en modo LIVE:

1. **Prueba con una tarjeta real** (monto pequeño)
2. **Verifica que el pago se procese correctamente**
3. **Verifica que la licencia se genere**
4. **Monitorea los pagos** en Stripe Dashboard

---

## 📊 Verificar en Stripe Dashboard

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Asegúrate de estar en modo **"Live"**
3. Ve a **Payments** para ver los pagos procesados
4. Verifica que todo esté funcionando correctamente

---

## 🎉 ¡Listo para Producción!

Una vez que completes estos pasos, tu aplicación estará en **modo LIVE** y procesará pagos reales.

**⚠️ Recuerda:** Los pagos en modo LIVE son REALES. Asegúrate de estar completamente listo antes de cambiar.

---

**¿Ya actualizaste la Secret Key en Railway?** Después de eso, solo falta el deploy del frontend. 🚀

