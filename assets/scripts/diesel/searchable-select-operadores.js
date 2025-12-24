/**
 * Inicialización del componente Searchable Select para Operadores en Diesel
 */

(function () {
  'use strict';

  // Almacenar datos originales y referencias a los componentes
  let todosLosOperadores = [];
  const _instanciasComponentes = {};

  // Esperar a que los scripts necesarios estén cargados
  function waitForDependencies() {
    return new Promise(resolve => {
      let attempts = 0;
      const checkDependencies = () => {
        attempts++;
        if (
          typeof crearListaBusqueda !== 'undefined' &&
          (typeof window.cargarOperadoresEnCacheDiesel === 'function' ||
            typeof window.configuracionManager !== 'undefined')
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

    // PRIORIDAD 1: Función cargarOperadoresEnCacheDiesel
    if (typeof window.cargarOperadoresEnCacheDiesel === 'function') {
      try {
        operadores = await window.cargarOperadoresEnCacheDiesel();
        if (Array.isArray(operadores) && operadores.length > 0) {
          console.log(
            '✅ Operadores obtenidos desde cargarOperadoresEnCacheDiesel:',
            operadores.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo operadores desde cargarOperadoresEnCacheDiesel:', error);
      }
    }

    // PRIORIDAD 2: configuracionManager
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

    // PRIORIDAD 3: Variable global _operadoresCache
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
  async function _inicializarTodosLosOperadores() {
    const campos = [
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
      },
      {
        inputId: 'editarDiesel_operadorprincipal',
        selectId: 'select-operadorprincipal-editar',
        btnClearId: 'btn-clear-operadorprincipal-editar',
        hiddenInputId: 'editarDiesel_operadorprincipal_value'
      },
      {
        inputId: 'editarDiesel_operadorsecundario',
        selectId: 'select-operadorsecundario-editar',
        btnClearId: 'btn-clear-operadorsecundario-editar',
        hiddenInputId: 'editarDiesel_operadorsecundario_value'
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

    setTimeout(async () => {
      try {
        // Primero, cargar todos los operadores y guardarlos
        todosLosOperadores = await obtenerDatosOperadores();
        if (todosLosOperadores.length === 0) {
          console.warn('⚠️ No se encontraron datos de operadores');
          return;
        }
        console.log(`✅ ${todosLosOperadores.length} operadores cargados para filtrado por tipo`);

        // Inicializar solo los campos del formulario principal
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
      }
    }, 500);
  });

  // Inicializar campos del modal de edición cuando se abra
  let modalEditarInicializado = false;
  document.addEventListener('show.bs.modal', e => {
    if (e.target && e.target.id === 'editarDieselModal' && !modalEditarInicializado) {
      setTimeout(async () => {
        try {
          // Asegurar que tenemos los datos cargados
          if (todosLosOperadores.length === 0) {
            todosLosOperadores = await obtenerDatosOperadores();
          }

          const camposEdicion = [
            {
              inputId: 'editarDiesel_operadorprincipal',
              selectId: 'select-operadorprincipal-editar',
              btnClearId: 'btn-clear-operadorprincipal-editar',
              hiddenInputId: 'editarDiesel_operadorprincipal_value'
            },
            {
              inputId: 'editarDiesel_operadorsecundario',
              selectId: 'select-operadorsecundario-editar',
              btnClearId: 'btn-clear-operadorsecundario-editar',
              hiddenInputId: 'editarDiesel_operadorsecundario_value'
            }
          ];

          for (const campo of camposEdicion) {
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
          modalEditarInicializado = true;
        } catch (error) {
          console.error('❌ Error inicializando componentes de operadores en modal:', error);
        }
      }, 300);
    }
  });

  // Exponer función para refrescar datos
  window.refreshSearchableSelectOperadoresDiesel = async function () {
    console.log('🔄 Refrescando datos de operadores para searchable-select...');
    // Recargar datos si es necesario
    if (typeof window.cargarOperadoresEnCacheDiesel === 'function') {
      await window.cargarOperadoresEnCacheDiesel();
    }
  };

  console.log('✅ Script searchable-select-operadores.js (diesel) cargado');
})();
