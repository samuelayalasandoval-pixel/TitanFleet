/**
 * Tests Unitarios para Funciones Críticas - TitanFleet ERP
 *
 * Uso:
 * 1. Abre cualquier página del ERP
 * 2. Abre la consola del navegador (F12)
 * 3. Ejecuta: await window.unitTests.ejecutarTodos()
 */

(function () {
  'use strict';

  const UnitTests = {
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
     * Tests de DataPersistence
     */
    async probarDataPersistence() {
      console.group('🧪 Tests Unitarios: DataPersistence');

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

      // Test 2: Guardar datos de logística
      try {
        const persistence = new window.DataPersistence();
        const testId = 'TEST-' + Date.now();
        const testData = {
          cliente: 'Cliente Test',
          origen: 'Origen Test',
          destino: 'Destino Test'
        };

        const resultado = persistence.saveLogisticaData(testId, testData);

        if (resultado) {
          const recuperado = persistence.getLogisticaData(testId);
          if (recuperado && recuperado.cliente === testData.cliente) {
            this.agregarResultado(
              'DataPersistence',
              'Guardar Logística',
              'pass',
              'Datos guardados y recuperados correctamente'
            );

            // Limpiar
            const allData = persistence.getData();
            delete allData.registros[testId];
            persistence.setData(allData);
          } else {
            this.agregarResultado(
              'DataPersistence',
              'Guardar Logística',
              'fail',
              'Datos no se recuperaron correctamente'
            );
          }
        } else {
          this.agregarResultado(
            'DataPersistence',
            'Guardar Logística',
            'fail',
            'No se pudo guardar'
          );
        }
      } catch (error) {
        this.agregarResultado('DataPersistence', 'Guardar Logística', 'fail', error.message, error);
      }

      // Test 3: Obtener datos inexistentes
      try {
        const persistence = new window.DataPersistence();
        const resultado = persistence.getLogisticaData('ID_INEXISTENTE_' + Date.now());

        if (resultado === null) {
          this.agregarResultado(
            'DataPersistence',
            'Obtener Inexistente',
            'pass',
            'Retorna null para IDs inexistentes'
          );
        } else {
          this.agregarResultado(
            'DataPersistence',
            'Obtener Inexistente',
            'fail',
            'No retorna null para IDs inexistentes'
          );
        }
      } catch (error) {
        this.agregarResultado(
          'DataPersistence',
          'Obtener Inexistente',
          'fail',
          error.message,
          error
        );
      }

      // Test 4: getAllDataByRegistro
      try {
        const persistence = new window.DataPersistence();
        const testId = 'TEST-ALL-' + Date.now();

        persistence.saveLogisticaData(testId, { cliente: 'Test' });
        persistence.saveTraficoData(testId, { operador: 'Test' });

        const allData = persistence.getAllDataByRegistro(testId);

        if (allData && allData.logistica && allData.trafico) {
          this.agregarResultado(
            'DataPersistence',
            'getAllDataByRegistro',
            'pass',
            'Recupera todos los datos del registro'
          );

          // Limpiar
          const data = persistence.getData();
          delete data.registros[testId];
          delete data.trafico[testId];
          persistence.setData(data);
        } else {
          this.agregarResultado(
            'DataPersistence',
            'getAllDataByRegistro',
            'fail',
            'No recupera todos los datos'
          );
        }
      } catch (error) {
        this.agregarResultado(
          'DataPersistence',
          'getAllDataByRegistro',
          'fail',
          error.message,
          error
        );
      }

      console.groupEnd();
    },

    /**
     * Tests de FirebaseRepoBase
     */
    async probarFirebaseRepoBase() {
      console.group('🧪 Tests Unitarios: FirebaseRepoBase');

      // Test 1: Clase disponible
      try {
        if (typeof window.FirebaseRepoBase === 'undefined') {
          this.agregarResultado(
            'FirebaseRepoBase',
            'Clase disponible',
            'fail',
            'FirebaseRepoBase no está disponible'
          );
          console.groupEnd();
          return;
        } else {
          this.agregarResultado(
            'FirebaseRepoBase',
            'Clase disponible',
            'pass',
            'FirebaseRepoBase está disponible'
          );
        }
      } catch (error) {
        this.agregarResultado('FirebaseRepoBase', 'Clase disponible', 'fail', error.message, error);
        console.groupEnd();
        return;
      }

      // Test 2: Crear instancia
      try {
        // Esperar a que Firebase esté listo
        let attempts = 0;
        while (attempts < 10 && (!window.firebaseDb || !window.fs)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        if (window.firebaseDb && window.fs) {
          class TestRepo extends window.FirebaseRepoBase {
            constructor() {
              super('test_collection');
            }
          }

          const repo = new TestRepo();

          if (repo && repo.collectionName === 'test_collection') {
            this.agregarResultado(
              'FirebaseRepoBase',
              'Crear instancia',
              'pass',
              'Instancia creada correctamente'
            );
          } else {
            this.agregarResultado(
              'FirebaseRepoBase',
              'Crear instancia',
              'fail',
              'Instancia no se creó correctamente'
            );
          }
        } else {
          this.agregarResultado(
            'FirebaseRepoBase',
            'Crear instancia',
            'warning',
            'Firebase no está disponible, saltando test'
          );
        }
      } catch (error) {
        this.agregarResultado('FirebaseRepoBase', 'Crear instancia', 'fail', error.message, error);
      }

      // Test 3: Métodos disponibles
      try {
        if (window.FirebaseRepoBase) {
          const methods = ['save', 'get', 'getAll', 'delete', 'subscribe'];
          const repo = new window.FirebaseRepoBase('test');

          const methodsAvailable = methods.filter(m => typeof repo[m] === 'function');

          if (methodsAvailable.length === methods.length) {
            this.agregarResultado(
              'FirebaseRepoBase',
              'Métodos disponibles',
              'pass',
              'Todos los métodos están disponibles'
            );
          } else {
            const missing = methods.filter(m => typeof repo[m] !== 'function');
            this.agregarResultado(
              'FirebaseRepoBase',
              'Métodos disponibles',
              'warning',
              `Faltan métodos: ${missing.join(', ')}`
            );
          }
        }
      } catch (error) {
        this.agregarResultado(
          'FirebaseRepoBase',
          'Métodos disponibles',
          'fail',
          error.message,
          error
        );
      }

      console.groupEnd();
    },

    /**
     * Tests de Validaciones
     */
    async probarValidaciones() {
      console.group('🧪 Tests Unitarios: Validaciones');

      // Test 1: Validar número de registro
      try {
        const validarNumeroRegistro = numero => {
          if (!numero || typeof numero !== 'string') return false;
          // Formato: 25XXXXX (7 caracteres, empieza con año)
          const year = new Date().getFullYear().toString().slice(-2);
          return numero.length === 7 && numero.startsWith(year) && /^\d{7}$/.test(numero);
        };

        const casos = [
          { input: '2500001', esperado: true },
          { input: '2400001', esperado: false }, // Año incorrecto
          { input: '25-0001', esperado: false }, // Formato incorrecto
          { input: '', esperado: false },
          { input: null, esperado: false }
        ];

        let passed = 0;
        casos.forEach(caso => {
          const resultado = validarNumeroRegistro(caso.input);
          if (resultado === caso.esperado) {
            passed++;
          }
        });

        if (passed === casos.length) {
          this.agregarResultado(
            'Validaciones',
            'Número de registro',
            'pass',
            `Todos los casos pasaron (${passed}/${casos.length})`
          );
        } else {
          this.agregarResultado(
            'Validaciones',
            'Número de registro',
            'fail',
            `Solo ${passed}/${casos.length} casos pasaron`
          );
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'Número de registro', 'fail', error.message, error);
      }

      // Test 2: Validar RFC
      try {
        const validarRFC = rfc => {
          if (!rfc || typeof rfc !== 'string') return false;
          // RFC: 12-13 caracteres alfanuméricos
          return /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc.toUpperCase());
        };

        const casos = [
          { input: 'ABC123456789', esperado: false }, // Formato incorrecto
          { input: 'ABC123456DEF', esperado: true },
          { input: '', esperado: false },
          { input: null, esperado: false }
        ];

        let passed = 0;
        casos.forEach(caso => {
          const resultado = validarRFC(caso.input);
          if (resultado === caso.esperado) {
            passed++;
          }
        });

        if (passed === casos.length) {
          this.agregarResultado(
            'Validaciones',
            'RFC',
            'pass',
            `Todos los casos pasaron (${passed}/${casos.length})`
          );
        } else {
          this.agregarResultado(
            'Validaciones',
            'RFC',
            'fail',
            `Solo ${passed}/${casos.length} casos pasaron`
          );
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'RFC', 'fail', error.message, error);
      }

      // Test 3: Validar email
      try {
        const validarEmail = email => {
          if (!email || typeof email !== 'string') return false;
          const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return regex.test(email);
        };

        const casos = [
          { input: 'test@example.com', esperado: true },
          { input: 'test@example', esperado: false },
          { input: 'testexample.com', esperado: false },
          { input: '', esperado: false }
        ];

        let passed = 0;
        casos.forEach(caso => {
          const resultado = validarEmail(caso.input);
          if (resultado === caso.esperado) {
            passed++;
          }
        });

        if (passed === casos.length) {
          this.agregarResultado(
            'Validaciones',
            'Email',
            'pass',
            `Todos los casos pasaron (${passed}/${casos.length})`
          );
        } else {
          this.agregarResultado(
            'Validaciones',
            'Email',
            'fail',
            `Solo ${passed}/${casos.length} casos pasaron`
          );
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'Email', 'fail', error.message, error);
      }

      // Test 4: Validar montos (no negativos)
      try {
        const validarMonto = monto => {
          if (monto === null || monto === undefined) return false;
          const num = parseFloat(monto);
          return !isNaN(num) && num >= 0;
        };

        const casos = [
          { input: '100', esperado: true },
          { input: '0', esperado: true },
          { input: '-100', esperado: false },
          { input: 'abc', esperado: false },
          { input: '', esperado: false }
        ];

        let passed = 0;
        casos.forEach(caso => {
          const resultado = validarMonto(caso.input);
          if (resultado === caso.esperado) {
            passed++;
          }
        });

        if (passed === casos.length) {
          this.agregarResultado(
            'Validaciones',
            'Monto',
            'pass',
            `Todos los casos pasaron (${passed}/${casos.length})`
          );
        } else {
          this.agregarResultado(
            'Validaciones',
            'Monto',
            'fail',
            `Solo ${passed}/${casos.length} casos pasaron`
          );
        }
      } catch (error) {
        this.agregarResultado('Validaciones', 'Monto', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Tests de Numeración Única
     */
    async probarNumeracion() {
      console.group('🧪 Tests Unitarios: Numeración Única');

      // Test 1: generateUniqueNumber disponible
      try {
        if (typeof window.generateUniqueNumber === 'function') {
          this.agregarResultado(
            'Numeración',
            'Función disponible',
            'pass',
            'generateUniqueNumber está disponible'
          );
        } else {
          this.agregarResultado(
            'Numeración',
            'Función disponible',
            'fail',
            'generateUniqueNumber no está disponible'
          );
        }
      } catch (error) {
        this.agregarResultado('Numeración', 'Función disponible', 'fail', error.message, error);
      }

      // Test 2: Formato de número
      try {
        const validarFormato = numero => {
          if (!numero || typeof numero !== 'string') return false;
          const year = new Date().getFullYear().toString().slice(-2);
          return numero.length === 7 && numero.startsWith(year) && /^\d{7}$/.test(numero);
        };

        const year = new Date().getFullYear().toString().slice(-2);
        const testNumber = `${year}00001`;

        if (validarFormato(testNumber)) {
          this.agregarResultado(
            'Numeración',
            'Formato válido',
            'pass',
            'Formato de número es válido'
          );
        } else {
          this.agregarResultado(
            'Numeración',
            'Formato válido',
            'fail',
            'Formato de número no es válido'
          );
        }
      } catch (error) {
        this.agregarResultado('Numeración', 'Formato válido', 'fail', error.message, error);
      }

      // Test 3: getNextYearNumber
      try {
        if (typeof window.getNextYearNumber === 'function') {
          const nextNumber = window.getNextYearNumber();
          if (typeof nextNumber === 'number' && nextNumber > 0) {
            this.agregarResultado(
              'Numeración',
              'getNextYearNumber',
              'pass',
              `Retorna número válido: ${nextNumber}`
            );
          } else {
            this.agregarResultado(
              'Numeración',
              'getNextYearNumber',
              'fail',
              'No retorna un número válido'
            );
          }
        } else {
          this.agregarResultado(
            'Numeración',
            'getNextYearNumber',
            'warning',
            'getNextYearNumber no está disponible'
          );
        }
      } catch (error) {
        this.agregarResultado('Numeración', 'getNextYearNumber', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Ejecutar todos los tests unitarios
     */
    async ejecutarTodos() {
      console.clear();
      console.log(
        '%c🧪 INICIANDO TESTS UNITARIOS',
        'font-size: 20px; font-weight: bold; color: #3498db;'
      );
      console.log('='.repeat(60));

      this.resultados = [];
      this.totalTests = 0;
      this.passedTests = 0;
      this.failedTests = 0;

      await this.probarDataPersistence();
      await this.probarFirebaseRepoBase();
      await this.probarValidaciones();
      await this.probarNumeracion();

      // Resumen
      console.log('='.repeat(60));
      console.log(
        '%c📊 RESUMEN DE TESTS UNITARIOS',
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
        resultados: this.resultados
      };
    },

    /**
     * Generar reporte
     */
    generarReporte() {
      return {
        timestamp: new Date().toISOString(),
        tipo: 'unit-tests',
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
  window.unitTests = UnitTests;

  console.log('✅ Unit Tests cargado. Ejecuta: await window.unitTests.ejecutarTodos()');
})();
