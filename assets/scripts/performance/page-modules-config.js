/**
 * Configuración Centralizada de Módulos por Página
 * Define qué módulos cargar para cada página del sistema
 */

window.PageModulesConfig = {
  trafico: {
    critical: [
      '../assets/scripts/trafico/modules-config.js',
      '../assets/scripts/trafico/buzon-pendientes.js',
      '../assets/scripts/trafico/page-init.js',
      '../assets/scripts/trafico/form-handler.js',
      '../assets/scripts/trafico/init-helpers.js'
    ],
    secondary: [
      '../assets/scripts/trafico/form-utils.js',
      '../assets/scripts/trafico/registros-loader.js',
      '../assets/scripts/trafico/filtros-manager.js',
      '../assets/scripts/trafico/descarga-manager.js',
      '../assets/scripts/trafico/export-utils.js',
      '../assets/scripts/trafico/registros-actions.js',
      '../assets/scripts/trafico/validation-utils.js',
      '../assets/scripts/trafico/counter-utils.js',
      '../assets/scripts/trafico/autocomplete-manager.js',
      '../assets/scripts/trafico/form-submit-handler.js',
      '../assets/scripts/trafico/edit-manager.js',
      '../assets/scripts/trafico/gastos-sync-manager.js'
    ],
    optional: [
      '../assets/scripts/trafico/test-utils.js',
      '../assets/scripts/trafico/debug-utils.js',
      '../assets/scripts/trafico/cliente-utils.js',
      '../assets/scripts/trafico/data-correction.js',
      '../assets/scripts/trafico/diagnostic-utils.js',
      '../assets/scripts/trafico/init-utils.js',
      '../assets/scripts/trafico/counter-utils-complement.js',
      '../assets/scripts/trafico/counter-advanced.js',
      '../assets/scripts/trafico/sync-utils.js',
      '../assets/scripts/trafico/export-utils-advanced.js',
      '../assets/scripts/trafico/pagination-utils.js'
    ],
    pageSpecific: ['../assets/scripts/trafico-firebase.js']
  },

  logistica: {
    critical: [
      '../assets/scripts/logistica/modules-config.js',
      '../assets/scripts/logistica/clientes-manager.js',
      '../assets/scripts/logistica/page-init.js',
      '../assets/scripts/logistica/init-helpers.js',
      '../assets/scripts/logistica/form-handler.js'
    ],
    secondary: [
      '../assets/scripts/logistica/export-utils.js',
      '../assets/scripts/logistica/registros-loader.js',
      '../assets/scripts/logistica/registros-view.js',
      '../assets/scripts/logistica/registros-pdf.js',
      '../assets/scripts/logistica/registros-delete.js',
      '../assets/scripts/logistica/registros-edit.js',
      '../assets/scripts/logistica/registros-save.js',
      '../assets/scripts/logistica/filtros-manager.js'
    ],
    optional: ['../assets/scripts/logistica/registros-diagnostics.js']
  },

  facturacion: {
    critical: [
      '../assets/scripts/facturacion/page-init.js',
      '../assets/scripts/facturacion/init-helpers.js',
      '../assets/scripts/facturacion/form-handler.js',
      '../assets/scripts/facturacion/sidebar-state.js'
    ],
    secondary: [
      '../assets/scripts/facturacion/currency-utils.js',
      '../assets/scripts/facturacion/currency-validation.js',
      '../assets/scripts/facturacion/export-utils.js',
      '../assets/scripts/facturacion/search-fill-data.js',
      '../assets/scripts/facturacion/registros-loader.js',
      '../assets/scripts/facturacion/registros-view.js',
      '../assets/scripts/facturacion/registros-save.js',
      '../assets/scripts/facturacion/registros-edit.js',
      '../assets/scripts/facturacion/registros-delete.js',
      '../assets/scripts/facturacion/registros-pdf.js',
      '../assets/scripts/facturacion/cxc-integration.js',
      '../assets/scripts/facturacion/filtros-manager.js'
    ],
    optional: ['../assets/scripts/facturacion/diagnostic-utils.js'],
    pageSpecific: ['../assets/scripts/facturacion-contador.js']
  },

  configuracion: {
    critical: [
      '../assets/scripts/configuracion-firebase.js',
      '../assets/scripts/configuracion.js',
      '../assets/scripts/configuracion-modules.js'
    ],
    secondary: [
      '../assets/scripts/configuracion-verificacion.js',
      '../assets/scripts/configuracion-tractocamiones.js',
      '../assets/scripts/configuracion-limpieza.js',
      '../assets/scripts/configuracion-bancos.js',
      '../assets/scripts/configuracion-cuentas-bancarias-fallback.js'
    ]
  },

  reportes: {
    critical: ['../assets/scripts/reportes-inline.js', '../assets/scripts/reportes.js'],
    secondary: [],
    pageSpecific: ['https://cdn.jsdelivr.net/npm/chart.js']
  },

  diesel: {
    critical: [
      '../assets/scripts/diesel/modules-config.js',
      '../assets/scripts/diesel/diesel-page-init.js',
      '../assets/scripts/diesel/diesel-data-loaders.js'
    ],
    secondary: [
      '../assets/scripts/diesel/diesel-searchable-dropdowns.js',
      '../assets/scripts/diesel/diesel-export.js'
    ],
    pageSpecific: ['../assets/scripts/diesel/sidebar-state.js']
  },

  tesoreria: {
    critical: ['../assets/scripts/tesoreria-init.js', '../assets/scripts/tesoreria-modules.js'],
    secondary: ['../assets/scripts/tesoreria-bancos.js', '../assets/scripts/tesoreria-exportar.js'],
    pageSpecific: [
      '../assets/scripts/tesoreria.js',
      '../assets/scripts/tesoreria-movimientos.js',
      '../assets/scripts/tesoreria-estado-cuenta.js'
    ]
  },

  mantenimiento: {
    critical: ['../assets/scripts/mantenimiento/mantenimiento-page-init.js'],
    secondary: ['../assets/scripts/mantenimiento/mantenimiento-modal-editar.js'],
    pageSpecific: [
      '../assets/scripts/mantenimiento.js',
      '../assets/scripts/mantenimiento-refacciones.js'
    ]
  },

  cxc: {
    critical: ['../assets/scripts/cxc-page.js'],
    secondary: [],
    pageSpecific: [
      '../assets/scripts/cxc.js',
      '../assets/scripts/connection-monitor.js',
      '../assets/scripts/firebase-force.js',
      '../assets/scripts/print-pdf.js',
      '../assets/scripts/configuracion.js',
      '../assets/scripts/periodo.js'
    ]
  },

  cxp: {
    critical: ['../assets/scripts/cxp-inline.js', '../assets/scripts/cxp-page.js'],
    secondary: [],
    pageSpecific: [
      '../assets/scripts/cxp.js',
      '../assets/scripts/tesoreria.js',
      '../assets/scripts/configuracion.js'
    ]
  },

  inventario: {
    critical: ['../assets/scripts/inventario-page.js'],
    secondary: [],
    pageSpecific: ['../assets/scripts/inventario.js']
  },

  operadores: {
    critical: [
      '../assets/scripts/operadores-main.js',
      '../assets/scripts/operadores/event-handlers.js'
    ],
    secondary: [],
    pageSpecific: ['/assets/scripts/operadores.js', '/assets/scripts/searchable-select.js']
  }
};
