# 🔧 Solución: Error de Formato de Secret Key en Railway

**Error:** "La clave de Stripe tiene un formato inválido. Debe comenzar con sk_test_ o sk_live_"

Esto significa que la variable `STRIPE_SECRET_KEY` en Railway no está configurada correctamente.

---

## ✅ Solución: Verificar y Corregir en Railway

### Paso 1: Ir a Variables en Railway

1. Ve a [Railway](https://railway.app)
2. Haz clic en tu servicio **"TitanFleet"**
3. Ve a la pestaña **"Variables"**

### Paso 2: Verificar STRIPE_SECRET_KEY

1. Busca la variable **`STRIPE_SECRET_KEY`**
2. Haz clic en el ícono de edición (⋮ o lápiz)
3. **Verifica que el valor sea exactamente:**
   ```
   sk_test_51SejR9JaRzbzvXVdZC8uRoLSY4uc389LZZOeHTwlm73C5RQQZaV4JGXUrrS3CiIEEzgjKpNlwiunrHYpy8Kd8AFM00VRcUhGYH
   ```

### Paso 3: Problemas Comunes

**⚠️ Verifica que NO tenga:**
- Espacios al inicio o final
- Saltos de línea
- Caracteres extra
- Comillas (no deben estar)

**✅ Debe ser exactamente:**
```
sk_test_51SejR9JaRzbzvXVdZC8uRoLSY4uc389LZZOeHTwlm73C5RQQZaV4JGXUrrS3CiIEEzgjKpNlwiunrHYpy8Kd8AFM00VRcUhGYH
```

### Paso 4: Si Necesitas Reemplazarla

1. **Elimina** la variable actual (si existe)
2. **Crea una nueva** variable:
   - **Nombre:** `STRIPE_SECRET_KEY`
   - **Valor:** `sk_test_51SejR9JaRzbzvXVdZC8uRoLSY4uc389LZZOeHTwlm73C5RQQZaV4JGXUrrS3CiIEEzgjKpNlwiunrHYpy8Kd8AFM00VRcUhGYH`
3. **Guarda**

### Paso 5: Esperar Redeploy

Railway **redesplegará automáticamente** después de guardar.

Espera 1-2 minutos y verifica los logs. Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ STRIPE_SECRET_KEY configurada
```

---

## 🔍 Verificar en los Logs

1. Ve a la pestaña **"Logs"** en Railway
2. Busca el mensaje de inicio del servidor
3. Deberías ver: `✅ STRIPE_SECRET_KEY configurada`

Si ves un error o advertencia sobre la clave, significa que aún no está correcta.

---

## ✅ Después de Corregir

1. **Espera el redeploy** (1-2 min)
2. **Prueba de nuevo** el flujo de pago
3. Debería funcionar correctamente

---

## 🐛 Si Sigue Sin Funcionar

### Verificar que la Clave Sea Correcta

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Asegúrate de estar en modo **"Test"**
3. Ve a **Developers** > **API keys**
4. Haz clic en **"Reveal test key"**
5. Copia la Secret key nuevamente
6. Verifica que sea exactamente la misma que pusiste en Railway

### Verificar Formato

La clave debe:
- Empezar con `sk_test_` (para modo test)
- Tener aproximadamente 100+ caracteres
- No tener espacios ni saltos de línea

---

**Después de corregir la variable en Railway, el error debería desaparecer.** 🚀

