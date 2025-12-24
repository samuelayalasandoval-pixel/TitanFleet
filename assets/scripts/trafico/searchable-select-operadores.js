/**
 * Inicialización del componente Searchable Select para Operadores en Tráfico
 * NOTA: En tráfico se filtra por tipo (principal/secundario) como en diesel
 */

(function () {
  'use strict';

  // Almacenar datos originales y referencias a los componentes
  let todosLosOperadores = [];
  const instanciasComponentes = {};

  // Esperar a que los scripts necesarios estén cargados
  function waitForDependencies() {
    return new Promise(resolve => {
      let attempts = 0;
      const checkDependencies = () => {
        attempts++;
        if (
          typeof crearListaBusqueda !== 'undefined' &&
          (typeof window.cargarOperadoresEnCache === 'function' ||
            typeof window.configuracionManager !== 'undefined' ||
            typeof window.ERPState !== 'undefined')
        ) {
          resolve();
        } else if (attempts < 50) {
          setTimeout(checkDependencies, 100);
        } else {
          console.warn('⚠️ No se encontraron todas las dependencias después de 5 segundos');
          resolve();
        }
      };
      checkDependencies();
    });
  }

  /**
   * Obtiene los datos de operadores y los formatea para el componente
   */
  async function obtenerDatosOperadores() {
    let operadores = [];

    // PRIORIDAD 1: Función cargarOperadoresEnCache del autocomplete-manager (si está disponible)
    if (typeof window.cargarOperadoresEnCache === 'function') {
      try {
        await window.cargarOperadoresEnCache();
        // Después de cargar, intentar obtener desde el cache
        if (window.ERPState && typeof window.ERPState.getCache === 'function') {
          const cache = window.ERPState.getCache('operadores');
          if (Array.isArray(cache) && cache.length > 0) {
            operadores = cache;
            console.log(
              '✅ Operadores obtenidos desde cargarOperadoresEnCache (ERPState):',
              operadores.length
            );
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operadores desde cargarOperadoresEnCache:', error);
      }
    }

    // PRIORIDAD 2: ERPState cache
    if (
      operadores.length === 0 &&
      window.ERPState &&
      typeof window.ERPState.getCache === 'function'
    ) {
      const cache = window.ERPState.getCache('operadores');
      if (Array.isArray(cache) && cache.length > 0) {
        operadores = cache;
        console.log('✅ Operadores obtenidos desde ERPState cache:', operadores.length);
      }
    }

    // PRIORIDAD 3: Cache global
    if (operadores.length === 0 && (window._operadoresCache || window.__operadoresCache)) {
      operadores = window._operadoresCache || window.__operadoresCache || [];
      if (Array.isArray(operadores) && operadores.length > 0) {
        console.log('✅ Operadores obtenidos desde cache global:', operadores.length);
      }
    }

    // PRIORIDAD 4: configuracionManager
    if (operadores.length === 0 && window.configuracionManager) {
      try {
        if (typeof window.configuracionManager.getAllOperadores === 'function') {
          operadores = window.configuracionManager.getAllOperadores() || [];
          console.log(
            '✅ Operadores obtenidos desde configuracionManager.getAllOperadores:',
            operadores.length
          );
        } else if (typeof window.configuracionManager.getOperadores === 'function') {
          const temp = window.configuracionManager.getOperadores();
          if (Array.isArray(temp)) {
            operadores = temp;
          } else if (temp && typeof temp === 'object') {
            operadores = Object.keys(temp).map(nombre => ({
              nombre: nombre,
              ...temp[nombre]
            }));
          }
          console.log(
            '✅ Operadores obtenidos desde configuracionManager.getOperadores:',
            operadores.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operadores desde configuracionManager:', error);
      }
    }

    // CRÍTICO: Filtrar por tenantId ANTES de formatear
    // Obtener tenantId actual
    let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
    if (window.licenseManager && window.licenseManager.isLicenseActive()) {
      const licenseTenantId = window.licenseManager.getTenantId();
      if (licenseTenantId) {
        tenantId = licenseTenantId;
      }
    } else {
      const savedTenantId = localStorage.getItem('tenantId');
      if (savedTenantId) {
        tenantId = savedTenantId;
      }
    }

    const totalAntesFiltro = operadores.length;
    operadores = operadores.filter(operador => {
      const operadorTenantId = operador.tenantId;
      // Todos los usuarios solo ven operadores con su tenantId exacto
      return operadorTenantId === tenantId;
    });

    if (totalAntesFiltro !== operadores.length) {
      console.log(
        `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${totalAntesFiltro} totales`
      );
    }

    // Formatear para el componente
    const operadoresFormateados = operadores.map(op => {
      const nombre = op.nombre || op.nombreOperador || op.nombreCompleto || op.id || '';
      const licencia = op.licencia || op.numeroLicencia || '';

      // Formato del texto mostrado: "nombre" (sin licencia)
      const texto = nombre;

      // ID del operador: id > numeroLicencia > licencia > nombre
      const operadorId = op.id || op.numeroLicencia || op.licencia || nombre;

      return {
        id: operadorId,
        texto: texto,
        nombre: nombre,
        licencia: licencia,
        operadorId: operadorId,
        tipo: op.tipo || op.tipoOperador || '',
        // Guardar el objeto completo para referencia
        operadorCompleto: op
      };
    });

    return operadoresFormateados;
  }

  /**
   * Obtiene los datos filtrados por tipo de operador
   * @param {string} tipoOperador - 'principal' o 'secundario'
   */
  function obtenerDatosFiltradosPorTipo(tipoOperador) {
    if (!tipoOperador || todosLosOperadores.length === 0) {
      return todosLosOperadores;
    }

    const operadoresFiltrados = todosLosOperadores.filter(op => {
      // Buscar el tipo en diferentes lugares posibles del objeto
      const tipo =
        op.tipo ||
        op.operadorCompleto?.tipo ||
        op.operadorCompleto?.tipoOperador ||
        (op.operadorCompleto && typeof op.operadorCompleto === 'object'
          ? op.operadorCompleto.tipo || op.operadorCompleto.tipoOperador
          : '') ||
        '';

      // Comparación case-insensitive
      return tipo.toLowerCase() === tipoOperador.toLowerCase();
    });

    console.log(
      `🔍 Filtrado por tipo "${tipoOperador}": ${operadoresFiltrados.length} de ${todosLosOperadores.length} operadores`
    );

    return operadoresFiltrados;
  }

  /**
   * Obtiene el tipo de operador según el inputId
   * @param {string} inputId - ID del input
   * @returns {string} - 'principal' o 'secundario'
   */
  function obtenerTipoOperadorPorInputId(inputId) {
    if (inputId.includes('principal')) {
      return 'principal';
    } else if (inputId.includes('secundario')) {
      return 'secundario';
    }
    return null;
  }

  /**
   * Inicializa un campo de operador (principal o secundario)
   */
  async function inicializarOperador(inputId, selectId, btnClearId, hiddenInputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo operador ${inputId} no encontrado`);
      return null;
    }

    // Obtener el tipo de operador según el inputId
    const tipoOperador = obtenerTipoOperadorPorInputId(inputId);

    // Obtener datos filtrados por tipo
    let datos;
    if (tipoOperador) {
      datos = obtenerDatosFiltradosPorTipo(tipoOperador);
      console.log(
        `🔄 Filtrando operadores por tipo "${tipoOperador}" para ${inputId}: ${datos.length} operadores encontrados`
      );
    } else {
      // Si no se puede determinar el tipo, usar todos los operadores
      datos = todosLosOperadores;
      console.warn(
        `⚠️ No se pudo determinar el tipo de operador para ${inputId}, mostrando todos los operadores`
      );
    }

    if (datos.length === 0) {
      console.warn(`⚠️ No se encontraron operadores de tipo "${tipoOperador}" para ${inputId}`);
    }

    console.log(
      `🔄 Inicializando componente searchable-select para ${inputId}... (${datos.length} operadores de tipo "${tipoOperador}")`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Guardar instancia para referencia
    instanciasComponentes[inputId] = instancia;

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', async e => {
      const { item } = e.detail;
      // Actualizar el hidden input con el ID del operador
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) {
        hiddenInput.value = item.operadorId;
        console.log(`✅ ID del operador guardado en ${hiddenInputId}:`, item.operadorId);
      }

      // Llenar campo de licencia automáticamente
      if (inputId === 'operadorprincipal') {
        // Operador principal: llenar campo Licencia
        if (item.licencia) {
          const licenciaInput = document.getElementById('Licencia');
          if (licenciaInput) {
            licenciaInput.value = item.licencia;
            console.log(
              '✅ Licencia del operador principal llenada automáticamente:',
              item.licencia
            );
          }
        }

        // También llamar a la función loadOperadorPrincipalData si está disponible (como respaldo)
        if (typeof window.loadOperadorPrincipalData === 'function') {
          try {
            await window.loadOperadorPrincipalData();
          } catch (error) {
            console.warn('⚠️ Error al llamar loadOperadorPrincipalData:', error);
          }
        } else if (
          window.traficoListasManager &&
          typeof window.traficoListasManager.loadOperadorPrincipalData === 'function'
        ) {
          try {
            await window.traficoListasManager.loadOperadorPrincipalData();
          } catch (error) {
            console.warn(
              '⚠️ Error al llamar traficoListasManager.loadOperadorPrincipalData:',
              error
            );
          }
        }
      } else if (inputId === 'operadorsecundario') {
        // Operador secundario: llenar campo LicenciaSecundaria
        if (item.licencia) {
          const licenciaSecundariaInput = document.getElementById('LicenciaSecundaria');
          if (licenciaSecundariaInput) {
            licenciaSecundariaInput.value = item.licencia;
            console.log(
              '✅ Licencia del operador secundario llenada automáticamente:',
              item.licencia
            );
          }
        }

        // También llamar a la función loadOperadorSecundarioData si está disponible (como respaldo)
        if (typeof window.loadOperadorSecundarioData === 'function') {
          try {
            await window.loadOperadorSecundarioData();
          } catch (error) {
            console.warn('⚠️ Error al llamar loadOperadorSecundarioData:', error);
          }
        } else if (
          window.traficoListasManager &&
          typeof window.traficoListasManager.loadOperadorSecundarioData === 'function'
        ) {
          try {
            await window.traficoListasManager.loadOperadorSecundarioData();
          } catch (error) {
            console.warn(
              '⚠️ Error al llamar traficoListasManager.loadOperadorSecundarioData:',
              error
            );
          }
        }
      }
    });

    return instancia;
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();

    // Intentar inicializar con retry si no hay datos
    const inicializarConRetry = async (intentos = 0) => {
      const maxIntentos = 5;

      try {
        // Primero, cargar todos los operadores y guardarlos
        todosLosOperadores = await obtenerDatosOperadores();
        if (todosLosOperadores.length === 0 && intentos < maxIntentos) {
          console.log(
            `⏳ Esperando datos de operadores... (intento ${intentos + 1}/${maxIntentos})`
          );
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
          return;
        }
        console.log(`✅ ${todosLosOperadores.length} operadores cargados para filtrado por tipo`);

        // Inicializar los campos del formulario principal
        const camposPrincipal = [
          {
            inputId: 'operadorprincipal',
            selectId: 'select-operadorprincipal',
            btnClearId: 'btn-clear-operadorprincipal',
            hiddenInputId: 'operadorprincipal_value'
          },
          {
            inputId: 'operadorsecundario',
            selectId: 'select-operadorsecundario',
            btnClearId: 'btn-clear-operadorsecundario',
            hiddenInputId: 'operadorsecundario_value'
          }
        ];

        for (const campo of camposPrincipal) {
          const input = document.getElementById(campo.inputId);
          if (input) {
            await inicializarOperador(
              campo.inputId,
              campo.selectId,
              campo.btnClearId,
              campo.hiddenInputId
            );
          }
        }
      } catch (error) {
        console.error('❌ Error inicializando componentes de operadores:', error);
        if (intentos < maxIntentos) {
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
        }
      }
    };

    setTimeout(() => inicializarConRetry(0), 500);
  });

  // Exponer función para refrescar datos si es necesario
  window.refreshSearchableSelectOperadoresTrafico = async function () {
    console.log('🔄 Refrescando datos de operadores para searchable-select...');
    todosLosOperadores = await obtenerDatosOperadores();
    // Actualizar datos en componentes existentes
    Object.keys(instanciasComponentes).forEach(inputId => {
      const tipoOperador = obtenerTipoOperadorPorInputId(inputId);
      const datosFiltrados = obtenerDatosFiltradosPorTipo(tipoOperador);
      if (instanciasComponentes[inputId] && instanciasComponentes[inputId].actualizarDatos) {
        instanciasComponentes[inputId].actualizarDatos(datosFiltrados);
      }
    });
  };

  console.log('✅ Script searchable-select-operadores.js (tráfico) cargado');
})();
