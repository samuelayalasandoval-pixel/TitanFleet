// Sistema de Cuentas por Cobrar
console.log('📄 Script cxc.js cargado');

// Declarar variables globales al inicio
let facturasData = [];
let facturasFiltradas = [];

async function inicializarCXC() {
  console.log('🚀 Inicializando sistema de CXC...');

  // Inicializar arrays primero
  facturasData = [];
  facturasFiltradas = [];

  // Esperar a que los repositorios de Firebase estén listos
  let attempts = 0;
  const maxAttempts = 20;
  while (attempts < maxAttempts && (!window.firebaseRepos || !window.firebaseRepos.facturacion)) {
    attempts++;
    console.log(`⏳ Esperando repositorio de facturación... (${attempts}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (window.firebaseRepos && window.firebaseRepos.facturacion) {
    console.log('✅ Repositorio de facturación disponible');
  } else {
    console.warn('⚠️ Repositorio de facturación no disponible después de esperar');
  }

  // También verificar repositorio CXC (para pagos)
  if (window.firebaseRepos && window.firebaseRepos.cxc) {
    console.log('✅ Repositorio CXC disponible (para pagos)');
  } else {
    console.warn('⚠️ Repositorio CXC no disponible (los pagos no se guardarán)');
  }

  // Cargar facturas desde Firebase primero, luego localStorage
  await loadFacturasFromStorage();

  // NO sincronizar automáticamente desde localStorage a Firebase
  // Esto evita que se restauren datos después de una limpieza
  // Si se necesita sincronizar, debe hacerse manualmente
  // La sincronización automática puede causar que datos eliminados se restauren
  const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
  if (datosLimpios === 'true') {
    console.log(
      '⚠️ Datos operativos fueron limpiados. No se sincronizará desde localStorage para evitar restauración.'
    );
    // Limpiar el flag después de un tiempo
    setTimeout(() => {
      localStorage.removeItem('datos_operativos_limpiados');
    }, 60000); // 1 minuto
  }

  // Actualizar facturas existentes para incluir serie y folio
  updateExistingInvoices();

  // NO cargar datos de ejemplo automáticamente
  // Las facturas deben venir de la colección de facturación
  if (facturasData.length === 0) {
    console.log(
      '📋 No hay facturas cargadas. Las facturas se cargarán desde la colección de facturación cuando estén disponibles.'
    );
    console.log(
      '💡 Si acabas de crear una factura, recarga la página de CXC o espera a que el listener detecte el cambio.'
    );
  } else {
    console.log(`✅ ${facturasData.length} facturas cargadas desde facturación`);
  }

  // Cargar facturas al iniciar
  loadFacturas();

  // Actualizar resumen
  updateCXCSummary();

  // Configurar filtros automáticos
  configurarFiltrosAutomaticos();

  // Suscribirse a cambios en tiempo real de Firebase (desde facturación)
  async function configurarListenerCXC() {
    try {
      // Esperar a que el repositorio de facturación esté completamente inicializado
      let attempts = 0;
      while (
        attempts < 20 &&
        (!window.firebaseRepos ||
          !window.firebaseRepos.facturacion ||
          !window.firebaseRepos.facturacion.db ||
          !window.firebaseRepos.facturacion.tenantId)
      ) {
        attempts++;
        console.log(`⏳ Esperando repositorio de facturación para listener... (${attempts}/20)`);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Intentar inicializar si no está inicializado
        if (window.firebaseRepos?.facturacion && !window.firebaseRepos.facturacion.db) {
          await window.firebaseRepos.facturacion.init();
        }
      }

      if (!window.firebaseRepos || !window.firebaseRepos.facturacion) {
        console.warn('⚠️ Repositorio de facturación no disponible para listener');
        return;
      }

      if (!window.firebaseRepos.facturacion.db || !window.firebaseRepos.facturacion.tenantId) {
        console.warn('⚠️ Repositorio de facturación no inicializado completamente:', {
          tieneDb: Boolean(window.firebaseRepos.facturacion.db),
          tieneTenantId: Boolean(window.firebaseRepos.facturacion.tenantId)
        });

        // Reintentar después de más tiempo
        setTimeout(() => configurarListenerCXC(), 5000);
        return;
      }

      console.log('📡 Suscribiéndose a cambios en tiempo real de facturación...', {
        tenantId: window.firebaseRepos.facturacion.tenantId,
        tieneDb: Boolean(window.firebaseRepos.facturacion.db)
      });

      // Guardar estado inicial para comparar después
      let primeraActualizacion = true;
      let _datosCargadosInicialmente = facturasData.length > 0;
      let guardandoDatos = false; // Flag para evitar que el listener sobrescriba durante el guardado

      const unsubscribe = await window.firebaseRepos.facturacion.subscribe(async registros => {
        // Si estamos guardando datos, no actualizar desde el listener para evitar conflictos
        if (guardandoDatos || window._cxcGuardandoDatosFlag) {
          console.log('⏸️ Listener CXC pausado: guardando datos localmente (flag activo)');
          return;
        }

        // Verificar si la página está a punto de recargarse (evitar renderizado antes de recarga)
        if (document.readyState === 'loading' || document.readyState === 'uninitialized') {
          console.log('⏸️ Listener CXC pausado: página en proceso de carga');
          return;
        }

        console.log(
          '📡 Actualización en tiempo real de facturación: registros recibidos:',
          registros.length
        );

        // Filtrar solo registros (tipo === 'registro')
        const registrosFacturacion = registros.filter(r => r.tipo === 'registro' || !r.tipo);

        console.log('📋 Registros de facturación filtrados:', registrosFacturacion.length);
        console.log(
          '📋 IDs de registros filtrados:',
          registrosFacturacion.map(r => r.numeroRegistro || r.id)
        );

        // Si es la primera actualización y recibimos datos vacíos, pero ya tenemos datos cargados,
        // verificar si Firebase realmente está vacío o es un error de sincronización
        try {
          if (primeraActualizacion && registrosFacturacion.length === 0) {
            const tieneDatosExistentes = facturasData.length > 0;
            if (tieneDatosExistentes) {
              // Verificar en Firebase si realmente está vacío
              try {
                const repoFacturacion = window.firebaseRepos.facturacion;
                if (repoFacturacion && repoFacturacion.db && repoFacturacion.tenantId) {
                  const todosLosRegistros = await repoFacturacion.getAllRegistros();
                  if (todosLosRegistros && todosLosRegistros.length > 0) {
                    console.warn(
                      '⚠️ Listener CXC devolvió datos vacíos pero Firebase tiene datos. Ignorando actualización vacía.'
                    );
                    primeraActualizacion = false;
                    return;
                  }
                }
              } catch (error) {
                console.warn('⚠️ Error verificando Firebase CXC:', error);
              }
            } else {
              console.log('✅ Firebase confirmado vacío. Continuando con actualización.');
            }
          }
        } catch (error) {
          console.warn(
            '⚠️ Error verificando Firebase, ignorando actualización vacía por seguridad:',
            error
          );
          primeraActualizacion = false;
          return;
        }

        primeraActualizacion = false;

        // Transformar registros de facturación al formato CXC
        const limpiarMoneda = valor => {
          if (!valor) {
            return 0;
          }
          if (typeof valor === 'number') {
            return valor;
          }
          if (typeof valor === 'string') {
            const limpio = valor.replace(/[$,]/g, '').trim();
            const numero = parseFloat(limpio);
            return isNaN(numero) ? 0 : numero;
          }
          return 0;
        };

        const calcularFechaVencimiento = (fechaFactura, diasCredito = 30) => {
          if (!fechaFactura) {
            return null;
          }
          const fecha = new Date(fechaFactura);
          fecha.setDate(fecha.getDate() + diasCredito);
          return fecha.toISOString().split('T')[0];
        };

        // Obtener facturas con pagos desde CXC para combinar
        let facturasConPagos = [];
        if (window.firebaseRepos?.cxc?.db && window.firebaseRepos?.cxc?.tenantId) {
          try {
            facturasConPagos = await window.firebaseRepos.cxc.getAllFacturas();
          } catch (e) {
            console.warn('⚠️ Error obteniendo facturas con pagos:', e);
          }
        }

        // Crear un mapa de facturas con pagos por registroId
        const pagosMap = new Map();
        facturasConPagos.forEach(f => {
          if (f.registroId) {
            pagosMap.set(f.registroId, {
              montoPagado: parseFloat(f.montoPagado) || 0,
              montoPendiente:
                parseFloat(f.montoPendiente) ||
                (parseFloat(f.monto) || 0) - (parseFloat(f.montoPagado) || 0),
              estado: f.estado || 'pendiente',
              pagos: f.pagos || []
            });
          }
        });

        primeraActualizacion = false;
        _datosCargadosInicialmente = false;

        // Obtener facturas existentes en CXC para verificar cuáles faltan
        const facturasExistentesEnCXC = new Set();
        if (window.firebaseRepos?.cxc?.db && window.firebaseRepos?.cxc?.tenantId) {
          try {
            const facturasCXC = await window.firebaseRepos.cxc.getAllFacturas();
            facturasCXC.forEach(f => {
              if (f.registroId) {
                facturasExistentesEnCXC.add(f.registroId);
              }
            });
            console.log('📋 Facturas existentes en CXC:', facturasExistentesEnCXC.size);
          } catch (e) {
            console.warn('⚠️ Error obteniendo facturas existentes en CXC:', e);
          }
        }

        // Transformar registros de facturación a formato CXC
        facturasData = await Promise.all(
          registrosFacturacion.map(async registro => {
            const registroId = registro.numeroRegistro || registro.id;
            const montoTotal = limpiarMoneda(registro['total factura'] || registro.total || 0);
            const serie = registro.serie || '';
            const folio = registro.folio || '';
            const numeroFactura =
              serie && folio ? `${serie}-${folio}` : registro.numeroFactura || `FAC-${registroId}`;

            // Obtener información de pagos si existe
            const infoPagos = pagosMap.get(registroId);
            const montoPagado = infoPagos ? infoPagos.montoPagado : 0;
            const montoPendiente = infoPagos ? infoPagos.montoPendiente : montoTotal;
            const estado = infoPagos ? infoPagos.estado : 'pendiente';
            const pagos = infoPagos ? infoPagos.pagos : [];

            // Verificar si la factura no existe en CXC y guardarla automáticamente
            const existeEnCXC = facturasExistentesEnCXC.has(registroId);
            if (
              !existeEnCXC &&
              window.firebaseRepos?.cxc?.db &&
              window.firebaseRepos?.cxc?.tenantId
            ) {
              console.log(`🔄 Sincronizando factura ${registroId} desde facturación a CXC...`);
            }

            // Obtener días de crédito usando sistema de caché
            let diasCredito = 30;
            try {
              const clienteRFC = registro.Cliente || registro.cliente;
              if (clienteRFC) {
                const clientes = await window.getDataWithCache('clientes', async () => {
                  if (
                    window.configuracionManager &&
                    typeof window.configuracionManager.getAllClientes === 'function'
                  ) {
                    return window.configuracionManager.getAllClientes() || [];
                  }
                  return [];
                });

                const clienteData = clientes.find(c => c.rfc === clienteRFC || c.id === clienteRFC);
                if (clienteData && clienteData.diasCredito) {
                  diasCredito = clienteData.diasCredito;
                }
              }
            } catch (e) {
              // Ignorar error
            }

            const fechaFactura =
              registro.fechaFactura ||
              registro.fecha ||
              registro.fechaCreacion ||
              new Date().toISOString().split('T')[0];
            const fechaVencimiento = calcularFechaVencimiento(fechaFactura, diasCredito);

            return {
              id: registroId,
              numeroFactura: numeroFactura,
              serie: serie,
              folio: folio,
              folioFiscal: registro.folioFiscal || registro['Folio Fiscal'] || '',
              fechaFactura: fechaFactura,
              fechaEmision:
                registro.fechaCreacion || fechaFactura || new Date().toISOString().split('T')[0],
              fechaVencimiento: fechaVencimiento,
              cliente: registro.Cliente || registro.cliente || 'N/A',
              monto: montoTotal,
              saldo: montoTotal,
              montoPagado: montoPagado,
              montoPendiente: montoPendiente,
              estado: estado,
              diasCredito: diasCredito,
              tipo: 'factura',
              origen: 'facturacion',
              registroId: registroId,
              subtotal: limpiarMoneda(registro.Subtotal || 0),
              iva: limpiarMoneda(registro.iva || 0),
              ivaRetenido: limpiarMoneda(registro['iva retenido'] || 0),
              isrRetenido: limpiarMoneda(registro['isr retenido'] || 0),
              otrosMontos: limpiarMoneda(registro['Otros Montos'] || 0),
              tipoMoneda: registro.tipoMoneda || registro.moneda || 'MXN',
              tipoCambio: registro.tipoCambio || '',
              fechaCreacion: registro.fechaCreacion || new Date().toISOString(),
              ultimaActualizacion:
                registro.fechaActualizacion ||
                registro.ultimaActualizacion ||
                new Date().toISOString(),
              pagos: pagos,
              diasVencidos: calcularDiasVencidos(fechaVencimiento, estado)
            };
          })
        );

        // Obtener datos previos para detectar cambios
        const facturasPrevias = facturasData.length;

        // Verificar si estamos guardando datos antes de actualizar (PERO permitir sincronización)
        const estaGuardando = guardandoDatos || window._cxcGuardandoDatosFlag;
        if (estaGuardando) {
          console.log('⏸️ Listener CXC pausado antes de actualizar: guardando datos (flag activo)');
          // NO retornar aquí si hay facturas nuevas que sincronizar
          const hayFacturasNuevas = facturasData.some(
            f => !facturasExistentesEnCXC.has(f.registroId)
          );
          if (!hayFacturasNuevas) {
            return;
          }
          console.log('⚠️ Hay facturas nuevas pero flag activo, continuando con sincronización...');
        }

        // Guardar facturas nuevas que no existen en CXC
        if (window.firebaseRepos?.cxc?.db && window.firebaseRepos?.cxc?.tenantId) {
          const facturasAGuardar = facturasData.filter(f => {
            const registroId = f.registroId || f.id;
            return !facturasExistentesEnCXC.has(registroId);
          });

          if (facturasAGuardar.length > 0) {
            console.log(
              `💾 Guardando ${facturasAGuardar.length} factura(s) nueva(s) en Firebase CXC...`
            );
            console.log(
              '📋 IDs de facturas a guardar:',
              facturasAGuardar.map(f => f.registroId || f.id)
            );

            try {
              // Activar flag para evitar interferencia del listener
              const flagActivado = !estaGuardando;
              if (flagActivado && window._cxcGuardandoDatos) {
                window._cxcGuardandoDatos();
              }

              await Promise.all(
                facturasAGuardar.map(async factura => {
                  const facturaId = factura.registroId || factura.id;
                  try {
                    console.log(`💾 Guardando factura ${facturaId}...`, {
                      numeroFactura: factura.numeroFactura,
                      cliente: factura.cliente,
                      monto: factura.monto
                    });
                    await window.firebaseRepos.cxc.saveFactura(facturaId, factura);
                    console.log(`✅ Factura ${facturaId} guardada en Firebase CXC`);
                  } catch (error) {
                    console.error(`❌ Error guardando factura ${facturaId} en CXC:`, error);
                    console.error('Stack:', error.stack);
                  }
                })
              );

              // Desactivar flag solo si lo activamos nosotros
              if (flagActivado && window._cxcDatosGuardados) {
                window._cxcDatosGuardados();
              }

              console.log(`✅ ${facturasAGuardar.length} factura(s) sincronizada(s) correctamente`);

              // Recargar facturas desde CXC para incluir las nuevas
              try {
                const facturasActualizadas = await window.firebaseRepos.cxc.getAllFacturas();
                console.log(
                  `📋 Facturas en CXC después de sincronización: ${facturasActualizadas.length}`
                );
              } catch (e) {
                console.warn('⚠️ Error recargando facturas después de sincronización:', e);
              }
            } catch (error) {
              console.error('❌ Error sincronizando facturas a CXC:', error);
              console.error('Stack:', error.stack);
              if (flagActivado && window._cxcDatosGuardados) {
                window._cxcDatosGuardados();
              }
            }
          } else {
            console.log('✅ Todas las facturas ya están sincronizadas en CXC');
          }
        }

        // Ordenar facturas por número (del más reciente al más antiguo)
        facturasData = ordenarFacturasPorNumero(facturasData);

        // Actualizar facturasFiltradas
        facturasFiltradas = [...facturasData];
        window.facturasFiltradas = facturasFiltradas;

        // NO USAR localStorage - Solo Firebase es la fuente de verdad
        // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

        // Log para debugging
        if (facturasPrevias !== facturasData.length) {
          const diferencia = facturasData.length - facturasPrevias;
          if (diferencia > 0) {
            console.log(`➕ ${diferencia} factura(s) agregada(s) desde Firebase`);
          } else {
            console.log(`🗑️ ${Math.abs(diferencia)} factura(s) eliminada(s) desde Firebase`);
          }
        }

        // Verificar una vez más antes de renderizar
        if (guardandoDatos || window._cxcGuardandoDatosFlag) {
          console.log('⏸️ Listener CXC pausado antes de renderizar: guardando datos (flag activo)');
          return;
        }

        // Recargar la tabla y actualizar resumen
        loadFacturas();
        updateCXCSummary();

        console.log(`✅ Facturas CXC actualizadas automáticamente: ${facturasData.length}`);
      });

      // Exponer flag para que las funciones de guardado puedan usarlo
      window._cxcGuardandoDatos = () => {
        guardandoDatos = true;
        window._cxcGuardandoDatosFlag = true; // Marca global para verificación rápida
        console.log('🔒 Activando flag de guardado CXC para evitar interferencia del listener');
      };
      window._cxcDatosGuardados = () => {
        guardandoDatos = false;
        window._cxcGuardandoDatosFlag = false;
        console.log('🔓 Desactivando flag de guardado CXC');
      };

      // Guardar función de desuscripción para limpiar cuando sea necesario
      if (unsubscribe && typeof unsubscribe === 'function') {
        window.__cxcUnsubscribeFacturacion = unsubscribe;
        console.log(
          '✅ Suscripción a cambios en tiempo real de facturación configurada correctamente'
        );
      } else {
        console.warn('⚠️ La función de desuscripción no está disponible');
      }

      // Configurar listener adicional para cambios en la colección CXC directamente (pagos)
      await configurarListenerCXC_Pagos();
    } catch (error) {
      console.error('❌ Error configurando suscripción en tiempo real CXC:', error);
      // Reintentar después de un tiempo
      setTimeout(() => configurarListenerCXC(), 5000);
    }
  }

  // Listener adicional para cambios en la colección CXC directamente (pagos)
  async function configurarListenerCXC_Pagos() {
    try {
      // Esperar a que el repositorio CXC esté completamente inicializado
      let attempts = 0;
      while (
        attempts < 20 &&
        (!window.firebaseRepos ||
          !window.firebaseRepos.cxc ||
          !window.firebaseRepos.cxc.db ||
          !window.firebaseRepos.cxc.tenantId)
      ) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));

        // Intentar inicializar si no está inicializado
        if (window.firebaseRepos?.cxc && !window.firebaseRepos.cxc.db) {
          await window.firebaseRepos.cxc.init();
        }
      }

      if (!window.firebaseRepos || !window.firebaseRepos.cxc) {
        console.warn('⚠️ Repositorio CXC no disponible para listener de pagos');
        return;
      }

      if (!window.firebaseRepos.cxc.db || !window.firebaseRepos.cxc.tenantId) {
        console.warn('⚠️ Repositorio CXC no inicializado completamente para listener de pagos');
        setTimeout(() => configurarListenerCXC_Pagos(), 5000);
        return;
      }

      console.log('📡 Suscribiéndose a cambios en tiempo real de CXC (pagos)...', {
        tenantId: window.firebaseRepos.cxc.tenantId,
        tieneDb: Boolean(window.firebaseRepos.cxc.db)
      });

      const unsubscribePagos = await window.firebaseRepos.cxc.subscribe(async facturasCXC => {
        // Si estamos guardando datos, no actualizar desde el listener
        if (window._cxcGuardandoDatosFlag) {
          console.log('⏸️ Listener CXC pagos pausado: guardando datos');
          return;
        }

        if (document.readyState === 'loading' || document.readyState === 'uninitialized') {
          return;
        }

        console.log(
          '📡 Actualización en tiempo real de CXC (pagos):',
          facturasCXC.length,
          'facturas con pagos'
        );

        // Filtrar solo facturas (tipo === 'factura')
        const facturasConPagos = facturasCXC.filter(f => f.tipo === 'factura' || !f.tipo);

        if (facturasConPagos.length === 0) {
          return;
        }

        // Crear mapa de pagos por registroId
        const pagosMap = new Map();
        facturasConPagos.forEach(f => {
          if (f.registroId) {
            pagosMap.set(f.registroId, {
              montoPagado: parseFloat(f.montoPagado) || 0,
              montoPendiente:
                parseFloat(f.montoPendiente) ||
                (parseFloat(f.monto) || 0) - (parseFloat(f.montoPagado) || 0),
              estado: f.estado || 'pendiente',
              pagos: f.pagos || []
            });
          }
        });

        // Actualizar facturas existentes con información de pagos
        let facturasActualizadas = false;
        facturasData.forEach((factura, index) => {
          const infoPagos = pagosMap.get(factura.registroId || factura.id);
          if (infoPagos) {
            facturasData[index] = {
              ...factura,
              montoPagado: infoPagos.montoPagado,
              montoPendiente: infoPagos.montoPendiente,
              estado: infoPagos.estado,
              pagos: infoPagos.pagos,
              diasVencidos: calcularDiasVencidos(factura.fechaVencimiento, infoPagos.estado)
            };
            facturasActualizadas = true;
          }
        });

        if (facturasActualizadas) {
          // Actualizar facturasFiltradas
          facturasFiltradas = [...facturasData];
          window.facturasFiltradas = facturasFiltradas;

          // Verificar una vez más antes de renderizar
          if (!window._cxcGuardandoDatosFlag) {
            loadFacturas();
            updateCXCSummary();
            console.log('✅ Facturas CXC actualizadas con información de pagos');
          }
        }
      });

      if (unsubscribePagos && typeof unsubscribePagos === 'function') {
        window.__cxcUnsubscribePagos = unsubscribePagos;
        console.log(
          '✅ Suscripción a cambios en tiempo real de CXC (pagos) configurada correctamente'
        );
      }
    } catch (error) {
      console.error('❌ Error configurando suscripción de pagos CXC:', error);
      setTimeout(() => configurarListenerCXC_Pagos(), 5000);
    }
  }

  // Configurar listener después de un breve delay para asegurar que todo esté listo
  setTimeout(() => {
    configurarListenerCXC();
  }, 2000);

  // También intentar configurar inmediatamente si el repositorio de facturación ya está listo
  if (
    window.firebaseRepos &&
    window.firebaseRepos.facturacion &&
    window.firebaseRepos.facturacion.db &&
    window.firebaseRepos.facturacion.tenantId
  ) {
    configurarListenerCXC();
  }

  console.log('✅ Sistema de CXC inicializado correctamente');
  console.log(`📊 Total de facturas cargadas: ${facturasData.length}`);
}

// Ejecutar inicialización cuando el DOM esté listo o inmediatamente si ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarCXC);
} else {
  // DOM ya está listo, ejecutar inmediatamente
  inicializarCXC();
}

// Nota: facturasData y facturasFiltradas ya están declaradas al inicio del archivo

// Función para ordenar facturas por número (del más reciente al más antiguo: F-537, F-536, F-535, etc.)
function ordenarFacturasPorNumero(facturas) {
  if (!facturas || facturas.length === 0) {
    return facturas;
  }

  return [...facturas].sort((a, b) => {
    // Extraer número de factura de ambos
    const numeroA = extraerNumeroFactura(a.numeroFactura || a.folio || a.id || '');
    const numeroB = extraerNumeroFactura(b.numeroFactura || b.folio || b.id || '');

    // Ordenar descendente (mayor a menor): F-537 antes que F-536
    return numeroB - numeroA;
  });
}

// Función auxiliar para extraer el número numérico de un número de factura
// Ejemplos: "F-537" -> 537, "FAC-2025-001" -> 1, "A-000123" -> 123
function extraerNumeroFactura(numeroFactura) {
  if (!numeroFactura) {
    return 0;
  }

  const str = String(numeroFactura);

  // Buscar el último número en el string (para manejar formatos como F-537, FAC-2025-001, etc.)
  const matches = str.match(/\d+/g);
  if (matches && matches.length > 0) {
    // Tomar el último número encontrado (para formatos como FAC-2025-001)
    const ultimoNumero = parseInt(matches[matches.length - 1], 10);
    return isNaN(ultimoNumero) ? 0 : ultimoNumero;
  }

  // Si no hay números, intentar convertir todo el string
  const numero = parseInt(str.replace(/\D/g, ''), 10);
  return isNaN(numero) ? 0 : numero;
}

// Función para generar numeroFactura a partir de serie y folio
function generarNumeroFactura(serie, folio) {
  if (!serie || !folio) {
    return '';
  }
  // Formato: Serie-Folio (ej: F-537, A-000123)
  return `${serie}-${folio}`;
}

// Función para actualizar facturas existentes con serie y folio
function updateExistingInvoices() {
  console.log('🔄 Actualizando facturas existentes...');

  let facturasActualizadas = 0;

  facturasData.forEach(factura => {
    let serieActualizada = false;
    let folioActualizado = false;

    // Solo actualizar facturas que realmente no tengan serie y folio
    // Verificar si los campos existen y están vacíos o son undefined
    const tieneSerie = factura.serie && factura.serie.trim() !== '';
    const tieneFolio = factura.folio && factura.folio.trim() !== '';

    if (!tieneSerie || !tieneFolio) {
      // Extraer serie y folio del número de factura existente
      const numeroFactura = factura.numeroFactura || '';

      if (numeroFactura.includes('FAC-')) {
        // Para facturas con formato FAC-2025-001, extraer solo el folio (último número)
        const partes = numeroFactura.split('-');
        if (partes.length >= 3) {
          factura.serie = 'F'; // Cambiar a 'F' en lugar de 'A'
          factura.folio = partes[2].padStart(6, '0');
          serieActualizada = true;
          folioActualizado = true;
          facturasActualizadas++;
          console.log(
            `✅ Actualizada factura ${numeroFactura} -> Serie: F, Folio: ${factura.folio}`
          );
        }
      } else if (numeroFactura.includes('-')) {
        // Para otros formatos con guión, usar la primera parte como serie
        const partes = numeroFactura.split('-');
        factura.serie = partes[0] || 'F';
        factura.folio = partes[1] || '000001';
        serieActualizada = true;
        folioActualizado = true;
        facturasActualizadas++;
        console.log(
          `✅ Actualizada factura ${numeroFactura} -> Serie: ${factura.serie}, Folio: ${factura.folio}`
        );
      } else {
        // Para números simples, usar serie F y el número como folio
        factura.serie = 'F';
        factura.folio = numeroFactura.padStart(6, '0');
        serieActualizada = true;
        folioActualizado = true;
        facturasActualizadas++;
        console.log(`✅ Actualizada factura ${numeroFactura} -> Serie: F, Folio: ${factura.folio}`);
      }
    }

    // SIEMPRE actualizar numeroFactura como la unión de serie y folio
    if (tieneSerie && tieneFolio) {
      // Ya tiene serie y folio, solo actualizar numeroFactura
      const nuevoNumeroFactura = generarNumeroFactura(factura.serie, factura.folio);
      if (factura.numeroFactura !== nuevoNumeroFactura) {
        console.log(
          `🔄 Actualizando numeroFactura: "${factura.numeroFactura}" -> "${nuevoNumeroFactura}"`
        );
        factura.numeroFactura = nuevoNumeroFactura;
        facturasActualizadas++;
      }
    } else if (serieActualizada || folioActualizado) {
      // Se actualizaron serie o folio, generar numeroFactura
      factura.numeroFactura = generarNumeroFactura(factura.serie, factura.folio);
      console.log(`✅ Generado numeroFactura: ${factura.numeroFactura}`);
    }

    // Inicializar campos de pagos parciales si no existen
    if (factura.montoPagado === undefined) {
      factura.montoPagado = 0.0;
      facturasActualizadas++;
    }
    if (factura.montoPendiente === undefined) {
      factura.montoPendiente = factura.monto || 0.0;
      facturasActualizadas++;
    }
    if (!factura.pagos) {
      factura.pagos = [];
      facturasActualizadas++;
    }

    // Si la factura está marcada como pagada pero no tiene montoPagado, inicializarlo
    if ((factura.estado === 'pagado' || factura.estado === 'pagada') && factura.montoPagado === 0) {
      factura.montoPagado = factura.monto || 0.0;
      factura.montoPendiente = 0.0;
      facturasActualizadas++;
    }
  });

  if (facturasActualizadas > 0) {
    // Guardar las facturas actualizadas
    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores
    console.log(
      `✅ ${facturasActualizadas} facturas actualizadas con serie, folio, numeroFactura y campos de pagos parciales`
    );
  } else {
    console.log(
      '✅ Todas las facturas ya tienen serie, folio, numeroFactura y campos de pagos parciales'
    );
  }
}

// Inicializar datos de ejemplo
function initializeCXCData() {
  // Inicializar con array vacío - sin datos de ejemplo
  facturasData = [];
  facturasFiltradas = [];

  console.log('📋 CXC inicializado sin datos de ejemplo');
}

// Función para limpiar todos los datos de CXC
function clearCXCData() {
  if (
    confirm(
      '¿Está seguro de eliminar todos los registros de Cuentas por Cobrar? Esta acción no se puede deshacer.'
    )
  ) {
    facturasData = [];
    facturasFiltradas = [];
    localStorage.removeItem('erp_cxc_facturas');
    localStorage.setItem('cxc_cleared', 'true');

    loadFacturas();
    updateCXCSummary();

    console.log('🗑️ Todos los datos de CXC han sido eliminados');
    alert('Todos los registros de Cuentas por Cobrar han sido eliminados exitosamente.');
  }
}

// Exponer función globalmente
window.clearCXCData = clearCXCData;

// Variable para almacenar el ID de la factura que se está editando
let facturaEditandoId = null;

// Función auxiliar para convertir fecha a formato YYYY-MM-DD para inputs type="date"
function convertirFechaParaInput(fechaString) {
  if (!fechaString) {
    return '';
  }

  try {
    let date = null;

    // Si ya está en formato YYYY-MM-DD, retornarlo directamente
    if (typeof fechaString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaString)) {
      // Extraer solo la parte de la fecha (antes de T si existe)
      return fechaString.split('T')[0];
    }

    // Si es string en formato DD/MM/YYYY, parsearlo correctamente
    if (typeof fechaString === 'string' && fechaString.includes('/')) {
      const partes = fechaString.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const año = parseInt(partes[2], 10);
        date = new Date(año, mes, dia);
      } else {
        date = new Date(fechaString);
      }
    } else {
      date = new Date(fechaString);
    }

    // Validar que la fecha sea válida
    if (!date || isNaN(date.getTime())) {
      console.warn('⚠️ Fecha inválida para convertir:', fechaString);
      return '';
    }

    // Formatear en YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('⚠️ Error convirtiendo fecha:', fechaString, error);
    return '';
  }
}

// Función para editar una factura
function editarFactura(facturaId) {
  console.log('📝 Editando factura:', facturaId);

  // Buscar la factura en el array
  const factura = facturasData.find(f => f.id === facturaId);
  if (!factura) {
    console.error('❌ Factura no encontrada:', facturaId);
    if (typeof window.showNotification === 'function') {
      window.showNotification('Error: Factura no encontrada', 'error');
    } else {
      alert('Error: Factura no encontrada');
    }
    return;
  }

  console.log('📋 Datos de la factura encontrada:', factura);

  // Verificar si la factura tiene un pago registrado
  const tienePago =
    factura.estado === 'pagado' ||
    factura.estado === 'pagada' ||
    (factura.montoPagado && factura.montoPagado > 0) ||
    factura.fechaPago;

  // Guardar el ID de la factura que se está editando
  facturaEditandoId = facturaId;

  // Mostrar/ocultar elementos según si tiene pago
  const mensajeSinPago = document.getElementById('mensajeSinPago');
  const formEditar = document.getElementById('formEditarFactura');
  const btnGuardar = document.getElementById('btnGuardarEdicion');

  if (!tienePago) {
    // No hay pago, mostrar mensaje y ocultar formulario
    mensajeSinPago.style.display = 'block';
    formEditar.style.display = 'none';
    btnGuardar.style.display = 'none';
  } else {
    // Hay pago, mostrar formulario y ocultar mensaje
    mensajeSinPago.style.display = 'none';
    formEditar.style.display = 'block';
    btnGuardar.style.display = 'block';

    // Obtener datos del pago: primero del nivel superior, si no del array pagos
    let datosPago = {};

    // Intentar obtener del nivel superior de la factura
    if (factura.fechaPago || factura.metodoPago) {
      datosPago = {
        fecha: factura.fechaPago,
        metodo: factura.metodoPago,
        bancoOrigen: factura.bancoOrigenPago,
        cuenta: factura.cuentaPago,
        bancoDestino: factura.bancoDestinoPago,
        cuentaDestino: factura.cuentaDestinoPago,
        referencia: factura.referenciaPago,
        observaciones: factura.observacionesPago
      };
    }

    // Si no hay datos en el nivel superior, obtener del último pago del array
    if (!datosPago.fecha && !datosPago.metodo && factura.pagos && factura.pagos.length > 0) {
      // Obtener el último pago (más reciente)
      const { pagos } = factura;
      const ultimoPago = pagos[pagos.length - 1];

      datosPago = {
        fecha: ultimoPago.fecha,
        metodo: ultimoPago.metodo,
        bancoOrigen: ultimoPago.bancoOrigen,
        cuenta: ultimoPago.cuenta || ultimoPago.cuentaPago,
        bancoDestino: ultimoPago.bancoDestino,
        cuentaDestino: ultimoPago.cuentaDestino,
        referencia: ultimoPago.referencia,
        observaciones: ultimoPago.observaciones
      };

      console.log('📋 Datos obtenidos del array pagos:', datosPago);
    }

    // Llenar el formulario con los datos del pago
    const numeroFactura =
      factura.serie && factura.folio
        ? `${factura.serie}-${factura.folio}`
        : factura.numeroFactura || 'N/A';

    // Llenar campos básicos
    const editarFacturaNumero = document.getElementById('editarFacturaNumero');
    const editarClientePago = document.getElementById('editarClientePago');
    const editarMontoPagado = document.getElementById('editarMontoPagado');
    const editarFechaPago = document.getElementById('editarFechaPago');
    const editarMetodoPago = document.getElementById('editarMetodoPago');
    const editarReferenciaPago = document.getElementById('editarReferenciaPago');
    const editarObservacionesPago = document.getElementById('editarObservacionesPago');

    if (editarFacturaNumero) {
      editarFacturaNumero.value = numeroFactura;
    }
    if (editarClientePago) {
      editarClientePago.value = factura.cliente || '';
    }
    if (editarMontoPagado) {
      editarMontoPagado.value = factura.montoPagado || 0;
    }

    // Convertir fecha al formato correcto para el input type="date"
    const fechaPagoFormateada = convertirFechaParaInput(datosPago.fecha);
    if (editarFechaPago) {
      editarFechaPago.value = fechaPagoFormateada;
    }

    if (editarMetodoPago) {
      editarMetodoPago.value = datosPago.metodo || '';
    }
    if (editarReferenciaPago) {
      editarReferenciaPago.value = datosPago.referencia || '';
    }
    if (editarObservacionesPago) {
      editarObservacionesPago.value = datosPago.observaciones || '';
    }

    console.log('✅ Campos básicos llenados:', {
      numeroFactura,
      cliente: factura.cliente,
      montoPagado: factura.montoPagado,
      fechaPago: fechaPagoFormateada,
      metodoPago: datosPago.metodo,
      referencia: datosPago.referencia
    });

    // Cargar bancos y cuentas
    cargarBancosParaEditar();

    // Establecer valores de bancos y cuentas si existen
    setTimeout(() => {
      const editarBancoOrigen = document.getElementById('editarBancoOrigen');
      const editarCuentaOrigen = document.getElementById('editarCuentaOrigen');
      const editarBancoDestino = document.getElementById('editarBancoDestino');
      const editarCuentaDestino = document.getElementById('editarCuentaDestino');

      if (datosPago.bancoOrigen && editarBancoOrigen) {
        editarBancoOrigen.value = datosPago.bancoOrigen;
        actualizarCuentasOrigenEditarCXC();
        if (datosPago.cuenta && editarCuentaOrigen) {
          setTimeout(() => {
            editarCuentaOrigen.value = datosPago.cuenta;
            console.log('✅ Cuenta origen establecida:', datosPago.cuenta);
          }, 200);
        }
      }
      if (datosPago.bancoDestino && editarBancoDestino) {
        editarBancoDestino.value = datosPago.bancoDestino;
      }
      if (datosPago.cuentaDestino && editarCuentaDestino) {
        editarCuentaDestino.value = datosPago.cuentaDestino;
      }

      console.log('✅ Campos de bancos llenados:', {
        bancoOrigen: datosPago.bancoOrigen,
        cuentaOrigen: datosPago.cuenta,
        bancoDestino: datosPago.bancoDestino,
        cuentaDestino: datosPago.cuentaDestino
      });
    }, 300);

    // Limpiar y mostrar archivos adjuntos actuales si existen
    const archivosContainer = document.getElementById('archivosAdjuntosEditar');
    if (archivosContainer) {
      archivosContainer.innerHTML = '';
      // Nota: Los archivos adjuntos no se pueden mostrar directamente desde el objeto factura
      // ya que son File objects. Solo se pueden mostrar si están almacenados en algún lugar.
    }
  }

  // Mostrar el modal
  const modal = new bootstrap.Modal(document.getElementById('modalEditarFactura'));
  modal.show();
}

// Función para guardar los cambios de la factura editada
async function guardarEdicionFactura() {
  console.log('💾 Iniciando guardado de edición de factura...');

  if (!facturaEditandoId) {
    console.error('❌ No hay factura seleccionada para editar');
    if (typeof window.showNotification === 'function') {
      window.showNotification('Error: No hay factura seleccionada para editar', 'error');
    } else {
      alert('Error: No hay factura seleccionada para editar');
    }
    return;
  }

  console.log('📋 ID de factura a editar:', facturaEditandoId);

  // Validar formulario
  const form = document.getElementById('formEditarFactura');
  if (!form) {
    console.error('❌ Formulario de edición no encontrado');
    return;
  }

  if (!form.checkValidity()) {
    console.warn('⚠️ Formulario no válido, mostrando errores...');
    form.reportValidity();
    return;
  }

  console.log('✅ Formulario válido, continuando con el guardado...');

  try {
    // Obtener los nuevos valores del pago
    const nuevoMontoPagado = parseFloat(document.getElementById('editarMontoPagado').value);
    const nuevaFechaPago = document.getElementById('editarFechaPago').value;
    const nuevoMetodoPago = document.getElementById('editarMetodoPago').value;
    const nuevoBancoOrigen = document.getElementById('editarBancoOrigen').value;
    const nuevaCuentaOrigen = document.getElementById('editarCuentaOrigen').value;
    const nuevoBancoDestino = document.getElementById('editarBancoDestino').value;
    const nuevaCuentaDestino = document.getElementById('editarCuentaDestino').value;
    const nuevaReferenciaPago = document.getElementById('editarReferenciaPago').value.trim();
    const nuevasObservacionesPago = document.getElementById('editarObservacionesPago').value.trim();

    // Validaciones adicionales
    if (nuevoMontoPagado < 0) {
      if (typeof window.showNotification === 'function') {
        window.showNotification('El monto pagado no puede ser negativo', 'error');
      } else {
        alert('El monto pagado no puede ser negativo');
      }
      return;
    }

    // Buscar la factura en el array
    const facturaIndex = facturasData.findIndex(f => f.id === facturaEditandoId);
    if (facturaIndex === -1) {
      console.error('❌ Factura no encontrada para editar:', facturaEditandoId);
      return;
    }

    const factura = facturasData[facturaIndex];
    const facturaAnterior = { ...factura }; // Guardar copia de la factura antes de modificarla
    const montoTotal = factura.monto || 0;

    // Validar que el monto pagado no exceda el monto total
    if (nuevoMontoPagado > montoTotal) {
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          'El monto pagado no puede exceder el monto total de la factura',
          'error'
        );
      } else {
        alert('El monto pagado no puede exceder el monto total de la factura');
      }
      return;
    }

    // Recalcular monto pendiente
    const nuevoMontoPendiente = montoTotal - nuevoMontoPagado;

    // Actualizar el último pago en el array pagos si existe
    if (factura.pagos && factura.pagos.length > 0) {
      const ultimoPagoIndex = factura.pagos.length - 1;
      factura.pagos[ultimoPagoIndex] = {
        ...factura.pagos[ultimoPagoIndex],
        monto: nuevoMontoPagado,
        fecha: nuevaFechaPago,
        metodo: nuevoMetodoPago,
        bancoOrigen: nuevoBancoOrigen || '',
        cuenta: nuevaCuentaOrigen || '',
        cuentaPago: nuevaCuentaOrigen || '', // Alias para compatibilidad
        bancoDestino: nuevoBancoDestino || '',
        cuentaDestino: nuevaCuentaDestino || '',
        referencia: nuevaReferenciaPago,
        observaciones: nuevasObservacionesPago
      };
      console.log('✅ Último pago actualizado en array pagos:', factura.pagos[ultimoPagoIndex]);
    } else {
      // Si no hay pagos, crear uno nuevo
      if (!factura.pagos) {
        factura.pagos = [];
      }
      factura.pagos.push({
        id: Date.now(),
        monto: nuevoMontoPagado,
        fecha: nuevaFechaPago,
        metodo: nuevoMetodoPago,
        bancoOrigen: nuevoBancoOrigen || '',
        cuenta: nuevaCuentaOrigen || '',
        cuentaPago: nuevaCuentaOrigen || '',
        bancoDestino: nuevoBancoDestino || '',
        cuentaDestino: nuevaCuentaDestino || '',
        referencia: nuevaReferenciaPago,
        observaciones: nuevasObservacionesPago,
        archivosAdjuntos: []
      });
      console.log('✅ Nuevo pago creado en array pagos');
    }

    // Actualizar solo los campos de pago en el nivel superior
    facturasData[facturaIndex] = {
      ...facturasData[facturaIndex],
      montoPagado: nuevoMontoPagado,
      montoPendiente: nuevoMontoPendiente,
      fechaPago: nuevaFechaPago,
      metodoPago: nuevoMetodoPago,
      bancoOrigenPago: nuevoBancoOrigen || '',
      cuentaPago: nuevaCuentaOrigen || '',
      bancoDestinoPago: nuevoBancoDestino || '',
      cuentaDestinoPago: nuevaCuentaDestino || '',
      referenciaPago: nuevaReferenciaPago,
      observacionesPago: nuevasObservacionesPago,
      pagos: factura.pagos, // Asegurar que el array pagos actualizado se guarde
      fechaActualizacion: new Date().toISOString()
    };

    console.log('✅ Factura actualizada en facturasData:', {
      montoPagado: facturasData[facturaIndex].montoPagado,
      observacionesPago: facturasData[facturaIndex].observacionesPago,
      cantidadPagos: facturasData[facturaIndex].pagos ? facturasData[facturaIndex].pagos.length : 0
    });

    // Recalcular estado basado en monto pendiente
    if (nuevoMontoPendiente <= 0) {
      facturasData[facturaIndex].estado = 'pagado';
      facturasData[facturaIndex].diasVencidos = null; // null para mostrar "-"
    } else {
      // Recalcular estado basado en fechas
      const hoy = new Date();
      const fechaVencimiento = new Date(factura.fechaVencimiento);

      // Normalizar fechas a medianoche
      hoy.setHours(0, 0, 0, 0);
      fechaVencimiento.setHours(0, 0, 0, 0);

      // Calcular: fecha vencimiento - fecha hoy
      // Si es positivo: días restantes para vencer
      // Si es negativo o cero: ya venció (días vencidos)
      const diffTime = fechaVencimiento - hoy;
      let diasVencidos = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Si es negativo (ya venció), sumar 1 para ajustar
      if (diasVencidos < 0) {
        diasVencidos = diasVencidos + 1;
      }

      // Si es negativo o cero, ya venció; si es positivo, aún no vence
      if (diasVencidos <= 0) {
        facturasData[facturaIndex].estado = 'vencido';
      } else {
        facturasData[facturaIndex].estado = 'pendiente';
      }
      facturasData[facturaIndex].diasVencidos = diasVencidos;
    }

    // Manejar archivos adjuntos si se subieron nuevos
    const archivosInput = document.getElementById('editarComprobantePago');
    if (archivosInput && archivosInput.files.length > 0) {
      // Aquí podrías procesar los archivos si es necesario
      // Por ahora, solo guardamos que hay archivos nuevos
      console.log('📎 Archivos adjuntos actualizados:', archivosInput.files.length);
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

    // Guardar en Firebase
    if (window.firebaseRepos?.cxc) {
      try {
        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.cxc.db || !window.firebaseRepos.cxc.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.cxc.init();
        }

        if (window.firebaseRepos.cxc.db && window.firebaseRepos.cxc.tenantId) {
          // Activar flag para evitar que el listener interfiera
          if (window._cxcGuardandoDatos) {
            window._cxcGuardandoDatos();
          }

          try {
            const facturaId = factura.id || `factura_${factura.numeroFactura}`;
            console.log('🔥 Guardando factura actualizada en Firebase CXC...', {
              facturaId: facturaId,
              montoPagado: facturasData[facturaIndex].montoPagado,
              montoPendiente: facturasData[facturaIndex].montoPendiente,
              estado: facturasData[facturaIndex].estado
            });

            // Asegurar que tenga el tipo correcto
            const facturaData = {
              ...facturasData[facturaIndex],
              tipo: 'factura',
              fechaCreacion: factura.fechaCreacion || new Date().toISOString()
            };

            const resultado = await window.firebaseRepos.cxc.saveFactura(facturaId, facturaData);
            if (resultado) {
              console.log(`✅ Factura ${factura.numeroFactura} actualizada en Firebase CXC`);
            } else {
              console.warn('⚠️ No se pudo guardar en Firebase, pero se guardó en localStorage');
            }
          } finally {
            // Desactivar flag después de guardar
            if (window._cxcDatosGuardados) {
              // Esperar un momento para que Firebase procese los cambios
              setTimeout(() => {
                window._cxcDatosGuardados();
              }, 500);
            }
          }
        } else {
          console.warn('⚠️ Repositorio CXC no inicializado completamente');
        }
      } catch (error) {
        console.error('❌ Error guardando factura actualizada en Firebase:', error);
        console.log('⚠️ Continuando con localStorage...');
      }
    } else {
      console.warn('⚠️ Repositorio de Firebase CXC no disponible');
    }

    // Actualizar movimiento correspondiente en Tesorería
    try {
      // Obtener movimientos de tesorería
      const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');

      // Obtener número de factura en formato correcto
      const numeroFacturaDisplay =
        factura.serie && factura.folio
          ? `${factura.serie}-${factura.folio}`
          : factura.numeroFactura || 'N/A';

      // Buscar el movimiento en Tesorería que corresponde a esta factura
      // Buscar por número de factura y origen CXC
      const movimientoIndex = tesoreria.findIndex(
        m =>
          m.origen === 'CXC' &&
          (m.numeroFactura === numeroFacturaDisplay ||
            m.descripcion === `[CXC] - ${numeroFacturaDisplay}` ||
            (m.referencia && m.referencia === factura.referenciaPago))
      );

      if (movimientoIndex !== -1) {
        const movimiento = tesoreria[movimientoIndex];

        // Actualizar los campos del movimiento con los nuevos datos
        movimiento.fecha = nuevaFechaPago || movimiento.fecha;
        movimiento.metodoPago = nuevoMetodoPago || movimiento.metodoPago;
        movimiento.bancoOrigen = nuevoBancoOrigen || movimiento.bancoOrigen;
        movimiento.cuentaOrigen = nuevaCuentaOrigen || movimiento.cuentaOrigen;
        movimiento.bancoDestino = nuevoBancoDestino || movimiento.bancoDestino;
        movimiento.cuentaDestino = nuevaCuentaDestino || movimiento.cuentaDestino;
        movimiento.referencia = nuevaReferenciaPago || movimiento.referencia;
        movimiento.referenciaBancaria = nuevaReferenciaPago || movimiento.referenciaBancaria;

        // Actualizar monto si cambió
        if (nuevoMontoPagado !== facturaAnterior.montoPagado) {
          movimiento.monto = nuevoMontoPagado;
        }

        // Guardar cambios en localStorage
        localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(tesoreria));
        console.log('✅ Movimiento actualizado en Tesorería (localStorage)');

        // Guardar en Firebase si está disponible
        if (window.firebaseRepos?.tesoreria) {
          try {
            // Esperar a que el repositorio esté inicializado
            let attempts = 0;
            while (
              attempts < 10 &&
              (!window.firebaseRepos.tesoreria.db || !window.firebaseRepos.tesoreria.tenantId)
            ) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 500));
              if (window.firebaseRepos.tesoreria && !window.firebaseRepos.tesoreria.db) {
                await window.firebaseRepos.tesoreria.init();
              }
            }

            if (window.firebaseRepos.tesoreria.db && window.firebaseRepos.tesoreria.tenantId) {
              const movimientoId = `movimiento_${movimiento.id}`;
              const movimientoData = {
                ...movimiento,
                fechaActualizacion: new Date().toISOString()
              };

              await window.firebaseRepos.tesoreria.saveMovimiento(movimientoId, movimientoData);
              console.log('✅ Movimiento actualizado en Tesorería (Firebase)');
            } else {
              console.warn('⚠️ Repositorio Tesorería no inicializado completamente');
            }
          } catch (error) {
            console.error('❌ Error actualizando movimiento en Firebase Tesorería:', error);
            console.log('⚠️ Continuando con localStorage...');
          }
        } else {
          console.warn('⚠️ Repositorio de Firebase Tesorería no disponible');
        }
      } else {
        console.warn(
          `⚠️ No se encontró movimiento en Tesorería para la factura ${numeroFacturaDisplay}`
        );
        console.log('💡 El movimiento puede no existir aún o tener un formato diferente');
      }
    } catch (error) {
      console.error('❌ Error al actualizar movimiento en Tesorería:', error);
      // No bloquear el flujo si hay error en Tesorería
    }

    // Recargar datos desde Firebase para asegurar sincronización
    try {
      if (window.firebaseRepos?.cxc) {
        console.log('🔄 Recargando datos desde Firebase...');
        const facturasFirebase = await window.firebaseRepos.cxc.getAllFacturas();
        if (facturasFirebase && facturasFirebase.length > 0) {
          facturasData = facturasFirebase;
          facturasFiltradas = [...facturasData];
          console.log(`✅ ${facturasData.length} facturas recargadas desde Firebase`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error recargando datos desde Firebase:', error);
    }

    // Actualizar la tabla
    loadFacturas();
    updateCXCSummary();

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarFactura'));
    if (modal) {
      modal.hide();
    }

    // Limpiar la variable
    facturaEditandoId = null;

    // Mostrar notificación de éxito
    if (typeof window.showNotification === 'function') {
      window.showNotification('Información de pago actualizada correctamente', 'success');
    } else {
      alert('Información de pago actualizada correctamente');
    }

    console.log('✅ Información de pago editada exitosamente:', facturasData[facturaIndex]);
  } catch (error) {
    console.error('❌ Error crítico al guardar edición de factura:', error);
    console.error('Stack trace:', error.stack);

    if (typeof window.showNotification === 'function') {
      window.showNotification(`Error al guardar los cambios: ${error.message}`, 'error');
    } else {
      alert(`Error al guardar los cambios: ${error.message}`);
    }
  }
}

// Función para cargar bancos en el modal de edición
async function cargarBancosParaEditar() {
  let bancos = [];

  // Intentar cargar desde Firebase
  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          bancos = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando bancos desde Firebase:', error);
    }
  }

  // Si no hay datos en Firebase, intentar desde localStorage
  if (bancos.length === 0 && window.configuracionManager) {
    bancos = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Obtener lista única de bancos
  const bancosUnicos = [...new Set(bancos.map(b => b.banco).filter(b => b))];

  // Llenar el select de banco origen en el modal de edición
  const selectBancoOrigen = document.getElementById('editarBancoOrigen');

  if (selectBancoOrigen) {
    selectBancoOrigen.innerHTML = '<option value="">Seleccione un banco...</option>';
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectBancoOrigen.appendChild(option);
    });
  }

  return bancos;
}

// Función para actualizar las cuentas de origen según el banco seleccionado (modal Editar)
async function actualizarCuentasOrigenEditarCXC() {
  const selectBanco = document.getElementById('editarBancoOrigen');
  const selectCuenta = document.getElementById('editarCuentaOrigen');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Función para actualizar las cuentas de destino según el banco seleccionado (modal Editar)
async function _actualizarCuentasDestinoEditarCXC() {
  const selectBanco = document.getElementById('editarBancoDestino');
  const selectCuenta = document.getElementById('editarCuentaDestino');

  if (!selectBanco || !selectCuenta) {
    return;
  }

  const bancoSeleccionado = selectBanco.value;
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

  if (!bancoSeleccionado) {
    selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
    return;
  }

  // Cargar todas las cuentas bancarias
  let cuentasBancarias = [];

  if (window.firebaseDb && window.fs) {
    try {
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
    }
  }

  if (cuentasBancarias.length === 0 && window.configuracionManager) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  }

  // Filtrar cuentas del banco seleccionado
  const cuentasDelBanco = cuentasBancarias.filter(c => c.banco === bancoSeleccionado);

  if (cuentasDelBanco.length === 0) {
    selectCuenta.innerHTML = '<option value="">No hay cuentas para este banco</option>';
    return;
  }

  // Llenar el select de cuentas
  cuentasDelBanco.forEach(cuenta => {
    const option = document.createElement('option');
    option.value = cuenta.numeroCuenta || '';
    option.textContent = cuenta.numeroCuenta || 'Sin número de cuenta';
    selectCuenta.appendChild(option);
  });
}

// Exponer funciones globalmente
window.editarFactura = editarFactura;
window.guardarEdicionFactura = guardarEdicionFactura;
window.cargarBancosParaEditar = cargarBancosParaEditar;
window.actualizarCuentasOrigenEditarCXC = actualizarCuentasOrigenEditarCXC;

// Cargar facturas en la tabla
function loadFacturas() {
  const tbody = document.getElementById('tbodyFacturas');
  if (!tbody) {
    return;
  }

  // Guardar facturas filtradas globalmente para paginación
  window._facturasCXCCompletas = [...facturasFiltradas];

  // Si no hay facturas, mostrar mensaje
  if (facturasFiltradas.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" class="text-center text-muted">No hay facturas para mostrar</td></tr>';
    const contenedorPaginacion = document.getElementById('paginacionCXC');
    if (contenedorPaginacion) {
      contenedorPaginacion.innerHTML = '';
    }
    return;
  }

  // Inicializar paginación
  const PaginacionManagerClass =
    typeof PaginacionManager !== 'undefined'
      ? PaginacionManager
      : typeof window.PaginacionManager !== 'undefined'
        ? window.PaginacionManager
        : null;

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todas las facturas sin paginación'
    );
    renderizarFacturasCXC(facturasFiltradas);
    return;
  }

  if (!window._paginacionCXCManager) {
    try {
      window._paginacionCXCManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para CXC');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      renderizarFacturasCXC(facturasFiltradas);
      return;
    }
  }

  try {
    // Crear array de IDs para paginación
    const facturasIds = facturasFiltradas.map(f =>
      String(f.id || f.numeroFactura || Date.now() + Math.random())
    );
    window._paginacionCXCManager.inicializar(facturasIds, 15);
    window._paginacionCXCManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada: ${window._paginacionCXCManager.totalRegistros} facturas, ${window._paginacionCXCManager.obtenerTotalPaginas()} páginas`
    );

    // Renderizar facturas de la página actual
    renderizarFacturasCXC();

    // Generar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionCXC');
    if (contenedorPaginacion && window._paginacionCXCManager) {
      contenedorPaginacion.innerHTML = window._paginacionCXCManager.generarControlesPaginacion(
        'paginacionCXC',
        'cambiarPaginaCXC'
      );
    }
  } catch (error) {
    console.error('❌ Error al inicializar paginación:', error);
    renderizarFacturasCXC(facturasFiltradas);
  }
}

