# 🚀 Acceso Rápido al Plan de Prueba

**Plan de prueba creado: $10 MXN**

---

## 📋 Forma Más Rápida: URL Directa

**Copia y pega esta URL en tu navegador:**

```
https://tu-dominio.firebaseapp.com/pages/pago.html?plan=prueba&periodo=mensual&precio=10&planLevel=prueba
```

**Reemplaza `tu-dominio.firebaseapp.com` con tu URL real de Firebase Hosting.**

---

## 📋 O desde Localhost (Desarrollo)

```
http://localhost:3000/pages/pago.html?plan=prueba&periodo=mensual&precio=10&planLevel=prueba
```

---

## ✅ Pasos para Probar

1. **Abre la URL** de arriba (reemplaza con tu dominio)
2. **Verás el plan de prueba** con precio de $10 MXN
3. **Haz clic en "Continuar con Stripe Checkout"**
4. **Completa el pago** con una tarjeta real
5. **Verifica el webhook** en Stripe Dashboard y Railway Logs

---

## 🔍 Verificar Webhook

**Después del pago:**

1. **Stripe Dashboard** > Webhooks > Tu webhook > "Entregas de eventos"
   - Deberías ver `checkout.session.completed` ✅

2. **Railway** > Logs
   - Deberías ver: `✅ Pago completado: cs_live_...` ✅

---

**¿Listo?** Usa la URL de arriba y prueba el webhook con un pago de $10 MXN. 🚀

