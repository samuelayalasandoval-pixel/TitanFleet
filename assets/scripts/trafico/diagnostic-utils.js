/**
 * Funciones de DiagnÃ³stico - trafico.html
 * Funciones para diagnosticar problemas del sistema
 *
 * @module trafico/diagnostic-utils
 */

(function () {
  'use strict';
  window.diagnosticarProblemaBuzon = function () {
    console.log('ðŸ” === DIAGNÃ“STICO PROBLEMA BUZÃ“N ===');

    try {
      // 1. Verificar contador actual
      const contador = document.getElementById('contadorPendientesTrafico');
      console.log(
        'ðŸ“Š Contador actual en DOM:',
        contador ? contador.textContent : 'No encontrado'
      );

      // 2. Verificar sincronizacionUtils
      if (typeof window.sincronizacionUtils === 'undefined') {
        console.log('âŒ sincronizacionUtils no estÃ¡ disponible');
        return;
      }

      // 3. Verificar estados de sincronizaciÃ³n
      const sincronizacionStates = localStorage.getItem('erp_sincronizacion_states');
      if (!sincronizacionStates) {
        console.log('âŒ No hay estados de sincronizaciÃ³n - este es el problema');
        console.log('ðŸ’¡ Ejecuta: window.inicializarEstadosSincronizacion()');
        return;
      }

      const states = JSON.parse(sincronizacionStates);
      console.log('ðŸ“Š Estados de sincronizaciÃ³n disponibles:', Object.keys(states).length);

      // 4. Verificar cada registro y su estado
      let registrosConLogisticaCompleta = 0;
      let registrosConTraficoPendiente = 0;

      Object.keys(states).forEach(registroId => {
        const status = states[registroId];
        const logisticaCompleta = status.modulos.logistica && status.modulos.logistica.completado;
        const traficoPendiente = status.modulos.trafico && !status.modulos.trafico.completado;

        if (logisticaCompleta) {
          registrosConLogisticaCompleta++;
        }

        if (logisticaCompleta && traficoPendiente) {
          registrosConTraficoPendiente++;
          console.log(`âœ… ${registroId}: LogÃ­stica completa, TrÃ¡fico pendiente`);
        } else if (logisticaCompleta && !traficoPendiente) {
          console.log(`âŒ ${registroId}: LogÃ­stica completa, TrÃ¡fico tambiÃ©n completo`);
        } else if (!logisticaCompleta) {
          console.log(`âš ï¸ ${registroId}: LogÃ­stica pendiente`);
        }
      });

      console.log('ðŸ“Š Resumen:');
      console.log(`   - Registros con logÃ­stica completa: ${registrosConLogisticaCompleta}`);
      console.log(`   - Registros con trÃ¡fico pendiente: ${registrosConTraficoPendiente}`);

      // 5. Probar la funciÃ³n obtenerRegistrosPendientes
      const registrosPendientes = window.sincronizacionUtils.obtenerRegistrosPendientes('trafico');
      console.log(
        `ðŸ“Š Registros pendientes desde sincronizacionUtils: ${registrosPendientes.length}`
      );

      if (registrosPendientes.length === 0 && registrosConTraficoPendiente > 0) {
        console.log(
          'âŒ PROBLEMA ENCONTRADO: La funciÃ³n no encuentra registros pendientes cuando deberÃ­a'
        );
        console.log('ðŸ’¡ Posibles causas:');
        console.log('   1. Error en la lÃ³gica de obtenerRegistrosPendientes');
        console.log('   2. Estados de sincronizaciÃ³n mal formateados');
        console.log('   3. Problema con la condiciÃ³n de filtrado');
      } else if (registrosPendientes.length > 0) {
        console.log('âœ… La funciÃ³n encuentra registros pendientes correctamente');
      } else {
        console.log('âœ… No hay registros pendientes, el buzÃ³n estÃ¡ correcto');
      }

      // 6. Mostrar detalles de los registros encontrados
      if (registrosPendientes.length > 0) {
        console.log('ðŸ“‹ Registros pendientes encontrados:');
        registrosPendientes.forEach(registro => {
          console.log(`   - ${registro.registroId}: Progreso ${registro.progreso}%`);
        });
      }
    } catch (error) {
      console.error('âŒ Error en diagnÃ³stico:', error);
    }

    console.log('ðŸ” === FIN DIAGNÃ“STICO ===');
  };

  window.corregirContadorBuzon = function () {
    console.log('ðŸ”§ === CORRIGIENDO CONTADOR DEL BUZÃ“N ===');

    try {
      // 1. Calcular el valor real
      const valorReal = window.actualizarContador();
      console.log('ðŸ“Š Valor real calculado:', valorReal);

      // 2. Actualizar el contador en el DOM
      const contador = document.getElementById('contadorPendientesTrafico');
      if (contador) {
        contador.textContent = valorReal;
        contador.classList.remove('bg-danger', 'bg-warning', 'bg-success');

        if (valorReal > 0) {
          contador.classList.add('bg-warning');
          console.log('âœ… Contador actualizado a:', valorReal, '(pendientes)');
        } else {
          contador.classList.add('bg-success');
          console.log('âœ… Contador actualizado a:', valorReal, '(sin pendientes)');
        }
      } else {
        console.error('âŒ No se encontrÃ³ el elemento contadorPendientesTrafico');
      }

      // 3. Limpiar cualquier cache o valor fijo
      if (window._valorContadorFijo) {
        delete window._valorContadorFijo;
        console.log('ðŸ§¹ Cache del contador limpiado');
      }

      // 4. Desactivar protecciones que puedan estar interfiriendo
      if (window._proteccionContadorActiva) {
        window._proteccionContadorActiva = false;
        console.log('ðŸ§¹ ProtecciÃ³n del contador desactivada');
      }

      // 5. Verificar que el cambio se mantenga
      setTimeout(() => {
        const contadorVerificado = document.getElementById('contadorPendientesTrafico');
        if (contadorVerificado) {
          console.log('ðŸ” VerificaciÃ³n despuÃ©s de 2 segundos:', contadorVerificado.textContent);
          if (contadorVerificado.textContent !== valorReal.toString()) {
            console.log('âš ï¸ El contador se reseteÃ³, aplicando correcciÃ³n permanente...');
            contadorVerificado.textContent = valorReal;
            contadorVerificado.classList.remove('bg-danger', 'bg-warning', 'bg-success');
            contadorVerificado.classList.add(valorReal > 0 ? 'bg-warning' : 'bg-success');
          }
        }
      }, 2000);

      console.log('âœ… Contador corregido exitosamente');
    } catch (error) {
      console.error('âŒ Error corrigiendo contador:', error);
    }

    console.log('ðŸ”§ === FIN CORRECCIÃ“N ===');
  };

  window.diagnosticarCliente = function () {
    console.log('ðŸ” === DIAGNÃ“STICO DE CLIENTE ===');

    // Verificar configuracionManager
    console.log('1. configuracionManager disponible:', Boolean(window.configuracionManager));
    if (window.configuracionManager) {
      console.log(
        '   - getCliente disponible:',
        typeof window.configuracionManager.getCliente === 'function'
      );
      console.log(
        '   - getAllClientes disponible:',
        typeof window.configuracionManager.getAllClientes === 'function'
      );
    }

    // Verificar datos en localStorage
    console.log('2. Datos de clientes en localStorage:');
    const clientesData = localStorage.getItem('erp_clientes');
    if (clientesData) {
      const clientes = JSON.parse(clientesData);
      console.log('   - Clientes disponibles:', Object.keys(clientes));
      console.log('   - Total clientes:', Object.keys(clientes).length);

      // Mostrar detalles de cada cliente
      Object.keys(clientes).forEach(rfc => {
        const cliente = clientes[rfc];
        console.log(
          `   - ${rfc}: ${cliente.nombreCliente || 'Sin nombre'} (${cliente.tipoCliente || 'Sin tipo'})`
        );
      });
    } else {
      console.log('   - No hay datos de clientes en localStorage');
    }

    // Verificar datos de logÃ­stica
    console.log('3. Datos de logÃ­stica en localStorage:');
    const allData = window.DataPersistence ? window.DataPersistence.getData() : null;
    if (allData && allData.registros) {
      console.log('   - Registros disponibles:', Object.keys(allData.registros));

      Object.keys(allData.registros).forEach(registroId => {
        const registro = allData.registros[registroId];
        console.log(
          `   - ${registroId}: cliente="${registro.cliente}", rfcCliente="${registro.rfcCliente}"`
        );
      });
    } else {
      console.log('   - No hay datos de logÃ­stica en localStorage');
    }

    // Probar bÃºsqueda de cliente especÃ­fico
    console.log('4. Prueba de bÃºsqueda de cliente:');
    const testRfc = 'aass920711f63';
    console.log(`   - Buscando cliente con RFC: ${testRfc}`);

    if (
      window.configuracionManager &&
      typeof window.configuracionManager.getCliente === 'function'
    ) {
      const clienteData = window.configuracionManager.getCliente(testRfc);
      console.log('   - Resultado de configuracionManager:', clienteData);
    }

    if (clientesData) {
      const clientes = JSON.parse(clientesData);
      const clienteData = clientes[testRfc];
      console.log('   - Resultado de localStorage:', clienteData);
    }

    console.log('ðŸ” === FIN DEL DIAGNÃ“STICO ===');
    alert('DiagnÃ³stico completado. Revisa la consola para ver los detalles.');
  };
})();
