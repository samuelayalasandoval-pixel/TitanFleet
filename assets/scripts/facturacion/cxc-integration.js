/**
 * Integración con Cuentas por Cobrar (CXC) - facturacion.html
 * Maneja el registro y verificación de facturas en el módulo CXC
 */

(function () {
  'use strict';

  /**
   * Registra una factura en Cuentas por Cobrar
   * @param {Object} datosFacturacion - Datos de la factura a registrar
   * @returns {Object|null} Factura registrada o null si hay error
   */
  window.registrarFacturaEnCXC = async function (datosFacturacion) {
    console.log('📋 ===== INICIANDO REGISTRO EN CXC =====');
    console.log('📋 Datos recibidos:', {
      registroId: datosFacturacion.registroId,
      serie: datosFacturacion.serie,
      folio: datosFacturacion.folio,
      cliente: datosFacturacion.Cliente || datosFacturacion.cliente,
      total: datosFacturacion['total factura'] || datosFacturacion.total,
      tieneFirebaseRepos: Boolean(window.firebaseRepos),
      tieneCXCRepo: Boolean(window.firebaseRepos && window.firebaseRepos.cxc)
    });

    try {
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

      // Validar datos mínimos
      if (!datosFacturacion.registroId) {
        console.error('❌ Error: falta registroId en los datos');
        return null;
      }

      const montoTotal = limpiarMoneda(
        datosFacturacion['total factura'] || datosFacturacion.total || 0
      );
      if (!montoTotal || montoTotal <= 0) {
        console.error('❌ Error: el monto total debe ser mayor a 0. Monto recibido:', montoTotal);
        return null;
      }

      // Asegurar que DataPersistence esté disponible
      if (typeof window.DataPersistence === 'undefined') {
        console.warn('⚠️ DataPersistence no disponible, creando versión de respaldo...');
        if (typeof window.ensureDataPersistence === 'function') {
          window.ensureDataPersistence();
        }
      }

      // Obtener datos actuales de CXC
      const cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');

      // Obtener serie y folio de los datos de facturación
      const serie = datosFacturacion.serie || '';
      const folio = datosFacturacion.folio || '';

      // Generar número de factura: usar serie-folio si están disponibles, sino usar el formato por defecto
      let { numeroFactura } = datosFacturacion;
      if (!numeroFactura) {
        if (serie && folio) {
          // Generar número de factura a partir de serie y folio
          numeroFactura = `${serie}-${folio}`;
        } else {
          // Fallback: generar número secuencial
          numeroFactura = `FAC-${new Date().getFullYear()}-${String(cxcData.length + 1).padStart(3, '0')}`;
        }
      }

      // Obtener días de crédito del cliente
      let diasCredito = 30; // Valor por defecto

      try {
        // Buscar información del cliente para obtener sus días de crédito
        const rfcCliente = datosFacturacion.Cliente;
        if (
          rfcCliente &&
          window.configuracionManager &&
          typeof window.configuracionManager.getCliente === 'function'
        ) {
          const clienteData = window.configuracionManager.getCliente(rfcCliente);
          if (clienteData && clienteData.diasCredito) {
            diasCredito = clienteData.diasCredito;
          }
        } else {
          // Fallback: buscar en localStorage
          const clientesData = localStorage.getItem('erp_clientes');
          if (clientesData) {
            const clientes = JSON.parse(clientesData);
            let clienteData = null;
            if (Array.isArray(clientes)) {
              clienteData = clientes.find(c => c.rfc === rfcCliente);
            } else {
              clienteData = clientes[rfcCliente];
            }
            if (clienteData && clienteData.diasCredito) {
              diasCredito = clienteData.diasCredito;
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo días de crédito del cliente:', e);
      }

      // Calcular fecha de vencimiento
      // Usar fechaFactura, fecha, fechaCreacion o fecha actual (en ese orden)
      const fechaFactura =
        datosFacturacion.fechaFactura ||
        datosFacturacion.fecha ||
        datosFacturacion.fechaCreacion ||
        new Date().toISOString().split('T')[0];

      // Asegurar que la fecha esté en formato YYYY-MM-DD
      let fechaFacturaFormateada = fechaFactura;
      if (fechaFactura.includes('T')) {
        fechaFacturaFormateada = fechaFactura.split('T')[0];
      }

      const fechaVencimiento = new Date(fechaFacturaFormateada);
      fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);

      // Crear objeto de factura para CXC
      const facturaId = datosFacturacion.registroId || numeroFactura;

      // Verificar si ya existe una factura con este ID o número de factura
      let facturaExistente = null;
      if (window.firebaseRepos?.cxc?.db && window.firebaseRepos?.cxc?.tenantId) {
        try {
          const facturasExistentes = await window.firebaseRepos.cxc.getAllFacturas();
          facturaExistente = facturasExistentes.find(
            f =>
              f.id === facturaId ||
              f.numeroFactura === numeroFactura ||
              (f.registroId && f.registroId === facturaId) ||
              (f.serie === serie && f.folio === folio && serie && folio)
          );
        } catch (error) {
          console.warn('⚠️ Error verificando factura existente:', error);
        }
      }

      // Si ya existe, no crear duplicado
      if (facturaExistente) {
        console.log('⚠️ La factura ya existe en CXC:', facturaExistente);
        console.log('📋 Factura existente:', {
          id: facturaExistente.id,
          numeroFactura: facturaExistente.numeroFactura,
          registroId: facturaExistente.registroId
        });
        return facturaExistente;
      }

      const facturaCXC = {
        id: facturaId,
        numeroFactura: numeroFactura,
        serie: serie,
        folio: folio,
        folioFiscal: datosFacturacion.folioFiscal || datosFacturacion['Folio Fiscal'] || '',
        fechaFactura: fechaFacturaFormateada,
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        cliente: datosFacturacion.Cliente || datosFacturacion.cliente || 'N/A',
        monto: montoTotal,
        saldo: montoTotal,
        montoPagado: 0,
        montoPendiente: montoTotal,
        estado: 'pendiente',
        diasCredito: diasCredito,
        tipo: 'factura',
        origen: 'facturacion',
        registroId: datosFacturacion.registroId || facturaId,
        subtotal: limpiarMoneda(datosFacturacion.Subtotal || 0),
        iva: limpiarMoneda(datosFacturacion.iva || 0),
        ivaRetenido: limpiarMoneda(datosFacturacion['iva retenido'] || 0),
        isrRetenido: limpiarMoneda(datosFacturacion['isr retenido'] || 0),
        otrosMontos: limpiarMoneda(datosFacturacion['Otros Montos'] || 0),
        tipoMoneda: datosFacturacion.tipoMoneda || datosFacturacion.moneda || 'MXN',
        tipoCambio: datosFacturacion.tipoCambio || '',
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
      };

      // PRIORIDAD: Guardar en Firebase primero
      console.log('🔥 Verificando disponibilidad de Firebase CXC...', {
        tieneFirebaseRepos: Boolean(window.firebaseRepos),
        tieneCXC: Boolean(window.firebaseRepos && window.firebaseRepos.cxc),
        tieneDb: Boolean(
          window.firebaseRepos && window.firebaseRepos.cxc && window.firebaseRepos.cxc.db
        ),
        tieneTenantId: Boolean(
          window.firebaseRepos && window.firebaseRepos.cxc && window.firebaseRepos.cxc.tenantId
        )
      });

      if (window.firebaseRepos?.cxc) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          const maxAttempts = 15; // Aumentar intentos
          while (
            attempts < maxAttempts &&
            (!window.firebaseRepos.cxc.db || !window.firebaseRepos.cxc.tenantId)
          ) {
            attempts++;
            console.log(
              `⏳ Esperando inicialización del repositorio CXC... (${attempts}/${maxAttempts})`
            );
            await new Promise(resolve => setTimeout(resolve, 500));
            if (typeof window.firebaseRepos.cxc.init === 'function') {
              try {
                await window.firebaseRepos.cxc.init();
              } catch (initError) {
                console.warn('⚠️ Error en init() del repositorio CXC:', initError);
              }
            }
          }

          if (window.firebaseRepos.cxc.db && window.firebaseRepos.cxc.tenantId) {
            console.log('🔥 Guardando factura en Firebase CXC...', {
              facturaId: facturaId,
              numeroFactura: numeroFactura,
              tenantId: window.firebaseRepos.cxc.tenantId,
              tieneDb: Boolean(window.firebaseRepos.cxc.db),
              coleccion: window.firebaseRepos.cxc.collectionName
            });

            console.log('📋 Objeto facturaCXC a guardar:', {
              id: facturaCXC.id,
              numeroFactura: facturaCXC.numeroFactura,
              tipo: facturaCXC.tipo,
              cliente: facturaCXC.cliente,
              monto: facturaCXC.monto
            });

            const resultado = await window.firebaseRepos.cxc.saveFactura(facturaId, facturaCXC);
            if (resultado) {
              console.log(`✅ Factura ${numeroFactura} guardada exitosamente en Firebase CXC`);

              // Verificar que se guardó inmediatamente
              try {
                const repoCXC = window.firebaseRepos.cxc;
                if (repoCXC && repoCXC.db && repoCXC.tenantId) {
                  // Esperar un momento para que Firebase procese
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const facturasVerificacion = await repoCXC.getAllFacturas();
                  const facturaEncontrada = facturasVerificacion.find(
                    f =>
                      f.numeroFactura === numeroFactura ||
                      f.id === facturaId ||
                      (f.registroId && f.registroId === facturaId) ||
                      (f.serie === serie && f.folio === folio && serie && folio)
                  );
                  if (facturaEncontrada) {
                    console.log('✅ Factura encontrada en Firebase CXC después de guardar:', {
                      id: facturaEncontrada.id,
                      numeroFactura: facturaEncontrada.numeroFactura
                    });
                  } else {
                    console.warn(
                      '⚠️ Factura no encontrada en Firebase CXC después de guardar. Total facturas:',
                      facturasVerificacion.length
                    );
                  }
                }
              } catch (error) {
                console.error('❌ Error verificando factura en Firebase:', error);
              }
            } else {
              console.warn('⚠️ saveFactura() retornó false, continuando con localStorage...');
            }
          } else {
            console.warn('⚠️ Repositorio CXC no inicializado después de esperar:', {
              tieneDb: Boolean(window.firebaseRepos.cxc.db),
              tieneTenantId: Boolean(window.firebaseRepos.cxc.tenantId)
            });
            console.log('⚠️ Guardando solo en localStorage...');
          }
        } catch (firebaseError) {
          console.error('❌ Error guardando en Firebase CXC:', firebaseError);
          console.error('❌ Stack trace:', firebaseError.stack);
          console.log('⚠️ Continuando con guardado en localStorage...');
        }
      } else {
        console.warn('⚠️ Repositorio de Firebase CXC no disponible:', {
          tieneFirebaseRepos: Boolean(window.firebaseRepos),
          tieneCXC: Boolean(window.firebaseRepos && window.firebaseRepos.cxc)
        });
        console.log('⚠️ Guardando solo en localStorage...');
      }

      // Verificar si ya existe en localStorage antes de agregar
      const existeEnLocalStorage = cxcData.some(
        f =>
          f.id === facturaId ||
          f.numeroFactura === numeroFactura ||
          (f.registroId && f.registroId === facturaId) ||
          (f.serie === serie && f.folio === folio && serie && folio)
      );

      if (!existeEnLocalStorage) {
        // Agregar a la lista de facturas
        cxcData.push(facturaCXC);

        // Guardar en localStorage (siempre como respaldo)
        localStorage.setItem('erp_cxc_data', JSON.stringify(cxcData));
        console.log('✅ Factura agregada a localStorage CXC');
      } else {
        console.log('⚠️ La factura ya existe en localStorage, no se agregará duplicado');
      }

      console.log('✅ Factura registrada en CXC:', {
        id: facturaCXC.id,
        numeroFactura: facturaCXC.numeroFactura,
        serie: facturaCXC.serie,
        folio: facturaCXC.folio,
        cliente: facturaCXC.cliente,
        monto: facturaCXC.monto,
        registroId: facturaCXC.registroId
      });

      return facturaCXC;
    } catch (error) {
      console.error('❌ Error al registrar factura en CXC:', error);
      return null;
    }
  };

  /**
   * Verifica facturas en Cuentas por Cobrar
   */
  window.verificarFacturasCXC = function () {
    console.log('🔍 Verificando facturas en Cuentas por Cobrar...');

    try {
      // Obtener datos de CXC
      const cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
      console.log('📊 Facturas en CXC:', cxcData);

      // Obtener datos de facturación del ERP
      const erpData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      const facturasERP = erpData.facturas || {};
      console.log('📊 Facturas en ERP:', facturasERP);

      // Mostrar resumen
      const mensaje = `📋 VERIFICACIÓN DE FACTURAS CXC

📊 Resumen:
- Facturas en CXC: ${cxcData.length}
- Facturas en ERP: ${Object.keys(facturasERP).length}

📋 Facturas en CXC:
${cxcData.length > 0 ? cxcData.map(f => `• ${f.numeroFactura} - ${f.cliente} - $${f.monto}`).join('\n') : '• No hay facturas registradas'}

📋 Facturas en ERP:
${
  Object.keys(facturasERP).length > 0
    ? Object.keys(facturasERP)
      .map(id => `• ${id} - ${facturasERP[id].Cliente || 'Sin cliente'}`)
      .join('\n')
    : '• No hay facturas registradas'
  }

🔧 Acciones disponibles:
- Usa "Probar CXC" para registrar una factura de prueba
- Revisa la consola para más detalles`;

      console.log('📋 Resumen de verificación:', {
        cxcCount: cxcData.length,
        erpCount: Object.keys(facturasERP).length,
        cxcFacturas: cxcData,
        erpFacturas: facturasERP
      });

      alert(mensaje);
    } catch (error) {
      console.error('❌ Error verificando facturas CXC:', error);
      alert(`Error verificando facturas CXC: ${error.message}`);
    }
  };
})();
