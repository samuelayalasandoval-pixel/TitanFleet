# Integración Logística - Tráfico

## Descripción
Este documento describe la integración implementada entre el departamento de Logística y el departamento de Tráfico, permitiendo que los datos registrados en Logística se reflejen automáticamente en la sección "Datos de Logística" del departamento de Tráfico.

## Funcionalidades Implementadas

### 1. Llenado Automático de Datos
- **Función**: `fillTraficoFromLogistica(registroId)`
- **Ubicación**: `assets/scripts/data-persistence.js`
- **Propósito**: Llena automáticamente los campos de la sección "Datos de Logística" en tráfico con los datos registrados en logística

### 2. Campos Integrados

#### Campos Básicos
- Cliente
- Ciudad Origen
- Ciudad Destino
- Referencia del Cliente
- Tipo de Servicio
- Embalaje Especial

#### Detalles del Envío
- Tipo de Plataforma
- Tipo de Mercancía
- Peso (kg)
- Largo (m)
- Ancho (m)
- Fecha de Envío
- Observaciones de Logística

### 3. Búsqueda y Llenado
- **Función**: `searchAndFillData(registroId)`
- **Propósito**: Busca un registro por número y llena automáticamente los campos correspondientes
- **Uso**: Ingresar número de registro en el campo correspondiente y hacer clic en "Buscar"

### 4. Persistencia de Datos
- Los datos se almacenan en `localStorage` con la clave `erp_shared_data`
- Estructura de datos organizada por departamento (registros, trafico, facturas)
- Sincronización automática entre departamentos

## Cómo Usar la Integración

### Paso 1: Registrar en Logística
1. Ir al departamento de Logística
2. Llenar el formulario con todos los datos requeridos
3. Hacer clic en "Guardar Datos" o "Registrar Envío"
4. Anotar el número de registro generado

### Paso 2: Acceder a Tráfico
1. Ir al departamento de Tráfico
2. En el campo "Número de Registro", ingresar el número del registro de logística
3. Hacer clic en el botón "Buscar"
4. Los datos de logística se llenarán automáticamente en la sección "Datos de Logística"

### Paso 3: Completar Datos de Tráfico
1. Los campos de logística aparecerán como solo lectura (rellenados automáticamente)
2. Completar los campos específicos de tráfico:
   - Lugar de Origen
   - Lugar de Destino
   - Económico Tractocamión
   - Operadores
   - Gastos de Operadores
   - Observaciones

## Funciones de Prueba

### Probar Integración
- **Botón**: "Probar Integración" en la página de tráfico
- **Función**: `testLogisticaTraficoIntegration()`
- **Propósito**: Crea datos de prueba y verifica que la integración funcione correctamente

### Debug de Datos
- **Botón**: "Debug Datos" en la página de tráfico
- **Función**: `debugShowAllData()`
- **Propósito**: Muestra todos los datos almacenados en localStorage

### Verificar Búsqueda
- **Botón**: "Verificar Búsqueda" en la página de tráfico
- **Función**: `checkSearchFunction()`
- **Propósito**: Verifica que las funciones de búsqueda estén disponibles

## Estructura de Datos

### Datos de Logística
```javascript
{
  cliente: string,
  origen: string,
  destino: string,
  referenciaCliente: string,
  tipoServicio: string,
  embalajeEspecial: string,
  descripcionEmbalaje: string,
  fechaEnvio: string,
  plataforma: string,
  mercancia: string,
  peso: number,
  largo: number,
  ancho: number,
  observaciones: string,
  estado: string,
  fechaCreacion: string,
  ultimaActualizacion: string
}
```

## Notificaciones del Sistema
- ✅ **Éxito**: Datos cargados correctamente
- ⚠️ **Advertencia**: Datos encontrados pero no se pudieron cargar
- ❌ **Error**: No se encontraron datos o error en el proceso
- ℹ️ **Info**: Información adicional del proceso

## Solución de Problemas

### Problema: Los datos no se cargan automáticamente
**Solución**:
1. Verificar que el número de registro existe en logística
2. Usar el botón "Debug Datos" para verificar los datos almacenados
3. Verificar que las dependencias estén cargadas con "Verificar Búsqueda"

### Problema: Campos no se llenan correctamente
**Solución**:
1. Verificar que los IDs de los campos coincidan con los esperados
2. Revisar la consola del navegador para mensajes de error
3. Usar la función de prueba para verificar la integración

### Problema: Datos no se guardan
**Solución**:
1. Verificar que localStorage esté disponible
2. Verificar que no haya errores de JavaScript en la consola
3. Usar el botón "Estado Sistema" para verificar el estado general

## Archivos Modificados
- `assets/scripts/data-persistence.js` - Funciones de integración y llenado automático
- `trafico.html` - Interfaz de usuario con campos adicionales de logística

## Dependencias
- `assets/scripts/auth.js` - Sistema de autenticación
- `assets/scripts/integration.js` - Sistema de integración general
- `assets/scripts/main.js` - Funcionalidades principales
- `assets/scripts/trafico-listas.js` - Gestión de listas en tráfico




















