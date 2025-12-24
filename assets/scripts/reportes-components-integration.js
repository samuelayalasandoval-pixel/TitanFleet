/**
 * Integración de Componentes Reutilizables en Reportes
 * Este archivo muestra cómo usar los componentes en la página de reportes
 *
 * Para usar: Incluir este archivo después de cargar los componentes
 */

// Esperar a que los componentes se carguen
window.addEventListener('erpComponentsLoaded', () => {
  console.log('✅ Componentes cargados, inicializando integración en reportes...');
  inicializarComponentesReportes();
});

// Si los componentes ya están cargados
if (window.ERPModal && window.KPICard) {
  inicializarComponentesReportes();
}

/**
 * Inicializa los componentes reutilizables en la página de reportes
 */
function inicializarComponentesReportes() {
  // 1. Inicializar KPIs usando KPICardGroup
  inicializarKPIs();

  // 2. Inicializar filtros usando FilterManager
  inicializarFiltros();

  // 3. Inicializar tablas Top 10 usando ERPTable
  inicializarTablasTop10();

  console.log('✅ Componentes de reportes inicializados');
}

/**
 * Inicializa los KPIs principales usando KPICardGroup
 */
function inicializarKPIs() {
  // Contenedor para KPIs principales
  const kpiContainer = document.querySelector('.row.mb-4');
  if (!kpiContainer) {
    return;
  }

  // Crear contenedor para los KPIs si no existe
  let kpiGroupContainer = document.getElementById('kpiGroupContainer');
  if (!kpiGroupContainer) {
    kpiGroupContainer = document.createElement('div');
    kpiGroupContainer.id = 'kpiGroupContainer';
    kpiGroupContainer.className = 'row mb-4';
    kpiContainer.insertAdjacentElement('afterend', kpiGroupContainer);
  }

  // Crear grupo de KPIs
  window.kpiGroup = new KPICardGroup({
    containerId: 'kpiGroupContainer',
    columns: 5, // 5 columnas para los KPIs principales
    cards: [
      {
        id: 'kpiLogistica',
        icon: 'fas fa-truck',
        value: 0,
        label: 'Logística',
        color: 'primary',
        format: 'number'
      },
      {
        id: 'kpiTrafico',
        icon: 'fas fa-truck-moving',
        value: 0,
        label: 'Tráfico',
        color: 'warning',
        format: 'number'
      },
      {
        id: 'kpiDiesel',
        icon: 'fa-solid fa-gas-pump',
        value: 0,
        label: 'Registros Diesel',
        color: 'info',
        format: 'number'
      },
      {
        id: 'kpiMantenimiento',
        icon: 'fa-solid fa-screwdriver-wrench',
        value: 0,
        label: 'Mantenimiento',
        color: 'danger',
        format: 'number'
      },
      {
        id: 'kpiInventario',
        icon: 'fa-solid fa-cart-flatbed',
        value: 0,
        label: 'Productos en Stock',
        color: 'dark',
        format: 'number'
      }
    ]
  });

  // KPIs Financieros
  let kpiFinancierosContainer = document.getElementById('kpiFinancierosContainer');
  if (!kpiFinancierosContainer) {
    kpiFinancierosContainer = document.createElement('div');
    kpiFinancierosContainer.id = 'kpiFinancierosContainer';
    kpiFinancierosContainer.className = 'row mb-4';
    // Insertar después de los KPIs principales
    const kpiMainContainer = document.getElementById('kpiGroupContainer');
    if (kpiMainContainer) {
      kpiMainContainer.insertAdjacentElement('afterend', kpiFinancierosContainer);
    }
  }

  window.kpiFinancierosGroup = new KPICardGroup({
    containerId: 'kpiFinancierosContainer',
    columns: 4,
    cards: [
      {
        id: 'kpiCXC',
        icon: 'fas fa-hand-holding-usd',
        value: 0,
        label: 'Pendiente x Cobrar',
        color: 'success',
        format: 'currency',
        currency: 'MXN'
      },
      {
        id: 'kpiCXP',
        icon: 'fas fa-credit-card',
        value: 0,
        label: 'Pendiente x Pagar',
        color: 'warning',
        format: 'currency',
        currency: 'MXN'
      },
      {
        id: 'kpiTesoreria',
        icon: 'fa-solid fa-money-bill',
        value: 0,
        label: 'Gastos Operadores',
        color: 'info',
        format: 'currency',
        currency: 'MXN'
      },
      {
        id: 'kpiIncidencias',
        icon: 'fas fa-exclamation-triangle',
        value: 0,
        label: 'Total Incidencias',
        color: 'primary',
        format: 'number'
      }
    ]
  });
}

/**
 * Función para actualizar los KPIs (llamar desde reportes.js)
 */
