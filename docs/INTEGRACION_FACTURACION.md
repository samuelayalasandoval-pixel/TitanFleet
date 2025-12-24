# Integración Automática de Datos en Facturación

## Descripción
La página de facturación ahora incluye funcionalidad para llenar automáticamente los campos de información de logística y tráfico cuando se busca un número de registro existente.

## Funcionalidades Implementadas

### 1. Llenado Automático desde Logística
Los siguientes campos se llenan automáticamente desde los datos de logística:
- **Cliente**: Nombre del cliente
- **Referencia Cliente**: Referencia proporcionada por el cliente
- **Tipo de Servicio**: Tipo de servicio contratado
- **Lugar de Origen**: Ciudad de origen del envío
- **Lugar de Destino**: Ciudad de destino del envío
- **Embalaje Especial**: Si requiere embalaje especial

### 2. Llenado Automático desde Tráfico
Los siguientes campos se llenan automáticamente desde los datos de tráfico:
- **Económico Tractocamión**: Número del vehículo asignado
- **Placas**: Placas del vehículo
- **Permiso SCT**: Permiso de la SCT
- **Operador Principal**: Nombre del operador principal
- **Licencia**: Número de licencia del operador principal
- **Operador Secundario**: Nombre del operador secundario (si aplica)

## Cómo Usar la Funcionalidad

### Método 1: Búsqueda Manual
1. Ingresa un número de registro existente en el campo "Número de Registro"
2. Haz clic en el botón "Buscar"
3. Los campos se llenarán automáticamente con los datos disponibles

### Método 2: Llenado Automático al Cargar
1. Si ya tienes un número de registro activo, los datos se cargarán automáticamente al abrir la página de facturación

### Método 3: Datos de Ejemplo
1. Haz clic en el botón "Cargar Datos Ejemplo" en la sección de herramientas administrativas
2. Esto cargará datos de ejemplo para probar la funcionalidad
3. Usa los números de registro: `2025-01-0001`, `2025-01-0002`, o `2025-01-0003`

## Números de Registro de Ejemplo

| Número de Registro | Cliente | Origen | Destino | Tipo de Servicio |
|-------------------|---------|--------|---------|------------------|
| 2025-01-0001 | Empresa ABC S.A. | Ciudad de México | Guadalajara | Transporte Terrestre |
| 2025-01-0002 | Distribuidora XYZ | Monterrey | Tijuana | Transporte Express |
| 2025-01-0003 | Comercial DEF Ltda. | Puebla | Cancún | Transporte de Carga Pesada |

## Notificaciones del Sistema

El sistema mostrará notificaciones para informar sobre el estado del llenado automático:
- ✅ **Éxito**: "Datos cargados desde logística y tráfico"
- ✅ **Parcial**: "Datos cargados desde logística" o "Datos cargados desde tráfico"
- ⚠️ **Advertencia**: "No se encontraron datos de logística o tráfico para este registro"
- ❌ **Error**: "No se encontró el registro especificado"

## Archivos Modificados

### JavaScript
- `assets/scripts/data-persistence.js`: Funciones de llenado automático
- `assets/scripts/integration.js`: Datos de ejemplo y funciones auxiliares
- `assets/scripts/main.js`: Auto-llenado al cargar la página

### HTML
- `facturacion.html`: Interfaz actualizada con mejoras en la descripción

## Funciones Principales

### `searchAndFillData(registroId)`
Función principal que busca y llena datos según el número de registro proporcionado.

### `fillFacturacionFromLogistica(registroId)`
Llena los campos de facturación con datos de logística.

### `fillFacturacionFromTrafico(registroId)`
Llena los campos de facturación con datos de tráfico.

### `autoFillFacturacionOnLoad()`
Función que se ejecuta automáticamente al cargar la página de facturación.

### `initializeSampleData()`
Carga datos de ejemplo en el localStorage para pruebas.

## Consideraciones Técnicas

- Los datos se almacenan en localStorage del navegador
- La integración funciona con el sistema de numeración existente
- Los campos se llenan solo si existen datos correspondientes
- El sistema es compatible con el flujo de trabajo actual del ERP

## Próximas Mejoras

- Integración con base de datos real
- Validación de datos más robusta
- Historial de cambios en los datos
- Exportación de datos integrados
