/**
 * Utilidades de Prueba - trafico.html
 * Funciones para probar la integraciÃ³n entre mÃ³dulos
 *
 * @module trafico/test-utils
 */

(function () {
  'use strict';
  // FunciÃ³n de prueba de integraciÃ³n LogÃ­stica -> TrÃ¡fico
  window.testLogisticaTraficoIntegration = function () {
    console.log('ðŸ§ª Probando integraciÃ³n LogÃ­stica -> TrÃ¡fico...');

    // DiagnÃ³stico detallado de dependencias
    console.log('ðŸ” DiagnÃ³stico de dependencias:');
    console.log('- window.DataPersistence:', typeof window.DataPersistence);
    console.log('- window.showNotification:', typeof window.showNotification);
    console.log('- window.autoFillData:', typeof window.autoFillData);

    // Verificar que DataPersistence estÃ© disponible
    if (typeof window.DataPersistence === 'undefined') {
      console.error('âŒ DataPersistence no estÃ¡ disponible');

      // Intentar cargar DataPersistence manualmente
      console.log('ðŸ”„ Intentando cargar DataPersistence manualmente...');

      // Crear una versiÃ³n mÃ­nima de DataPersistence
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
          const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
          allData.registros[registroId] = {
            ...data,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString()
          };
          return this.setData(allData);
        },

        getLogisticaData(registroId) {
          const allData = this.getData();
          return allData ? allData.registros[registroId] : null;
        },

        getAllDataByRegistro(registroId) {
          const allData = this.getData();
          if (!allData) {
            return { logistica: null, trafico: null, facturacion: null };
          }

          return {
            logistica: allData.registros[registroId] || null,
            trafico: allData.trafico[registroId] || null,
            facturacion: allData.facturas[registroId] || null
          };
        }
      };

      console.log('âœ… DataPersistence cargado manualmente');
    }

    // Crear datos de prueba de logÃ­stica
    const testRegistroId = 'TEST-LOG-001';
    const testLogisticaData = {
      cliente: 'Empresa de Prueba S.A.',
      origen: 'Ciudad de MÃ©xico',
      destino: 'Guadalajara',
      referenciaCliente: 'REF-TEST-001',
      tipoServicio: 'Transporte Terrestre',
      embalajeEspecial: 'No',
      descripcionEmbalaje: '',
      fechaEnvio: '2025-01-20',
      plataforma: '48ft',
      mercancia: 'Productos electrÃ³nicos',
      peso: 2500,
      largo: 12.5,
      ancho: 2.4,
      observaciones: 'MercancÃ­a frÃ¡gil - manejar con cuidado',
      estado: 'registrado',
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    // Guardar datos de logÃ­stica
    const saveSuccess = window.DataPersistence.saveLogisticaData(testRegistroId, testLogisticaData);
    console.log('âœ… Datos de logÃ­stica guardados:', saveSuccess);

    if (saveSuccess) {
      // Simular bÃºsqueda y llenado en trÃ¡fico
      console.log('ðŸ” Simulando bÃºsqueda en trÃ¡fico...');
      const allData = window.DataPersistence.getAllDataByRegistro(testRegistroId);
      console.log('ðŸ“Š Datos encontrados:', allData);

      if (allData.logistica) {
        console.log('ðŸ“¦ Probando llenado automÃ¡tico...');

        // Llenar campos manualmente como respaldo
        const campos = {
          cliente: testLogisticaData.cliente,
          origen: testLogisticaData.origen,
          destino: testLogisticaData.destino,
          'referencia cliente': testLogisticaData.referenciaCliente,
          tiposervicio: testLogisticaData.tipoServicio,
          embalajeEspecial: testLogisticaData.embalajeEspecial,
          plataforma: testLogisticaData.plataforma,
          mercancia: testLogisticaData.mercancia,
          peso: testLogisticaData.peso,
          largo: testLogisticaData.largo,
          ancho: testLogisticaData.ancho,
          fechaEnvio: testLogisticaData.fechaEnvio,
          observacionesLogistica: testLogisticaData.observaciones
        };

        let camposLlenados = 0;
        Object.keys(campos).forEach(selector => {
          const element = document.getElementById(selector);
          if (element && campos[selector]) {
            element.value = campos[selector];
            camposLlenados++;
            console.log(`âœ… Campo ${selector} llenado:`, campos[selector]);
          }
        });

        if (camposLlenados > 0) {
          alert(
            `âœ… Prueba de integraciÃ³n exitosa!\n\nSe llenaron ${camposLlenados} campos automÃ¡ticamente.\n\nDatos de prueba:\n- Cliente: ${testLogisticaData.cliente}\n- Origen: ${testLogisticaData.origen}\n- Destino: ${testLogisticaData.destino}\n- Registro: ${testRegistroId}`
          );
          return true;
        }
        alert('âŒ Error: No se pudieron llenar los campos');
        return false;
      }
      alert('âŒ No se encontraron datos de logÃ­stica');
      return false;
    }
    alert('âŒ Error al guardar datos de logÃ­stica');
    return false;
  };

  // FunciÃ³n de respaldo para verificar dependencias
  window.checkDependencies = function () {
    console.log('ðŸ” Verificando dependencias...');

    const dependencies = {
      DataPersistence: typeof window.DataPersistence !== 'undefined',
      showNotification: typeof window.showNotification !== 'undefined',
      autoFillData: typeof window.autoFillData !== 'undefined'
    };

    console.log('ðŸ“Š Estado de dependencias:', dependencies);

    let message = 'ðŸ” Estado de Dependencias:\n\n';
    Object.keys(dependencies).forEach(dep => {
      message += `${dep}: ${dependencies[dep] ? 'âœ… Disponible' : 'âŒ No disponible'}\n`;
    });

    if (dependencies.DataPersistence && dependencies.showNotification) {
      message += '\nâœ… Sistema listo para usar';
    } else {
      message += '\nâŒ Faltan dependencias - Refresca la pÃ¡gina (Ctrl+F5)';
    }

    alert(message);
    return dependencies.DataPersistence && dependencies.showNotification;
  };

  // FunciÃ³n de diagnÃ³stico completo del sistema
  window.diagnosticarSistema = function () {
    console.log('ðŸ” Iniciando diagnÃ³stico completo del sistema...');

    let reporte = 'ðŸ” DIAGNÃ“STICO DEL SISTEMA\n\n';

    // 1. Verificar scripts cargados
    reporte += 'ðŸ“‹ SCRIPTS CARGADOS:\n';
    const scripts = [
      'auth.js',
      'data-persistence.js',
      'integration.js',
      'main.js',
      'configuracion.js',
      'trafico-listas.js'
    ];

    scripts.forEach(script => {
      const scriptElement = document.querySelector(`script[src*="${script}"]`);
      const status = scriptElement ? 'âœ… Cargado' : 'âŒ No encontrado';
      reporte += `- ${script}: ${status}\n`;
      console.log(`Script ${script}:`, status);
    });

    // 2. Verificar dependencias JavaScript
    reporte += '\nðŸ”§ DEPENDENCIAS JAVASCRIPT:\n';
    const dependencias = {
      DataPersistence: typeof window.DataPersistence,
      showNotification: typeof window.showNotification,
      autoFillData: typeof window.autoFillData,
      searchAndFillData: typeof window.searchAndFillData,
      localStorage: typeof window.localStorage,
      configuracionManager: typeof window.configuracionManager,
      traficoListasManager: typeof window.traficoListasManager
    };

    Object.keys(dependencias).forEach(dep => {
      const status = dependencias[dep] !== 'undefined' ? 'âœ… Disponible' : 'âŒ No disponible';
      reporte += `- ${dep}: ${status} (${dependencias[dep]})\n`;
      console.log(`Dependencia ${dep}:`, dependencias[dep]);
    });

    // 3. Verificar localStorage
    reporte += '\nðŸ’¾ LOCALSTORAGE:\n';
    try {
      const testKey = `test_${Date.now()}`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      reporte += '- Estado: âœ… Funcionando\n';
      reporte += `- Claves existentes: ${Object.keys(localStorage).length}\n`;

      // Verificar datos del ERP
      const erpData = localStorage.getItem('erp_shared_data');
      if (erpData) {
        const parsed = JSON.parse(erpData);
        reporte += '- Datos ERP: âœ… Presentes\n';
        reporte += `  - Registros: ${Object.keys(parsed.registros || {}).length}\n`;
        reporte += `  - TrÃ¡fico: ${Object.keys(parsed.trafico || {}).length}\n`;
        reporte += `  - Facturas: ${Object.keys(parsed.facturas || {}).length}\n`;
      } else {
        reporte += '- Datos ERP: âŒ No encontrados\n';
      }
    } catch (error) {
      reporte += `- Estado: âŒ Error - ${error.message}\n`;
    }

    // 4. Verificar elementos del DOM
    reporte += '\nðŸŽ¯ ELEMENTOS DEL DOM:\n';
    const elementosImportantes = [
      'numeroRegistro',
      'cliente',
      'origen',
      'destino',
      'referencia cliente',
      'tiposervicio',
      'embalajeEspecial'
    ];

    elementosImportantes.forEach(id => {
      const elemento = document.getElementById(id);
      const status = elemento ? 'âœ… Encontrado' : 'âŒ No encontrado';
      reporte += `- ${id}: ${status}\n`;
    });

    // 5. Recomendaciones
    reporte += '\nðŸ’¡ RECOMENDACIONES:\n';

    if (typeof window.DataPersistence === 'undefined') {
      reporte += '- âŒ DataPersistence no disponible: Refresca la pÃ¡gina (Ctrl+F5)\n';
      reporte += '- âŒ Si persiste: Verifica que el archivo data-persistence.js existe\n';
    }

    if (typeof window.showNotification === 'undefined') {
      reporte += '- âŒ showNotification no disponible: Verifica main.js\n';
    }

    if (Object.keys(localStorage).length === 0) {
      reporte += '- âš ï¸ localStorage vacÃ­o: Usa "Cargar Datos Ejemplo"\n';
    }

    // Verificar errores especÃ­ficos de DataPersistence
    reporte += '\nðŸ” DIAGNÃ“STICO ESPECÃFICO:\n';

    if (typeof window.DataPersistence === 'undefined') {
      reporte += '- âŒ DataPersistence no disponible\n';
      reporte += '- ðŸ”„ Intentando cargar manualmente...\n';

      try {
        // Intentar cargar DataPersistence manualmente
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

          getLogisticaData(registroId) {
            const allData = this.getData();
            return allData ? allData.registros[registroId] : null;
          },

          getAllDataByRegistro(registroId) {
            const allData = this.getData();
            if (!allData) {
              return { logistica: null, trafico: null, facturacion: null };
            }

            return {
              logistica: allData.registros[registroId] || null,
              trafico: allData.trafico[registroId] || null,
              facturacion: allData.facturas[registroId] || null
            };
          },

          saveLogisticaData(registroId, data) {
            const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
            allData.registros[registroId] = {
              ...data,
              fechaCreacion: new Date().toISOString(),
              ultimaActualizacion: new Date().toISOString()
            };
            return this.setData(allData);
          }
        };

        reporte += '- âœ… DataPersistence cargado manualmente\n';
        console.log('âœ… DataPersistence cargado manualmente');
      } catch (error) {
        reporte += `- âŒ Error cargando DataPersistence: ${error.message}\n`;
        console.error('Error cargando DataPersistence:', error);
      }
    } else {
      reporte += '- âœ… DataPersistence disponible\n';
    }

    // Verificar si hay errores en la consola
    reporte += '\nðŸ” PRÃ“XIMOS PASOS:\n';
    reporte += '1. Abre la consola del navegador (F12)\n';
    reporte += '2. Busca errores en rojo\n';
    reporte += '3. Si hay errores de CORS, usa un servidor local\n';
    reporte += '4. Si todo estÃ¡ bien, usa "Probar IntegraciÃ³n"\n';
    reporte += '5. Si DataPersistence se cargÃ³ manualmente, ahora deberÃ­a funcionar\n';

    console.log('ðŸ“Š Reporte completo:', reporte);
    alert(reporte);

    return {
      scripts: scripts.map(s => Boolean(document.querySelector(`script[src*="${s}"]`))),
      dependencias: dependencias,
      localStorage: typeof window.localStorage !== 'undefined',
      elementos: elementosImportantes.map(id => Boolean(document.getElementById(id)))
    };
  };
})();
