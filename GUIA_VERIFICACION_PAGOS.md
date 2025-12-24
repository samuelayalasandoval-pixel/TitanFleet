# Guía de Verificación - Sistema de Pagos TitanFleet

## 🧪 Cómo Verificar que el Sistema Funcione Correctamente

### Prueba 1: Verificar Pago por Transferencia

#### Paso 1: Abrir la Página de Demo
1. Abre `pages/demo.html` en tu navegador
2. Ve a la sección "Precios" (haz clic en el menú o desplázate)

#### Paso 2: Crear una Solicitud de Transferencia
1. Haz clic en "Contratar" de cualquier plan
2. Llena el formulario:
   - **Nombre**: "Juan Pérez" (o cualquier nombre de prueba)
   - **Email**: Tu email real (para recibir confirmaciones)
   - **Teléfono**: "5551234567"
   - **Empresa**: "Empresa de Prueba" (opcional)
   - **Periodo de Pago**: Selecciona "Mensual", "Trimestral" o "Anual"
   - **Método de Pago**: Selecciona **"Transferencia Bancaria"**
   - **Comprobante de Pago**: Adjunta cualquier imagen (JPG, PNG) o PDF
   - **Mensaje**: "Prueba del sistema" (opcional)

#### Paso 3: Verificar que se Muestren los Datos Bancarios
✅ **Verifica que aparezcan:**
- CLABE: 722969010652631485
- Beneficiario: Karen Minerva Castañeda Guzman
- Institución: Mercado Pago W
- Botones para copiar cada dato

#### Paso 4: Enviar la Solicitud
1. Haz clic en "Enviar Solicitud"
2. **Verifica que:**
   - Se abra tu cliente de correo (Outlook, Gmail, etc.)
   - El destinatario sea: `samuelayalasandoval@gmail.com`
   - El asunto contenga: "Solicitud Transferencia - [Plan] - [Nombre]"
   - El cuerpo del correo incluya:
     - Información del cliente
     - Detalles del plan y precio
     - Datos bancarios proporcionados
     - Indicación si hay comprobante adjunto
     - ID de solicitud

#### Paso 5: Verificar en el Panel de Administración
1. Abre `pages/admin-pagos.html`
2. **Verifica que:**
   - Aparezca la solicitud en la lista
   - Muestre el tipo "Transferencia"
   - Estado "Pendiente"
   - Botón "Ver Comprobante" disponible
   - Al hacer clic en "Ver Detalles", se muestre toda la información
   - Al hacer clic en "Ver Comprobante", se muestre la imagen adjunta

---

### Prueba 2: Verificar Pago por Tarjeta

#### Paso 1: Abrir la Página de Demo
1. Abre `pages/demo.html` en tu navegador
2. Ve a la sección "Precios"

#### Paso 2: Crear una Solicitud de Tarjeta
1. Haz clic en "Contratar" de cualquier plan
2. Llena el formulario:
   - **Nombre**: "María González" (o cualquier nombre de prueba)
   - **Email**: Tu email real
   - **Teléfono**: "5559876543"
   - **Empresa**: "Empresa de Prueba 2" (opcional)
   - **Periodo de Pago**: Selecciona "Mensual", "Trimestral" o "Anual"
   - **Método de Pago**: Selecciona **"Tarjeta de Crédito/Débito"**
   - **Mensaje**: "Prueba de pago con tarjeta" (opcional)

#### Paso 3: Verificar Redirección
1. Haz clic en "Enviar Solicitud"
2. **Verifica que:**
   - Aparezca un mensaje de confirmación
   - Se redirija automáticamente a `pages/pago.html`
   - La página de pago cargue correctamente

#### Paso 4: Verificar Página de Pago
En la página `pago.html`, **verifica que:**
- Se muestre el resumen del plan seleccionado
- El precio sea correcto
- El periodo de pago sea el seleccionado
- El formulario de tarjeta esté disponible

#### Paso 5: Completar el Pago
1. Llena el formulario de tarjeta:
   - **Número de Tarjeta**: `4242 4242 4242 4242` (tarjeta de prueba)
   - **Vencimiento**: `12/25` (cualquier fecha futura)
   - **CVC**: `123` (cualquier 3 dígitos)
   - **Nombre en la Tarjeta**: "MARIA GONZALEZ"

