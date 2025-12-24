# Sistema de Licencias - TitanFleet ERP

## Descripción

Este sistema permite vender y rentar el software ERP con licencias únicas por cliente, garantizando que cada cliente tenga sus propios datos privados y separados.

## Características

- ✅ **Licencias únicas por cliente**: Cada cliente tiene su propio `tenantId` y espacio de datos
- ✅ **Soporte para venta y renta**: Diferentes tipos de licencias
- ✅ **Validación de licencias**: Sistema de validación de claves
- ✅ **Expiración automática**: Para licencias de renta
- ✅ **Separación de datos**: Cada cliente solo ve sus propios datos

## Cómo Funciona

### 1. Generación de Licencias

Para vender o rentar el software, necesitas generar claves de licencia únicas:

**Formato de licencia:**
- Venta: `TITAN-VENTA-XXXX-XXXX` (permanente)
- Renta: `TITAN-RENTA-XXXX-XXXX` (temporal, 30 días por defecto)

**Ejemplo de generación:**
```javascript
// Generar licencia de venta
const licenseKey = 'TITAN-VENTA-' + generateRandomCode(4) + '-' + generateRandomCode(4);

// Generar licencia de renta
const licenseKey = 'TITAN-RENTA-' + generateRandomCode(4) + '-' + generateRandomCode(4);
```

### 2. Activación de Licencia

El cliente activa su licencia ingresando la clave en el sistema:

1. Al iniciar el sistema, aparece un modal pidiendo la licencia
2. El cliente ingresa su clave de licencia
3. El sistema valida y configura el `tenantId` único
4. Todos los datos se guardan con ese `tenantId`

### 3. Separación de Datos

Cada licencia genera un `tenantId` único basado en la clave:
- Licencia: `TITAN-VENTA-ABCD-1234`
- TenantId: `tenant_titanventaabcd1234`

Todos los datos se guardan con este `tenantId`, garantizando privacidad.

## Implementación

### Paso 1: Agregar los archivos

1. Agregar `assets/scripts/license-manager.js` a todas las páginas HTML:
```html
<script src="assets/scripts/license-manager.js"></script>
```

2. Agregar `assets/scripts/license-ui.html` al final del body de `index.html`:
```html
<!-- Al final del body, antes de cerrar </body> -->
<script src="assets/scripts/license-ui.html"></script>
```

### Paso 2: Generar Licencias para Vender

Crea un script o sistema para generar licencias:

```javascript
// Ejemplo: generar 10 licencias de venta
function generateSaleLicenses(count) {
    const licenses = [];
    for (let i = 0; i < count; i++) {
        const code1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        licenses.push(`TITAN-VENTA-${code1}-${code2}`);
    }
    return licenses;
}

// Generar licencias
const saleLicenses = generateSaleLicenses(10);
console.log('Licencias de venta:', saleLicenses);
```

### Paso 3: Validación con Servidor (Opcional)

Para mayor seguridad, puedes validar las licencias con un servidor:

```javascript
// En license-manager.js, modificar validateLicense:
async validateLicense(licenseKey) {
    try {
        // Validar con servidor
        const response = await fetch('https://tu-servidor.com/validate-license', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenseKey })
        });
        
        const result = await response.json();
        
        if (result.valid) {
            // Guardar licencia
            this.saveLicense(result.license);
            return { valid: true, license: result.license };
        } else {
            return { valid: false, error: result.error };
        }
    } catch (error) {
        // Fallback a validación local
        return this.validateLicenseLocal(licenseKey);
    }
}
```

## Precios Sugeridos

### Venta (Licencia Permanente)
- Precio: $XXX USD (una vez)
- Incluye: Uso ilimitado, actualizaciones por 1 año
- Formato: `TITAN-VENTA-XXXX-XXXX`

### Renta (Suscripción Mensual)
- Precio: $XX USD/mes
- Incluye: Uso durante el período pagado, soporte técnico
- Formato: `TITAN-RENTA-XXXX-XXXX`
- Expiración: 30 días (configurable)

## Flujo de Venta

1. **Cliente compra/renta** → Recibe clave de licencia
2. **Cliente instala/abre** → Sistema pide activación
3. **Cliente ingresa clave** → Sistema valida y configura
4. **Cliente usa el sistema** → Todos los datos son privados

## Seguridad

- Cada licencia tiene un `tenantId` único
- Los datos están separados por `tenantId` en Firebase
- No hay forma de que un cliente vea datos de otro
- Las licencias de renta expiran automáticamente

## Personalización

### Cambiar duración de renta:
En `license-manager.js`, línea ~50:
```javascript
expiresAt.setDate(expiresAt.getDate() + 30); // Cambiar 30 por los días deseados
```

### Desactivar modo demo compartido:
```javascript
localStorage.setItem('useSharedDemo', 'false');
```

### Configurar tenantId manualmente:
```javascript
localStorage.setItem('tenantId', 'mi_tenant_id_personalizado');
```

## Soporte

Para preguntas o problemas con el sistema de licencias, contacta al desarrollador.







