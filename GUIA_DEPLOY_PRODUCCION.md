# 🚀 Guía de Deployment a Producción - TitanFleet ERP

## ⚠️ IMPORTANTE: El Backend Debe Estar Siempre Disponible

**SÍ, el servidor backend DEBE estar corriendo siempre** para que los pagos funcionen. El frontend necesita conectarse al backend para:
- Crear sesiones de checkout de Stripe
- Verificar pagos después de que el usuario regresa de Stripe

---

## 📋 Checklist Pre-Deployment

### ✅ Frontend (Listo)
- [x] Código de actualización de plan implementado
- [x] Detección de actualización funcional
- [x] Redirecciones corregidas
- [x] Prevención de bucles implementada
- [x] Manejo de errores robusto

### ⚠️ Backend (Requiere Configuración)
- [ ] Servidor desplegado en un hosting (Heroku, Railway, Render, etc.)
- [ ] Variables de entorno configuradas (STRIPE_SECRET_KEY)
- [ ] URL del backend actualizada en `stripe-config.js`
- [ ] HTTPS configurado (requerido por Stripe en producción)

---

## 🔧 Configuración para Producción

### 1. **Configurar Backend en Producción**

#### Opción A: Heroku (Recomendado - Gratis)
```bash
# 1. Instalar Heroku CLI
# 2. Login
heroku login

# 3. Crear app
cd backend-example
heroku create titanfleet-stripe-backend

# 4. Configurar variables de entorno
heroku config:set STRIPE_SECRET_KEY=sk_live_TU_CLAVE_REAL
heroku config:set PORT=3000

# 5. Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main

# 6. Verificar
heroku logs --tail
```

#### Opción B: Railway (Gratis con límites)
1. Ve a https://railway.app
2. Conecta tu repositorio
3. Selecciona el directorio `backend-example`
4. Configura variables de entorno:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `PORT=3000`
5. Railway desplegará automáticamente

#### Opción C: Render (Gratis)
1. Ve a https://render.com
2. Crea un nuevo "Web Service"
3. Conecta tu repositorio
4. Configura:
   - **Build Command**: `cd backend-example && npm install`
   - **Start Command**: `cd backend-example && npm start`
   - **Environment Variables**: `STRIPE_SECRET_KEY=sk_live_...`
5. Deploy

### 2. **Actualizar Configuración del Frontend**

**Archivo**: `assets/scripts/stripe-config.js`

```javascript
// Cambiar de:
backendUrl: 'http://localhost:3000'

// A tu URL de producción:
backendUrl: 'https://tu-backend.herokuapp.com'  // o tu URL de Railway/Render
```

### 3. **Configurar Stripe para Producción**

1. Ve a https://dashboard.stripe.com
2. Cambia de "Test mode" a "Live mode"
3. Obtén tus claves LIVE:
   - **Publishable Key**: `pk_live_...`
   - **Secret Key**: `sk_live_...`
4. Actualiza:
   - Frontend: `stripe-config.js` → `publishableKey: 'pk_live_...'`
   - Backend: Variable de entorno → `STRIPE_SECRET_KEY=sk_live_...`

### 4. **Actualizar URLs de Success/Cancel**

**Archivo**: `assets/scripts/stripe-integration.js`

Verifica que las URLs sean correctas:
```javascript
successUrl: `${window.location.origin}/pages/pago-success.html?session_id={CHECKOUT_SESSION_ID}`,
cancelUrl: `${window.location.origin}/pages/pago.html?canceled=true`
```

Esto debería funcionar automáticamente, pero verifica que `window.location.origin` sea tu dominio de producción.

---

## 🔒 Seguridad en Producción

### ✅ Checklist de Seguridad

- [x] **Secret Key solo en backend** (nunca en frontend)
- [x] **Publishable Key en frontend** (seguro de exponer)
- [x] **HTTPS requerido** (Stripe lo exige en producción)
- [x] **Variables de entorno** (no hardcodeadas)
- [x] **CORS configurado** (solo tu dominio)

### ⚠️ Verificaciones Adicionales

1. **Verificar CORS en backend**:
   ```javascript
   // En server.js, asegúrate de que CORS permita tu dominio:
   app.use(cors({
     origin: 'https://tu-dominio.com',
     credentials: true
   }));
   ```

2. **Verificar que .env no esté en git**:
   - Asegúrate de que `.env` esté en `.gitignore`
   - Nunca subas claves secretas a git

---

## 📊 Monitoreo y Mantenimiento

### Servicios Recomendados para Backend

| Servicio | Plan Gratuito | Ventajas |
|----------|---------------|----------|
| **Heroku** | ✅ Sí (con límites) | Fácil, popular, buena documentación |
| **Railway** | ✅ Sí (con límites) | Moderno, fácil, buena UX |
| **Render** | ✅ Sí (con límites) | Gratis, fácil setup |
| **Vercel** | ✅ Sí | Para funciones serverless |
| **AWS/GCP** | ⚠️ Limitado | Más complejo, más control |

