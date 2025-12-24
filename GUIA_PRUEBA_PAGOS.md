# Guía de Prueba - Sistema de Pagos TitanFleet

## 📋 Pasos para Probar el Sistema de Pagos

### 1. Abrir la Página de Demo

**Opción A: Abrir directamente el archivo**
1. Navega a la carpeta del proyecto
2. Abre `pages/demo.html` en tu navegador
3. O haz doble clic en el archivo

**Opción B: Usar un servidor local (recomendado)**
```bash
# Si tienes Python instalado:
python -m http.server 8000

# O si tienes Node.js:
npx http-server -p 8000
```
Luego abre en el navegador: `http://localhost:8000/pages/demo.html`

---

## 🧪 Prueba 1: Flujo de Pago por Transferencia

### Pasos:
1. **Ir a la sección de Precios**
   - En la página de demo, haz clic en "Precios" en el menú superior
   - O desplázate hasta la sección de precios

2. **Seleccionar un Plan**
   - Haz clic en el botón "Contratar" de cualquier plan
   - Se abrirá el modal de contratación

3. **Llenar el Formulario:**
   - **Nombre Completo**: Ingresa un nombre de prueba (ej: "Juan Pérez")
   - **Email**: Ingresa tu email de prueba
   - **Teléfono**: Ingresa un teléfono (ej: "5551234567")
   - **Empresa**: (Opcional) Ingresa un nombre de empresa
   - **Periodo de Pago**: Selecciona "Mensual", "Trimestral" o "Anual"
   - **Método de Pago**: Selecciona **"Transferencia Bancaria"**
   - **Mensaje Adicional**: (Opcional) Escribe un mensaje

4. **Enviar Solicitud:**
   - Haz clic en "Enviar Solicitud"
   - Se abrirá tu cliente de correo (Outlook, Gmail, etc.)
   - Verifica que el correo esté dirigido a: `samuelayalasandoval@gmail.com`
   - Verifica que el asunto sea: "Solicitud Transferencia - [Plan] - [Nombre]"
   - Verifica que el cuerpo del correo contenga:
     - Información del cliente
     - Detalles del plan
     - Precio y periodo
     - ID de solicitud
     - Instrucciones de acciones requeridas

5. **Verificar Confirmación:**
   - Deberías ver un mensaje de éxito (toast) en la página
   - El mensaje debe indicar que se envió la solicitud
   - El modal debe cerrarse automáticamente

### ✅ Qué Verificar:
- [ ] El modal se abre correctamente
- [ ] Los campos del formulario funcionan
- [ ] El precio se actualiza según el periodo seleccionado
- [ ] Se muestra la información correcta sobre transferencia
- [ ] Se abre el cliente de correo con el destinatario correcto
- [ ] El correo contiene toda la información necesaria
- [ ] Se muestra el mensaje de confirmación
- [ ] La solicitud se guarda en localStorage (puedes verificar en DevTools)

---

## 💳 Prueba 2: Flujo de Pago por Tarjeta

### Pasos:
1. **Ir a la sección de Precios**
   - En la página de demo, haz clic en "Precios" en el menú superior
   - O desplázate hasta la sección de precios

2. **Seleccionar un Plan**
   - Haz clic en el botón "Contratar" de cualquier plan
   - Se abrirá el modal de contratación

3. **Llenar el Formulario:**
   - **Nombre Completo**: Ingresa un nombre de prueba (ej: "María González")
   - **Email**: Ingresa tu email de prueba
   - **Teléfono**: Ingresa un teléfono (ej: "5559876543")
   - **Empresa**: (Opcional) Ingresa un nombre de empresa
   - **Periodo de Pago**: Selecciona "Mensual", "Trimestral" o "Anual"
   - **Método de Pago**: Selecciona **"Tarjeta de Crédito/Débito"**
   - **Mensaje Adicional**: (Opcional) Escribe un mensaje

4. **Enviar Solicitud:**
   - Haz clic en "Enviar Solicitud"
   - Deberías ver un mensaje de redirección
   - Serás redirigido a la página `pago.html`

5. **En la Página de Pago:**
   - Verifica que se muestre el resumen del plan
   - Verifica que el precio sea correcto
   - Llena el formulario de tarjeta:
     - **Número de Tarjeta**: Prueba con `4242 4242 4242 4242` (tarjeta de prueba)
     - **Vencimiento**: Prueba con `12/25` (cualquier fecha futura)
     - **CVC**: Prueba con `123` (cualquier 3 dígitos)
     - **Nombre en la Tarjeta**: Ingresa un nombre

