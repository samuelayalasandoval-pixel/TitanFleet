/**
 * Diagnósticos y Utilidades de Registros de Logística - logistica.html
 * Funciones de diagnóstico, recuperación y limpieza de datos
 */

(function () {
  'use strict';

  // ============================================================
  // FUNCIÓN: Diagnosticar registros
  // ============================================================
  window.diagnosticarRegistrosLogistica = function () {
    console.log('🔍 === DIAGNÓSTICO REGISTROS DE LOGÍSTICA ===');

    const logisticaData = localStorage.getItem('erp_logistica');
    if (logisticaData) {
      const parsed = JSON.parse(logisticaData);
      console.log('📊 Datos en erp_logistica:', parsed.length || Object.keys(parsed).length);
      console.log('📋 Registros en erp_logistica:', parsed);
    } else {
      console.log('❌ No hay datos en erp_logistica');
    }

    const sharedData = localStorage.getItem('erp_shared_data');
    if (sharedData) {
      const parsed = JSON.parse(sharedData);
      console.log('📊 Datos en erp_shared_data:', Object.keys(parsed));

      if (parsed.registros) {
        console.log(
          '📋 Registros en erp_shared_data.registros:',
          Object.keys(parsed.registros).length
        );
        console.log('📋 IDs de registros:', Object.keys(parsed.registros));
      }
    } else {
      console.log('❌ No hay datos en erp_shared_data');
    }

    const registrationNumbers = localStorage.getItem('registrationNumbers');
    if (registrationNumbers) {
      const parsed = JSON.parse(registrationNumbers);
      console.log('📊 Números de registro generados:', parsed.length);
      console.log('📋 Últimos 10 números:', parsed.slice(-10));
    } else {
      console.log('❌ No hay datos en registrationNumbers');
    }

    const activeRegistrationNumber = localStorage.getItem('activeRegistrationNumber');
    console.log('📊 Número de registro activo:', activeRegistrationNumber);

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  };

  // ============================================================
  // FUNCIÓN: Recuperar registros faltantes
  // ============================================================
  window.recuperarRegistrosFaltantes = function () {
    console.log('🔧 === RECUPERANDO REGISTROS FALTANTES ===');

    try {
      const registrationNumbers = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
      console.log('📊 Números de registro generados:', registrationNumbers.length);

      const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '[]');
      const numerosExistentes = new Set(logisticaData.map(reg => reg.numeroRegistro || reg.id));
      console.log('📊 Números existentes en logística:', Array.from(numerosExistentes));

      const numerosFaltantes = registrationNumbers
        .map(item => item.number)
        .filter(numero => !numerosExistentes.has(numero));

      console.log('📊 Números faltantes:', numerosFaltantes);

      if (numerosFaltantes.length === 0) {
        console.log('✅ No hay registros faltantes');
        return;
      }

      const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      const registrosReales = sharedData.registros || {};
      console.log('📊 Registros en erp_shared_data:', Object.keys(registrosReales));

      const registrosFaltantes = numerosFaltantes.map(numero => {
        const datosReales = registrosReales[numero];

        if (datosReales) {
          console.log(`✅ Datos reales encontrados para ${numero}:`, datosReales);
          return {
            id: numero,
            registroId: numero,
            numeroRegistro: numero,
            fechaCreacion: datosReales.fechaCreacion || new Date().toISOString(),
            cliente: datosReales.cliente || 'Cliente Pendiente',
            origen: datosReales.origen || 'Origen Pendiente',
            destino: datosReales.destino || 'Destino Pendiente',
            tipoServicio: datosReales.tipoServicio || 'general',
            peso: datosReales.peso || 0,
            valor: datosReales.valor || 0,
            estado: datosReales.estado || 'pendiente',
            recuperado: true,
            datosReales: true
          };
        }
        console.log(`⚠️ No se encontraron datos reales para ${numero}, usando datos básicos`);
        return {
          id: numero,
          registroId: numero,
          numeroRegistro: numero,
          fechaCreacion: new Date().toISOString(),
          cliente: 'Cliente Pendiente',
          origen: 'Origen Pendiente',
          destino: 'Destino Pendiente',
          tipoServicio: 'general',
          peso: 0,
          valor: 0,
          estado: 'pendiente',
          recuperado: true,
          datosReales: false
        };
      });

      const nuevosRegistros = [...logisticaData, ...registrosFaltantes];
      localStorage.setItem('erp_logistica', JSON.stringify(nuevosRegistros));

      const conDatosReales = registrosFaltantes.filter(r => r.datosReales).length;
      const conDatosBasicos = registrosFaltantes.filter(r => !r.datosReales).length;

      console.log(`✅ ${registrosFaltantes.length} registros recuperados:`, numerosFaltantes);
      console.log(`📊 Con datos reales: ${conDatosReales}, Con datos básicos: ${conDatosBasicos}`);

      window.cargarRegistrosLogistica();

      alert(
        `✅ Registros recuperados!\n\n${registrosFaltantes.length} registros faltantes han sido recuperados:\n${numerosFaltantes.join(', ')}\n\n- Con datos reales: ${conDatosReales}\n- Con datos básicos: ${conDatosBasicos}\n\nLos registros con datos básicos pueden ser editados.`
      );
    } catch (error) {
      console.error('❌ Error recuperando registros:', error);
      alert('❌ Error al recuperar registros faltantes.');
    }

    console.log('🔧 === FIN RECUPERACIÓN ===');
  };

  // ============================================================
  // FUNCIÓN: Limpiar número de registro activo
  // ============================================================
  window.limpiarNumeroRegistroActivo = function () {
    console.log('🧹 === LIMPIANDO NÚMERO DE REGISTRO ACTIVO ===');

    try {
      const activeRegistrationNumber = localStorage.getItem('activeRegistrationNumber');
      console.log('📊 Número de registro activo actual:', activeRegistrationNumber);

      const registrationNumbers = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
      const numero2500012 = registrationNumbers.find(item => item.number === '2500012');

      if (numero2500012) {
        console.log('📋 2500012 encontrado en números generados:', numero2500012);

        const numerosLimpios = registrationNumbers.filter(item => item.number !== '2500012');
        localStorage.setItem('registrationNumbers', JSON.stringify(numerosLimpios));
        console.log('✅ 2500012 eliminado de números generados');

        const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '[]');
        const registro2500012 = logisticaData.find(
          reg => (reg.numeroRegistro || reg.id) === '2500012'
        );

        if (registro2500012) {
          console.log('📋 2500012 encontrado en erp_logistica:', registro2500012);

          const logisticaLimpia = logisticaData.filter(
            reg => (reg.numeroRegistro || reg.id) !== '2500012'
          );
          localStorage.setItem('erp_logistica', JSON.stringify(logisticaLimpia));
          console.log('✅ 2500012 eliminado de erp_logistica');
        }

        localStorage.setItem('activeRegistrationNumber', '2500011');
        console.log('✅ Número de registro activo establecido a 2500011');

        window.cargarRegistrosLogistica();

        alert(
          '✅ Limpieza completada!\n\n- 2500012 eliminado de números generados\n- 2500012 eliminado de registros de logística\n- Número activo establecido a 2500011\n\nAhora tienes 11 registros correctos (2500001-2500011).'
        );
      } else {
        console.log('✅ 2500012 no está en números generados');

        if (activeRegistrationNumber === '2500012') {
          localStorage.setItem('activeRegistrationNumber', '2500011');
          console.log('✅ Número de registro activo corregido a 2500011');
          alert('✅ Número de registro activo corregido a 2500011');
        } else {
          console.log('✅ Número de registro activo ya está correcto');
          alert('✅ No se encontró 2500012 para limpiar. El sistema ya está correcto.');
        }
      }
    } catch (error) {
      console.error('❌ Error limpiando número de registro activo:', error);
      alert('❌ Error al limpiar el número de registro activo.');
    }

    console.log('🧹 === FIN LIMPIEZA ===');
  };

  // ============================================================
  // FUNCIÓN: Verificar datos reales
  // ============================================================
  window.verificarDatosReales = function () {
    console.log('🔍 === VERIFICANDO DATOS REALES DE REGISTROS 2500007-2500011 ===');

    const registrosAVerificar = ['2500007', '2500008', '2500009', '2500010', '2500011'];

    try {
      console.log('📊 1. Verificando en erp_shared_data...');
      const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      const registrosShared = sharedData.registros || {};

      registrosAVerificar.forEach(numero => {
        const datos = registrosShared[numero];
        if (datos) {
          console.log(`✅ ${numero} encontrado en erp_shared_data:`, datos);
        } else {
          console.log(`❌ ${numero} NO encontrado en erp_shared_data`);
        }
      });

      console.log('📊 2. Verificando en erp_logistica...');
      const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '[]');

      registrosAVerificar.forEach(numero => {
        const datos = logisticaData.find(reg => (reg.numeroRegistro || reg.id) === numero);
        if (datos) {
          console.log(`✅ ${numero} encontrado en erp_logistica:`, datos);
        } else {
          console.log(`❌ ${numero} NO encontrado en erp_logistica`);
        }
      });

      console.log('📊 3. Verificando en erp_trafico...');
      const traficoData = JSON.parse(localStorage.getItem('erp_trafico') || '[]');

      registrosAVerificar.forEach(numero => {
        const datos = traficoData.find(reg => (reg.numeroRegistro || reg.id) === numero);
        if (datos) {
          console.log(`✅ ${numero} encontrado en erp_trafico:`, datos);
        } else {
          console.log(`❌ ${numero} NO encontrado en erp_trafico`);
        }
      });

      console.log('📊 4. Verificando en registrationNumbers...');
      const registrationNumbers = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');

      registrosAVerificar.forEach(numero => {
        const datos = registrationNumbers.find(item => item.number === numero);
        if (datos) {
          console.log(`✅ ${numero} encontrado en registrationNumbers:`, datos);
        } else {
          console.log(`❌ ${numero} NO encontrado en registrationNumbers`);
        }
      });

      console.log('📊 5. Verificando en todas las claves de localStorage...');
      const todasLasClaves = Object.keys(localStorage);
      console.log('📋 Todas las claves de localStorage:', todasLasClaves);

      registrosAVerificar.forEach(numero => {
        console.log(`🔍 Buscando ${numero} en todas las claves...`);
        let encontrado = false;

        todasLasClaves.forEach(clave => {
          try {
            const valor = localStorage.getItem(clave);
            if (valor && valor.includes(numero)) {
              console.log(`✅ ${numero} encontrado en clave "${clave}"`);
              encontrado = true;
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        });

        if (!encontrado) {
          console.log(`❌ ${numero} NO encontrado en ninguna clave de localStorage`);
        }
      });

      console.log('📊 === RESUMEN ===');
      registrosAVerificar.forEach(numero => {
        const enShared = registrosShared[numero] ? '✅' : '❌';
        const enLogistica = logisticaData.find(reg => (reg.numeroRegistro || reg.id) === numero)
          ? '✅'
          : '❌';
        const enTrafico = traficoData.find(reg => (reg.numeroRegistro || reg.id) === numero)
          ? '✅'
          : '❌';
        const enRegistration = registrationNumbers.find(item => item.number === numero)
          ? '✅'
          : '❌';

        console.log(
          `${numero}: Shared=${enShared} Logística=${enLogistica} Tráfico=${enTrafico} Registration=${enRegistration}`
        );
      });
    } catch (error) {
      console.error('❌ Error verificando datos reales:', error);
    }

    console.log('🔍 === FIN VERIFICACIÓN ===');
  };

  // ============================================================
  // FUNCIÓN: Eliminar registros de prueba
  // ============================================================
  window.eliminarRegistrosPrueba = function () {
    console.log('🧹 === ELIMINANDO REGISTROS DE PRUEBA 2500007-2500011 ===');

    const registrosAEliminar = ['2500007', '2500008', '2500009', '2500010', '2500011'];
    let eliminados = 0;

    try {
      console.log('📊 1. Eliminando de erp_logistica...');
      const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '[]');
      const logisticaOriginal = logisticaData.length;

      const logisticaFiltrada = logisticaData.filter(reg => {
        const numero = reg.numeroRegistro || reg.id || reg.registroId;
        return !registrosAEliminar.includes(numero);
      });

      localStorage.setItem('erp_logistica', JSON.stringify(logisticaFiltrada));
      console.log(
        `✅ Eliminados ${logisticaOriginal - logisticaFiltrada.length} registros de erp_logistica`
      );
      eliminados += logisticaOriginal - logisticaFiltrada.length;

      console.log('📊 2. Eliminando de registrationNumbers...');
      const registrationNumbers = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
      const registrationOriginal = registrationNumbers.length;

      const registrationFiltrada = registrationNumbers.filter(
        item => !registrosAEliminar.includes(item.number)
      );

      localStorage.setItem('registrationNumbers', JSON.stringify(registrationFiltrada));
      console.log(
        `✅ Eliminados ${registrationOriginal - registrationFiltrada.length} números de registrationNumbers`
      );
      eliminados += registrationOriginal - registrationFiltrada.length;

      console.log('📊 3. Eliminando de erp_sincronizacion_states...');
      const sincronizacionStates = JSON.parse(
        localStorage.getItem('erp_sincronizacion_states') || '{}'
      );
      let sincronizacionEliminados = 0;

      registrosAEliminar.forEach(numero => {
        if (sincronizacionStates[numero]) {
          delete sincronizacionStates[numero];
          sincronizacionEliminados++;
        }
      });

      localStorage.setItem('erp_sincronizacion_states', JSON.stringify(sincronizacionStates));
      console.log(`✅ Eliminados ${sincronizacionEliminados} estados de sincronización`);
      eliminados += sincronizacionEliminados;

      console.log('📊 4. Verificando activeRegistrationNumber...');
      const activeNumber = localStorage.getItem('activeRegistrationNumber');
      if (registrosAEliminar.includes(activeNumber)) {
        localStorage.setItem('activeRegistrationNumber', '2500006');
        console.log('✅ activeRegistrationNumber ajustado a 2500006');
      }

      console.log('📊 5. Recargando tabla de registros...');
      window.cargarRegistrosLogistica();

      console.log('🎉 === ELIMINACIÓN COMPLETADA ===');
      console.log(`📊 Total de registros eliminados: ${eliminados}`);
      console.log(`📋 Registros eliminados: ${registrosAEliminar.join(', ')}`);

      alert(
        `✅ Eliminación completada!\n\n📊 Total eliminados: ${eliminados} registros\n📋 Registros: ${registrosAEliminar.join(', ')}\n\n🔄 La tabla se ha recargado automáticamente.`
      );
    } catch (error) {
      console.error('❌ Error eliminando registros de prueba:', error);
      alert('❌ Error al eliminar los registros de prueba.');
    }

    console.log('🧹 === FIN ELIMINACIÓN ===');
  };

  console.log('✅ Módulo registros-diagnostics.js cargado');
})();
