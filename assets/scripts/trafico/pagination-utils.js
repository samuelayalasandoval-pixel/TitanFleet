/**
 * Utilidades de Paginación - trafico.html
 * Funciones para manejo de paginación y filtros
 *
 * @module trafico/pagination-utils
 */

(function () {
  'use strict';

  // Función para cambiar de página
  window.cambiarPaginaTrafico = async function (accion) {
    if (!window._paginacionTraficoManager) {
      return;
    }

    let cambioExitoso = false;

    if (accion === 'anterior') {
      cambioExitoso = window._paginacionTraficoManager.paginaAnterior();
    } else if (accion === 'siguiente') {
      cambioExitoso = window._paginacionTraficoManager.paginaSiguiente();
    } else if (typeof accion === 'number') {
      cambioExitoso = window._paginacionTraficoManager.irAPagina(accion);
    }

    if (cambioExitoso) {
      await window.renderizarRegistrosTrafico();
      // Scroll suave hacia la tabla
      const tabla = document.getElementById('tablaRegistrosTrafico');
      if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Variable global para filtro activo
  window.__filtroEstadoActivo = '';

  // Filtrar registros por estado de plataforma
  window.filtrarPorEstadoPlataforma = function (estado) {
    window.__filtroEstadoActivo = estado;
    if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
      window.cargarRegistrosTraficoConFiltro();
    }
  };

  // Marcar registro como cargado
  window.marcarComoCargado = function (registroId) {
    const raw = localStorage.getItem('erp_shared_data');
    const parsed = raw ? JSON.parse(raw) : {};

    if (!parsed.trafico || !parsed.trafico[registroId]) {
      alert('❌ Registro no encontrado');
      return;
    }

    parsed.trafico[registroId].estadoPlataforma = 'cargado';
    parsed.trafico[registroId].fechaCarga = new Date().toISOString();
    localStorage.setItem('erp_shared_data', JSON.stringify(parsed));

    if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
      window.cargarRegistrosTraficoConFiltro();
    }
    alert(`✅ Registro ${registroId} marcado como CARGADO`);
  };
})();
