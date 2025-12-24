# Backend para Stripe - TitanFleet ERP

Este es el backend necesario para procesar pagos con Stripe.

## 🚀 Instalación Rápida

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Luego edita `.env` y agrega tus claves de Stripe.

3. **Iniciar el servidor:**
   ```bash
   npm start
   ```

El servidor estará corriendo en `http://localhost:3000`

## 📝 Configuración

### Obtener Claves de Stripe

1. Ve a https://stripe.com y crea una cuenta
2. Ve al Dashboard > Developers > API keys
3. Copia tu **Secret key** (sk_test_...) y **Publishable key** (pk_test_...)
4. Agrega la Secret key a tu archivo `.env`

### Configurar el Frontend

1. Abre `assets/scripts/stripe-config.js`
2. Agrega tu **Publishable key**
3. Configura la URL del backend (por defecto: `http://localhost:3000`)

## 🔒 Seguridad

- ✅ **NUNCA** expongas tu Secret key en el frontend
- ✅ Solo usa la Publishable key en el frontend
- ✅ Valida todos los pagos en el backend
- ✅ Usa HTTPS en producción

## 📡 Endpoints

### POST `/api/create-checkout-session`
Crea una sesión de checkout de Stripe.

**Body:**
```json
{
  "plan": "0-100 registros",
  "periodo": "Mensual",
  "precio": 6500,
  "cliente": {
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "5551234567",
    "empresa": "Mi Empresa"
  },
  "solicitudId": "1234567890",
  "currency": "mxn",
  "successUrl": "https://tu-dominio.com/pages/pago-success.html?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://tu-dominio.com/pages/pago.html?canceled=true"
}
```

**Response:**
```json
{
  "id": "cs_test_..."
}
```

### GET `/api/verify-payment?session_id=xxx`
Verifica el estado de un pago.

**Response:**
```json
{
  "id": "cs_test_...",
  "status": "paid",
  "payment_status": "paid",
  "amount_total": 650000,
  "currency": "mxn",
  "customer_email": "juan@example.com",
  "metadata": {
    "plan": "0-100 registros",
    "periodo": "Mensual",
    "solicitudId": "1234567890"
  }
}
```

### POST `/api/stripe-webhook` (Opcional)
Recibe eventos de Stripe (webhooks).

## 🧪 Probar

1. Inicia el servidor: `npm start`
2. Abre `pages/demo.html` en tu navegador
3. Selecciona un plan y método "Tarjeta"
4. Usa tarjetas de prueba de Stripe:
   - **Tarjeta exitosa:** `4242 4242 4242 4242`
   - **CVC:** Cualquier 3 dígitos
   - **Fecha:** Cualquier fecha futura

## 📚 Más Información

- Documentación de Stripe: https://stripe.com/docs
- Guía completa: Ver `GUIA_INTEGRACION_STRIPE.md` en la raíz del proyecto













