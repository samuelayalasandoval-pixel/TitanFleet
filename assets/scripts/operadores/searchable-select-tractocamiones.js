/**
 * Inicialización del componente Searchable Select para Tractocamiones en la página de Operadores
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
          (typeof window.cargarTractocamionesEnCache === 'function' ||
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
   * Obtiene los datos de tractocamiones y los formatea para el componente
   */
  async function obtenerDatosTractocamiones() {
    let tractocamiones = [];

    // PRIORIDAD 1: Función cargarTractocamionesEnCache (función específica de la página de operadores)
    if (typeof window.cargarTractocamionesEnCache === 'function') {
      try {
        await window.cargarTractocamionesEnCache();
        // Después de cargar, intentar obtener desde el cache
        if (window.ERPState && typeof window.ERPState.getCache === 'function') {
          const cache = window.ERPState.getCache('economicos');
          if (Array.isArray(cache) && cache.length > 0) {
            tractocamiones = cache;
            console.log(
              '✅ Tractocamiones obtenidos desde cargarTractocamionesEnCache (ERPState):',
              tractocamiones.length
            );
          }
        }
      } catch (error) {
        console.warn(
          '⚠️ Error obteniendo tractocamiones desde cargarTractocamionesEnCache:',
          error
        );
      }
    }

    // PRIORIDAD 2: Cache de ERPState
    if (
      tractocamiones.length === 0 &&
      window.ERPState &&
      typeof window.ERPState.getCache === 'function'
    ) {
      const cache = window.ERPState.getCache('economicos');
      if (Array.isArray(cache) && cache.length > 0) {
        tractocamiones = cache;
        console.log('✅ Tractocamiones obtenidos desde ERPState cache:', tractocamiones.length);
      }
    }

    // PRIORIDAD 3: Cache global
    if (
      tractocamiones.length === 0 &&
      window.__economicosCache &&
      Array.isArray(window.__economicosCache)
    ) {
      tractocamiones = window.__economicosCache;
      console.log('✅ Tractocamiones obtenidos desde __economicosCache:', tractocamiones.length);
    }

    // PRIORIDAD 4: configuracionManager
    if (tractocamiones.length === 0 && window.configuracionManager) {
      try {
        if (typeof window.configuracionManager.getAllEconomicos === 'function') {
          tractocamiones = window.configuracionManager.getAllEconomicos() || [];
          console.log(
            '✅ Tractocamiones obtenidos desde configuracionManager:',
            tractocamiones.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo tractocamiones desde configuracionManager:', error);
      }
    }

    // CRÍTICO: Filtrar por tenantId ANTES de filtrar por estado activo
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

    const totalAntesFiltro = tractocamiones.length;
    tractocamiones = tractocamiones.filter(tracto => {
      const tractoTenantId = tracto.tenantId;
      // Todos los usuarios solo ven tractocamiones con su tenantId exacto
      return tractoTenantId === tenantId;
    });

    if (totalAntesFiltro !== tractocamiones.length) {
      console.log(
        `🔒 Tractocamiones filtrados por tenantId (${tenantId}): ${tractocamiones.length} de ${totalAntesFiltro} totales`
      );
    }

    // Filtrar solo tractocamiones activos (según la pestaña de económicos en configuración)
    const tractocamionesFormateados = tractocamiones
      .filter(t => {
        // Verificar que no esté eliminado
        if (t.deleted === true) {
          return false;
        }

        // Verificar estado del vehículo (no inactivo ni retirado)
        const estadoVehiculo = (t.estadoVehiculo || t.estado || '').toLowerCase();
        if (estadoVehiculo === 'inactivo' || estadoVehiculo === 'retirado') {
          return false;
        }

        // Verificar campo activo (si existe)
        if (t.activo === false) {
          return false;
        }

        // Verificar campo estado (si existe y es explícitamente inactivo/retirado)
        const estado = (t.estado || '').toString();
        if (estado && estado.toLowerCase() !== 'activo' && estado.toLowerCase() !== 'activo') {
          // Si tiene estado definido y no es activo, excluir
          // Pero solo si el estado es explícitamente inactivo/retirado
          if (estado.toLowerCase() === 'inactivo' || estado.toLowerCase() === 'retirado') {
            return false;
          }
        }

        // Verificar que tenga número o nombre
        if (!t || (!t.numero && !t.nombre)) {
          return false;
        }

        return true;
      })
      .map(tracto => {
        const numero = tracto.numero || tracto.nombre || 'N/A';
        const placa = tracto.placaTracto || tracto.placa || '';
        const marca = tracto.marca || '';
        const modelo = tracto.modelo || '';

        // Formato del texto mostrado: "numero - marca modelo (placa)"
        let texto = numero;
        if (marca || modelo) {
          texto += ` - ${marca} ${modelo}`.trim();
        }
        if (placa) {
          texto += ` (${placa})`;
        }

        return {
          id: numero,
          texto: texto,
          numero: numero,
          placa: placa,
          marca: marca,
          modelo: modelo,
          // Guardar el objeto completo para referencia
          tractocamionCompleto: tracto
        };
      });

    return tractocamionesFormateados;
  }

  /**
   * Inicializa un campo de tractocamión
   */
  async function inicializarTractocamion(inputId, selectId, btnClearId, hiddenInputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo tractocamión ${inputId} no encontrado`);
      return null;
    }

    const datos = await obtenerDatosTractocamiones();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de tractocamiones');
      return null;
    }

    console.log(
      `🔄 Inicializando componente searchable-select para ${inputId}... (${datos.length} tractocamiones)`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;
      // Actualizar el hidden input con el número del tractocamión
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) {
        hiddenInput.value = item.numero;
        console.log(`✅ Número del tractocamión guardado en ${hiddenInputId}:`, item.numero);
      }
    });

    return instancia;
  }

  /**
   * Inicializa todos los campos de tractocamiones
   */
  async function _inicializarTodosLosCamposTractocamiones() {
    const campos = [
      {
        inputId: 'tractocamion',
        selectId: 'select-tractocamion',
        btnClearId: 'btn-clear-tractocamion',
        hiddenInputId: 'tractocamion_value'
      },
      {
        inputId: 'tractocamionIncidencia',
        selectId: 'select-tractocamionIncidencia',
        btnClearId: 'btn-clear-tractocamionIncidencia',
        hiddenInputId: 'tractocamionIncidencia_value'
      },
      {
        inputId: 'editarGasto_tractocamion',
        selectId: 'select-editarGasto_tractocamion',
        btnClearId: 'btn-clear-editarGasto_tractocamion',
        hiddenInputId: 'editarGasto_tractocamion_value'
      },
      {
        inputId: 'editarIncidencia_tractocamion',
        selectId: 'select-editarIncidencia_tractocamion',
        btnClearId: 'btn-clear-editarIncidencia_tractocamion',
        hiddenInputId: 'editarIncidencia_tractocamion_value'
      }
    ];

    for (const campo of campos) {
      const input = document.getElementById(campo.inputId);
      if (input) {
        await inicializarTractocamion(
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
        if (typeof window.cargarTractocamionesEnCache === 'function') {
          await window.cargarTractocamionesEnCache();
        }

        // Verificar que haya datos disponibles
        const datosPrueba = await obtenerDatosTractocamiones();
        if (datosPrueba.length === 0 && intentos < maxIntentos) {
          console.log(
            `⏳ Esperando datos de tractocamiones... (intento ${intentos + 1}/${maxIntentos})`
          );
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
          return;
        }

        // Inicializar solo los campos del formulario principal
        const camposPrincipal = [
          {
            inputId: 'tractocamion',
            selectId: 'select-tractocamion',
            btnClearId: 'btn-clear-tractocamion',
            hiddenInputId: 'tractocamion_value'
          },
          {
            inputId: 'tractocamionIncidencia',
            selectId: 'select-tractocamionIncidencia',
            btnClearId: 'btn-clear-tractocamionIncidencia',
            hiddenInputId: 'tractocamionIncidencia_value'
          }
        ];

        for (const campo of camposPrincipal) {
          const input = document.getElementById(campo.inputId);
          if (input) {
            await inicializarTractocamion(
              campo.inputId,
              campo.selectId,
              campo.btnClearId,
              campo.hiddenInputId
            );
          }
        }
      } catch (error) {
        console.error('❌ Error inicializando componentes de tractocamiones:', error);
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
          if (typeof window.cargarTractocamionesEnCache === 'function') {
            await window.cargarTractocamionesEnCache();
          }

          const campo = {
            inputId: 'editarGasto_tractocamion',
            selectId: 'select-editarGasto_tractocamion',
            btnClearId: 'btn-clear-editarGasto_tractocamion',
            hiddenInputId: 'editarGasto_tractocamion_value'
          };
          const input = document.getElementById(campo.inputId);
          if (input) {
            await inicializarTractocamion(
              campo.inputId,
              campo.selectId,
              campo.btnClearId,
              campo.hiddenInputId
            );
          }
          modalEditarGastoInicializado = true;
        } catch (error) {
          console.error(
            '❌ Error inicializando componente de tractocamión en modal de gasto:',
            error
          );
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
          if (typeof window.cargarTractocamionesEnCache === 'function') {
            await window.cargarTractocamionesEnCache();
          }

          const campo = {
            inputId: 'editarIncidencia_tractocamion',
            selectId: 'select-editarIncidencia_tractocamion',
            btnClearId: 'btn-clear-editarIncidencia_tractocamion',
            hiddenInputId: 'editarIncidencia_tractocamion_value'
          };
          const input = document.getElementById(campo.inputId);
          if (input) {
            await inicializarTractocamion(
              campo.inputId,
              campo.selectId,
              campo.btnClearId,
              campo.hiddenInputId
            );
          }
          modalEditarIncidenciaInicializado = true;
        } catch (error) {
          console.error(
            '❌ Error inicializando componente de tractocamión en modal de incidencia:',
            error
          );
        }
      }, 300);
    }
  });

  console.log('✅ Script searchable-select-tractocamiones.js (operadores) cargado');
})();
