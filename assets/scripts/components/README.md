# Componentes Reutilizables ERP

Este directorio contiene componentes JavaScript reutilizables diseñados para mejorar la calidad del código y facilitar el mantenimiento del proyecto ERP.

## 📦 Componentes Disponibles

### 1. ERPModal
Componente para crear y gestionar modales de Bootstrap de forma dinámica.

**Ejemplo de uso:**
```javascript
// Crear un modal simple
const modal = new ERPModal({
  id: 'miModal',
  title: 'Título del Modal',
  body: '<p>Contenido del modal</p>',
  footer: '<button class="btn btn-primary">Guardar</button>'
});
modal.show();

// Modal con callbacks
const modal2 = new ERPModal({
  id: 'modalConfirmacion',
  title: 'Confirmar Acción',
  body: '<p>¿Está seguro de realizar esta acción?</p>',
  footer: `
    <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
    <button class="btn btn-danger" id="confirmBtn">Confirmar</button>
  `,
  onShown: () => {
    document.getElementById('confirmBtn').addEventListener('click', () => {
      // Lógica de confirmación
      modal2.hide();
    });
  }
});
modal2.show();
```

### 2. ERPTable
Componente para crear tablas con filtros, paginación y ordenamiento.

**Ejemplo de uso:**
```javascript
const table = new ERPTable({
  containerId: 'tablaContainer',
  columns: [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { 
      key: 'acciones', 
      label: 'Acciones',
      render: (value, row) => {
        return `<button class="btn btn-sm btn-primary" onclick="editar(${row.id})">Editar</button>`;
      }
    }
  ],
  data: [
    { id: 1, nombre: 'Juan', email: 'juan@example.com' },
    { id: 2, nombre: 'María', email: 'maria@example.com' }
  ],
  pagination: {
    enabled: true,
    itemsPerPage: 10
  },
  onRowClick: (row, index) => {
    console.log('Fila clickeada:', row);
  }
});

// Aplicar filtros
table.filter({ nombre: 'Juan' });

// Actualizar datos
table.setData(nuevosDatos);
```

### 3. ERPForm
Componente para gestionar formularios con validación.

**Ejemplo de uso:**
```javascript
const form = new ERPForm({
  formId: 'miFormulario',
  fields: [
    { 
      id: 'nombre', 
      required: true, 
      type: 'text',
      label: 'Nombre',
      placeholder: 'Ingrese su nombre'
    },
    { 
      id: 'email', 
      required: true, 
      type: 'email',
      validation: (value) => {
        return ERPUtils.isValidEmail(value) || 'Email inválido';
      }
    }
  ],
  onSubmit: async (formData) => {
    console.log('Datos del formulario:', formData);
    // Guardar datos...
    form.showSuccess('Datos guardados correctamente');
  },
  resetOnSubmit: true
});

// Obtener datos
const datos = form.getFormData();

// Establecer datos
form.setFormData({ nombre: 'Juan', email: 'juan@example.com' });
```

### 4. KPICard / KPICardGroup
Componentes para crear tarjetas de métricas/KPI.

**Ejemplo de uso:**
```javascript
// Tarjeta individual
const kpi = new KPICard({
  containerId: 'kpiContainer',
  icon: 'fas fa-truck',
  value: 150,
  label: 'Total Viajes',
  color: 'primary',
  format: 'number'
});

// Actualizar valor
kpi.updateValue(200);

// Grupo de tarjetas
const kpiGroup = new KPICardGroup({
  containerId: 'kpiGroupContainer',
  columns: 4, // Número de columnas
  cards: [
    {
      icon: 'fas fa-truck',
      value: 150,
      label: 'Total Viajes',
      color: 'primary',
      format: 'number'
    },
    {
      icon: 'fas fa-dollar-sign',
      value: 50000,
      label: 'Ingresos',
      color: 'success',
      format: 'currency',
      currency: 'MXN'
    },
    {
      icon: 'fas fa-users',
      value: 25,
      label: 'Operadores',
      color: 'info',
      format: 'number'
    }
  ]
});
```

### 5. FilterManager
Componente para gestionar filtros de forma centralizada.