window.actualizarKPIs = function (kpiData) {
  if (!window.kpiGroup || !window.kpiFinancierosGroup) {
    return;
  }

  // Actualizar KPIs principales
  if (kpiData.totalLogistica !== undefined) {
    const kpiLogistica = window.kpiGroup.cards.find(c => c.options.id === 'kpiLogistica');
    if (kpiLogistica) {
      kpiLogistica.updateValue(kpiData.totalLogistica);
    }
  }
  if (kpiData.totalTrafico !== undefined) {
    const kpiTrafico = window.kpiGroup.cards.find(c => c.options.id === 'kpiTrafico');
    if (kpiTrafico) {
      kpiTrafico.updateValue(kpiData.totalTrafico);
    }
  }
  if (kpiData.totalDiesel !== undefined) {
    const kpiDiesel = window.kpiGroup.cards.find(c => c.options.id === 'kpiDiesel');
    if (kpiDiesel) {
      kpiDiesel.updateValue(kpiData.totalDiesel);
    }
  }
  if (kpiData.totalMantenimiento !== undefined) {
    const kpiMantenimiento = window.kpiGroup.cards.find(c => c.options.id === 'kpiMantenimiento');
    if (kpiMantenimiento) {
      kpiMantenimiento.updateValue(kpiData.totalMantenimiento);
    }
  }
  if (kpiData.totalInventario !== undefined) {
    const kpiInventario = window.kpiGroup.cards.find(c => c.options.id === 'kpiInventario');
    if (kpiInventario) {
      kpiInventario.updateValue(kpiData.totalInventario);
    }
  }

  // Actualizar KPIs financieros
  if (kpiData.totalCXC !== undefined) {
    const kpiCXC = window.kpiFinancierosGroup.cards.find(c => c.options.id === 'kpiCXC');
    if (kpiCXC) {
      kpiCXC.updateValue(kpiData.totalCXC);
    }
  }
  if (kpiData.totalCXP !== undefined) {
    const kpiCXP = window.kpiFinancierosGroup.cards.find(c => c.options.id === 'kpiCXP');
    if (kpiCXP) {
      kpiCXP.updateValue(kpiData.totalCXP);
    }
  }
  if (kpiData.totalTesoreria !== undefined) {
    const kpiTesoreria = window.kpiFinancierosGroup.cards.find(
      c => c.options.id === 'kpiTesoreria'
    );
    if (kpiTesoreria) {
      kpiTesoreria.updateValue(kpiData.totalTesoreria);
    }
  }
  if (kpiData.totalIncidencias !== undefined) {
    const kpiIncidencias = window.kpiFinancierosGroup.cards.find(
      c => c.options.id === 'kpiIncidencias'
    );
    if (kpiIncidencias) {
      kpiIncidencias.updateValue(kpiData.totalIncidencias);
    }
  }
};

/**
 * Inicializa los filtros usando FilterManager
 */
function inicializarFiltros() {
  // Buscar el contenedor de filtros existente o crear uno nuevo
  let filtrosContainer = document.getElementById('filtrosReportesContainer');
  if (!filtrosContainer) {
    // Crear contenedor de filtros
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader) {
      filtrosContainer = document.createElement('div');
      filtrosContainer.id = 'filtrosReportesContainer';
      filtrosContainer.className = 'mb-4';
      dashboardHeader.insertAdjacentElement('afterend', filtrosContainer);
    } else {
      return;
    }
  }

  window.filterManagerReportes = new FilterManager({
    containerId: 'filtrosReportesContainer',
    filters: [
      {
        id: 'filtroMesReportes',
        type: 'month',
        label: 'Filtrar por Mes',
        colSize: 'col-md-3',
        placeholder: 'Seleccione mes'
      },
      {
        id: 'filtroTractocamion',
        type: 'select',
        label: 'Tractocamión',
        colSize: 'col-md-3',
        options: [] // Se llenará dinámicamente
      },
      {
        id: 'filtroFechaDesde',
        type: 'date',
        label: 'Fecha Desde',
        colSize: 'col-md-3'
      },
      {
        id: 'filtroFechaHasta',
        type: 'date',
        label: 'Fecha Hasta',
        colSize: 'col-md-3'
      }
    ],
    autoApply: false, // Aplicar manualmente
    onFilter: filters => {
      console.log('Filtros aplicados:', filters);
      // Llamar a la función de filtrado existente
      if (window.reportesSystem && typeof window.reportesSystem.aplicarFiltros === 'function') {
        window.reportesSystem.aplicarFiltros(filters);
      } else if (typeof aplicarFiltroMesReportes === 'function') {
        aplicarFiltroMesReportes();
      }
    }
  });
}

/**
 * Inicializa las tablas Top 10 usando ERPTable
 */
