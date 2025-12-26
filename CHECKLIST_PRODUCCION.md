# ✅ Checklist de Producción - TitanFleet ERP

**Última actualización:** Enero 2025  
**Estado:** ⚠️ **NO LISTO** - Requiere correcciones críticas

---

## 🎯 RESUMEN RÁPIDO

### ✅ Lo que está listo:
- ✅ Funcionalidad completa (91%)
- ✅ Documentación completa (100%)
- ✅ Arquitectura sólida (85%)
- ✅ Aviso de privacidad (LFPDPPP)
- ✅ Firebase configurado
- ✅ Frontend listo para deploy

### ❌ Lo que falta:
- ❌ **Desplegar backend de Stripe** (CRÍTICO)
- ❌ **Configurar producción** (ALTA PRIORIDAD)
- 🟡 **Mejorar seguridad** (opcional - usar Firebase Auth)

---

## 🟡 FASE 1: SEGURIDAD (Opcional - Mejoras Recomendadas)

### 1.1 Mejorar Sistema de Aprobaciones (Opcional)

**Estado Actual:**
- ✅ Password ya NO está hardcodeado
- ✅ Se obtiene desde localStorage a través de `window.getPasswordAprobacion()`
- ⚠️ **Mejora recomendada:** Usar autenticación Firebase en lugar de password

**Archivo:** `assets/scripts/cxp.js`

**Código actual (líneas 5279, 5704):**
```javascript
const correctPassword = window.getPasswordAprobacion ? window.getPasswordAprobacion() : null;
```

**Mejora recomendada (opcional):**
```javascript
const correctPassword = window.getPasswordAprobacion ? window.getPasswordAprobacion() : null;
if (!correctPassword) {
  console.error('❌ Password de aprobación no configurado');
  showError('Error de configuración: Password de aprobación no configurado');
  return false;
}
```

**O mejor aún, usar autenticación Firebase:**
```javascript
// Verificar que el usuario tenga permisos de administrador
async function verificarPermisosAprobacion() {
  try {
    const user = firebase.auth().currentUser;
    if (!user) {
      showError('Debes estar autenticado para aprobar solicitudes');
      return false;
    }
    
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    
    const isAdmin = userData?.role === 'admin' || 
                    userData?.permissions?.includes('approve_payments') ||
                    userData?.permissions?.includes('approve_cxp');
    
    if (!isAdmin) {
      showError('No tienes permisos para aprobar solicitudes');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verificando permisos:', error);
    showError('Error al verificar permisos');
    return false;
  }
}
```

**Checklist (Opcional):**
- [x] Password ya NO está hardcodeado ✅
- [ ] Implementar verificación de permisos Firebase (mejora recomendada)
- [ ] Probar que las aprobaciones funcionen correctamente
- [ ] Verificar que usuarios sin permisos no puedan aprobar

---

### 1.2 Configurar Restricciones de Firebase

**Pasos:**
1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar tu proyecto
3. Ir a **Authentication** > **Settings**
4. En **Authorized domains**, agregar solo tu dominio de producción
5. En **API restrictions**, configurar restricciones si es posible

**Checklist:**
- [ ] Agregar dominio de producción a dominios autorizados
- [ ] Remover dominios no necesarios
- [ ] Verificar que la autenticación funcione

---

## 💳 FASE 2: BACKEND DE STRIPE (CRÍTICO - 2-3 días)

### 2.1 Elegir Hosting para Backend

**Opciones recomendadas:**

#### Opción A: Heroku (Recomendado)
- ✅ Gratis con límites
- ✅ Fácil de configurar
- ✅ Buena documentación
- ⚠️ Puede "dormir" después de inactividad

#### Opción B: Railway
- ✅ Gratis con límites
- ✅ Moderno y fácil
- ✅ Mejor uptime que Heroku
- ✅ Deploy automático desde Git

#### Opción C: Render
- ✅ Gratis
- ✅ Fácil setup
- ⚠️ Puede dormir después de inactividad

