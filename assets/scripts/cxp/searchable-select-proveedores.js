/**
 * Inicialización del componente Searchable Select para Proveedores en CXP
 */

(function () {
  'use strict';

  // Variable para guardar instancias de componentes
  const instanciasProveedores = {};

  // Esperar a que los scripts necesarios estén cargados
  function waitForDependencies() {
    return new Promise(resolve => {
      let attempts = 0;
      const checkDependencies = () => {
        attempts++;
        if (
          typeof crearListaBusqueda !== 'undefined' &&
          (typeof window.loadProveedoresSelect === 'function' ||
            typeof window.configuracionManager !== 'undefined' ||
            typeof window.loadProveedoresFromFirebase === 'function')
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
   * Obtiene los datos de proveedores y los formatea para el componente
   */
  async function obtenerDatosProveedores() {
    let proveedores = [];

    // PRIORIDAD 1: Función loadProveedoresFromFirebase
    if (typeof window.loadProveedoresFromFirebase === 'function') {
      try {
        const proveedoresFirebase = await window.loadProveedoresFromFirebase();
        if (Array.isArray(proveedoresFirebase) && proveedoresFirebase.length > 0) {
          proveedores = proveedoresFirebase;
          console.log(
            '✅ Proveedores obtenidos desde loadProveedoresFromFirebase:',
            proveedores.length
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo proveedores desde loadProveedoresFromFirebase:', error);
      }
    }

    // PRIORIDAD 2: Firebase directo
    if (proveedores.length === 0 && window.firebaseDb && window.fs) {
      try {
        const { doc, getDoc } = window.fs;
        const docRef = doc(window.firebaseDb, 'configuracion', 'proveedores');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.proveedores && Array.isArray(data.proveedores) && data.proveedores.length > 0) {
            const todosLosProveedores = data.proveedores;

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
            proveedores = todosLosProveedores.filter(proveedor => {
              const proveedorTenantId = proveedor.tenantId;
              return proveedorTenantId === tenantId;
            });

            console.log(
              `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedores.length} de ${todosLosProveedores.length} totales`
            );
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo proveedores desde Firebase directo:', error);
      }
    }

    // PRIORIDAD 3: configuracionManager
    if (proveedores.length === 0 && window.configuracionManager) {
      try {
        const temp = window.configuracionManager.getProveedores();
        let todosLosProveedores = [];
        if (Array.isArray(temp) && temp.length > 0) {
          todosLosProveedores = temp;
        } else if (temp && typeof temp === 'object') {
          // Convertir objeto a array
          todosLosProveedores = Object.values(temp);
        }

        if (todosLosProveedores.length > 0) {
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
          proveedores = todosLosProveedores.filter(proveedor => {
            const proveedorTenantId = proveedor.tenantId;
            return proveedorTenantId === tenantId;
          });

          console.log(
            `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedores.length} de ${todosLosProveedores.length} totales`
          );
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo proveedores desde configuracionManager:', error);
      }
    }

    // PRIORIDAD 4: localStorage (fallback)
    if (proveedores.length === 0) {
      try {
        const proveedoresData = localStorage.getItem('erp_proveedores');
        if (proveedoresData) {
          const parsed = JSON.parse(proveedoresData);
          if (Array.isArray(parsed)) {
            proveedores = parsed;
          } else if (parsed && typeof parsed === 'object') {
            proveedores = Object.values(parsed);
          }
          if (proveedores.length > 0) {
            console.log('✅ Proveedores obtenidos desde localStorage:', proveedores.length);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo proveedores desde localStorage:', error);
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

    const totalAntesFiltro = proveedores.length;
    proveedores = proveedores.filter(proveedor => {
      const proveedorTenantId = proveedor.tenantId;
      // Todos los usuarios solo ven proveedores con su tenantId exacto
      return proveedorTenantId === tenantId;
    });

    if (totalAntesFiltro !== proveedores.length) {
      console.log(
        `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedores.length} de ${totalAntesFiltro} totales`
      );
    }

    // Formatear para el componente
    const proveedoresFormateados = proveedores
      .filter(p => {
        // Filtrar proveedores válidos (deben tener RFC y nombre)
        const rfc = p.rfc || p.id;
        const nombre = p.nombre || p.razonSocial;
        return rfc && nombre;
      })
      .map(proveedor => {
        const rfc = proveedor.rfc || proveedor.id;
        const nombre = proveedor.nombre || proveedor.razonSocial || '';

        // Formato del texto mostrado: "nombre - RFC"
        let texto = nombre;
        if (rfc) {
          texto += ` - ${rfc}`;
        }

        return {
          id: rfc,
          texto: texto,
          nombre: nombre,
          rfc: rfc,
          // Guardar el objeto completo para referencia
          proveedorCompleto: proveedor
        };
      });

    console.log(`✅ ${proveedoresFormateados.length} proveedores formateados`);
    return proveedoresFormateados;
  }

  /**
   * Inicializa un campo de proveedor
   * @param {string} inputId - ID del input
   * @param {string} selectId - ID del contenedor del dropdown
   * @param {string} btnClearId - ID del botón de limpiar
   * @param {string} hiddenInputId - ID del input hidden para el valor
   */
  async function inicializarProveedor(inputId, selectId, btnClearId, hiddenInputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.warn(`⚠️ Campo proveedor ${inputId} no encontrado`);
      return null;
    }

    // Si ya está inicializado, no hacerlo de nuevo
    if (instanciasProveedores[inputId]) {
      console.log(`ℹ️ Campo ${inputId} ya está inicializado`);
      return instanciasProveedores[inputId];
    }

    const datos = await obtenerDatosProveedores();
    if (datos.length === 0) {
      console.warn(`⚠️ No se encontraron datos de proveedores para ${inputId}`);
      return null;
    }

    console.log(
      `🔄 Inicializando componente searchable-select para ${inputId}... (${datos.length} proveedores)`
    );

    const instancia = crearListaBusqueda(inputId, selectId, null, null, datos, 'texto', btnClearId);

    // Guardar instancia
    instanciasProveedores[inputId] = instancia;

    // Interceptar selección mediante el evento personalizado del componente
    input.addEventListener('itemSelected', e => {
      const { item } = e.detail;

      // Actualizar el input para mostrar solo el nombre (sin RFC)
      input.value = item.nombre || item.texto.split(' - ')[0] || item.texto;

      // Actualizar el hidden input con el RFC del proveedor
      const hiddenInput = document.getElementById(hiddenInputId);
      if (hiddenInput) {
        hiddenInput.value = item.rfc;
        console.log(`✅ RFC del proveedor guardado en ${hiddenInputId}:`, item.rfc);
      }

      // Llenar automáticamente el campo RFC del proveedor
      if (inputId === 'proveedorFactura') {
        const rfcInput = document.getElementById('rfcProveedorFactura');
        if (rfcInput && item.rfc) {
          rfcInput.value = item.rfc;
          console.log('✅ RFC del proveedor llenado automáticamente:', item.rfc);
        }
      }

      // Llamar a funciones relacionadas si existen
      if (
        inputId === 'proveedorFactura' &&
        typeof actualizarFechaVencimientoFactura === 'function'
      ) {
        actualizarFechaVencimientoFactura();
      }
    });

    return instancia;
  }

  /**
   * Espera a que los elementos existan en el DOM
   * @param {string[]} elementIds - IDs de los elementos a esperar
   * @param {number} timeout - Tiempo máximo de espera en ms
   * @returns {Promise<boolean>}
   */
  function waitForElements(elementIds, timeout = 3000) {
    return new Promise(resolve => {
      const startTime = Date.now();
      const checkElements = () => {
        const allExist = elementIds.every(id => {
          const element = document.getElementById(id);
          return element !== null;
        });

        if (allExist) {
          resolve(true);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(checkElements, 50);
        } else {
          console.warn(`⚠️ Timeout esperando elementos: ${elementIds.join(', ')}`);
          resolve(false);
        }
      };
      checkElements();
    });
  }

  /**
   * Inicializa el campo proveedorFactura en el modal
   */
  async function inicializarProveedorFactura() {
    const campo = {
      inputId: 'proveedorFactura',
      selectId: 'select-proveedorFactura',
      btnClearId: 'btn-clear-proveedorFactura',
      hiddenInputId: 'proveedorFactura_value'
    };

    // Esperar a que los elementos existan
    const elementosExisten = await waitForElements([
      campo.inputId,
      campo.selectId,
      campo.btnClearId,
      campo.hiddenInputId
    ]);

    if (!elementosExisten) {
      console.error(`❌ No se encontraron todos los elementos necesarios para ${campo.inputId}`);
      return null;
    }

    return inicializarProveedor(
      campo.inputId,
      campo.selectId,
      campo.btnClearId,
      campo.hiddenInputId
    );
  }

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async () => {
    await waitForDependencies();

    // Inicializar cuando el modal de nueva factura esté completamente mostrado
    const modalNuevaFactura = document.getElementById('modalNuevaFactura');
    if (modalNuevaFactura) {
      modalNuevaFactura.addEventListener('shown.bs.modal', async () => {
        // Usar requestAnimationFrame para asegurar que el DOM esté completamente renderizado
        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              await inicializarProveedorFactura();
            } catch (error) {
              console.error('❌ Error inicializando componente de proveedor en modal:', error);
            }
          }, 100);
        });
      });
    }

    // También intentar inicializar si el elemento ya existe (por si el modal ya está visible)
    setTimeout(async () => {
      try {
        const input = document.getElementById('proveedorFactura');
        if (input && input.offsetParent !== null) {
          // El elemento es visible
          await inicializarProveedorFactura();
        }
      } catch (error) {
        console.error('❌ Error en inicialización inicial de proveedor:', error);
      }
    }, 1000);
  });

  // Exponer función para refrescar datos si es necesario
  window.refreshSearchableSelectProveedoresCXP = async function (inputId = 'proveedorFactura') {
    console.log(`🔄 Refrescando datos de proveedores para ${inputId}...`);
    const nuevosDatos = await obtenerDatosProveedores();
    if (instanciasProveedores[inputId] && instanciasProveedores[inputId].actualizarDatos) {
      instanciasProveedores[inputId].actualizarDatos(nuevosDatos);
      console.log(`✅ Datos actualizados: ${nuevosDatos.length} proveedores`);
    } else {
      // Si no hay instancia, intentar inicializar
      await inicializarProveedorFactura();
    }
  };

  console.log('✅ Script searchable-select-proveedores.js (CXP) cargado');
})();
