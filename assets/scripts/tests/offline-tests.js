/**
 * Tests que pueden ejecutarse OFFLINE (sin conexión a internet)
 * TitanFleet ERP
 *
 * Uso:
 * await window.offlineTests.ejecutarTodos()
 */

(function () {
  'use strict';

  const OfflineTests = {
    resultados: [],
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,

    /**
     * Agregar resultado de prueba
     */
    agregarResultado(funcion, prueba, resultado, mensaje, detalles = null) {
      this.totalTests++;
      if (resultado === 'pass') {
        this.passedTests++;
      } else if (resultado === 'fail') {
        this.failedTests++;
      }

      const resultadoObj = {
        funcion,
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

      console.log(`%c${icono} [${funcion}] ${prueba}: ${mensaje}`, color);
      if (detalles) {
        console.log('   Detalles:', detalles);
      }

      return resultadoObj;
    },

    /**
     * Verificar conexión a internet
     */
    verificarConexion() {
      return navigator.onLine;
    },

    /**
     * Tests de DataPersistence (OFFLINE)
     */
    async probarDataPersistence() {
      console.group('🧪 Tests OFFLINE: DataPersistence');

      // Test 1: Inicialización
      try {
        if (typeof window.DataPersistence === 'undefined') {
          this.agregarResultado(
            'DataPersistence',
            'Inicialización',
            'fail',
            'DataPersistence no está disponible'
          );
        } else {
          const persistence = new window.DataPersistence();
          const data = persistence.getData();

          if (data && typeof data === 'object') {
            this.agregarResultado(
              'DataPersistence',
              'Inicialización',
              'pass',
              'DataPersistence inicializado correctamente'
            );
          } else {
            this.agregarResultado(
              'DataPersistence',
              'Inicialización',
              'fail',
              'DataPersistence no inicializó datos correctamente'
            );
          }
        }
      } catch (error) {
        this.agregarResultado('DataPersistence', 'Inicialización', 'fail', error.message, error);
      }

      // Test 2: Guardar y recuperar datos
      try {
        const persistence = new window.DataPersistence();
        const testId = 'TEST-OFFLINE-' + Date.now();
        const testData = {
          cliente: 'Cliente Test Offline',
          origen: 'Origen Test',
          destino: 'Destino Test'
        };

        const resultado = persistence.saveLogisticaData(testId, testData);

        if (resultado) {
          const recuperado = persistence.getLogisticaData(testId);
          if (recuperado && recuperado.cliente === testData.cliente) {
            this.agregarResultado(
              'DataPersistence',
              'Guardar/Recuperar',
              'pass',
              'Datos guardados y recuperados correctamente (OFFLINE)'
            );

            // Limpiar
            const allData = persistence.getData();
            delete allData.registros[testId];
            persistence.setData(allData);
          } else {
            this.agregarResultado(
              'DataPersistence',
              'Guardar/Recuperar',
              'fail',
              'Datos no se recuperaron correctamente'
            );
          }
        } else {
          this.agregarResultado(
            'DataPersistence',
            'Guardar/Recuperar',
            'fail',
            'No se pudo guardar'
          );
        }
      } catch (error) {
        this.agregarResultado('DataPersistence', 'Guardar/Recuperar', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Tests de Validaciones (OFFLINE)
     */
    async probarValidaciones() {
      console.group('🧪 Tests OFFLINE: Validaciones');

      // Verificar que FormValidations esté disponible
      if (typeof window.FormValidations === 'undefined') {
        this.agregarResultado(
          'Validaciones',
          'Disponibilidad',
          'warning',
          'FormValidations no está disponible'
        );
        console.groupEnd();
        return;
      }

      // Test 1: Validar número de registro
      try {
        const resultado = window.FormValidations.validarNumeroRegistro('2500001');
        if (resultado.valido) {
          this.agregarResultado(
            'Validaciones',
            'Número de registro',
            'pass',
            'Validación de número de registro funciona'
          );
        } else {
          this.agregarResultado('Validaciones', 'Número de registro', 'fail', resultado.mensaje);
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'Número de registro', 'fail', error.message, error);
      }

      // Test 2: Validar RFC
      try {
        const resultado = window.FormValidations.validarRFC('ABC123456DEF');
        if (resultado.valido) {
          this.agregarResultado('Validaciones', 'RFC', 'pass', 'Validación de RFC funciona');
        } else {
          this.agregarResultado('Validaciones', 'RFC', 'fail', resultado.mensaje);
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'RFC', 'fail', error.message, error);
      }

      // Test 3: Validar email
      try {
        const resultado = window.FormValidations.validarEmail('test@example.com');
        if (resultado.valido) {
          this.agregarResultado('Validaciones', 'Email', 'pass', 'Validación de email funciona');
        } else {
          this.agregarResultado('Validaciones', 'Email', 'fail', resultado.mensaje);
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'Email', 'fail', error.message, error);
      }

      // Test 4: Validar monto
      try {
        const resultado = window.FormValidations.validarMonto('100');
        if (resultado.valido) {
          this.agregarResultado('Validaciones', 'Monto', 'pass', 'Validación de monto funciona');
        } else {
          this.agregarResultado('Validaciones', 'Monto', 'fail', resultado.mensaje);
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'Monto', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Tests de localStorage (OFFLINE)
     */
    async probarLocalStorage() {
      console.group('🧪 Tests OFFLINE: localStorage');

      // Test 1: localStorage disponible
      try {
        if (typeof Storage !== 'undefined') {
          this.agregarResultado(
            'localStorage',
            'Disponibilidad',
            'pass',
            'localStorage está disponible'
          );
        } else {
          this.agregarResultado(
            'localStorage',
            'Disponibilidad',
            'fail',
            'localStorage no está disponible'
          );
        }
      } catch (error) {
        this.agregarResultado('localStorage', 'Disponibilidad', 'fail', error.message, error);
      }

      // Test 2: Guardar y recuperar
      try {
        const testKey = 'erp_test_offline_' + Date.now();
        const testValue = { test: true, timestamp: Date.now() };

        localStorage.setItem(testKey, JSON.stringify(testValue));
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        localStorage.removeItem(testKey);

        if (retrieved && retrieved.test === testValue.test) {
          this.agregarResultado(
            'localStorage',
            'Guardar/Recuperar',
            'pass',
            'localStorage funciona correctamente'
          );
        } else {
          this.agregarResultado(
            'localStorage',
            'Guardar/Recuperar',
            'fail',
            'localStorage no funciona correctamente'
          );
        }
      } catch (error) {
        this.agregarResultado('localStorage', 'Guardar/Recuperar', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Ejecutar todos los tests OFFLINE
     */
    async ejecutarTodos() {
      console.clear();
      console.log(
        '%c🧪 INICIANDO TESTS OFFLINE (Sin conexión requerida)',
        'font-size: 20px; font-weight: bold; color: #3498db;'
      );
      console.log('='.repeat(60));

      // Verificar conexión
      const tieneConexion = this.verificarConexion();
      if (tieneConexion) {
        console.log(
          '%cℹ️ Conexión detectada. Estos tests funcionan tanto online como offline.',
          'color: #17a2b8;'
        );
      } else {
        console.log(
          '%cℹ️ Sin conexión. Ejecutando solo tests que no requieren internet.',
          'color: #ffc107;'
        );
      }

      this.resultados = [];
      this.totalTests = 0;
      this.passedTests = 0;
      this.failedTests = 0;

      await this.probarDataPersistence();
      await this.probarValidaciones();
      await this.probarLocalStorage();

      // Resumen
      console.log('='.repeat(60));
      console.log(
        '%c📊 RESUMEN DE TESTS OFFLINE',
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
          console.log(`[${fallo.funcion}] ${fallo.prueba}: ${fallo.mensaje}`);
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
        resultados: this.resultados,
        conexion: tieneConexion
      };
    }
  };

  // Exponer globalmente
  window.offlineTests = OfflineTests;

  console.log('✅ Offline Tests cargado. Ejecuta: await window.offlineTests.ejecutarTodos()');
})();
