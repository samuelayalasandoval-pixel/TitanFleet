# 🚀 Inicio Rápido - Deploy a Producción

**Guía paso a paso para poner tu aplicación en producción**

---

## 📋 Resumen

**Tiempo total:** 1-2 horas  
**Dificultad:** ⭐⭐ Media  
**Costo:** Gratis (con límites)

---

## 🎯 Paso 1: Obtener Claves LIVE de Stripe (10 min)

### 1.1 Crear/Acceder a Cuenta Stripe

1. Ve a [stripe.com](https://stripe.com)
2. Crea una cuenta o inicia sesión
3. Completa la verificación de identidad (requerido para modo LIVE)

### 1.2 Obtener Claves LIVE

1. En Stripe Dashboard, cambia a modo **"Live"** (toggle en la parte superior)
2. Ve a **Developers** > **API keys**
3. Copia:
   - **Publishable key** (`pk_live_...`) - Para el frontend
   - **Secret key** (`sk_live_...`) - Para el backend

**⚠️ IMPORTANTE:** Guarda estas claves en un lugar seguro. No las compartas.

---

## 🎯 Paso 2: Desplegar Backend (30-60 min)

### Opción A: Railway (Recomendado - Más Fácil)

**Tiempo:** 20-30 minutos

1. Ve a [railway.app](https://railway.app) e inicia sesión con GitHub
2. Crea nuevo proyecto → "Deploy from GitHub repo"
3. Selecciona tu repositorio
4. Configura:
   - **Root Directory:** `backend-example`
   - **Variables de entorno:**
     - `STRIPE_SECRET_KEY=sk_live_...`
     - `PORT=3000`
     - `NODE_ENV=production`
5. Espera el deploy (2-3 minutos)
6. Copia la URL que Railway te da (ej: `https://tu-proyecto.up.railway.app`)

**📚 Guía detallada:** Ver `GUIA_DEPLOY_BACKEND_RAILWAY.md`

### Opción B: Heroku

**Tiempo:** 30-45 minutos

1. Instala Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login: `heroku login`
3. Navega a `backend-example/`
4. Crea app: `heroku create titanfleet-stripe-backend`
5. Configura variables:
   ```bash
   heroku config:set STRIPE_SECRET_KEY=sk_live_...
   heroku config:set PORT=3000
   heroku config:set NODE_ENV=production
   ```
6. Deploy: `git push heroku main`
7. Copia la URL (ej: `https://titanfleet-stripe-backend.herokuapp.com`)

**📚 Guía detallada:** Ver `GUIA_DEPLOY_BACKEND_HEROKU.md`

---

## 🎯 Paso 3: Actualizar Frontend (10 min)

### 3.1 Actualizar `stripe-config.js`

Abre `assets/scripts/stripe-config.js` y actualiza:

```javascript
window.STRIPE_CONFIG = {
  // Tu Publishable Key LIVE
  publishableKey: 'pk_live_TU_CLAVE_LIVE_AQUI',
  
  // URL de tu backend desplegado
  backendUrl: 'https://tu-proyecto.up.railway.app', // O tu URL de Heroku
  
  currency: 'mxn',
  
  // Cambiar a 'live' para producción
  mode: 'live'
};
```

### 3.2 Verificar Configuración

Ejecuta:
```bash
npm run verify:prod
```

Esto verificará que todo esté configurado correctamente.

---

## 🎯 Paso 4: Deploy del Frontend (10 min)

### 4.1 Compilar

```bash
npm run build
```

### 4.2 Deploy a Firebase

```bash
firebase deploy --only hosting
```

O si prefieres deploy completo:

```bash
npm run deploy:all
```

### 4.3 Verificar

Abre la URL que Firebase te proporciona y verifica que todo funcione.

---

## 🎯 Paso 5: Probar Flujo Completo (15 min)

### 5.1 Probar en Producción

1. Abre tu aplicación en producción
2. Ve a la página de pagos
3. Selecciona un plan
4. Completa el checkout con una **tarjeta de prueba de Stripe:**
   - **Tarjeta:** `4242 4242 4242 4242`
   - **Fecha:** Cualquier fecha futura (ej: 12/25)
   - **CVV:** Cualquier 3 dígitos (ej: 123)
   - **ZIP:** Cualquier código postal (ej: 12345)

### 5.2 Verificar

- ✅ El pago se procesa correctamente
- ✅ La licencia se genera
- ✅ El usuario es redirigido correctamente
- ✅ No hay errores en la consola

---

## ✅ Checklist Final

### Backend
- [ ] Backend desplegado (Railway/Heroku)
- [ ] Variables de entorno configuradas
- [ ] URL del backend obtenida
- [ ] Backend responde correctamente

### Frontend
- [ ] `stripe-config.js` actualizado con Publishable Key LIVE
- [ ] `stripe-config.js` actualizado con URL del backend
- [ ] Modo cambiado a 'live'
- [ ] Frontend desplegado en Firebase

### Pruebas
- [ ] Flujo de pago probado con tarjeta de prueba
- [ ] Licencia se genera correctamente
- [ ] No hay errores en consola
- [ ] Redirecciones funcionan

---

## 🐛 Problemas Comunes

### "Backend no responde"

**Solución:**
- Verifica que el backend esté desplegado y activo
- Revisa los logs en Railway/Heroku
- Verifica que la URL sea correcta

### "CORS Error"

**Solución:**
- Edita `backend-example/server.js`
- Configura CORS con tu dominio:
  ```javascript
  app.use(cors({
    origin: ['https://tu-dominio.firebaseapp.com'],
    credentials: true
  }));
  ```
- Haz commit y push (Railway/Heroku desplegará automáticamente)

### "Stripe Error"

**Solución:**
- Verifica que las claves sean LIVE (no test)
- Verifica que el modo sea 'live'
- Revisa los logs de Stripe Dashboard

---

## 📚 Documentación Adicional

- **Guía Railway:** `GUIA_DEPLOY_BACKEND_RAILWAY.md`
- **Guía Heroku:** `GUIA_DEPLOY_BACKEND_HEROKU.md`
- **Resumen Backend:** `RESUMEN_DEPLOY_BACKEND.md`
- **Checklist Producción:** `CHECKLIST_PRODUCCION.md`
- **Evaluación Mercado:** `EVALUACION_MERCADO_PRODUCCION.md`

---

## 🎉 ¡Listo!

Tu aplicación está en producción y lista para recibir pagos reales.

**Próximos pasos:**
1. Monitorea los pagos en Stripe Dashboard
2. Revisa los logs regularmente
3. Configura alertas (opcional)
4. Considera configurar webhooks (opcional pero recomendado)

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa las guías detalladas
2. Verifica los logs del servidor
3. Asegúrate de que todas las variables estén correctas
4. Prueba con tarjetas de prueba primero antes de usar tarjetas reales

---

**¡Éxito con tu lanzamiento!** 🚀

---

**Última actualización:** Enero 2025

