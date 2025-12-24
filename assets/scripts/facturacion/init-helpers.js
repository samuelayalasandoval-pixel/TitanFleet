/**
 * Helpers de Inicialización - facturacion.html
 * Funciones de inicialización, verificación y DataPersistence fallback
 */

(function () {
  'use strict';

  // Función para asegurar que DataPersistence esté disponible
  function ensureDataPersistence() {
    if (typeof window.DataPersistence === 'undefined') {
      console.log('🔄 DataPersistence no disponible, cargando versión de respaldo...');

      window.DataPersistence = {
        storageKey: 'erp_shared_data',

        getData() {
          try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
          } catch (error) {
            console.error('Error obteniendo datos:', error);
            return null;
          }
        },

        setData(data) {
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
          } catch (error) {
            console.error('Error guardando datos:', error);
            return false;
          }
        },

        saveLogisticaData(registroId, data) {
          const allData = this.getData();
          if (!allData) {
            return false;
          }

          allData.registros = allData.registros || {};
          allData.registros[registroId] = {
            ...data,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString()
          };

          return this.setData(allData);
        },

        getLogisticaData(registroId) {
          const allData = this.getData();
          return allData && allData.registros ? allData.registros[registroId] : null;
        },

        saveTraficoData(registroId, data) {
          const allData = this.getData();
          if (!allData) {
            return false;
          }

          allData.trafico = allData.trafico || {};
          allData.trafico[registroId] = {
            ...data,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString()
          };

          return this.setData(allData);
        },

        getTraficoData(registroId) {
          const allData = this.getData();
          return allData && allData.trafico ? allData.trafico[registroId] : null;
        },

        saveFacturacionData(registroId, data) {
          const allData = this.getData();
          if (!allData) {
            return false;
          }

          allData.facturas = allData.facturas || {};
          allData.facturas[registroId] = {
            ...data,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString()
          };

          return this.setData(allData);
        },

        getFacturacionData(registroId) {
          const allData = this.getData();
          return allData && allData.facturas ? allData.facturas[registroId] : null;
        },

        getAllDataByRegistro(registroId) {
          const allData = this.getData();
          if (!allData) {
            return null;
          }

          return {
            logistica: allData.registros?.[registroId] || null,
            trafico: allData.trafico?.[registroId] || null,
            facturacion: allData.facturas?.[registroId] || null
          };
        },

        clearAllData() {
          return this.setData({ registros: {}, trafico: {}, facturas: {} });
        }
      };

      console.log('✅ DataPersistence cargado como respaldo');
    }
  }

  // Ejecutar inmediatamente
  ensureDataPersistence();

  // También ejecutar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', ensureDataPersistence);

  // Ejecutar después de un pequeño delay para asegurar que otros scripts se hayan cargado
  setTimeout(ensureDataPersistence, 100);
})();
