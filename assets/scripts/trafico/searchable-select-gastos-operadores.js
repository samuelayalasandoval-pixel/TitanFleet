/**
 * Inicialización del componente Searchable Select para Operadores en Gastos de Tráfico
 * Maneja tanto el campo inicial como los campos dinámicos agregados
 */

(function () {
  'use strict';

  // Almacenar instancias de componentes para campos dinámicos
  const instanciasGastos = {};

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
   * Muestra TODOS los operadores (sin filtrar por tipo)
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
        // Guardar el objeto completo para referencia
        operadorCompleto: op
      };
    });

    console.log(
      `✅ ${operadoresFormateados.length} operadores formateados (TODOS - sin filtrar por tipo)`
    );
    return operadoresFormateados;
  }

  /**
   * Inicializa un campo de operador para gastos
   * @param {number} numeroFila - Número de fila del gasto
   */
  async function inicializarOperadorGasto(numeroFila) {
    const inputId = `gasto_operador_${numeroFila}`;
    const selectId = `select-gasto_operador_${numeroFila}`;
    const btnClearId = `btn-clear-gasto_operador_${numeroFila}`;
    const hiddenInputId = `gasto_operador_${numeroFila}_value`;

    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo operador ${inputId} no encontrado`);
      return null;
    }

    // Si ya está inicializado, no hacerlo de nuevo
    if (instanciasGastos[inputId]) {
      console.log(`ℹ️ Campo ${inputId} ya está inicializado`);
      return instanciasGastos[inputId];
    }

    const datos = await obtenerDatosOperadores();
    if (datos.length === 0) {
      console.warn(`⚠️ No se encontraron datos de operadores para ${inputId}`);
      return null;
    }

    console.log(
      `🔄 Inicializando componente searchable-select para ${inputId}... (${datos.length} operadores)`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Guardar instancia
    instanciasGastos[inputId] = instancia;

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
            `⏳ Esperando datos de operadores para gastos... (intento ${intentos + 1}/${maxIntentos})`
          );
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
          return;
        }

        // Inicializar el campo inicial (fila 1)
        await inicializarOperadorGasto(1);
      } catch (error) {
        console.error('❌ Error inicializando componente de operadores para gastos:', error);
        if (intentos < maxIntentos) {
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
        }
      }
    };

    setTimeout(() => inicializarConRetry(0), 500);
  });

  // Exponer función para inicializar campos dinámicos
  window.inicializarOperadorGastoTrafico = async function (numeroFila) {
    // Esperar un poco para asegurar que el elemento esté en el DOM
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verificar que el elemento existe
    const inputId = `gasto_operador_${numeroFila}`;
    const input = document.getElementById(inputId);

    if (!input) {
      console.warn(`⚠️ Elemento ${inputId} no encontrado, esperando...`);
      // Reintentar después de más tiempo
      await new Promise(resolve => setTimeout(resolve, 200));
      const inputRetry = document.getElementById(inputId);
      if (!inputRetry) {
        console.error(`❌ Elemento ${inputId} no encontrado después de reintentar`);
        return null;
      }
    }

    await waitForDependencies();
    return inicializarOperadorGasto(numeroFila);
  };

  // Exponer función para limpiar instancia cuando se elimina una fila
  window.limpiarOperadorGastoTrafico = function (numeroFila) {
    const inputId = `gasto_operador_${numeroFila}`;
    if (instanciasGastos[inputId]) {
      delete instanciasGastos[inputId];
      console.log(`🗑️ Instancia de ${inputId} eliminada`);
    }
  };

  console.log('✅ Script searchable-select-gastos-operadores.js (tráfico) cargado');
})();
