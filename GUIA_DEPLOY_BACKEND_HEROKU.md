# 🟣 Guía de Deploy del Backend en Heroku

**Heroku es una opción popular y confiable para desplegar el backend.**

---

## ✅ Ventajas de Heroku

- ✅ **Gratis** con límites (plan Hobby)
- ✅ **Fácil de usar** con CLI
- ✅ **Buena documentación**
- ✅ **HTTPS automático**
- ⚠️ Puede "dormir" después de inactividad (solución: UptimeRobot)

---

## 📋 Paso 1: Instalar Heroku CLI

### Windows

1. Descarga el instalador desde: https://devcenter.heroku.com/articles/heroku-cli
2. Ejecuta el instalador
3. Reinicia tu terminal

### Verificar Instalación

```bash
heroku --version
```

Deberías ver algo como: `heroku/7.x.x`

---

## 📋 Paso 2: Login en Heroku

```bash
heroku login
```

Esto abrirá tu navegador para iniciar sesión. Si no tienes cuenta, créala en [heroku.com](https://heroku.com).

---

## 📋 Paso 3: Preparar el Backend

### 3.1 Navegar al Directorio

```bash
cd backend-example
```

### 3.2 Crear archivo `Procfile`

Crea un archivo llamado `Procfile` (sin extensión) en `backend-example/`:

```
web: node server.js
```

Esto le dice a Heroku cómo iniciar tu aplicación.

### 3.3 Verificar `package.json`

Asegúrate de que `package.json` tenga el script `start`:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

---

## 📋 Paso 4: Inicializar Git (Si No Está Inicializado)

```bash
# Si no tienes git inicializado en backend-example
git init
git add .
git commit -m "Initial commit - Backend para Stripe"
```

---

## 📋 Paso 5: Crear App en Heroku

```bash
heroku create titanfleet-stripe-backend
```

Esto creará una app con el nombre `titanfleet-stripe-backend`. Si el nombre está ocupado, Heroku te sugerirá otro.

**Nota:** Puedes cambiar el nombre después en el dashboard de Heroku.

---

## 📋 Paso 6: Configurar Variables de Entorno

### 6.1 Obtener Clave LIVE de Stripe

1. Ve a [Stripe Dashboard](https://dashboard.stripe.com)
2. Cambia a modo **"Live"**
3. Ve a **Developers** > **API keys**
4. Copia la **Secret key** (`sk_live_...`)

### 6.2 Configurar en Heroku

```bash
# Configurar STRIPE_SECRET_KEY
heroku config:set STRIPE_SECRET_KEY=sk_live_TU_CLAVE_LIVE_AQUI

# Configurar PORT (opcional, Heroku lo asigna automáticamente)
heroku config:set PORT=3000

# Configurar NODE_ENV
heroku config:set NODE_ENV=production
```

### 6.3 Verificar Variables

```bash
heroku config
```

Deberías ver:
```
NODE_ENV: production
PORT: 3000
STRIPE_SECRET_KEY: sk_live_...
```

---

## 📋 Paso 7: Deploy a Heroku

### 7.1 Agregar Remote de Heroku

Si no se agregó automáticamente:

```bash
heroku git:remote -a titanfleet-stripe-backend
```

### 7.2 Hacer Deploy

```bash
git push heroku main
```

O si estás en otra rama:

```bash
git push heroku master
```

Heroku comenzará a desplegar. Verás el progreso en la terminal.

---

## 📋 Paso 8: Verificar Deploy

### 8.1 Ver Logs

```bash
heroku logs --tail
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ STRIPE_SECRET_KEY configurada
📝 Endpoints disponibles:
   POST /api/create-checkout-session
   GET  /api/verify-payment
```

### 8.2 Obtener URL

```bash
heroku info
```

O ve a: https://dashboard.heroku.com/apps/titanfleet-stripe-backend

La URL será algo como:
```
https://titanfleet-stripe-backend.herokuapp.com
```

### 8.3 Probar Endpoint

Abre en tu navegador:
```
https://titanfleet-stripe-backend.herokuapp.com/api/verify-payment?session_id=test
```

Deberías recibir un error (porque el session_id no existe), pero esto confirma que el servidor funciona.

---

## 📋 Paso 9: Configurar CORS

Si tienes problemas de CORS, edita `server.js`:

```javascript
// Cambiar:
app.use(cors());

// Por:
app.use(cors({
  origin: [
    'https://tu-dominio.firebaseapp.com',
    'https://tu-dominio.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

Luego:

```bash
git add .
git commit -m "Configurar CORS"
git push heroku main
```

---

## 📋 Paso 10: Evitar que el Servidor se "Duerma"

Heroku puede poner tu servidor en "sleep" después de 30 minutos de inactividad. Para evitarlo:

### Opción A: UptimeRobot (Gratis)

1. Ve a [uptimerobot.com](https://uptimerobot.com)
2. Crea una cuenta gratuita
3. Agrega un nuevo monitor:
   - **Type:** HTTP(s)
   - **URL:** `https://titanfleet-stripe-backend.herokuapp.com/api/verify-payment?session_id=ping`
   - **Interval:** 5 minutos
4. Esto hará ping cada 5 minutos para mantener el servidor activo

### Opción B: Plan Pago de Heroku

Si necesitas garantizar que el servidor nunca se duerma, considera el plan pago de Heroku.

---

## 📋 Paso 11: Actualizar Frontend

Abre `assets/scripts/stripe-config.js`:

```javascript
window.STRIPE_CONFIG = {
  publishableKey: 'pk_live_TU_CLAVE_LIVE_AQUI',
  backendUrl: 'https://titanfleet-stripe-backend.herokuapp.com',
  currency: 'mxn',
  mode: 'live'
};
```

---

## 🐛 Solución de Problemas

### Problema: "Build Failed"

**Solución:**
```bash
heroku logs --tail
```
Revisa los logs para ver el error específico.

### Problema: "Application Error"

**Solución:**
1. Verifica que las variables de entorno estén configuradas:
   ```bash
   heroku config
   ```
2. Verifica los logs:
   ```bash
   heroku logs --tail
   ```

### Problema: "H10 - App crashed"

**Solución:**
- Verifica que `Procfile` exista y tenga el formato correcto
- Verifica que `package.json` tenga el script `start`
- Revisa los logs para ver el error específico

---

## ✅ Checklist Final

- [ ] Heroku CLI instalado
- [ ] Login en Heroku
- [ ] App creada en Heroku
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado
- [ ] URL obtenida
- [ ] CORS configurado (si es necesario)
- [ ] UptimeRobot configurado (opcional pero recomendado)
- [ ] Frontend actualizado con URL de Heroku
- [ ] Flujo completo probado

---

## 🎉 ¡Listo!

Tu backend está desplegado en Heroku. Ahora puedes procesar pagos reales.

**Próximo paso:** Deploy del frontend a Firebase Hosting.

---

## 📞 Recursos

- **Heroku Dashboard:** https://dashboard.heroku.com
- **Heroku CLI Docs:** https://devcenter.heroku.com/articles/heroku-cli
- **Stripe Dashboard:** https://dashboard.stripe.com

---

**Última actualización:** Enero 2025

