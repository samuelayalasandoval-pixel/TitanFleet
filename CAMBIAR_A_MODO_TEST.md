# 🔄 Cambiar a Modo TEST para Pruebas

**He cambiado el modo a 'test' en `stripe-config.js`.**

Ahora necesitas:

---

## 📋 Paso 1: Obtener Publishable Key de TEST

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. **Cambia a modo "Test"** (toggle en la parte superior - debe decir "Test")
3. Ve a **Developers** > **API keys**
4. Copia la **Publishable key** (`pk_test_...`)

---

## 📋 Paso 2: Actualizar stripe-config.js

Cuando tengas tu Publishable Key de TEST, dímela y la actualizo, o puedes hacerlo tú:

Abre `assets/scripts/stripe-config.js` y cambia:

```javascript
publishableKey: 'pk_test_TU_CLAVE_TEST_AQUI', // Tu clave TEST
```

---

## 📋 Paso 3: Cambiar Secret Key en Railway

También necesitas cambiar la variable de entorno en Railway:

1. Ve a Railway > Variables
2. Cambia `STRIPE_SECRET_KEY` a tu **Secret Key de TEST** (`sk_test_...`)
3. Railway redesplegará automáticamente (espera 1-2 minutos)

**Para obtener tu Secret Key de TEST:**
1. En Stripe Dashboard (modo Test)
2. Developers > API keys
3. Haz clic en "Reveal test key"
4. Copia la Secret key (`sk_test_...`)

---

## ✅ Después de Cambiar

1. **Espera el redeploy de Railway** (1-2 min)
2. **Haz deploy del frontend** (si ya lo desplegaste):
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
3. **Prueba con tarjeta de prueba:**
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVV: Cualquier 3 dígitos

---

## 🔄 Volver a Modo LIVE (Cuando Estés Listo)

Cuando quieras volver a producción:

1. Cambiar `mode: 'live'` en `stripe-config.js`
2. Cambiar a Publishable Key LIVE
3. Cambiar `STRIPE_SECRET_KEY` a LIVE en Railway
4. Deploy del frontend

---

**¿Tienes tu Publishable Key de TEST?** Dímela y la actualizo en el archivo. 🚀

