/**
 * Inicialización del componente Searchable Select para Operadores en la página de Operadores
 * NOTA: En esta página NO se filtra por tipo, se muestran TODOS los operadores
 */

(function () {
  'use strict';

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
   * NO filtra por tipo - muestra TODOS los operadores
   */
  async function obtenerDatosOperadores() {
    let operadores = [];

    // PRIORIDAD 1: Función cargarOperadoresEnCache (función específica de la página de operadores)
    if (typeof window.cargarOperadoresEnCache === 'function') {
      try {
        operadores = await window.cargarOperadoresEnCache();
        if (Array.isArray(operadores) && operadores.length > 0) {
          console.log('✅ Operadores obtenidos desde cargarOperadoresEnCache:', operadores.length);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operadores desde cargarOperadoresEnCache:', error);
      }
    }

    // PRIORIDAD 2: ERPState.getCache('operadores')
    if (
      operadores.length === 0 &&
      window.ERPState &&
      typeof window.ERPState.getCache === 'function'
    ) {
      try {
        const cache = window.ERPState.getCache('operadores');
        if (Array.isArray(cache) && cache.length > 0) {
          operadores = cache;
          console.log('✅ Operadores obtenidos desde ERPState.getCache:', operadores.length);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operadores desde ERPState.getCache:', error);
      }
    }

    // PRIORIDAD 3: configuracionManager
    if (operadores.length === 0 && window.configuracionManager) {
      try {
        const temp = window.configuracionManager.getOperadores();
        if (Array.isArray(temp) && temp.length > 0) {
          operadores = temp;
          console.log(
            '✅ Operadores obtenidos desde configuracionManager.getOperadores:',
            operadores.length
          );
        } else if (temp && typeof temp === 'object') {
          operadores = Object.keys(temp).map(nombre => ({
            ...temp[nombre],
            nombre:
              temp[nombre].nombre ||
              temp[nombre].nombreOperador ||
              temp[nombre].nombreCompleto ||
              nombre
          }));
          console.log(
            '✅ Operadores obtenidos desde configuracionManager.getOperadores (objeto):',
            operadores.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operadores desde configuracionManager:', error);
      }
    }

    // PRIORIDAD 4: Variable global _operadoresCache
    if (
      operadores.length === 0 &&
      window._operadoresCache &&
      Array.isArray(window._operadoresCache)
    ) {
      operadores = window._operadoresCache;
      console.log('✅ Operadores obtenidos desde _operadoresCache:', operadores.length);
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

      // Formato del texto mostrado: "nombre - licencia"
      let texto = nombre;
      if (licencia) {
        texto += ` - ${licencia}`;
      }

      // ID del operador: id > numeroLicencia > licencia > nombre
      const operadorId = op.id || op.numeroLicencia || op.licencia || nombre;

      return {
        id: operadorId,
        texto: texto,
        nombre: nombre,
        licencia: licencia,
        operadorId: operadorId,
        // Guardar el objeto completo para referencia
        operadorCompleto: op
      };
    });

    console.log(`✅ ${operadoresFormateados.length} operadores formateados (SIN filtrar por tipo)`);
    return operadoresFormateados;
  }

  /**
   * Inicializa un campo de operador
   * NOTA: No filtra por tipo, muestra TODOS los operadores
   */
  async function inicializarOperador(inputId, selectId, btnClearId, hiddenInputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo operador ${inputId} no encontrado`);
      return null;
    }

    // Obtener TODOS los operadores sin filtrar por tipo
    const datos = await obtenerDatosOperadores();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de operadores');
      return null;
    }

    console.log(
      `🔄 Inicializando componente searchable-select para ${inputId}... (${datos.length} operadores - SIN filtrar por tipo)`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;
      // Actualizar el hidden input con el ID del operador
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) {
        hiddenInput.value = item.operadorId;
        console.log(`✅ ID del operador guardado en ${hiddenInputId}:`, item.operadorId);
      }
    });

    return instancia;
  }

  /**
   * Inicializa todos los campos de operadores
   */
  async function _inicializarTodosLosCamposOperadores() {
    const campos = [
      {
        inputId: 'operador',
        selectId: 'select-operador',
        btnClearId: 'btn-clear-operador',
        hiddenInputId: 'operador_value'
      },
      {
        inputId: 'operadorIncidencia',
        selectId: 'select-operadorIncidencia',
        btnClearId: 'btn-clear-operadorIncidencia',
        hiddenInputId: 'operadorIncidencia_value'
      },
      {
        inputId: 'editarGasto_operador',
        selectId: 'select-editarGasto_operador',
        btnClearId: 'btn-clear-editarGasto_operador',
        hiddenInputId: 'editarGasto_operador_value'
      },
      {
        inputId: 'editarIncidencia_operador',
        selectId: 'select-editarIncidencia_operador',
        btnClearId: 'btn-clear-editarIncidencia_operador',
        hiddenInputId: 'editarIncidencia_operador_value'
      }
    ];

    for (const campo of campos) {
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
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();

    // Intentar inicializar con retry si no hay datos
    const inicializarConRetry = async (intentos = 0) => {
      const maxIntentos = 5;

      try {
        // Primero intentar cargar los datos si están disponibles
        if (typeof window.cargarOperadoresEnCache === 'function') {
          await window.cargarOperadoresEnCache();
        }

        // Verificar que haya datos disponibles
        const datosPrueba = await obtenerDatosOperadores();
        if (datosPrueba.length === 0 && intentos < maxIntentos) {
          console.log(
            `⏳ Esperando datos de operadores... (intento ${intentos + 1}/${maxIntentos})`
          );
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
          return;
        }

        // Inicializar solo los campos del formulario principal
        const camposPrincipal = [
          {
            inputId: 'operador',
            selectId: 'select-operador',
            btnClearId: 'btn-clear-operador',
            hiddenInputId: 'operador_value'
          },
          {
            inputId: 'operadorIncidencia',
            selectId: 'select-operadorIncidencia',
            btnClearId: 'btn-clear-operadorIncidencia',
            hiddenInputId: 'operadorIncidencia_value'
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

  // Inicializar campos del modal de editar gasto cuando se abra
  let modalEditarGastoInicializado = false;
  document.addEventListener('show.bs.modal', e => {
    if (e.target && e.target.id === 'editarGastoModal' && !modalEditarGastoInicializado) {
      setTimeout(async () => {
        try {
          // Asegurar que los datos estén cargados
          if (typeof window.cargarOperadoresEnCache === 'function') {
            await window.cargarOperadoresEnCache();
          }

          const campo = {
            inputId: 'editarGasto_operador',
            selectId: 'select-editarGasto_operador',
            btnClearId: 'btn-clear-editarGasto_operador',
            hiddenInputId: 'editarGasto_operador_value'
          };
          const input = document.getElementById(campo.inputId);
          if (input) {
            await inicializarOperador(
              campo.inputId,
              campo.selectId,
              campo.btnClearId,
              campo.hiddenInputId
            );
          }
          modalEditarGastoInicializado = true;
        } catch (error) {
          console.error('❌ Error inicializando componente de operador en modal de gasto:', error);
        }
      }, 300);
    }
  });

  // Inicializar campos del modal de editar incidencia cuando se abra
  let modalEditarIncidenciaInicializado = false;
  document.addEventListener('show.bs.modal', e => {
    if (e.target && e.target.id === 'editarIncidenciaModal' && !modalEditarIncidenciaInicializado) {
      setTimeout(async () => {
        try {
          // Asegurar que los datos estén cargados
          if (typeof window.cargarOperadoresEnCache === 'function') {
            await window.cargarOperadoresEnCache();
          }

          const campo = {
            inputId: 'editarIncidencia_operador',
            selectId: 'select-editarIncidencia_operador',
            btnClearId: 'btn-clear-editarIncidencia_operador',
            hiddenInputId: 'editarIncidencia_operador_value'
          };
          const input = document.getElementById(campo.inputId);
          if (input) {
            await inicializarOperador(
              campo.inputId,
              campo.selectId,
              campo.btnClearId,
              campo.hiddenInputId
            );
          }
          modalEditarIncidenciaInicializado = true;
        } catch (error) {
          console.error(
            '❌ Error inicializando componente de operador en modal de incidencia:',
            error
          );
        }
      }, 300);
    }
  });

  console.log('✅ Script searchable-select-operadores.js (página operadores) cargado');
})();
