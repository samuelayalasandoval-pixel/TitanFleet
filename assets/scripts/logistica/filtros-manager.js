/**
 * Gestión de Filtros - logistica.html
 * Sistema de filtrado y paginación para registros de logística
 */

(function () {
  'use strict';

  /**
   * Función para aplicar filtros a los registros
   */
  window.aplicarFiltrosLogistica = function () {
    if (!window._registrosLogisticaCompletos || window._registrosLogisticaCompletos.length === 0) {
      console.warn('⚠️ No hay registros completos para filtrar');
      return;
    }

    // Obtener valores de los filtros
    const filtroReferencia =
      document.getElementById('filtroReferencia')?.value.trim().toLowerCase() || '';
    const filtroCliente = document.getElementById('filtroCliente')?.value || '';
    const filtroReferenciaCliente =
      document.getElementById('filtroReferenciaCliente')?.value.trim().toLowerCase() || '';
    const filtroTipoServicio = document.getElementById('filtroTipoServicio')?.value || '';
    const filtroFechaInicial = document.getElementById('filtroFechaInicial')?.value || '';
    const filtroFechaFinal = document.getElementById('filtroFechaFinal')?.value || '';

    console.log('🔍 Aplicando filtros:', {
      referencia: filtroReferencia,
      cliente: filtroCliente,
      referenciaCliente: filtroReferenciaCliente,
      tipoServicio: filtroTipoServicio,
      fechaInicial: filtroFechaInicial,
      fechaFinal: filtroFechaFinal
    });

    // Filtrar registros
    const registrosFiltrados = window._registrosLogisticaCompletos.filter(registro => {
      // Filtro por referencia (número de registro)
      if (filtroReferencia) {
        const numeroRegistro = (registro.numeroRegistro || registro.id || registro.registroId || '')
          .toString()
          .toLowerCase();
        if (!numeroRegistro.includes(filtroReferencia)) {
          return false;
        }
      }

      // Filtro por cliente (select con RFC)
      if (filtroCliente) {
        const clienteRFC = registro.cliente || '';
        if (clienteRFC !== filtroCliente) {
          return false;
        }
      }

      // Filtro por referencia del cliente
      if (filtroReferenciaCliente) {
        const refCliente = (
          registro.referenciaCliente ||
          registro['referencia cliente'] ||
          registro.ReferenciaCliente ||
          ''
        )
          .toString()
          .toLowerCase();
        if (!refCliente.includes(filtroReferenciaCliente)) {
          return false;
        }
      }

      // Filtro por tipo de servicio
      if (filtroTipoServicio) {
        const tipoServ = (registro.tipoServicio || registro.TipoServicio || '').toLowerCase();
        if (tipoServ !== filtroTipoServicio.toLowerCase()) {
          return false;
        }
      }

      // Filtro por rango de fechas
      if (filtroFechaInicial || filtroFechaFinal) {
        if (!registro.fechaCreacion) {
          return false;
        }

        const fechaRegistro = new Date(registro.fechaCreacion);
        fechaRegistro.setHours(0, 0, 0, 0); // Normalizar a medianoche

        if (filtroFechaInicial) {
          const fechaInicial = new Date(filtroFechaInicial);
          fechaInicial.setHours(0, 0, 0, 0);
          if (fechaRegistro < fechaInicial) {
            return false;
          }
        }

        if (filtroFechaFinal) {
          const fechaFinal = new Date(filtroFechaFinal);
          fechaFinal.setHours(23, 59, 59, 999); // Hasta el final del día
          if (fechaRegistro > fechaFinal) {
            return false;
          }
        }
      }

      return true;
    });

    console.log(
      `✅ ${registrosFiltrados.length} registros después de aplicar filtros (de ${window._registrosLogisticaCompletos.length} totales)`
    );

    // Ordenar registros filtrados
    const registrosOrdenados = registrosFiltrados.sort((a, b) => {
      const numeroA = a.numeroRegistro || a.id || a.registroId || '';
      const numeroB = b.numeroRegistro || b.id || b.registroId || '';
      const numA = parseInt(numeroA.replace(/[^\d]/g, ''), 10) || 0;
      const numB = parseInt(numeroB.replace(/[^\d]/g, ''), 10) || 0;
      return numB - numA;
    });

    // Actualizar paginación con registros filtrados
    if (window._paginacionLogisticaManager) {
      window._paginacionLogisticaManager.inicializar(registrosOrdenados, 15);
      window._paginacionLogisticaManager.paginaActual = 1;
      if (typeof window.renderizarRegistrosLogistica === 'function') {
        window.renderizarRegistrosLogistica();
      }
    }
  };

  /**
   * Función para limpiar filtros
   */
  window.limpiarFiltrosLogistica = function () {
    const filtroReferencia = document.getElementById('filtroReferencia');
    const filtroCliente = document.getElementById('filtroCliente');
    const filtroReferenciaCliente = document.getElementById('filtroReferenciaCliente');
    const filtroTipoServicio = document.getElementById('filtroTipoServicio');
    const filtroFechaInicial = document.getElementById('filtroFechaInicial');
    const filtroFechaFinal = document.getElementById('filtroFechaFinal');

    if (filtroReferencia) {
      filtroReferencia.value = '';
    }
    if (filtroCliente) {
      filtroCliente.value = '';
    }
    if (filtroReferenciaCliente) {
      filtroReferenciaCliente.value = '';
    }
    if (filtroTipoServicio) {
      filtroTipoServicio.value = '';
    }
    if (filtroFechaInicial) {
      filtroFechaInicial.value = '';
    }
    if (filtroFechaFinal) {
      filtroFechaFinal.value = '';
    }

    // Restaurar todos los registros
    if (window._registrosLogisticaCompletos && window._paginacionLogisticaManager) {
      const registrosOrdenados = window._registrosLogisticaCompletos.sort((a, b) => {
        const numeroA = a.numeroRegistro || a.id || a.registroId || '';
        const numeroB = b.numeroRegistro || b.id || b.registroId || '';
        const numA = parseInt(numeroA.replace(/[^\d]/g, ''), 10) || 0;
        const numB = parseInt(numeroB.replace(/[^\d]/g, ''), 10) || 0;
        return numB - numA;
      });
      window._paginacionLogisticaManager.inicializar(registrosOrdenados, 15);
      window._paginacionLogisticaManager.paginaActual = 1;
      if (typeof window.renderizarRegistrosLogistica === 'function') {
        window.renderizarRegistrosLogistica();
      }
    }
  };

  /**
   * Función para cambiar de página
   */
  window.cambiarPaginaLogistica = function (accion) {
    if (!window._paginacionLogisticaManager) {
      return;
    }

    let cambioExitoso = false;

    if (accion === 'anterior') {
      cambioExitoso = window._paginacionLogisticaManager.paginaAnterior();
    } else if (accion === 'siguiente') {
      cambioExitoso = window._paginacionLogisticaManager.paginaSiguiente();
    } else if (typeof accion === 'number') {
      cambioExitoso = window._paginacionLogisticaManager.irAPagina(accion);
    }

    if (cambioExitoso) {
      if (typeof window.renderizarRegistrosLogistica === 'function') {
        window.renderizarRegistrosLogistica();
      }
      // Scroll suave hacia la tabla
      const tabla = document.getElementById('tablaRegistrosLogistica');
      if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
})();
