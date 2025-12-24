/**
 * Datos de Módulos - menu.html
 * Define los módulos disponibles del sistema
 */

(function () {
  'use strict';

  // Definición de módulos con sus detalles
  window.MODULOS_DISPONIBLES = [
    {
      nombre: 'Logística',
      icono: 'fas fa-truck',
      descripcion: 'Gestiona envíos, rutas y entregas',
      url: 'logistica.html',
      idNav: 'nav-logistica'
    },
    {
      nombre: 'Facturación',
      icono: 'fas fa-file-invoice',
      descripcion: 'Genera facturas y gestiona documentos',
      url: 'facturacion.html',
      idNav: 'nav-facturacion'
    },
    {
      nombre: 'Tráfico',
      icono: 'fas fa-route',
      descripcion: 'Control de rutas y planificación',
      url: 'trafico.html',
      idNav: 'nav-trafico'
    },
    {
      nombre: 'Operadores',
      icono: 'fas fa-user',
      descripcion: 'Gestión de operadores y personal',
      url: 'operadores.html',
      idNav: 'nav-operadores'
    },
    {
      nombre: 'Diesel',
      icono: 'fa-solid fa-gas-pump',
      descripcion: 'Control de combustible y gastos',
      url: 'diesel.html',
      idNav: 'nav-diesel'
    },
    {
      nombre: 'Mantenimiento',
      icono: 'fa-solid fa-screwdriver-wrench',
      descripcion: 'Registro y seguimiento de mantenimientos',
      url: 'mantenimiento.html',
      idNav: 'nav-mantenimiento'
    },
    {
      nombre: 'Tesoreria',
      icono: 'fa-solid fa-money-bill',
      descripcion: 'Gestión de movimientos financieros',
      url: 'tesoreria.html',
      idNav: 'nav-tesoreria'
    },
    {
      nombre: 'Cuentas x Cobrar',
      icono: 'fas fa-hand-holding-usd',
      descripcion: 'Control de facturas por cobrar',
      url: 'CXC.html',
      idNav: 'nav-cxc'
    },
    {
      nombre: 'Cuentas x Pagar',
      icono: 'fas fa-credit-card',
      descripcion: 'Gestión de facturas por pagar',
      url: 'CXP.html',
      idNav: 'nav-cxp'
    },
    {
      nombre: 'Inventario',
      icono: 'fa-solid fa-cart-flatbed',
      descripcion: 'Control de stock y almacenes',
      url: 'inventario.html',
      idNav: 'nav-inventario'
    },
    {
      nombre: 'Configuración',
      icono: 'fa-solid fa-gears',
      descripcion: 'Ajustes y configuración del sistema',
      url: 'configuracion.html',
      idNav: 'nav-configuracion'
    },
    {
      nombre: 'Reportes',
      icono: 'fas fa-chart-line',
      descripcion: 'Análisis y reportes del sistema',
      url: 'reportes.html',
      idNav: 'nav-reportes'
    }
  ];
})();
