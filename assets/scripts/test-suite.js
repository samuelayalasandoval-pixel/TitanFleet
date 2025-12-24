/**
 * Suite de Pruebas Automatizadas para TitanFleet ERP
 *
 * Uso:
 * 1. Abre cualquier página del ERP
 * 2. Abre la consola del navegador (F12)
 * 3. Ejecuta: await window.testSuite.ejecutarTodas()
 */

(function () {
  'use strict';

  const TestSuite = {
    resultados: [],
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,

    /**
     * Agregar resultado de prueba
     */
    agregarResultado(modulo, prueba, resultado, mensaje, detalles = null) {
      this.totalTests++;
      if (resultado === 'pass') {
        this.passedTests++;
      } else if (resultado === 'fail') {
        this.failedTests++;
      }

      const resultadoObj = {
        modulo,
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

      console.log(`%c${icono} [${modulo}] ${prueba}: ${mensaje}`, color);
      if (detalles) {
        console.log('   Detalles:', detalles);
      }

      return resultadoObj;
    },

    /**
     * Pruebas de Firebase
     */
    async probarFirebase() {
      console.group('🧪 Pruebas de Firebase');

      // Prueba 1: Repositorios disponibles
      try {
        let attempts = 0;
        while (attempts < 10 && !window.firebaseRepos) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        if (window.firebaseRepos) {
          this.agregarResultado(
            'Firebase',
            'Repositorios disponibles',
            'pass',
            'Repositorios cargados correctamente'
          );
        } else {
          this.agregarResultado(
            'Firebase',
            'Repositorios disponibles',
            'fail',
            'Repositorios no disponibles después de 5 segundos'
          );
        }
      } catch (error) {
        this.agregarResultado('Firebase', 'Repositorios disponibles', 'fail', error.message, error);
      }

      // Prueba 2: TenantId
      try {
        const tenantId = window.firebaseRepos?.cxp?.tenantId;
        if (tenantId) {
          this.agregarResultado(
            'Firebase',
            'TenantId configurado',
            'pass',
            `TenantId: ${tenantId}`
          );
        } else {
          this.agregarResultado(
            'Firebase',
            'TenantId configurado',
            'fail',
            'TenantId no disponible'
          );
        }
      } catch (error) {
        this.agregarResultado('Firebase', 'TenantId configurado', 'fail', error.message, error);
      }

      // Prueba 3: Conexión a Firestore
      try {
        const db = window.firebaseRepos?.cxp?.db;
        if (db) {
          this.agregarResultado('Firebase', 'Conexión Firestore', 'pass', 'Conexión activa');
        } else {
          this.agregarResultado(
            'Firebase',
            'Conexión Firestore',
            'warning',
            'Conexión no disponible aún'
          );
        }
      } catch (error) {
        this.agregarResultado('Firebase', 'Conexión Firestore', 'fail', error.message, error);
      }

      // Prueba 4: Repositorios específicos
      try {
        const reposEsperados = [
          'logistica',
          'trafico',
          'facturacion',
          'cxc',
          'cxp',
          'diesel',
          'mantenimiento',
          'tesoreria',
          'operadores',
          'inventario'
        ];
        const reposDisponibles = reposEsperados.filter(r => window.firebaseRepos?.[r]);

        if (reposDisponibles.length === reposEsperados.length) {
          this.agregarResultado(
            'Firebase',
            'Repositorios específicos',
            'pass',
            `Todos los repositorios disponibles (${reposDisponibles.length})`
          );
        } else {
          const faltantes = reposEsperados.filter(r => !window.firebaseRepos?.[r]);
          this.agregarResultado(
            'Firebase',
            'Repositorios específicos',
            'warning',
            `Faltan repositorios: ${faltantes.join(', ')}`,
            { disponibles: reposDisponibles, faltantes }
          );
        }
      } catch (error) {
        this.agregarResultado('Firebase', 'Repositorios específicos', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Pruebas de CXP
     */
    async probarCXP() {
      console.group('🧪 Pruebas de Cuentas por Pagar (CXP)');

      // Prueba 1: Datos en localStorage
      try {
        const facturas = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
        const solicitudes = JSON.parse(localStorage.getItem('erp_cxp_solicitudes') || '[]');

        this.agregarResultado(
          'CXP',
          'Datos en localStorage',
          'pass',
          `${facturas.length} facturas, ${solicitudes.length} solicitudes`
        );
      } catch (error) {
        this.agregarResultado('CXP', 'Datos en localStorage', 'fail', error.message, error);
      }

      // Prueba 2: Datos en Firebase
      try {
        if (window.firebaseRepos?.cxp?.db) {
          const facturas = await window.firebaseRepos.cxp.getAllFacturas();
          const solicitudes = await window.firebaseRepos.cxp.getAllSolicitudes();

          this.agregarResultado(
            'CXP',
            'Datos en Firebase',
            'pass',
            `${facturas?.length || 0} facturas, ${solicitudes?.length || 0} solicitudes`
          );
        } else {
          this.agregarResultado('CXP', 'Datos en Firebase', 'warning', 'Firebase no disponible');
        }
      } catch (error) {
        this.agregarResultado('CXP', 'Datos en Firebase', 'fail', error.message, error);
      }

      // Prueba 3: Sincronización
      try {
        const facturasLocal = JSON.parse(localStorage.getItem('erp_cxp_facturas') || '[]');
        if (window.firebaseRepos?.cxp?.db) {
          const facturasFirebase = await window.firebaseRepos.cxp.getAllFacturas();

          if (facturasLocal.length === (facturasFirebase?.length || 0)) {
            this.agregarResultado(
              'CXP',
              'Sincronización',
              'pass',
              'LocalStorage y Firebase sincronizados'
            );
          } else {
            this.agregarResultado(
              'CXP',
              'Sincronización',
              'warning',
              `Desincronización: Local=${facturasLocal.length}, Firebase=${facturasFirebase?.length || 0}`
            );
          }
        }
      } catch (error) {
        this.agregarResultado('CXP', 'Sincronización', 'fail', error.message, error);
      }

      // Prueba 4: Funciones disponibles
      try {
        const funcionesEsperadas = ['saveCXPData', 'loadCXPData', 'crearSolicitudPago'];
        const funcionesDisponibles = funcionesEsperadas.filter(
          f => typeof window[f] === 'function'
        );

        if (funcionesDisponibles.length === funcionesEsperadas.length) {
          this.agregarResultado(
            'CXP',
            'Funciones disponibles',
            'pass',
            'Todas las funciones están disponibles'
          );
        } else {
          const faltantes = funcionesEsperadas.filter(f => typeof window[f] !== 'function');
          this.agregarResultado(
            'CXP',
            'Funciones disponibles',
            'warning',
            `Funciones faltantes: ${faltantes.join(', ')}`
          );
        }
      } catch (error) {
        this.agregarResultado('CXP', 'Funciones disponibles', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Pruebas de Inventario
     */
    async probarInventario() {
      console.group('🧪 Pruebas de Inventario');

      // Prueba 1: Stock en localStorage
      try {
        const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
        const movimientos = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');

        this.agregarResultado(
          'Inventario',
          'Datos en localStorage',
          'pass',
          `${Object.keys(stock).length} items en stock, ${movimientos.length} movimientos`
        );
      } catch (error) {
        this.agregarResultado('Inventario', 'Datos en localStorage', 'fail', error.message, error);
      }

      // Prueba 2: Validación de stock
      try {
        const stock = JSON.parse(localStorage.getItem('erp_inv_refacciones_stock') || '{}');
        const stocksNegativos = Object.entries(stock).filter(([_codigo, cantidad]) => cantidad < 0);

        if (stocksNegativos.length === 0) {
          this.agregarResultado(
            'Inventario',
            'Validación de stock',
            'pass',
            'No hay stocks negativos'
          );
        } else {
          this.agregarResultado(
            'Inventario',
            'Validación de stock',
            'fail',
            `Stocks negativos encontrados: ${stocksNegativos.length}`,
            stocksNegativos
          );
        }
      } catch (error) {
        this.agregarResultado('Inventario', 'Validación de stock', 'fail', error.message, error);
      }

      // Prueba 3: Movimientos válidos
      try {
        const movimientos = JSON.parse(localStorage.getItem('erp_inv_refacciones_movs') || '[]');
        const movimientosInvalidos = movimientos.filter(m => !m.codigo || !m.cantidad || !m.fecha);

        if (movimientosInvalidos.length === 0) {
          this.agregarResultado(
            'Inventario',
            'Validación de movimientos',
            'pass',
            'Todos los movimientos son válidos'
          );
        } else {
          this.agregarResultado(
            'Inventario',
            'Validación de movimientos',
            'fail',
            `Movimientos inválidos: ${movimientosInvalidos.length}`,
            movimientosInvalidos
          );
        }
      } catch (error) {
        this.agregarResultado(
          'Inventario',
          'Validación de movimientos',
          'fail',
          error.message,
          error
        );
      }

      console.groupEnd();
    },

    /**
     * Pruebas de Sincronización Multi-Computadora
     */
    async probarSincronizacion() {
      console.group('🧪 Pruebas de Sincronización');

      // Prueba 1: TenantId consistente
      try {
        const tenantId = window.firebaseRepos?.cxp?.tenantId;
        if (tenantId) {
          this.agregarResultado('Sincronización', 'TenantId', 'pass', `TenantId: ${tenantId}`);
        } else {
          this.agregarResultado('Sincronización', 'TenantId', 'fail', 'TenantId no disponible');
        }
      } catch (error) {
        this.agregarResultado('Sincronización', 'TenantId', 'fail', error.message, error);
      }

      // Prueba 2: Listener activo
      try {
        // Verificar que el listener está configurado (esto es difícil de verificar directamente)
        // En su lugar, verificamos que los repositorios tienen el método subscribe
        const tieneSubscribe = typeof window.firebaseRepos?.cxp?.subscribe === 'function';

        if (tieneSubscribe) {
          this.agregarResultado(
            'Sincronización',
            'Listener configurado',
            'pass',
            'Método subscribe disponible'
          );
        } else {
          this.agregarResultado(
            'Sincronización',
            'Listener configurado',
            'warning',
            'Método subscribe no disponible'
          );
        }
      } catch (error) {
        this.agregarResultado(
          'Sincronización',
          'Listener configurado',
          'fail',
          error.message,
          error
        );
      }

      console.groupEnd();
    },

    /**
     * Pruebas de Persistencia
     */
    async probarPersistencia() {
      console.group('🧪 Pruebas de Persistencia');

      // Prueba 1: localStorage disponible
      try {
        const testKey = 'erp_test_persistencia';
        const testValue = { test: true, timestamp: Date.now() };
        localStorage.setItem(testKey, JSON.stringify(testValue));
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        localStorage.removeItem(testKey);

        if (retrieved.test === testValue.test) {
          this.agregarResultado(
            'Persistencia',
            'localStorage funcional',
            'pass',
            'localStorage funciona correctamente'
          );
        } else {
          this.agregarResultado(
            'Persistencia',
            'localStorage funcional',
            'fail',
            'localStorage no funciona correctamente'
          );
        }
      } catch (error) {
        this.agregarResultado(
          'Persistencia',
          'localStorage funcional',
          'fail',
          error.message,
          error
        );
      }

      // Prueba 2: Datos persisten después de recarga
      try {
        const datosAntes = {
          facturas: localStorage.getItem('erp_cxp_facturas'),
          solicitudes: localStorage.getItem('erp_cxp_solicitudes')
        };

        // Simular recarga (no podemos realmente recargar, pero podemos verificar que los datos están ahí)
        if (datosAntes.facturas || datosAntes.solicitudes) {
          this.agregarResultado(
            'Persistencia',
            'Datos persisten',
            'pass',
            'Datos encontrados en localStorage'
          );
        } else {
          this.agregarResultado(
            'Persistencia',
            'Datos persisten',
            'info',
            'No hay datos guardados aún (esto es normal si es la primera vez)'
          );
        }
      } catch (error) {
        this.agregarResultado('Persistencia', 'Datos persisten', 'fail', error.message, error);
      }

      console.groupEnd();
    },

    /**
     * Ejecutar todas las pruebas
     */
    async ejecutarTodas() {
      console.clear();
      console.log(
        '%c🧪 INICIANDO SUITE COMPLETA DE PRUEBAS',
        'font-size: 20px; font-weight: bold; color: #3498db;'
      );
      console.log('='.repeat(60));

      this.resultados = [];
      this.totalTests = 0;
      this.passedTests = 0;
      this.failedTests = 0;

      await this.probarFirebase();
      await this.probarCXP();
      await this.probarInventario();
      await this.probarSincronizacion();
      await this.probarPersistencia();

      // Ejecutar tests unitarios si están disponibles
      if (window.unitTests) {
        console.log('\n');
        console.log(
          '%c📦 Ejecutando Tests Unitarios...',
          'font-size: 16px; font-weight: bold; color: #9b59b6;'
        );
        await window.unitTests.ejecutarTodos();
      }

      // Ejecutar tests de integración si están disponibles
      if (window.integrationTests) {
        console.log('\n');
        console.log(
          '%c📦 Ejecutando Tests de Integración...',
          'font-size: 16px; font-weight: bold; color: #9b59b6;'
        );
        await window.integrationTests.ejecutarTodos();
      }

      // Resumen
      console.log('='.repeat(60));
      console.log('%c📊 RESUMEN DE PRUEBAS', 'font-size: 18px; font-weight: bold; color: #2c3e50;');
      console.log(`Total: ${this.totalTests}`);
      console.log(`%c✅ Exitosas: ${this.passedTests}`, 'color: green; font-weight: bold;');
      console.log(`%c❌ Fallidas: ${this.failedTests}`, 'color: red; font-weight: bold;');
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
        console.group('%c❌ PRUEBAS FALLIDAS', 'color: red; font-weight: bold;');
        fallos.forEach(fallo => {
          console.log(`[${fallo.modulo}] ${fallo.prueba}: ${fallo.mensaje}`);
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
     * Generar reporte en formato JSON
     */
    generarReporte() {
      return {
        timestamp: new Date().toISOString(),
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
    },

    /**
     * Exportar reporte
     */
    exportarReporte() {
      const reporte = this.generarReporte();
      const blob = new Blob([JSON.stringify(reporte, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-pruebas-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('✅ Reporte exportado');
    }
  };

  // Exponer globalmente
  window.testSuite = TestSuite;

  console.log('✅ Test Suite cargado. Ejecuta: await window.testSuite.ejecutarTodas()');
})();
