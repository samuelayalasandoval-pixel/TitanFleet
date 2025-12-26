# 🚂 Guía de Deploy del Backend en Railway

**Railway es la opción más fácil y recomendada para desplegar el backend de Stripe.**

---

## ✅ Ventajas de Railway

- ✅ **Gratis** con límites generosos
- ✅ **Deploy automático** desde GitHub
- ✅ **HTTPS automático** (sin configuración)
- ✅ **Variables de entorno** fáciles de configurar
- ✅ **Mejor uptime** que Heroku (no se "duerme")
- ✅ **Interfaz moderna** y fácil de usar

---

## 📋 Paso 1: Preparar el Backend

### 1.1 Verificar que el backend esté listo

Asegúrate de que el archivo `backend-example/server.js` esté completo y funcional.

### 1.2 Crear archivo `.gitignore` (si no existe)

En la carpeta `backend-example/`, crea o verifica que existe `.gitignore`:

```gitignore
node_modules/
.env
.DS_Store
*.log
```

**IMPORTANTE:** Nunca subas el archivo `.env` a Git (contiene claves secretas).

---

## 📋 Paso 2: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en **"Start a New Project"**
3. Inicia sesión con **GitHub** (recomendado) o email
4. Autoriza Railway para acceder a tu repositorio

---

## 📋 Paso 3: Conectar Repositorio

1. En Railway, haz clic en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Si no ves tu repositorio:
   - Haz clic en **"Configure GitHub App"**
   - Selecciona el repositorio
   - Autoriza el acceso
4. Selecciona tu repositorio del proyecto ERP
5. Railway detectará automáticamente el proyecto

---

## 📋 Paso 4: Configurar el Proyecto

### 4.1 Seleccionar Directorio del Backend

1. Railway mostrará la configuración del proyecto
2. En **"Root Directory"**, cambia a: `backend-example`
3. Railway buscará automáticamente `package.json` y `server.js`

### 4.2 Configurar Variables de Entorno

1. Ve a la pestaña **"Variables"** en Railway
2. Haz clic en **"New Variable"**
3. Agrega las siguientes variables:

#### Variable 1: STRIPE_SECRET_KEY
- **Nombre:** `STRIPE_SECRET_KEY`
- **Valor:** `sk_live_TU_CLAVE_LIVE_AQUI` (o `sk_test_...` para pruebas)
- **Descripción:** Clave secreta de Stripe

**Para obtener la clave:**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Cambia a modo **"Live"** (toggle en la parte superior)
3. Ve a **Developers** > **API keys**
4. Copia la **Secret key** (`sk_live_...`)

#### Variable 2: PORT
- **Nombre:** `PORT`
- **Valor:** `3000`
- **Descripción:** Puerto del servidor

#### Variable 3: NODE_ENV (Opcional)
- **Nombre:** `NODE_ENV`
- **Valor:** `production`
- **Descripción:** Entorno de ejecución

### 4.3 Verificar Variables

Deberías tener estas variables configuradas:
```
STRIPE_SECRET_KEY=sk_live_...
PORT=3000
NODE_ENV=production
```

---

## 📋 Paso 5: Deploy Automático

1. Railway comenzará a desplegar automáticamente
2. Verás el progreso en la pestaña **"Deployments"**
3. Espera a que termine (2-3 minutos)
4. Cuando termine, verás **"Deploy Successful"** ✅

---

## 📋 Paso 6: Obtener URL del Backend

1. En Railway, ve a la pestaña **"Settings"**
2. Busca la sección **"Domains"**
3. Railway te dará una URL automática como:
   ```
   https://tu-proyecto.up.railway.app
   ```
4. **Copia esta URL** - la necesitarás para el frontend

**Opcional:** Puedes configurar un dominio personalizado:
1. Haz clic en **"Generate Domain"**
2. O agrega tu propio dominio en **"Custom Domain"**

---

## 📋 Paso 7: Verificar que Funciona

### 7.1 Verificar en Railway

