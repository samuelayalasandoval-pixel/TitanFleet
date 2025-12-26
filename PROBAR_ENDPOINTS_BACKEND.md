# ✅ Probar Endpoints del Backend

**El error "Cannot GET /" es NORMAL** - el backend es una API, no tiene una página web en la raíz.

Tu URL del backend es: `https://titanfleet-production.up.railway.app`

---

## ✅ Probar Endpoints Específicos

### 1. Probar Endpoint de Verificación

Abre en tu navegador:

```
https://titanfleet-production.up.railway.app/api/verify-payment?session_id=test
```

**Resultado esperado:**
- Deberías recibir un JSON con un error (porque el session_id no existe)
- Esto confirma que el servidor está funcionando ✅

**Ejemplo de respuesta:**
```json
{
  "error": "session_id es requerido"
}
```

O algo similar. **Si ves un JSON (aunque sea un error), el backend está funcionando.** ✅

---

### 2. Probar con Postman o curl (Opcional)

Si quieres probar el endpoint de crear sesión:

**Con curl:**
```bash
curl -X POST https://titanfleet-production.up.railway.app/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "test",
    "precio": 100,
    "cliente": {"nombre": "Test"},
    "successUrl": "https://example.com/success",
    "cancelUrl": "https://example.com/cancel"
  }'
```

Pero esto no es necesario ahora. Lo importante es que el endpoint de verificación funcione.

---

## ✅ Confirmación

**Si el endpoint `/api/verify-payment` responde con JSON (aunque sea un error), tu backend está funcionando correctamente.** ✅

El error "Cannot GET /" es completamente normal - significa que:
- ✅ El servidor está corriendo
- ✅ Está accesible públicamente
- ✅ Solo necesita que uses los endpoints correctos (`/api/...`)

---

## 📋 Siguiente Paso

Ahora que confirmaste que el backend funciona, continúa con:

1. **Obtener Publishable Key LIVE** de Stripe
2. **Actualizar `stripe-config.js`** con:
   - Tu Publishable Key LIVE
   - La URL del backend: `https://titanfleet-production.up.railway.app`
3. **Deploy del frontend**

---

**¿El endpoint `/api/verify-payment` te responde con JSON?** Si sí, ¡estás listo para continuar! 🚀