// Función para renderizar las facturas (con o sin paginación)
function renderizarFacturasCXC(facturasParaRenderizar = null) {
  const tbody = document.getElementById('tbodyFacturas');
  if (!tbody) {
    return;
  }

  // Si se proporcionan facturas específicas, renderizarlas directamente
  if (facturasParaRenderizar) {
    tbody.innerHTML = '';
    if (facturasParaRenderizar.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="11" class="text-center text-muted">No hay facturas para mostrar</td></tr>';
      return;
    }

    facturasParaRenderizar.forEach(factura => {
      renderizarFilaFactura(factura, tbody);
    });
    return;
  }

  // Si no se proporcionan, usar paginación
  if (!window._paginacionCXCManager || !window._facturasCXCCompletas) {
    console.warn(
      '⚠️ No se puede renderizar: paginacion=',
      Boolean(window._paginacionCXCManager),
      'facturas=',
      Boolean(window._facturasCXCCompletas)
    );
    return;
  }

  const facturasIds = window._paginacionCXCManager.obtenerRegistrosPagina();
  const facturasMap = {};
  window._facturasCXCCompletas.forEach(factura => {
    const id = String(factura.id || factura.numeroFactura || Date.now() + Math.random());
    facturasMap[id] = factura;
  });

  const facturasPagina = facturasIds
    .map(id => facturasMap[id])
    .filter(factura => factura !== undefined);

  tbody.innerHTML = '';

  if (facturasPagina.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="11" class="text-center text-muted">No hay facturas para mostrar</td></tr>';
    return;
  }

  facturasPagina.forEach(factura => {
    renderizarFilaFactura(factura, tbody);
  });

  // Actualizar controles de paginación
  const contenedorPaginacion = document.getElementById('paginacionCXC');
  if (contenedorPaginacion && window._paginacionCXCManager) {
    contenedorPaginacion.innerHTML = window._paginacionCXCManager.generarControlesPaginacion(
      'paginacionCXC',
      'cambiarPaginaCXC'
    );
  }

  console.log(
    `✅ ${window._paginacionCXCManager.totalRegistros} facturas CXC cargadas (página ${window._paginacionCXCManager.paginaActual} de ${window._paginacionCXCManager.obtenerTotalPaginas()})`
  );
}

