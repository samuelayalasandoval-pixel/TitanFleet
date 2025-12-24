/**
 * Gestión de Clientes - logistica.html
 * Manejo completo de clientes: carga, filtros, y selección
 */

(function () {
  'use strict';

  console.log('🔵 Script de clientes-manager.js iniciado');

  // Caché global de clientes para acceso síncrono
  window.__clientesCache = window.__clientesCache || {};

  /**
   * Función para cargar la lista de clientes
   */
  window.loadClientesList = async function () {
    // Prevenir ejecuciones simultáneas
    if (window.__cargandoClientes) {
      console.log('⏭️ Carga de clientes ya en progreso, omitiendo...');
      return;
    }

    window.__cargandoClientes = true;
    console.log('👥 Cargando lista de clientes...');

    try {
      const selectCliente = document.getElementById('cliente');
      if (!selectCliente) {
        console.error('❌ No se encontró el campo de cliente');
        window.__cargandoClientes = false;
        return;
      }

      // Verificar si es un select (sistema antiguo) o un input (nuevo componente searchable-select)
      const esSelect = selectCliente.tagName === 'SELECT';
      const esInput = selectCliente.tagName === 'INPUT';

      // Si es un select, limpiar opciones existentes (para compatibilidad)
      if (esSelect) {
        // Limpiar opciones existentes (excepto la primera)
        // Guardar la opción por defecto si existe
        const opcionPorDefecto = selectCliente.querySelector('option[value=""]');
        const opcionPorDefectoTexto = opcionPorDefecto
          ? opcionPorDefecto.textContent
          : 'Seleccione un cliente...';

        // Limpiar completamente el select
        selectCliente.innerHTML = '';

        // Agregar la opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = opcionPorDefectoTexto;
        selectCliente.appendChild(defaultOption);
      }
      // Si es un input (nuevo componente), no hacer nada aquí, el componente manejará la carga

      // Usar sistema de caché inteligente: Firebase primero, luego caché
      const clientes = await window.getDataWithCache('clientes', async () => {
        let clientesData = [];

        // PRIORIDAD 1: Cargar desde configuracion/clientes (documento con array)
        if (window.firebaseDb && window.fs) {
          console.log('📊 Intentando cargar clientes desde configuracion/clientes...');
          try {
            const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
            const clientesDoc = await window.fs.getDoc(clientesDocRef);

            if (clientesDoc.exists()) {
              const data = clientesDoc.data();
              console.log('📋 Datos del documento configuracion/clientes:', {
                tieneClientes: Boolean(data.clientes),
                esArray: Array.isArray(data.clientes),
                cantidad: data.clientes?.length || 0
              });

              if (data.clientes && Array.isArray(data.clientes)) {
                clientesData = data.clientes;
                console.log(
                  '✅ Clientes cargados desde configuracion/clientes:',
                  clientesData.length
                );
              } else {
                console.warn('⚠️ El documento existe pero no tiene array de clientes válido');
              }
            } else {
              console.warn('⚠️ El documento configuracion/clientes no existe');
            }
          } catch (error) {
            console.warn('⚠️ Error cargando clientes de configuracion/clientes:', error);
          }
        } else {
          console.warn('⚠️ Firebase no está disponible aún (firebaseDb o fs no están listos)');
        }

        // PRIORIDAD 2: Fallback a configuracionManager
        if (
          clientesData.length === 0 &&
          window.configuracionManager &&
          typeof window.configuracionManager.getAllClientes === 'function'
        ) {
          console.log('📋 Intentando cargar desde configuracionManager...');
          try {
            const todosLosClientes = (await window.configuracionManager.getAllClientes()) || [];

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

            // CRÍTICO: Filtrar por tenantId
            clientesData = todosLosClientes.filter(cliente => {
              const clienteTenantId = cliente.tenantId;
              return clienteTenantId === tenantId;
            });

            console.log(
              `🔒 Clientes filtrados por tenantId (${tenantId}): ${clientesData.length} de ${todosLosClientes.length} totales`
            );
          } catch (error) {
            console.warn('⚠️ Error cargando desde configuracionManager:', error);
          }
        }

        // CRÍTICO: Asegurar filtrado por tenantId en todos los casos (por si acaso)
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

        const totalAntesFiltro = clientesData.length;
        clientesData = clientesData.filter(cliente => {
          const clienteTenantId = cliente.tenantId;
          return clienteTenantId === tenantId;
        });

        if (totalAntesFiltro !== clientesData.length) {
          console.log(
            `🔒 Clientes filtrados por tenantId (${tenantId}): ${clientesData.length} de ${totalAntesFiltro} totales`
          );
        }

        return clientesData;
      });

      // Agregar clientes al select y al caché
      // Asegurar que clientes sea un array válido
      const clientesArray = Array.isArray(clientes) ? clientes : clientes ? [clientes] : [];

      if (clientesArray && clientesArray.length > 0) {
        let clientesAgregados = 0;
        let clientesOmitidos = 0;
        const rfcAgregados = new Set(); // Usar Set para evitar duplicados

        console.log(`📋 Procesando ${clientesArray.length} clientes para agregar al select...`);

        clientesArray.forEach((cliente, index) => {
          const rfc = cliente.rfc || cliente.rfcCliente;
          const nombre = cliente.nombre || cliente.nombreCliente || cliente.razonSocial;

          if (!rfc || !nombre) {
            console.warn(`⚠️ Cliente ${index + 1} omitido (sin RFC o nombre):`, {
              rfc,
              nombre,
              cliente
            });
            clientesOmitidos++;
            return;
          }

          // Verificar si el RFC ya fue agregado (evitar duplicados)
          if (rfcAgregados.has(rfc)) {
            console.debug(`⚠️ Cliente duplicado omitido: ${nombre} (RFC: ${rfc})`);
            clientesOmitidos++;
            return;
          }

          // Si es un select (sistema antiguo), verificar y agregar
          if (esSelect) {
            // Verificar si ya existe en el select (por si acaso)
            const existeEnSelect = Array.from(selectCliente.options).some(opt => opt.value === rfc);
            if (existeEnSelect) {
              console.debug(`⚠️ Cliente ya existe en select, omitiendo: ${nombre} (RFC: ${rfc})`);
              clientesOmitidos++;
              return;
            }

            // Agregar al select
            const option = document.createElement('option');
            option.value = rfc;
            option.textContent = nombre;
            selectCliente.appendChild(option);
          }

          // Marcar como agregado
          rfcAgregados.add(rfc);

          // Agregar al caché global
          window.__clientesCache[rfc] = cliente;

          clientesAgregados++;
        });

        console.log(
          `✅ Lista de clientes cargada y cacheada: ${clientesAgregados} de ${clientesArray.length} clientes agregados`
        );
        if (clientesOmitidos > 0) {
          console.log(`ℹ️ ${clientesOmitidos} clientes omitidos (duplicados o sin datos válidos)`);
        }

        // Verificar que los datos se hayan cargado correctamente (solo si es select)
        if (esSelect) {
          const totalOpciones = selectCliente.options.length;
          console.log(
            `📊 Total de opciones en el select después de cargar: ${totalOpciones} (incluyendo opción por defecto)`
          );

          if (totalOpciones <= 1) {
            console.error('❌ ERROR: El select no tiene clientes después de intentar cargarlos');
            console.error('❌ Esto puede indicar que:');
            console.error('   1. Los clientes no tienen RFC o nombre válidos');
            console.error('   2. Todos los clientes fueron filtrados como duplicados');
            console.error('   3. Hay un problema con la estructura de datos de los clientes');
          }
        } else if (esInput) {
          console.log(
            `✅ Clientes cargados en caché para componente searchable-select: ${clientesAgregados} clientes`
          );
        }
      } else {
        console.warn(
          '⚠️ No se encontraron clientes en ninguna fuente. Verifica que haya clientes configurados en Configuración > Clientes'
        );
        console.warn('💡 Intenta:');
        console.warn('   1. Ir a Configuración > Clientes y verificar que haya clientes guardados');
        console.warn('   2. Hacer clic en el botón de actualizar (🔄) junto al select de clientes');
        console.warn('   3. Verificar la consola para ver si hay errores al cargar desde Firebase');
      }
    } catch (error) {
      console.error('❌ Error cargando lista de clientes:', error);
      console.error('❌ Stack:', error.stack);
    } finally {
      // Liberar el flag de carga
      window.__cargandoClientes = false;
    }
  };

  /**
   * Función para cargar económicos en el select de filtro
   */
  window.cargarEconomicosEnFiltro = async function () {
    const selectFiltroEconomico = document.getElementById('filtroEconomico');
    if (!selectFiltroEconomico) {
      console.warn('⚠️ No se encontró el select de filtro de económico');
      return;
    }

    // Limpiar opciones existentes (excepto la primera)
    selectFiltroEconomico.innerHTML = '<option value="">Todos los económicos</option>';

    try {
      let economicos = [];

      // PRIORIDAD 1: Cargar desde configuracion/tractocamiones
      if (window.firebaseDb && window.fs) {
        try {
          const tractocamionesDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'tractocamiones'
          );
          const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

          if (tractocamionesDoc.exists()) {
            const data = tractocamionesDoc.data();
            if (data.economicos && Array.isArray(data.economicos)) {
              economicos = data.economicos;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando económicos de configuracion/tractocamiones:', error);
        }
      }

      // PRIORIDAD 2: Fallback a configuracionManager
      if (
        economicos.length === 0 &&
        window.configuracionManager &&
        typeof window.configuracionManager.getAllEconomicos === 'function'
      ) {
        economicos = (await window.configuracionManager.getAllEconomicos()) || [];
      }

      // PRIORIDAD 3: Fallback a localStorage
      if (economicos.length === 0) {
        const economicosData = localStorage.getItem('erp_economicos');
        if (economicosData) {
          try {
            const parsed = JSON.parse(economicosData);
            if (Array.isArray(parsed)) {
              economicos = parsed;
            } else if (typeof parsed === 'object') {
              economicos = Object.values(parsed);
            }
          } catch (e) {
            console.warn('⚠️ Error parseando económicos de localStorage:', e);
          }
        }
      }

      // Agregar económicos al select de filtro
      if (economicos && economicos.length > 0) {
        economicos.forEach(economico => {
          const numero = economico.numero || economico.numeroEconomico || '';
          const placa = economico.placaTracto || economico.placa || '';
          const marca = economico.marca || '';
          const texto = placa ? `${numero} - ${placa} (${marca})` : `${numero} - ${marca}`;

          if (!numero) {
            return;
          }

          const option = document.createElement('option');
          option.value = numero;
          option.textContent = texto;
          selectFiltroEconomico.appendChild(option);
        });
        console.log(`✅ ${economicos.length} económicos cargados en el filtro`);
      }
    } catch (error) {
      console.error('❌ Error cargando económicos para el filtro:', error);
    }
  };

  /**
   * Función para cargar clientes en el select de filtro
   */
  window.cargarClientesEnFiltro = async function () {
    // Prevenir ejecuciones simultáneas
    if (window.__cargandoClientesFiltro) {
      console.log('⏭️ Carga de clientes en filtro ya en progreso, omitiendo...');
      return;
    }

    window.__cargandoClientesFiltro = true;

    try {
      const selectFiltroCliente = document.getElementById('filtroCliente');
      if (!selectFiltroCliente) {
        console.warn('⚠️ No se encontró el select de filtro de cliente');
        window.__cargandoClientesFiltro = false;
        return;
      }

      // Limpiar opciones existentes (excepto la primera)
      selectFiltroCliente.innerHTML = '<option value="">Todos los clientes</option>';

      let clientes = [];

      // PRIORIDAD 1: Cargar desde configuracion/clientes
      if (window.firebaseDb && window.fs) {
        try {
          const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
          const clientesDoc = await window.fs.getDoc(clientesDocRef);

          if (clientesDoc.exists()) {
            const data = clientesDoc.data();
            if (data.clientes && Array.isArray(data.clientes)) {
              clientes = data.clientes;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando clientes de configuracion/clientes:', error);
        }
      }

      // PRIORIDAD 2: Fallback a configuracionManager
      if (
        clientes.length === 0 &&
        window.configuracionManager &&
        typeof window.configuracionManager.getAllClientes === 'function'
      ) {
        clientes = (await window.configuracionManager.getAllClientes()) || [];
      }

      // PRIORIDAD 3: Fallback a localStorage
      if (clientes.length === 0) {
        const clientesData = localStorage.getItem('erp_clientes');
        if (clientesData) {
          try {
            const parsed = JSON.parse(clientesData);
            if (Array.isArray(parsed)) {
              clientes = parsed;
            } else if (typeof parsed === 'object') {
              clientes = Object.values(parsed);
            }
          } catch (e) {
            console.warn('⚠️ Error parseando clientes de localStorage:', e);
          }
        }
      }

      // Agregar clientes al select de filtro
      if (clientes && clientes.length > 0) {
        const rfcAgregadosFiltro = new Set(); // Usar Set para evitar duplicados
        let clientesAgregadosFiltro = 0;

        clientes.forEach(cliente => {
          const rfc = cliente.rfc || cliente.rfcCliente;
          const nombre = cliente.nombre || cliente.nombreCliente || cliente.razonSocial;

          if (!rfc || !nombre) {
            return;
          }

          // Verificar si el RFC ya fue agregado (evitar duplicados)
          if (rfcAgregadosFiltro.has(rfc)) {
            console.debug('⚠️ Cliente duplicado omitido en filtro:', { rfc, nombre });
            return;
          }

          // Verificar si ya existe en el select de filtro
          const existeEnFiltro = Array.from(selectFiltroCliente.options).some(
            opt => opt.value === rfc
          );
          if (existeEnFiltro) {
            console.debug('⚠️ Cliente ya existe en filtro, omitiendo:', { rfc, nombre });
            return;
          }

          // Marcar como agregado
          rfcAgregadosFiltro.add(rfc);

          const option = document.createElement('option');
          option.value = rfc;
          option.textContent = nombre;
          selectFiltroCliente.appendChild(option);
          clientesAgregadosFiltro++;
        });
        console.log(
          `✅ ${clientesAgregadosFiltro} de ${clientes.length} clientes cargados en el filtro`
        );
      }
    } catch (error) {
      console.error('❌ Error cargando clientes para el filtro:', error);
    } finally {
      // Liberar el flag de carga
      window.__cargandoClientesFiltro = false;
    }
  };

  /**
   * Función para cargar datos del cliente seleccionado
   */
  window.loadClienteData = async function (rfcCliente) {
    if (!rfcCliente || rfcCliente === '') {
      console.warn('⚠️ No se proporcionó RFC del cliente o está vacío');
      return;
    }

    console.log('👤 Cargando datos del cliente seleccionado...');
    console.log('🔍 Buscando cliente con RFC:', rfcCliente);

    try {
      let cliente = null;

      // PRIORIDAD 1: Buscar en caché global (más rápido)
      if (window.__clientesCache && window.__clientesCache[rfcCliente]) {
        cliente = window.__clientesCache[rfcCliente];
        console.log('✅ Cliente encontrado en caché:', cliente.nombre || cliente.nombreCliente);
      }

      // PRIORIDAD 2: Buscar en configuracion/clientes (Firebase)
      if (!cliente && window.firebaseDb && window.fs) {
        try {
          console.log('📊 Buscando cliente en configuracion/clientes...');
          const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
          const clientesDoc = await window.fs.getDoc(clientesDocRef);

          if (clientesDoc.exists()) {
            const data = clientesDoc.data();
            if (data.clientes && Array.isArray(data.clientes)) {
              cliente = data.clientes.find(c => (c.rfc || c.rfcCliente) === rfcCliente);
              if (cliente) {
                // Actualizar caché
                window.__clientesCache[rfcCliente] = cliente;
                console.log(
                  '✅ Cliente encontrado en configuracion/clientes:',
                  cliente.nombre || cliente.nombreCliente
                );
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error buscando cliente en Firebase:', error);
        }
      }

      // PRIORIDAD 3: Buscar en configuracionManager (localStorage)
      if (
        !cliente &&
        window.configuracionManager &&
        typeof window.configuracionManager.getCliente === 'function'
      ) {
        cliente = window.configuracionManager.getCliente(rfcCliente);
        if (cliente) {
          // Actualizar caché
          window.__clientesCache[rfcCliente] = cliente;
          console.log(
            '✅ Cliente encontrado en configuracionManager:',
            cliente.nombre || cliente.nombreCliente
          );
        }
      }

      // PRIORIDAD 4: Buscar en localStorage directamente
      if (!cliente) {
        const clientesData = localStorage.getItem('erp_clientes');
        if (clientesData) {
          try {
            const clientes = JSON.parse(clientesData);
            if (Array.isArray(clientes)) {
              cliente = clientes.find(c => (c.rfc || c.rfcCliente) === rfcCliente);
            } else if (typeof clientes === 'object') {
              cliente =
                clientes[rfcCliente] ||
                Object.values(clientes).find(c => (c.rfc || c.rfcCliente) === rfcCliente);
            }
            if (cliente) {
              // Actualizar caché
              window.__clientesCache[rfcCliente] = cliente;
              console.log(
                '✅ Cliente encontrado en localStorage:',
                cliente.nombre || cliente.nombreCliente
              );
            }
          } catch (e) {
            console.warn('⚠️ Error parseando clientes de localStorage:', e);
          }
        }
      }

      if (cliente) {
        // Llenar campo RFC del cliente
        const campoRfc = document.getElementById('rfcCliente');
        if (campoRfc) {
          campoRfc.value = cliente.rfc || cliente.rfcCliente || rfcCliente;
          console.log('📝 Campo RFC llenado con:', campoRfc.value);
        } else {
          console.warn('⚠️ Campo rfcCliente no encontrado');
        }

        console.log('✅ Datos del cliente cargados exitosamente');
      } else {
        console.warn('⚠️ Cliente no encontrado con RFC:', rfcCliente);
        console.warn('💡 Intenta recargar la lista de clientes con el botón de actualizar');
      }
    } catch (error) {
      console.error('❌ Error cargando datos del cliente:', error);
    }
  };

  /**
   * Función para actualizar la lista de clientes
   */
  window.refreshClientesList = async function () {
    console.log('🔄 Actualizando lista de clientes...');
    await window.loadClientesList();
    window.cargarClientesEnFiltro(); // Actualizar también el filtro

    // Actualizar también el componente searchable-select si existe
    if (typeof window.refreshSearchableSelectCliente === 'function') {
      await window.refreshSearchableSelectCliente();
    }

    // Mostrar notificación
    if (window.showNotification) {
      window.showNotification('Lista de clientes actualizada', 'success');
    } else {
      alert('✅ Lista de clientes actualizada');
    }
  };

  /**
   * Función para abrir configuración de clientes
   */
  window.openConfiguracionClientes = function () {
    console.log('🔧 Abriendo configuración de clientes...');
    window.open('configuracion.html#clientes', '_blank');
  };

  /**
   * Función auxiliar para cargar clientes en el select del modal
   */
  window.cargarClientesEnSelectModal = async function (selectElement) {
    if (!selectElement) {
      return;
    }

    selectElement.innerHTML = '<option value="">Cargando clientes...</option>';

    try {
      let clientes = [];

      // PRIORIDAD 1: Cargar desde configuracion/clientes (documento con array)
      if (window.firebaseDb && window.fs) {
        try {
          const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
          const clientesDoc = await window.fs.getDoc(clientesDocRef);

          if (clientesDoc.exists()) {
            const data = clientesDoc.data();
            if (data.clientes && Array.isArray(data.clientes)) {
              clientes = data.clientes;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando clientes de configuracion/clientes:', error);
        }
      }

      // PRIORIDAD 2: Fallback a configuracionManager
      if (
        clientes.length === 0 &&
        window.configuracionManager &&
        typeof window.configuracionManager.getAllClientes === 'function'
      ) {
        clientes = (await window.configuracionManager.getAllClientes()) || [];
      }

      // PRIORIDAD 3: Fallback a localStorage
      if (clientes.length === 0) {
        const clientesData = localStorage.getItem('erp_clientes');
        if (clientesData) {
          try {
            const parsed = JSON.parse(clientesData);
            if (Array.isArray(parsed)) {
              clientes = parsed;
            } else if (typeof parsed === 'object') {
              clientes = Object.values(parsed);
            }
          } catch (e) {
            console.warn('⚠️ Error parseando clientes de localStorage:', e);
          }
        }
      }

      // Limpiar y agregar opciones
      selectElement.innerHTML = '<option value="">Seleccione un cliente...</option>';

      if (clientes && clientes.length > 0) {
        clientes.forEach(cliente => {
          const rfc = cliente.rfc || cliente.rfcCliente;
          const nombre = cliente.nombre || cliente.nombreCliente || cliente.razonSocial;

          if (rfc && nombre) {
            const option = document.createElement('option');
            option.value = rfc;
            option.textContent = nombre;
            selectElement.appendChild(option);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error cargando clientes para modal:', error);
      selectElement.innerHTML = '<option value="">Error cargando clientes</option>';
    }
  };

  /**
   * Auto-cargar clientes cuando el DOM esté listo y el script esté cargado
   * Esto asegura que los clientes se carguen incluso si page-init.js no se ejecuta
   */
  function autoCargarClientes() {
    const ejecutarCarga = async () => {
      // Esperar a que Firebase esté disponible
      let intentos = 0;
      const maxIntentos = 20;

      while (intentos < maxIntentos) {
        // Verificar que la función esté disponible (debería estar, ya que estamos en el mismo archivo)
        if (typeof window.loadClientesList !== 'function') {
          await new Promise(resolve => setTimeout(resolve, 100));
          intentos++;
          continue;
        }

        // Verificar que Firebase esté listo
        const firebaseReady = window.firebaseDb && window.fs;
        const selectCliente = document.getElementById('cliente');

        if (!selectCliente) {
          // El select aún no existe, esperar un poco más
          await new Promise(resolve => setTimeout(resolve, 100));
          intentos++;
          continue;
        }

        // Verificar si ya hay clientes cargados
        // Si es un select, verificar opciones; si es input, verificar caché
        const esSelect = selectCliente && selectCliente.tagName === 'SELECT';
        const esInput = selectCliente && selectCliente.tagName === 'INPUT';

        if (esSelect && selectCliente.options.length > 1) {
          console.log('✅ Clientes ya cargados en select, omitiendo auto-carga');
          return;
        } else if (
          esInput &&
          window.__clientesCache &&
          Object.keys(window.__clientesCache).length > 0
        ) {
          console.log('✅ Clientes ya cargados en caché, omitiendo auto-carga');
          return;
        }

        // Intentar cargar
        if (firebaseReady || intentos >= 10) {
          console.log('🔄 Auto-cargando clientes desde clientes-manager.js...');
          try {
            await window.loadClientesList();
            if (typeof window.cargarClientesEnFiltro === 'function') {
              await window.cargarClientesEnFiltro();
            }
            console.log('✅ Auto-carga de clientes completada');
            return;
          } catch (err) {
            console.warn('⚠️ Error en auto-carga de clientes:', err);
            if (intentos >= maxIntentos - 1) {
              return; // No reintentar más
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 150));
        intentos++;
      }
    };

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(ejecutarCarga, 300);
      });
    } else {
      // DOM ya está listo
      setTimeout(ejecutarCarga, 300);
    }

    // También intentar después del evento load como fallback
    window.addEventListener('load', () => {
      setTimeout(ejecutarCarga, 1000);
    });
  }

  // Ejecutar auto-carga
  autoCargarClientes();
})();
