# 🔑 Cómo Configurar las Claves de Stripe - Paso a Paso

## 📋 Paso 1: Crear Cuenta en Stripe

1. Ve a https://stripe.com
2. Haz clic en "Sign up" (Registrarse)
3. Completa el formulario con:
   - Email
   - Contraseña
   - Nombre
   - País (México)
4. Verifica tu email
5. Completa la información de tu negocio (puedes usar datos de prueba)

## 📋 Paso 2: Obtener tus Claves de API

### Para Modo de Prueba (Desarrollo):

1. Una vez dentro del Dashboard de Stripe
2. Ve a la sección **"Developers"** (Desarrolladores) en el menú lateral
3. Haz clic en **"API keys"** (Claves API)
4. Verás dos claves importantes:

   **a) Publishable key (Clave Pública):**
   - Empieza con `pk_test_...`
   - Esta es la que usas en el frontend
   - Ejemplo: `pk_test_51QaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890`

   **b) Secret key (Clave Secreta):**
   - Empieza con `sk_test_...`
   - Esta es la que usas en el backend
   - ⚠️ **NUNCA** la expongas en el frontend
   - Ejemplo: `sk_test_51QaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890`

5. Haz clic en **"Reveal test key"** (Revelar clave de prueba) para ver la Secret key

## 📋 Paso 3: Configurar en el Frontend

1. Abre el archivo: `assets/scripts/stripe-config.js`

2. Encuentra esta línea:
   ```javascript
   publishableKey: 'pk_test_51Q...', // ⚠️ CAMBIAR ESTA CLAVE
   ```

3. Reemplaza `pk_test_51Q...` con tu **Publishable key** real:
   ```javascript
   publishableKey: 'pk_test_51QaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890',
   ```

4. Configura la URL de tu backend:
   ```javascript
   backendUrl: 'http://localhost:3000', // Para desarrollo local
   // O en producción:
   // backendUrl: 'https://tu-dominio.com',
   ```

5. Guarda el archivo

## 📋 Paso 4: Configurar en el Backend

1. Ve a la carpeta `backend-example/`

2. Crea un archivo llamado `.env` (si no existe)

3. Agrega tu **Secret key**:
   ```
   STRIPE_SECRET_KEY=sk_test_51QaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
   PORT=3000
   ```

4. ⚠️ **IMPORTANTE:** 
   - El archivo `.env` NO debe subirse a Git
   - Ya está en `.gitignore` para proteger tus claves

5. Guarda el archivo

## 📋 Paso 5: Verificar la Configuración

### Verificar Frontend:

1. Abre `pages/demo.html` en tu navegador
2. Abre la consola del navegador (F12)
3. Deberías ver: `✅ Stripe Integration cargado`
4. Si ves: `⚠️ Stripe no está configurado`, verifica que:
   - La clave en `stripe-config.js` sea correcta
   - No tenga espacios extra
   - Empiece con `pk_test_` o `pk_live_`

### Verificar Backend:

1. Ve a `backend-example/`
2. Ejecuta: `npm install` (si no lo has hecho)
3. Ejecuta: `npm start`
4. Deberías ver: `🚀 Servidor corriendo en http://localhost:3000`
5. Si hay error, verifica que:
   - El archivo `.env` exista
   - La Secret key sea correcta
   - No tenga espacios extra

## 🧪 Paso 6: Probar con Tarjetas de Prueba

Stripe proporciona tarjetas de prueba para desarrollo:

### Tarjetas de Prueba Exitosas:
- **Número:** `4242 4242 4242 4242`
- **CVC:** Cualquier 3 dígitos (ej: `123`)
- **Fecha:** Cualquier fecha futura (ej: `12/25`)
- **ZIP:** Cualquier código postal (ej: `12345`)

### Otras Tarjetas de Prueba:
- **Requiere autenticación:** `4000 0025 0000 3155`
- **Tarjeta rechazada:** `4000 0000 0000 0002`
- **Tarjeta insuficiente:** `4000 0000 0000 9995`

## 🔒 Seguridad - Reglas Importantes

1. ✅ **Publishable key** → Solo en el frontend (es segura de exponer)
2. ✅ **Secret key** → Solo en el backend (NUNCA en el frontend)
3. ✅ **Modo Test** → Usa `pk_test_` y `sk_test_` para desarrollo
4. ✅ **Modo Live** → Usa `pk_live_` y `sk_live_` para producción
5. ✅ **No subas** el archivo `.env` a Git
6. ✅ **Usa HTTPS** en producción

## 📝 Ejemplo Completo de Configuración

### Frontend (`assets/scripts/stripe-config.js`):
```javascript
window.STRIPE_CONFIG = {
    publishableKey: 'pk_test_51QaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890',
    backendUrl: 'http://localhost:3000',
    currency: 'mxn',
    mode: 'test'
};
```

### Backend (`backend-example/.env`):
```
STRIPE_SECRET_KEY=sk_test_51QaBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
PORT=3000
```

## 🚀 Para Producción

Cuando estés listo para producción:

1. En Stripe Dashboard, cambia a modo **"Live"**
2. Obtén tus claves de producción (`pk_live_...` y `sk_live_...`)
3. Actualiza `stripe-config.js` con la clave de producción
4. Actualiza `.env` del backend con la Secret key de producción
5. Cambia `mode: 'live'` en `stripe-config.js`
6. Actualiza `backendUrl` con tu dominio real
7. Configura HTTPS en tu servidor

## 🐛 Solución de Problemas

### Error: "Stripe no está configurado"
- Verifica que `stripe-config.js` tenga tu clave
- Asegúrate de que no tenga espacios al inicio o final
- Verifica que la clave empiece con `pk_test_` o `pk_live_`

### Error: "Invalid API Key"
- Verifica que estés usando la clave correcta (test vs live)
- Asegúrate de copiar la clave completa
- No debe tener saltos de línea

### Error: "No se pudo conectar con el servidor"
- Verifica que tu backend esté corriendo
- Verifica que `backendUrl` sea correcta
- Revisa que no haya problemas de CORS

### El pago se procesa pero no se genera la licencia
- Verifica que el endpoint `/api/verify-payment` funcione
- Revisa los logs del backend
- Verifica que `generate-licenses.js` esté cargado

## 📞 Recursos Adicionales

- **Documentación de Stripe:** https://stripe.com/docs
- **Dashboard de Stripe:** https://dashboard.stripe.com
- **Tarjetas de Prueba:** https://stripe.com/docs/testing

---

¿Necesitas ayuda? Revisa los logs en la consola del navegador (F12) para más detalles.
