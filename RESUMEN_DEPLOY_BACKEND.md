# 🚀 Resumen Rápido - Deploy del Backend

**Tiempo estimado: 30-60 minutos**

---

## 🎯 Opciones de Hosting

| Opción | Dificultad | Tiempo | Recomendado |
|--------|------------|--------|-------------|
| **Railway** | ⭐ Fácil | 20 min | ✅ **SÍ** |
| **Heroku** | ⭐⭐ Medio | 30 min | ✅ Sí |
| **Render** | ⭐⭐ Medio | 30 min | ✅ Sí |

**Recomendación:** Empieza con **Railway** - es la más fácil.

---

## 📋 Pasos Rápidos (Railway)

### 1. Crear cuenta en Railway
- Ve a [railway.app](https://railway.app)
- Inicia sesión con GitHub

### 2. Crear nuevo proyecto
- Haz clic en "New Project"
- Selecciona "Deploy from GitHub repo"
- Selecciona tu repositorio

### 3. Configurar
- **Root Directory:** `backend-example`
- **Variables de entorno:**
  - `STRIPE_SECRET_KEY=sk_live_...`
  - `PORT=3000`
  - `NODE_ENV=production`

### 4. Obtener URL
- Railway te dará una URL como: `https://tu-proyecto.up.railway.app`
- **Copia esta URL**

### 5. Actualizar Frontend
- Abre `assets/scripts/stripe-config.js`
- Cambia `backendUrl` a la URL de Railway
- Cambia `publishableKey` a tu clave LIVE
- Cambia `mode` a `'live'`

### 6. Probar
- Abre tu aplicación
- Prueba el flujo de pago completo

---

## 📚 Guías Detalladas

- **Railway:** Ver `GUIA_DEPLOY_BACKEND_RAILWAY.md`
- **Heroku:** Ver `GUIA_DEPLOY_BACKEND_HEROKU.md`

---

## ✅ Checklist Rápido

- [ ] Backend desplegado
- [ ] Variables de entorno configuradas
- [ ] URL del backend obtenida
- [ ] `stripe-config.js` actualizado
- [ ] Claves LIVE configuradas
- [ ] Flujo probado

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa las guías detalladas
2. Verifica los logs del servidor
3. Asegúrate de que las variables de entorno estén correctas

---

**¡Listo para empezar!** 🚀