// Función auxiliar para renderizar una fila de factura
function renderizarFilaFactura(factura, tbody) {
  const row = document.createElement('tr');

  // Determinar clase de estado
  let estadoClass = '';
  let estadoText = '';
  switch (factura.estado) {
    case 'pendiente':
      estadoClass = 'badge bg-warning';
      estadoText = 'Pendiente';
      break;
    case 'pagado':
      estadoClass = 'badge bg-success';
      estadoText = 'Pagado';
      break;
    case 'vencido':
      estadoClass = 'badge bg-danger';
      estadoText = 'Vencido';
      break;
  }

  // Calcular montos
  const montoTotal = factura.monto || 0;
  const montoPagado = factura.montoPagado || 0;
  const montoPendiente = factura.montoPendiente || montoTotal - montoPagado;

  // Determinar si se puede pagar (tiene saldo pendiente)
  const puedePagar = montoPendiente > 0;

  // Determinar si tiene un pago registrado
  const tienePago =
    factura.estado === 'pagado' ||
    factura.estado === 'pagada' ||
    (factura.montoPagado && factura.montoPagado > 0) ||
    factura.fechaPago;

  row.innerHTML = `
        <td>
            ${
  puedePagar
    ? `<input type="checkbox" class="form-check-input factura-checkbox" value="${factura.id}" onchange="actualizarSeleccion()">`
    : '<span class="text-muted">-</span>'
}
        </td>
        <td><strong>${factura.serie || ''}${factura.serie && factura.folio ? '-' : ''}${factura.folio || factura.numeroFactura}</strong></td>
        <td>${factura.cliente}</td>
        <td>${formatDate(factura.fechaEmision)}</td>
        <td>${formatDate(factura.fechaVencimiento)}</td>
        <td><strong>$${formatCurrency(montoTotal)}</strong></td>
        <td><span class="text-success">$${formatCurrency(montoPagado)}</span></td>
        <td><strong class="${montoPendiente > 0 ? 'text-danger' : 'text-success'}">$${formatCurrency(montoPendiente)}</strong></td>
        <td><span class="${estadoClass}">${estadoText}</span></td>
        <td>${
  factura.estado === 'pagado' || factura.estado === 'pagada'
    ? '-'
    : (() => {
      if (factura.diasVencidos === null || factura.diasVencidos === undefined) {
        return '0 días';
      }
      let estiloDias = '';
      if (factura.diasVencidos <= 3) {
        // Días negativos al día 3: fondo rojo y letras blancas
        estiloDias =
                    'background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
      } else if (factura.diasVencidos >= 4 && factura.diasVencidos <= 7) {
        // Días 4 al 7: fondo amarillo y letras blancas
        estiloDias =
                    'background-color: #ffc107; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;';
      } else {
        // Día 8 en adelante: sin fondo y letras negras
        estiloDias = 'color: black;';
      }
      return `<span style="${estiloDias}">${factura.diasVencidos} días</span>`;
    })()
}</td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="verDetallesFactura('${factura.id}')" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                ${
  tienePago
    ? `
                    <button class="btn btn-sm btn-outline-warning" onclick="editarFactura('${factura.id}')" title="Editar pago">
                        <i class="fas fa-edit"></i>
                    </button>
                `
    : ''
}
                ${
  puedePagar
    ? `
                    <button class="btn btn-sm btn-success" onclick="abrirModalPago('${factura.id}')" title="Registrar pago">
                        <i class="fas fa-credit-card"></i>
                    </button>
                `
    : ''
}
                <button class="btn btn-sm btn-outline-secondary" onclick="descargarPDFFacturaCXC('${factura.id}')" title="Descargar PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </div>
        </td>
    `;

  tbody.appendChild(row);
}

// Actualizar resumen de CXC
function updateCXCSummary() {
  // Calcular monto total pendiente y contar facturas pendientes basándose en montoPendiente > 0
  // Si montoPendiente no está definido, calcularlo como monto - montoPagado
  let facturasPendientes = 0;
  const montoTotalPendiente = facturasData.reduce((sum, f) => {
    let { montoPendiente } = f;

    // Si montoPendiente no está definido, calcularlo
    if (montoPendiente === undefined || montoPendiente === null) {
      const monto = parseFloat(f.monto) || 0;
      const montoPagado = parseFloat(f.montoPagado) || 0;
      montoPendiente = monto - montoPagado;
    }

    // Asegurar que sea un número válido
    montoPendiente = parseFloat(montoPendiente) || 0;

    // Contar facturas pendientes (monto pendiente > 0)
    if (montoPendiente > 0) {
      facturasPendientes++;
    }

    // Solo sumar si es mayor a 0 (facturas pendientes)
    return sum + (montoPendiente > 0 ? montoPendiente : 0);
  }, 0);

  // Facturas completamente pagadas (monto pendiente = 0 o estado pagado/pagada)
  const facturasPagadas = facturasData.filter(f => {
    // Si tiene estado pagado/pagada, contar como pagada
    if (f.estado === 'pagada' || f.estado === 'pagado') {
      return true;
    }
    // Si no tiene estado pero montoPendiente es 0 o null/undefined y montoPagado > 0
    let { montoPendiente } = f;
    if (montoPendiente === undefined || montoPendiente === null) {
      const monto = parseFloat(f.monto) || 0;
      const montoPagado = parseFloat(f.montoPagado) || 0;
      montoPendiente = monto - montoPagado;
    }
    montoPendiente = parseFloat(montoPendiente) || 0;
    return montoPendiente === 0 && (parseFloat(f.montoPagado) || 0) > 0;
  }).length;

  // Calcular monto total pagado
  const montoTotalPagado = facturasData.reduce((sum, f) => {
    const montoPagado = f.montoPagado || 0;
    return sum + montoPagado;
  }, 0);

  // Calcular monto total de facturas
  const montoTotalFacturas = facturasData.reduce((sum, f) => {
    const monto = f.monto || 0;
    return sum + monto;
  }, 0);

  const tasaCobranza =
    montoTotalFacturas > 0 ? Math.round((montoTotalPagado / montoTotalFacturas) * 100) : 0;

  document.getElementById('facturasPendientes').textContent = facturasPendientes;
  document.getElementById('facturasPagadas').textContent = facturasPagadas;
  document.getElementById('montoTotalPendiente').textContent =
    `$${formatCurrency(montoTotalPendiente)}`;
  document.getElementById('tasaCobranza').textContent = `${tasaCobranza}%`;

  console.log(
    `📊 Resumen CXC actualizado: ${facturasPendientes} pendientes, ${facturasPagadas} pagadas, $${formatCurrency(montoTotalPendiente)} pendiente`
  );
}

// Aplicar filtros
window.aplicarFiltrosCXC = function aplicarFiltrosCXC() {
  const filtroCliente = document.getElementById('filtroCliente').value.toLowerCase();
  const filtroEstado = document.getElementById('filtroEstado').value;
  const fechaDesde = document.getElementById('fechaDesde').value;
  const fechaHasta = document.getElementById('fechaHasta').value;
  const filtroFolio = document.getElementById('filtroFolio').value.trim();
  const filtroSerie = document.getElementById('filtroSerie').value.toUpperCase();

  const facturasFiltradasTemp = facturasData.filter(factura => {
    const cumpleCliente = !filtroCliente || factura.cliente.toLowerCase().includes(filtroCliente);
    const cumpleEstado = !filtroEstado || factura.estado === filtroEstado;
    const cumpleFechaDesde = !fechaDesde || factura.fechaEmision >= fechaDesde;
    const cumpleFechaHasta = !fechaHasta || factura.fechaEmision <= fechaHasta;

    // Filtro de serie
    const cumpleSerie =
      !filtroSerie || (factura.serie && factura.serie.toUpperCase() === filtroSerie);

    // Filtro de folio específico (busca coincidencia exacta o parcial en el número de folio)
    let cumpleFolio = true;
    if (filtroFolio) {
      if (factura.folio) {
        // Buscar coincidencia exacta o que el folio contenga el texto buscado
        const folioStr = factura.folio.toString();
        cumpleFolio = folioStr === filtroFolio || folioStr.includes(filtroFolio);
      } else {
        cumpleFolio = false; // Si no hay folio, no cumple el filtro
      }
    }

    return (
      cumpleCliente &&
      cumpleEstado &&
      cumpleFechaDesde &&
      cumpleFechaHasta &&
      cumpleSerie &&
      cumpleFolio
    );
  });

  // Ordenar facturas filtradas por número (del más reciente al más antiguo)
  facturasFiltradas = ordenarFacturasPorNumero(facturasFiltradasTemp);

  console.log(`🔍 Filtros aplicados: ${facturasFiltradas.length} facturas encontradas`);
  loadFacturas();
};

// Variable global para el timeout del debounce de filtros
let filtrosTimeoutId = null;

// Función global de debounce para filtros (se reutiliza para todos los campos de texto)
function aplicarFiltrosConDebounceCXC() {
  clearTimeout(filtrosTimeoutId);
  filtrosTimeoutId = setTimeout(() => {
    if (typeof aplicarFiltrosCXC === 'function') {
      aplicarFiltrosCXC();
    }
  }, 300); // Esperar 300ms después de que el usuario deje de escribir
}

// Función global para aplicar filtros inmediatamente (sin debounce)
function aplicarFiltrosInmediatoCXC() {
  clearTimeout(filtrosTimeoutId); // Cancelar cualquier debounce pendiente
  if (typeof aplicarFiltrosCXC === 'function') {
    aplicarFiltrosCXC();
  }
}

// Configurar filtros automáticos (se aplican mientras se escribe)
function configurarFiltrosAutomaticos() {
  console.log('🔧 Configurando filtros automáticos para CXC...');

  // Campos de texto: usar 'input' para filtrar mientras se escribe (con debounce)
  const camposTexto = ['filtroCliente', 'filtroSerie', 'filtroFolio'];

  camposTexto.forEach(campoId => {
    const campo = document.getElementById(campoId);
    if (campo) {
      // Remover listener anterior si existe (usando la función global)
      campo.removeEventListener('input', aplicarFiltrosConDebounceCXC);
      // Agregar nuevo listener
      campo.addEventListener('input', aplicarFiltrosConDebounceCXC);
      console.log(`✅ Filtro automático configurado para: ${campoId} (con debounce)`);
    }
  });

  // Campos de fecha y select: usar 'change' para filtrar inmediatamente
  const camposInmediatos = ['filtroEstado', 'fechaDesde', 'fechaHasta'];

  camposInmediatos.forEach(campoId => {
    const campo = document.getElementById(campoId);
    if (campo) {
      // Remover listener anterior si existe (usando la función global)
      campo.removeEventListener('change', aplicarFiltrosInmediatoCXC);
      // Agregar nuevo listener
      campo.addEventListener('change', aplicarFiltrosInmediatoCXC);
      console.log(`✅ Filtro automático configurado para: ${campoId} (inmediato)`);
    }
  });

  console.log('✅ Filtros automáticos configurados correctamente');
}

// Limpiar filtros
window.limpiarFiltrosCXC = function limpiarFiltrosCXC() {
  document.getElementById('filtroCliente').value = '';
  document.getElementById('filtroEstado').value = '';
  document.getElementById('fechaDesde').value = '';
  document.getElementById('fechaHasta').value = '';
  document.getElementById('filtroFolio').value = '';
  document.getElementById('filtroSerie').value = '';

  // Ordenar facturas por número (del más reciente al más antiguo)
  facturasFiltradas = ordenarFacturasPorNumero([...facturasData]);
  loadFacturas();
};

