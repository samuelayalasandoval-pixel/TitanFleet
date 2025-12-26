# ✅ Webhook Creado - Pasos Finales

**¡Perfecto! Tu webhook está creado y activo.** ✅

Ahora necesitas obtener el Webhook Secret y configurarlo en Railway.

---

## 📋 Paso 1: Obtener Webhook Secret

En la pantalla que estás viendo:

1. Busca la sección **"Secreto de firma"** (Signature Secret)
2. Verás un campo con `whsec_` y puntos (está oculto)
3. Haz clic en el **ícono del ojo** 👁️ (a la derecha del campo)
4. Se revelará el secret completo: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. **Copia este secret completo** - lo necesitarás para Railway

**⚠️ IMPORTANTE:** 
- Copia todo el secret completo
- No debe tener espacios
- Debe empezar con `whsec_`

---

## 📋 Paso 2: Configurar en Railway

### 2.1 Ir a Railway

1. Ve a [Railway](https://railway.app)
2. Haz clic en tu servicio **"TitanFleet"**
3. Ve a la pestaña **"Variables"**

### 2.2 Agregar Variable

1. Haz clic en **"New Variable"** o **"+ New Variable"**
2. Configura:
   - **Nombre:** `STRIPE_WEBHOOK_SECRET`
   - **Valor:** `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (el secret que copiaste)
   - **Descripción:** Secret del webhook de Stripe (opcional)
3. **Guarda** los cambios

### 2.3 Esperar Redeploy

Railway **redesplegará automáticamente** después de guardar.

Espera 1-2 minutos y verifica los logs.

---

## 📋 Paso 3: Verificar Logs

1. Ve a la pestaña **"Logs"** en Railway
2. Deberías ver que el servidor se reinició correctamente
3. No deberías ver errores relacionados con webhooks

---

## 📋 Paso 4: Probar el Webhook

### 4.1 Desde Stripe Dashboard

1. En la pantalla del webhook que estás viendo
2. Busca un botón **"Enviar evento de prueba"** o **"Send test webhook"**
3. O ve a la pestaña **"Entregas de eventos"** (Event deliveries)
4. Haz clic en **"Enviar evento de prueba"** o similar
5. Selecciona un evento (ej: `checkout.session.completed`)
6. Haz clic en **"Enviar"**

### 4.2 Verificar en Railway Logs

1. Ve a Railway > Logs
2. Deberías ver algo como:
   ```
   ✅ Pago completado: cs_test_...
   ```
   O el evento que enviaste.

**Si ves el evento en los logs, ¡el webhook está funcionando!** ✅

---

## ✅ Checklist Final

- [x] Webhook creado en Stripe
- [x] URL configurada correctamente
- [x] Eventos seleccionados (3 eventos)
- [ ] **Webhook Secret obtenido** (hazlo ahora)
- [ ] **Variable `STRIPE_WEBHOOK_SECRET` en Railway** (hazlo ahora)
- [ ] Railway redesplegado
- [ ] Webhook probado desde Stripe
- [ ] Eventos recibidos en logs de Railway

---

## 🎯 Siguiente Acción Inmediata

**Ahora mismo, haz esto:**

1. **Haz clic en el ícono del ojo** 👁️ en "Secreto de firma"
2. **Copia el Webhook Secret** completo
3. **Agrégalo a Railway** como variable `STRIPE_WEBHOOK_SECRET`
4. **Espera el redeploy**
5. **Prueba el webhook** desde Stripe

---

## 🎉 Después de Configurar

Una vez que el webhook esté funcionando:

- ✅ Recibirás notificaciones automáticas cuando haya pagos
- ✅ El sistema será más confiable
- ✅ Podrás procesar eventos en tiempo real

---

**¿Ya obtuviste el Webhook Secret?** Si sí, agrégalo a Railway y prueba el webhook. 🚀