function inicializarTablasTop10() {
  // Tabla Top 10 Económicos
  inicializarTablaTop10('top10Economicos', 'Top 10 Económicos con Más Viajes', [
    { key: 'posicion', label: '#', sortable: false },
    { key: 'economico', label: 'Económico', sortable: true },
    { key: 'viajes', label: 'Viajes', sortable: true },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: value => ERPUtils.formatCurrency(value, 'MXN')
    }
  ]);

  // Tabla Top 10 Clientes
  inicializarTablaTop10('top10Clientes', 'Top 10 Clientes por Facturación', [
    { key: 'posicion', label: '#', sortable: false },
    { key: 'cliente', label: 'Cliente', sortable: true },
    {
      key: 'facturacion',
      label: 'Facturación',
      sortable: true,
      render: value => ERPUtils.formatCurrency(value, 'MXN')
    },
    { key: 'viajes', label: 'Viajes', sortable: true }
  ]);

  // Tabla Top 10 Proveedores
  inicializarTablaTop10('top10Proveedores', 'Top 10 Proveedores por Pagos', [
    { key: 'posicion', label: '#', sortable: false },
    { key: 'proveedor', label: 'Proveedor', sortable: true },
    {
      key: 'pagos',
      label: 'Pagos',
      sortable: true,
      render: value => ERPUtils.formatCurrency(value, 'MXN')
    }
  ]);

  // Tabla Top 10 Operadores
  inicializarTablaTop10('top10Operadores', 'Top 10 Operadores con Más Viajes', [
    { key: 'posicion', label: '#', sortable: false },
    { key: 'operador', label: 'Operador', sortable: true },
    { key: 'viajes', label: 'Viajes', sortable: true },
    { key: 'economico', label: 'Económico', sortable: true }
  ]);
}

/**
 * Inicializa una tabla Top 10 específica
 */
function inicializarTablaTop10(containerId, title, columns) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  // Limpiar el contenedor
  container.innerHTML = '';

  // Crear tabla
  window[`tabla${containerId}`] = new ERPTable({
    containerId: containerId,
    tableId: `table-${containerId}`,
    columns: columns,
    data: [],
    pagination: {
      enabled: false // No paginación para Top 10
    },
    emptyMessage: `No hay datos para ${title}`
  });
}

/**
 * Función para actualizar las tablas Top 10
 */
window.actualizarTablasTop10 = function (data) {
  // Actualizar Top 10 Económicos
  if (data.top10Economicos && window.tablatop10Economicos) {
    const datos = data.top10Economicos.map((item, index) => ({
      posicion: index + 1,
      economico: item.economico || item.nombre || '-',
      viajes: item.viajes || 0,
      total: item.total || 0
    }));
    window.tablatop10Economicos.setData(datos);
  }

  // Actualizar Top 10 Clientes
  if (data.top10Clientes && window.tablatop10Clientes) {
    const datos = data.top10Clientes.map((item, index) => ({
      posicion: index + 1,
      cliente: item.cliente || item.nombre || '-',
      facturacion: item.facturacion || item.total || 0,
      viajes: item.viajes || 0
    }));
    window.tablatop10Clientes.setData(datos);
  }

  // Actualizar Top 10 Proveedores
  if (data.top10Proveedores && window.tablatop10Proveedores) {
    const datos = data.top10Proveedores.map((item, index) => ({
      posicion: index + 1,
      proveedor: item.proveedor || item.nombre || '-',
      pagos: item.pagos || item.total || 0
    }));
    window.tablatop10Proveedores.setData(datos);
  }

  // Actualizar Top 10 Operadores
  if (data.top10Operadores && window.tablatop10Operadores) {
    const datos = data.top10Operadores.map((item, index) => ({
      posicion: index + 1,
      operador: item.operador || item.nombre || '-',
      viajes: item.viajes || 0,
      economico: item.economico || '-'
    }));
    window.tablatop10Operadores.setData(datos);
  }
};

/**
 * Función helper para mostrar modales de detalles
 */
window.mostrarModalDetalles = function (titulo, contenido, acciones = null) {
  const modal = new ERPModal({
    id: 'modalDetalles',
    title: titulo,
    body: contenido,
    footer:
      acciones ||
      '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>',
    size: 'modal-lg'
  });
  modal.show();
  return modal;
};

/**
 * Función helper para exportar datos
 */
window.configurarExportacionReportes = function (buttonId, datos, nombreArchivo) {
  if (!window.ExportButton) {
    return;
  }

  const _exportBtn = new ExportButton({
    buttonId: buttonId,
    data: datos,
    filename: nombreArchivo || 'reporte',
    formats: ['excel', 'csv'],
    onExport: async () => {
      // Obtener datos actualizados antes de exportar
      if (
        window.reportesSystem &&
        typeof window.reportesSystem.obtenerDatosParaExportar === 'function'
      ) {
        return window.reportesSystem.obtenerDatosParaExportar();
      }
      return datos;
    }
  });
};
