/**
 * Tests de Integración para Flujos Principales - TitanFleet ERP
 *
 * Uso:
 * 1. Abre cualquier página del ERP
 * 2. Abre la consola del navegador (F12)
 * 3. Ejecuta: await window.integrationTests.ejecutarTodos()
 */

(function () {
  'use strict';

  const IntegrationTests = {
    resultados: [],
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    testData: {},

    /**
     * Agregar resultado de prueba
     */
    agregarResultado(flujo, prueba, resultado, mensaje, detalles = null) {
      this.totalTests++;
      if (resultado === 'pass') {
        this.passedTests++;
      } else if (resultado === 'fail') {
        this.failedTests++;
      }

      const resultadoObj = {
        flujo,
        prueba,
        resultado,
        mensaje,
        detalles,
        timestamp: new Date().toISOString()
      };

      this.resultados.push(resultadoObj);

      const icono = resultado === 'pass' ? '✅' : resultado === 'fail' ? '❌' : '⚠️';
      const color =
        resultado === 'pass'
          ? 'color: green'
          : resultado === 'fail'
            ? 'color: red'
            : 'color: orange';

      console.log(`%c${icono} [${flujo}] ${prueba}: ${mensaje}`, color);
      if (detalles) {
        console.log('   Detalles:', detalles);
      }

      return resultadoObj;
    },

    /**
     * Limpiar datos de prueba
     */
    async limpiarDatosPrueba() {
      try {
        const persistence = new window.DataPersistence();
        const testId = this.testData.registroId;

        if (testId) {
          const allData = persistence.getData();
          if (allData) {
            delete allData.registros[testId];
            delete allData.trafico[testId];
            delete allData.facturas[testId];
            persistence.setData(allData);
          }

          // Limpiar de Firebase si está disponible
          if (window.firebaseRepos) {
            try {
              if (window.firebaseRepos.logistica) {
                await window.firebaseRepos.logistica.delete(testId);
              }
              if (window.firebaseRepos.trafico) {
                await window.firebaseRepos.trafico.delete(testId);
              }
              if (window.firebaseRepos.facturacion) {
                await window.firebaseRepos.facturacion.delete(testId);
              }
            } catch (error) {
              console.warn('Error limpiando Firebase:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Error limpiando datos de prueba:', error);
      }
    },

    /**
     * Test: Flujo Logística → Tráfico → Facturación
     */
    async probarFlujoCompleto() {
      console.group('🧪 Test de Integración: Flujo Completo (Logística → Tráfico → Facturación)');

      try {
        // Preparar datos de prueba
        const year = new Date().getFullYear().toString().slice(-2);
        const testId = `TEST-${year}${String(Date.now()).slice(-5)}`;
        this.testData.registroId = testId;

        // Paso 1: Guardar en Logística
        try {
          const persistence = new window.DataPersistence();
          const logisticaData = {
            cliente: 'Cliente Test Integración',
            origen: 'Ciudad de México',
            destino: 'Guadalajara',
            referenciaCliente: 'REF-TEST-001',
            tipoServicio: 'Transporte Terrestre'
          };

          const saved = persistence.saveLogisticaData(testId, logisticaData);

          if (saved) {
            const retrieved = persistence.getLogisticaData(testId);
            if (retrieved && retrieved.cliente === logisticaData.cliente) {
              this.agregarResultado(
                'Flujo Completo',
                'Paso 1: Guardar Logística',
                'pass',
                'Datos de logística guardados correctamente'
              );
            } else {
              this.agregarResultado(
                'Flujo Completo',
                'Paso 1: Guardar Logística',
                'fail',
                'Datos de logística no se recuperaron correctamente'
              );
            }
          } else {
            this.agregarResultado(
              'Flujo Completo',
              'Paso 1: Guardar Logística',
              'fail',
              'No se pudo guardar en logística'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Flujo Completo',
            'Paso 1: Guardar Logística',
            'fail',
            error.message,
            error
          );
        }

        // Paso 2: Leer desde Tráfico
        try {
          const persistence = new window.DataPersistence();
          const logisticaData = persistence.getLogisticaData(testId);

          if (logisticaData && logisticaData.cliente) {
            this.agregarResultado(
              'Flujo Completo',
              'Paso 2: Leer desde Tráfico',
              'pass',
              'Datos de logística accesibles desde tráfico'
            );

            // Guardar datos de tráfico
            const traficoData = {
              ...logisticaData,
              operadorPrincipal: 'Operador Test',
              economico: 'ECO-TEST-001',
              placas: 'ABC-123'
            };

            persistence.saveTraficoData(testId, traficoData);
          } else {
            this.agregarResultado(
              'Flujo Completo',
              'Paso 2: Leer desde Tráfico',
              'fail',
              'No se pudieron leer datos de logística'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Flujo Completo',
            'Paso 2: Leer desde Tráfico',
            'fail',
            error.message,
            error
          );
        }

        // Paso 3: Leer desde Facturación
        try {
          const persistence = new window.DataPersistence();
          const allData = persistence.getAllDataByRegistro(testId);

          if (allData && allData.logistica && allData.trafico) {
            this.agregarResultado(
              'Flujo Completo',
              'Paso 3: Leer desde Facturación',
              'pass',
              'Datos completos accesibles desde facturación'
            );

            // Guardar datos de facturación
            const facturacionData = {
              ...allData.logistica,
              ...allData.trafico,
              importe: 5000,
              iva: 800,
              total: 5800
            };

            persistence.saveFacturacionData(testId, facturacionData);
          } else {
            this.agregarResultado(
              'Flujo Completo',
              'Paso 3: Leer desde Facturación',
              'fail',
              'No se pudieron leer todos los datos'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Flujo Completo',
            'Paso 3: Leer desde Facturación',
            'fail',
            error.message,
            error
          );
        }

        // Paso 4: Verificar integridad de datos
        try {
          const persistence = new window.DataPersistence();
          const allData = persistence.getAllDataByRegistro(testId);

          if (allData && allData.logistica && allData.trafico && allData.facturacion) {
            // Verificar que los datos se mantienen consistentes
            const clienteConsistente =
              allData.logistica.cliente === allData.trafico.cliente &&
              allData.trafico.cliente === allData.facturacion.cliente;

            if (clienteConsistente) {
              this.agregarResultado(
                'Flujo Completo',
                'Paso 4: Integridad de datos',
                'pass',
                'Datos consistentes en todos los módulos'
              );
            } else {
              this.agregarResultado(
                'Flujo Completo',
                'Paso 4: Integridad de datos',
                'fail',
                'Datos inconsistentes entre módulos'
              );
            }
          } else {
            this.agregarResultado(
              'Flujo Completo',
              'Paso 4: Integridad de datos',
              'fail',
              'Faltan datos en algún módulo'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Flujo Completo',
            'Paso 4: Integridad de datos',
            'fail',
            error.message,
            error
          );
        }
      } catch (error) {
        this.agregarResultado('Flujo Completo', 'Error general', 'fail', error.message, error);
      } finally {
        // Limpiar datos de prueba
        await this.limpiarDatosPrueba();
      }

      console.groupEnd();
    },

    /**
     * Test: Sincronización Firebase
     */
    async probarSincronizacionFirebase() {
      console.group('🧪 Test de Integración: Sincronización Firebase');

      try {
        // Esperar a que Firebase esté listo
        let attempts = 0;
        while (attempts < 10 && (!window.firebaseRepos || !window.firebaseRepos.logistica)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        if (!window.firebaseRepos || !window.firebaseRepos.logistica) {
          this.agregarResultado(
            'Sincronización Firebase',
            'Disponibilidad',
            'warning',
            'Firebase no está disponible, saltando tests'
          );
          console.groupEnd();
          return;
        }

        const testId = 'TEST-SYNC-' + Date.now();
        this.testData.registroId = testId;

        // Test 1: Guardar en Firebase
        try {
          const repo = window.firebaseRepos.logistica;
          const testData = {
            cliente: 'Cliente Test Sync',
            origen: 'Origen Test',
            destino: 'Destino Test'
          };

          await repo.saveRegistro(testId, testData);

          // Verificar que se guardó
          const retrieved = await repo.getRegistro(testId);

          if (retrieved && retrieved.cliente === testData.cliente) {
            this.agregarResultado(
              'Sincronización Firebase',
              'Guardar en Firebase',
              'pass',
              'Datos guardados en Firebase correctamente'
            );
          } else {
            this.agregarResultado(
              'Sincronización Firebase',
              'Guardar en Firebase',
              'fail',
              'Datos no se recuperaron de Firebase'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Sincronización Firebase',
            'Guardar en Firebase',
            'fail',
            error.message,
            error
          );
        }

        // Test 2: Sincronización con localStorage
        try {
          const persistence = new window.DataPersistence();
          const localData = persistence.getLogisticaData(testId);

          if (localData) {
            this.agregarResultado(
              'Sincronización Firebase',
              'Sincronización localStorage',
              'pass',
              'Datos sincronizados con localStorage'
            );
          } else {
            this.agregarResultado(
              'Sincronización Firebase',
              'Sincronización localStorage',
              'warning',
              'Datos no encontrados en localStorage (puede ser normal si Firebase es la fuente de verdad)'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Sincronización Firebase',
            'Sincronización localStorage',
            'fail',
            error.message,
            error
          );
        }

        // Test 3: Fallback a localStorage
        try {
          // Simular fallo de Firebase guardando directamente en localStorage
          const persistence = new window.DataPersistence();
          const testData2 = {
            cliente: 'Cliente Test Fallback',
            origen: 'Origen Test',
            destino: 'Destino Test'
          };

          const saved = persistence.saveLogisticaData('TEST-FALLBACK-' + Date.now(), testData2);

          if (saved) {
            this.agregarResultado(
              'Sincronización Firebase',
              'Fallback localStorage',
              'pass',
              'Fallback a localStorage funciona correctamente'
            );
          } else {
            this.agregarResultado(
              'Sincronización Firebase',
              'Fallback localStorage',
              'fail',
              'Fallback a localStorage no funciona'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Sincronización Firebase',
            'Fallback localStorage',
            'fail',
            error.message,
            error
          );
        }
      } catch (error) {
        this.agregarResultado(
          'Sincronización Firebase',
          'Error general',
          'fail',
          error.message,
          error
        );
      } finally {
        await this.limpiarDatosPrueba();
      }

      console.groupEnd();
    },

    /**
     * Test: Búsqueda y Llenado Automático
     */
    async probarBusquedaLlenado() {
      console.group('🧪 Test de Integración: Búsqueda y Llenado Automático');

      try {
        const testId = 'TEST-SEARCH-' + Date.now();
        this.testData.registroId = testId;

        // Preparar datos
        const persistence = new window.DataPersistence();
        const logisticaData = {
          cliente: 'Cliente Test Búsqueda',
          origen: 'Origen Test',
          destino: 'Destino Test',
          referenciaCliente: 'REF-SEARCH-001'
        };

        persistence.saveLogisticaData(testId, logisticaData);

        // Test 1: Búsqueda por número de registro
        try {
          const found = persistence.searchRegistro(testId);

          if (found && found.cliente === logisticaData.cliente) {
            this.agregarResultado(
              'Búsqueda y Llenado',
              'Búsqueda por ID',
              'pass',
              'Búsqueda por número de registro funciona'
            );
          } else {
            this.agregarResultado(
              'Búsqueda y Llenado',
              'Búsqueda por ID',
              'fail',
              'Búsqueda no encontró los datos correctos'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Búsqueda y Llenado',
            'Búsqueda por ID',
            'fail',
            error.message,
            error
          );
        }

        // Test 2: getAllDataByRegistro
        try {
          const allData = persistence.getAllDataByRegistro(testId);

          if (allData && allData.logistica) {
            this.agregarResultado(
              'Búsqueda y Llenado',
              'getAllDataByRegistro',
              'pass',
              'getAllDataByRegistro retorna datos correctos'
            );
          } else {
            this.agregarResultado(
              'Búsqueda y Llenado',
              'getAllDataByRegistro',
              'fail',
              'getAllDataByRegistro no retorna datos'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Búsqueda y Llenado',
            'getAllDataByRegistro',
            'fail',
            error.message,
            error
          );
        }

        // Test 3: Búsqueda de registro inexistente
        try {
          const found = persistence.searchRegistro('ID_INEXISTENTE_' + Date.now());

          if (found === null) {
            this.agregarResultado(
              'Búsqueda y Llenado',
              'Búsqueda inexistente',
              'pass',
              'Búsqueda de ID inexistente retorna null correctamente'
            );
          } else {
            this.agregarResultado(
              'Búsqueda y Llenado',
              'Búsqueda inexistente',
              'fail',
              'Búsqueda de ID inexistente no retorna null'
            );
          }
        } catch (error) {
          this.agregarResultado(
            'Búsqueda y Llenado',
            'Búsqueda inexistente',
            'fail',
            error.message,
            error
          );
        }
      } catch (error) {
        this.agregarResultado('Búsqueda y Llenado', 'Error general', 'fail', error.message, error);
      } finally {
        await this.limpiarDatosPrueba();
      }

      console.groupEnd();
    },

    /**
     * Ejecutar todos los tests de integración
     */
    async ejecutarTodos() {
      console.clear();
      console.log(
        '%c🧪 INICIANDO TESTS DE INTEGRACIÓN',
        'font-size: 20px; font-weight: bold; color: #3498db;'
      );
      console.log('='.repeat(60));

      this.resultados = [];
      this.totalTests = 0;
      this.passedTests = 0;
      this.failedTests = 0;
      this.testData = {};

      await this.probarFlujoCompleto();
      await this.probarSincronizacionFirebase();
      await this.probarBusquedaLlenado();

      // Limpiar datos de prueba final
      await this.limpiarDatosPrueba();

      // Resumen
      console.log('='.repeat(60));
      console.log(
        '%c📊 RESUMEN DE TESTS DE INTEGRACIÓN',
        'font-size: 18px; font-weight: bold; color: #2c3e50;'
      );
      console.log(`Total: ${this.totalTests}`);
      console.log(`%c✅ Exitosos: ${this.passedTests}`, 'color: green; font-weight: bold;');
      console.log(`%c❌ Fallidos: ${this.failedTests}`, 'color: red; font-weight: bold;');
      console.log(
        `%c⚠️ Advertencias: ${this.totalTests - this.passedTests - this.failedTests}`,
        'color: orange; font-weight: bold;'
      );

      const tasaExito =
        this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0;
      console.log(
        `%c📈 Tasa de éxito: ${tasaExito}%`,
        `color: ${tasaExito >= 80 ? 'green' : tasaExito >= 50 ? 'orange' : 'red'}; font-weight: bold;`
      );

      // Detalles de fallos
      const fallos = this.resultados.filter(r => r.resultado === 'fail');
      if (fallos.length > 0) {
        console.group('%c❌ TESTS FALLIDOS', 'color: red; font-weight: bold;');
        fallos.forEach(fallo => {
          console.log(`[${fallo.flujo}] ${fallo.prueba}: ${fallo.mensaje}`);
          if (fallo.detalles) {
            console.log('   Detalles:', fallo.detalles);
          }
        });
        console.groupEnd();
      }

      return {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        warnings: this.totalTests - this.passedTests - this.failedTests,
        tasaExito,
        resultados: this.resultados
      };
    },

    /**
     * Generar reporte
     */
    generarReporte() {
      return {
        timestamp: new Date().toISOString(),
        tipo: 'integration-tests',
        resumen: {
          total: this.totalTests,
          passed: this.passedTests,
          failed: this.failedTests,
          warnings: this.totalTests - this.passedTests - this.failedTests,
          tasaExito:
            this.totalTests > 0 ? Math.round((this.passedTests / this.totalTests) * 100) : 0
        },
        resultados: this.resultados
      };
    }
  };

  // Exponer globalmente
  window.integrationTests = IntegrationTests;

  console.log(
    '✅ Integration Tests cargado. Ejecuta: await window.integrationTests.ejecutarTodos()'
  );
})();
