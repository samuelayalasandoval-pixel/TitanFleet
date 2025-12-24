/**
 * Inicialización del componente Searchable Select para Económicos en Diesel
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
          (typeof window.cargarTractocamionesEnCacheDiesel === 'function' ||
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
   * Obtiene los datos de económicos y los formatea para el componente
   */
  async function obtenerDatosEconomicos() {
    let economicos = [];

    // PRIORIDAD 1: Función cargarTractocamionesEnCacheDiesel
    if (typeof window.cargarTractocamionesEnCacheDiesel === 'function') {
      try {
        economicos = await window.cargarTractocamionesEnCacheDiesel();
        if (Array.isArray(economicos) && economicos.length > 0) {
          console.log(
            '✅ Económicos obtenidos desde cargarTractocamionesEnCacheDiesel:',
            economicos.length
          );
        }
      } catch (error) {
        console.warn(
          '⚠️ Error obteniendo económicos desde cargarTractocamionesEnCacheDiesel:',
          error
        );
      }
    }

    // PRIORIDAD 2: configuracionManager
    if (economicos.length === 0 && window.configuracionManager) {
      try {
        if (typeof window.configuracionManager.getAllEconomicos === 'function') {
          economicos = window.configuracionManager.getAllEconomicos() || [];
          console.log(
            '✅ Económicos obtenidos desde configuracionManager.getAllEconomicos:',
            economicos.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo económicos desde configuracionManager:', error);
      }
    }

    // PRIORIDAD 3: ERPState cache
    if (economicos.length === 0 && window.ERPState) {
      try {
        economicos = window.ERPState.getCache('economicos') || [];
        if (economicos.length > 0) {
          console.log('✅ Económicos obtenidos desde ERPState cache:', economicos.length);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo económicos desde ERPState:', error);
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

    // Formatear para el componente
    const economicosFormateados = economicos.map(eco => {
      const numero = eco.numero || eco.nombre || eco.id || '';
      const placa = eco.placaTracto || eco.placa || '';
      const marca = eco.marca || '';
      const modelo = eco.modelo || '';

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
        economicoCompleto: eco
      };
    });

    return economicosFormateados;
  }

  /**
   * Llena los campos automáticos cuando se selecciona un económico
   */
  function llenarCamposAutomaticos(itemSeleccionado, esEdicion = false) {
    const economico = itemSeleccionado.economicoCompleto || itemSeleccionado;
    const placa = economico.placa || economico.placaTracto || '';

    // Campos del formulario principal
    if (!esEdicion) {
      const placasField = document.getElementById('Placas');
      if (placasField && placa) {
        placasField.value = placa;
        console.log('✅ Placas llenadas automáticamente:', placa);
      }
    } else {
      // Campos del modal de edición
      const placasField = document.getElementById('editarDiesel_placas');
      if (placasField && placa) {
        placasField.value = placa;
        console.log('✅ Placas llenadas automáticamente (edición):', placa);
      }
    }
  }

  /**
   * Inicializa el campo económico principal
   */
  async function inicializarEconomicoPrincipal() {
    const input = document.getElementById('economico');
    if (!input) {
      console.warn('⚠️ Campo económico principal no encontrado');
      return null;
    }

    const datos = await obtenerDatosEconomicos();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de económicos');
      return null;
    }

    console.log('🔄 Inicializando componente searchable-select para económico principal...');

    const instancia = crearListaBusqueda(
      'economico',
      'select-economico',
      null,
      null,
      datos,
      'texto',
      'btn-clear-economico'
    );

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;
      // Actualizar el hidden input
      const hiddenInput = document.getElementById('economico_value');
      if (hiddenInput) {
        hiddenInput.value = item.numero;
      }
      llenarCamposAutomaticos(item, false);
    });

    return instancia;
  }

  /**
   * Inicializa el campo económico en el modal de edición
   */
  async function inicializarEconomicoEditar() {
    const input = document.getElementById('editarDiesel_economico');
    if (!input) {
      console.warn('⚠️ Campo económico edición no encontrado');
      return null;
    }

    const datos = await obtenerDatosEconomicos();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de económicos');
      return null;
    }

    console.log('🔄 Inicializando componente searchable-select para económico edición...');

    const instancia = crearListaBusqueda(
      'editarDiesel_economico',
      'select-economico-editar',
      null,
      null,
      datos,
      'texto',
      'btn-clear-economico-editar'
    );

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;
      // Actualizar el hidden input
      const hiddenInput = document.getElementById('editarDiesel_economico_value');
      if (hiddenInput) {
        hiddenInput.value = item.numero;
      }
      llenarCamposAutomaticos(item, true);
    });

    return instancia;
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();

    setTimeout(async () => {
      try {
        await inicializarEconomicoPrincipal();
      } catch (error) {
        console.error('❌ Error inicializando componente económico principal:', error);
      }
    }, 500);
  });

  // Inicializar campo del modal de edición cuando se abra
  let modalEditarInicializado = false;
  document.addEventListener('show.bs.modal', e => {
    if (e.target && e.target.id === 'editarDieselModal' && !modalEditarInicializado) {
      setTimeout(async () => {
        try {
          await inicializarEconomicoEditar();
          modalEditarInicializado = true;
        } catch (error) {
          console.error('❌ Error inicializando componente económico en modal:', error);
        }
      }, 300);
    }
  });

  // Exponer función para refrescar datos
  window.refreshSearchableSelectEconomicosDiesel = async function () {
    console.log('🔄 Refrescando datos de económicos para searchable-select...');
    // Recargar datos si es necesario
    if (typeof window.cargarTractocamionesEnCacheDiesel === 'function') {
      await window.cargarTractocamionesEnCacheDiesel();
    }
  };

  console.log('✅ Script searchable-select-economicos.js (diesel) cargado');
})();
