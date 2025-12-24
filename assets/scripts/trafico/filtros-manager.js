/**
 * Gestor de Filtros - trafico.html
 * Funciones para aplicar y limpiar filtros de registros de trÃ¡fico
 */

(function () {
  'use strict';

  // Variable global para filtro activo
  window.__filtroEstadoActivo = '';

  // Filtrar registros por estado de plataforma
  window.filtrarPorEstadoPlataforma = function (estado) {
    window.__filtroEstadoActivo = estado;
    if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
      window.cargarRegistrosTraficoConFiltro();
    }
  };

  // FunciÃ³n para aplicar filtros de trÃ¡fico
  window.aplicarFiltrosTrafico = async function () {
    console.log('ðŸ” Aplicando filtros de trÃ¡fico...');
    if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
      await window.cargarRegistrosTraficoConFiltro();
    } else {
      console.warn('âš ï¸ cargarRegistrosTraficoConFiltro no estÃ¡ disponible');
    }
  };

  // FunciÃ³n para limpiar filtros de trÃ¡fico
  window.limpiarFiltrosTrafico = async function () {
    console.log('ðŸ§¹ Limpiando filtros de trÃ¡fico...');

    // Limpiar todos los campos de filtro
    const filtroNumeroRegistro = document.getElementById('filtroNumeroRegistro');
    const filtroCliente = document.getElementById('filtroCliente');
    const filtroPlataforma = document.getElementById('filtroPlataforma');
    const filtroEconomico = document.getElementById('filtroEconomico');
    const filtroFechaOrigen = document.getElementById('filtroFechaOrigen');
    const filtroFechaDestino = document.getElementById('filtroFechaDestino');

    if (filtroNumeroRegistro) {
      filtroNumeroRegistro.value = '';
    }
    if (filtroCliente) {
      filtroCliente.value = '';
    }
    if (filtroPlataforma) {
      filtroPlataforma.value = '';
    }
    if (filtroEconomico) {
      filtroEconomico.value = '';
    }
    if (filtroFechaOrigen) {
      filtroFechaOrigen.value = '';
    }
    if (filtroFechaDestino) {
      filtroFechaDestino.value = '';
    }

    // Limpiar filtro de estado
    window.__filtroEstadoActivo = '';

    // Recargar registros sin filtros
    if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
      await window.cargarRegistrosTraficoConFiltro();
    } else {
      console.warn('âš ï¸ cargarRegistrosTraficoConFiltro no estÃ¡ disponible');
    }
  };
})();