**Ejemplo de uso:**
```javascript
const filterManager = new FilterManager({
  containerId: 'filtrosContainer',
  filters: [
    { 
      id: 'nombre', 
      type: 'text', 
      label: 'Nombre',
      placeholder: 'Buscar por nombre...',
      colSize: 'col-md-3'
    },
    { 
      id: 'fecha', 
      type: 'date', 
      label: 'Fecha',
      colSize: 'col-md-3'
    },
    { 
      id: 'estado', 
      type: 'select', 
      label: 'Estado',
      options: [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' }
      ],
      colSize: 'col-md-3'
    }
  ],
  onFilter: (filters) => {
    console.log('Filtros activos:', filters);
    // Aplicar filtros a la tabla
    table.filter(filters);
  }
});

// Obtener filtros activos
const filtros = filterManager.getFilters();

// Limpiar filtros
filterManager.clearFilters();
```

### 6. ExportButton
Componente para exportar datos a diferentes formatos.

**Ejemplo de uso:**
```javascript
const exportBtn = new ExportButton({
  buttonId: 'btnExportar',
  data: datosParaExportar,
  filename: 'reporte_viajes',
  formats: ['excel', 'csv', 'pdf'],
  columns: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'total', label: 'Total' }
  ],
  onExport: async () => {
    // Obtener datos actualizados antes de exportar
    return await obtenerDatosActualizados();
  }
});

// Actualizar datos
exportBtn.updateData(nuevosDatos);
```

### 7. ERPUtils
Utilidades comunes para formateo, validación, etc.

**Ejemplo de uso:**
```javascript
// Formatear moneda
ERPUtils.formatCurrency(1500.50, 'MXN'); // "$1,500.50"

// Formatear número
ERPUtils.formatNumber(1500, 2); // "1,500.00"

// Formatear fecha
ERPUtils.formatDate(new Date(), 'short'); // "01/12/2024"
ERPUtils.formatDate(new Date(), 'long'); // "1 de diciembre de 2024"

// Validaciones
ERPUtils.isValidEmail('test@example.com'); // true
ERPUtils.isValidRFC('ABC123456789'); // true

// Notificaciones
ERPUtils.showToast('Operación exitosa', 'success');
ERPUtils.showToast('Error al guardar', 'error');

// Confirmación
const confirmado = await ERPUtils.confirm('¿Está seguro?', 'Confirmar');
if (confirmado) {
  // Realizar acción
}

// Copiar al portapapeles
await ERPUtils.copyToClipboard('Texto a copiar');

// Debounce
const buscar = ERPUtils.debounce((query) => {
  console.log('Buscando:', query);
}, 300);
```

## 🚀 Cómo Usar

### Opción 1: Cargar todos los componentes
```html
<!-- En el <head> o antes de usar los componentes -->
<script src="../assets/scripts/components/index.js"></script>
```

### Opción 2: Cargar componentes individuales
```html
<script src="../assets/scripts/components/utils.js"></script>
<script src="../assets/scripts/components/Modal.js"></script>
<script src="../assets/scripts/components/Table.js"></script>
<!-- etc... -->
```

## 📝 Mejores Prácticas

1. **Usar componentes en lugar de código duplicado**: Si encuentras código repetitivo, considera crear o usar un componente.

2. **Mantener la separación de responsabilidades**: Cada componente tiene una función específica.

3. **Usar callbacks para personalización**: Los componentes aceptan callbacks para personalizar el comportamiento.

4. **Validar datos antes de usar**: Siempre valida los datos antes de pasarlos a los componentes.

5. **Manejar errores**: Los componentes incluyen manejo básico de errores, pero siempre maneja errores en tus callbacks.

## 🔧 Extensión de Componentes

Puedes extender los componentes creando clases que hereden de ellos:

```javascript
class MiModalPersonalizado extends ERPModal {
  constructor(options) {
    super(options);
    // Lógica personalizada
  }
  
  // Métodos adicionales
  miMetodoPersonalizado() {
    // ...
  }
}
```

## 📚 Dependencias

- **Bootstrap 5.3+**: Para estilos y componentes (Modal, Toast, etc.)
- **Font Awesome 6.4+**: Para iconos
- **SheetJS (XLSX)**: Opcional, para exportación a Excel
- **jsPDF**: Opcional, para exportación a PDF

## 🐛 Solución de Problemas

### Los componentes no se cargan
- Verifica que las rutas de los archivos sean correctas
- Asegúrate de que Bootstrap esté cargado antes de los componentes

### Los modales no se muestran
- Verifica que Bootstrap esté cargado
- Revisa la consola del navegador para errores

### Las tablas no se renderizan
- Verifica que el contenedor exista en el DOM
- Asegúrate de que los datos estén en el formato correcto

## 📄 Licencia

Estos componentes son parte del proyecto ERP y siguen la misma licencia del proyecto.
