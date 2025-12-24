/**
 * Corrección de Datos - trafico.html
 * Funciones para corregir y diagnosticar datos de tráfico
 *
 * @module trafico/data-correction
 */

(function () {
  'use strict';

  // Función para corregir datos de tráfico
  window.corregirDatosTrafico = function () {
    const traficoData = localStorage.getItem('erp_trafico');
    if (!traficoData) {
      return;
    }

    const registros = JSON.parse(traficoData);
    let corregidos = 0;

    registros.forEach(r => {
      // Corregir campos undefined
      if (!r.numeroRegistro && r.id) {
        r.numeroRegistro = r.id;
        corregidos++;
      }
      if (!r.registroId && (r.numeroRegistro || r.id)) {
        r.registroId = r.numeroRegistro || r.id;
        corregidos++;
      }
      if (!r.cliente) {
        r.cliente = 'N/A';
      }
      if (!r.estado) {
        r.estado = 'pendiente';
      }
    });

    if (corregidos > 0) {
      localStorage.setItem('erp_trafico', JSON.stringify(registros));
      console.log(`✅ ${corregidos} campos de tráfico corregidos`);
    }
  };

  // Función para diagnosticar problema con registro específico
  window.diagnosticarRegistro = function (registroId) {
    console.log(`🔍 === DIAGNÓSTICO PARA REGISTRO ${registroId} ===`);

    // 1. Verificar en erp_trafico
    const traficoData = localStorage.getItem('erp_trafico');
    if (traficoData) {
      const registros = JSON.parse(traficoData);
      console.log('📊 Total registros en erp_trafico:', registros.length);

      const encontrado = registros.find(
        r =>
          r.numeroRegistro === registroId ||
          r.id === registroId ||
          r.registroId === registroId ||
          // También buscar por formato anterior para compatibilidad
          (registroId.startsWith('2025-10-') && (r.numeroRegistro || r.id || '').includes('0001'))
      );

      if (encontrado) {
        console.log('✅ Registro encontrado en erp_trafico:', encontrado);
      } else {
        console.log('❌ Registro NO encontrado en erp_trafico');
        console.log(
          '📋 Registros disponibles:',
          registros.map(r => r.numeroRegistro || r.id)
        );
      }
    } else {
      console.log('❌ No hay datos en erp_trafico');
    }

    // 2. Verificar en erp_shared_data
    const sharedData = localStorage.getItem('erp_shared_data');
    if (sharedData) {
      const data = JSON.parse(sharedData);
      console.log('📊 Estructura erp_shared_data:', Object.keys(data));

      if (data.registros && data.registros[registroId]) {
        console.log(
          '✅ Registro encontrado en erp_shared_data.registros:',
          data.registros[registroId]
        );
      } else {
        console.log('❌ Registro NO encontrado en erp_shared_data.registros');
        if (data.registros) {
          console.log('📋 Registros disponibles:', Object.keys(data.registros));
        }
      }

      if (data.trafico && data.trafico[registroId]) {
        console.log('✅ Registro encontrado en erp_shared_data.trafico:', data.trafico[registroId]);
      } else {
        console.log('❌ Registro NO encontrado en erp_shared_data.trafico');
        if (data.trafico) {
          console.log('📋 Registros de tráfico disponibles:', Object.keys(data.trafico));
        }
      }
    } else {
      console.log('❌ No hay datos en erp_shared_data');
    }

    // 3. Verificar en erp_logistica
    const logisticaData = localStorage.getItem('erp_logistica');
    if (logisticaData) {
      const data = JSON.parse(logisticaData);
      console.log(
        '📊 Datos en erp_logistica:',
        typeof data,
        Array.isArray(data) ? data.length : Object.keys(data).length
      );

      let encontrado = null;
      if (Array.isArray(data)) {
        encontrado = data.find(r => r.numeroRegistro === registroId);
      } else if (typeof data === 'object') {
        encontrado =
          data[registroId] || Object.values(data).find(r => r.numeroRegistro === registroId);
      }

      if (encontrado) {
        console.log('✅ Registro encontrado en erp_logistica:', encontrado);
      } else {
        console.log('❌ Registro NO encontrado en erp_logistica');
        if (Array.isArray(data)) {
          console.log(
            '📋 Registros disponibles:',
            data.map(r => r.numeroRegistro)
          );
        } else {
          console.log('📋 Registros disponibles:', Object.keys(data));
        }
      }
    } else {
      console.log('❌ No hay datos en erp_logistica');
    }
  };
})();