1. Ve a la pestaña **"Deployments"**
2. Haz clic en el deployment más reciente
3. Verás los logs del servidor
4. Deberías ver:
   ```
   🚀 Servidor corriendo en http://localhost:3000
   ✅ STRIPE_SECRET_KEY configurada
   📝 Endpoints disponibles:
      POST /api/create-checkout-session
      GET  /api/verify-payment
   ```

### 7.2 Probar el Endpoint

Abre en tu navegador:
```
https://tu-proyecto.up.railway.app/api/verify-payment?session_id=test
```

Deberías recibir un error (porque el session_id no existe), pero esto confirma que el servidor está funcionando.

---

## 📋 Paso 8: Actualizar Frontend

### 8.1 Actualizar `stripe-config.js`

Abre `assets/scripts/stripe-config.js` y actualiza:

```javascript
window.STRIPE_CONFIG = {
  // Cambiar a tu Publishable Key LIVE
  publishableKey: 'pk_live_TU_CLAVE_LIVE_AQUI',
  
  // Cambiar a la URL de Railway
  backendUrl: 'https://tu-proyecto.up.railway.app',
  
  currency: 'mxn',
  
  // Cambiar a 'live' para producción
  mode: 'live'
};
```

### 8.2 Obtener Publishable Key LIVE

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Asegúrate de estar en modo **"Live"**
3. Ve a **Developers** > **API keys**
4. Copia la **Publishable key** (`pk_live_...`)

---

## 📋 Paso 9: Configurar CORS (Si es Necesario)

Si tienes problemas de CORS, edita `backend-example/server.js`:

```javascript
// Cambiar esta línea:
app.use(cors());

// Por esta (agregar tu dominio):
app.use(cors({
  origin: [
    'https://tu-dominio.firebaseapp.com',
    'https://tu-dominio.com',
    'http://localhost:3000' // Solo para desarrollo local
  ],
  credentials: true
}));
```

Luego haz commit y push - Railway desplegará automáticamente.

---

## 📋 Paso 10: Probar Flujo Completo

1. **Abre tu aplicación** en producción
2. **Ve a la página de pagos**
3. **Selecciona un plan**
4. **Completa el checkout** con una tarjeta de prueba:
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVV: Cualquier 3 dígitos
5. **Verifica** que:
   - El pago se procesa correctamente
   - La licencia se genera
   - El usuario es redirigido correctamente

---

## 🐛 Solución de Problemas

### Problema: "Deploy Failed"

**Solución:**
- Verifica que `package.json` tenga todas las dependencias
- Revisa los logs en Railway para ver el error específico
- Asegúrate de que `server.js` esté en `backend-example/`

### Problema: "STRIPE_SECRET_KEY no configurada"

**Solución:**
- Verifica que la variable de entorno esté configurada en Railway
- Asegúrate de que el nombre sea exactamente `STRIPE_SECRET_KEY`
- Verifica que el valor no tenga espacios al inicio o final

### Problema: "CORS Error"

**Solución:**
- Configura CORS en `server.js` con tu dominio
- Haz commit y push
- Railway desplegará automáticamente

### Problema: "Backend no responde"

**Solución:**
- Verifica que el deployment esté activo en Railway
- Revisa los logs en Railway
- Verifica que la URL sea correcta

---

## ✅ Checklist Final

- [ ] Backend desplegado en Railway
- [ ] Variables de entorno configuradas (STRIPE_SECRET_KEY, PORT)
- [ ] URL del backend obtenida
- [ ] `stripe-config.js` actualizado con URL de Railway
- [ ] `stripe-config.js` actualizado con Publishable Key LIVE
- [ ] Modo cambiado a 'live' en `stripe-config.js`
- [ ] CORS configurado (si es necesario)
- [ ] Flujo completo probado y funcionando

---

## 🎉 ¡Listo!

Tu backend está desplegado y funcionando. Ahora puedes procesar pagos reales en producción.

**Próximo paso:** Deploy del frontend a Firebase Hosting (si aún no lo has hecho).

---

## 📞 Recursos

- **Railway Dashboard:** https://railway.app/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Documentación Railway:** https://docs.railway.app

---

**Última actualización:** Enero 2025

