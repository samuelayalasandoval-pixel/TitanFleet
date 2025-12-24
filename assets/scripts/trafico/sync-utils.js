/**
 * Utilidades de Sincronización - trafico.html
 * Funciones para sincronizar y detectar cambios en registros
 *
 * @module trafico/sync-utils
 */

(function () {
  'use strict';

  // Función para detectar nuevos registros automáticamente
  window.detectarNuevosRegistros = function () {
    console.log('🔍 Iniciando detección automática de nuevos registros...');

    let ultimoConteoLogistica = 0;
    let ultimoConteoTrafico = 0;

    // Función para contar registros actuales
    const contarRegistros = () => {
      const logisticaData = localStorage.getItem('erp_logistica');
      const traficoData = localStorage.getItem('erp_trafico');

      let conteoLogistica = 0;
      let conteoTrafico = 0;

      if (logisticaData) {
        try {
          const data = JSON.parse(logisticaData);
          if (Array.isArray(data)) {
            conteoLogistica = data.length;
          } else if (typeof data === 'object') {
            conteoLogistica = Object.keys(data).length;
          }
        } catch (e) {
          conteoLogistica = 0;
        }
      }

      if (traficoData) {
        try {
          const data = JSON.parse(traficoData);
          conteoTrafico = Array.isArray(data) ? data.length : 0;
        } catch (e) {
          conteoTrafico = 0;
        }
      }

      return { logistica: conteoLogistica, trafico: conteoTrafico };
    };

    // Establecer conteos iniciales
    const conteosIniciales = contarRegistros();
    ultimoConteoLogistica = conteosIniciales.logistica;
    ultimoConteoTrafico = conteosIniciales.trafico;

    console.log(
      `📊 Conteos iniciales - Logística: ${ultimoConteoLogistica}, Tráfico: ${ultimoConteoTrafico}`
    );

    // Guardar conteos iniciales en variables globales para diagnóstico
    window._ultimoConteoLogistica = ultimoConteoLogistica;
    window._ultimoConteoTrafico = ultimoConteoTrafico;

    // Verificar cambios cada 2 segundos (más frecuente)
    const intervalDeteccion = setInterval(() => {
      const conteosActuales = contarRegistros();

      // Si hay nuevos registros en logística
      if (conteosActuales.logistica > ultimoConteoLogistica) {
        const nuevosRegistros = conteosActuales.logistica - ultimoConteoLogistica;
        console.log(`🎯 DETECCIÓN AUTOMÁTICA: ${nuevosRegistros} nuevos registros en logística`);

        // Ejecutar proceso completo automáticamente
        setTimeout(() => {
          console.log('🤔 Ejecutando actualización automática completa...');
          window.actualizarBuzonAhora();
        }, 500);

        ultimoConteoLogistica = conteosActuales.logistica;
        window._ultimoConteoLogistica = ultimoConteoLogistica;
      }

      // Si hay cambios en tráfico, actualizar contador
      if (conteosActuales.trafico !== ultimoConteoTrafico) {
        console.log(
          `🔄 Cambios detectados en tráfico: ${ultimoConteoTrafico} → ${conteosActuales.trafico}`
        );

        // Actualizar contador después de un momento
        setTimeout(() => {
          if (typeof window.actualizarContador === 'function') {
            const nuevoValor = window.actualizarContador();
            console.log(`📊 Contador actualizado automáticamente: ${nuevoValor}`);

            // Fijar el valor
            const contador = document.getElementById('contadorPendientesTrafico');
            if (contador && nuevoValor > 0) {
              contador.textContent = nuevoValor;
              contador.classList.remove('bg-danger', 'bg-success');
              contador.classList.add('bg-warning');
            }
          }
        }, 500);

        ultimoConteoTrafico = conteosActuales.trafico;
        window._ultimoConteoTrafico = ultimoConteoTrafico;
      }
    }, 2000);

    // Guardar referencia para poder detenerlo
    window._deteccionInterval = intervalDeteccion;
    window._intervalDeteccion = intervalDeteccion; // Mantener compatibilidad

    console.log('✅ Detección automática de nuevos registros activada');

    // Interceptar funciones de guardado para detección inmediata
    window.interceptarGuardadoLogistica();
  };

  // Función para interceptar el guardado de logística
  window.interceptarGuardadoLogistica = function () {
    console.log('🎯 Interceptando funciones de guardado de logística...');

    // Interceptar saveLogisticaData si existe
    if (typeof window.saveLogisticaData === 'function') {
      const originalSave = window.saveLogisticaData;
      window.saveLogisticaData = function (...args) {
        console.log('🎯 INTERCEPTADO: Guardado de logística detectado');

        // Ejecutar la función original
        const resultado = originalSave.apply(this, args);

        // Actualizar buzón después de guardar
        setTimeout(() => {
          console.log('🤔 Actualizando buzón automáticamente después de guardar...');
          window.actualizarBuzonAhora();
        }, 1000);

        return resultado;
      };
      console.log('✅ saveLogisticaData interceptado');
    }

    // Interceptar DataPersistence.saveLogisticaData si existe
    if (window.DataPersistence && typeof window.DataPersistence.saveLogisticaData === 'function') {
      const originalDataSave = window.DataPersistence.saveLogisticaData;
      window.DataPersistence.saveLogisticaData = function (...args) {
        console.log('🎯 INTERCEPTADO: DataPersistence.saveLogisticaData detectado');

        // Ejecutar la función original
        const resultado = originalDataSave.apply(this, args);

        // Actualizar buzón después de guardar
        setTimeout(() => {
          console.log('🤔 Actualizando buzón automáticamente después de DataPersistence...');
          window.actualizarBuzonAhora();
        }, 1000);

        return resultado;
      };
      console.log('✅ DataPersistence.saveLogisticaData interceptado');
    }

    // Interceptar localStorage.setItem para detectar cambios en erp_logistica
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, _value) {
      // Ejecutar la función original
      const resultado = originalSetItem.apply(this, arguments);

      // Si se guardó algo en erp_logistica
      if (key === 'erp_logistica') {
        console.log('🎯 INTERCEPTADO: localStorage erp_logistica modificado');
        setTimeout(() => {
          console.log('🤔 Actualizando buzón automáticamente después de localStorage...');
          window.actualizarBuzonAhora();
        }, 1000);
      }

      return resultado;
    };
    console.log('✅ localStorage.setItem interceptado');
  };

  // Función para diagnosticar la detección automática
  window.diagnosticarDeteccionAutomatica = function () {
    console.log('🔍 === DIAGNÓSTICO DE DETECCIÓN AUTOMÁTICA ===');

    // 1. Verificar si la detección está activa
    console.log('1. Detección automática activa:', Boolean(window._intervalDeteccion));

    // 2. Contar registros actuales
    const logisticaData = localStorage.getItem('erp_logistica');
    const traficoData = localStorage.getItem('erp_trafico');

    let conteoLogistica = 0;
    let conteoTrafico = 0;

    if (logisticaData) {
      try {
        const data = JSON.parse(logisticaData);
        if (Array.isArray(data)) {
          conteoLogistica = data.length;
        } else if (typeof data === 'object') {
          conteoLogistica = Object.keys(data).length;
        }
        console.log('2. Registros en logística:', conteoLogistica);
        console.log('   Claves:', Object.keys(data));
      } catch (e) {
        console.log('2. Error parseando logística:', e);
      }
    } else {
      console.log('2. No hay datos en erp_logistica');
    }

    if (traficoData) {
      try {
        const data = JSON.parse(traficoData);
        conteoTrafico = Array.isArray(data) ? data.length : 0;
        console.log('3. Registros en tráfico:', conteoTrafico);
      } catch (e) {
        console.log('3. Error parseando tráfico:', e);
      }
    } else {
      console.log('3. No hay datos en erp_trafico');
    }

    // 3. Verificar interceptaciones
    console.log('4. Interceptaciones:');
    console.log(
      '   - saveLogisticaData interceptado:',
      typeof window.saveLogisticaData === 'function' &&
        window.saveLogisticaData.toString().includes('INTERCEPTADO')
    );
    console.log(
      '   - DataPersistence interceptado:',
      window.DataPersistence &&
        typeof window.DataPersistence.saveLogisticaData === 'function' &&
        window.DataPersistence.saveLogisticaData.toString().includes('INTERCEPTADO')
    );
    console.log(
      '   - localStorage interceptado:',
      localStorage.setItem.toString().includes('erp_logistica')
    );

    // 4. Verificar funciones disponibles
    console.log('5. Funciones disponibles:');
    console.log('   - window.actualizarBuzonAhora:', typeof window.actualizarBuzonAhora);
    console.log(
      '   - window.sincronizarRegistrosTrafico:',
      typeof window.sincronizarRegistrosTrafico
    );
    console.log('   - window.corregirEstadosTrafico:', typeof window.corregirEstadosTrafico);

    // 5. Simular detección manual
    console.log('6. Simulando detección manual...');
    setTimeout(() => {
      console.log('🤔 Ejecutando actualización manual para prueba...');
      window.actualizarBuzonAhora();
    }, 1000);

    console.log('🔍 === FIN DEL DIAGNÓSTICO ===');
  };

  // Función para forzar sincronización y actualización inmediata
  window.actualizarBuzonAhora = function () {
    console.log('🔄 Forzando actualización inmediata del buzón...');

    // 1. Sincronizar registros
    if (typeof window.sincronizarRegistrosTrafico === 'function') {
      window.sincronizarRegistrosTrafico();
    }

    // 2. Corregir estados después de sincronizar
    setTimeout(() => {
      if (typeof window.corregirEstadosTrafico === 'function') {
        console.log('🔧 Corrigiendo estados después de sincronización...');
        window.corregirEstadosTrafico();
      }
    }, 1500);

    // 3. Actualizar contador después de corregir estados
    setTimeout(() => {
      if (typeof window.actualizarContador === 'function') {
        const valor = window.actualizarContador();
        console.log(`✅ Buzón actualizado: ${valor} pendientes`);

        // 4. Fijar el valor para evitar reseteos
        const contador = document.getElementById('contadorPendientesTrafico');
        if (contador && valor > 0) {
          contador.textContent = valor;
          contador.classList.remove('bg-danger', 'bg-success');
          contador.classList.add('bg-warning');
          console.log(`📌 Contador fijado en: ${valor}`);
        }
      }
    }, 2500);
  };

  // Función para mostrar notificación consolidada (evita spam)
  window.mostrarNotificacionConsolidada = function (mensaje, tipo = 'info') {
    // Evitar notificaciones durante inicialización
    if (window._inicializandoPagina) {
      console.log(`📊 Notificación suprimida durante inicialización: ${mensaje}`);
      return;
    }

    // Evitar notificaciones duplicadas
    const now = Date.now();
    const lastNotification = window._ultimaNotificacionConsolidada || 0;
    const timeSinceLastNotification = now - lastNotification;

    if (timeSinceLastNotification < 2000) {
      // Menos de 2 segundos
      console.log(`📊 Notificación suprimida (muy reciente): ${mensaje}`);
      return;
    }

    window._ultimaNotificacionConsolidada = now;

    if (typeof window.showNotification === 'function') {
      window.showNotification(mensaje, tipo);
    } else {
      console.log('❌ showNotification no disponible');
    }
  };

  // Función para buscar y mostrar todos los registros en localStorage
  window.buscarTodosLosRegistros = function () {
    console.log('🔍 === BUSCANDO TODOS LOS REGISTROS ===');

    const storages = [
      'erp_trafico',
      'erp_logistica',
      'erp_shared_data',
      'erp_facturas',
      'registrationNumbers',
      'activeRegistrationNumber'
    ];

    storages.forEach(storage => {
      const data = localStorage.getItem(storage);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`📊 ${storage}:`, parsed);
        } catch (e) {
          console.log(`📊 ${storage} (string):`, data);
        }
      } else {
        console.log(`❌ ${storage}: No existe`);
      }
    });

    console.log('🔍 === FIN DE BÚSQUEDA ===');
  };

  // Función para sincronizar registros desde shared_data hacia erp_trafico
  window.sincronizarRegistrosTrafico = function () {
    console.log('🔄 === SINCRONIZANDO REGISTROS A ERP_TRAFICO ===');

    let registrosSincronizados = 0;
    const registrosTrafico = [];

    // 1. Obtener registros de erp_shared_data
    const sharedData = localStorage.getItem('erp_shared_data');
    if (sharedData) {
      const data = JSON.parse(sharedData);
      console.log('📊 Datos en shared_data:', data);

      // Buscar en data.trafico
      if (data.trafico) {
        Object.keys(data.trafico).forEach(key => {
          const registro = data.trafico[key];
          if (registro) {
            const numeroRegistro = registro.numeroRegistro || key;

            // Verificar si ya existe en erp_trafico
            const existeEnTrafico = registrosTrafico.find(
              r => (r.numeroRegistro || r.id) === numeroRegistro
            );

            if (existeEnTrafico) {
              // Actualizar registro existente con datos de procesamiento de shared_data.trafico
              if (registro.operadorprincipal) {
                existeEnTrafico.operadorprincipal = registro.operadorprincipal;
                existeEnTrafico.operadorPrincipal = registro.operadorprincipal; // Compatibilidad
              }
              if (registro.Placas) {
                existeEnTrafico.Placas = registro.Placas;
              }
              if (registro.LugarOrigen) {
                existeEnTrafico.LugarOrigen = registro.LugarOrigen;
              }
              if (registro.LugarDestino) {
                existeEnTrafico.LugarDestino = registro.LugarDestino;
              }
              if (registro.operadorsecundario) {
                existeEnTrafico.operadorsecundario = registro.operadorsecundario;
              }
              if (registro.plataformaServicio) {
                existeEnTrafico.plataformaServicio = registro.plataformaServicio;
              }
              if (registro.placasPlataforma) {
                existeEnTrafico.placasPlataforma = registro.placasPlataforma;
              }
              if (registro.observaciones) {
                existeEnTrafico.observaciones = registro.observaciones;
              }
              if (registro.estado) {
                existeEnTrafico.estado = registro.estado;
              }
              if (registro.estadoPlataforma) {
                existeEnTrafico.estadoPlataforma = registro.estadoPlataforma;
              }

              existeEnTrafico.ultimaActualizacion = new Date().toISOString();
              console.log(`✅ Actualizado desde shared_data.trafico: ${numeroRegistro}`);
            } else {
              // Agregar nuevo registro
              registrosTrafico.push({
                numeroRegistro: numeroRegistro,
                id: numeroRegistro,
                registroId: numeroRegistro,
                estado: registro.estado || 'pendiente',
                estadoPlataforma: registro.estadoPlataforma || 'cargado',
                cliente: registro.cliente || 'N/A',
                origen: registro.origen || 'N/A',
                destino: registro.destino || 'N/A',
                economico: registro.economico || 'N/A',
                operador: registro.operador || 'N/A',
                fechaCreacion: registro.fechaCreacion || new Date().toISOString(),
                ...registro
              });
              console.log(`✅ Sincronizado desde shared_data.trafico: ${numeroRegistro}`);
            }
            registrosSincronizados++;
          }
        });
      }

      // Buscar en data.registros (registros de logística que pueden estar pendientes en tráfico)
      if (data.registros) {
        Object.keys(data.registros).forEach(key => {
          const registro = data.registros[key];
          if (registro && registro.numeroRegistro) {
            // Solo agregar si no existe ya en tráfico
            const yaExiste = registrosTrafico.find(
              r => r.numeroRegistro === registro.numeroRegistro
            );
            if (!yaExiste) {
              registrosTrafico.push({
                numeroRegistro: registro.numeroRegistro,
                id: registro.numeroRegistro,
                registroId: registro.numeroRegistro,
                estado: 'pendiente', // Los de logística están pendientes en tráfico
                estadoPlataforma: 'cargado',
                cliente: registro.cliente || 'N/A',
                origen: registro.origen || 'N/A',
                destino: registro.destino || 'N/A',
                economico: registro.economico || 'N/A',
                operador: registro.operador || 'N/A',
                fechaCreacion: registro.fechaCreacion || new Date().toISOString(),
                // Datos adicionales de logística
                tipoServicio: registro.tipoServicio,
                descripcionCarga: registro.descripcionCarga,
                peso: registro.peso
              });
              registrosSincronizados++;
              console.log(
                `✅ Sincronizado desde shared_data.registros: ${registro.numeroRegistro}`
              );
            }
          }
        });
      }
    }

    // 2. Obtener registros de erp_logistica
    const logisticaData = localStorage.getItem('erp_logistica');
    if (logisticaData) {
      const data = JSON.parse(logisticaData);
      console.log('📊 Datos en logística:', data);

      if (Array.isArray(data)) {
        data.forEach(registro => {
          if (registro.numeroRegistro) {
            const yaExiste = registrosTrafico.find(
              r => r.numeroRegistro === registro.numeroRegistro
            );
            if (!yaExiste) {
              registrosTrafico.push({
                numeroRegistro: registro.numeroRegistro,
                id: registro.numeroRegistro,
                registroId: registro.numeroRegistro,
                estado: 'pendiente',
                estadoPlataforma: 'cargado',
                cliente: registro.cliente || 'N/A',
                origen: registro.origen || 'N/A',
                destino: registro.destino || 'N/A',
                economico: registro.economico || 'N/A',
                operador: registro.operador || 'N/A',
                fechaCreacion: registro.fechaCreacion || new Date().toISOString(),
                ...registro
              });
              registrosSincronizados++;
              console.log(`✅ Sincronizado desde erp_logistica array: ${registro.numeroRegistro}`);
            }
          }
        });
      } else if (typeof data === 'object') {
        Object.keys(data).forEach(key => {
          const registro = data[key];
          if (registro) {
            const numeroRegistro = registro.numeroRegistro || key;
            const yaExiste = registrosTrafico.find(r => r.numeroRegistro === numeroRegistro);
            if (!yaExiste) {
              registrosTrafico.push({
                numeroRegistro: numeroRegistro,
                id: numeroRegistro,
                registroId: numeroRegistro,
                estado: 'pendiente',
                estadoPlataforma: 'cargado',
                cliente: registro.cliente || 'N/A',
                origen: registro.origen || 'N/A',
                destino: registro.destino || 'N/A',
                economico: registro.economico || 'N/A',
                operador: registro.operador || 'N/A',
                fechaCreacion: registro.fechaCreacion || new Date().toISOString(),
                ...registro
              });
              registrosSincronizados++;
              console.log(`✅ Sincronizado desde erp_logistica objeto: ${numeroRegistro}`);
            }
          }
        });
      }
    }

    // 3. Guardar en erp_trafico
    if (registrosTrafico.length > 0) {
      localStorage.setItem('erp_trafico', JSON.stringify(registrosTrafico));
      console.log(`💾 Guardados ${registrosTrafico.length} registros en erp_trafico`);
    }

    console.log(`🎉 Sincronización completada: ${registrosSincronizados} registros sincronizados`);

    // Actualizar contador
    setTimeout(() => {
      if (typeof window.actualizarContador === 'function') {
        window.actualizarContador();
        console.log('🔄 Contador actualizado después de sincronización');
      }
    }, 500);

    alert(
      `✅ Sincronización completada!\n\n${registrosSincronizados} registros sincronizados a erp_trafico.\n\nEl buzón de pendientes debería mostrar los registros correctos ahora.`
    );

    return registrosTrafico;
  };

  // Función para diagnosticar por qué un registro no se detecta como pendiente
  window.diagnosticarFiltradoPendientes = function () {
    console.log('🔍 === DIAGNOSTICANDO FILTRADO DE PENDIENTES ===');

    const traficoData = localStorage.getItem('erp_trafico');
    if (!traficoData) {
      console.log('❌ No hay datos en erp_trafico');
      return;
    }

    const registros = JSON.parse(traficoData);
    console.log(`📊 Total registros en erp_trafico: ${registros.length}`);

    registros.forEach((r, index) => {
      console.log(`\n📋 Registro ${index + 1}:`);
      console.log('  - numeroRegistro:', r.numeroRegistro);
      console.log('  - id:', r.id);
      console.log('  - estado:', r.estado);
      console.log('  - estadoPlataforma:', r.estadoPlataforma);

      const estado = r.estado || r.estadoPlataforma || '';
      const numeroRegistro = r.numeroRegistro || r.id || '';

      console.log('  - estado calculado:', estado);
      console.log('  - numeroRegistro calculado:', numeroRegistro);

      // Verificar si es pendiente por estado
      const esPendientePorEstado =
        estado === 'pendiente' || estado === 'registrado' || r.estadoPlataforma === 'pendiente';
      console.log('  - esPendientePorEstado:', esPendientePorEstado);

      // Verificar si tiene número de registro válido
      const tieneNumeroValido =
        numeroRegistro &&
        (numeroRegistro.match(/^25\d{5}$/) || numeroRegistro.match(/^2025-\d{2}-\d{4}$/));
      console.log('  - tieneNumeroValido:', tieneNumeroValido);
      console.log('  - regex 25XXXXX:', numeroRegistro.match(/^25\d{5}$/));
      console.log('  - regex 2025-XX-XXXX:', numeroRegistro.match(/^2025-\d{2}-\d{4}$/));

      // Verificar exclusiones
      const esCompletado = estado === 'completado' || estado === 'facturado';
      console.log('  - esCompletado:', esCompletado);

      // Resultado final
      const esPendiente = esPendientePorEstado && tieneNumeroValido && !esCompletado;
      console.log('  - 🎯 RESULTADO FINAL - Es pendiente:', esPendiente);
    });

    console.log('🔍 === FIN DEL DIAGNÓSTICO ===');
  };

  // Función para corregir estados de registros en tráfico
  window.corregirEstadosTrafico = function () {
    console.log('🔧 === CORRIGIENDO ESTADOS DE TRÁFICO ===');

    const traficoData = localStorage.getItem('erp_trafico');
    if (!traficoData) {
      console.log('❌ No hay datos en erp_trafico');
      return;
    }

    const registros = JSON.parse(traficoData);
    let registrosCorregidos = 0;

    registros.forEach((r, index) => {
      console.log(`\n📋 Procesando registro ${index + 1}: ${r.numeroRegistro}`);
      console.log('  - Estado actual:', r.estado);
      console.log('  - EstadoPlataforma actual:', r.estadoPlataforma);

      // Los registros que vienen de logística deberían estar pendientes en tráfico
      // hasta que se procesen completamente
      if (r.estado === 'cargado' || r.estado === 'registrado' || !r.estado) {
        r.estado = 'pendiente';
        registrosCorregidos++;
        console.log('  - ✅ Estado corregido a: pendiente');
      }

      // Mantener estadoPlataforma como cargado (es correcto)
      if (!r.estadoPlataforma) {
        r.estadoPlataforma = 'cargado';
        console.log('  - ✅ EstadoPlataforma establecido a: cargado');
      }

      // Asegurar que tenga todos los campos necesarios
      if (!r.cliente) {
        r.cliente = 'N/A';
      }
      if (!r.origen) {
        r.origen = 'N/A';
      }
      if (!r.destino) {
        r.destino = 'N/A';
      }
      if (!r.economico) {
        r.economico = 'N/A';
      }
      if (!r.operador) {
        r.operador = 'N/A';
      }
      if (!r.fechaCreacion) {
        r.fechaCreacion = new Date().toISOString();
      }

      console.log('  - Estado final:', r.estado);
      console.log('  - EstadoPlataforma final:', r.estadoPlataforma);
    });

    // Guardar los cambios
    if (registrosCorregidos > 0) {
      localStorage.setItem('erp_trafico', JSON.stringify(registros));
      console.log(
        `💾 Guardados ${registros.length} registros con ${registrosCorregidos} correcciones`
      );
    }

    console.log(`🎉 Corrección completada: ${registrosCorregidos} registros corregidos`);

    // Actualizar contador
    setTimeout(() => {
      if (typeof window.actualizarContador === 'function') {
        window.actualizarContador();
        console.log('🔄 Contador actualizado después de corrección');
      }
    }, 500);

    return registros;
  };

  // Función para migrar registros al nuevo formato 25XXXXX
  window.migrarRegistrosNuevoFormato = function () {
    console.log('🔄 === MIGRANDO REGISTROS AL NUEVO FORMATO ===');

    // Primero mostrar qué hay en localStorage
    window.buscarTodosLosRegistros();

    let registrosMigrados = 0;
    const currentYear = new Date().getFullYear().toString().slice(-2); // 25 para 2025

    // Mapeo dinámico - buscar todos los registros con formato 2025-XX-XXXX
    const mapeoRegistros = {};
    let contadorNuevo = 1;

    // Función para crear mapeo dinámico
    const crearMapeoRegistro = oldId => {
      if (!mapeoRegistros[oldId] && oldId.match(/^2025-\d{2}-\d{4}$/)) {
        mapeoRegistros[oldId] = `${currentYear}${String(contadorNuevo).padStart(5, '0')}`;
        contadorNuevo++;
      }
      return mapeoRegistros[oldId];
    };

    // Migrar erp_trafico
    const traficoData = localStorage.getItem('erp_trafico');
    if (traficoData) {
      const registros = JSON.parse(traficoData);
      console.log(`📊 Procesando ${registros.length} registros de tráfico`);

      registros.forEach(r => {
        const oldId = r.numeroRegistro || r.id;
        if (oldId) {
          const newId = crearMapeoRegistro(oldId);
          if (newId) {
            r.numeroRegistro = newId;
            r.id = newId;
            r.registroId = newId;
            registrosMigrados++;
            console.log(`✅ Migrado tráfico: ${oldId} → ${newId}`);
          }
        }
      });
      localStorage.setItem('erp_trafico', JSON.stringify(registros));
    }

    // Migrar erp_logistica
    const logisticaData = localStorage.getItem('erp_logistica');
    if (logisticaData) {
      const data = JSON.parse(logisticaData);
      console.log(
        '📊 Procesando logística:',
        typeof data,
        Array.isArray(data) ? `${data.length} elementos` : `${Object.keys(data).length} claves`
      );

      if (Array.isArray(data)) {
        data.forEach(r => {
          const oldId = r.numeroRegistro;
          if (oldId) {
            const newId = crearMapeoRegistro(oldId);
            if (newId) {
              r.numeroRegistro = newId;
              registrosMigrados++;
              console.log(`✅ Migrado logística array: ${oldId} → ${newId}`);
            }
          }
        });
        localStorage.setItem('erp_logistica', JSON.stringify(data));
      } else if (typeof data === 'object') {
        const newData = {};
        Object.keys(data).forEach(key => {
          const registro = data[key];
          const oldId = registro.numeroRegistro || key;
          const newId = crearMapeoRegistro(oldId);
          if (newId) {
            registro.numeroRegistro = newId;
            newData[newId] = registro;
            registrosMigrados++;
            console.log(`✅ Migrado logística objeto: ${oldId} → ${newId}`);
          } else {
            newData[key] = registro;
          }
        });
        localStorage.setItem('erp_logistica', JSON.stringify(newData));
      }
    }

    // Migrar erp_shared_data
    const sharedData = localStorage.getItem('erp_shared_data');
    if (sharedData) {
      const data = JSON.parse(sharedData);
      console.log('📊 Procesando shared_data:', data);

      if (data.registros) {
        const newRegistros = {};
        Object.keys(data.registros).forEach(key => {
          const registro = data.registros[key];
          const oldId = registro.numeroRegistro || key;
          const newId = crearMapeoRegistro(oldId);
          if (newId) {
            registro.numeroRegistro = newId;
            newRegistros[newId] = registro;
            registrosMigrados++;
            console.log(`✅ Migrado shared_data: ${oldId} → ${newId}`);
          } else {
            newRegistros[key] = registro;
          }
        });
        data.registros = newRegistros;
      }

      // También migrar trafico si existe
      if (data.trafico) {
        const newTrafico = {};
        Object.keys(data.trafico).forEach(key => {
          const registro = data.trafico[key];
          const oldId = registro.numeroRegistro || key;
          const newId = crearMapeoRegistro(oldId);
          if (newId) {
            registro.numeroRegistro = newId;
            newTrafico[newId] = registro;
            registrosMigrados++;
            console.log(`✅ Migrado shared_data.trafico: ${oldId} → ${newId}`);
          } else {
            newTrafico[key] = registro;
          }
        });
        data.trafico = newTrafico;
      }

      localStorage.setItem('erp_shared_data', JSON.stringify(data));
    }

    console.log(`🎉 Migración completada: ${registrosMigrados} registros migrados`);

    // Actualizar el número activo si existe
    const activeNumber = localStorage.getItem('activeRegistrationNumber');
    if (activeNumber) {
      const newActiveNumber = crearMapeoRegistro(activeNumber);
      if (newActiveNumber) {
        localStorage.setItem('activeRegistrationNumber', newActiveNumber);
        console.log(`✅ Número activo migrado: ${activeNumber} → ${newActiveNumber}`);

        // Actualizar el campo si existe
        const numeroInput = document.getElementById('numeroRegistro');
        if (numeroInput && numeroInput.value === activeNumber) {
          numeroInput.value = newActiveNumber;
        }
      }
    }

    // Mostrar resumen de la migración
    console.log('📊 Mapeo de registros creado:', mapeoRegistros);

    alert(
      `✅ Migración completada!\n\n${registrosMigrados} registros migrados al nuevo formato.\n\nAhora los registros usan el formato: ${currentYear}XXXXX`
    );

    // Actualizar el contador de pendientes después de la migración
    setTimeout(() => {
      if (typeof window.actualizarContador === 'function') {
        window.actualizarContador();
        console.log('🔄 Contador de pendientes actualizado después de la migración');
      }
    }, 500);
  };
})();
