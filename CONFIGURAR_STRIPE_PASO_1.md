# 🔑 Paso 1: Configurar Claves de Stripe

Esta guía te ayudará a configurar las claves de Stripe para la integración real.

## 📋 Estado Actual

Veo que ya tienes algunas claves configuradas:
- ✅ **Publishable Key** en `stripe-config.js`: `pk_test_51SejR9JaRzbzvXVdSOJCppC51WxwB6szvoxSrUqs0fJ6H02Ky3aec0XKL4Nz28MKT9SyevEc8SYcz1bYxT5gDcvM00EMlb7RYY`
- ✅ **Secret Key** en `backend-example/Key.env`: `sk_test_51SejR9JaRzbzvXVdZC8uRoLSY4uc389LZZOeHTwlm73C5RQQZaV4JGXUrrS3CiIEEzgjKpNlwiunrHYpy8Kd8AFM00VRcUhGYH`

## ✅ Verificación de Configuración

### 1. Verificar que las claves sean válidas

Las claves que tienes parecen ser válidas (tienen el formato correcto):
- **Publishable Key**: Empieza con `pk_test_` ✅
- **Secret Key**: Empieza con `sk_test_` ✅

### 2. Crear archivo .env en el backend

El archivo `.env` debe estar en `backend-example/.env`. Si no existe, créalo con este contenido:

```env
# Configuración de Stripe - TitanFleet ERP
STRIPE_SECRET_KEY=sk_test_51SejR9JaRzbzvXVdZC8uRoLSY4uc389LZZOeHTwlm73C5RQQZaV4JGXUrrS3CiIEEzgjKpNlwiunrHYpy8Kd8AFM00VRcUhGYH
PORT=3000
```

**Nota**: Ya tienes un archivo `Key.env` con la clave. Puedes:
- Renombrar `Key.env` a `.env`, o
- Copiar el contenido de `Key.env` a un nuevo archivo `.env`

### 3. Verificar configuración del frontend

El archivo `assets/scripts/stripe-config.js` ya tiene la Publishable Key configurada. Verifica que:

```javascript
window.STRIPE_CONFIG = {
    publishableKey: 'pk_test_51SejR9JaRzbzvXVdSOJCppC51WxwB6szvoxSrUqs0fJ6H02Ky3aec0XKL4Nz28MKT9SyevEc8SYcz1bYxT5gDcvM00EMlb7RYY',
    backendUrl: 'http://localhost:3000',
    currency: 'mxn',
    mode: 'test'
};
```

## 🧪 Probar la Configuración

### Paso 1: Iniciar el backend

```bash
cd backend-example
npm install  # Si no has instalado las dependencias
npm start
```

Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ STRIPE_SECRET_KEY configurada
```

### Paso 2: Verificar en el navegador

1. Abre la consola del navegador (F12)
2. Abre cualquier página que cargue `stripe-config.js`
3. Deberías ver:
   ```
   📝 Stripe Config cargado
   🔑 Publishable Key: pk_test_51SejR9JaRzbzv...
   🌐 Backend URL: http://localhost:3000
   ✅ Stripe está configurado correctamente
   ```

### Paso 3: Probar conexión con el backend

Abre la consola del navegador y ejecuta:

```javascript
// Verificar configuración
console.log('Config:', window.STRIPE_CONFIG);
console.log('Está configurado:', window.isStripeConfigured());

// Probar conexión con el backend
fetch('http://localhost:3000/api/verify-payment?session_id=test')
  .then(r => r.json())
  .then(data => console.log('Backend responde:', data))
  .catch(err => console.error('Error:', err));
```

## ⚠️ Si las Claves No Funcionan

### Obtener nuevas claves de Stripe

1. Ve a https://dashboard.stripe.com/apikeys
2. Si estás en modo **Test** (recomendado para desarrollo):
   - Haz clic en "Reveal test key" para ver tu Secret Key
   - Copia la **Publishable key** (pk_test_...)
   - Copia la **Secret key** (sk_test_...)

3. Si estás en modo **Live** (producción):
   - Cambia el toggle a "Live mode"
   - Copia las claves de producción (pk_live_... y sk_live_...)

### Actualizar las claves

1. **Frontend** (`assets/scripts/stripe-config.js`):
   ```javascript
   publishableKey: 'pk_test_TU_NUEVA_CLAVE_AQUI',
   ```

2. **Backend** (`backend-example/.env`):
   ```env
   STRIPE_SECRET_KEY=sk_test_TU_NUEVA_CLAVE_AQUI
   ```

## 🔒 Seguridad

- ✅ **NUNCA** subas el archivo `.env` a Git
- ✅ **NUNCA** expongas tu Secret Key en el frontend
- ✅ Solo usa la Publishable Key en el frontend
- ✅ Usa claves de prueba (test) para desarrollo
- ✅ Usa claves de producción (live) solo en producción

## ✅ Checklist

- [ ] Archivo `.env` creado en `backend-example/` con `STRIPE_SECRET_KEY`
- [ ] `stripe-config.js` tiene la `publishableKey` configurada
- [ ] `backendUrl` está configurado correctamente
- [ ] Backend inicia sin errores
- [ ] Consola del navegador muestra "✅ Stripe está configurado correctamente"
- [ ] Backend responde en `http://localhost:3000`

## 🚀 Siguiente Paso

Una vez que todo esté configurado y funcionando, puedes pasar al **Paso 2**: Configurar el backend para producción.