// Función global para cambiar de página en CXC
window.cambiarPaginaCXC = function (accion) {
  if (!window._paginacionCXCManager) {
    console.warn('⚠️ window._paginacionCXCManager no está disponible');
    return;
  }

  let cambioExitoso = false;

  if (accion === 'anterior') {
    cambioExitoso = window._paginacionCXCManager.paginaAnterior();
  } else if (accion === 'siguiente') {
    cambioExitoso = window._paginacionCXCManager.paginaSiguiente();
  } else if (typeof accion === 'number') {
    cambioExitoso = window._paginacionCXCManager.irAPagina(accion);
  }

  if (cambioExitoso) {
    renderizarFacturasCXC();
    // Scroll suave hacia la tabla
    const tabla = document.getElementById('tablaFacturas');
    if (tabla) {
      tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
};

// Abrir modal para registrar pago
function _abrirModalPago(facturaId) {
  const factura = facturasData.find(f => f.id === facturaId);
  if (!factura) {
    return;
  }

  // Calcular montos
  const montoTotal = factura.monto || 0;
  const montoPagado = factura.montoPagado || 0;
  const montoPendiente = factura.montoPendiente || montoTotal - montoPagado;

  // Llenar datos de la factura
  document.getElementById('facturaSeleccionada').value = factura.numeroFactura;
  document.getElementById('clienteSeleccionado').value = factura.cliente;
  document.getElementById('montoFactura').value = `$${formatCurrency(montoTotal)}`;
  document.getElementById('montoPagado').value = `$${formatCurrency(montoPagado)}`;
  document.getElementById('montoPendiente').value = `$${formatCurrency(montoPendiente)}`;
  document.getElementById('montoPago').value = montoPendiente; // Por defecto, el monto pendiente
  document.getElementById('montoPago').max = montoPendiente; // Establecer máximo
  document.getElementById('maximoPago').textContent = `$${formatCurrency(montoPendiente)}`;
  document.getElementById('fechaPago').value = new Date().toISOString().split('T')[0];

  // Limpiar campos de pago
  document.getElementById('metodoPago').value = '';
  document.getElementById('bancoOrigen').value = '';
  document.getElementById('cuentaPago').value = '';
  document.getElementById('bancoDestino').value = '';
  document.getElementById('cuentaDestino').value = '';
  document.getElementById('referenciaPago').value = '';
  document.getElementById('observacionesPago').value = '';
  document.getElementById('comprobantePago').value = '';

  // Limpiar archivos adjuntos
  document.getElementById('archivosAdjuntos').innerHTML = '';

  // Configurar event listener para archivos
  document.getElementById('comprobantePago').addEventListener('change', manejarArchivosAdjuntos);

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalRegistrarPago'));
  modal.show();
}

// Manejar archivos adjuntos
function manejarArchivosAdjuntos(event) {
  const { files } = event.target;
  const container = document.getElementById('archivosAdjuntos');

  // Limpiar contenedor
  container.innerHTML = '';

  // Procesar cada archivo
  Array.from(files).forEach((file, index) => {
    const archivoDiv = document.createElement('div');
    archivoDiv.className = 'archivo-adjunto';
    archivoDiv.innerHTML = `
            <div class="info-archivo">
                <i class="fas fa-file icono-archivo"></i>
                <span class="nombre-archivo">${file.name}</span>
                <span class="tamaño-archivo">(${formatFileSize(file.size)})</span>
            </div>
            <button type="button" class="btn-eliminar" onclick="eliminarArchivoAdjunto(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
    container.appendChild(archivoDiv);
  });
}

// Eliminar archivo adjunto
function _eliminarArchivoAdjunto(index) {
  const input = document.getElementById('comprobantePago');
  const dt = new DataTransfer();

  // Recrear la lista de archivos sin el archivo eliminado
  Array.from(input.files).forEach((file, i) => {
    if (i !== index) {
      dt.items.add(file);
    }
  });

  input.files = dt.files;

  // Actualizar la visualización
  manejarArchivosAdjuntos({ target: input });
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Convertir archivos a base64 para almacenamiento
function convertirArchivosABase64(files) {
  return Promise.all(
    Array.from(files).map(
      file =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              nombre: file.name,
              tipo: file.type,
              tamaño: file.size,
              contenido: reader.result
            });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

// Registrar pago
async function registrarPago() {
  console.log('💳 Iniciando registro de pago...');

  // Prevenir dobles clics
  if (window._cxcRegistrandoPago) {
    console.log('⚠️ Ya hay un proceso de registro de pago en curso, ignorando clic duplicado');
    return false;
  }

  // Obtener el botón y deshabilitarlo para evitar dobles clics
  const btnRegistrar = document.querySelector(
    '#modalRegistrarPago button[data-action="registrarPago"]'
  );
  const textoOriginal = btnRegistrar ? btnRegistrar.innerHTML : '';
  const originalButtonStyle = btnRegistrar
    ? {
      backgroundColor: btnRegistrar.style.backgroundColor || '',
      borderColor: btnRegistrar.style.borderColor || '',
      color: btnRegistrar.style.color || '',
      opacity: btnRegistrar.style.opacity || '',
      cursor: btnRegistrar.style.cursor || ''
    }
    : {};

  // Función para restaurar el botón
  const restaurarBoton = () => {
    if (btnRegistrar) {
      btnRegistrar.disabled = false;
      btnRegistrar.innerHTML = textoOriginal;
      btnRegistrar.style.opacity = '1';
      btnRegistrar.style.cursor = 'pointer';
      btnRegistrar.style.pointerEvents = 'auto';
      if (originalButtonStyle.backgroundColor) {
        btnRegistrar.style.backgroundColor = originalButtonStyle.backgroundColor;
        btnRegistrar.style.borderColor = originalButtonStyle.borderColor;
        btnRegistrar.style.color = originalButtonStyle.color;
      }
    }
    window._cxcRegistrandoPago = false;
  };

  // Marcar como procesando
  window._cxcRegistrandoPago = true;

  // Deshabilitar botón y mostrar "Procesando..."
  if (btnRegistrar) {
    btnRegistrar.disabled = true;
    btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btnRegistrar.style.opacity = '0.7';
    btnRegistrar.style.cursor = 'not-allowed';
    btnRegistrar.style.pointerEvents = 'none';
  }

  try {
    const form = document.getElementById('formRegistrarPago');
    if (!form) {
      console.error('❌ Formulario formRegistrarPago no encontrado');
      if (typeof window.showNotification === 'function') {
        window.showNotification('Error: Formulario no encontrado', 'error');
      } else {
        alert('Error: Formulario no encontrado');
      }
      restaurarBoton();
      return false;
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      console.warn('⚠️ Formulario no válido');
      restaurarBoton();
      return false;
    }

    const facturaNumero = document.getElementById('facturaSeleccionada')?.value;
    if (!facturaNumero) {
      console.error('❌ No se encontró el número de factura seleccionada');
      if (typeof window.showNotification === 'function') {
        window.showNotification('Error: No se encontró la factura seleccionada', 'error');
      } else {
        alert('Error: No se encontró la factura seleccionada');
      }
      restaurarBoton();
      return false;
    }

    const factura = facturasData.find(f => f.numeroFactura === facturaNumero);

    if (!factura) {
      console.error('❌ Factura no encontrada:', facturaNumero);
      if (typeof window.showNotification === 'function') {
        window.showNotification('Error: Factura no encontrada', 'error');
      } else {
        alert('Factura no encontrada');
      }
      restaurarBoton();
      return false;
    }

    // Obtener datos del pago
    const bancoDestinoElement = document.getElementById('bancoDestino');
    const cuentaDestinoElement = document.getElementById('cuentaDestino');

    const pagoData = {
      monto: parseFloat(document.getElementById('montoPago').value),
      fecha: document.getElementById('fechaPago').value,
      metodo: document.getElementById('metodoPago').value,
      bancoOrigen: document.getElementById('bancoOrigen').value,
      cuenta: document.getElementById('cuentaPago').value,
      bancoDestino: bancoDestinoElement ? bancoDestinoElement.value : '',
      cuentaDestino: cuentaDestinoElement ? cuentaDestinoElement.value : '',
      referencia: document.getElementById('referenciaPago').value,
      observaciones: document.getElementById('observacionesPago').value,
      archivosAdjuntos: []
    };

    console.log('📋 Datos del pago capturados:', {
      bancoDestino: pagoData.bancoDestino,
      cuentaDestino: pagoData.cuentaDestino,
      bancoOrigen: pagoData.bancoOrigen,
      cuenta: pagoData.cuenta
    });

    // Procesar archivos adjuntos (obligatorio)
    const archivosInput = document.getElementById('comprobantePago');
    if (!archivosInput || archivosInput.files.length === 0) {
      const mensaje = 'Por favor, adjunta al menos un comprobante de pago';
      if (typeof window.showNotification === 'function') {
        window.showNotification(mensaje, 'error');
      } else {
        alert(mensaje);
      }
      if (archivosInput) {
        archivosInput.focus();
      }
      restaurarBoton();
      return false;
    }

    try {
      const archivosBase64 = await convertirArchivosABase64(archivosInput.files);
      pagoData.archivosAdjuntos = archivosBase64;
      console.log('📎 Archivos adjuntos procesados:', archivosBase64.length);
    } catch (error) {
      console.error('❌ Error procesando archivos adjuntos:', error);
      const mensaje = 'Error al procesar los archivos adjuntos. Intenta nuevamente.';
      if (typeof window.showNotification === 'function') {
        window.showNotification(mensaje, 'error');
      } else {
        alert(mensaje);
      }
      restaurarBoton();
      return false;
    }

    // Calcular montos actuales
    const montoTotal = factura.monto || 0;
    const montoPagadoActual = factura.montoPagado || 0;
    const montoPendienteActual = factura.montoPendiente || montoTotal - montoPagadoActual;

    // Validar monto del pago
    if (pagoData.monto <= 0) {
      const mensaje = 'El monto del pago debe ser mayor a cero';
      if (typeof window.showNotification === 'function') {
        window.showNotification(mensaje, 'error');
      } else {
        alert(mensaje);
      }
      restaurarBoton();
      return false;
    }

    if (pagoData.monto > montoPendienteActual) {
      const mensaje = `El monto del pago ($${formatCurrency(pagoData.monto)}) no puede ser mayor al monto pendiente ($${formatCurrency(montoPendienteActual)})`;
      if (typeof window.showNotification === 'function') {
        window.showNotification(mensaje, 'error');
      } else {
        alert(mensaje);
      }
      restaurarBoton();
      return false;
    }

    // Crear registro de pago
    const nuevoPago = {
      id: Date.now(),
      monto: pagoData.monto,
      fecha: pagoData.fecha,
      metodo: pagoData.metodo,
      cuenta: pagoData.cuenta,
      cuentaPago: pagoData.cuenta, // Alias para compatibilidad
      bancoOrigen: pagoData.bancoOrigen || '',
      bancoDestino: pagoData.bancoDestino || '',
      cuentaDestino: pagoData.cuentaDestino || '',
      referencia: pagoData.referencia || '',
      observaciones: pagoData.observaciones || '',
      archivosAdjuntos: pagoData.archivosAdjuntos || []
    };

    console.log('💾 Nuevo pago creado:', {
      id: nuevoPago.id,
      monto: nuevoPago.monto,
      bancoOrigen: nuevoPago.bancoOrigen,
      bancoDestino: nuevoPago.bancoDestino,
      cuentaDestino: nuevoPago.cuentaDestino,
      referencia: nuevoPago.referencia
    });

    // Agregar pago al historial
    if (!factura.pagos) {
      factura.pagos = [];
    }
    factura.pagos.push(nuevoPago);

    // Actualizar montos
    factura.montoPagado = montoPagadoActual + pagoData.monto;
    factura.montoPendiente = montoTotal - factura.montoPagado;

    // Determinar estado de la factura
    if (factura.montoPendiente <= 0) {
      factura.estado = 'pagado';
      factura.fechaPago = pagoData.fecha;
      factura.metodoPago = pagoData.metodo;
      factura.bancoOrigenPago = pagoData.bancoOrigen;
      factura.cuentaPago = pagoData.cuenta;
      factura.bancoDestinoPago = pagoData.bancoDestino;
      factura.cuentaDestinoPago = pagoData.cuentaDestino;
      factura.referenciaPago = pagoData.referencia;
      factura.observacionesPago = pagoData.observaciones;

      // Registrar movimiento en Tesorería para TODOS los pagos (completos y parciales)
      try {
        await registrarPagoCXCTesorería(
          factura,
          pagoData.monto,
          pagoData.referencia,
          pagoData.metodo,
          pagoData.bancoOrigen,
          pagoData.cuenta,
          pagoData.bancoDestino,
          pagoData.cuentaDestino,
          pagoData.fecha // Pasar la fecha del pago
        );
        console.log('✅ Movimiento registrado en Tesorería');
      } catch (error) {
        console.error('❌ Error al registrar movimiento en Tesorería:', error);
      }
    } else {
      factura.estado = 'pendiente';

      // Registrar movimiento en Tesorería para pagos parciales también
      try {
        await registrarPagoCXCTesorería(
          factura,
          pagoData.monto,
          pagoData.referencia,
          pagoData.metodo,
          pagoData.bancoOrigen,
          pagoData.cuenta,
          pagoData.bancoDestino,
          pagoData.cuentaDestino,
          pagoData.fecha // Pasar la fecha del pago
        );
        console.log('✅ Movimiento parcial registrado en Tesorería');
      } catch (error) {
        console.error('❌ Error al registrar movimiento parcial en Tesorería:', error);
      }
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

    // Guardar en Firebase
    if (window.firebaseRepos?.cxc) {
      try {
        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.cxc.db || !window.firebaseRepos.cxc.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          await window.firebaseRepos.cxc.init();
        }

        if (window.firebaseRepos.cxc.db && window.firebaseRepos.cxc.tenantId) {
          // Activar flag para evitar que el listener interfiera
          if (window._cxcGuardandoDatos) {
            window._cxcGuardandoDatos();
          }

          try {
            const facturaId = factura.id || `factura_${factura.numeroFactura}`;
            console.log('🔥 Guardando factura actualizada en Firebase CXC...', {
              facturaId: facturaId,
              montoPagado: factura.montoPagado,
              montoPendiente: factura.montoPendiente,
              estado: factura.estado
            });

            // Asegurar que tenga el tipo correcto
            const facturaData = {
              ...factura,
              tipo: 'factura',
              fechaCreacion: factura.fechaCreacion || new Date().toISOString()
            };

            console.log('📋 Datos a guardar en Firebase CXC:', {
              facturaId: facturaId,
              numeroFactura: factura.numeroFactura,
              registroId: factura.registroId,
              monto: factura.monto,
              montoPagado: factura.montoPagado,
              montoPendiente: factura.montoPendiente,
              estado: factura.estado,
              cantidadPagos: factura.pagos ? factura.pagos.length : 0,
              pagos: factura.pagos
            });

            const resultado = await window.firebaseRepos.cxc.saveFactura(facturaId, facturaData);
            if (resultado) {
              console.log(
                `✅ Factura ${factura.numeroFactura} actualizada en Firebase CXC con pago`
              );
              console.log('✅ Información del pago guardada:', {
                montoPagado: factura.montoPagado,
                montoPendiente: factura.montoPendiente,
                estado: factura.estado,
                ultimoPago:
                  factura.pagos && factura.pagos.length > 0
                    ? factura.pagos[factura.pagos.length - 1]
                    : null
              });

              // Recargar datos desde Firebase para asegurar sincronización
              try {
                const facturasConPagos = await window.firebaseRepos.cxc.getAllFacturas();
                const facturaActualizada = facturasConPagos.find(
                  f =>
                    f.id === facturaId ||
                    f.registroId === facturaId ||
                    f.numeroFactura === factura.numeroFactura
                );

                if (facturaActualizada) {
                  // Actualizar la factura en facturasData con los datos de Firebase
                  const index = facturasData.findIndex(
                    f =>
                      f.id === facturaId ||
                      f.registroId === facturaId ||
                      f.numeroFactura === factura.numeroFactura
                  );

                  if (index !== -1) {
                    facturasData[index] = {
                      ...facturasData[index],
                      montoPagado: parseFloat(facturaActualizada.montoPagado) || 0,
                      montoPendiente: parseFloat(facturaActualizada.montoPendiente) || 0,
                      estado: facturaActualizada.estado || 'pendiente',
                      pagos: facturaActualizada.pagos || []
                    };
                  }
                }
              } catch (error) {
                console.warn('⚠️ Error recargando factura desde Firebase:', error);
              }
            } else {
              console.warn('⚠️ No se pudo guardar en Firebase, pero se guardó en localStorage');
            }
          } finally {
            // Desactivar flag después de guardar
            if (window._cxcDatosGuardados) {
              // Esperar un momento para que Firebase procese los cambios
              setTimeout(() => {
                window._cxcDatosGuardados();
              }, 500);
            }
          }
        } else {
          console.warn('⚠️ Repositorio CXC no inicializado completamente');
        }
      } catch (error) {
        console.error('❌ Error guardando factura actualizada en Firebase:', error);
        console.log('⚠️ Continuando con localStorage...');
      }
    } else {
      console.warn('⚠️ Repositorio de Firebase CXC no disponible');
    }

    // Actualizar facturasFiltradas con los cambios
    const facturaIndex = facturasData.findIndex(
      f => f.id === factura.id || f.numeroFactura === factura.numeroFactura
    );
    if (facturaIndex !== -1) {
      facturasData[facturaIndex] = factura;
    }

    // Actualizar facturasFiltradas para reflejar los cambios
    facturasFiltradas = facturasData.map(f => {
      if (f.id === factura.id || f.numeroFactura === factura.numeroFactura) {
        return factura;
      }
      return f;
    });

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistrarPago'));
    modal.hide();

    // Actualizar datos
    loadFacturas();
    updateCXCSummary();

    // Mostrar notificación
    const mensaje =
      factura.estado === 'pagado' || factura.estado === 'pagada'
        ? 'Pago registrado correctamente. Factura completamente pagada.'
        : `Pago parcial registrado. Saldo pendiente: $${formatCurrency(factura.montoPendiente)}`;

    if (
      typeof window.showNotification === 'function' &&
      window.showNotification !== showNotification
    ) {
      window.showNotification(mensaje, 'success');
    } else {
      alert(mensaje);
    }

    // Restaurar botón antes de recargar
    restaurarBoton();

    // Actualizar la página al final
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('❌ Error al registrar pago:', error);

    // Mostrar notificación de error
    const mensajeError = `Error al registrar el pago: ${error.message || 'Error desconocido'}`;
    if (typeof window.showNotification === 'function') {
      window.showNotification(mensajeError, 'error');
    } else {
      alert(mensajeError);
    }

    // Restaurar botón en caso de error
    restaurarBoton();
  }
}

// Exponer función globalmente
window.registrarPago = registrarPago;
console.log('✅ Función registrarPago expuesta globalmente:', typeof window.registrarPago);

// Verificar que la función esté disponible después de un delay
setTimeout(() => {
  if (typeof window.registrarPago === 'function') {
    console.log('✅ Función registrarPago confirmada disponible después del delay');
  } else {
    console.error('❌ Función registrarPago NO está disponible después del delay');
  }
}, 2000);

// Ver historial de pagos
function _verHistorialPagos(facturaId) {
  const factura = facturasData.find(f => f.id === facturaId);
  if (!factura) {
    return;
  }

  const pagos = factura.pagos || [];

  if (pagos.length === 0) {
    alert('No hay pagos registrados para esta factura');
    return;
  }

  // Crear contenido del modal
  let contenido = `
        <div class="mb-3">
            <h6><strong>Factura:</strong> ${factura.serie || ''}${factura.serie && factura.folio ? '-' : ''}${factura.folio || factura.numeroFactura}</h6>
            <h6><strong>Cliente:</strong> ${factura.cliente}</h6>
            <h6><strong>Monto Total:</strong> $${formatCurrency(factura.monto || 0)}</h6>
            <h6><strong>Monto Pagado:</strong> $${formatCurrency(factura.montoPagado || 0)}</h6>
            <h6><strong>Monto Pendiente:</strong> $${formatCurrency(factura.montoPendiente || 0)}</h6>
        </div>
        <div class="table-responsive" style="max-height: 500px; overflow-y: auto;">
            <table class="table table-sm table-bordered">
                <thead class="table-light" style="position: sticky; top: 0; z-index: 10;">
                    <tr>
                        <th>Fecha</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Banco Origen</th>
                        <th>Cuenta Origen</th>
                        <th>Banco Destino</th>
                        <th>Cuenta Destino</th>
                        <th>Referencia</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
    `;

  pagos.forEach(pago => {
    contenido += `
            <tr>
                <td>${formatDate(pago.fecha)}</td>
                <td><strong class="text-success">$${formatCurrency(pago.monto)}</strong></td>
                <td>${getMetodoPagoText(pago.metodo || 'otro')}</td>
                <td>${pago.bancoOrigen || '-'}</td>
                <td>${pago.cuenta || pago.cuentaPago || '-'}</td>
                <td>${pago.bancoDestino || '-'}</td>
                <td>${pago.cuentaDestino || '-'}</td>
                <td>${pago.referencia || '-'}</td>
                <td>${pago.observaciones || '-'}</td>
            </tr>
        `;
  });

  contenido += `
                </tbody>
            </table>
        </div>
    `;

  // Mostrar en modal personalizado
  const modalHtml = `
        <div class="modal fade" id="modalHistorialPagos" tabindex="-1" aria-labelledby="modalHistorialPagosLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalHistorialPagosLabel">
                            <i class="fas fa-history"></i>
                            Historial de Pagos
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${contenido}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Remover modal anterior si existe
  const modalAnterior = document.getElementById('modalHistorialPagos');
  if (modalAnterior) {
    modalAnterior.remove();
  }

  // Agregar modal al DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalHistorialPagos'));
  modal.show();

  // Limpiar modal cuando se cierre
  document.getElementById('modalHistorialPagos').addEventListener('hidden.bs.modal', function () {
    this.remove();
  });
}

// Función para formatear UUID con guiones (formato: 8-4-4-4-12)
// Formato: 550e8400-e29b-41d4-a716-446655440000 (32 dígitos hexadecimales + 4 guiones = 36 caracteres)
function formatearUUID(uuid) {
  if (!uuid) {
    return '';
  }

  // Remover todos los caracteres que no sean hexadecimales
  let cleaned = String(uuid).replace(/[^0-9a-fA-F]/g, '');

  // Si ya tiene el formato correcto (36 caracteres con guiones), validarlo y retornarlo
  if (uuid.includes('-') && uuid.length === 36) {
    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (uuidPattern.test(uuid)) {
      return uuid;
    }
  }

  // Limitar a 32 caracteres hexadecimales
  cleaned = cleaned.substring(0, 32);

  // Si no tiene 32 caracteres, retornar tal cual (puede estar incompleto)
  if (cleaned.length !== 32) {
    // Si tiene menos de 32, formatear lo que tenga pero no completar
    if (cleaned.length === 0) {
      return '';
    }
    // Formatear parcialmente
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }
    return formatted;
  }

  // Formatear con guiones en las posiciones correctas: 8-4-4-4-12
  return `${cleaned.substring(0, 8)}-${cleaned.substring(8, 12)}-${cleaned.substring(12, 16)}-${cleaned.substring(16, 20)}-${cleaned.substring(20, 32)}`;
}

// Ver detalles de factura
async function _verDetallesFactura(facturaId) {
  const factura = facturasData.find(f => f.id === facturaId);
  if (!factura) {
    return;
  }

  // Generar número de factura en formato Serie-Folio
  const numeroFacturaFormateado =
    factura.serie && factura.folio
      ? `${factura.serie}-${factura.folio}`
      : factura.numeroFactura || 'N/A';

  // Obtener datos de facturación usando registroId para obtener Folio Fiscal y numeroRegistro
  let folioFiscalRaw = '';
  let numeroRegistro = '';

  if (factura.registroId) {
    // Intentar obtener desde localStorage
    if (window.DataPersistence) {
      const datosFacturacion = window.DataPersistence.getFacturacionData(factura.registroId);
      if (datosFacturacion) {
        folioFiscalRaw = datosFacturacion['Folio Fiscal'] || datosFacturacion.folioFiscal || '';
        numeroRegistro = datosFacturacion.numeroRegistro || '';
      }
    }

    // Intentar obtener desde Firebase si no se encontró en localStorage
    if ((!folioFiscalRaw || !numeroRegistro) && window.firebaseRepos?.facturacion) {
      try {
        const repoFacturacion = window.firebaseRepos.facturacion;

        // Esperar inicialización
        let attempts = 0;
        while (attempts < 10 && (!repoFacturacion.db || !repoFacturacion.tenantId)) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 300));
          if (typeof repoFacturacion.init === 'function') {
            try {
              await repoFacturacion.init();
            } catch (e) {
              // Ignorar error intencionalmente
            }
          }
        }

        if (repoFacturacion.db && repoFacturacion.tenantId) {
          const allRegistros = await repoFacturacion.getAllRegistros();
          const registroFacturacion = allRegistros.find(
            r =>
              (r.numeroRegistro && String(r.numeroRegistro) === String(factura.registroId)) ||
              (r.id && String(r.id) === String(factura.registroId)) ||
              (r.registroId && String(r.registroId) === String(factura.registroId))
          );

          if (registroFacturacion) {
            if (!folioFiscalRaw) {
              folioFiscalRaw =
                registroFacturacion['Folio Fiscal'] || registroFacturacion.folioFiscal || '';
            }
            if (!numeroRegistro) {
              numeroRegistro = registroFacturacion.numeroRegistro || '';
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo datos de facturación desde Firebase:', error);
      }
    }
  }

  // Si aún no se encontró, buscar directamente en la factura
  if (!folioFiscalRaw) {
    folioFiscalRaw = factura.folioFiscal || factura['Folio Fiscal'] || factura.uuid || '';
  }
  if (!numeroRegistro) {
    numeroRegistro = factura.numeroRegistro || '';
  }

  const folioFiscalFormateado = folioFiscalRaw ? formatearUUID(folioFiscalRaw) : '';

  const content = document.getElementById('detallesFacturaContent');
  content.innerHTML = `
        <div class="row">
            <div class="col-12">
                <h6><i class="fas fa-file-invoice"></i> Información de la Factura</h6>
                <table class="table table-sm">
                    <tr><td><strong>Factura:</strong></td><td>${numeroFacturaFormateado}</td></tr>
                    ${folioFiscalFormateado ? `<tr><td><strong>Folio Fiscal:</strong></td><td style="color: black;">${folioFiscalFormateado}</td></tr>` : ''}
                    ${numeroRegistro ? `<tr><td><strong>N° Registro:</strong></td><td>${numeroRegistro}</td></tr>` : ''}
                    <tr><td><strong>Cliente:</strong></td><td>${factura.cliente}</td></tr>
                    <tr><td><strong>Fecha Emisión:</strong></td><td>${formatDate(factura.fechaEmision)}</td></tr>
                    <tr><td><strong>Fecha Vencimiento:</strong></td><td>${formatDate(factura.fechaVencimiento)}</td></tr>
                    <tr><td><strong>Monto Total:</strong></td><td><strong>$${formatCurrency(factura.monto || 0)}</strong></td></tr>
                    <tr><td><strong>Monto Pagado:</strong></td><td><strong class="text-success">$${formatCurrency(factura.montoPagado || 0)}</strong></td></tr>
                    <tr><td><strong>Monto Pendiente:</strong></td><td><strong class="${(factura.montoPendiente || 0) > 0 ? 'text-danger' : 'text-success'}">$${formatCurrency(factura.montoPendiente !== undefined ? factura.montoPendiente : (factura.monto || 0) - (factura.montoPagado || 0))}</strong></td></tr>
                    <tr><td><strong>Estado:</strong></td><td><span class="badge ${factura.estado === 'pagado' || factura.estado === 'pagada' ? 'bg-success' : factura.estado === 'vencido' ? 'bg-danger' : 'bg-warning'}">${factura.estado === 'pagado' || factura.estado === 'pagada' ? 'Pagado' : factura.estado === 'vencido' ? 'Vencido' : 'Pendiente'}</span></td></tr>
                </table>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <h6><i class="fas fa-history"></i> Historial de Pagos</h6>
                ${(() => {
    const pagos = factura.pagos || [];
    if (pagos.length === 0) {
      return '<p class="text-muted">No hay pagos registrados</p>';
    }
    let historialHtml =
                    '<div class="table-responsive" style="max-height: 400px; overflow-y: auto;"><table class="table table-sm table-hover table-bordered">';
    historialHtml +=
                    '<thead class="table-light" style="position: sticky; top: 0; z-index: 10;"><tr>';
    historialHtml += '<th>Fecha</th>';
    historialHtml += '<th>Monto</th>';
    historialHtml += '<th>Método</th>';
    historialHtml += '<th>Banco Origen</th>';
    historialHtml += '<th>Cuenta Origen</th>';
    historialHtml += '<th>Banco Destino</th>';
    historialHtml += '<th>Cuenta Destino</th>';
    historialHtml += '<th>Referencia</th>';
    historialHtml += '<th>Observaciones</th>';
    historialHtml += '</tr></thead><tbody>';
    pagos.forEach((pago, index) => {
      // Log para diagnóstico
      if (index === 0) {
        console.log('📋 Datos del primer pago:', {
          bancoDestino: pago.bancoDestino,
          cuentaDestino: pago.cuentaDestino,
          tieneBancoDestino: 'bancoDestino' in pago,
          tieneCuentaDestino: 'cuentaDestino' in pago,
          pagoCompleto: pago
        });
      }

      historialHtml += `
                            <tr>
                                <td>${formatDate(pago.fecha)}</td>
                                <td><strong class="text-success">$${formatCurrency(pago.monto)}</strong></td>
                                <td>${getMetodoPagoText(pago.metodo || 'otro')}</td>
                                <td>${pago.bancoOrigen || '-'}</td>
                                <td>${pago.cuenta || pago.cuentaPago || '-'}</td>
                                <td>${pago.bancoDestino && pago.bancoDestino.trim() !== '' ? pago.bancoDestino : '-'}</td>
                                <td>${pago.cuentaDestino && pago.cuentaDestino.trim() !== '' ? pago.cuentaDestino : '-'}</td>
                                <td>${pago.referencia || '-'}</td>
                                <td>${pago.observaciones || '-'}</td>
                            </tr>
                        `;
    });
    historialHtml += '</tbody></table></div>';
    return historialHtml;
  })()}
            </div>
        </div>
        ${
  factura.descripcion
    ? `
        <div class="row mt-3">
            <div class="col-12">
                <h6><i class="fas fa-list"></i> Descripción del Servicio</h6>
                <p>${factura.descripcion}</p>
            </div>
        </div>
        `
    : ''
}
        ${(() => {
    // Obtener observaciones del pago: primero del nivel superior, si no del último pago
    let observacionesPago = factura.observacionesPago || '';

    if (!observacionesPago && factura.pagos && factura.pagos.length > 0) {
      const ultimoPago = factura.pagos[factura.pagos.length - 1];
      observacionesPago = ultimoPago.observaciones || '';
    }

    // Log para diagnóstico
    console.log('📋 Observaciones del pago obtenidas:', {
      desdeNivelSuperior: factura.observacionesPago,
      desdeUltimoPago:
              factura.pagos && factura.pagos.length > 0
                ? factura.pagos[factura.pagos.length - 1].observaciones
                : null,
      valorFinal: observacionesPago,
      longitud: observacionesPago ? observacionesPago.length : 0
    });

    if (observacionesPago && observacionesPago.trim() !== '') {
      // Escapar HTML para evitar problemas con caracteres especiales
      const escapeHtml = text => {
        if (!text) {
          return '';
        }
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };

      const observacionesEscapadas = escapeHtml(String(observacionesPago));

      return `
                <div class="row mt-3">
                    <div class="col-12">
                        <h6><i class="fas fa-sticky-note"></i> Observaciones del Pago</h6>
                        <div class="alert alert-info" style="white-space: pre-wrap; word-wrap: break-word;">${observacionesEscapadas}</div>
                    </div>
                </div>
                `;
    }
    return '';
  })()}
    `;

  const modal = new bootstrap.Modal(document.getElementById('modalDetallesFactura'));
  modal.show();
}

// Obtener texto del método de pago
function getMetodoPagoText(metodo) {
  const metodos = {
    transferencia: 'Transferencia Bancaria',
    cheque: 'Cheque',
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta de Crédito',
    otro: 'Otro'
  };
  return metodos[metodo] || metodo;
}

// Imprimir factura
function _imprimirFactura(facturaId) {
  const factura = facturasData.find(f => f.id === facturaId);
  if (!factura) {
    return;
  }

  // Crear ventana de impresión
  const ventanaImpresion = window.open('', '_blank');
  ventanaImpresion.document.write(`
        <html>
        <head>
            <title>Factura ${factura.numeroFactura}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .factura-info { margin-bottom: 20px; }
                .cliente-info { margin-bottom: 20px; }
                .total { font-size: 18px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ERP Rankiao</h1>
                <h2>FACTURA</h2>
            </div>
            
            <div class="factura-info">
                ${(() => {
    const numeroFacturaFormateado =
                    factura.serie && factura.folio
                      ? `${factura.serie}-${factura.folio}`
                      : factura.numeroFactura || 'N/A';
    // Obtener datos de facturación usando registroId
    let folioFiscalRaw = '';
    let numeroRegistro = '';

    if (factura.registroId && window.DataPersistence) {
      const datosFacturacion = window.DataPersistence.getFacturacionData(
        factura.registroId
      );
      if (datosFacturacion) {
        folioFiscalRaw =
                        datosFacturacion['Folio Fiscal'] || datosFacturacion.folioFiscal || '';
        numeroRegistro = datosFacturacion.numeroRegistro || '';
      }
    }

    // Si no se encontró, buscar directamente en la factura
    if (!folioFiscalRaw) {
      folioFiscalRaw = factura.folioFiscal || factura['Folio Fiscal'] || '';
    }
    if (!numeroRegistro) {
      numeroRegistro = factura.numeroRegistro || '';
    }

    const folioFiscalFormateado = folioFiscalRaw ? formatearUUID(folioFiscalRaw) : '';

    return `
                        <p><strong>Factura:</strong> ${numeroFacturaFormateado}</p>
                        ${folioFiscalFormateado ? `<p><strong>Folio Fiscal:</strong> <span style="color: black;">${folioFiscalFormateado}</span></p>` : ''}
                        ${numeroRegistro ? `<p><strong>N° Registro:</strong> ${numeroRegistro}</p>` : ''}
                        <p><strong>Fecha de Emisión:</strong> ${formatDate(factura.fechaEmision)}</p>
                        <p><strong>Fecha de Vencimiento:</strong> ${formatDate(factura.fechaVencimiento)}</p>
                    `;
  })()}
            </div>
            
            <div class="cliente-info">
                <h3>Cliente:</h3>
                <p><strong>${factura.cliente}</strong></p>
                <p>${factura.direccionCliente}</p>
                <p>Tel: ${factura.telefonoCliente}</p>
                <p>Email: ${factura.emailCliente}</p>
            </div>
            
            <table>
                <tr>
                    <th>Descripción</th>
                    <th>Monto</th>
                </tr>
                <tr>
                    <td>${factura.descripcion}</td>
                    <td>$${formatCurrency(factura.monto)}</td>
                </tr>
            </table>
            
            <div class="total">
                <p>Total: $${formatCurrency(factura.monto)}</p>
            </div>
            
            ${
  factura.estado === 'pagado' || factura.estado === 'pagada'
    ? `
            <div style="margin-top: 30px; padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb;">
                <h4>PAGO RECIBIDO</h4>
                <p><strong>Fecha de Pago:</strong> ${formatDate(factura.fechaPago)}</p>
                <p><strong>Método:</strong> ${getMetodoPagoText(factura.metodoPago)}</p>
                ${factura.bancoOrigenPago ? `<p><strong>Banco Origen:</strong> ${factura.bancoOrigenPago}</p>` : ''}
                ${factura.cuentaPago ? `<p><strong>Cuenta Origen:</strong> ${factura.cuentaPago}</p>` : ''}
                ${factura.bancoDestinoPago ? `<p><strong>Banco Destino:</strong> ${factura.bancoDestinoPago}</p>` : ''}
                ${factura.cuentaDestinoPago ? `<p><strong>Cuenta Destino:</strong> ${factura.cuentaDestinoPago}</p>` : ''}
                ${factura.referenciaPago ? `<p><strong>Referencia:</strong> ${factura.referenciaPago}</p>` : ''}
            </div>
            `
    : ''
}
        </body>
        </html>
    `);

  ventanaImpresion.document.close();
  ventanaImpresion.print();
}

// Descargar PDF de factura CXC
async function _descargarPDFFacturaCXC(facturaId) {
  console.log(`📄 Descargando PDF de la factura CXC: ${facturaId}`);

  const factura = facturasData.find(f => f.id === facturaId);
  if (!factura) {
    alert('Factura no encontrada');
    return;
  }

  try {
    // Cargar jsPDF si no está disponible
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración
    const margin = 20;
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const col1X = margin + 5;
    const col2X = pageWidth / 2 + 10;

    // Función auxiliar para formatear fechas
    function formatearFecha(fechaStr) {
      if (!fechaStr) {
        return 'N/A';
      }
      try {
        if (typeof fechaStr === 'string') {
          if (fechaStr.includes('T')) {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-MX', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
          }
          const fecha = new Date(`${fechaStr}T00:00:00`);
          return fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (error) {
        return String(fechaStr);
      }
    }

    // Función auxiliar para obtener valor o 'N/A'
    function obtenerValor(valor) {
      return valor !== undefined && valor !== null && valor !== '' ? valor : 'N/A';
    }

    // Función auxiliar para formatear montos con separadores de miles
    function formatearMonto(monto) {
      return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parseFloat(monto || 0));
    }

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CUENTAS POR COBRAR', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Información de la Factura
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN DE LA FACTURA', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Guardar posición inicial para ambas columnas
    const startY = yPosition;
    let leftY = startY;
    let rightY = startY;

    // Columna izquierda
    const numeroFactura =
      factura.serie && factura.folio
        ? `${factura.serie}-${factura.folio}`
        : factura.numeroFactura || 'N/A';
    doc.text(`Factura: ${numeroFactura}`, col1X, leftY);
    leftY += 6;

    // Obtener datos de facturación usando registroId para obtener Folio Fiscal y numeroRegistro
    let folioFiscalRaw = '';
    let numeroRegistro = '';

    if (factura.registroId) {
      // Intentar obtener desde localStorage
      if (window.DataPersistence) {
        const datosFacturacion = window.DataPersistence.getFacturacionData(factura.registroId);
        if (datosFacturacion) {
          folioFiscalRaw = datosFacturacion['Folio Fiscal'] || datosFacturacion.folioFiscal || '';
          numeroRegistro = datosFacturacion.numeroRegistro || '';
        }
      }

      // Intentar obtener desde Firebase si no se encontró en localStorage
      if ((!folioFiscalRaw || !numeroRegistro) && window.firebaseRepos?.facturacion) {
        try {
          const allRegistros = await window.firebaseRepos.facturacion.getAllRegistros();
          const registroFacturacion = allRegistros.find(
            r =>
              (r.numeroRegistro && String(r.numeroRegistro) === String(factura.registroId)) ||
              (r.id && String(r.id) === String(factura.registroId)) ||
              (r.registroId && String(r.registroId) === String(factura.registroId))
          );

          if (registroFacturacion) {
            if (!folioFiscalRaw) {
              folioFiscalRaw =
                registroFacturacion['Folio Fiscal'] || registroFacturacion.folioFiscal || '';
            }
            if (!numeroRegistro) {
              numeroRegistro = registroFacturacion.numeroRegistro || '';
            }
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo datos de facturación desde Firebase:', error);
        }
      }
    }

    // Si aún no se encontró, buscar directamente en la factura
    if (!folioFiscalRaw) {
      folioFiscalRaw = factura.folioFiscal || factura['Folio Fiscal'] || factura.uuid || '';
    }
    if (!numeroRegistro) {
      numeroRegistro = factura.numeroRegistro || '';
    }

    const folioFiscalFormateado = folioFiscalRaw ? formatearUUID(folioFiscalRaw) : '';

    // Agregar Folio Fiscal si existe
    if (folioFiscalFormateado) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Folio Fiscal: ${folioFiscalFormateado}`, col1X, leftY);
      leftY += 6;
      doc.setFontSize(10);
    }

    // Agregar N° Registro si existe
    if (numeroRegistro) {
      doc.text(`N° Registro: ${numeroRegistro}`, col1X, leftY);
      leftY += 6;
    }

    doc.text(`Fecha de Emisión: ${formatearFecha(factura.fechaEmision)}`, col1X, leftY);
    leftY += 6;
    doc.text(`Fecha de Vencimiento: ${formatearFecha(factura.fechaVencimiento)}`, col1X, leftY);
    leftY += 6;

    // Columna derecha
    const montoTotal = factura.monto || 0;
    const montoPagado = factura.montoPagado || 0;
    const montoPendiente =
      factura.montoPendiente !== undefined ? factura.montoPendiente : montoTotal - montoPagado;

    doc.text(`Monto Total: $${formatearMonto(montoTotal)}`, col2X, rightY);
    rightY += 6;
    doc.text(`Monto Pagado: $${formatearMonto(montoPagado)}`, col2X, rightY);
    rightY += 6;
    doc.text(`Monto Pendiente: $${formatearMonto(montoPendiente)}`, col2X, rightY);
    rightY += 6;

    // Agregar Cliente y Estado
    doc.text(`Cliente: ${obtenerValor(factura.cliente)}`, col1X, leftY);
    leftY += 6;

    const estadoText =
      factura.estado === 'pagado' || factura.estado === 'pagada'
        ? 'Pagado'
        : factura.estado === 'vencido'
          ? 'Vencido'
          : 'Pendiente';
    doc.text(`Estado: ${estadoText}`, col1X, leftY);
    leftY += 6;

    // Usar la posición más baja de las dos columnas para continuar
    yPosition = Math.max(leftY, rightY) + 10;

    yPosition += 5;

    // Historial de Pagos
    const pagos = factura.pagos || [];
    if (pagos.length > 0) {
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('HISTORIAL DE PAGOS', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Encabezados de tabla
      const tableStartX = margin;
      const colFecha = tableStartX;
      const colMonto = tableStartX + 50;
      const colMetodo = tableStartX + 90;
      const colReferencia = tableStartX + 140;

      // Línea de encabezado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Fecha', colFecha, yPosition);
      doc.text('Monto', colMonto, yPosition);
      doc.text('Método', colMetodo, yPosition);
      doc.text('Referencia', colReferencia, yPosition);
      yPosition += 6;

      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4;

      // Filas de pagos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      // Función auxiliar para obtener texto del método de pago
      function obtenerMetodoPago(metodo) {
        const metodos = {
          transferencia: 'Transferencia',
          cheque: 'Cheque',
          efectivo: 'Efectivo',
          tarjeta: 'Tarjeta',
          otro: 'Otro'
        };
        return metodos[metodo] || metodo || '-';
      }

      pagos.forEach(pago => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        const fechaPago = formatearFecha(pago.fecha);
        const montoPago = formatearMonto(pago.monto);
        const metodoPago = obtenerMetodoPago(pago.metodo);
        const referenciaPago = pago.referencia || '-';

        doc.text(fechaPago, colFecha, yPosition);
        doc.text(`$${montoPago}`, colMonto, yPosition);

        // Truncar método y referencia si son muy largos
        const metodoTruncado =
          metodoPago.length > 15 ? `${metodoPago.substring(0, 12)}...` : metodoPago;
        const referenciaTruncada =
          referenciaPago.length > 20 ? `${referenciaPago.substring(0, 17)}...` : referenciaPago;

        doc.text(metodoTruncado, colMetodo, yPosition);
        doc.text(referenciaTruncada, colReferencia, yPosition);
        yPosition += 6;
      });

      yPosition += 5;
    } else {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('HISTORIAL DE PAGOS', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No hay pagos registrados', margin, yPosition);
      yPosition += 10;
    }

    // Descripción
    if (factura.descripcion) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DESCRIPCIÓN', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      const splitDescripcion = doc.splitTextToSize(factura.descripcion, pageWidth - 2 * margin);
      doc.text(splitDescripcion, margin, yPosition);
      yPosition += splitDescripcion.length * 5 + 5;
    }

    // Información de Pago (si existe)
    if (
      factura.fechaPago ||
      factura.metodoPago ||
      factura.bancoOrigenPago ||
      factura.cuentaPago ||
      factura.bancoDestinoPago ||
      factura.cuentaDestinoPago ||
      factura.referenciaPago ||
      factura.observacionesPago
    ) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE PAGO', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Guardar posición inicial para ambas columnas
      const startYPago = yPosition;
      let leftYPago = startYPago;
      let rightYPago = startYPago;

      // Función auxiliar para obtener texto del método de pago
      function obtenerMetodoPagoTexto(metodo) {
        const metodos = {
          transferencia: 'Transferencia Bancaria',
          cheque: 'Cheque',
          efectivo: 'Efectivo',
          tarjeta: 'Tarjeta de Crédito',
          otro: 'Otro'
        };
        return metodos[metodo] || metodo || 'N/A';
      }

      // Columna izquierda
      if (factura.fechaPago) {
        doc.text(`Fecha de Pago: ${formatearFecha(factura.fechaPago)}`, col1X, leftYPago);
        leftYPago += 6;
      }

      if (factura.metodoPago) {
        doc.text(`Método de Pago: ${obtenerMetodoPagoTexto(factura.metodoPago)}`, col1X, leftYPago);
        leftYPago += 6;
      }

      if (factura.bancoOrigenPago) {
        doc.text(`Banco Origen: ${obtenerValor(factura.bancoOrigenPago)}`, col1X, leftYPago);
        leftYPago += 6;
      }

      if (factura.cuentaPago) {
        doc.text(`Cuenta Origen: ${obtenerValor(factura.cuentaPago)}`, col1X, leftYPago);
        leftYPago += 6;
      }

      // Columna derecha
      if (factura.bancoDestinoPago) {
        doc.text(`Banco Destino: ${obtenerValor(factura.bancoDestinoPago)}`, col2X, rightYPago);
        rightYPago += 6;
      }

      if (factura.cuentaDestinoPago) {
        doc.text(`Cuenta Destino: ${obtenerValor(factura.cuentaDestinoPago)}`, col2X, rightYPago);
        rightYPago += 6;
      }

      if (factura.referenciaPago) {
        doc.text(`Referencia: ${obtenerValor(factura.referenciaPago)}`, col2X, rightYPago);
        rightYPago += 6;
      }

      // Usar la posición más baja de las dos columnas para continuar
      yPosition = Math.max(leftYPago, rightYPago) + 5;

      // Observaciones (puede ser largo, así que va en una línea completa)
      if (factura.observacionesPago) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text('Observaciones:', margin, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        const splitObservaciones = doc.splitTextToSize(
          factura.observacionesPago,
          pageWidth - 2 * margin
        );
        doc.text(splitObservaciones, margin, yPosition);
        yPosition += splitObservaciones.length * 5 + 5;
      }
    }

    // Guardar PDF
    const nombreArchivo = `Factura_${numeroFactura.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
  } catch (error) {
    console.error('❌ Error generando PDF de la factura:', error);
    alert('Error al generar PDF de la factura');
  }
}

// Función para asegurar que XLSX esté disponible
function ensureXLSX(then) {
  if (window.XLSX) {
    then();
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js';
  s.onload = () => then();
  s.onerror = () => then(new Error('No se pudo cargar SheetJS'));
  document.head.appendChild(s);
}

// Exportar datos de CXC a Excel
async function _exportCXCData() {
  if (!facturasFiltradas || facturasFiltradas.length === 0) {
    alert('No hay facturas para exportar.');
    return;
  }

  // Función auxiliar para formatear fechas
  function formatearFecha(fechaStr) {
    if (!fechaStr) {
      return '';
    }
    try {
      if (typeof fechaStr === 'string') {
        if (fechaStr.includes('T')) {
          const fecha = new Date(fechaStr);
          return fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
        const fecha = new Date(`${fechaStr}T00:00:00`);
        return fecha.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return String(fechaStr);
    }
  }

  // Función auxiliar para formatear estado
  function formatearEstado(estado) {
    const estados = {
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      vencido: 'Vencido',
      parcial: 'Pago Parcial'
    };
    return estados[estado] || estado || '';
  }

  // Función auxiliar para calcular montos
  function calcularMontos(factura) {
    const montoTotal = factura.monto || 0;
    const montoPagado = factura.montoPagado || 0;
    const montoPendiente =
      factura.montoPendiente !== undefined ? factura.montoPendiente : montoTotal - montoPagado;
    return {
      montoTotal: parseFloat(montoTotal).toFixed(2),
      montoPagado: parseFloat(montoPagado).toFixed(2),
      montoPendiente: parseFloat(montoPendiente).toFixed(2)
    };
  }

  // Función auxiliar para formatear UUID (si no está disponible globalmente)
  function formatearUUIDLocal(uuid) {
    if (!uuid) {
      return '';
    }
    // Si ya tiene guiones, retornarlo tal cual
    if (uuid.includes('-')) {
      return uuid;
    }
    // Si no tiene guiones, formatearlo: 8-4-4-4-12
    const uuidSinGuiones = uuid.replace(/-/g, '');
    if (uuidSinGuiones.length === 32) {
      return `${uuidSinGuiones.substring(0, 8)}-${uuidSinGuiones.substring(8, 12)}-${uuidSinGuiones.substring(12, 16)}-${uuidSinGuiones.substring(16, 20)}-${uuidSinGuiones.substring(20, 32)}`;
    }
    return uuid;
  }

  // Función auxiliar para obtener número de registro y folio fiscal
  async function obtenerDatosFacturacion(factura) {
    let numeroRegistro = '';
    let folioFiscal = '';

    // Intentar obtener desde la factura directamente
    numeroRegistro = factura.numeroRegistro || '';
    folioFiscal = factura.folioFiscal || factura['Folio Fiscal'] || factura.uuid || '';

    // Si no están en la factura, buscar en Firebase (PRIORIDAD)
    if (!numeroRegistro || !folioFiscal) {
      try {
        // PRIORIDAD 1: Buscar en Firebase (repositorio de facturación)
        if (window.firebaseRepos?.facturacion && factura.registroId) {
          const repoFacturacion = window.firebaseRepos.facturacion;

          // Esperar inicialización si es necesario
          let attempts = 0;
          while (attempts < 5 && (!repoFacturacion.db || !repoFacturacion.tenantId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof repoFacturacion.init === 'function') {
              try {
                await repoFacturacion.init();
              } catch (e) {
                // Ignorar error intencionalmente
              }
            }
          }

          if (repoFacturacion.db && repoFacturacion.tenantId) {
            try {
              const registroData = await repoFacturacion.get(factura.registroId);
              if (registroData) {
                if (!numeroRegistro) {
                  numeroRegistro = registroData.numeroRegistro || factura.registroId || '';
                }
                if (!folioFiscal) {
                  folioFiscal =
                    registroData['Folio Fiscal'] ||
                    registroData.folioFiscal ||
                    registroData.uuid ||
                    '';
                }
              }
            } catch (e) {
              console.debug('⚠️ Error obteniendo registro desde Firebase:', e);
            }
          }
        }

        // PRIORIDAD 2: Buscar en Firebase por número de factura o serie-folio
        if ((!numeroRegistro || !folioFiscal) && window.firebaseRepos?.facturacion) {
          const repoFacturacion = window.firebaseRepos.facturacion;
          if (repoFacturacion.db && repoFacturacion.tenantId) {
            try {
              const numeroFacturaBuscar =
                factura.serie && factura.folio
                  ? `${factura.serie}-${factura.folio}`
                  : factura.numeroFactura || '';

              if (numeroFacturaBuscar) {
                // Buscar por serie-folio o número de factura
                const registros = await repoFacturacion.getAllRegistros();
                const registroEncontrado = registros.find(r => {
                  const serieFolioRegistro =
                    r.serie && r.folio ? `${r.serie}-${r.folio}` : r.numeroFactura || '';
                  return (
                    serieFolioRegistro === numeroFacturaBuscar ||
                    r.numeroFactura === numeroFacturaBuscar
                  );
                });

                if (registroEncontrado) {
                  if (!numeroRegistro) {
                    numeroRegistro =
                      registroEncontrado.numeroRegistro || registroEncontrado.id || '';
                  }
                  if (!folioFiscal) {
                    folioFiscal =
                      registroEncontrado['Folio Fiscal'] ||
                      registroEncontrado.folioFiscal ||
                      registroEncontrado.uuid ||
                      '';
                  }
                }
              }
            } catch (e) {
              console.debug('⚠️ Error buscando registro por número de factura en Firebase:', e);
            }
          }
        }
      } catch (error) {
        console.debug('⚠️ Error obteniendo datos de facturación desde Firebase:', error);
      }
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores

    // También intentar desde DataPersistence si aún no tenemos los datos (solo como último recurso)
    if (
      (!numeroRegistro || !folioFiscal) &&
      factura.registroId &&
      window.DataPersistence &&
      typeof window.DataPersistence.getFacturacionData === 'function'
    ) {
      try {
        const datosFacturacion = window.DataPersistence.getFacturacionData(factura.registroId);
        if (datosFacturacion) {
          if (!numeroRegistro) {
            numeroRegistro = datosFacturacion.numeroRegistro || '';
          }
          if (!folioFiscal) {
            folioFiscal =
              datosFacturacion['Folio Fiscal'] ||
              datosFacturacion.folioFiscal ||
              datosFacturacion.uuid ||
              '';
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo datos de facturación desde DataPersistence:', error);
      }
    }

    // Formatear folio fiscal si existe
    if (folioFiscal) {
      // Usar la función local o la global si está disponible
      if (typeof formatearUUID === 'function') {
        folioFiscal = formatearUUID(folioFiscal);
      } else {
        folioFiscal = formatearUUIDLocal(folioFiscal);
      }
    }

    return {
      numeroRegistro: String(numeroRegistro || ''),
      folioFiscal: String(folioFiscal || '')
    };
  }

  // Obtener datos de facturación de forma asíncrona para todas las facturas
  const datosFacturacionPromises = facturasFiltradas.map(factura =>
    obtenerDatosFacturacion(factura)
  );
  const datosFacturacionArray = await Promise.all(datosFacturacionPromises);

  const rows = facturasFiltradas.map((factura, index) => {
    const montos = calcularMontos(factura);
    const datosFacturacion = datosFacturacionArray[index];

    // Obtener observaciones: primero del nivel superior, si no del último pago
    let observaciones = factura.observacionesPago || factura.observaciones || '';

    // Si no hay observaciones en el nivel superior, buscar en el array pagos
    if (!observaciones && factura.pagos && factura.pagos.length > 0) {
      const ultimoPago = factura.pagos[factura.pagos.length - 1];
      observaciones = ultimoPago.observaciones || '';
    }

    return {
      'N° Registro': datosFacturacion.numeroRegistro,
      'Fecha de Emisión': formatearFecha(factura.fechaEmision),
      'Folio Fiscal': datosFacturacion.folioFiscal,
      Serie: factura.serie || '',
      Folio: factura.folio || factura.numeroFactura || '',
      Cliente: factura.cliente || '',
      'Fecha de Vencimiento': formatearFecha(factura.fechaVencimiento),
      Estado: formatearEstado(factura.estado),
      'Monto Total': montos.montoTotal,
      'Monto Pagado': montos.montoPagado,
      'Monto Pendiente': montos.montoPendiente,
      Observaciones: observaciones
    };
  });

  const filename = `cuentas_por_cobrar_${new Date().toISOString().split('T')[0]}.xlsx`;

  ensureXLSX(err => {
    if (err || !window.XLSX) {
      // Si no hay XLSX, exportar como CSV
      const csvContent = [
        Object.keys(rows[0]).join(','),
        ...rows.map(row =>
          Object.values(row)
            .map(val => {
              // Escapar comillas y valores que contengan comas
              const str = String(val || '');
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(',')
        )
      ].join('\n');

      const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename.replace('.xlsx', '.csv'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Cuentas por Cobrar');
      XLSX.writeFile(wb, filename);

      // Mostrar notificación
      if (typeof window.showNotification === 'function') {
        window.showNotification('Datos exportados correctamente a Excel', 'success');
      } else {
        alert('Datos exportados correctamente a Excel');
      }
    } catch (e) {
      console.error('Error exportando a Excel:', e);
      alert('Error al exportar a Excel. Intenta exportar como CSV.');
    }
  });
}

// Cargar facturas desde Firebase primero, luego localStorage
async function loadFacturasFromStorage() {
  console.log('📂 Cargando facturas CXC desde facturación...');

  try {
    // PRIORIDAD 1: Cargar desde la colección de facturación en Firebase
    if (window.firebaseRepos && window.firebaseRepos.facturacion) {
      try {
        const repoFacturacion = window.firebaseRepos.facturacion;

        // Esperar inicialización
        let attempts = 0;
        while (attempts < 10 && (!repoFacturacion.db || !repoFacturacion.tenantId)) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 300));
          if (typeof repoFacturacion.init === 'function') {
            try {
              await repoFacturacion.init();
            } catch (e) {
              // Ignorar error intencionalmente
            }
          }
        }

        if (repoFacturacion.db && repoFacturacion.tenantId) {
          console.log('📊 Cargando registros de facturación desde Firebase...', {
            db: Boolean(repoFacturacion.db),
            tenantId: repoFacturacion.tenantId,
            collectionName: repoFacturacion.collectionName
          });
          // Obtener todos los registros de facturación (tipo 'registro')
          const registrosFacturacion = await repoFacturacion.getAllRegistros();
          console.log('📋 Registros de facturación obtenidos:', registrosFacturacion?.length || 0);
          if (registrosFacturacion && registrosFacturacion.length > 0) {
            console.log(
              '📋 Primeros registros:',
              registrosFacturacion.slice(0, 3).map(r => ({
                id: r.id,
                numeroRegistro: r.numeroRegistro,
                serie: r.serie,
                folio: r.folio,
                cliente: r.Cliente || r.cliente,
                total: r['total factura'] || r.total
              }))
            );
          }

          // Obtener facturas con pagos desde CXC para combinar
          let facturasConPagos = [];
          if (window.firebaseRepos?.cxc?.db && window.firebaseRepos?.cxc?.tenantId) {
            try {
              facturasConPagos = await window.firebaseRepos.cxc.getAllFacturas();
              console.log(
                '📋 Facturas con pagos obtenidas para combinar:',
                facturasConPagos?.length || 0
              );
            } catch (e) {
              console.warn('⚠️ Error obteniendo facturas con pagos:', e);
            }
          }

          // Crear un mapa de facturas con pagos por registroId
          const pagosMap = new Map();
          facturasConPagos.forEach(f => {
            if (f.registroId) {
              pagosMap.set(f.registroId, {
                montoPagado: parseFloat(f.montoPagado) || 0,
                montoPendiente:
                  parseFloat(f.montoPendiente) ||
                  (parseFloat(f.monto) || 0) - (parseFloat(f.montoPagado) || 0),
                estado: f.estado || 'pendiente',
                pagos: f.pagos || []
              });
            }
          });

          // Transformar registros de facturación al formato de CXC
          if (registrosFacturacion && registrosFacturacion.length > 0) {
            console.log(`✅ ${registrosFacturacion.length} registros de facturación encontrados`);

            // Función para limpiar formato de moneda
            const limpiarMoneda = valor => {
              if (!valor) {
                return 0;
              }
              if (typeof valor === 'number') {
                return valor;
              }
              if (typeof valor === 'string') {
                const limpio = valor.replace(/[$,]/g, '').trim();
                const numero = parseFloat(limpio);
                return isNaN(numero) ? 0 : numero;
              }
              return 0;
            };

            // Función para calcular fecha de vencimiento
            const calcularFechaVencimiento = (fechaFactura, diasCredito = 30) => {
              if (!fechaFactura) {
                return null;
              }
              const fecha = new Date(fechaFactura);
              fecha.setDate(fecha.getDate() + diasCredito);
              return fecha.toISOString().split('T')[0];
            };

            // Transformar cada registro de facturación a formato CXC
            const facturasTransformadas = await Promise.all(
              registrosFacturacion.map(async registro => {
                const registroId = registro.numeroRegistro || registro.id;
                const montoTotal = limpiarMoneda(registro['total factura'] || registro.total || 0);
                const serie = registro.serie || '';
                const folio = registro.folio || '';
                const numeroFactura =
                  serie && folio
                    ? `${serie}-${folio}`
                    : registro.numeroFactura || `FAC-${registro.numeroRegistro || registro.id}`;

                // Obtener días de crédito del cliente usando sistema de caché (por defecto 30)
                let diasCredito = 30;
                try {
                  const clienteRFC = registro.Cliente || registro.cliente;
                  if (clienteRFC) {
                    const clientes = await window.getDataWithCache('clientes', async () => {
                      if (
                        window.configuracionManager &&
                        typeof window.configuracionManager.getAllClientes === 'function'
                      ) {
                        return window.configuracionManager.getAllClientes() || [];
                      }
                      return [];
                    });

                    const clienteData = clientes.find(
                      c => c.rfc === clienteRFC || c.id === clienteRFC
                    );
                    if (clienteData && clienteData.diasCredito) {
                      diasCredito = clienteData.diasCredito;
                    }
                  }
                } catch (e) {
                  console.warn('⚠️ Error obteniendo días de crédito:', e);
                }

                const fechaFactura =
                  registro.fechaFactura ||
                  registro.fecha ||
                  registro.fechaCreacion ||
                  new Date().toISOString().split('T')[0];
                const fechaVencimiento = calcularFechaVencimiento(fechaFactura, diasCredito);

                // Obtener información de pagos si existe
                const infoPagos = pagosMap.get(registroId);
                const montoPagado = infoPagos ? infoPagos.montoPagado : 0;
                const montoPendiente = infoPagos ? infoPagos.montoPendiente : montoTotal;
                const estado = infoPagos ? infoPagos.estado : 'pendiente';
                const pagos = infoPagos ? infoPagos.pagos : [];

                return {
                  id: registroId,
                  numeroFactura: numeroFactura,
                  serie: serie,
                  folio: folio,
                  folioFiscal: registro.folioFiscal || registro['Folio Fiscal'] || '',
                  fechaFactura: fechaFactura,
                  fechaEmision:
                    registro.fechaCreacion ||
                    fechaFactura ||
                    new Date().toISOString().split('T')[0],
                  fechaVencimiento: fechaVencimiento,
                  cliente: registro.Cliente || registro.cliente || 'N/A',
                  monto: montoTotal,
                  saldo: montoTotal,
                  montoPagado: montoPagado,
                  montoPendiente: montoPendiente,
                  estado: estado,
                  diasCredito: diasCredito,
                  tipo: 'factura',
                  origen: 'facturacion',
                  registroId: registroId,
                  subtotal: limpiarMoneda(registro.Subtotal || 0),
                  iva: limpiarMoneda(registro.iva || 0),
                  ivaRetenido: limpiarMoneda(registro['iva retenido'] || 0),
                  isrRetenido: limpiarMoneda(registro['isr retenido'] || 0),
                  otrosMontos: limpiarMoneda(registro['Otros Montos'] || 0),
                  tipoMoneda: registro.tipoMoneda || registro.moneda || 'MXN',
                  tipoCambio: registro.tipoCambio || '',
                  fechaCreacion: registro.fechaCreacion || new Date().toISOString(),
                  ultimaActualizacion:
                    registro.fechaActualizacion ||
                    registro.ultimaActualizacion ||
                    new Date().toISOString(),
                  pagos: pagos // Los pagos se obtienen de CXC
                };
              })
            );

            console.log('📋 Facturas transformadas:', facturasTransformadas.length);
            console.log(
              '📋 Primeras facturas transformadas:',
              facturasTransformadas.slice(0, 3).map(f => ({
                id: f.id,
                numeroFactura: f.numeroFactura,
                serie: f.serie,
                folio: f.folio,
                cliente: f.cliente,
                monto: f.monto
              }))
            );

            // Actualizar facturasData con los datos transformados
            facturasData = facturasTransformadas.map(factura => {
              // Asegurar que montoPagado y montoPendiente estén inicializados
              const monto = parseFloat(factura.monto) || 0;
              const montoPagado = parseFloat(factura.montoPagado) || 0;
              const montoPendiente =
                factura.montoPendiente !== undefined
                  ? parseFloat(factura.montoPendiente)
                  : monto - montoPagado;

              return {
                ...factura,
                monto: monto,
                montoPagado: montoPagado,
                montoPendiente: montoPendiente >= 0 ? montoPendiente : monto - montoPagado,
                pagos: factura.pagos || [],
                diasVencidos: calcularDiasVencidos(factura.fechaVencimiento, factura.estado)
              };
            });

            // Actualizar facturasFiltradas
            facturasFiltradas = [...facturasData];

            // NO USAR localStorage - Solo Firebase es la fuente de verdad
            // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

            console.log('✅ Facturas CXC cargadas desde facturación:', facturasData.length);

            // Asegurar que se actualice la tabla y el resumen después de cargar
            setTimeout(() => {
              loadFacturas();
              updateCXCSummary();
            }, 100);

            return;
          }
          console.log('📋 No se encontraron registros de facturación en Firebase');
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde Firebase facturación, usando localStorage:', error);
      }
    }

    // También intentar cargar desde CXC (para facturas con pagos registrados)
    if (window.firebaseRepos && window.firebaseRepos.cxc) {
      try {
        const repoCXC = window.firebaseRepos.cxc;

        // Esperar inicialización
        let attempts = 0;
        while (attempts < 10 && (!repoCXC.db || !repoCXC.tenantId)) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 300));
          if (typeof repoCXC.init === 'function') {
            try {
              await repoCXC.init();
            } catch (e) {
              // Ignorar error intencionalmente
            }
          }
        }

        if (repoCXC.db && repoCXC.tenantId) {
          console.log('📊 Cargando facturas con pagos desde Firebase CXC...');
          const facturasConPagos = await repoCXC.getAllFacturas();
          console.log('📋 Facturas con pagos obtenidas:', facturasConPagos?.length || 0);

          // Las facturas con pagos se combinarán con las de facturación en el listener
          // Por ahora, solo las guardamos para referencia
          if (facturasConPagos && facturasConPagos.length > 0) {
            console.log(`✅ ${facturasConPagos.length} facturas con pagos encontradas en CXC`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde Firebase, usando localStorage:', error);
      }
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
    console.warn('⚠️ No se encontraron facturas en Firebase');
    console.warn(
      '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
    );

    // Las facturas solo se cargan desde Firebase ahora
    facturasData = [];
    facturasFiltradas = [];
  } catch (error) {
    console.error('❌ Error al cargar facturas:', error);
    // Mantener facturasData vacío para que se carguen datos de ejemplo
    facturasData = [];
    facturasFiltradas = [];
  }
}

// Función para sincronizar facturas de localStorage a Firebase
window.sincronizarFacturasCXC = async function () {
  try {
    // Verificar si se limpiaron los datos operativos (flag local)
    const datosLimpios = localStorage.getItem('datos_operativos_limpiados');

    // Verificar si Firebase está vacío y hay conexión
    const hayConexion = navigator.onLine;
    let firebaseVacio = false;
    if (window.firebaseRepos?.cxc) {
      try {
        const repoCXC = window.firebaseRepos.cxc;
        if (repoCXC.db && repoCXC.tenantId) {
          const facturasFirebase = await repoCXC.getAllFacturas();
          firebaseVacio = !facturasFirebase || facturasFirebase.length === 0;
        }
      } catch (error) {
        console.warn('⚠️ Error verificando Firebase:', error);
      }
    }

    if (datosLimpios === 'true' || (firebaseVacio && hayConexion)) {
      const razon =
        datosLimpios === 'true'
          ? 'Datos operativos fueron limpiados (flag local)'
          : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
      console.log(`⚠️ ${razon}. No se sincronizará desde localStorage a Firebase para CXC.`);
      return { sincronizadas: 0, errores: 0 };
    }

    console.log('🔄 Sincronizando facturas CXC desde variable global a Firebase...');

    // Usar variable global cargada desde Firebase (NO localStorage)
    const facturasLocal = facturasData || [];
    console.log(`📋 Facturas en variable global: ${facturasLocal.length}`);

    if (facturasLocal.length === 0) {
      console.log('✅ No hay facturas para sincronizar');
      return { sincronizadas: 0, errores: 0 };
    }

    // Verificar que el repositorio esté disponible
    if (!window.firebaseRepos?.cxc) {
      console.error('❌ Repositorio de Firebase CXC no disponible');
      console.log('⏳ Esperando a que se carguen los repositorios...');

      // Esperar a que los repositorios se carguen
      let waitAttempts = 0;
      while (waitAttempts < 20 && !window.firebaseRepos?.cxc) {
        waitAttempts++;
        console.log(`⏳ Esperando repositorios... (${waitAttempts}/20)`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!window.firebaseRepos?.cxc) {
        console.error('❌ Repositorio de Firebase CXC no disponible después de esperar');
        return { sincronizadas: 0, errores: facturasLocal.length };
      }
    }

    // Esperar a que el repositorio esté inicializado
    let attempts = 0;
    while (attempts < 10 && (!window.firebaseRepos.cxc.db || !window.firebaseRepos.cxc.tenantId)) {
      attempts++;
      console.log(`⏳ Esperando inicialización del repositorio CXC... (${attempts}/10)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      await window.firebaseRepos.cxc.init();
    }

    if (!window.firebaseRepos.cxc.db || !window.firebaseRepos.cxc.tenantId) {
      throw new Error('Repositorio CXC no inicializado después de 5 segundos');
    }

    let sincronizadas = 0;
    let errores = 0;

    // Sincronizar cada factura
    for (const factura of facturasLocal) {
      try {
        const facturaId = factura.id
          ? `factura_${factura.id}`
          : `factura_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Asegurar que tenga el tipo correcto
        const facturaData = {
          ...factura,
          tipo: 'factura',
          fechaCreacion: factura.fechaCreacion || new Date().toISOString()
        };

        console.log(`💾 Sincronizando factura ${facturaId}...`);
        const resultado = await window.firebaseRepos.cxc.saveFactura(facturaId, facturaData);

        if (resultado) {
          sincronizadas++;
          console.log(`✅ Factura ${factura.numeroFactura} sincronizada`);
        } else {
          errores++;
          console.warn(`⚠️ Factura ${factura.numeroFactura} no se pudo sincronizar`);
        }
      } catch (error) {
        errores++;
        console.error('❌ Error sincronizando factura:', error);
      }
    }

    console.log(`✅ Sincronización completada: ${sincronizadas} sincronizadas, ${errores} errores`);

    // Recargar facturas después de sincronizar
    if (typeof loadFacturasFromStorage === 'function') {
      await loadFacturasFromStorage();
      if (typeof loadFacturas === 'function') {
        loadFacturas();
        if (typeof updateCXCSummary === 'function') {
          updateCXCSummary();
        }
      }
    }

    return { sincronizadas, errores };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    // Usar variable global en lugar de localStorage
    const facturasLocal = facturasData || [];
    return { sincronizadas: 0, errores: facturasLocal.length };
  }
};

// Calcular días vencidos
function calcularDiasVencidos(fechaVencimiento, estado) {
  // Si la factura está pagada, retornar null para mostrar "-"
  if (estado === 'pagado' || estado === 'pagada') {
    return null;
  }

  // Solo calcular si el estado es "pendiente" o "vencido"
  if (estado !== 'pendiente' && estado !== 'vencido') {
    return null;
  }

  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);

  // Normalizar fechas a medianoche para comparación precisa
  hoy.setHours(0, 0, 0, 0);
  vencimiento.setHours(0, 0, 0, 0);

  // Calcular diferencia: fecha de vencimiento - fecha de hoy
  // Si es positivo: días restantes para vencer (ej: vence 15/12, hoy 05/12 = 10 días para vencer)
  // Si es negativo: días vencidos (ej: vence 04/12, hoy 05/12 = -1 día, 1 día vencido)
  const diffTime = vencimiento - hoy;
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Si es negativo (ya venció), sumar 1 para ajustar
  if (diffDays < 0) {
    diffDays = diffDays + 1;
  }

  // Retornar: Positivo = días restantes, Negativo = días vencidos
  return diffDays;
}

// Limpiar datos de ejemplo y mostrar solo facturas reales
function _limpiarDatosEjemplo() {
  console.log('🧹 Limpiando datos de ejemplo...');

  try {
    // Usar variable global cargada desde Firebase (NO localStorage)
    if (facturasData && facturasData.length > 0) {
      console.log(`📋 Mostrando solo ${facturasData.length} facturas reales`);

      // Actualizar facturasData solo con datos reales (filtrar si es necesario)
      facturasData = facturasData.map(factura => ({
        ...factura,
        diasVencidos: calcularDiasVencidos(factura.fechaVencimiento, factura.estado)
      }));

      // Ordenar facturas por número (del más reciente al más antiguo)
      facturasData = ordenarFacturasPorNumero(facturasData);

      // Actualizar facturasFiltradas
      facturasFiltradas = [...facturasData];

      // Recargar la tabla
      loadFacturas();

      // Actualizar resumen
      updateCXCSummary();

      // Mostrar notificación
      if (
        typeof window.showNotification === 'function' &&
        window.showNotification !== showNotification
      ) {
        window.showNotification(`Mostrando ${cxcData.length} facturas reales`, 'info');
      } else {
        alert(`Mostrando ${cxcData.length} facturas reales`);
      }
    } else {
      console.log('📭 No hay facturas reales en localStorage');

      // Limpiar todo
      facturasData = [];
      facturasFiltradas = [];

      // Recargar la tabla
      loadFacturas();

      // Actualizar resumen
      updateCXCSummary();

      // Mostrar notificación
      if (
        typeof window.showNotification === 'function' &&
        window.showNotification !== showNotification
      ) {
        window.showNotification('No hay facturas reales en el sistema', 'warning');
      } else {
        alert('No hay facturas reales en el sistema');
      }
    }
  } catch (error) {
    console.error('❌ Error al limpiar datos de ejemplo:', error);
    alert('Error al limpiar datos de ejemplo');
  }
}

// Función para restaurar datos desde localStorage
window.restaurarDatosCXC = async function () {
  console.log('🔄 Restaurando datos de CXC desde localStorage...');

  try {
    // Recargar desde Firebase (NO desde localStorage)
    console.log('🔄 Recargando datos desde Firebase...');

    if (typeof loadFacturasFromStorage === 'function') {
      await loadFacturasFromStorage();

      if (facturasData.length === 0) {
        alert('No hay datos en Firebase para restaurar');
        return;
      }
    } else {
      alert('Función de carga no disponible');
      return;
    }

    console.log(`📋 Se encontraron ${facturasData.length} facturas desde Firebase`);

    // Actualizar facturasData con cálculo de días vencidos
    facturasData = facturasData.map(factura => {
      const monto = parseFloat(factura.monto) || 0;
      const montoPagado = parseFloat(factura.montoPagado) || 0;
      const montoPendiente =
        factura.montoPendiente !== undefined
          ? parseFloat(factura.montoPendiente)
          : monto - montoPagado;

      return {
        ...factura,
        monto: monto,
        montoPagado: montoPagado,
        montoPendiente: montoPendiente >= 0 ? montoPendiente : monto - montoPagado,
        pagos: factura.pagos || [],
        diasVencidos: calcularDiasVencidos(factura.fechaVencimiento, factura.estado)
      };
    });

    // Asegurar que todas las facturas tengan numeroFactura generado desde serie y folio
    facturasData = facturasData.map(factura => {
      if (factura.serie && factura.folio) {
        factura.numeroFactura = generarNumeroFactura(factura.serie, factura.folio);
      }
      return factura;
    });

    // Ordenar facturas por número (del más reciente al más antiguo)
    facturasData = ordenarFacturasPorNumero(facturasData);

    // Actualizar facturasFiltradas
    window.facturasFiltradas = [...facturasData];

    // Recargar tabla
    loadFacturas();
    updateCXCSummary();

    // Sincronizar con Firebase
    if (window.firebaseRepos?.cxc) {
      const resultado = await window.sincronizarFacturasCXC();
      alert(
        `✅ Datos restaurados: ${facturasData.length} facturas\n${resultado.sincronizadas} sincronizadas en Firebase`
      );
    } else {
      alert(`✅ Datos restaurados: ${facturasData.length} facturas`);
    }

    console.log('✅ Datos de CXC restaurados correctamente');
  } catch (error) {
    console.error('❌ Error restaurando datos:', error);
    alert(`Error al restaurar datos: ${error.message}`);
  }
};

// Actualizar datos de CXC
async function _refreshCXCData() {
  console.log('🔄 Actualizando datos de CXC...');

  try {
    // Cargar datos desde Firebase primero, luego localStorage
    await loadFacturasFromStorage();

    // Si no hay datos reales en localStorage, inicializar con datos de ejemplo
    if (facturasData.length === 0) {
      console.log('📋 No hay datos reales en localStorage, cargando datos de ejemplo...');
      initializeCXCData();
    } else {
      console.log(
        `📋 Se encontraron ${facturasData.length} facturas reales, omitiendo datos de ejemplo`
      );
    }

    // Recargar la tabla
    loadFacturas();

    // Actualizar resumen
    updateCXCSummary();

    console.log('✅ Datos de CXC actualizados correctamente');
    console.log(`📊 Total de facturas mostradas: ${facturasData.length}`);

    // Mostrar notificación sin bucle
    if (
      typeof window.showNotification === 'function' &&
      window.showNotification !== showNotification
    ) {
      window.showNotification(`Datos actualizados: ${facturasData.length} facturas`, 'success');
    } else {
      alert(`Datos actualizados: ${facturasData.length} facturas`);
    }
  } catch (error) {
    console.error('❌ Error al actualizar datos de CXC:', error);
    alert('Error al actualizar datos de CXC');
  }
}

// Funciones de utilidad
function formatDate(dateString) {
  if (!dateString) {
    return 'N/A';
  }

  let date = null;

  // Si es string en formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    const [year, month, day] = dateString.split('T')[0].split('-');
    date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  // Si es string en formato DD/MM/YYYY, parsearlo correctamente
  else if (typeof dateString === 'string' && dateString.includes('/')) {
    const partes = dateString.split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const año = parseInt(partes[2], 10);
      date = new Date(año, mes, dia);
    } else {
      date = new Date(dateString);
    }
  } else {
    date = new Date(dateString);
  }

  if (!date || isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleDateString('es-ES');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function showNotification(message, type) {
  // Usar la función de notificación del main.js si está disponible
  if (
    typeof window.showNotification === 'function' &&
    window.showNotification !== showNotification
  ) {
    window.showNotification(message, type);
  } else {
    // Fallback: mostrar alerta simple
    alert(message);
  }
}

// ===== FUNCIONES PARA PAGO MÚLTIPLE =====

// Toggle seleccionar todos
function _toggleAllSelections() {
  const selectAll = document.getElementById('selectAll');
  const checkboxes = document.querySelectorAll('.factura-checkbox:not([disabled])');

  checkboxes.forEach(checkbox => {
    checkbox.checked = selectAll.checked;
  });

  actualizarSeleccion();
}

// Actualizar selección y mostrar/ocultar sección de pago múltiple
function actualizarSeleccion() {
  const checkboxes = document.querySelectorAll('.factura-checkbox:checked');
  const pagoMultipleSection = document.getElementById('pagoMultipleSection');
  const facturasSeleccionadasCount = document.getElementById('facturasSeleccionadasCount');
  const totalSeleccionado = document.getElementById('totalSeleccionado');

  // Obtener el cliente de la primera factura seleccionada
  let clienteReferencia = null;
  if (checkboxes.length > 0) {
    const primeraFactura = facturasData.find(f => f.id === checkboxes[0].value);
    if (primeraFactura) {
      clienteReferencia = primeraFactura.cliente;
    }
  }

  // Validar que todas las facturas seleccionadas sean del mismo cliente
  let todasDelMismoCliente = true;
  const facturasDiferentesClientes = [];

  checkboxes.forEach(checkbox => {
    const factura = facturasData.find(f => f.id === checkbox.value);
    if (factura && factura.cliente !== clienteReferencia) {
      todasDelMismoCliente = false;
      facturasDiferentesClientes.push(factura);
      // Desmarcar facturas de otros clientes
      checkbox.checked = false;
    }
  });

  // Si se intentó seleccionar facturas de diferentes clientes, mostrar advertencia
  if (facturasDiferentesClientes.length > 0) {
    const mensaje = `⚠️ Solo se pueden seleccionar facturas del mismo cliente.\n\nCliente seleccionado: ${clienteReferencia}\n\nLas facturas de otros clientes han sido desmarcadas.`;
    if (typeof window.showNotification === 'function') {
      window.showNotification(mensaje, 'warning');
    } else {
      alert(mensaje);
    }
  }

  // Actualizar checkboxes: deshabilitar los de otros clientes si hay facturas seleccionadas
  const checkboxesActualizados = document.querySelectorAll('.factura-checkbox');
  checkboxesActualizados.forEach(checkbox => {
    const factura = facturasData.find(f => f.id === checkbox.value);
    if (factura && checkboxes.length > 0 && clienteReferencia) {
      if (factura.cliente !== clienteReferencia) {
        checkbox.disabled = true;
        checkbox.title = `Solo se pueden seleccionar facturas del cliente: ${clienteReferencia}`;
      } else {
        checkbox.disabled = false;
        checkbox.title = '';
      }
    } else {
      checkbox.disabled = false;
      checkbox.title = '';
    }
  });

  // Recalcular checkboxes seleccionados después de la validación
  const checkboxesSeleccionados = document.querySelectorAll('.factura-checkbox:checked');

  if (checkboxesSeleccionados.length > 0 && todasDelMismoCliente) {
    pagoMultipleSection.style.display = 'block';
    facturasSeleccionadasCount.textContent = checkboxesSeleccionados.length;

    // Calcular total
    let total = 0;
    checkboxesSeleccionados.forEach(checkbox => {
      const factura = facturasData.find(f => f.id === checkbox.value);
      if (factura) {
        total += factura.monto;
      }
    });

    totalSeleccionado.textContent = formatCurrency(total);
  } else {
    pagoMultipleSection.style.display = 'none';
  }

  // Actualizar estado del checkbox "Seleccionar todo"
  const selectAll = document.getElementById('selectAll');
  const allCheckboxes = document.querySelectorAll('.factura-checkbox:not([disabled])');
  const checkedCheckboxes = document.querySelectorAll('.factura-checkbox:checked');

  selectAll.checked = allCheckboxes.length > 0 && checkedCheckboxes.length === allCheckboxes.length;
  selectAll.indeterminate =
    checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
}

// Limpiar selecciones
function limpiarSelecciones() {
  const checkboxes = document.querySelectorAll('.factura-checkbox');
  const selectAll = document.getElementById('selectAll');

  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
    checkbox.disabled = false;
    checkbox.title = '';
  });

  selectAll.checked = false;
  selectAll.indeterminate = false;

  actualizarSeleccion();
}

// Abrir modal de pago múltiple
function _abrirModalPagoMultiple() {
  const checkboxes = document.querySelectorAll('.factura-checkbox:checked');

  // Validar que todas las facturas seleccionadas sean del mismo cliente
  if (checkboxes.length === 0) {
    alert('Por favor selecciona al menos una factura');
    return;
  }

  const facturasSeleccionadas = [];
  let clienteReferencia = null;

  checkboxes.forEach(checkbox => {
    const factura = facturasData.find(f => f.id === checkbox.value);
    if (factura) {
      if (!clienteReferencia) {
        clienteReferencia = factura.cliente;
      }
      facturasSeleccionadas.push(factura);
    }
  });

  // Verificar que todas sean del mismo cliente
  const facturasDiferentesClientes = facturasSeleccionadas.filter(
    f => f.cliente !== clienteReferencia
  );
  if (facturasDiferentesClientes.length > 0) {
    alert(
      `⚠️ Error: Solo se pueden procesar pagos múltiples para facturas del mismo cliente.\n\nCliente seleccionado: ${clienteReferencia}\n\nPor favor, selecciona solo facturas del mismo cliente.`
    );
    return;
  }

  const listaFacturas = document.getElementById('listaFacturasSeleccionadas');
  const montoTotal = document.getElementById('montoPagoMultiple');
  const fechaPago = document.getElementById('fechaPagoMultiple');

  // Limpiar lista anterior
  listaFacturas.innerHTML = '';

  // Llenar lista de facturas seleccionadas con campos editables
  let totalPendiente = 0;
  checkboxes.forEach((checkbox, _index) => {
    const factura = facturasData.find(f => f.id === checkbox.value);
    if (factura) {
      const montoTotalFactura = factura.monto || 0;
      const montoPagado = factura.montoPagado || 0;
      const montoPendiente = factura.montoPendiente || montoTotalFactura - montoPagado;
      totalPendiente += montoPendiente;

      const listItem = document.createElement('div');
      listItem.className = 'list-group-item';
      listItem.innerHTML = `
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <strong>${factura.serie || ''}${factura.serie && factura.folio ? '-' : ''}${factura.folio || factura.numeroFactura}</strong>
                        <br>
                        <small class="text-muted">${factura.cliente} - ${formatDate(factura.fechaEmision)}</small>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Total:</small><br>
                        <strong>$${formatCurrency(montoTotalFactura)}</strong>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Pagado:</small><br>
                        <span class="text-success">$${formatCurrency(montoPagado)}</span>
                    </div>
                    <div class="col-md-2">
                        <small class="text-muted">Pendiente:</small><br>
                        <span class="text-danger">$${formatCurrency(montoPendiente)}</span>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small">Monto a Pagar:</label>
                        <input type="number" 
                               class="form-control form-control-sm monto-pago-individual" 
                               data-factura-id="${factura.id}"
                               data-max-pendiente="${montoPendiente}"
                               value="${montoPendiente}" 
                               step="0.01" 
                               min="0" 
                               max="${montoPendiente}"
                               onchange="actualizarTotalPagoMultiple()">
                    </div>
                </div>
            `;
      listaFacturas.appendChild(listItem);
    }
  });

  // Establecer monto total inicial
  montoTotal.value = formatCurrency(totalPendiente);

  // Establecer fecha actual
  fechaPago.value = new Date().toISOString().split('T')[0];

  // Limpiar archivo PDF anterior
  const archivosInput = document.getElementById('comprobantePagoMultiple');
  if (archivosInput) {
    archivosInput.value = '';
    archivosInput.classList.remove('is-invalid');
  }

  // Limpiar visualización de archivos
  const archivosContainer = document.getElementById('archivosAdjuntosMultiple');
  if (archivosContainer) {
    archivosContainer.innerHTML = '';
  }

  // Configurar event listener para archivo PDF
  if (archivosInput) {
    archivosInput.removeEventListener('change', manejarArchivosAdjuntosMultiple);
    archivosInput.addEventListener('change', manejarArchivosAdjuntosMultiple);
  }

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalPagoMultiple'));
  modal.show();
}

// Manejar archivos adjuntos en pago múltiple
function manejarArchivosAdjuntosMultiple(event) {
  const { files } = event.target;
  const container = document.getElementById('archivosAdjuntosMultiple');

  if (!container) {
    return;
  }

  // Limpiar contenedor
  container.innerHTML = '';

  // Validar que sea PDF
  if (files.length > 0) {
    const archivo = files[0];
    if (archivo.type !== 'application/pdf') {
      alert('Por favor, adjunta un archivo en formato PDF');
      event.target.value = '';
      event.target.classList.add('is-invalid');
      return;
    }

    // Remover clase de error si el archivo es válido
    event.target.classList.remove('is-invalid');

    // Mostrar información del archivo
    const archivoDiv = document.createElement('div');
    archivoDiv.className =
      'archivo-adjunto d-flex align-items-center justify-content-between p-2 border rounded mt-2';
    archivoDiv.innerHTML = `
            <div class="info-archivo d-flex align-items-center">
                <i class="fas fa-file-pdf text-danger me-2"></i>
                <span class="nombre-archivo">${archivo.name}</span>
                <span class="tamaño-archivo text-muted ms-2">(${formatFileSize(archivo.size)})</span>
            </div>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarArchivoAdjuntoMultiple()">
                <i class="fas fa-times"></i>
            </button>
        `;
    container.appendChild(archivoDiv);
  }
}

// Eliminar archivo adjunto en pago múltiple
function _eliminarArchivoAdjuntoMultiple() {
  const input = document.getElementById('comprobantePagoMultiple');
  if (input) {
    input.value = '';
    input.classList.remove('is-invalid');
  }

  const container = document.getElementById('archivosAdjuntosMultiple');
  if (container) {
    container.innerHTML = '';
  }
}

// Actualizar total del pago múltiple cuando se cambien los montos individuales
function _actualizarTotalPagoMultiple() {
  const montosIndividuales = document.querySelectorAll('.monto-pago-individual');
  const montoTotal = document.getElementById('montoPagoMultiple');

  let total = 0;
  let hayErrores = false;

  montosIndividuales.forEach(input => {
    const monto = parseFloat(input.value) || 0;
    const maxPendiente = parseFloat(input.dataset.maxPendiente) || 0;

    // Validar que no exceda el monto pendiente
    if (monto > maxPendiente) {
      input.classList.add('is-invalid');
      hayErrores = true;
    } else {
      input.classList.remove('is-invalid');
      total += monto;
    }
  });

  // Actualizar total
  montoTotal.value = formatCurrency(total);

  // Mostrar/ocultar mensaje de error
  let errorDiv = document.getElementById('errorMontoMultiple');
  if (hayErrores) {
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'errorMontoMultiple';
      errorDiv.className = 'alert alert-danger mt-2';
      errorDiv.innerHTML =
        '<i class="fas fa-exclamation-triangle"></i> Algunos montos exceden el saldo pendiente.';
      document.getElementById('montoPagoMultiple').parentNode.appendChild(errorDiv);
    }
  } else if (errorDiv) {
    errorDiv.remove();
  }
}

// Procesar pago múltiple
async function _procesarPagoMultiple() {
  const fechaPago = document.getElementById('fechaPagoMultiple').value;
  const metodoPago = document.getElementById('metodoPagoMultiple').value;
  const cuentaOrigen = document.getElementById('cuentaPagoMultiple').value;
  const bancoOrigen = document.getElementById('bancoOrigenMultiple').value;
  const cuentaDestino = document.getElementById('cuentaDestinoMultiple').value;
  const bancoDestino = document.getElementById('bancoDestinoMultiple').value;
  const referenciaPago = document.getElementById('referenciaPagoMultiple').value;
  const observaciones = document.getElementById('observacionesPagoMultiple').value;

  // Validar campos requeridos
  if (!fechaPago || !metodoPago) {
    alert('Por favor completa todos los campos requeridos');
    return;
  }

  // Validar archivo PDF obligatorio
  const archivosInput = document.getElementById('comprobantePagoMultiple');
  if (!archivosInput || archivosInput.files.length === 0) {
    alert('Por favor, adjunta un archivo PDF del comprobante de pago');
    archivosInput?.focus();
    archivosInput?.classList.add('is-invalid');
    return;
  }

  // Validar que sea PDF
  const archivo = archivosInput.files[0];
  if (archivo.type !== 'application/pdf') {
    alert('Por favor, adjunta un archivo en formato PDF');
    archivosInput.focus();
    archivosInput.classList.add('is-invalid');
    return;
  }

  // Convertir archivo PDF a base64
  let archivoBase64 = null;
  try {
    const archivosBase64 = await convertirArchivosABase64([archivo]);
    if (archivosBase64.length > 0) {
      archivoBase64 = archivosBase64[0];
    }
    console.log('📎 Archivo PDF procesado para pago múltiple');
  } catch (error) {
    console.error('❌ Error procesando archivo PDF:', error);
    alert('Error al procesar el archivo PDF. Intenta nuevamente.');
    return;
  }

  // Obtener montos individuales
  const montosIndividuales = document.querySelectorAll('.monto-pago-individual');
  console.log('🔍 Montos individuales encontrados:', montosIndividuales.length);

  let facturasProcesadas = 0;
  let facturasCompletamentePagadas = 0;
  let facturasParcialmentePagadas = 0;
  let totalPagado = 0;

  // Validar que no haya errores
  const hayErrores = document.querySelectorAll('.monto-pago-individual.is-invalid').length > 0;
  if (hayErrores) {
    alert('Por favor corrige los montos que exceden el saldo pendiente');
    return;
  }

  // Validar que haya montos para procesar
  if (montosIndividuales.length === 0) {
    console.error('❌ No se encontraron inputs de montos individuales');
    alert(
      'No se encontraron facturas seleccionadas. Por favor, selecciona facturas e intenta nuevamente.'
    );
    return;
  }

  // Generar referencia única si no se proporciona
  const referenciaFinal = referenciaPago || `PAGO-MULT-${Date.now()}`;

  // Procesar cada factura con su monto individual (usar for...of en lugar de forEach para await)
  for (const input of montosIndividuales) {
    // Leer facturaId usando getAttribute para mayor confiabilidad
    const facturaIdAttr = input.getAttribute('data-factura-id');
    const facturaId = facturaIdAttr ? parseInt(facturaIdAttr, 10) || facturaIdAttr : null;
    const montoPago = parseFloat(input.value) || 0;

    console.log(
      `📋 Procesando factura ID (raw): ${facturaIdAttr}, ID (parsed): ${facturaId}, Monto: ${montoPago}`
    );

    if (!facturaId) {
      console.error('❌ No se pudo obtener el ID de la factura para el input:', input);
      continue;
    }

    if (montoPago > 0) {
      // Buscar factura por ID (puede ser número o string)
      const factura = facturasData.find(
        f => f.id === facturaId || String(f.id) === String(facturaId)
      );
      if (factura) {
        // Crear registro de pago
        const nuevoPago = {
          id: Date.now() + Math.random(), // ID único
          monto: montoPago,
          fecha: fechaPago,
          metodo: metodoPago,
          cuentaOrigen: cuentaOrigen,
          bancoOrigen: bancoOrigen,
          cuentaDestino: cuentaDestino,
          bancoDestino: bancoDestino,
          referencia: referenciaFinal,
          observaciones: observaciones,
          archivosAdjuntos: archivoBase64 ? [archivoBase64] : []
        };

        // Agregar pago al historial
        if (!factura.pagos) {
          factura.pagos = [];
        }
        factura.pagos.push(nuevoPago);

        // Actualizar montos
        const montoTotal = factura.monto || 0;
        const montoPagadoActual = factura.montoPagado || 0;
        factura.montoPagado = montoPagadoActual + montoPago;
        factura.montoPendiente = montoTotal - factura.montoPagado;

        // Determinar estado de la factura
        if (factura.montoPendiente <= 0) {
          factura.estado = 'pagado';
          factura.fechaPago = fechaPago;
          factura.metodoPago = metodoPago;
          factura.cuentaOrigenPago = cuentaOrigen;
          factura.bancoOrigenPago = bancoOrigen;
          factura.cuentaDestinoPago = cuentaDestino;
          factura.bancoDestinoPago = bancoDestino;
          factura.referenciaPago = referenciaFinal;
          factura.observacionesPago = observaciones;
          factura.diasVencidos = null; // null para mostrar "-" cuando está pagado
          facturasCompletamentePagadas++;

          // Registrar movimiento en Tesorería para TODOS los pagos (completos y parciales)
          try {
            await registrarPagoCXCTesorería(
              factura,
              montoPago,
              referenciaFinal,
              metodoPago,
              bancoOrigen,
              cuentaOrigen,
              bancoDestino,
              cuentaDestino,
              fechaPago // Pasar la fecha del pago
            );
            console.log(
              `✅ Movimiento registrado en Tesorería para factura ${factura.numeroFactura}`
            );
          } catch (error) {
            console.error(
              `❌ Error al registrar movimiento en Tesorería para factura ${factura.numeroFactura}:`,
              error
            );
          }
        } else {
          factura.estado = 'pendiente';
          facturasParcialmentePagadas++;

          // Registrar movimiento en Tesorería también para pagos parciales
          try {
            await registrarPagoCXCTesorería(
              factura,
              montoPago,
              referenciaFinal,
              metodoPago,
              bancoOrigen,
              cuentaOrigen,
              bancoDestino,
              cuentaDestino,
              fechaPago // Pasar la fecha del pago
            );
            console.log(
              `✅ Movimiento parcial registrado en Tesorería para factura ${factura.numeroFactura}`
            );
          } catch (error) {
            console.error(
              `❌ Error al registrar movimiento parcial en Tesorería para factura ${factura.numeroFactura}:`,
              error
            );
          }
        }

        totalPagado += montoPago;
        facturasProcesadas++;

        // Guardar factura actualizada en Firebase
        if (window.firebaseRepos?.cxc) {
          try {
            const facturaIdFirebase = factura.id || `factura_${factura.numeroFactura}`;
            const facturaData = {
              ...factura,
              tipo: 'factura',
              fechaCreacion: factura.fechaCreacion || new Date().toISOString()
            };
            await window.firebaseRepos.cxc.saveFactura(facturaIdFirebase, facturaData);
            console.log(
              `✅ Factura ${factura.numeroFactura} actualizada en Firebase (pago múltiple)`
            );
          } catch (error) {
            console.error(
              `❌ Error guardando factura ${factura.numeroFactura} en Firebase:`,
              error
            );
          }
        }
      }
    }
  }

  if (facturasProcesadas === 0) {
    alert('No se procesó ningún pago. Verifica que los montos sean válidos.');
    return;
  }

  // NO USAR localStorage - Solo Firebase es la fuente de verdad
  // Eliminado guardado en localStorage para evitar inconsistencias entre navegadores

  // Actualizar movimientos en Tesorería: si hay varios con la misma referencia, mostrar "Varias"
  if (facturasProcesadas > 1) {
    try {
      const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');
      const movimientosMismaReferencia = tesoreria.filter(
        m => m.referencia === referenciaFinal && m.origen === 'CXC' && m.fecha === fechaPago
      );

      if (movimientosMismaReferencia.length > 1) {
        // Hay varios movimientos con la misma referencia, actualizar para mostrar "[CXC] - Varias"
        const facturasIncluidas = movimientosMismaReferencia
          .map(m => {
            // Extraer número de factura de la descripción si tiene formato [CXC] - F-xxx
            if (m.descripcion && m.descripcion.includes('[CXC] - ')) {
              return m.descripcion.replace('[CXC] - ', '').trim();
            }
            return m.numeroFactura || m.descripcion;
          })
          .filter(n => n && n !== 'Varias' && n !== '[CXC] - Varias');

        movimientosMismaReferencia.forEach(mov => {
          mov.descripcion = '[CXC] - Varias';
          mov.facturasIncluidas = facturasIncluidas;
        });

        localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(tesoreria));
        console.log(
          `✅ ${movimientosMismaReferencia.length} movimientos actualizados para mostrar "Varias"`
        );
      }
    } catch (error) {
      console.error('❌ Error actualizando movimientos para pago múltiple:', error);
    }
  }

  // Actualizar vista
  loadFacturas();
  updateCXCSummary();
  limpiarSelecciones();

  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalPagoMultiple'));
  modal.hide();

  // Mostrar confirmación detallada
  let mensaje = '✅ Pago múltiple registrado exitosamente.\n';
  mensaje += `📊 Total pagado: $${formatCurrency(totalPagado)}\n`;
  mensaje += `📋 Facturas procesadas: ${facturasProcesadas}\n`;
  if (facturasCompletamentePagadas > 0) {
    mensaje += `✅ Completamente pagadas: ${facturasCompletamentePagadas}\n`;
  }
  if (facturasParcialmentePagadas > 0) {
    mensaje += `⏳ Parcialmente pagadas: ${facturasParcialmentePagadas}`;
  }

  if (
    typeof window.showNotification === 'function' &&
    window.showNotification !== showNotification
  ) {
    window.showNotification(mensaje, 'success');
  } else {
    alert(mensaje);
  }

  // Actualizar la página al final
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// ===== FUNCIONES PARA ESTADO DE CUENTA =====

// Abrir modal de estado de cuenta
function _generarEstadoCuenta() {
  // Cargar lista de clientes
  cargarClientesEstadoCuenta();

  // Establecer fechas por defecto: inicio del mes actual hasta hoy
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Primer día del mes actual

  // Formatear fechas en formato YYYY-MM-DD
  const fechaDesdeStr = inicioMes.toISOString().split('T')[0];
  const fechaHastaStr = hoy.toISOString().split('T')[0];

  document.getElementById('fechaDesdeEstado').value = fechaDesdeStr;
  document.getElementById('fechaHastaEstado').value = fechaHastaStr;

  console.log(`📅 Fechas establecidas: Desde ${fechaDesdeStr} hasta ${fechaHastaStr}`);

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalEstadoCuenta'));
  modal.show();
}

// Cargar clientes en el select
function cargarClientesEstadoCuenta() {
  const select = document.getElementById('clienteEstadoCuenta');
  select.innerHTML = '<option value="">Seleccionar cliente...</option>';

  try {
    // Obtener clientes únicos de las facturas
    const clientesUnicos = [...new Set(facturasData.map(f => f.cliente))];

    clientesUnicos.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente;
      option.textContent = cliente;
      select.appendChild(option);
    });

    console.log(`✅ ${clientesUnicos.length} clientes cargados para estado de cuenta`);
  } catch (error) {
    console.error('❌ Error cargando clientes:', error);
  }
}

// Vista previa del estado de cuenta
function _previewEstadoCuenta() {
  const cliente = document.getElementById('clienteEstadoCuenta').value;
  const fechaDesde = document.getElementById('fechaDesdeEstado').value;
  const fechaHasta = document.getElementById('fechaHastaEstado').value;
  const soloVencidas = document.getElementById('soloVencidas').checked;

  if (!cliente) {
    alert('Por favor selecciona un cliente');
    return;
  }

  // Filtrar facturas del cliente
  let facturasCliente = facturasData.filter(f => f.cliente === cliente);

  // Filtrar por fechas si se especifican
  if (fechaDesde) {
    facturasCliente = facturasCliente.filter(f => f.fechaEmision >= fechaDesde);
  }
  if (fechaHasta) {
    facturasCliente = facturasCliente.filter(f => f.fechaEmision <= fechaHasta);
  }

  // Filtrar solo vencidas y pendientes si está marcado
  if (soloVencidas) {
    facturasCliente = facturasCliente.filter(
      f => f.estado === 'pendiente' || f.estado === 'vencido'
    );
  }

  // Calcular totales usando montos reales de pagos parciales
  const _totalGeneral = facturasCliente.reduce((sum, f) => sum + (f.monto || 0), 0);
  const _totalPagado = facturasCliente.reduce((sum, f) => sum + (f.montoPagado || 0), 0);
  const totalPendiente = facturasCliente.reduce((sum, f) => sum + (f.montoPendiente || 0), 0);

  // Obtener el contenedor de vista previa
  const previewElement = document.getElementById('previewEstadoCuenta');
  if (!previewElement) {
    console.warn('⚠️ Elemento previewEstadoCuenta no encontrado');
    return;
  }

  // Mostrar vista previa (verificar que los elementos existan)
  const previewCliente = document.getElementById('previewCliente');
  const previewPeriodo = document.getElementById('previewPeriodo');
  const previewCantidad = document.getElementById('previewCantidad');
  const previewTotal = document.getElementById('previewTotal');

  // Actualizar los elementos de vista previa si existen
  if (previewCliente) {
    previewCliente.textContent = cliente;
  } else {
    console.warn('⚠️ Elemento previewCliente no encontrado');
  }

  if (previewPeriodo) {
    previewPeriodo.textContent = `${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}`;
  } else {
    console.warn('⚠️ Elemento previewPeriodo no encontrado');
  }

  if (previewCantidad) {
    previewCantidad.textContent = facturasCliente.length;
  } else {
    console.warn('⚠️ Elemento previewCantidad no encontrado');
  }

  if (previewTotal) {
    previewTotal.textContent = formatCurrency(totalPendiente);
  } else {
    console.warn('⚠️ Elemento previewTotal no encontrado');
  }

  // Mostrar el contenedor de vista previa
  previewElement.style.display = 'block';
}

// Generar PDF del estado de cuenta
function _generarPDFEstadoCuenta() {
  const cliente = document.getElementById('clienteEstadoCuenta').value;
  const fechaDesde = document.getElementById('fechaDesdeEstado').value;
  const fechaHasta = document.getElementById('fechaHastaEstado').value;
  const soloVencidas = document.getElementById('soloVencidas').checked;

  if (!cliente) {
    alert('Por favor selecciona un cliente');
    return;
  }

  // Filtrar facturas del cliente
  let facturasCliente = facturasData.filter(f => f.cliente === cliente);

  // Filtrar por fechas si se especifican
  if (fechaDesde) {
    facturasCliente = facturasCliente.filter(f => f.fechaEmision >= fechaDesde);
  }
  if (fechaHasta) {
    facturasCliente = facturasCliente.filter(f => f.fechaEmision <= fechaHasta);
  }

  // Filtrar solo vencidas y pendientes si está marcado
  if (soloVencidas) {
    facturasCliente = facturasCliente.filter(
      f => f.estado === 'pendiente' || f.estado === 'vencido'
    );
  }

  // Calcular totales usando montos reales de pagos parciales
  const facturasPendientes = facturasCliente.filter(f => f.estado === 'pendiente');
  const facturasVencidas = facturasCliente.filter(f => f.estado === 'vencido');
  const facturasPagadas = facturasCliente.filter(
    f => f.estado === 'pagado' || f.estado === 'pagada'
  );

  // Calcular montos usando montoPendiente y montoPagado reales
  const totalPendiente = facturasCliente.reduce((sum, f) => {
    const montoPendiente = f.montoPendiente || 0;
    return sum + montoPendiente;
  }, 0);

  const totalPagado = facturasCliente.reduce((sum, f) => {
    const montoPagado = f.montoPagado || 0;
    return sum + montoPagado;
  }, 0);

  const totalGeneral = facturasCliente.reduce((sum, f) => {
    const monto = f.monto || 0;
    return sum + monto;
  }, 0);

  const totalVencido = facturasVencidas.reduce((sum, f) => {
    const montoPendiente = f.montoPendiente || 0;
    return sum + montoPendiente;
  }, 0);

  // Crear PDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Configuración de fuentes y colores
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 20;

  // Función para agregar texto con estilo
  function addText(text, x, y, options = {}) {
    doc.setFontSize(options.fontSize || 12);

    // Manejar colores correctamente
    if (options.color) {
      if (Array.isArray(options.color)) {
        doc.setTextColor(options.color[0], options.color[1], options.color[2]);
      } else {
        doc.setTextColor(options.color);
      }
    } else {
      doc.setTextColor(0, 0, 0); // Negro por defecto
    }

    doc.text(text, x, y);
  }

  // Función para agregar línea
  function addLine(x1, y1, x2, y2) {
    doc.setDrawColor(0, 0, 0);
    doc.line(x1, y1, x2, y2);
  }

  // Encabezado
  addText('ESTADO DE CUENTA', pageWidth / 2, yPosition, { fontSize: 18, color: [0, 0, 139] });
  yPosition += 15;

  addText(`Cliente: ${cliente}`, margin, yPosition, { fontSize: 14 });
  yPosition += 10;

  addText(`Período: ${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}`, margin, yPosition);
  yPosition += 10;

  addText(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, margin, yPosition);
  yPosition += 20;

  // Resumen
  addText('RESUMEN', margin, yPosition, { fontSize: 14, color: [0, 0, 139] });
  yPosition += 10;

  addText(`Total de facturas: ${facturasCliente.length}`, margin, yPosition);
  yPosition += 8;

  addText(`Monto total facturado: $${formatCurrency(totalGeneral)}`, margin, yPosition, {
    fontSize: 12,
    color: [0, 0, 139]
  });
  yPosition += 8;

  addText(`Monto total pagado: $${formatCurrency(totalPagado)}`, margin, yPosition, {
    color: [0, 128, 0]
  });
  yPosition += 8;

  addText(`Monto total pendiente: $${formatCurrency(totalPendiente)}`, margin, yPosition, {
    color: [220, 20, 60]
  });
  yPosition += 8;

  addText(`Facturas pendientes: ${facturasPendientes.length}`, margin, yPosition);
  yPosition += 8;

  addText(
    `Facturas vencidas: ${facturasVencidas.length} - $${formatCurrency(totalVencido)}`,
    margin,
    yPosition,
    { color: [220, 20, 60] }
  );
  yPosition += 8;

  addText(`Facturas pagadas: ${facturasPagadas.length}`, margin, yPosition, { color: [0, 128, 0] });
  yPosition += 8;

  // Calcular porcentaje de cobranza
  const porcentajeCobranza = totalGeneral > 0 ? Math.round((totalPagado / totalGeneral) * 100) : 0;
  addText(`Porcentaje de cobranza: ${porcentajeCobranza}%`, margin, yPosition, {
    fontSize: 12,
    color: [0, 0, 139]
  });
  yPosition += 20;

  // Tabla de facturas
  addText('DETALLE DE FACTURAS', margin, yPosition, { fontSize: 14, color: [0, 0, 139] });
  yPosition += 10;

  // Encabezados de tabla - Ajustar posiciones para más columnas
  const colPositions = [
    margin,
    margin + 20,
    margin + 40,
    margin + 60,
    margin + 80,
    margin + 100,
    margin + 120,
    margin + 140,
    margin + 160
  ];

  addText('Serie-Folio', colPositions[0], yPosition, { fontSize: 9 });
  addText('Fecha Emisión', colPositions[1], yPosition, { fontSize: 9 });
  addText('Fecha Venc.', colPositions[2], yPosition, { fontSize: 9 });
  addText('Días Venc.', colPositions[3], yPosition, { fontSize: 9 });
  addText('Monto Total', colPositions[4], yPosition, { fontSize: 9 });
  addText('Monto Pagado', colPositions[5], yPosition, { fontSize: 9 });
  addText('Monto Pend.', colPositions[6], yPosition, { fontSize: 9 });
  addText('Estado', colPositions[7], yPosition, { fontSize: 9 });
  addText('Referencia', colPositions[8], yPosition, { fontSize: 9 });

  yPosition += 5;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Filas de facturas
  facturasCliente.forEach(factura => {
    // Verificar si necesitamos nueva página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    const serieFolio = `${factura.serie || ''}${factura.serie && factura.folio ? '-' : ''}${factura.folio || factura.numeroFactura}`;
    const fechaEmision = formatDate(factura.fechaEmision);
    const fechaVenc = formatDate(factura.fechaVencimiento);
    const diasVenc = factura.diasVencidos > 0 ? factura.diasVencidos.toString() : '-';

    // Calcular montos
    const montoTotal = factura.monto || 0;
    const montoPagado = factura.montoPagado || 0;
    const montoPendiente = factura.montoPendiente || montoTotal - montoPagado;

    const montoTotalStr = `$${formatCurrency(montoTotal)}`;
    const montoPagadoStr = `$${formatCurrency(montoPagado)}`;
    const montoPendienteStr = `$${formatCurrency(montoPendiente)}`;

    const estado = factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1);
    const referencia = factura.referenciaPago || '-';

    // Color según estado
    let estadoColor = 0;
    if (factura.estado === 'vencido') {
      estadoColor = 220;
    } else if (factura.estado === 'pagado' || factura.estado === 'pagada') {
      estadoColor = 0;
    } else {
      estadoColor = 255;
    }

    addText(serieFolio, colPositions[0], yPosition, { fontSize: 8 });
    addText(fechaEmision, colPositions[1], yPosition, { fontSize: 8 });
    addText(fechaVenc, colPositions[2], yPosition, { fontSize: 8 });
    addText(diasVenc, colPositions[3], yPosition, {
      fontSize: 8,
      color: factura.estado === 'vencido' ? 220 : 0
    });
    addText(montoTotalStr, colPositions[4], yPosition, { fontSize: 8 });
    addText(montoPagadoStr, colPositions[5], yPosition, { fontSize: 8, color: [0, 128, 0] });
    addText(montoPendienteStr, colPositions[6], yPosition, {
      fontSize: 8,
      color: montoPendiente > 0 ? [220, 20, 60] : [0, 128, 0]
    });
    addText(estado, colPositions[7], yPosition, { fontSize: 8, color: estadoColor });
    addText(referencia, colPositions[8], yPosition, { fontSize: 8 });

    yPosition += 8;
  });

  // Pie de página
  yPosition += 20;
  addLine(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  addText(
    'Este estado de cuenta es generado automáticamente por el sistema ERP.',
    margin,
    yPosition,
    { fontSize: 8, color: [128, 128, 128] }
  );
  yPosition += 5;
  addText('Para aclaraciones, contactar al departamento de cobranza.', margin, yPosition, {
    fontSize: 8,
    color: [128, 128, 128]
  });

  // Guardar PDF
  const fileName = `Estado_Cuenta_${cliente.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  // Cerrar modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstadoCuenta'));
  modal.hide();

  // Mostrar confirmación
  showNotification(`✅ Estado de cuenta generado exitosamente: ${fileName}`, 'success');
}

// ===== FUNCIONES CXC → TESORERÍA =====

// Función para registrar pago de CXC en tesorería
async function registrarPagoCXCTesorería(
  factura,
  montoPago = null,
  referenciaPago = null,
  metodoPago = null,
  bancoOrigen = null,
  cuentaOrigen = null,
  bancoDestino = null,
  cuentaDestino = null,
  fechaPago = null
) {
  console.log(`💰 Registrando pago de CXC en tesorería: ${factura.numeroFactura}`);

  try {
    // Obtener movimientos de tesorería
    const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');

    // Usar el monto del pago si se proporciona, sino usar el monto total de la factura
    const montoRegistro = montoPago || factura.monto;

    // Usar la referencia del pago específico si se proporciona, sino usar la referencia general
    const referenciaRegistro = referenciaPago || factura.referenciaPago || factura.numeroFactura;

    // Usar el método de pago específico si se proporciona, sino usar el método general
    const metodoRegistro = metodoPago || factura.metodoPago || 'Transferencia';

    // Usar el banco de origen específico si se proporciona, sino usar el banco general
    const bancoRegistro = bancoOrigen || factura.bancoOrigenPago || 'Banco Principal';

    // Usar la cuenta de origen del pago si se proporciona, sino usar la cuenta general
    const cuentaRegistro = cuentaOrigen || factura.cuentaPago || '';

    // Usar el banco de destino del pago si se proporciona, sino usar el banco general
    const bancoDestinoRegistro = bancoDestino || factura.bancoDestinoPago || '';

    // Usar la cuenta de destino del pago si se proporciona, sino usar la cuenta general
    const cuentaDestinoRegistro = cuentaDestino || factura.cuentaDestinoPago || '';

    // Usar la fecha del pago si se proporciona, sino usar la fecha de pago de la factura, sino usar la fecha actual
    let fechaRegistro = fechaPago || factura.fechaPago;
    if (!fechaRegistro) {
      // Si no hay fecha, usar la fecha actual en formato YYYY-MM-DD
      fechaRegistro = new Date().toISOString().split('T')[0];
    } else if (typeof fechaRegistro === 'string') {
      // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
      if (/^\d{4}-\d{2}-\d{2}/.test(fechaRegistro)) {
        // Ya está en formato YYYY-MM-DD, usarlo directamente
        fechaRegistro = fechaRegistro.split('T')[0]; // Tomar solo la parte de fecha si viene con hora
      } else if (fechaRegistro.includes('T')) {
        // Formato ISO con hora, extraer solo la fecha
        fechaRegistro = fechaRegistro.split('T')[0];
      } else if (fechaRegistro.includes('/')) {
        // Formato DD/MM/YYYY, parsearlo correctamente
        const partes = fechaRegistro.split('/');
        if (partes.length === 3) {
          const dia = parseInt(partes[0], 10);
          const mes = parseInt(partes[1], 10) - 1;
          const año = parseInt(partes[2], 10);
          const fecha = new Date(año, mes, dia);
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          fechaRegistro = `${year}-${month}-${day}`;
        } else {
          // Fallback: intentar parsear como Date
          const fecha = new Date(fechaRegistro);
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          fechaRegistro = `${year}-${month}-${day}`;
        }
      } else {
        // Otro formato, intentar parsear como Date
        const fecha = new Date(fechaRegistro);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        fechaRegistro = `${year}-${month}-${day}`;
      }
    } else {
      // Si no es string, convertir a YYYY-MM-DD
      const fecha = new Date(fechaRegistro);
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      fechaRegistro = `${year}-${month}-${day}`;
    }

    console.log(
      `📅 Fecha del pago parseada: ${fechaRegistro} (original: ${fechaPago || factura.fechaPago})`
    );

    // Obtener el número de factura en el formato correcto (serie-folio si están disponibles, sino numeroFactura)
    const numeroFacturaDisplay =
      factura.serie && factura.folio
        ? `${factura.serie}-${factura.folio}`
        : factura.numeroFactura || 'N/A';

    // Crear movimiento de ingreso con identificador
    // La descripción será [CXC] - número de factura en el formato correcto
    const nuevoMovimiento = {
      id: Date.now(),
      tipo: 'ingreso',
      monto: montoRegistro,
      descripcion: `[CXC] - ${numeroFacturaDisplay}`, // Formato: [CXC] - F-97255463
      categoria: 'Cuentas por Cobrar',
      fecha: fechaRegistro, // Usar la fecha del pago, no la fecha actual del sistema
      referencia: referenciaRegistro, // Usar referencia del pago específico
      referenciaBancaria: referenciaRegistro, // También guardar como referenciaBancaria
      cliente: factura.cliente,
      fechaCreacion: new Date().toISOString(),
      origen: 'CXC',
      identificador: 'CXC',
      icono: '💰',
      color: '#28a745',
      etiqueta: 'CXC',
      numeroFactura: numeroFacturaDisplay, // Usar el formato correcto (serie-folio o numeroFactura)
      proveedorCliente: factura.cliente,
      metodoPago: metodoRegistro, // Agregar método de pago
      bancoOrigen: bancoRegistro, // Agregar banco de origen
      cuentaOrigen: cuentaRegistro, // Agregar cuenta de origen
      bancoDestino: bancoDestinoRegistro, // Agregar banco de destino
      cuentaDestino: cuentaDestinoRegistro // Agregar cuenta de destino
    };

    // Agregar a tesorería
    tesoreria.push(nuevoMovimiento);
    localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(tesoreria));

    console.log(`✅ Movimiento CXC registrado en localStorage: $${montoRegistro}`);

    // Guardar en Firebase también
    if (window.firebaseRepos?.tesoreria) {
      console.log('🔍 Repositorio Tesorería disponible, intentando guardar en Firebase...');
      try {
        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 10 &&
          (!window.firebaseRepos.tesoreria.db || !window.firebaseRepos.tesoreria.tenantId)
        ) {
          attempts++;
          console.log(`⏳ Esperando inicialización de repositorio Tesorería... (${attempts}/10)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          if (window.firebaseRepos.tesoreria && !window.firebaseRepos.tesoreria.db) {
            await window.firebaseRepos.tesoreria.init();
          }
        }

        if (window.firebaseRepos.tesoreria.db && window.firebaseRepos.tesoreria.tenantId) {
          const movimientoId = `movimiento_${nuevoMovimiento.id}`;
          const movimientoData = {
            ...nuevoMovimiento,
            // Mantener el tipo original (ingreso/egreso) en lugar de sobrescribir a 'movimiento'
            tipo: nuevoMovimiento.tipo || 'movimiento',
            fechaCreacion: nuevoMovimiento.fechaCreacion || new Date().toISOString()
          };

          console.log(`💾 Guardando movimiento en Firebase: ${movimientoId}`, {
            id: movimientoData.id,
            tipo: movimientoData.tipo,
            origen: movimientoData.origen,
            monto: movimientoData.monto
          });

          await window.firebaseRepos.tesoreria.saveMovimiento(movimientoId, movimientoData);
          console.log(`✅ Movimiento CXC guardado en Firebase: ${movimientoId}`);
        } else {
          console.warn('⚠️ Repositorio Tesorería no inicializado completamente:', {
            tieneDb: Boolean(window.firebaseRepos.tesoreria?.db),
            tieneTenantId: Boolean(window.firebaseRepos.tesoreria?.tenantId)
          });
        }
      } catch (error) {
        console.error('❌ Error guardando movimiento en Firebase:', error);
        console.error('❌ Detalles del error:', error.message, error.stack);
        console.log('⚠️ Continuando con localStorage...');
      }
    } else {
      console.warn('⚠️ Repositorio Tesorería no disponible:', {
        tieneFirebaseRepos: Boolean(window.firebaseRepos),
        tieneTesoreria: Boolean(window.firebaseRepos?.tesoreria)
      });
    }

    return nuevoMovimiento;
  } catch (error) {
    console.error('❌ Error al registrar pago CXC en tesorería:', error);
    return null;
  }
}

// Función para marcar factura como pagada y registrar en tesorería
async function marcarFacturaCXCPagada(numeroFactura) {
  console.log(`🔍 Buscando factura: ${numeroFactura}`);

  try {
    // Usar variable global cargada desde Firebase (NO localStorage)
    const facturaIndex = facturasData.findIndex(f => f.numeroFactura === numeroFactura);

    if (facturaIndex !== -1) {
      const factura = facturasData[facturaIndex];

      if (factura.estado !== 'pagada') {
        // Marcar como pagada
        factura.estado = 'pagada';
        factura.fechaPago = new Date().toISOString().split('T')[0];

        // Actualizar en el array global
        facturasData[facturaIndex] = factura;

        // Guardar cambios en Firebase
        if (window.firebaseRepos && window.firebaseRepos.cxc) {
          try {
            const facturaId = `factura_${factura.id || factura.numeroFactura}`;
            await window.firebaseRepos.cxc.saveFactura(facturaId, factura);
            console.log(`✅ Factura guardada en Firebase: ${facturaId}`);
          } catch (error) {
            console.error('❌ Error guardando factura en Firebase:', error);
          }
        }

        // Registrar en tesorería
        await registrarPagoCXCTesorería(
          factura,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          factura.fechaPago
        );

        console.log(`✅ Factura ${numeroFactura} marcada como pagada y registrada en tesorería`);
        return true;
      }
      console.log(`ℹ️ Factura ${numeroFactura} ya está marcada como pagada`);
      return false;
    }
    console.log(`❌ Factura ${numeroFactura} no encontrada`);
    return false;
  } catch (error) {
    console.error('❌ Error al marcar factura CXC como pagada:', error);
    return false;
  }
}

// Función para sincronizar CXC con Tesorería
async function sincronizarCXCTesorería() {
  console.log('🔄 Sincronizando CXC con Tesorería...');

  try {
    // Usar variable global cargada desde Firebase (NO localStorage)
    const facturasPagadas = facturasData.filter(f => f.estado === 'pagada');

    console.log(`📋 Facturas pagadas: ${facturasPagadas.length}`);

    // Obtener movimientos de tesorería
    const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');

    let movimientosCreados = 0;

    for (const factura of facturasPagadas) {
      // Verificar si ya existe un movimiento para esta factura
      const movimientoExistente = tesoreria.find(
        m => m.referencia === factura.numeroFactura && m.origen === 'CXC'
      );

      if (!movimientoExistente) {
        await registrarPagoCXCTesorería(
          factura,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          factura.fechaPago
        );
        movimientosCreados++;
      }
    }

    console.log(`✅ Movimientos creados: ${movimientosCreados}`);
    return movimientosCreados;
  } catch (error) {
    console.error('❌ Error al sincronizar CXC con Tesorería:', error);
    return 0;
  }
}

// Función para registrar movimientos faltantes de CXC en Tesorería
function registrarMovimientosFaltantesCXC() {
  console.log('🔧 Registrando movimientos faltantes de CXC en Tesorería...');

  try {
    // Usar variable global cargada desde Firebase (NO localStorage)
    // Buscar facturas con pagos (completas o parciales)
    const facturasConPagos = facturasData.filter(f => f.montoPagado && f.montoPagado > 0);

    // Obtener movimientos de Tesorería
    const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');

    let movimientosCreados = 0;

    facturasConPagos.forEach(factura => {
      // Verificar si ya existe un movimiento para esta factura
      const movimientoExistente = tesoreria.find(
        m => m.referencia === factura.numeroFactura && m.origen === 'CXC'
      );

      if (!movimientoExistente) {
        // Obtener el número de factura en el formato correcto (serie-folio si están disponibles, sino numeroFactura)
        const numeroFacturaDisplay =
          factura.serie && factura.folio
            ? `${factura.serie}-${factura.folio}`
            : factura.numeroFactura || 'N/A';

        console.log(`💰 Creando movimiento para factura: ${numeroFacturaDisplay}`);

        // Crear movimiento de ingreso con el monto pagado (no el monto total)
        const nuevoMovimiento = {
          id: Date.now() + Math.random(),
          tipo: 'ingreso',
          monto: parseFloat(factura.montoPagado) || 0,
          descripcion: `[CXC] - ${numeroFacturaDisplay}`, // Formato: [CXC] - F-97255463
          categoria: 'Cuentas por Cobrar',
          fecha: new Date().toISOString().split('T')[0],
          referencia: factura.referenciaPago || factura.numeroFactura, // Usar referencia del pago si existe
          cliente: factura.cliente,
          fechaCreacion: new Date().toISOString(),
          origen: 'CXC',
          identificador: 'CXC',
          icono: '💰',
          color: '#28a745',
          etiqueta: 'CXC',
          numeroFactura: numeroFacturaDisplay, // Usar el formato correcto (serie-folio o numeroFactura)
          proveedorCliente: factura.cliente
        };

        // Agregar a tesorería
        tesoreria.push(nuevoMovimiento);
        movimientosCreados++;

        console.log(
          `✅ Movimiento creado: $${nuevoMovimiento.monto} de ${nuevoMovimiento.cliente}`
        );
      } else {
        console.log(`ℹ️ Movimiento ya existe para factura: ${factura.numeroFactura}`);
      }
    });

    if (movimientosCreados > 0) {
      // Guardar en localStorage
      localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(tesoreria));
      console.log(`🎉 ${movimientosCreados} movimientos creados en Tesorería`);
    } else {
      console.log('ℹ️ No se crearon movimientos nuevos');
    }

    // Verificar resultado final
    const movimientosCXC = tesoreria.filter(m => m.origen === 'CXC');
    console.log(`📊 Total movimientos de CXC en Tesorería: ${movimientosCXC.length}`);

    return movimientosCreados;
  } catch (error) {
    console.error('❌ Error al registrar movimientos:', error);
    return 0;
  }
}

// Hacer funciones disponibles globalmente
window.registrarPagoCXCTesorería = registrarPagoCXCTesorería;
window.marcarFacturaCXCPagada = marcarFacturaCXCPagada;
window.sincronizarCXCTesorería = sincronizarCXCTesorería;
window.registrarMovimientosFaltantesCXC = registrarMovimientosFaltantesCXC;

// Función para eliminar movimientos de CXC de Tesorería
function eliminarMovimientosCXCTesorería() {
  console.log('🗑️ Eliminando movimientos de CXC de Tesorería...');

  try {
    // Obtener movimientos de Tesorería
    const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');

    // Filtrar movimientos que NO sean de CXC
    const movimientosSinCXC = tesoreria.filter(mov => mov.origen !== 'CXC');

    // Guardar solo los movimientos que no son de CXC
    localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(movimientosSinCXC));

    const movimientosEliminados = tesoreria.length - movimientosSinCXC.length;
    console.log(`✅ ${movimientosEliminados} movimientos de CXC eliminados de Tesorería`);

    return movimientosEliminados;
  } catch (error) {
    console.error('❌ Error al eliminar movimientos de CXC:', error);
    return 0;
  }
}

// Hacer función disponible globalmente
window.eliminarMovimientosCXCTesorería = eliminarMovimientosCXCTesorería;

// Función de prueba para verificar que todos los pagos de CXC aparecen en Tesorería
window.verificarPagosCXCTesorería = function () {
  console.log('🔍 Verificando que todos los pagos de CXC aparecen en Tesorería...');

  try {
    // Usar variable global cargada desde Firebase (NO localStorage)
    const facturasConPagos = facturasData.filter(f => f.montoPagado && f.montoPagado > 0);

    // Obtener movimientos de Tesorería de CXC
    const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');
    const movimientosCXC = tesoreria.filter(m => m.origen === 'CXC');

    console.log(`📊 Facturas CXC con pagos: ${facturasConPagos.length}`);
    console.log(`📊 Movimientos CXC en Tesorería: ${movimientosCXC.length}`);

    // Verificar que cada factura con pagos tenga su movimiento en Tesorería
    let facturasSinMovimiento = 0;
    facturasConPagos.forEach(factura => {
      const movimientoExistente = movimientosCXC.find(
        m => m.referencia === factura.numeroFactura || m.numeroFactura === factura.numeroFactura
      );

      if (!movimientoExistente) {
        console.log(`❌ Factura ${factura.numeroFactura} tiene pagos pero no aparece en Tesorería`);
        facturasSinMovimiento++;
      } else {
        console.log(`✅ Factura ${factura.numeroFactura} aparece en Tesorería`);
      }
    });

    if (facturasSinMovimiento === 0) {
      console.log('✅ Todas las facturas con pagos aparecen en Tesorería');
    } else {
      console.log(`⚠️ ${facturasSinMovimiento} facturas con pagos no aparecen en Tesorería`);
    }

    return {
      facturasConPagos: facturasConPagos.length,
      movimientosCXC: movimientosCXC.length,
      facturasSinMovimiento: facturasSinMovimiento
    };
  } catch (error) {
    console.error('❌ Error al verificar pagos CXC en Tesorería:', error);
    return null;
  }
};

// Sincronizar datos existentes al cargar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    sincronizarCXCTesorería();
  }, 1000);
});
