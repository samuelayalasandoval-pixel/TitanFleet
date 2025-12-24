/**
 * Inicialización del componente Searchable Select para Económicos en Mantenimiento
 * Reemplaza el sistema anterior de searchable-select con el nuevo componente
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
          (window.configuracionManager || window.loadEconomicosMantenimiento)
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
   * Obtiene los datos de económicos y los formatea para el componente
   */
  async function obtenerDatosEconomicos() {
    let economicos = [];

    // PRIORIDAD 1: Cache de ERPState (más actual)
    if (window.ERPState && typeof window.ERPState.getCache === 'function') {
      const cache = window.ERPState.getCache('economicos');
      if (Array.isArray(cache) && cache.length > 0) {
        economicos = cache;
        console.log('✅ Económicos obtenidos desde ERPState cache:', economicos.length);
      }
    }

    // PRIORIDAD 2: Cache global
    if (
      economicos.length === 0 &&
      window.__economicosCache &&
      Array.isArray(window.__economicosCache)
    ) {
      economicos = window.__economicosCache;
      console.log('✅ Económicos obtenidos desde __economicosCache:', economicos.length);
    }

    // PRIORIDAD 3: configuracionManager
    if (economicos.length === 0 && window.configuracionManager) {
      try {
        if (typeof window.configuracionManager.getAllEconomicos === 'function') {
          economicos = window.configuracionManager.getAllEconomicos() || [];
          console.log('✅ Económicos obtenidos desde configuracionManager:', economicos.length);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo económicos desde configuracionManager:', error);
      }
    }

    // PRIORIDAD 4: Función de carga de mantenimiento
    if (economicos.length === 0 && typeof window.loadEconomicosMantenimiento === 'function') {
      try {
        await window.loadEconomicosMantenimiento();
        // Intentar nuevamente desde el cache
        if (window.__economicosCache && Array.isArray(window.__economicosCache)) {
          economicos = window.__economicosCache;
          console.log(
            '✅ Económicos obtenidos después de loadEconomicosMantenimiento:',
            economicos.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error en loadEconomicosMantenimiento:', error);
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

    // Filtrar solo activos y formatear para el componente
    const economicosFormateados = economicos
      .filter(
        e =>
          // Filtrar activos
          e &&
          (e.numero || e.nombre) &&
          e.estadoVehiculo !== 'inactivo' &&
          e.estadoVehiculo !== 'retirado' &&
          e.deleted !== true
      )
      .map(economico => {
        const numero = economico.numero || economico.nombre || 'N/A';
        const placa = economico.placaTracto || economico.placa || '';
        const marca = economico.marca || '';
        const modelo = economico.modelo || '';

        // Formato del texto mostrado: "numero - marca modelo" (sin placas)
        let texto = numero.toString();
        if (marca || modelo) {
          texto += ` - ${marca} ${modelo}`.trim();
        }

        return {
          id: numero.toString(),
          texto: texto,
          numero: numero.toString(),
          placa: placa,
          marca: marca,
          modelo: modelo,
          // Guardar el objeto completo para referencia
          economicoCompleto: economico
        };
      });

    return economicosFormateados;
  }

  /**
   * Llena automáticamente los campos Placa, Marca y Modelo cuando se selecciona un económico
   */
  function llenarCamposAutomaticos(itemSeleccionado, esEdicion = false) {
    // IDs específicos para el formulario principal y el modal de edición
    let inputPlaca, inputMarca, inputModelo, hiddenInput;

    if (esEdicion) {
      inputPlaca = document.getElementById('editarMantenimiento_Placa');
      inputMarca = document.getElementById('editarMantenimiento_marca');
      inputModelo = document.getElementById('editarMantenimiento_modelo');
      hiddenInput = document.getElementById('editarMantenimiento_economico_value');
    } else {
      inputPlaca = document.getElementById('Placa');
      inputMarca = document.getElementById('marca');
      inputModelo = document.getElementById('modelo');
      hiddenInput = document.getElementById('economico_value');
    }

    if (hiddenInput) {
      hiddenInput.value = itemSeleccionado.numero;
    }

    if (inputPlaca) {
      inputPlaca.value = itemSeleccionado.placa || '';
    }
    if (inputMarca) {
      inputMarca.value = itemSeleccionado.marca || '';
    }
    if (inputModelo) {
      inputModelo.value = itemSeleccionado.modelo || '';
    }

    console.log('✅ Campos llenados automáticamente:', {
      numero: itemSeleccionado.numero,
      placa: itemSeleccionado.placa,
      marca: itemSeleccionado.marca,
      modelo: itemSeleccionado.modelo
    });

    // Disparar evento para notificar a otros listeners (compatibilidad)
    let inputEconomico;
    if (esEdicion) {
      inputEconomico = document.getElementById('editarMantenimiento_economico');
    } else {
      inputEconomico = document.getElementById('economico');
    }
    if (inputEconomico) {
      inputEconomico.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /**
   * Inicializa el componente searchable-select para el formulario principal
   */
  async function inicializarEconomicoPrincipal() {
    const input = document.getElementById('economico');
    if (!input) {
      console.warn('⚠️ Campo económico principal no encontrado');
      return null;
    }

    const datos = await obtenerDatosEconomicos();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de económicos para inicializar');
      return null;
    }

    console.log('🔄 Inicializando componente searchable-select para económico principal...');

    const instancia = crearListaBusqueda(
      'economico',
      'select-economico',
      null, // No mostrar resultado seleccionado
      null,
      datos,
      'texto',
      'btn-clear-economico'
    );

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;
      llenarCamposAutomaticos(item, false);
    });

    return instancia;
  }

  /**
   * Inicializa el componente searchable-select para el modal de edición
   */
  async function inicializarEconomicoEditar() {
    const input = document.getElementById('editarMantenimiento_economico');
    if (!input) {
      console.warn('⚠️ Campo económico editar no encontrado');
      return null;
    }

    const datos = await obtenerDatosEconomicos();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de económicos para inicializar (editar)');
      return null;
    }

    console.log('🔄 Inicializando componente searchable-select para económico editar...');

    const instancia = crearListaBusqueda(
      'editarMantenimiento_economico',
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
      llenarCamposAutomaticos(item, true);
    });

    return instancia;
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();

    // Esperar un poco más para que se carguen los datos
    setTimeout(async () => {
      try {
        await inicializarEconomicoPrincipal();
        console.log('✅ Componente searchable-select inicializado para económico principal');
      } catch (error) {
        console.error('❌ Error inicializando componente económico principal:', error);
      }
    }, 500);
  });

  // Inicializar el modal de edición cuando se abra
  let modalEditarInicializado = false;
  document.addEventListener('show.bs.modal', e => {
    if (e.target && e.target.id === 'editarMantenimientoModal' && !modalEditarInicializado) {
      setTimeout(async () => {
        try {
          await inicializarEconomicoEditar();
          modalEditarInicializado = true;
          console.log('✅ Componente searchable-select inicializado para económico editar');
        } catch (error) {
          console.error('❌ Error inicializando componente económico editar:', error);
        }
      }, 300);
    }
  });

  // Exponer función para refrescar datos
  window.refreshSearchableSelectEconomicos = async function () {
    console.log('🔄 Refrescando datos de económicos para searchable-select...');
    // Recargar datos y reinicializar
    if (typeof window.loadEconomicosMantenimiento === 'function') {
      await window.loadEconomicosMantenimiento();
    }
    // Reinicializar componentes
    await inicializarEconomicoPrincipal();
    if (modalEditarInicializado) {
      await inicializarEconomicoEditar();
    }
  };

  console.log('✅ Script searchable-select-economicos.js cargado');
})();