2. Haz clic en "Pagar Ahora"

#### Paso 6: Verificar Procesamiento
**Verifica que:**
- Aparezca un spinner de carga
- Después de 2 segundos, se abra tu cliente de correo
- El destinatario sea: `samuelayalasandoval@gmail.com`
- El asunto contenga: "Pago Recibido - Tarjeta - [Plan] - [Nombre]"
- El cuerpo del correo incluya:
  - Información del cliente
  - Detalles del pago
  - Últimos 4 dígitos de la tarjeta
  - ID de pago y solicitud

#### Paso 7: Verificar Confirmación
**Verifica que:**
- Aparezca un modal de éxito
- El modal indique "¡Pago Exitoso!"
- Puedas hacer clic en "Volver al Inicio"

#### Paso 8: Verificar en el Panel de Administración
1. Abre `pages/admin-pagos.html`
2. **Verifica que:**
   - Aparezca el pago en la lista
   - Muestre el tipo "Tarjeta"
   - Estado "Completado"
   - Al hacer clic en "Ver Detalles", se muestre:
     - Información del cliente
     - Últimos 4 dígitos de la tarjeta
     - Detalles del pago

---

## 🔍 Verificación Técnica (Herramientas de Desarrollador)

### Verificar Datos en LocalStorage

1. Abre las **Herramientas de Desarrollador** (F12)
2. Ve a la pestaña **Application** (Chrome/Edge) o **Almacenamiento** (Firefox)
3. En el menú lateral, expande **Local Storage**
4. Haz clic en la URL de tu página

#### Para Transferencias:
Busca la clave: `titanfleet_solicitudes`
- Debe contener un array con todas las solicitudes
- Cada solicitud debe tener: `id`, `cliente`, `plan`, `precio`, `metodoPago: 'transferencia'`, `comprobante`

#### Para Tarjetas:
Busca la clave: `titanfleet_pagos`
- Debe contener un array con todos los pagos
- Cada pago debe tener: `id`, `cliente`, `plan`, `precio`, `metodo: 'tarjeta'`, `ultimos4`

#### Para Comprobantes:
Busca claves que empiecen con: `titanfleet_comprobante_`
- Debe contener el comprobante en base64

### Verificar SessionStorage

1. En las mismas herramientas, ve a **Session Storage**
2. Busca la clave: `titanfleet_payment_data`
- Solo debe existir durante el proceso de pago con tarjeta
- Se limpia automáticamente después del pago

### Verificar Consola del Navegador

1. Abre la pestaña **Console** en las herramientas de desarrollador
2. Busca mensajes de:
   - `✅ Solicitud guardada en Firebase` (si Firebase está configurado)
   - `✅ Pago guardado en Firebase` (si Firebase está configurado)
   - Cualquier error en rojo

---

## ✅ Checklist de Verificación

### Transferencia Bancaria:
- [ ] El modal se abre correctamente
- [ ] Se muestran los datos bancarios
- [ ] Los botones de copiar funcionan
- [ ] El campo de comprobante es obligatorio
- [ ] Se puede adjuntar un archivo
- [ ] Se abre el cliente de correo con el destinatario correcto
- [ ] El correo contiene toda la información
- [ ] La solicitud aparece en `admin-pagos.html`
- [ ] Se puede ver el comprobante en el panel
- [ ] Se puede validar el pago desde el panel

### Pago con Tarjeta:
- [ ] El modal se abre correctamente
- [ ] Se muestra la información sobre tarjeta
- [ ] Se redirige a la página de pago
- [ ] La página de pago muestra el resumen correcto
- [ ] El formulario de tarjeta funciona
- [ ] Los campos se formatean correctamente (espacios en número, formato MM/AA)
- [ ] Se procesa el pago correctamente
- [ ] Se abre el cliente de correo con el destinatario correcto
- [ ] El correo contiene toda la información
- [ ] Se muestra el modal de éxito
- [ ] El pago aparece en `admin-pagos.html`
- [ ] Se muestran los últimos 4 dígitos de la tarjeta

