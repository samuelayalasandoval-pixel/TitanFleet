# 🔧 Actualizar Secret Key en Railway

**Ya actualicé la Publishable Key de TEST en `stripe-config.js`.**

Ahora necesitas actualizar la Secret Key en Railway:

---

## 📋 Paso 1: Ir a Railway Variables

1. Ve a [Railway](https://railway.app)
2. Haz clic en tu servicio **"TitanFleet"**
3. Ve a la pestaña **"Variables"**

---

## 📋 Paso 2: Actualizar STRIPE_SECRET_KEY

1. Busca la variable **`STRIPE_SECRET_KEY`**
2. Haz clic en el ícono de edición (⋮ o lápiz)
3. Cambia el valor a tu Secret Key de TEST:
   ```
   sk_test_51SejR9JaRzbzvXVdZC8uRoLSY4uc389LZZOeHTwlm73C5RQQZaV4JGXUrrS3CiIEEzgjKpNlwiunrHYpy8Kd8AFM00VRcUhGYH
   ```
4. **Guarda** los cambios

---

## 📋 Paso 3: Esperar Redeploy

Railway **redesplegará automáticamente** después de cambiar la variable.

Espera 1-2 minutos y verifica los logs. Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ STRIPE_SECRET_KEY configurada
```

---

## 📋 Paso 4: Deploy del Frontend

Después de que Railway termine el redeploy, haz deploy del frontend:

```bash
npm run build
firebase deploy --only hosting
```

---

## ✅ Después de Todo

1. **Espera el redeploy de Railway** (1-2 min)
2. **Haz deploy del frontend**
3. **Prueba con tarjeta de prueba:**
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVV: Cualquier 3 dígitos

---

## ✅ Checklist

- [x] Modo cambiado a 'test' en stripe-config.js
- [x] Publishable Key de TEST actualizada
- [ ] **Secret Key de TEST actualizada en Railway** (hazlo ahora)
- [ ] Deploy del frontend
- [ ] Probar con tarjeta de prueba

---

**Después de actualizar la Secret Key en Railway, estarás listo para probar.** 🚀