**Checklist:**
- [ ] Elegir hosting (recomendado: Railway o Heroku)
- [ ] Crear cuenta en el servicio elegido

---

### 2.2 Desplegar Backend

#### Si eliges Heroku:

```bash
# 1. Instalar Heroku CLI
# Descargar de: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login
heroku login

# 3. Navegar al directorio del backend
cd backend-example

# 4. Crear app
heroku create titanfleet-stripe-backend

# 5. Configurar variables de entorno
heroku config:set STRIPE_SECRET_KEY=sk_live_TU_CLAVE_REAL
heroku config:set PORT=3000
heroku config:set NODE_ENV=production

# 6. Deploy
git init
git add .
git commit -m "Initial commit"
git push heroku main

# 7. Verificar
heroku logs --tail
```

#### Si eliges Railway:

1. Ir a [railway.app](https://railway.app)
2. Conectar tu repositorio de GitHub
3. Seleccionar el directorio `backend-example`
4. Configurar variables de entorno:
   - `STRIPE_SECRET_KEY=sk_live_...`
   - `PORT=3000`
   - `NODE_ENV=production`
5. Railway desplegará automáticamente

**Checklist:**
- [ ] Backend desplegado en hosting
- [ ] Variables de entorno configuradas
- [ ] Backend accesible públicamente (verificar URL)
- [ ] Logs funcionando correctamente

---

### 2.3 Obtener Claves LIVE de Stripe

**Pasos:**
1. Ir a [Stripe Dashboard](https://dashboard.stripe.com)
2. Cambiar de "Test mode" a **"Live mode"** (toggle en la parte superior)
3. Ir a **Developers** > **API keys**
4. Copiar:
   - **Publishable key** (`pk_live_...`)
   - **Secret key** (`sk_live_...`)

**Checklist:**
- [ ] Cuenta de Stripe en modo LIVE
- [ ] Publishable key LIVE copiada
- [ ] Secret key LIVE copiada
- [ ] Claves guardadas de forma segura

---

### 2.4 Configurar Frontend para Producción

**Archivo:** `assets/scripts/stripe-config.js`

**Cambiar:**
```javascript
window.STRIPE_CONFIG = {
  // Cambiar de pk_test_... a pk_live_...
  publishableKey: 'pk_live_TU_CLAVE_LIVE', // ⚠️ CAMBIAR
  
  // Cambiar de localhost a URL de producción
  backendUrl: 'https://tu-backend.railway.app', // ⚠️ CAMBIAR
  
  currency: 'mxn',
  
  // Cambiar de 'test' a 'live'
  mode: 'live' // ⚠️ CAMBIAR
};
```

**Checklist:**
- [ ] `publishableKey` actualizado a LIVE
- [ ] `backendUrl` actualizado a URL de producción
- [ ] `mode` cambiado a 'live'
- [ ] Verificar que la configuración se carga correctamente

---

### 2.5 Configurar CORS en Backend

**Archivo:** `backend-example/server.js`

**Verificar que CORS permita tu dominio:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://tu-dominio.firebaseapp.com',
    'https://tu-dominio.com',
    'http://localhost:3000' // Solo para desarrollo
  ],
  credentials: true
}));
```

**Checklist:**
- [ ] CORS configurado para dominio de producción
- [ ] Probar que las requests funcionen desde el frontend
- [ ] Verificar que no haya errores de CORS

---

### 2.6 Probar Flujo Completo

**Pasos:**
1. Abrir la aplicación en producción
2. Ir a la página de pagos
3. Seleccionar un plan
4. Completar el checkout de Stripe
5. Usar tarjeta de prueba de Stripe:
   - `4242 4242 4242 4242` - Pago exitoso
   - Fecha: cualquier fecha futura
   - CVV: cualquier 3 dígitos
6. Verificar que:
   - El pago se procesa correctamente
   - La licencia se genera
   - El usuario es redirigido correctamente

**Checklist:**
- [ ] Flujo de pago completo probado
- [ ] Licencia se genera correctamente
- [ ] Redirecciones funcionan
- [ ] No hay errores en consola
- [ ] Verificar logs del backend

---

## 🚀 FASE 3: DEPLOY DEL FRONTEND (1 día)

### 3.1 Preparar para Deploy

**Verificar:**
- [ ] Todos los cambios están guardados
- [ ] No hay errores en el código
- [ ] `stripe-config.js` está configurado para producción
- [ ] Todas las rutas funcionan localmente

---

### 3.2 Deploy a Firebase Hosting

```bash
# 1. Compilar estilos
npm run build