---

## 🐛 Solución de Problemas

### El correo no se abre:
1. Verifica que tengas un cliente de correo configurado en tu sistema
2. Algunos navegadores pueden pedir permiso
3. Si no funciona, copia manualmente el email: `samuelayalasandoval@gmail.com`

### La página de pago no carga:
1. Verifica que el archivo `pago.html` exista en `pages/`
2. Revisa la consola del navegador (F12) para errores
3. Verifica que las rutas de los archivos CSS/JS sean correctas

### Los datos no se guardan:
1. Verifica que localStorage esté habilitado
2. No uses modo incógnito (puede bloquear localStorage)
3. Revisa la consola para errores de JavaScript

### El comprobante no se muestra:
1. Verifica que el archivo se haya adjuntado correctamente
2. Revisa en localStorage si existe `titanfleet_comprobante_[ID]`
3. Verifica que el formato del archivo sea compatible (JPG, PNG, PDF)

---

## 📧 Verificación del Correo

### Para Transferencia:
El correo debe contener:
```
NUEVA SOLICITUD DE CONTRATACIÓN - TRANSFERENCIA BANCARIA

INFORMACIÓN DEL CLIENTE:
- Nombre: [Nombre]
- Email: [Email]
- Teléfono: [Teléfono]
- Empresa: [Empresa]

DETALLES DEL PLAN:
- Plan: [Plan]
- Periodo de pago: [Periodo]
- Precio: [Precio] MXN
- Almacenamiento: [Almacenamiento]

MÉTODO DE PAGO: Transferencia Bancaria

DATOS BANCARIOS PROPORCIONADOS AL CLIENTE:
- CLABE: 722969010652631485
- Beneficiario: Karen Minerva Castañeda Guzman
- Institución: Mercado Pago W

COMPROBANTE ADJUNTO: [Nombre del archivo] o No se adjuntó comprobante

MENSAJE ADICIONAL DEL CLIENTE:
[Mensaje]

---
ID de Solicitud: [ID]
Fecha: [Fecha]

ACCIONES REQUERIDAS:
1. Verificar el comprobante de pago (si se adjuntó)
2. Validar el pago en la cuenta bancaria
3. Generar y enviar la licencia al cliente por correo
```

### Para Tarjeta:
El correo debe contener:
```
NUEVO PAGO RECIBIDO - TARJETA

INFORMACIÓN DEL CLIENTE:
- Nombre: [Nombre]
- Email: [Email]
- Teléfono: [Teléfono]
- Empresa: [Empresa]

DETALLES DEL PAGO:
- Plan: [Plan]
- Periodo: [Periodo]
- Monto: [Precio] MXN
- Método: Tarjeta de Crédito/Débito
- Últimos 4 dígitos: [Últimos 4]

---
ID de Pago: [ID]
ID de Solicitud: [ID]
Fecha: [Fecha]

ACCIONES REQUERIDAS:
1. Verificar el pago en el sistema de pagos
2. Generar y enviar la licencia al cliente
3. Confirmar el pago al cliente por correo
```

---

## 🎯 Prueba Rápida (5 minutos)

1. **Transferencia (2 min):**
   - Abre `demo.html` → Precios → Contratar
   - Selecciona Transferencia, adjunta un comprobante, envía
   - Verifica que se abra el correo

2. **Tarjeta (3 min):**
   - Abre `demo.html` → Precios → Contratar
   - Selecciona Tarjeta, envía
   - Completa el formulario de pago
   - Verifica que se abra el correo

3. **Panel (1 min):**
   - Abre `admin-pagos.html`
   - Verifica que aparezcan ambos pagos
   - Revisa los detalles de cada uno

---

## 📝 Notas Importantes

1. **Los correos se envían a**: `samuelayalasandoval@gmail.com`
2. **Los datos se guardan en**: localStorage del navegador
3. **Los comprobantes se guardan en**: base64 en localStorage
4. **El sistema es funcional**: pero en producción necesitarás integrar un procesador de pagos real para tarjetas

---

¿Necesitas ayuda con alguna verificación específica? ¡Dime qué paso te está dando problemas!

