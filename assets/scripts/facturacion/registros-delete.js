/**
 * Eliminación de Registros de Facturación - facturacion.html
 * Operaciones de eliminación: Eliminar registros de Firebase y localStorage
 */

(function () {
  'use strict';

  /**
   * Eliminar un registro de facturación con confirmación
   */
  window.eliminarRegistroFacturacion = async function (regId) {
    console.log(`🗑️ Eliminando registro de Facturación: ${regId}`);

    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar el registro ${regId}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      console.log('❌ Eliminación cancelada por el usuario');
      return;
    }

    try {
      let eliminado = false;

      // 1. Eliminar de Firebase
      if (window.firebaseRepos?.facturacion) {
        try {
          await window.firebaseRepos.facturacion.delete(regId);
          console.log(`✅ Registro ${regId} eliminado de Firebase`);
          eliminado = true;
        } catch (error) {
          console.warn('⚠️ Error eliminando de Firebase:', error);
        }
      }

      // 2. Eliminar de localStorage
      try {
        const raw = localStorage.getItem('erp_shared_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.facturas && parsed.facturas[regId]) {
            delete parsed.facturas[regId];
            localStorage.setItem('erp_shared_data', JSON.stringify(parsed));
            console.log(`✅ Registro ${regId} eliminado de erp_shared_data.facturas`);
            eliminado = true;
          }
          if (parsed.facturacion && parsed.facturacion[regId]) {
            delete parsed.facturacion[regId];
            localStorage.setItem('erp_shared_data', JSON.stringify(parsed));
            console.log(`✅ Registro ${regId} eliminado de erp_shared_data.facturacion`);
            eliminado = true;
          }
        }
      } catch (e) {
        console.warn('⚠️ Error eliminando de erp_shared_data:', e);
      }

      if (eliminado) {
        alert(`✅ Registro ${regId} eliminado exitosamente`);
        // Recargar la tabla
        if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
          await window.cargarRegistrosFacturacionConFiltro();
        } else {
          await window.cargarRegistrosFacturacion();
        }
        // Actualizar contador de pendientes
        if (typeof window.actualizarContadorPendientesFacturacion === 'function') {
          await window.actualizarContadorPendientesFacturacion();
        }
      } else {
        alert('⚠️ No se pudo encontrar el registro para eliminar');
      }
    } catch (error) {
      console.error('❌ Error eliminando registro:', error);
      alert(`Error al eliminar el registro: ${error.message}`);
    }
  };

  console.log('✅ Módulo registros-delete.js cargado');
})();
