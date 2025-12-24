/**
 * Helpers de Inicialización - logistica.html
 * Funciones de inicialización, verificación y DataPersistence fallback
 */

(function () {
  'use strict';

  // Esperar a que main.js se cargue y exponer funciones críticas
  (function () {
    let checkCount = 0;
    const maxChecks = 100; // Aumentar intentos

    function ensureRegistrationFunctions() {
      checkCount++;

      // Verificar que las funciones críticas estén disponibles
      const hasReset = typeof window.resetRegistrationCounter === 'function';
      const hasGenerate = typeof window.generateUniqueNumber === 'function';
      const hasInit = typeof window.initializeRegistrationSystem === 'function';

      if (checkCount % 10 === 0) {
        console.log(`🔄 Verificando funciones (intento ${checkCount}/${maxChecks}):`, {
          resetRegistrationCounter: hasReset,
          generateUniqueNumber: hasGenerate,
          initializeRegistrationSystem: hasInit
        });
      }

      if (hasReset && hasGenerate && hasInit) {
        console.log('✅ Funciones de registro disponibles');

        // Si el campo de número de registro está vacío o tiene "-", generar uno
        const numeroRegistroInput = document.getElementById('numeroRegistro');
        if (
          numeroRegistroInput &&
          (!numeroRegistroInput.value || numeroRegistroInput.value === '-')
        ) {
          // NO generar número aquí - ya se genera en initializeRegistrationSystem
          // Solo verificar que el sistema esté inicializado si no se ha hecho ya
          if (hasInit && !window.__numeroRegistroGenerado) {
            window.initializeRegistrationSystem().catch(err => {
              console.error('❌ Error inicializando sistema:', err);
            });
          } else if (window.__numeroRegistroGenerado) {
            console.log('⏭️ Número ya fue generado, omitiendo generación duplicada');
          }
        }

        return true;
      } else if (checkCount < maxChecks) {
        setTimeout(ensureRegistrationFunctions, 100);
      } else {
        console.error(
          '❌ Timeout esperando funciones de registro después de',
          maxChecks,
          'intentos'
        );
        console.error('Estado final:', {
          resetRegistrationCounter: hasReset,
          generateUniqueNumber: hasGenerate,
          initializeRegistrationSystem: hasInit,
          mainJsLoaded: typeof window.generateUniqueNumber !== 'undefined'
        });
      }
      return false;
    }

    // Iniciar verificación cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensureRegistrationFunctions);
    } else {
      // Esperar un poco más para que main.js se cargue
      setTimeout(ensureRegistrationFunctions, 200);
    }
  })();

  // Verificar que las funciones de guardado estén disponibles
  function ensureSaveFunctions() {
    console.log('🔍 Verificando funciones de guardado...');
    console.log('  - saveLogisticaData:', typeof window.saveLogisticaData);
    console.log('  - saveTraficoData:', typeof window.saveTraficoData);
    console.log('  - saveFacturacionData:', typeof window.saveFacturacionData);

    if (typeof window.saveLogisticaData === 'undefined') {
      // saveLogisticaData puede no estar disponible inmediatamente si los scripts aún se están cargando
      // Esto es normal y no es un error crítico
      setTimeout(() => {
        if (typeof window.saveLogisticaData === 'undefined') {
          // Solo mostrar error si realmente no está después de esperar
          if (window.DEBUG_MODE) {
            console.warn('⚠️ saveLogisticaData aún no está disponible después del delay');
          }
        } else if (window.DEBUG_MODE) {
          console.log('✅ saveLogisticaData ahora está disponible');
        }
      }, 1000);
    }
  }

  // Ejecutar verificación cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureSaveFunctions);
  } else {
    ensureSaveFunctions();
  }

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
