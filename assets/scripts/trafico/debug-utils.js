/**
 * Utilidades de Debug - trafico.html
 * Funciones para debuggear y diagnosticar el sistema
 *
 * @module trafico/debug-utils
 */

(function () {
  'use strict';
  window.debugTraficoData = function () {
    console.log('ðŸ” DEBUG: Verificando datos de TrÃ¡fico...');
    const raw = localStorage.getItem('erp_shared_data');
    const parsed = raw ? JSON.parse(raw) : {};
    const trafico = parsed.trafico || {};
    const registros = Object.keys(trafico);

    console.log('ðŸ“‹ Total registros en TrÃ¡fico:', registros.length);

    if (registros.length > 0) {
      registros.forEach((regId, index) => {
        const datos = trafico[regId];
        console.log(`ðŸ“„ Registro ${index + 1} (${regId}):`);
        console.log('- referencia cliente:', datos['referencia cliente']);
        console.log('- referenciaCliente:', datos.referenciaCliente);
        console.log('- ReferenciaCliente:', datos.ReferenciaCliente);
        console.log('ðŸ“‹ Todas las claves:', Object.keys(datos));
      });

      const primerRegistro = registros[0];
      const datos = trafico[primerRegistro];
      console.log(`ðŸ“„ Estructura completa del registro ${primerRegistro}:`, datos);

      // Verificar campos especÃ­ficos
      console.log('ðŸ” Verificando campos especÃ­ficos:');
      console.log('- RFC Cliente:', datos.rfcCliente, datos.RFC, datos.rfc);
      console.log(
        '- Referencia Cliente:',
        datos['referencia cliente'],
        datos.referenciaCliente,
        datos.ReferenciaCliente
      );
      console.log(
        '- Tipo Servicio:',
        datos.tipoServicio,
        datos.TipoServicio,
        datos.plataformaServicio
      );
      console.log('- Tipo MercancÃ­a:', datos.tipoMercancia, datos.TipoMercancia, datos.mercancia);
      console.log('- Placas Tractor:', datos.PlacasTractor, datos.placasTractor, datos.Placas);
      console.log(
        '- Operador Principal:',
        datos.operadorPrincipal,
        datos.OperadorPrincipal,
        datos.operadorprincipal
      );
      console.log(
        '- Licencia Operador Principal:',
        datos.licenciaOperadorPrincipal,
        datos.LicenciaOperadorPrincipal,
        datos.Licencia
      );
      console.log(
        '- Operador Secundario:',
        datos.operadorSecundario,
        datos.OperadorSecundario,
        datos.operadorsecundario
      );
      console.log(
        '- Licencia Operador Secundario:',
        datos.licenciaOperadorSecundario,
        datos.LicenciaOperadorSecundario,
        datos.LicenciaSecundaria
      );
      console.log('- Observaciones LogÃ­stica:', datos.observacionesLogistica);
      console.log('- Observaciones TrÃ¡fico:', datos.observacionesTrafico, datos.observaciones);
      console.log('- Notas Generales:', datos.notas, datos.observaciones);
      console.log('- Fecha Registro TrÃ¡fico:', datos.fechaRegistroTrafico);
    }

    return trafico;
  };

  // FunciÃ³n para debuggear especÃ­ficamente la exportaciÃ³n
  window.debugExportacionTrafico = function () {
    console.log('ðŸ” DEBUG: Verificando exportaciÃ³n de TrÃ¡fico...');
    const raw = localStorage.getItem('erp_shared_data');
    const parsed = raw ? JSON.parse(raw) : {};
    const trafico = parsed.trafico || {};
    const registros = Object.keys(trafico);

    if (registros.length > 0) {
      const primerRegistro = registros[0];
      const registro = trafico[primerRegistro];

      // FunciÃ³n helper para obtener valores de mÃºltiples campos posibles
      const getValue = (...fields) => {
        for (const field of fields) {
          if (registro[field] !== undefined && registro[field] !== null && registro[field] !== '') {
            console.log(`âœ… Campo encontrado: ${field} = ${registro[field]}`);
            return registro[field];
          }
        }
        console.log(`âŒ No se encontrÃ³ ninguno de los campos: ${fields.join(', ')}`);
        return '';
      };

      console.log('ðŸ” Probando funciÃ³n getValue para Referencia Cliente:');
      const referenciaCliente = getValue(
        'referencia cliente',
        'referenciaCliente',
        'ReferenciaCliente'
      );
      console.log('ðŸ“‹ Resultado final para Referencia Cliente:', referenciaCliente);
    }
  };

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
