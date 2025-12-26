# 🔧 Solución: Railway está ejecutando el directorio incorrecto

**Problema detectado:** Railway está ejecutando el `package.json` de la raíz (frontend) en lugar del de `backend-example`.

---

## 🔍 Diagnóstico

Los logs muestran:
```
> erp-rankiao@1.0.0 start
> npm run dev & npm run serve
```

Esto es del `package.json` de la **raíz** (frontend), no del backend.

**Debería ejecutar:**
```
> titanfleet-stripe-backend@1.0.0 start
> node server.js
```

---

## ✅ Solución: Configurar Root Directory en Railway

### Paso 1: Ir a Settings del Servicio

1. En Railway, haz clic en el servicio **"TitanFleet"**
2. Ve a la pestaña **"Settings"**
3. Busca la sección **"Source"** o **"Root Directory"**

### Paso 2: Configurar Root Directory

1. Busca el campo **"Root Directory"** o **"Working Directory"**
2. Cambia el valor a: `backend-example`
3. **Guarda** los cambios

### Paso 3: Verificar package.json

Railway debería detectar automáticamente el `package.json` de `backend-example/` que tiene:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### Paso 4: Esperar Redeploy

Railway **redesplegará automáticamente** después de cambiar el Root Directory.

Espera 1-2 minutos y revisa los logs de nuevo.

---

## ✅ Verificación: Logs Correctos

Después del redeploy, los logs deberían mostrar:

```
Starting Container
> titanfleet-stripe-backend@1.0.0 start
> node server.js
🚀 Servidor corriendo en http://localhost:3000
✅ STRIPE_SECRET_KEY configurada
📝 Endpoints disponibles:
   POST /api/create-checkout-session
   GET  /api/verify-payment
   POST /api/stripe-webhook
```

**Si ves esto, ¡el backend está funcionando correctamente!** ✅

---

## 🔄 Alternativa: Si no encuentras Root Directory

Si Railway no tiene la opción "Root Directory" en Settings, puedes:

### Opción A: Crear railway.json

Crea un archivo `railway.json` en la **raíz** del proyecto:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd backend-example && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Luego haz commit y push - Railway lo detectará automáticamente.

### Opción B: Cambiar el servicio

1. En Railway, elimina el servicio actual
2. Crea un nuevo servicio
3. Al configurarlo, especifica que el directorio es `backend-example`

---

## 📋 Pasos Rápidos

1. **Settings** → Buscar **"Root Directory"** o **"Working Directory"**
2. Cambiar a: `backend-example`
3. **Guardar**
4. Esperar redeploy (1-2 min)
5. Verificar logs - deberían mostrar `node server.js`

---

## 🐛 Si Sigue Sin Funcionar

### Verificar que backend-example/package.json existe

Asegúrate de que el archivo `backend-example/package.json` tenga:

```json
{
  "name": "titanfleet-stripe-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "stripe": "^14.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### Verificar que server.js existe

Asegúrate de que `backend-example/server.js` exista y tenga el código del servidor.

---

## ✅ Checklist

- [ ] Root Directory configurado a `backend-example`
- [ ] Railway redesplegó automáticamente
- [ ] Logs muestran `node server.js` (no `npm run dev`)
- [ ] Logs muestran "🚀 Servidor corriendo"
- [ ] Backend responde en el endpoint

---

**Después de corregir esto, el backend debería funcionar correctamente.** 🚀
