/**
 * Inicialización del componente Searchable Select para Económicos en Tráfico
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
          (typeof window.cargarEconomicosEnCache === 'function' ||
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
   * Obtiene los datos de económicos y los formatea para el componente
   */
  async function obtenerDatosEconomicos() {
    let economicos = [];

    // PRIORIDAD 1: Función cargarEconomicosEnCache del autocomplete-manager (si está disponible)
    if (typeof window.cargarEconomicosEnCache === 'function') {
      try {
        await window.cargarEconomicosEnCache();
        // Después de cargar, intentar obtener desde el cache
        if (window.ERPState && typeof window.ERPState.getCache === 'function') {
          const cache = window.ERPState.getCache('economicos');
          if (Array.isArray(cache) && cache.length > 0) {
            economicos = cache;
            console.log(
              '✅ Económicos obtenidos desde cargarEconomicosEnCache (ERPState):',
              economicos.length
            );
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo económicos desde cargarEconomicosEnCache:', error);
      }
    }

    // PRIORIDAD 2: ERPState cache
    if (
      economicos.length === 0 &&
      window.ERPState &&
      typeof window.ERPState.getCache === 'function'
    ) {
      const cache = window.ERPState.getCache('economicos');
      if (Array.isArray(cache) && cache.length > 0) {
        economicos = cache;
        console.log('✅ Económicos obtenidos desde ERPState cache:', economicos.length);
      }
    }

    // PRIORIDAD 3: Cache global
    if (
      economicos.length === 0 &&
      window.__economicosCache &&
      Array.isArray(window.__economicosCache)
    ) {
      economicos = window.__economicosCache;
      console.log('✅ Económicos obtenidos desde __economicosCache:', economicos.length);
    }

    // PRIORIDAD 4: configuracionManager
    if (economicos.length === 0 && window.configuracionManager) {
      try {
        if (typeof window.configuracionManager.getAllEconomicos === 'function') {
          economicos = window.configuracionManager.getAllEconomicos() || [];
          console.log(
            '✅ Económicos obtenidos desde configuracionManager.getAllEconomicos:',
            economicos.length
          );
        } else if (typeof window.configuracionManager.getEconomicos === 'function') {
          const temp = window.configuracionManager.getEconomicos();
          economicos = Array.isArray(temp) ? temp : [];
          console.log(
            '✅ Económicos obtenidos desde configuracionManager.getEconomicos:',
            economicos.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo económicos desde configuracionManager:', error);
      }
    }

    // CRÍTICO: Filtrar por tenantId ANTES de cualquier otro filtro
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

    const totalAntesFiltro = economicos.length;
    economicos = economicos.filter(economico => {
      const economicoTenantId = economico.tenantId;
      // Todos los usuarios solo ven económicos con su tenantId exacto
      return economicoTenantId === tenantId;
    });

    if (totalAntesFiltro !== economicos.length) {
      console.log(
        `🔒 Económicos filtrados por tenantId (${tenantId}): ${economicos.length} de ${totalAntesFiltro} totales`
      );
    }

    // Filtrar solo tractocamiones activos (según la pestaña de económicos en configuración)
    const economicosFormateados = economicos
      .filter(e => {
        // Verificar que no esté eliminado
        if (e.deleted === true) {
          return false;
        }

        // Verificar estado del vehículo (no inactivo ni retirado)
        const estadoVehiculo = (e.estadoVehiculo || e.estado || '').toLowerCase();
        if (estadoVehiculo === 'inactivo' || estadoVehiculo === 'retirado') {
          return false;
        }

        // Verificar campo activo (si existe)
        if (e.activo === false) {
          return false;
        }

        // Verificar campo estado (si existe y es explícitamente inactivo/retirado)
        const estado = (e.estado || '').toString();
        if (estado && estado.toLowerCase() !== 'activo' && estado.toLowerCase() !== 'activo') {
          // Si tiene estado definido y no es activo, excluir
          // Pero solo si el estado es explícitamente inactivo/retirado
          if (estado.toLowerCase() === 'inactivo' || estado.toLowerCase() === 'retirado') {
            return false;
          }
        }

        // Verificar que tenga número o nombre
        if (!e || (!e.numero && !e.nombre)) {
          return false;
        }

        return true;
      })
      .map(economico => {
        const numero = economico.numero || economico.nombre || economico.id || 'N/A';
        const placa = economico.placaTracto || economico.placa || '';
        const marca = economico.marca || '';
        const modelo = economico.modelo || '';
        const permisoSCT = economico.permisoSCT || economico.permisoSct || '';

        // Formato del texto mostrado: "numero - marca modelo"
        let texto = numero.toString();
        if (marca || modelo) {
          texto += ` - ${marca} ${modelo}`.trim();
        }

        return {
          id: numero,
          texto: texto,
          numero: numero,
          placa: placa,
          marca: marca,
          modelo: modelo,
          permisoSCT: permisoSCT,
          // Guardar el objeto completo para referencia
          economicoCompleto: economico
        };
      });

    console.log(`✅ ${economicosFormateados.length} económicos formateados`);
    return economicosFormateados;
  }

  /**
   * Inicializa el campo de económico
   */
  async function inicializarEconomico(inputId, selectId, btnClearId, hiddenInputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo económico ${inputId} no encontrado`);
      return null;
    }

    const datos = await obtenerDatosEconomicos();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de económicos');
      return null;
    }

    console.log(
      `🔄 Inicializando componente searchable-select para ${inputId}... (${datos.length} económicos)`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', async e => {
      const { item } = e.detail;
      // Actualizar el hidden input con el número del económico
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) {
        hiddenInput.value = item.numero;
        console.log(`✅ Número del económico guardado en ${hiddenInputId}:`, item.numero);
      }

      // Llenar placas y permiso SCT automáticamente desde los datos del económico
      if (item.placa) {
        const placasField = document.getElementById('Placas');
        if (placasField) {
          placasField.value = item.placa;
          console.log('✅ Placas llenadas automáticamente:', item.placa);
        }
      }

      // Llenar permiso SCT (primero desde item.permisoSCT, luego desde economicoCompleto como respaldo)
      const permisoSCT =
        item.permisoSCT ||
        (item.economicoCompleto
          ? item.economicoCompleto.permisoSCT || item.economicoCompleto.permisoSct
          : '') ||
        '';
      if (permisoSCT) {
        const permisoSCTField = document.getElementById('permisosct');
        if (permisoSCTField) {
          permisoSCTField.value = permisoSCT;
          console.log('✅ Permiso SCT llenado automáticamente:', permisoSCT);
        }
      }

      // Llamar a la función de búsqueda de datos si existe (para llenar campos desde logística)
      if (typeof window.buscarDatosConValidacion === 'function') {
        window.buscarDatosConValidacion();
      }

      // También llamar a loadEconomicoData si está disponible (como respaldo)
      if (typeof window.loadEconomicoData === 'function') {
        try {
          await window.loadEconomicoData();
        } catch (error) {
          console.warn('⚠️ Error al llamar loadEconomicoData:', error);
        }
      } else if (
        window.traficoListasManager &&
        typeof window.traficoListasManager.loadEconomicoData === 'function'
      ) {
        try {
          await window.traficoListasManager.loadEconomicoData();
        } catch (error) {
          console.warn('⚠️ Error al llamar traficoListasManager.loadEconomicoData:', error);
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
        // Primero intentar cargar los datos si están disponibles
        if (typeof window.cargarEconomicosEnCache === 'function') {
          await window.cargarEconomicosEnCache();
        }

        // Verificar que haya datos disponibles
        const datosPrueba = await obtenerDatosEconomicos();
        if (datosPrueba.length === 0 && intentos < maxIntentos) {
          console.log(
            `⏳ Esperando datos de económicos... (intento ${intentos + 1}/${maxIntentos})`
          );
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
          return;
        }

        // Inicializar el campo del formulario principal
        const campo = {
          inputId: 'economico',
          selectId: 'select-economico',
          btnClearId: 'btn-clear-economico',
          hiddenInputId: 'economico_value'
        };

        const input = document.getElementById(campo.inputId);
        if (input) {
          await inicializarEconomico(
            campo.inputId,
            campo.selectId,
            campo.btnClearId,
            campo.hiddenInputId
          );
        }
      } catch (error) {
        console.error('❌ Error inicializando componente de económicos:', error);
        if (intentos < maxIntentos) {
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
        }
      }
    };

    setTimeout(() => inicializarConRetry(0), 500);
  });

  console.log('✅ Script searchable-select-economicos.js (tráfico) cargado');
})();