6. **Procesar el Pago:**
   - Haz clic en "Pagar Ahora"
   - Verás un spinner de carga
   - Después de 2 segundos, se abrirá tu cliente de correo
   - Verifica que el correo esté dirigido a: `samuelayalasandoval@gmail.com`
   - Verifica que el asunto sea: "Pago Recibido - Tarjeta - [Plan] - [Nombre]"
   - Verifica que el cuerpo del correo contenga:
     - Información del cliente
     - Detalles del pago
     - Últimos 4 dígitos de la tarjeta
     - ID de pago y solicitud

7. **Verificar Confirmación:**
   - Deberías ver un modal de éxito
   - El modal debe indicar que el pago fue exitoso
   - Puedes hacer clic en "Volver al Inicio"

### ✅ Qué Verificar:
- [ ] El modal se abre correctamente
- [ ] Los campos del formulario funcionan
- [ ] El precio se actualiza según el periodo seleccionado
- [ ] Se muestra la información correcta sobre tarjeta
- [ ] Se redirige correctamente a la página de pago
- [ ] La página de pago muestra el resumen correcto
- [ ] El formulario de tarjeta formatea correctamente los números
- [ ] El pago se procesa correctamente
- [ ] Se abre el cliente de correo con el destinatario correcto
- [ ] El correo contiene toda la información necesaria
- [ ] Se muestra el modal de éxito
- [ ] El pago se guarda en localStorage (puedes verificar en DevTools)

---

## 🔍 Verificar Datos Guardados

### En el Navegador (Chrome/Edge):
1. Abre las **Herramientas de Desarrollador** (F12)
2. Ve a la pestaña **Application** (o **Almacenamiento**)
3. En el menú lateral, expande **Local Storage**
4. Haz clic en la URL de tu página
5. Busca las siguientes claves:
   - `titanfleet_solicitudes` - Contiene todas las solicitudes
   - `titanfleet_pagos` - Contiene todos los pagos procesados

### En Session Storage:
1. En las mismas herramientas, ve a **Session Storage**
2. Busca la clave:
   - `titanfleet_payment_data` - Datos temporales del pago (se limpia después del pago)

---

## 🐛 Solución de Problemas

### El modal no se abre:
- Verifica que Bootstrap esté cargado correctamente
- Revisa la consola del navegador (F12) para errores
- Asegúrate de que el archivo `demo-utils.js` esté cargado

### El correo no se abre:
- Verifica que tengas un cliente de correo configurado
- En algunos navegadores, puede pedir permiso para abrir el cliente
- Si no funciona, copia manualmente el email del código

### La página de pago no carga:
- Verifica que el archivo `pago.html` exista en la carpeta `pages/`
- Revisa la consola del navegador para errores de ruta
- Asegúrate de que las rutas de los archivos CSS/JS sean correctas

### Los datos no se guardan:
- Verifica que localStorage esté habilitado en tu navegador
- Revisa la consola para errores de JavaScript
- Asegúrate de que no estés en modo incógnito (puede bloquear localStorage)

---

## 📝 Notas Importantes

1. **Correos de Prueba**: Los correos se envían a `samuelayalasandoval@gmail.com`. En producción, esto se puede cambiar.

2. **Pagos con Tarjeta**: Actualmente es una simulación. Para producción, necesitarás integrar un procesador de pagos real (Stripe, PayPal, etc.).

3. **Datos de Prueba**: Puedes usar cualquier dato de prueba. Los números de tarjeta no se validan realmente en esta versión.

4. **LocalStorage**: Los datos se guardan localmente en tu navegador. Si limpias el caché, se perderán.

5. **Firebase**: Si tienes Firebase configurado, los datos también se intentarán guardar allí. Si no está configurado, solo se guardarán en localStorage.

---

## 🎯 Próximos Pasos para Producción

1. **Integrar Procesador de Pagos Real**:
   - Stripe
   - PayPal
   - Mercado Pago
   - Otro procesador de tu elección

2. **Configurar Backend**:
   - Endpoint para procesar pagos
   - Validación de pagos
   - Generación automática de licencias

3. **Sistema de Notificaciones**:
   - Email automático al cliente
   - Email automático al administrador
   - Confirmación de pago

4. **Panel de Administración**:
   - Ver todas las solicitudes
   - Validar pagos por transferencia
   - Generar y enviar licencias
   - Ver historial de pagos

