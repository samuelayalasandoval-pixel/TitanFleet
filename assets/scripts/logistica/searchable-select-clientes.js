/**
 * Inicialización del componente Searchable Select para Clientes en Logística
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
          (typeof window.loadClientesList === 'function' ||
            typeof window.configuracionManager !== 'undefined' ||
            typeof window.getDataWithCache === 'function')
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
   * Obtiene los datos de clientes y los formatea para el componente
   */
  async function obtenerDatosClientes() {
    let clientes = [];

    // PRIORIDAD 1: Caché global de clientes
    if (window.__clientesCache && typeof window.__clientesCache === 'object') {
      // Si es un objeto, convertir a array
      if (Array.isArray(window.__clientesCache)) {
        clientes = window.__clientesCache;
      } else {
        clientes = Object.values(window.__clientesCache);
      }
      if (clientes.length > 0) {
        console.log('✅ Clientes obtenidos desde __clientesCache:', clientes.length);
      }
    }

    // PRIORIDAD 2: Función loadClientesList (cargará y actualizará el caché)
    if (clientes.length === 0 && typeof window.loadClientesList === 'function') {
      try {
        // Esta función carga y actualiza el caché
        await window.loadClientesList();
        // Después de cargar, intentar obtener desde el caché
        if (window.__clientesCache && typeof window.__clientesCache === 'object') {
          if (Array.isArray(window.__clientesCache)) {
            clientes = window.__clientesCache;
          } else {
            clientes = Object.values(window.__clientesCache);
          }
          if (clientes.length > 0) {
            console.log('✅ Clientes obtenidos después de loadClientesList:', clientes.length);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo clientes desde loadClientesList:', error);
      }
    }

    // PRIORIDAD 3: getDataWithCache
    if (clientes.length === 0 && typeof window.getDataWithCache === 'function') {
      try {
        const clientesData = await window.getDataWithCache('clientes', async () => {
          let clientesData = [];

          // Intentar desde Firebase
          if (window.firebaseDb && window.fs) {
            try {
              const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
              const clientesDoc = await window.fs.getDoc(clientesDocRef);

              if (clientesDoc.exists()) {
                const data = clientesDoc.data();
                if (data.clientes && Array.isArray(data.clientes)) {
                  const todosLosClientes = data.clientes;

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
                } else if (data.clientes && typeof data.clientes === 'object') {
                  const todosLosClientes = Object.values(data.clientes);

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
                }
              }
            } catch (error) {
              console.warn('⚠️ Error cargando clientes de Firebase:', error);
            }
          }

          // Fallback a configuracionManager
          if (
            clientesData.length === 0 &&
            window.configuracionManager &&
            typeof window.configuracionManager.getAllClientes === 'function'
          ) {
            try {
              const clientesFromManager =
                (await window.configuracionManager.getAllClientes()) || [];
              clientesData = Array.isArray(clientesFromManager)
                ? clientesFromManager
                : Object.values(clientesFromManager || {});
            } catch (error) {
              console.warn('⚠️ Error cargando desde configuracionManager:', error);
            }
          }

          return clientesData;
        });

        // Asegurar que clientesData es un array
        if (Array.isArray(clientesData)) {
          clientes = clientesData;
        } else if (clientesData && typeof clientesData === 'object') {
          clientes = Object.values(clientesData);
        } else {
          clientes = [];
        }

        if (clientes.length > 0) {
          console.log('✅ Clientes obtenidos desde getDataWithCache:', clientes.length);
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo clientes desde getDataWithCache:', error);
      }
    }

    // PRIORIDAD 4: configuracionManager
    if (clientes.length === 0 && window.configuracionManager) {
      try {
        if (typeof window.configuracionManager.getAllClientes === 'function') {
          const clientesFromManager = (await window.configuracionManager.getAllClientes()) || [];
          // Asegurar que es un array
          if (Array.isArray(clientesFromManager)) {
            clientes = clientesFromManager;
          } else if (clientesFromManager && typeof clientesFromManager === 'object') {
            clientes = Object.values(clientesFromManager);
          } else {
            clientes = [];
          }
          console.log(
            '✅ Clientes obtenidos desde configuracionManager.getAllClientes:',
            clientes.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo clientes desde configuracionManager:', error);
      }
    }

    // Asegurar que clientes es un array
    if (!Array.isArray(clientes)) {
      console.warn('⚠️ clientes no es un array, convirtiendo...', typeof clientes, clientes);
      if (clientes && typeof clientes === 'object') {
        clientes = Object.values(clientes);
      } else {
        clientes = [];
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

    const totalAntesFiltro = clientes.length;
    clientes = clientes.filter(cliente => {
      const clienteTenantId = cliente.tenantId;
      // Todos los usuarios solo ven clientes con su tenantId exacto
      return clienteTenantId === tenantId;
    });

    if (totalAntesFiltro !== clientes.length) {
      console.log(
        `🔒 Clientes filtrados por tenantId (${tenantId}): ${clientes.length} de ${totalAntesFiltro} totales`
      );
    }

    // Formatear para el componente
    const clientesFormateados = clientes
      .filter(c => {
        // Filtrar clientes válidos (deben tener RFC y nombre)
        const rfc = c.rfc || c.rfcCliente;
        const nombre = c.nombre || c.nombreCliente || c.razonSocial;
        return rfc && nombre;
      })
      .map(cliente => {
        const rfc = cliente.rfc || cliente.rfcCliente;
        const nombre = cliente.nombre || cliente.nombreCliente || cliente.razonSocial || '';

        // Formato del texto mostrado: "nombre" (sin RFC)
        const texto = nombre;

        return {
          id: rfc,
          texto: texto,
          nombre: nombre,
          rfc: rfc,
          // Guardar el objeto completo para referencia
          clienteCompleto: cliente
        };
      });

    console.log(`✅ ${clientesFormateados.length} clientes formateados`);
    return clientesFormateados;
  }

  /**
   * Inicializa el campo de cliente
   */
  async function inicializarCliente(inputId, selectId, btnClearId, hiddenInputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo cliente ${inputId} no encontrado`);
      return null;
    }

    const datos = await obtenerDatosClientes();
    if (datos.length === 0) {
      console.warn('⚠️ No se encontraron datos de clientes');
      return null;
    }

    console.log(
      `🔄 Inicializando componente searchable-select para ${inputId}... (${datos.length} clientes)`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;
      // Actualizar el hidden input con el RFC del cliente
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) {
        hiddenInput.value = item.rfc;
        console.log(`✅ RFC del cliente guardado en ${hiddenInputId}:`, item.rfc);
      }

      // Llamar a la función loadClienteData si existe (para llenar campos automáticamente)
      if (typeof window.loadClienteData === 'function') {
        window.loadClienteData(item.rfc);
      }
    });

    return instancia;
  }

  // Variable para guardar la instancia del componente
  let instanciaCliente = null;

  // Exponer función para refrescar datos cuando se actualice la lista
  window.refreshSearchableSelectCliente = async function () {
    console.log('🔄 Refrescando datos de clientes para searchable-select...');

    // Recargar la lista de clientes
    if (typeof window.loadClientesList === 'function') {
      await window.loadClientesList();
    }

    // Si hay una instancia, actualizar sus datos
    if (instanciaCliente && instanciaCliente.actualizarDatos) {
      const nuevosDatos = await obtenerDatosClientes();
      instanciaCliente.actualizarDatos(nuevosDatos);
      console.log(`✅ Datos actualizados: ${nuevosDatos.length} clientes`);
    } else {
      // Si no hay instancia, reinicializar
      const campo = {
        inputId: 'cliente',
        selectId: 'select-cliente',
        btnClearId: 'btn-clear-cliente',
        hiddenInputId: 'cliente_value'
      };
      const input = document.getElementById(campo.inputId);
      if (input) {
        instanciaCliente = await inicializarCliente(
          campo.inputId,
          campo.selectId,
          campo.btnClearId,
          campo.hiddenInputId
        );
      }
    }
  };

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();

    // Intentar inicializar con retry si no hay datos
    const inicializarConRetry = async (intentos = 0) => {
      const maxIntentos = 5;

      try {
        // Primero intentar cargar los datos si están disponibles
        if (typeof window.loadClientesList === 'function') {
          await window.loadClientesList();
        }

        // Verificar que haya datos disponibles
        const datosPrueba = await obtenerDatosClientes();
        if (datosPrueba.length === 0 && intentos < maxIntentos) {
          console.log(`⏳ Esperando datos de clientes... (intento ${intentos + 1}/${maxIntentos})`);
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
          return;
        }

        // Inicializar el campo del formulario principal
        const campo = {
          inputId: 'cliente',
          selectId: 'select-cliente',
          btnClearId: 'btn-clear-cliente',
          hiddenInputId: 'cliente_value'
        };

        const input = document.getElementById(campo.inputId);
        if (input) {
          instanciaCliente = await inicializarCliente(
            campo.inputId,
            campo.selectId,
            campo.btnClearId,
            campo.hiddenInputId
          );
        }
      } catch (error) {
        console.error('❌ Error inicializando componente de clientes:', error);
        if (intentos < maxIntentos) {
          setTimeout(() => inicializarConRetry(intentos + 1), 500);
        }
      }
    };

    setTimeout(() => inicializarConRetry(0), 500);
  });

  console.log('✅ Script searchable-select-clientes.js (logística) cargado');
})();
