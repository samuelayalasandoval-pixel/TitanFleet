/**
 * Inicialización del componente Searchable Select para Refacciones (Código/SKU) en Mantenimiento
 * Reemplaza el sistema anterior de dropdown con el nuevo componente
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
          (typeof obtenerStockRefacciones !== 'undefined' ||
            typeof window.obtenerStockRefacciones !== 'undefined')
        ) {
          resolve();
        } else if (attempts < 50) {
          setTimeout(checkDependencies, 100);
        } else {
          console.warn('⚠️ No se encontraron todas las dependencias después de 5 segundos');
          resolve(); // Continuar de todos modos
        }
      };
      checkDependencies();
    });
  }

  /**
   * Obtiene los datos de refacciones y los formatea para el componente
   */
  async function obtenerDatosRefacciones() {
    let refacciones = [];

    // PRIORIDAD 1: Función global obtenerStockRefacciones
    if (typeof window.obtenerStockRefacciones === 'function') {
      try {
        const stock = window.obtenerStockRefacciones();
        if (stock && typeof stock === 'object') {
          refacciones = Object.values(stock).filter(item => item.stock > 0);
          console.log(
            '✅ Refacciones obtenidas desde obtenerStockRefacciones:',
            refacciones.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo refacciones desde obtenerStockRefacciones:', error);
      }
    }

    // PRIORIDAD 2: Función global actualizarListaRefacciones (para cargar datos)
    if (refacciones.length === 0 && typeof window.actualizarListaRefacciones === 'function') {
      try {
        window.actualizarListaRefacciones();
        // Intentar desde la variable global todasLasRefacciones
        if (window.todasLasRefacciones && Array.isArray(window.todasLasRefacciones)) {
          refacciones = window.todasLasRefacciones;
          console.log('✅ Refacciones obtenidas desde todasLasRefacciones:', refacciones.length);
        }
      } catch (error) {
        console.warn('⚠️ Error en actualizarListaRefacciones:', error);
      }
    }

    // PRIORIDAD 3: Variable global todasLasRefacciones directamente
    if (
      refacciones.length === 0 &&
      window.todasLasRefacciones &&
      Array.isArray(window.todasLasRefacciones)
    ) {
      refacciones = window.todasLasRefacciones;
      console.log(
        '✅ Refacciones obtenidas desde todasLasRefacciones (directo):',
        refacciones.length
      );
    }

    // Formatear para el componente
    const refaccionesFormateadas = refacciones.map(ref => {
      const codigo = ref.codigo || ref.Código || '';
      const descripcion = ref.descripcion || ref.Descripcion || ref.desc || '';
      const stock = ref.stock || 0;

      // Formato del texto mostrado: "codigo - descripcion (stock)"
      let texto = codigo;
      if (descripcion) {
        texto += ` - ${descripcion}`;
      }
      if (stock > 0) {
        texto += ` (Stock: ${stock})`;
      }

      return {
        id: codigo,
        texto: texto,
        codigo: codigo,
        descripcion: descripcion,
        stock: stock,
        // Guardar el objeto completo para referencia
        refaccionCompleto: ref
      };
    });

    return refaccionesFormateadas;
  }

  /**
   * Maneja la selección de una refacción
   * Llama al sistema existente para mostrar el selector de almacén
   */
  function manejarSeleccionRefaccion(itemSeleccionado, numeroFila, _esEdicion = false) {
    // Convertir el item formateado de vuelta al formato que espera el sistema
    const refaccion = itemSeleccionado.refaccionCompleto || {
      codigo: itemSeleccionado.codigo,
      descripcion: itemSeleccionado.descripcion,
      stock: itemSeleccionado.stock
    };

    // Obtener stock por almacén
    let stockPorAlmacen = {};
    if (typeof window.obtenerStockRefaccionesPorAlmacen === 'function') {
      try {
        stockPorAlmacen = window.obtenerStockRefaccionesPorAlmacen();
      } catch (error) {
        console.warn('⚠️ Error obteniendo stock por almacén:', error);
      }
    }

    // Llamar a la función existente que muestra el modal de selección de almacén
    if (typeof window.seleccionarRefaccionConAlmacen === 'function') {
      window.seleccionarRefaccionConAlmacen(numeroFila, refaccion, stockPorAlmacen);
    } else if (typeof seleccionarRefaccionConAlmacen === 'function') {
      seleccionarRefaccionConAlmacen(numeroFila, refaccion, stockPorAlmacen);
    } else {
      console.error('❌ No se encontró la función seleccionarRefaccionConAlmacen');
    }
  }

  /**
   * Inicializa el componente searchable-select para una fila de refacciones
   */
  async function inicializarRefaccionFila(numeroFila, esEdicion = false) {
    const prefix = esEdicion ? 'editarMantenimiento_' : '';
    const inputId = `${prefix}refaccion_buscar_${numeroFila}`;
    const selectId = `select-refaccion-${esEdicion ? 'editar-' : ''}${numeroFila}`;
    const btnClearId = `btn-clear-refaccion-${esEdicion ? 'editar-' : ''}${numeroFila}`;

    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo refacción ${inputId} no encontrado`);
      return null;
    }

    const datos = await obtenerDatosRefacciones();
    if (datos.length === 0) {
      console.warn(`⚠️ No se encontraron datos de refacciones para inicializar fila ${numeroFila}`);
      return null;
    }

    console.log(
      `🔄 Inicializando componente searchable-select para refacción fila ${numeroFila} (edición: ${esEdicion})...`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;
      manejarSeleccionRefaccion(item, numeroFila, esEdicion);
    });

    return instancia;
  }

  // Bandera para evitar múltiples inicializaciones simultáneas
  let inicializandoRefacciones = false;
  let _intentosInicializacion = 0;
  const maxIntentosInicializacion = 5; // Máximo de 5 intentos

  /**
   * Inicializa todos los campos de refacciones encontrados
   * @param {number} intento - Número de intento actual (para evitar bucles infinitos)
   */
  async function inicializarTodosLosCamposRefacciones(intento = 0) {
    // Evitar múltiples inicializaciones simultáneas
    if (inicializandoRefacciones) {
      console.log('⏳ Ya hay una inicialización de refacciones en progreso, omitiendo...');
      return;
    }

    // Límite de intentos para evitar bucles infinitos
    if (intento >= maxIntentosInicializacion) {
      console.warn(
        `⚠️ Se alcanzó el límite de intentos (${maxIntentosInicializacion}) para inicializar refacciones. Deteniendo reintentos.`
      );
      inicializandoRefacciones = false;
      _intentosInicializacion = 0;
      return;
    }

    inicializandoRefacciones = true;
    _intentosInicializacion = intento;

    try {
      // Buscar todos los inputs de refacciones
      const inputsRefacciones = document.querySelectorAll('input[id*="refaccion_buscar"]');

      console.log(
        `🔍 Encontrados ${inputsRefacciones.length} campos de refacciones para inicializar (intento ${intento + 1}/${maxIntentosInicializacion})`
      );

      const datos = await obtenerDatosRefacciones();
      if (datos.length === 0) {
        console.warn(
          `⚠️ No hay datos de refacciones disponibles (intento ${intento + 1}/${maxIntentosInicializacion}).`
        );

        // Solo intentar cargar si aún no hemos excedido el límite
        if (
          intento < maxIntentosInicializacion - 1 &&
          typeof window.actualizarListaRefacciones === 'function'
        ) {
          console.log('🔄 Intentando cargar datos de refacciones...');
          window.actualizarListaRefacciones();
          // Esperar un poco y reintentar solo una vez más
          setTimeout(async () => {
            inicializandoRefacciones = false;
            await inicializarTodosLosCamposRefacciones(intento + 1);
          }, 1000); // Aumentar el delay para dar más tiempo a cargar
        } else {
          console.warn('⚠️ No se pudieron cargar datos de refacciones después de varios intentos.');
          inicializandoRefacciones = false;
        }
        return;
      }

      // Procesar cada input encontrado
      const filas = new Map(); // Map con clave: "numeroFila-edicion" para evitar duplicados
      inputsRefacciones.forEach(input => {
        const esEdicion = input.id.includes('editarMantenimiento_');
        const match = input.id.match(/refaccion_buscar_(\d+)/);
        if (match) {
          const numeroFila = parseInt(match[1], 10);
          const clave = `${numeroFila}-${esEdicion}`;
          if (!filas.has(clave)) {
            filas.set(clave, { numeroFila, esEdicion });
          }
        }
      });

      // Inicializar cada fila encontrada
      for (const { numeroFila, esEdicion } of filas.values()) {
        await inicializarRefaccionFila(numeroFila, esEdicion);
      }

      console.log(
        `✅ Componentes searchable-select inicializados para ${filas.size} filas de refacciones`
      );
      _intentosInicializacion = 0; // Resetear contador si la inicialización fue exitosa
    } catch (error) {
      console.error('❌ Error en inicializarTodosLosCamposRefacciones:', error);
    } finally {
      inicializandoRefacciones = false;
    }
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();

    // Esperar un poco más para que se carguen los datos de refacciones
    setTimeout(async () => {
      try {
        // Si hay función para actualizar lista, llamarla primero
        if (typeof window.actualizarListaRefacciones === 'function') {
          window.actualizarListaRefacciones();
          // Esperar un poco antes de inicializar
          setTimeout(async () => {
            await inicializarTodosLosCamposRefacciones();
          }, 300);
        } else {
          await inicializarTodosLosCamposRefacciones();
        }
      } catch (error) {
        console.error('❌ Error inicializando componentes de refacciones:', error);
      }
    }, 500);
  });

  // Inicializar campos del modal de edición cuando se abra
  let modalEditarInicializado = false;
  document.addEventListener('show.bs.modal', e => {
    if (e.target && e.target.id === 'editarMantenimientoModal' && !modalEditarInicializado) {
      setTimeout(async () => {
        try {
          await inicializarTodosLosCamposRefacciones();
          modalEditarInicializado = true;
        } catch (error) {
          console.error('❌ Error inicializando componentes de refacciones en modal:', error);
        }
      }, 300);
    }
  });

  // Exponer función para refrescar datos
  window.refreshSearchableSelectRefacciones = async function () {
    console.log('🔄 Refrescando datos de refacciones para searchable-select...');
    // Resetear contador de intentos al refrescar manualmente
    _intentosInicializacion = 0;
    // Recargar datos
    if (typeof window.actualizarListaRefacciones === 'function') {
      window.actualizarListaRefacciones();
    }
    // Reinicializar componentes con intento 0
    setTimeout(async () => {
      await inicializarTodosLosCamposRefacciones(0);
    }, 300);
  };

  console.log('✅ Script searchable-select-refacciones.js cargado');
})();