# 2. Deploy
firebase deploy --only hosting

# 3. Verificar
# Abrir la URL que Firebase proporciona
```

**Checklist:**
- [ ] Frontend desplegado en Firebase Hosting
- [ ] Todas las páginas cargan correctamente
- [ ] Assets (CSS, JS, imágenes) se cargan
- [ ] No hay errores 404
- [ ] Verificar en diferentes navegadores

---

### 3.3 Configurar Dominio Personalizado (Opcional)

**Pasos:**
1. Ir a Firebase Console > Hosting
2. Agregar dominio personalizado
3. Seguir las instrucciones de verificación DNS
4. Configurar SSL (Firebase lo hace automáticamente)

**Checklist:**
- [ ] Dominio personalizado configurado (opcional)
- [ ] SSL funcionando
- [ ] Redirecciones configuradas si es necesario

---

## 🧪 FASE 4: PRUEBAS FINALES (1-2 días)

### 4.1 Pruebas Funcionales

**Módulos a probar:**
- [ ] Autenticación (login, logout)
- [ ] Logística (crear, editar, eliminar)
- [ ] Facturación (crear, editar, eliminar)
- [ ] Tráfico (crear, editar, eliminar)
- [ ] Operadores (crear, editar, eliminar)
- [ ] Diesel (crear, editar, eliminar)
- [ ] Mantenimiento (crear, editar, eliminar)
- [ ] Tesorería (crear, editar, eliminar)
- [ ] CXC (crear, editar, eliminar)
- [ ] CXP (crear, editar, eliminar, aprobar)
- [ ] Inventario (crear, editar, eliminar)
- [ ] Configuración (catálogos, bancos, etc.)
- [ ] Reportes (generar, exportar)

**Checklist:**
- [ ] Todos los módulos probados
- [ ] CRUD funciona en todos los módulos
- [ ] Exportación funciona
- [ ] Filtros y búsqueda funcionan

---

### 4.2 Pruebas de Integración

- [ ] Datos se sincronizan entre módulos
- [ ] Integración Facturación → CXC funciona
- [ ] Integración Tráfico → Operadores funciona
- [ ] Sistema multi-tenant funciona correctamente
- [ ] Permisos de usuario funcionan

**Checklist:**
- [ ] Integraciones probadas
- [ ] Sincronización funciona
- [ ] Multi-tenant funciona

---

### 4.3 Pruebas de Navegadores

**Navegadores a probar:**
- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Edge (última versión)
- [ ] Safari (si es posible)
- [ ] Mobile (Chrome, Safari)

**Checklist:**
- [ ] Funciona en todos los navegadores principales
- [ ] Responsive funciona en móviles
- [ ] No hay errores de consola

---

### 4.4 Pruebas de Performance

- [ ] Tiempo de carga inicial < 3 segundos
- [ ] Navegación entre páginas fluida
- [ ] Tablas grandes se cargan correctamente
- [ ] No hay memory leaks

**Checklist:**
- [ ] Performance aceptable
- [ ] No hay problemas de rendimiento

---

## 📊 FASE 5: MONITOREO (Opcional pero Recomendado)

### 5.1 Configurar Monitoreo de Errores

**Opciones:**
- **Sentry** (recomendado)
- **Firebase Crashlytics**
- **LogRocket**

**Checklist:**
- [ ] Monitoreo de errores configurado
- [ ] Alertas configuradas
- [ ] Dashboard funcionando

---

### 5.2 Configurar Analytics

**Opciones:**
- **Google Analytics**
- **Firebase Analytics**

**Checklist:**
- [ ] Analytics configurado
- [ ] Eventos importantes trackeados
- [ ] Dashboard funcionando

---

### 5.3 Configurar Backups

**Firestore:**
- [ ] Backups automáticos configurados
- [ ] Frecuencia de backups definida
- [ ] Proceso de restauración documentado

**Checklist:**
- [ ] Sistema de backups configurado
- [ ] Proceso de restauración probado

---

## 📋 CHECKLIST FINAL PRE-LANZAMIENTO

### Seguridad
- [ ] Password hardcodeado eliminado
- [ ] Autenticación Firebase para aprobaciones
- [ ] Restricciones de dominio configuradas
- [ ] Firestore Rules revisadas

### Backend
- [ ] Backend desplegado y funcionando
- [ ] Variables de entorno configuradas
- [ ] CORS configurado correctamente
- [ ] HTTPS funcionando

### Frontend
- [ ] Frontend desplegado
- [ ] Stripe configurado con claves LIVE
- [ ] Modo cambiado a 'live'
- [ ] Todas las rutas funcionan

### Pagos
- [ ] Flujo de pago probado y funcionando
- [ ] Licencias se generan correctamente
- [ ] Redirecciones funcionan
- [ ] Webhooks configurados (opcional)

### Pruebas
- [ ] Todos los módulos probados
- [ ] Integraciones probadas
- [ ] Múltiples navegadores probados
- [ ] Performance aceptable

### Legal
- [x] Aviso de privacidad publicado
- [ ] Términos y condiciones (recomendado)
- [ ] Política de reembolsos (recomendado)

### Monitoreo
- [ ] Monitoreo de errores configurado
- [ ] Analytics configurado
- [ ] Backups configurados

---

## 🎯 ESTADO ACTUAL

### ✅ Completado: 4/7 fases críticas
- ✅ Documentación
- ✅ Funcionalidad
- ✅ Aviso de privacidad
- ✅ Seguridad básica (password ya no hardcodeado)

### ❌ Pendiente: 3/7 fases críticas
- ❌ Backend de Stripe (CRÍTICO)
- ❌ Configuración de producción (ALTA PRIORIDAD)
- ❌ Pruebas finales

---

## ⏱️ TIEMPO ESTIMADO

- **Fase 1 (Seguridad):** Opcional - mejoras recomendadas
- **Fase 2 (Backend):** 2-3 días (CRÍTICO)
- **Fase 3 (Deploy):** 1 día
- **Fase 4 (Pruebas):** 1-2 días
- **Fase 5 (Monitoreo):** 1 día (opcional)

**Total:** 3-5 días de trabajo enfocado (sin mejoras opcionales de seguridad)

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### Backend no responde
- Verificar que el servidor esté corriendo
- Revisar logs del hosting
- Verificar variables de entorno
- Verificar que el puerto sea correcto

### Error de CORS
- Verificar configuración de CORS en backend
- Verificar que el dominio esté en la lista de orígenes permitidos
- Verificar que el backend esté en HTTPS

### Stripe no funciona
- Verificar que las claves sean LIVE (no test)
- Verificar que el modo sea 'live'
- Verificar que el backend esté accesible
- Revisar logs de Stripe Dashboard

### Errores en producción
- Revisar consola del navegador
- Revisar logs de Firebase
- Revisar logs del backend
- Verificar que todas las rutas estén correctas

---

## 📞 SIGUIENTE PASO

**Comienza con la Fase 2 (Backend de Stripe)** - Es el bloqueante crítico para producción.

¿Necesitas ayuda con algún paso específico? Revisa la documentación en `docs/` o los archivos de guía específicos.

---

**Última actualización:** Enero 2025  
**Estado:** ⚠️ **EN PROGRESO** - Requiere correcciones antes de producción