### Mantener el Servidor Activo

**IMPORTANTE**: Los servicios gratuitos pueden "dormir" el servidor después de inactividad. Para evitar esto:

1. **Heroku**: Usa un addon como "UptimeRobot" para hacer ping cada 5 minutos
2. **Railway**: Tiene mejor uptime en plan gratuito
3. **Render**: Puede dormir, considera el plan pago

**Alternativa**: Usa un servicio de monitoreo que haga ping a tu backend cada 5 minutos para mantenerlo activo.

---

## 🧪 Pruebas Pre-Producción

### 1. Probar con Stripe Test Mode
1. Usa claves de test (`pk_test_...`, `sk_test_...`)
2. Prueba el flujo completo
3. Verifica que todo funcione

### 2. Probar con Stripe Live Mode
1. Cambia a claves live
2. **Usa tarjetas de prueba de Stripe** (no reales):
   - `4242 4242 4242 4242` - Pago exitoso
   - `4000 0000 0000 0002` - Pago rechazado
3. Verifica que los pagos se procesen correctamente

### 3. Verificar Logs
- Revisa logs del backend para errores
- Verifica que las requests lleguen correctamente
- Monitorea errores de Stripe

---

## 📝 Archivos a Modificar para Producción

### 1. `assets/scripts/stripe-config.js`
```javascript
const STRIPE_CONFIG = {
    publishableKey: 'pk_live_TU_CLAVE_LIVE',  // Cambiar a live
    backendUrl: 'https://tu-backend.herokuapp.com',  // Cambiar a producción
    currency: 'mxn',
    mode: 'live'  // Cambiar de 'test' a 'live'
};
```

### 2. Backend `.env` (en el servidor)
```env
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_LIVE
PORT=3000
NODE_ENV=production
```

### 3. Verificar `backend-example/server.js`
- Asegúrate de que CORS permita tu dominio
- Verifica que las URLs de success/cancel sean correctas

---

## 🚨 Problemas Comunes y Soluciones

### Problema 1: "Backend no disponible"
**Solución**: 
- Verifica que el servidor esté corriendo
- Verifica la URL en `stripe-config.js`
- Verifica CORS en el backend

### Problema 2: "Error de autenticación con Stripe"
**Solución**:
- Verifica que `STRIPE_SECRET_KEY` esté configurada
- Verifica que sea la clave correcta (test vs live)
- Verifica que no tenga espacios extra

### Problema 3: "CORS error"
**Solución**:
- Configura CORS en backend para permitir tu dominio
- Verifica que el backend esté en HTTPS

### Problema 4: "Servidor se duerme"
**Solución**:
- Usa un servicio de monitoreo (UptimeRobot)
- Considera un plan pago
- O usa Railway/Render que tienen mejor uptime

---

## ✅ Checklist Final Pre-Deploy

### Frontend
- [ ] `stripe-config.js` actualizado con URL de producción
- [ ] `stripe-config.js` actualizado con Publishable Key LIVE
- [ ] Modo cambiado a 'live' en `stripe-config.js`
- [ ] URLs de success/cancel verificadas

### Backend
- [ ] Servidor desplegado en hosting
- [ ] `STRIPE_SECRET_KEY` configurada (LIVE)
- [ ] CORS configurado para tu dominio
- [ ] HTTPS habilitado
- [ ] Variables de entorno configuradas
- [ ] Logs funcionando

### Stripe
- [ ] Cuenta en modo LIVE
- [ ] Claves LIVE obtenidas
- [ ] Webhooks configurados (opcional pero recomendado)

### Pruebas
- [ ] Probar flujo completo en test mode
- [ ] Probar flujo completo en live mode (con tarjetas de prueba)
- [ ] Verificar que actualización de plan funcione
- [ ] Verificar redirecciones
- [ ] Verificar que no haya bucles

---

## 🎯 Resumen

### ✅ Frontend: Listo para Deploy
El código está completo y funcional. Solo necesitas:
1. Actualizar `stripe-config.js` con URL de producción
2. Cambiar a claves LIVE de Stripe
3. Deployar el frontend (Firebase Hosting, Netlify, etc.)

### ⚠️ Backend: Requiere Deployment
El backend **DEBE** estar desplegado y corriendo siempre. Opciones:
1. **Heroku** (recomendado - fácil)
2. **Railway** (moderno - fácil)
3. **Render** (gratis - fácil)
4. **VPS propio** (más control - más trabajo)

### 🔒 Seguridad
- ✅ Secret Key solo en backend
- ✅ HTTPS requerido
- ✅ CORS configurado
- ✅ Variables de entorno

---

## 📞 Siguiente Paso

1. **Elige un servicio para el backend** (recomiendo Heroku o Railway)
2. **Despliega el backend** siguiendo las instrucciones arriba
3. **Actualiza `stripe-config.js`** con la URL del backend
4. **Cambia a claves LIVE** de Stripe
5. **Prueba el flujo completo**
6. **Deploy del frontend**

¿Necesitas ayuda con algún paso específico del deployment?
