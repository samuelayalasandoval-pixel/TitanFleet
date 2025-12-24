// ===== TESORERÍA: Órdenes de Pago =====

(function () {
  const STORAGE_KEY = 'erp_teso_ordenes_pago';

  async function loadOrdenes() {
    try {
      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          // Verificar que el repositorio esté inicializado
          if (window.firebaseRepos.tesoreria.db && window.firebaseRepos.tesoreria.tenantId) {
            const ordenes = await window.firebaseRepos.tesoreria.getAllOrdenesPago();
            if (ordenes && Array.isArray(ordenes)) {
              // Sincronizar con localStorage SIEMPRE, incluso si está vacío
              localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenes));
              console.log(`📊 ${ordenes.length} órdenes cargadas desde Firebase`);
              // Si hay órdenes en Firebase, devolverlas
              if (ordenes.length > 0) {
                return ordenes;
              }
              // Si Firebase está vacío, continuar para verificar localStorage
            }
          } else {
            console.log('⏳ Repositorio Tesorería no inicializado aún, usando localStorage');
          }
        } catch (error) {
          console.warn('⚠️ Error cargando órdenes desde Firebase, usando localStorage:', error);
        }
      }

      // FIREBASE ES LA FUENTE DE VERDAD
      // localStorage solo como cache/respaldo de emergencia (NO debe ser la fuente principal)
      // Solo usar si Firebase falló completamente o no está disponible
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        try {
          const ordenes = JSON.parse(data);
          if (Array.isArray(ordenes)) {
            // Asegurar que todas las órdenes tengan un ID válido
            const ordenesConId = ordenes.map((orden, index) => {
              if (!orden.id || orden.id === undefined || orden.id === null) {
                console.warn(
                  '⚠️ Orden sin ID válido en localStorage, generando ID temporal:',
                  orden
                );
                const ordenId = orden._id || orden.documentId || Date.now() + index;
                return { ...orden, id: ordenId };
              }
              return orden;
            });
            if (ordenesConId.length > 0) {
              console.log(
                `⚠️ ${ordenesConId.length} órdenes cargadas desde localStorage (respaldo de emergencia - Firebase es la fuente de verdad)`
              );
              return ordenesConId;
            }
          }
        } catch (error) {
          console.error('❌ Error parseando órdenes desde localStorage:', error);
        }
      }
      return [];
    } catch (e) {
      console.error('❌ Error leyendo órdenes de pago:', e);
      return [];
    }
  }

  async function saveOrdenes(ordenes) {
    try {
      // Asegurar que ordenes es un array
      const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
      console.log(`💾 Guardando ${ordenesArray.length} orden(es) de pago...`);

      // Log de órdenes con solicitudId (de CXP)
      const ordenesCXP = ordenesArray.filter(o => o.solicitudId);
      if (ordenesCXP.length > 0) {
        console.log(
          `📋 ${ordenesCXP.length} orden(es) de CXP a guardar:`,
          ordenesCXP.map(o => ({
            id: o.id,
            solicitudId: o.solicitudId,
            proveedor: o.proveedor,
            monto: o.monto
          }))
        );
      }

      // Guardar en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenesArray));

      // Guardar en Firebase también
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
            // Guardar cada orden en Firebase
            let guardadas = 0;
            let errores = 0;
            for (const orden of ordenesArray) {
              try {
                const ordenId = `orden_${orden.id}`;
                // Limpiar campos undefined antes de guardar
                const ordenLimpio = {};
                for (const key in orden) {
                  if (orden.hasOwnProperty(key) && orden[key] !== undefined) {
                    ordenLimpio[key] = orden[key];
                  }
                }

                const ordenData = {
                  ...ordenLimpio,
                  tipo: 'orden_pago', // Asegurar que siempre tenga el tipo
                  fechaCreacion: orden.createdAt || orden.fechaCreacion || new Date().toISOString()
                };

                // Log para órdenes de CXP
                if (orden.solicitudId) {
                  console.log(`💾 Guardando orden de CXP en Firebase: ${ordenId}`, {
                    solicitudId: orden.solicitudId,
                    proveedor: orden.proveedor,
                    monto: orden.monto,
                    tipo: ordenData.tipo,
                    tieneProveedorId: ordenData.proveedorId !== undefined
                  });
                }

                await window.firebaseRepos.tesoreria.saveOrdenPago(ordenId, ordenData);
                guardadas++;
              } catch (error) {
                console.error(`❌ Error guardando orden ${orden.id} en Firebase:`, error);
                errores++;
              }
            }
            console.log(
              `✅ ${guardadas} orden(es) de pago guardadas en Firebase${errores > 0 ? `, ${errores} error(es)` : ''}`
            );
          } else {
            console.warn('⚠️ Repositorio Tesorería no inicializado completamente');
          }
        } catch (error) {
          console.error('❌ Error guardando órdenes en Firebase:', error);
        }
      } else {
        console.warn('⚠️ Repositorio Tesorería no disponible');
      }
    } catch (e) {
      console.error('❌ Error guardando órdenes de pago:', e);
    }
  }

  function createOrdenFromSolicitud(solicitud) {
    console.log('📋 Creando orden desde solicitud:', {
      id: solicitud.id,
      proveedor: solicitud.proveedor,
      proveedorId: solicitud.proveedorId,
      monto: solicitud.monto,
      estado: solicitud.estado,
      facturasIncluidas: solicitud.facturasIncluidas
    });

    // Validar que la solicitud tenga datos mínimos
    if (!solicitud.id) {
      console.error('❌ Solicitud no tiene ID válido');
      throw new Error('Solicitud no tiene ID válido');
    }

    if (!solicitud.proveedor || solicitud.proveedor.trim() === '') {
      console.warn('⚠️ Solicitud no tiene proveedor, usando valor por defecto');
    }

    if (!solicitud.monto || solicitud.monto === 0) {
      console.warn('⚠️ Solicitud no tiene monto válido');
    }

    // Intentar obtener el número de factura (si es una sola factura) - sincrónico desde localStorage
    let opNumeroFactura = null;
    try {
      const facturasData = localStorage.getItem('erp_cxp_facturas');
      if (facturasData) {
        const facturas = JSON.parse(facturasData);
        if (Array.isArray(solicitud.facturasIncluidas) && solicitud.facturasIncluidas.length > 0) {
          const f = facturas.find(x => x.id === solicitud.facturasIncluidas[0]);
          if (f && f.numeroFactura) {
            opNumeroFactura = f.numeroFactura;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo número de factura:', error);
    }

    // Crear orden base sin campos undefined
    const orden = {
      id: Date.now(),
      solicitudId: solicitud.id,
      proveedor: solicitud.proveedor || '',
      monto: parseFloat(solicitud.monto || 0),
      facturasIncluidas: Array.isArray(solicitud.facturasIncluidas)
        ? solicitud.facturasIncluidas.slice()
        : [],
      prioridad: solicitud.prioridad || 'normal',
      fechaRequerida: solicitud.fechaRequerida || null,
      estado: 'por_pagar',
      metodoPago: solicitud.metodoPago || 'transferencia',
      adjuntos: [],
      tipo: 'orden_pago', // Campo importante para que el listener lo detecte
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Solo incluir proveedorId si tiene valor válido (no undefined, no null, no vacío)
    if (
      solicitud.proveedorId !== undefined &&
      solicitud.proveedorId !== null &&
      solicitud.proveedorId !== ''
    ) {
      orden.proveedorId = solicitud.proveedorId;
    }

    // Solo incluir opNumeroFactura si tiene valor
    if (opNumeroFactura) {
      orden.opNumeroFactura = opNumeroFactura;
    }

    console.log('✅ Orden creada:', {
      id: orden.id,
      solicitudId: orden.solicitudId,
      proveedor: orden.proveedor,
      proveedorId: orden.proveedorId !== undefined ? orden.proveedorId : 'N/A (no incluido)',
      monto: orden.monto,
      tipo: orden.tipo,
      facturasIncluidas: orden.facturasIncluidas.length
    });

    return orden;
  }

  async function addOrdenPagoFromSolicitud(solicitud) {
    // Usar un lock por solicitudId para evitar ejecuciones simultáneas
    const lockKey = `_creandoOrden_${solicitud.id}`;
    if (window[lockKey]) {
      console.log('⏳ Orden ya se está creando para esta solicitud, esperando...');
      // Esperar hasta que se complete la creación anterior
      let attempts = 0;
      while (window[lockKey] && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      // Intentar cargar la orden que debería haberse creado
      const ordenes = await loadOrdenes();
      const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
      const ordenExistente = ordenesArray.find(op => op.solicitudId === solicitud.id);
      if (ordenExistente) {
        console.log('✅ Orden encontrada después de esperar:', ordenExistente.id);
        return ordenExistente;
      }
    }

    // Activar lock
    window[lockKey] = true;

    try {
      console.log('🔍 Verificando si ya existe orden para solicitud:', solicitud.id);

      // Verificar primero en Firebase (fuente de verdad)
      let ordenExistente = null;
      if (
        window.firebaseRepos?.tesoreria &&
        window.firebaseRepos.tesoreria.db &&
        window.firebaseRepos.tesoreria.tenantId
      ) {
        try {
          const ordenesFirebase = await window.firebaseRepos.tesoreria.getAllOrdenesPago();
          // Verificar por solicitudId
          ordenExistente = ordenesFirebase.find(op => op.solicitudId === solicitud.id);

          // Si no se encuentra por solicitudId, verificar por datos
          if (!ordenExistente) {
            ordenExistente = ordenesFirebase.find(
              op =>
                op.proveedor === solicitud.proveedor &&
                Math.abs(parseFloat(op.monto || 0) - parseFloat(solicitud.monto || 0)) < 0.01 &&
                op.facturasIncluidas &&
                Array.isArray(op.facturasIncluidas) &&
                solicitud.facturasIncluidas &&
                Array.isArray(solicitud.facturasIncluidas) &&
                op.facturasIncluidas.length === solicitud.facturasIncluidas.length &&
                op.facturasIncluidas.every((fid, idx) => fid === solicitud.facturasIncluidas[idx])
            );
          }
        } catch (error) {
          console.warn('⚠️ Error verificando Firebase, usando localStorage:', error);
        }
      }

      // Si no se encontró en Firebase, verificar en localStorage
      if (!ordenExistente) {
        const ordenes = await loadOrdenes();
        const ordenesArray = Array.isArray(ordenes) ? ordenes : [];

        // Verificar si ya existe una orden para esta solicitud (por solicitudId)
        ordenExistente = ordenesArray.find(op => op.solicitudId === solicitud.id);

        // Si no se encuentra por solicitudId, verificar por monto y proveedor
        if (!ordenExistente) {
          ordenExistente = ordenesArray.find(
            op =>
              op.proveedor === solicitud.proveedor &&
              Math.abs(parseFloat(op.monto || 0) - parseFloat(solicitud.monto || 0)) < 0.01 &&
              op.facturasIncluidas &&
              Array.isArray(op.facturasIncluidas) &&
              solicitud.facturasIncluidas &&
              Array.isArray(solicitud.facturasIncluidas) &&
              op.facturasIncluidas.length === solicitud.facturasIncluidas.length &&
              op.facturasIncluidas.every((fid, idx) => fid === solicitud.facturasIncluidas[idx])
          );
        }
      }

      if (ordenExistente) {
        console.log('ℹ️ Orden de pago ya existe para esta solicitud:', {
          ordenId: ordenExistente.id,
          solicitudId: ordenExistente.solicitudId,
          estado: ordenExistente.estado,
          proveedor: ordenExistente.proveedor
        });
        return ordenExistente; // Retornar la orden existente
      }

      // Cargar órdenes para agregar la nueva
      const ordenes = await loadOrdenes();
      const ordenesArray = Array.isArray(ordenes) ? ordenes : [];

      console.log('✅ No se encontró orden existente, creando nueva orden...');
      const orden = createOrdenFromSolicitud(solicitud);
      ordenesArray.push(orden);
      await saveOrdenes(ordenesArray);
      console.log('🏦 Orden de Pago creada en Tesorería:', {
        id: orden.id,
        solicitudId: orden.solicitudId,
        proveedor: orden.proveedor,
        monto: orden.monto,
        estado: orden.estado
      });

      // Guardar en Firebase también
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
            const ordenId = `orden_${orden.id}`;

            // Limpiar campos undefined antes de guardar
            const ordenLimpio = {};
            for (const key in orden) {
              if (orden.hasOwnProperty(key) && orden[key] !== undefined) {
                ordenLimpio[key] = orden[key];
              }
            }

            const ordenData = {
              ...ordenLimpio,
              tipo: 'orden_pago',
              fechaCreacion: orden.createdAt || new Date().toISOString()
            };

            await window.firebaseRepos.tesoreria.saveOrdenPago(ordenId, ordenData);
            console.log(`✅ Orden de Pago guardada en Firebase: ${ordenId}`, ordenData);
            console.log('📋 Datos de la orden guardada:', {
              id: orden.id,
              solicitudId: orden.solicitudId,
              proveedor: orden.proveedor,
              monto: orden.monto,
              tipo: ordenData.tipo,
              estado: orden.estado
            });

            // Forzar recarga de órdenes después de guardar
            setTimeout(async () => {
              try {
                const ordenesActualizadas = await loadOrdenes();
                if (typeof renderOrdenes === 'function') {
                  renderOrdenes(ordenesActualizadas);
                  console.log(
                    `🔄 Órdenes recargadas: ${ordenesActualizadas.length} órdenes encontradas`
                  );
                } else {
                  console.warn('⚠️ renderOrdenes no está disponible');
                }
              } catch (e) {
                console.warn('⚠️ Error al recargar órdenes:', e);
              }
            }, 1000);
          } else {
            console.warn(
              '⚠️ Repositorio Tesorería no inicializado completamente para guardar orden'
            );
          }
        } catch (error) {
          console.error('❌ Error guardando orden de pago en Firebase:', error);
          console.log('⚠️ Continuando con localStorage...');
        }
      } else {
        console.warn('⚠️ Repositorio Tesorería no disponible para guardar orden');
      }

      return orden;
    } finally {
      // Liberar lock
      delete window[lockKey];
    }
  }

  async function marcarOrdenPagada(ordenId, infoPago) {
    const ordenes = await loadOrdenes();
    // Asegurar que ordenes es un array
    const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
    const idx = ordenesArray.findIndex(o => o.id === ordenId);
    if (idx === -1) {
      return false;
    }
    const orden = ordenesArray[idx];

    const montoPago = parseFloat(infoPago?.monto || orden.monto || 0);
    const montoOrden = parseFloat(orden.monto || 0);
    const montoPagadoAnterior = parseFloat(orden.montoPagado || 0);
    const nuevoMontoPagado = montoPagadoAnterior + montoPago;
    const esPagoCompleto = nuevoMontoPagado >= montoOrden;

    // Determinar estado según si es pago completo o parcial
    orden.estado = esPagoCompleto ? 'pagado' : 'parcial pagado';
    orden.montoPagado = nuevoMontoPagado;
    orden.infoPago = Object.assign({ fechaPago: new Date().toISOString() }, infoPago || {});
    orden.updatedAt = new Date().toISOString();
    ordenesArray[idx] = orden;

    // Guardar en localStorage primero
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenesArray));

    // Guardar la orden actualizada en Firebase explícitamente
    if (
      window.firebaseRepos?.tesoreria &&
      window.firebaseRepos.tesoreria.db &&
      window.firebaseRepos.tesoreria.tenantId
    ) {
      try {
        const ordenId = `orden_${orden.id}`;

        // Limpiar campos undefined antes de guardar
        const ordenLimpio = {};
        for (const key in orden) {
          if (orden.hasOwnProperty(key) && orden[key] !== undefined) {
            ordenLimpio[key] = orden[key];
          }
        }

        const ordenData = {
          ...ordenLimpio,
          tipo: 'orden_pago', // Asegurar que siempre tenga el tipo
          fechaCreacion: orden.createdAt || orden.fechaCreacion || new Date().toISOString()
        };

        await window.firebaseRepos.tesoreria.saveOrdenPago(ordenId, ordenData);
        console.log(`✅ Orden actualizada en Firebase después de pago: ${ordenId}`, {
          id: orden.id,
          solicitudId: orden.solicitudId,
          estado: orden.estado,
          montoPagado: orden.montoPagado,
          proveedor: orden.proveedor
        });
      } catch (error) {
        console.error('❌ Error guardando orden actualizada en Firebase:', error);
      }
    }

    // También guardar todas las órdenes para sincronización completa
    // IMPORTANTE: Guardar la orden actualizada ANTES de actualizar la solicitud en CXP
    // para evitar que el listener cree una nueva orden
    await saveOrdenes(ordenesArray);

    // Esperar un momento para que la orden se guarde completamente en Firebase
    await new Promise(resolve => setTimeout(resolve, 500));

    // Sincronizar con CXP: actualizar solicitud y facturas según el tipo de pago
    try {
      // PRIORIDAD 1: Actualizar en Firebase si está disponible
      if (window.firebaseRepos?.cxp) {
        try {
          const repoCXP = window.firebaseRepos.cxp;

          // Esperar inicialización
          let attempts = 0;
          while (attempts < 10 && (!repoCXP.db || !repoCXP.tenantId)) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 300));
            if (typeof repoCXP.init === 'function') {
              try {
                await repoCXP.init();
              } catch (e) {
                // Ignorar error intencionalmente
              }
            }
          }

          if (repoCXP.db && repoCXP.tenantId) {
            // Cargar facturas y solicitud desde Firebase
            const facturasFirebase = await repoCXP.getAllFacturas();
            const solicitudesFirebase = await repoCXP.getAllSolicitudes();

            // Actualizar solicitud en Firebase
            if (orden.solicitudId) {
              const solicitudFirebase = solicitudesFirebase.find(s => s.id === orden.solicitudId);
              if (solicitudFirebase) {
                const estadoSolicitud = esPagoCompleto ? 'pagada' : 'parcial pagado';
                const solicitudActualizada = {
                  ...solicitudFirebase,
                  estado: estadoSolicitud,
                  montoPagado: nuevoMontoPagado,
                  fechaPago: infoPago?.fechaPago || new Date().toISOString(),
                  fechaActualizacion: new Date().toISOString()
                };

                // Desactivar temporalmente la verificación de órdenes para evitar que se cree una nueva orden
                window._verificandoOrdenesCXP = true;

                await repoCXP.saveSolicitud(`solicitud_${orden.solicitudId}`, solicitudActualizada);
                console.log(`✅ Solicitud actualizada en Firebase como ${estadoSolicitud}`);

                // Esperar un momento antes de reactivar la verificación
                setTimeout(() => {
                  delete window._verificandoOrdenesCXP;
                }, 2000);
              }
            }

            // Actualizar facturas en Firebase
            if (orden.facturasIncluidas && Array.isArray(orden.facturasIncluidas)) {
              // Distribuir el pago proporcionalmente entre las facturas
              const facturasRelacionadas = facturasFirebase.filter(f =>
                orden.facturasIncluidas.includes(f.id)
              );
              const montoPendienteTotal = facturasRelacionadas.reduce((sum, f) => {
                const montoPendiente =
                  f.montoPendiente !== undefined
                    ? parseFloat(f.montoPendiente)
                    : parseFloat(f.monto || 0);
                return sum + montoPendiente;
              }, 0);

              let montoRestante = montoPago;

              for (const facturaId of orden.facturasIncluidas) {
                const facturaFirebase = facturasFirebase.find(f => f.id === facturaId);
                if (facturaFirebase) {
                  const montoFactura = parseFloat(facturaFirebase.monto || 0);
                  const montoPagadoActual = parseFloat(facturaFirebase.montoPagado || 0);
                  const montoPendienteActual =
                    facturaFirebase.montoPendiente !== undefined
                      ? parseFloat(facturaFirebase.montoPendiente)
                      : montoFactura - montoPagadoActual;

                  // Calcular cuánto se aplica a esta factura (proporcional)
                  let montoAplicar = 0;
                  if (montoPendienteTotal > 0 && montoRestante > 0) {
                    const proporcion = montoPendienteActual / montoPendienteTotal;
                    montoAplicar = Math.min(
                      montoPago * proporcion,
                      montoPendienteActual,
                      montoRestante
                    );
                    montoRestante -= montoAplicar;
                  }

                  const nuevoMontoPagadoFactura = montoPagadoActual + montoAplicar;
                  const nuevoMontoPendienteFactura = montoPendienteActual - montoAplicar;
                  const estadoFactura =
                    nuevoMontoPendienteFactura <= 0.01 ? 'pagada' : 'parcial pagado';

                  const facturaActualizada = {
                    ...facturaFirebase,
                    montoPagado: nuevoMontoPagadoFactura,
                    montoPendiente: nuevoMontoPendienteFactura,
                    estado: estadoFactura,
                    fechaPago: infoPago?.fechaPago || new Date().toISOString(),
                    fechaActualizacion: new Date().toISOString()
                  };
                  await repoCXP.saveFactura(`factura_${facturaId}`, facturaActualizada);
                }
              }
              console.log(
                `✅ Facturas actualizadas en Firebase (${esPagoCompleto ? 'pagadas' : 'parcial pagadas'})`
              );
            }
          }
        } catch (firebaseError) {
          console.warn('⚠️ Error actualizando en Firebase:', firebaseError);
        }
      }

      // PRIORIDAD 2: Actualizar en localStorage
      const solicitudesData = localStorage.getItem('erp_cxp_solicitudes');
      let solicitudes = solicitudesData ? JSON.parse(solicitudesData) : [];
      solicitudes = solicitudes.map(s => {
        if (s.id === orden.solicitudId) {
          return {
            ...s,
            estado: esPagoCompleto ? 'pagada' : 'parcial pagado',
            montoPagado: nuevoMontoPagado,
            fechaPago: infoPago?.fechaPago || new Date().toISOString()
          };
        }
        return s;
      });
      localStorage.setItem('erp_cxp_solicitudes', JSON.stringify(solicitudes));

      const facturasData = localStorage.getItem('erp_cxp_facturas');
      let facturas = facturasData ? JSON.parse(facturasData) : [];

      // Distribuir el pago proporcionalmente entre las facturas
      if (orden.facturasIncluidas && Array.isArray(orden.facturasIncluidas)) {
        const facturasRelacionadas = facturas.filter(f => orden.facturasIncluidas.includes(f.id));
        const montoPendienteTotal = facturasRelacionadas.reduce((sum, f) => {
          const montoPendiente =
            f.montoPendiente !== undefined
              ? parseFloat(f.montoPendiente)
              : parseFloat(f.monto || 0);
          return sum + montoPendiente;
        }, 0);

        let montoRestante = montoPago;

        facturas = facturas.map(f => {
          if (!orden.facturasIncluidas || !orden.facturasIncluidas.includes(f.id)) {
            return f;
          }

          const montoFactura = parseFloat(f.monto || 0);
          const montoPagadoActual = parseFloat(f.montoPagado || 0);
          const montoPendienteActual =
            f.montoPendiente !== undefined
              ? parseFloat(f.montoPendiente)
              : montoFactura - montoPagadoActual;

          // Calcular cuánto se aplica a esta factura (proporcional)
          let montoAplicar = 0;
          if (montoPendienteTotal > 0 && montoRestante > 0) {
            const proporcion = montoPendienteActual / montoPendienteTotal;
            montoAplicar = Math.min(montoPago * proporcion, montoPendienteActual, montoRestante);
            montoRestante -= montoAplicar;
          }

          const nuevoMontoPagadoFactura = montoPagadoActual + montoAplicar;
          const nuevoMontoPendienteFactura = montoPendienteActual - montoAplicar;
          const estadoFactura = nuevoMontoPendienteFactura <= 0.01 ? 'pagada' : 'parcial pagado';

          return {
            ...f,
            montoPagado: nuevoMontoPagadoFactura,
            montoPendiente: nuevoMontoPendienteFactura,
            estado: estadoFactura,
            fechaPago: infoPago?.fechaPago || new Date().toISOString()
          };
        });
      }

      localStorage.setItem('erp_cxp_facturas', JSON.stringify(facturas));

      console.log(
        `🔁 Sincronizado: solicitud y facturas marcadas como ${esPagoCompleto ? 'pagadas' : 'parcial pagadas'}`
      );
    } catch (e) {
      console.error('❌ Error sincronizando con CXP al marcar pagado:', e);
    }
    return true;
  }

  window.tesoreriaManager = {
    loadOrdenes,
    saveOrdenes,
    addOrdenPagoFromSolicitud,
    marcarOrdenPagada,
    renderOrdenes: typeof renderOrdenes !== 'undefined' ? renderOrdenes : null
  };

  // UI helpers
  // Guardar órdenes completas para paginación
  window._ordenesTesoreriaCompletas = [];

  function renderOrdenes(ordenesParaRenderizar = null) {
    const tbody = document.getElementById('tbodyOrdenesPago');
    if (!tbody) {
      // Verificar si estamos en la pestaña correcta
      const tabSolicitudes = document.getElementById('solicitudes-tab');
      const tabSolicitudesContent = document.getElementById('solicitudes');

      if (tabSolicitudes && tabSolicitudesContent) {
        const isActive =
          tabSolicitudes.classList.contains('active') ||
          tabSolicitudesContent.classList.contains('active');
        if (!isActive) {
          // No estamos en la pestaña de Solicitudes, no renderizar
          return;
        }
      }

      console.warn(
        '⚠️ No se encontró tbodyOrdenesPago en el DOM. La pestaña de Solicitudes puede no estar activa.'
      );
      return;
    }

    // Si se proporcionan órdenes específicas, guardarlas y renderizarlas con paginación
    if (ordenesParaRenderizar !== null) {
      // Filtrar duplicados antes de guardar
      const ordenesUnicas = [];
      const idsVistos = new Set();

      ordenesParaRenderizar.forEach(op => {
        if (!op.id || op.id === undefined || op.id === null) {
          return; // Saltar órdenes sin ID
        }
        if (idsVistos.has(op.id)) {
          console.warn(`⚠️ Orden duplicada encontrada (ID: ${op.id}), omitiendo`);
          return; // Saltar duplicados
        }
        if (!op.proveedor && (!op.monto || op.monto === 0)) {
          console.warn(`⚠️ Orden sin datos completos (ID: ${op.id}), omitiendo`);
          return; // Saltar órdenes sin datos
        }
        idsVistos.add(op.id);
        ordenesUnicas.push(op);
      });

      console.log(
        `📊 ${ordenesUnicas.length} orden(es) única(s) de ${ordenesParaRenderizar.length} total(es) después de filtrar duplicados`
      );
      window._ordenesTesoreriaCompletas = ordenesUnicas;

      // Inicializar paginación
      const PaginacionManagerClass =
        typeof PaginacionManager !== 'undefined'
          ? PaginacionManager
          : typeof window.PaginacionManager !== 'undefined'
            ? window.PaginacionManager
            : null;

      if (!PaginacionManagerClass) {
        console.warn(
          '⚠️ PaginacionManager no está disponible, mostrando todas las órdenes sin paginación'
        );
        renderizarOrdenesDirectamente(ordenesParaRenderizar);
        return;
      }

      if (!window._paginacionSolicitudesTesoreriaManager) {
        try {
          window._paginacionSolicitudesTesoreriaManager = new PaginacionManagerClass();
          console.log('✅ Nueva instancia de PaginacionManager creada para Solicitudes Tesorería');
        } catch (error) {
          console.error('❌ Error creando instancia de PaginacionManager:', error);
          renderizarOrdenesDirectamente(ordenesParaRenderizar);
          return;
        }
      }

      try {
        // Crear array de IDs para paginación
        const ordenesIds = ordenesParaRenderizar.map(o =>
          String(o.id || Date.now() + Math.random())
        );
        window._paginacionSolicitudesTesoreriaManager.inicializar(ordenesIds, 15);
        window._paginacionSolicitudesTesoreriaManager.paginaActual = 1;
        console.log(
          `✅ Paginación inicializada: ${window._paginacionSolicitudesTesoreriaManager.totalRegistros} órdenes, ${window._paginacionSolicitudesTesoreriaManager.obtenerTotalPaginas()} páginas`
        );

        // Renderizar órdenes de la página actual
        renderizarOrdenesPaginadas();

        // Generar controles de paginación
        const contenedorPaginacion = document.getElementById('paginacionSolicitudesTesoreria');
        if (contenedorPaginacion && window._paginacionSolicitudesTesoreriaManager) {
          contenedorPaginacion.innerHTML =
            window._paginacionSolicitudesTesoreriaManager.generarControlesPaginacion(
              'paginacionSolicitudesTesoreria',
              'cambiarPaginaSolicitudesTesoreria'
            );
        }
      } catch (error) {
        console.error('❌ Error inicializando paginación:', error);
        renderizarOrdenesDirectamente(ordenesParaRenderizar);
      }
      return;
    }

    // Si no se proporcionan órdenes, usar paginación
    if (window._paginacionSolicitudesTesoreriaManager && window._ordenesTesoreriaCompletas) {
      renderizarOrdenesPaginadas();
    }
  }

  function renderizarOrdenesPaginadas() {
    const tbody = document.getElementById('tbodyOrdenesPago');
    if (!tbody) {
      return;
    }

    if (!window._paginacionSolicitudesTesoreriaManager || !window._ordenesTesoreriaCompletas) {
      console.warn(
        '⚠️ No se puede renderizar: paginacion=',
        Boolean(window._paginacionSolicitudesTesoreriaManager),
        'ordenes=',
        Boolean(window._ordenesTesoreriaCompletas)
      );
      return;
    }

    const ordenesIds = window._paginacionSolicitudesTesoreriaManager.obtenerRegistrosPagina();
    const ordenesMap = {};
    window._ordenesTesoreriaCompletas.forEach(orden => {
      const id = String(orden.id || Date.now() + Math.random());
      ordenesMap[id] = orden;
    });

    const ordenesPagina = ordenesIds.map(id => ordenesMap[id]).filter(orden => orden !== undefined);

    renderizarOrdenesDirectamente(ordenesPagina);

    // Actualizar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionSolicitudesTesoreria');
    if (contenedorPaginacion && window._paginacionSolicitudesTesoreriaManager) {
      contenedorPaginacion.innerHTML =
        window._paginacionSolicitudesTesoreriaManager.generarControlesPaginacion(
          'paginacionSolicitudesTesoreria',
          'cambiarPaginaSolicitudesTesoreria'
        );
    }

    console.log(
      `✅ ${window._paginacionSolicitudesTesoreriaManager.totalRegistros} órdenes de tesorería cargadas (página ${window._paginacionSolicitudesTesoreriaManager.paginaActual} de ${window._paginacionSolicitudesTesoreriaManager.obtenerTotalPaginas()})`
    );
  }

  function renderizarOrdenesDirectamente(ordenes) {
    const tbody = document.getElementById('tbodyOrdenesPago');
    if (!tbody) {
      return;
    }

    console.log(`🎨 Renderizando ${ordenes.length} orden(es) en la tabla...`);
    console.log(
      '📋 Datos de las órdenes a renderizar:',
      ordenes.map(o => ({
        id: o.id,
        proveedor: o.proveedor,
        monto: o.monto,
        estado: o.estado,
        tipo: o.tipo
      }))
    );
    tbody.innerHTML = '';
    if (ordenes.length === 0) {
      console.log('ℹ️ No hay órdenes para mostrar');
      return;
    }
    // Filtrar órdenes duplicadas y sin datos completos
    const ordenesUnicas = [];
    const idsVistos = new Set();

    ordenes.forEach((op, index) => {
      // Validar que la orden tenga un ID válido
      if (!op.id || op.id === undefined || op.id === null) {
        console.warn(`⚠️ Orden sin ID válido en índice ${index}, omitiendo:`, op);
        return; // Saltar esta orden
      }

      // Evitar duplicados por ID
      if (idsVistos.has(op.id)) {
        console.warn(`⚠️ Orden duplicada encontrada (ID: ${op.id}), omitiendo:`, op);
        return; // Saltar esta orden duplicada
      }

      // Validar que tenga datos mínimos (proveedor o monto)
      if (!op.proveedor && (!op.monto || op.monto === 0)) {
        console.warn(`⚠️ Orden sin datos completos (ID: ${op.id}), omitiendo:`, op);
        return; // Saltar esta orden sin datos
      }

      idsVistos.add(op.id);
      ordenesUnicas.push(op);
    });

    console.log(
      `📊 ${ordenesUnicas.length} orden(es) única(s) de ${ordenes.length} total(es) después de filtrar duplicados y sin datos`
    );

    let filasAgregadas = 0;
    ordenesUnicas.forEach((op, index) => {
      try {
        // El ID ya está validado, usar directamente
        const ordenId = op.id;

        const tr = document.createElement('tr');
        const estadoBadge =
          {
            por_pagar: 'bg-warning',
            pagando: 'bg-info',
            pagado: 'bg-success',
            'parcial pagado': 'bg-info',
            rechazado: 'bg-danger'
          }[op.estado] || 'bg-secondary';

        // Formatear texto del estado para mostrar
        const estadoTexto =
          op.estado === 'parcial pagado'
            ? 'P-Pagado'
            : op.estado === 'por_pagar'
              ? 'Por Pagar'
              : op.estado === 'pagando'
                ? 'Pagando'
                : op.estado === 'pagado'
                  ? 'Pagado'
                  : op.estado === 'rechazado'
                    ? 'Rechazado'
                    : op.estado || 'Por Pagar';
        // Etiqueta: MULTI (N) si hay varias facturas; si es una, mostrar número de factura; fallback OP-id
        let opLabel = null;
        const totalFacturas = Array.isArray(op.facturasIncluidas) ? op.facturasIncluidas.length : 0;
        if (totalFacturas > 1) {
          opLabel = `MULTI (${totalFacturas})`;
        } else if (totalFacturas === 1) {
          opLabel = op.opNumeroFactura || null;
          if (!opLabel) {
            try {
              const facturasData = localStorage.getItem('erp_cxp_facturas');
              const facturas = facturasData ? JSON.parse(facturasData) : [];
              const f = facturas.find(x => x.id === op.facturasIncluidas[0]);
              if (f && f.numeroFactura) {
                opLabel = f.numeroFactura;
              }
            } catch (_) {
              // Ignorar error intencionalmente
            }
          }
        }
        if (!opLabel) {
          // Asegurar que ordenId sea un número válido para slice
          const idStr = ordenId ? ordenId.toString() : '';
          opLabel = idStr.length > 6 ? `OP-${idStr.slice(-6)}` : `OP-${idStr}`;
        }

        // Validar que op.monto sea un número válido
        const monto = parseFloat(op.monto) || 0;

        tr.innerHTML = `
                <td><strong>${opLabel}</strong></td>
                    <td>${op.proveedor || '-'}</td>
                    <td><strong>$${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(monto)}</strong></td>
                <td>${op.fechaRequerida ? new Date(op.fechaRequerida).toLocaleDateString('es-MX') : '-'}</td>
                    <td><span class="badge ${op.prioridad === 'urgente' ? 'bg-danger' : op.prioridad === 'alta' ? 'bg-warning' : 'bg-info'}">${op.prioridad || 'normal'}</span></td>
                    <td><span class="badge ${estadoBadge}">${estadoTexto}</span></td>
                <td>
                    <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="window.tesoreriaUI?.verDetalle(${ordenId})" title="Ver detalles"><i class="fas fa-eye"></i></button>
                            ${op.estado === 'por_pagar' ? `<button class="btn btn-sm btn-success" onclick="window.tesoreriaUI?.marcarPagando(${ordenId})" title="Marcar como pagando"><i class="fas fa-play"></i></button>` : ''}
                            ${op.estado === 'pagando' ? `<button class="btn btn-sm btn-success" onclick="window.tesoreriaUI?.abrirModalPago(${ordenId})" title="Registrar pago"><i class="fas fa-credit-card"></i></button>` : ''}
                            ${op.estado === 'por_pagar' || op.estado === 'pagando' ? `<button class="btn btn-sm btn-warning" onclick="window.tesoreriaUI?.marcarRechazado(${ordenId})" title="Rechazar"><i class="fas fa-times"></i></button>` : ''}
                            <button class="btn btn-sm btn-outline-secondary" onclick="window.tesoreriaUI?.descargarPDFOrdenPago(${ordenId})" title="Descargar PDF"><i class="fas fa-file-pdf"></i></button>
                    </div>
                </td>
            `;
        tbody.appendChild(tr);
        filasAgregadas++;
      } catch (error) {
        console.error(`❌ Error renderizando orden en índice ${index}:`, error, op);
      }
    });
    console.log(`✅ ${filasAgregadas} fila(s) agregada(s) al tbody de órdenes de pago`);

    // Verificar que las filas se agregaron correctamente
    const filasEnDOM = tbody.querySelectorAll('tr').length;
    if (filasEnDOM !== filasAgregadas) {
      console.warn(
        `⚠️ Discrepancia: se agregaron ${filasAgregadas} filas pero hay ${filasEnDOM} en el DOM`
      );
    } else {
      console.log(`✅ Confirmado: ${filasEnDOM} fila(s) visibles en el DOM`);
    }
  }

  async function aplicarFiltros() {
    const prov = (document.getElementById('tesoFiltroProveedor')?.value || '').toLowerCase();
    const estado = (document.getElementById('tesoFiltroEstado')?.value || '').toLowerCase();
    const desde = document.getElementById('tesoFiltroDesde')?.value || '';
    const hasta = document.getElementById('tesoFiltroHasta')?.value || '';
    const prioridad = document.getElementById('tesoFiltroPrioridad')?.value || '';
    const data = await loadOrdenes();
    // Asegurar que data es un array
    const ordenesArray = Array.isArray(data) ? data : [];
    console.log(`🔍 Aplicando filtros a ${ordenesArray.length} orden(es)...`);

    // Log detallado de las órdenes para diagnóstico
    const ordenesConSolicitudId = ordenesArray.filter(op => op.solicitudId);
    console.log(
      `📋 Órdenes con solicitudId (de CXP): ${ordenesConSolicitudId.length} de ${ordenesArray.length}`
    );
    if (ordenesConSolicitudId.length > 0) {
      console.log(
        '📋 Detalles de órdenes de CXP:',
        ordenesConSolicitudId.map(op => ({
          id: op.id,
          solicitudId: op.solicitudId,
          proveedor: op.proveedor,
          monto: op.monto,
          estado: op.estado,
          tipo: op.tipo
        }))
      );
    }

    // Función para convertir estado interno a texto legible para búsqueda
    function estadoATexto(estado) {
      const mapeo = {
        por_pagar: 'por pagar',
        pagando: 'pagando',
        pagado: 'pagado',
        'parcial pagado': 'parcial pagado',
        rechazado: 'rechazado'
      };
      return mapeo[estado] || estado || '';
    }

    const filtradas = ordenesArray.filter(op => {
      const okProv = !prov || (op.proveedor || '').toLowerCase().includes(prov);
      // Buscar por texto en el estado (tanto en el valor interno como en el texto legible)
      const okEstado =
        !estado ||
        (op.estado && op.estado.toLowerCase().includes(estado)) ||
        estadoATexto(op.estado).toLowerCase().includes(estado);
      const okPri = !prioridad || op.prioridad === prioridad;
      const okDesde = !desde || (op.createdAt && op.createdAt >= desde);
      const okHasta = !hasta || (op.createdAt && op.createdAt <= `${hasta}T23:59:59`);
      return okProv && okEstado && okPri && okDesde && okHasta;
    });

    // Verificar que las órdenes de CXP pasen los filtros
    const filtradasConSolicitudId = filtradas.filter(op => op.solicitudId);
    console.log(
      `✅ ${filtradas.length} orden(es) pasaron los filtros (${filtradasConSolicitudId.length} de CXP), renderizando...`
    );

    renderOrdenes(filtradas);
  }

  async function limpiarFiltrosSolicitudes() {
    console.log('🧹 Limpiando filtros de solicitudes...');

    // Limpiar todos los campos de filtro
    const filtroProveedor = document.getElementById('tesoFiltroProveedor');
    const filtroEstado = document.getElementById('tesoFiltroEstado');
    const filtroDesde = document.getElementById('tesoFiltroDesde');
    const filtroHasta = document.getElementById('tesoFiltroHasta');
    const filtroPrioridad = document.getElementById('tesoFiltroPrioridad');

    if (filtroProveedor) {
      filtroProveedor.value = '';
    }
    if (filtroEstado) {
      filtroEstado.value = '';
    }
    if (filtroDesde) {
      filtroDesde.value = '';
    }
    if (filtroHasta) {
      filtroHasta.value = '';
    }
    if (filtroPrioridad) {
      filtroPrioridad.value = '';
    }

    // Aplicar filtros (que ahora mostrará todas las órdenes)
    await aplicarFiltros();

    console.log('✅ Filtros de solicitudes limpiados');
  }

  async function verDetalle(ordenId) {
    const ordenes = await loadOrdenes();
    const op = ordenes.find(o => o.id === ordenId);
    if (!op) {
      alert('Orden de pago no encontrada');
      return;
    }

    // Obtener facturas incluidas
    let facturasIncluidas = [];
    try {
      let facturas = [];

      // PRIORIDAD 1: Intentar cargar desde Firebase
      if (window.firebaseRepos && window.firebaseRepos.cxp) {
        try {
          facturas = await window.firebaseRepos.cxp.getAllFacturas();
          if (!Array.isArray(facturas)) {
            facturas = [];
          }
          console.log(`📊 ${facturas.length} facturas cargadas desde Firebase para verDetalle`);
        } catch (error) {
          console.warn('⚠️ Error cargando facturas desde Firebase:', error);
        }
      }

      // PRIORIDAD 2: Si no hay facturas desde Firebase, usar localStorage
      if (!Array.isArray(facturas) || facturas.length === 0) {
        const facturasData = localStorage.getItem('erp_cxp_facturas');
        if (facturasData) {
          facturas = JSON.parse(facturasData);
          if (!Array.isArray(facturas)) {
            facturas = [];
          }
          console.log(`📊 ${facturas.length} facturas cargadas desde localStorage para verDetalle`);
        }
      }

      if (Array.isArray(op.facturasIncluidas) && op.facturasIncluidas.length > 0) {
        facturasIncluidas = op.facturasIncluidas
          .map(fid => {
            const f = facturas.find(x => x.id === fid);
            return f || null;
          })
          .filter(f => f !== null);
        console.log(
          `✅ ${facturasIncluidas.length} factura(s) encontrada(s) de ${op.facturasIncluidas.length} factura(s) incluida(s)`
        );
      }
    } catch (e) {
      console.warn('⚠️ Error obteniendo facturas:', e);
    }

    // Formatear fecha requerida
    const formatearFecha = fecha => {
      if (!fecha) {
        return 'N/A';
      }
      try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) {
          return fecha;
        }
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (e) {
        return fecha;
      }
    };

    // Formatear estado
    const formatearEstado = estado => {
      const estados = {
        por_pagar: { texto: 'Por Pagar', clase: 'warning' },
        pagando: { texto: 'Pagando', clase: 'info' },
        pagado: { texto: 'Pagado', clase: 'success' },
        'parcial pagado': { texto: 'P-Pagado', clase: 'info' },
        rechazado: { texto: 'Rechazado', clase: 'danger' }
      };
      const estadoInfo = estados[estado] || { texto: estado, clase: 'secondary' };
      return `<span class="badge bg-${estadoInfo.clase}">${estadoInfo.texto}</span>`;
    };

    // Formatear prioridad
    const formatearPrioridad = prioridad => {
      const prioridades = {
        alta: { texto: 'Alta', clase: 'danger' },
        normal: { texto: 'Normal', clase: 'info' },
        baja: { texto: 'Baja', clase: 'secondary' }
      };
      const prioridadInfo = prioridades[prioridad] || { texto: prioridad, clase: 'secondary' };
      return `<span class="badge bg-${prioridadInfo.clase}">${prioridadInfo.texto}</span>`;
    };

    // Construir HTML del modal
    const modalBody = document.getElementById('modalDetallesSolicitudBody');
    const modalTitle = document.getElementById('modalDetallesSolicitudLabel');

    if (!modalBody || !modalTitle) {
      console.error('❌ No se encontró el modal de detalles de solicitud');
      alert('❌ Error: No se pudo abrir el modal de detalles');
      return;
    }

    // Actualizar título
    modalTitle.innerHTML = `<i class="fas fa-eye"></i> Detalles de la Orden de Pago OP-${op.id.toString().slice(-6)}`;

    // Construir contenido del modal
    let contenidoHTML = `
          <div class="row">
            <div class="col-md-6 mb-3">
              <div class="card border-primary">
                <div class="card-header bg-primary text-white">
                  <h6 class="mb-0"><i class="fas fa-info-circle"></i> Información General</h6>
                </div>
                <div class="card-body">
                  <p class="mb-2"><strong>Número de Orden:</strong><br><span class="badge bg-dark">OP-${op.id.toString().slice(-6)}</span></p>
                  <p class="mb-2"><strong>Proveedor:</strong><br>${op.proveedor || 'N/A'}</p>
                  <p class="mb-2"><strong>Monto:</strong><br><span class="h5 text-success">$${parseFloat(op.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                  <p class="mb-0"><strong>Método de Pago:</strong><br>${op.metodoPago || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 mb-3">
              <div class="card border-info">
                <div class="card-header bg-info text-white">
                  <h6 class="mb-0"><i class="fas fa-calendar-alt"></i> Estado y Fechas</h6>
                </div>
                <div class="card-body">
                  <p class="mb-2"><strong>Estado:</strong><br>${formatearEstado(op.estado)}</p>
                  <p class="mb-2"><strong>Prioridad:</strong><br>${formatearPrioridad(op.prioridad)}</p>
                  <p class="mb-0"><strong>Fecha Requerida:</strong><br>${formatearFecha(op.fechaRequerida)}</p>
                </div>
              </div>
            </div>
          </div>
        `;

    // Agregar sección de facturas incluidas si hay
    if (facturasIncluidas.length > 0) {
      contenidoHTML += `
              <div class="row">
                <div class="col-12">
                  <div class="card border-success">
                    <div class="card-header bg-success text-white">
                      <h6 class="mb-0"><i class="fas fa-file-invoice-dollar"></i> Facturas Incluidas (${facturasIncluidas.length})</h6>
                    </div>
                    <div class="card-body">
                      <div class="table-responsive">
                        <table class="table table-sm table-bordered">
                          <thead>
                            <tr>
                              <th>Número de Factura</th>
                              <th>Monto</th>
                              <th>Fecha Emisión</th>
                              <th>Fecha Vencimiento</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${facturasIncluidas
    .map(
      f => `
                              <tr>
                                <td><strong>${f.numeroFactura || 'N/A'}</strong></td>
                                <td>$${parseFloat(f.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td>${formatearFecha(f.fechaEmision)}</td>
                                <td>${formatearFecha(f.fechaVencimiento)}</td>
                              </tr>
                            `
    )
    .join('')}
                          </tbody>
                          <tfoot>
                            <tr class="table-primary">
                              <th>Total:</th>
                              <th>$${facturasIncluidas.reduce((sum, f) => sum + parseFloat(f.monto || 0), 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</th>
                              <th colspan="2"></th>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
    } else {
      contenidoHTML += `
              <div class="row">
                <div class="col-12">
                  <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No hay facturas asociadas a esta orden de pago.
                  </div>
                </div>
              </div>
            `;
    }

    // Insertar contenido en el modal
    modalBody.innerHTML = contenidoHTML;

    // Mostrar el modal usando Bootstrap
    const modalElement = document.getElementById('modalDetallesSolicitud');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    } else {
      console.error('❌ No se encontró el elemento del modal');
      alert('❌ Error: No se pudo abrir el modal de detalles');
    }
  }

  async function updateEstado(ordenId, nuevoEstado) {
    const ordenes = await loadOrdenes();
    // Asegurar que ordenes es un array
    const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
    const idx = ordenesArray.findIndex(o => o.id === ordenId);
    if (idx === -1) {
      return;
    }
    ordenesArray[idx].estado = nuevoEstado;
    ordenesArray[idx].updatedAt = new Date().toISOString();
    await saveOrdenes(ordenesArray);
    await aplicarFiltros();
  }

  async function marcarPagando(ordenId) {
    await updateEstado(ordenId, 'pagando');
  }
  async function marcarPagado(ordenId) {
    await marcarOrdenPagada(ordenId, {});
    await aplicarFiltros();
  }
  async function marcarRechazado(ordenId) {
    await updateEstado(ordenId, 'rechazado');

    // Actualizar también el estado de la solicitud en CXP
    try {
      const ordenes = await loadOrdenes();
      const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
      const orden = ordenesArray.find(o => o.id === ordenId);

      if (orden && orden.solicitudId) {
        console.log(`🔄 Actualizando solicitud ${orden.solicitudId} en CXP a estado 'rechazada'`);

        // Cargar solicitudes desde localStorage primero
        let solicitudes = [];
        const solicitudesData = localStorage.getItem('erp_cxp_solicitudes');
        if (solicitudesData) {
          try {
            solicitudes = JSON.parse(solicitudesData);
          } catch (e) {
            console.warn('⚠️ Error parseando solicitudes desde localStorage:', e);
          }
        }

        // Si no se encuentra en localStorage, intentar desde Firebase
        if (solicitudes.length === 0 && window.firebaseRepos && window.firebaseRepos.cxp) {
          try {
            solicitudes = await window.firebaseRepos.cxp.loadSolicitudes();
            console.log(`📊 ${solicitudes.length} solicitudes cargadas desde Firebase`);
          } catch (error) {
            console.warn('⚠️ Error cargando solicitudes desde Firebase:', error);
          }
        }

        // Buscar la solicitud relacionada
        const solicitud = solicitudes.find(s => s.id === orden.solicitudId);

        if (solicitud) {
          // Actualizar estado de la solicitud
          solicitud.estado = 'rechazada';
          solicitud.updatedAt = new Date().toISOString();

          // Guardar solicitud actualizada en Firebase
          if (window.firebaseRepos && window.firebaseRepos.cxp) {
            const solicitudId = `solicitud_${solicitud.id}`;
            await window.firebaseRepos.cxp.saveSolicitud(solicitudId, solicitud);
            console.log(`✅ Solicitud ${solicitudId} actualizada a 'rechazada' en Firebase`);
          }

          // Actualizar facturas relacionadas a 'SR-Pendiente' (Solicitud Rechazada - Pendiente)
          if (
            solicitud.facturasIncluidas &&
            Array.isArray(solicitud.facturasIncluidas) &&
            solicitud.facturasIncluidas.length > 0
          ) {
            // Cargar facturas desde localStorage primero
            let facturas = [];
            const facturasData = localStorage.getItem('erp_cxp_facturas');
            if (facturasData) {
              try {
                facturas = JSON.parse(facturasData);
              } catch (e) {
                console.warn('⚠️ Error parseando facturas desde localStorage:', e);
              }
            }

            // Si no se encuentra en localStorage, intentar desde Firebase
            if (facturas.length === 0 && window.firebaseRepos && window.firebaseRepos.cxp) {
              try {
                facturas = await window.firebaseRepos.cxp.loadFacturas();
                console.log(`📊 ${facturas.length} facturas cargadas desde Firebase`);
              } catch (error) {
                console.warn('⚠️ Error cargando facturas desde Firebase:', error);
              }
            }

            // Actualizar cada factura relacionada
            let facturasActualizadas = 0;
            for (const facturaId of solicitud.facturasIncluidas) {
              const factura = facturas.find(f => f.id === facturaId);
              if (factura) {
                factura.estado = 'SR-Pendiente';
                factura.updatedAt = new Date().toISOString();

                // Guardar factura actualizada en Firebase
                if (window.firebaseRepos && window.firebaseRepos.cxp) {
                  const facturaIdFirebase = `factura_${factura.id}`;
                  await window.firebaseRepos.cxp.saveFactura(facturaIdFirebase, factura);
                  console.log(
                    `✅ Factura ${facturaIdFirebase} actualizada a 'SR-Pendiente' en Firebase`
                  );
                }

                facturasActualizadas++;
              }
            }

            // Actualizar localStorage de facturas para sincronización
            if (facturasData) {
              try {
                const facturasArray = JSON.parse(facturasData);
                solicitud.facturasIncluidas.forEach(facturaId => {
                  const facturaIndex = facturasArray.findIndex(f => f.id === facturaId);
                  if (facturaIndex !== -1) {
                    facturasArray[facturaIndex].estado = 'SR-Pendiente';
                    facturasArray[facturaIndex].updatedAt = new Date().toISOString();
                  }
                });
                localStorage.setItem('erp_cxp_facturas', JSON.stringify(facturasArray));
              } catch (e) {
                console.warn('⚠️ Error actualizando localStorage de facturas:', e);
              }
            }

            console.log(`✅ ${facturasActualizadas} factura(s) actualizada(s) a 'SR-Pendiente'`);
          }

          // Actualizar localStorage de solicitudes para sincronización
          if (solicitudesData) {
            try {
              const solicitudesArray = JSON.parse(solicitudesData);
              const solicitudIndex = solicitudesArray.findIndex(s => s.id === solicitud.id);
              if (solicitudIndex !== -1) {
                solicitudesArray[solicitudIndex] = solicitud;
                localStorage.setItem('erp_cxp_solicitudes', JSON.stringify(solicitudesArray));
              }
            } catch (e) {
              console.warn('⚠️ Error actualizando localStorage de solicitudes:', e);
            }
          }

          console.log(`✅ Solicitud ${orden.solicitudId} actualizada a 'rechazada' en CXP`);
        } else {
          console.warn(`⚠️ No se encontró la solicitud ${orden.solicitudId} en CXP`);
        }
      } else {
        console.log(
          `ℹ️ La orden ${ordenId} no tiene solicitudId asociado, solo se actualizó el estado en Tesorería`
        );
      }
    } catch (error) {
      console.error('❌ Error actualizando solicitud en CXP:', error);
      // No mostrar alerta al usuario, solo loggear el error
      // El estado en Tesorería ya se actualizó correctamente
    }
  }

  // Función para abrir el modal de pago
  async function abrirModalPago(ordenId) {
    const ordenes = await loadOrdenes();
    // Asegurar que ordenes es un array
    const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
    const orden = ordenesArray.find(o => o.id === ordenId);
    if (!orden) {
      alert('Orden de pago no encontrada');
      return;
    }

    // Llenar información de la solicitud
    document.getElementById('infoProveedor').textContent = orden.proveedor;
    document.getElementById('infoMonto').textContent = `$${formatCurrency(orden.monto)}`;

    // Limpiar formulario primero
    document.getElementById('formRegistrarPagoSolicitud').reset();
    document.getElementById('previewComprobantesSolicitud').innerHTML = '';

    // Establecer el monto después del reset (no editable, viene de la solicitud autorizada)
    const montoInput = document.getElementById('montoPagoSolicitud');
    // Formatear el monto como moneda mexicana
    montoInput.value = `$${formatCurrency(orden.monto)}`;
    montoInput.readOnly = true; // Asegurar que sea readonly
    // Guardar el valor numérico en un atributo data para uso posterior
    montoInput.dataset.montoNumerico = orden.monto;

    // Establecer fecha actual
    document.getElementById('fechaPagoSolicitud').value = new Date().toISOString().split('T')[0];

    // Guardar ID de la orden para uso posterior
    document.getElementById('formRegistrarPagoSolicitud').dataset.ordenId = ordenId;

    // Cargar bancos en el select de banco de origen
    await cargarBancosEnSelectSolicitud();

    // Configurar evento onchange para actualizar cuentas cuando se seleccione un banco
    const selectBancoOrigen = document.getElementById('bancoOrigenSolicitud');
    if (selectBancoOrigen) {
      // Remover event listeners anteriores para evitar duplicados
      const nuevoSelect = selectBancoOrigen.cloneNode(true);
      selectBancoOrigen.parentNode.replaceChild(nuevoSelect, selectBancoOrigen);

      // Agregar event listener
      nuevoSelect.addEventListener('change', async () => {
        if (typeof window.actualizarCuentasOrigenSolicitud === 'function') {
          await window.actualizarCuentasOrigenSolicitud();
        } else {
          console.warn(
            '⚠️ Función actualizarCuentasOrigenSolicitud no disponible, intentando cargar cuentas manualmente...'
          );
          // Fallback: cargar cuentas manualmente si la función no está disponible
          await actualizarCuentasOrigenSolicitudManual(nuevoSelect.value);
        }
      });
    }

    // Función auxiliar para actualizar cuentas manualmente si la función global no está disponible
    async function actualizarCuentasOrigenSolicitudManual(bancoSeleccionado) {
      const selectCuenta = document.getElementById('cuentaOrigenSolicitud');
      if (!selectCuenta) {
        return;
      }

      selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';

      if (!bancoSeleccionado) {
        selectCuenta.innerHTML = '<option value="">Primero seleccione un banco</option>';
        return;
      }

      // Cargar todas las cuentas bancarias
      let cuentasBancarias = [];

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
              cuentasBancarias = data.cuentasBancarias;
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando cuentas desde Firebase:', error);
        }
      }

      // Si no hay datos en Firebase, intentar desde configuracionManager
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

    // Mostrar modal
    const modalElement = document.getElementById('modalRegistrarPagoSolicitud');
    const modal = new bootstrap.Modal(modalElement);

    // Asegurar que el botón tenga el event handler cuando se abre el modal
    modalElement.addEventListener(
      'shown.bs.modal',
      () => {
        console.log('📋 Modal de registrar pago abierto, conectando event handler...');

        const btnRegistrar = modalElement.querySelector(
          'button[data-action="registrarPagoSolicitud"]'
        );
        if (btnRegistrar) {
          console.log('🔍 Botón de registrar pago encontrado en modal');

          // Remover cualquier listener anterior para evitar duplicados
          const nuevoBtn = btnRegistrar.cloneNode(true);
          btnRegistrar.parentNode.replaceChild(nuevoBtn, btnRegistrar);

          // Agregar listener directamente al botón
          nuevoBtn.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('🖱️ Botón de registrar pago clickeado (handler directo)');

            if (typeof window.registrarPagoSolicitud === 'function') {
              console.log('✅ Función registrarPagoSolicitud encontrada, ejecutando...');
              try {
                await window.registrarPagoSolicitud();
              } catch (error) {
                console.error('❌ Error al ejecutar registrarPagoSolicitud:', error);
                window._tesoreriaRegistrandoPago = false;

                // Restaurar botón
                if (nuevoBtn && nuevoBtn.disabled) {
                  nuevoBtn.disabled = false;
                  nuevoBtn.innerHTML = '<i class="fas fa-check"></i> Registrar Pago';
                  nuevoBtn.style.opacity = '';
                  nuevoBtn.style.cursor = '';
                }

                if (typeof window.showNotification === 'function') {
                  window.showNotification(
                    `Error al registrar el pago: ${error.message || 'Error desconocido'}`,
                    'error'
                  );
                } else {
                  alert(`Error al registrar el pago: ${error.message || 'Error desconocido'}`);
                }
              }
            } else {
              console.error('❌ registrarPagoSolicitud no está disponible');
              if (typeof window.showNotification === 'function') {
                window.showNotification(
                  'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.',
                  'error'
                );
              } else {
                alert(
                  'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.'
                );
              }
            }
            return false;
          });

          nuevoBtn.setAttribute('data-handler-attached', 'true');
          console.log('✅ Handler directo agregado al botón de registrar pago');
        } else {
          console.warn('⚠️ Botón de registrar pago no encontrado en el modal');
        }
      },
      { once: true }
    ); // Solo ejecutar una vez

    // Asegurar que el botón se restaure cuando se cierre el modal
    modalElement.addEventListener('hidden.bs.modal', () => {
      // Restaurar flag de procesamiento
      window._tesoreriaRegistrandoPago = false;

      // Restaurar botón
      const btnRegistrar = modalElement.querySelector(
        'button[data-action="registrarPagoSolicitud"]'
      );
      if (btnRegistrar) {
        btnRegistrar.disabled = false;
        btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar Pago';
        btnRegistrar.style.opacity = '';
        btnRegistrar.style.cursor = '';
      }
    });

    modal.show();
  }

  // Función auxiliar para cargar bancos en el select de solicitud
  async function cargarBancosEnSelectSolicitud() {
    const selectBancoOrigen = document.getElementById('bancoOrigenSolicitud');
    if (!selectBancoOrigen) {
      return;
    }

    let cuentasBancarias = [];

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
            cuentasBancarias = data.cuentasBancarias;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando bancos desde Firebase:', error);
      }
    }

    // Si no hay datos en Firebase, intentar desde configuracionManager
    if (cuentasBancarias.length === 0 && window.configuracionManager) {
      cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
    }

    // Obtener lista única de bancos
    const bancosUnicos = [...new Set(cuentasBancarias.map(b => b.banco).filter(b => b))].sort();

    // Limpiar opciones actuales excepto la primera
    const primeraOpcion = selectBancoOrigen.querySelector('option');
    selectBancoOrigen.innerHTML = primeraOpcion
      ? primeraOpcion.outerHTML
      : '<option value="">Seleccione un banco...</option>';

    // Agregar bancos
    bancosUnicos.forEach(banco => {
      const option = document.createElement('option');
      option.value = banco;
      option.textContent = banco;
      selectBancoOrigen.appendChild(option);
    });

    console.log(`✅ ${bancosUnicos.length} banco(s) cargado(s) en el select de solicitud`);
  }

  // Función para convertir archivos a base64
  async function convertirArchivosABase64(files) {
    const archivosBase64 = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        throw new Error(`El archivo ${file.name} es demasiado grande. Máximo 10MB.`);
      }
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      archivosBase64.push({
        nombre: file.name,
        tipo: file.type,
        tamaño: file.size,
        contenido: base64
      });
    }
    return archivosBase64;
  }

  // Función para registrar el pago
  async function registrarPagoSolicitud() {
    const form = document.getElementById('formRegistrarPagoSolicitud');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Obtener el botón de registrar pago y deshabilitarlo para evitar dobles clics
    const btnRegistrar = document.querySelector(
      '#modalRegistrarPagoSolicitud button[data-action="registrarPagoSolicitud"]'
    );
    const textoOriginal = btnRegistrar ? btnRegistrar.innerHTML : '';
    const estadoOriginal = btnRegistrar ? btnRegistrar.disabled : false;

    // Función para restaurar el botón
    const restaurarBoton = () => {
      if (btnRegistrar) {
        btnRegistrar.disabled = estadoOriginal;
        btnRegistrar.innerHTML = textoOriginal;
      }
    };

    // Deshabilitar botón y mostrar estado de procesamiento
    if (btnRegistrar) {
      btnRegistrar.disabled = true;
      btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    }

    const ordenId = parseInt(form.dataset.ordenId, 10);
    if (!ordenId || isNaN(ordenId)) {
      console.error('❌ ID de orden no válido:', form.dataset.ordenId);
      restaurarBoton();
      alert('Error: ID de orden no válido');
      return false;
    }

    const ordenes = await loadOrdenes();
    // Asegurar que ordenes es un array
    const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
    const orden = ordenesArray.find(o => o.id === ordenId);

    if (!orden) {
      console.error('❌ Orden de pago no encontrada:', ordenId);
      restaurarBoton();
      alert('Error: Orden de pago no encontrada');
      return false;
    }

    console.log('✅ Orden encontrada:', {
      id: orden.id,
      proveedor: orden.proveedor,
      monto: orden.monto,
      estado: orden.estado
    });

    try {
      // Obtener datos del formulario con validación
      const fechaPago = document.getElementById('fechaPagoSolicitud')?.value;
      // Obtener el monto numérico desde el atributo data (ya que el campo muestra formato de moneda)
      const montoInput = document.getElementById('montoPagoSolicitud');
      const montoPago = parseFloat(
        montoInput?.dataset.montoNumerico || montoInput?.value?.replace(/[$,]/g, '') || 0
      );
      const metodoPago = document.getElementById('metodoPagoSolicitud')?.value;
      const bancoOrigen = document.getElementById('bancoOrigenSolicitud')?.value;
      const cuentaOrigen = document.getElementById('cuentaOrigenSolicitud')?.value;
      const bancoDestino = document.getElementById('bancoDestinoSolicitud')?.value;
      const cuentaDestino = document.getElementById('cuentaDestinoSolicitud')?.value;
      const referencia = document.getElementById('referenciaPagoSolicitud')?.value;
      const observaciones = document.getElementById('observacionesPagoSolicitud')?.value || '';

      // Validaciones básicas
      if (!fechaPago) {
        restaurarBoton();
        alert('Por favor ingrese la fecha de pago');
        return false;
      }

      if (!montoPago || montoPago <= 0) {
        restaurarBoton();
        alert('Por favor ingrese un monto válido mayor a cero');
        return false;
      }

      if (!metodoPago) {
        restaurarBoton();
        alert('Por favor seleccione el método de pago');
        return false;
      }

      if (!bancoOrigen || !cuentaOrigen) {
        restaurarBoton();
        alert('Por favor seleccione el banco y cuenta de origen');
        return false;
      }

      if (!bancoDestino || !cuentaDestino) {
        restaurarBoton();
        alert('Por favor ingrese el banco y cuenta de destino');
        return false;
      }

      if (!referencia) {
        restaurarBoton();
        alert('Por favor ingrese la referencia del pago');
        return false;
      }

      const pagoData = {
        fecha: fechaPago,
        monto: montoPago,
        metodo: metodoPago,
        bancoOrigen: bancoOrigen,
        cuentaOrigen: cuentaOrigen,
        bancoDestino: bancoDestino,
        cuentaDestino: cuentaDestino,
        referencia: referencia,
        observaciones: observaciones,
        archivosAdjuntos: []
      };

      console.log('📋 Datos de pago capturados:', pagoData);

      // Procesar archivos adjuntos
      const archivosInput = document.getElementById('comprobantesPagoSolicitud');
      if (archivosInput && archivosInput.files.length > 0) {
        try {
          pagoData.archivosAdjuntos = await convertirArchivosABase64(archivosInput.files);
          console.log('📎 Comprobantes procesados:', pagoData.archivosAdjuntos.length);
        } catch (error) {
          console.error('❌ Error procesando comprobantes:', error);
          restaurarBoton();
          if (typeof window.showNotification === 'function') {
            window.showNotification(
              `Error al procesar los comprobantes: ${error.message}`,
              'error'
            );
          } else {
            alert(`Error al procesar los comprobantes: ${error.message}`);
          }
          return false;
        }
      }

      // Marcar orden como pagada con la información del pago
      console.log('💳 Marcando orden como pagada:', {
        ordenId: ordenId,
        montoPago: pagoData.monto,
        ordenActual: {
          id: orden.id,
          estado: orden.estado,
          monto: orden.monto,
          solicitudId: orden.solicitudId
        }
      });

      const success = await marcarOrdenPagada(ordenId, pagoData);
      console.log('📊 Resultado de marcarOrdenPagada:', success);

      if (success) {
        // Registrar movimiento en el historial de Tesorería
        try {
          const tesoreria = JSON.parse(localStorage.getItem('erp_tesoreria_movimientos') || '[]');

          // Obtener número de factura para la descripción
          let descripcionCXP = `[CXP] - Solicitud ${orden.id}`;
          if (
            orden.facturasIncluidas &&
            Array.isArray(orden.facturasIncluidas) &&
            orden.facturasIncluidas.length > 0
          ) {
            try {
              // Intentar cargar facturas desde Firebase
              let facturas = [];
              if (window.firebaseRepos && window.firebaseRepos.cxp) {
                try {
                  const repoCXP = window.firebaseRepos.cxp;

                  // Esperar inicialización
                  let attempts = 0;
                  while (attempts < 10 && (!repoCXP.db || !repoCXP.tenantId)) {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                    if (typeof repoCXP.init === 'function') {
                      try {
                        await repoCXP.init();
                      } catch (e) {}
                    }
                  }

                  if (repoCXP.db && repoCXP.tenantId) {
                    facturas = await repoCXP.getAllFacturas();
                  }
                } catch (error) {
                  console.warn('⚠️ Error cargando facturas desde Firebase:', error);
                }
              }

              // Si no hay facturas desde Firebase, cargar desde localStorage
              if (facturas.length === 0) {
                const facturasData = localStorage.getItem('erp_cxp_facturas');
                if (facturasData) {
                  facturas = JSON.parse(facturasData);
                }
              }

              // Buscar la primera factura asociada
              const factura = facturas.find(f => orden.facturasIncluidas.includes(f.id));
              if (factura && factura.numeroFactura) {
                descripcionCXP = `[CXP] - ${factura.numeroFactura}`;
              }
            } catch (error) {
              console.warn(
                '⚠️ Error obteniendo número de factura, usando formato por defecto:',
                error
              );
            }
          }

          // Crear movimiento de egreso con identificador CXP
          const nuevoMovimiento = {
            id: Date.now(),
            tipo: 'egreso',
            monto: pagoData.monto,
            descripcion: descripcionCXP,
            categoria: 'Cuentas por Pagar',
            fecha: pagoData.fecha || new Date().toISOString().split('T')[0],
            referencia: pagoData.referencia || `OP-${orden.id.toString().slice(-6)}`,
            clienteProveedor: orden.proveedor,
            proveedorCliente: orden.proveedor,
            fechaCreacion: new Date().toISOString(),
            origen: 'CXP',
            identificador: 'CXP',
            icono: '💸',
            color: '#dc3545',
            etiqueta: 'CXP',
            metodoPago: pagoData.metodo || 'transferencia',
            bancoOrigen: pagoData.bancoOrigen || '',
            cuentaOrigen: pagoData.cuentaOrigen || '',
            bancoDestino: pagoData.bancoDestino || '',
            cuentaDestino: pagoData.cuentaDestino || '',
            referenciaBancaria: pagoData.referencia || '',
            observaciones: pagoData.observaciones || '',
            ordenPagoId: orden.id,
            solicitudId: orden.solicitudId,
            facturasIncluidas: orden.facturasIncluidas || [],
            archivosAdjuntos: pagoData.archivosAdjuntos || []
          };

          // Agregar a tesorería (al inicio del array)
          tesoreria.unshift(nuevoMovimiento);
          localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(tesoreria));

          console.log(`✅ Movimiento CXP registrado en historial de Tesorería: $${pagoData.monto}`);

          // Guardar en Firebase también
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
                const movimientoId = `movimiento_${nuevoMovimiento.id}`;
                const movimientoData = {
                  ...nuevoMovimiento,
                  // Mantener el tipo original (ingreso/egreso) en lugar de sobrescribir a 'movimiento'
                  tipo: nuevoMovimiento.tipo || 'movimiento',
                  fechaCreacion: nuevoMovimiento.fechaCreacion || new Date().toISOString()
                };

                console.log(`💾 Guardando movimiento CXP en Firebase: ${movimientoId}`, {
                  id: movimientoData.id,
                  tipo: movimientoData.tipo,
                  origen: movimientoData.origen,
                  monto: movimientoData.monto
                });

                await window.firebaseRepos.tesoreria.saveMovimiento(movimientoId, movimientoData);
                console.log(`✅ Movimiento CXP guardado en Firebase: ${movimientoId}`);
              } else {
                console.warn(
                  '⚠️ Repositorio Tesorería no inicializado completamente para guardar movimiento CXP'
                );
              }
            } catch (error) {
              console.error('❌ Error guardando movimiento CXP en Firebase:', error);
              console.log('⚠️ Continuando con localStorage...');
            }
          } else {
            console.warn('⚠️ Repositorio Tesorería no disponible para guardar movimiento CXP');
          }

          // Actualizar tabla de movimientos si existe
          if (
            window.tesoreriaMovimientosUI &&
            typeof window.tesoreriaMovimientosUI.loadHistorialTable === 'function'
          ) {
            window.tesoreriaMovimientosUI.loadHistorialTable();
          }
        } catch (error) {
          console.error('❌ Error al registrar movimiento en historial de Tesorería:', error);
          // No fallar el proceso si solo falla el registro en historial
        }

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(
          document.getElementById('modalRegistrarPagoSolicitud')
        );
        if (modal) {
          modal.hide();
        }

        // Mostrar notificación
        if (typeof window.showNotification === 'function') {
          window.showNotification('✅ Pago registrado exitosamente', 'success');
        } else {
          alert('✅ Pago registrado exitosamente');
        }

        // Actualizar tabla
        await aplicarFiltros();

        // Recargar página después de guardar (el botón se restaurará al recargar)
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        restaurarBoton();
        alert('❌ Error al registrar el pago');
      }
    } catch (error) {
      console.error('❌ Error al registrar pago:', error);
      restaurarBoton();
      alert(`Error al registrar el pago: ${error.message}`);
    }
  }

  // Exponer función globalmente inmediatamente después de su definición
  window.registrarPagoSolicitud = registrarPagoSolicitud;
  console.log(
    '✅ Función registrarPagoSolicitud expuesta globalmente:',
    typeof window.registrarPagoSolicitud
  );

  // Verificar después de un delay que la función esté disponible
  setTimeout(() => {
    if (typeof window.registrarPagoSolicitud === 'function') {
      console.log('✅ Verificación: registrarPagoSolicitud está disponible globalmente');
    } else {
      console.error('❌ Verificación: registrarPagoSolicitud NO está disponible globalmente');
    }
  }, 1000);

  // Función para formatear moneda
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  async function eliminarOrdenPago(ordenId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta orden de pago?')) {
      return;
    }

    try {
      const ordenes = await loadOrdenes();
      const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
      const ordenFiltrada = ordenesArray.filter(o => o.id !== ordenId);

      await saveOrdenes(ordenFiltrada);

      // Eliminar de Firebase también
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        try {
          const ordenIdFirebase = `orden_${ordenId}`;
          await window.firebaseRepos.tesoreria.delete(ordenIdFirebase);
          console.log(`✅ Orden de pago eliminada de Firebase: ${ordenIdFirebase}`);
        } catch (error) {
          console.warn('⚠️ Error eliminando de Firebase:', error);
        }
      }

      await aplicarFiltros();
      alert('Orden de pago eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando orden de pago:', error);
      alert('Error al eliminar la orden de pago');
    }
  }

  async function descargarPDFOrdenPago(ordenId) {
    console.log(`📄 Descargando PDF de la orden de pago: ${ordenId}`);

    const ordenes = await loadOrdenes();
    const ordenesArray = Array.isArray(ordenes) ? ordenes : [];
    const orden = ordenesArray.find(o => o.id === ordenId);

    if (!orden) {
      alert('Orden de pago no encontrada');
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

      // Función auxiliar para obtener etiqueta de operación (usa facturasCXP cargadas)
      function obtenerOperacion(op, facturas) {
        const totalFacturas = Array.isArray(op.facturasIncluidas) ? op.facturasIncluidas.length : 0;
        if (totalFacturas > 1) {
          return `MULTI (${totalFacturas})`;
        } else if (totalFacturas === 1) {
          if (op.opNumeroFactura) {
            return op.opNumeroFactura;
          }
          if (Array.isArray(facturas) && facturas.length > 0) {
            const f = facturas.find(x => x.id === op.facturasIncluidas[0]);
            if (f && f.numeroFactura) {
              return f.numeroFactura;
            }
          }
        }
        return `OP-${op.id.toString().slice(-6)}`;
      }

      // Función auxiliar para obtener números de facturas (async para poder usar await)
      // Nota: Esta función necesita ser async, pero se llama dentro de una función async
      // Por lo tanto, necesitamos cargar las facturas antes de llamar a esta función

      // Función auxiliar para formatear estado
      function formatearEstado(estado) {
        const estados = {
          por_pagar: 'Por Pagar',
          pagando: 'Pagando',
          pagado: 'Pagado',
          'parcial pagado': 'P-Pagado',
          rechazado: 'Rechazado'
        };
        return estados[estado] || estado || 'N/A';
      }

      // Función auxiliar para formatear prioridad
      function formatearPrioridad(prioridad) {
        const prioridades = {
          normal: 'Normal',
          alta: 'Alta',
          urgente: 'Urgente'
        };
        return prioridades[prioridad] || prioridad || 'N/A';
      }

      // Cargar facturas de CXP para obtener información detallada
      let facturasCXP = [];
      try {
        // PRIORIDAD 1: Intentar cargar desde Firebase
        if (window.firebaseRepos && window.firebaseRepos.cxp) {
          try {
            facturasCXP = await window.firebaseRepos.cxp.getAllFacturas();
            if (!Array.isArray(facturasCXP)) {
              facturasCXP = [];
            }
            console.log(`📊 ${facturasCXP.length} facturas cargadas desde Firebase para PDF`);
          } catch (error) {
            console.warn('⚠️ Error cargando facturas desde Firebase:', error);
          }
        }

        // PRIORIDAD 2: Si no hay facturas desde Firebase, usar localStorage
        if (!Array.isArray(facturasCXP) || facturasCXP.length === 0) {
          const facturasData = localStorage.getItem('erp_cxp_facturas');
          if (facturasData) {
            facturasCXP = JSON.parse(facturasData);
            if (!Array.isArray(facturasCXP)) {
              facturasCXP = [];
            }
            console.log(`📊 ${facturasCXP.length} facturas cargadas desde localStorage para PDF`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando facturas CXP para PDF:', error);
        facturasCXP = [];
      }

      // Función auxiliar para obtener números de facturas (ahora usa facturasCXP cargadas)
      function obtenerFacturasIncluidas(op, facturas) {
        if (!Array.isArray(op.facturasIncluidas) || op.facturasIncluidas.length === 0) {
          return 'N/A';
        }

        try {
          if (!Array.isArray(facturas) || facturas.length === 0) {
            return op.facturasIncluidas.join(', ');
          }

          const numerosFacturas = op.facturasIncluidas.map(fid => {
            const f = facturas.find(x => x.id === fid);
            return f && f.numeroFactura ? f.numeroFactura : `ID:${fid}`;
          });

          return numerosFacturas.join(', ');
        } catch (error) {
          return op.facturasIncluidas.join(', ');
        }
      }

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDEN DE PAGO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Operación
      const operacion = obtenerOperacion(orden, facturasCXP);
      doc.setFontSize(12);
      doc.text(`Operación: ${operacion}`, margin, yPosition);
      yPosition += 10;

      // Fecha de creación
      const fechaCreacion = formatearFecha(orden.createdAt);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Creación: ${fechaCreacion}`, margin, yPosition);
      yPosition += 15;

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Información General
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN GENERAL', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Guardar posición inicial para ambas columnas
      const startY = yPosition;
      let leftY = startY;
      const rightY = startY;

      // Columna izquierda
      doc.text(`Proveedor: ${obtenerValor(orden.proveedor)}`, col1X, leftY);
      leftY += 6;
      doc.text(`Monto: $${parseFloat(orden.monto || 0).toFixed(2)}`, col1X, leftY);
      leftY += 6;
      doc.text(`Método de Pago: ${obtenerValor(orden.metodoPago)}`, col1X, leftY);
      leftY += 6;
      doc.text(`Estado: ${formatearEstado(orden.estado)}`, col1X, leftY);
      leftY += 6;
      doc.text(`Prioridad: ${formatearPrioridad(orden.prioridad)}`, col1X, leftY);
      leftY += 6;
      doc.text(`Fecha Requerida: ${formatearFecha(orden.fechaRequerida)}`, col1X, leftY);
      leftY += 6;

      // Columna derecha (puede usarse para información adicional en el futuro)
      // Por ahora se deja vacía o se puede agregar información adicional

      // Usar la posición más baja de las dos columnas para continuar
      yPosition = Math.max(leftY, rightY) + 10;

      // Facturas Incluidas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('FACTURAS INCLUIDAS', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Obtener información detallada de facturas incluidas
      let facturasIncluidasTexto = 'N/A';
      let facturasDetalle = [];

      if (
        Array.isArray(orden.facturasIncluidas) &&
        orden.facturasIncluidas.length > 0 &&
        Array.isArray(facturasCXP) &&
        facturasCXP.length > 0
      ) {
        facturasDetalle = orden.facturasIncluidas
          .map(fid => facturasCXP.find(f => f.id === fid))
          .filter(f => f !== null);

        if (facturasDetalle.length > 0) {
          facturasIncluidasTexto = facturasDetalle
            .map(f => f.numeroFactura || `ID:${f.id}`)
            .join(', ');
        } else {
          facturasIncluidasTexto = obtenerFacturasIncluidas(orden, facturasCXP);
        }
      } else {
        facturasIncluidasTexto = obtenerFacturasIncluidas(orden, facturasCXP);
      }

      if (facturasIncluidasTexto !== 'N/A') {
        // Si hay facturas detalladas, mostrar tabla
        if (facturasDetalle.length > 0) {
          yPosition += 5;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Número de Factura', margin, yPosition);
          doc.text('Monto', col2X, yPosition);
          yPosition += 8;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);

          let totalFacturas = 0;
          facturasDetalle.forEach(f => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            const monto = parseFloat(f.monto || 0);
            totalFacturas += monto;
            doc.text(f.numeroFactura || `ID:${f.id}`, margin, yPosition);
            doc.text(`$${monto.toFixed(2)}`, col2X, yPosition);
            yPosition += 7;
          });

          // Total
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          yPosition += 3;
          doc.setDrawColor(0, 0, 0);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'bold');
          doc.text('Total:', margin, yPosition);
          doc.text(`$${totalFacturas.toFixed(2)}`, col2X, yPosition);
          yPosition += 10;
        } else {
          // Si no hay detalles, mostrar solo texto
          const splitFacturas = doc.splitTextToSize(facturasIncluidasTexto, pageWidth - 2 * margin);
          doc.text(splitFacturas, margin, yPosition);
          yPosition += splitFacturas.length * 5 + 5;
        }
      } else {
        doc.text('N/A', margin, yPosition);
        yPosition += 10;
      }

      // Guardar PDF
      const nombreArchivo = `OrdenPago_${operacion}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(nombreArchivo);

      console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
      alert('PDF de la orden de pago generado exitosamente');
    } catch (error) {
      console.error('❌ Error generando PDF de la orden de pago:', error);
      alert('Error al generar PDF de la orden de pago');
    }
  }

  // Función para eliminar órdenes problemáticas específicas
  async function eliminarOrdenesProblematicas(ordenIds) {
    if (!Array.isArray(ordenIds) || ordenIds.length === 0) {
      console.warn('⚠️ No se proporcionaron IDs de órdenes para eliminar');
      return;
    }

    console.log(`🗑️ Eliminando ${ordenIds.length} orden(es) problemática(s):`, ordenIds);

    try {
      // Cargar todas las órdenes
      const ordenes = await loadOrdenes();
      const ordenesArray = Array.isArray(ordenes) ? ordenes : [];

      // Filtrar las órdenes problemáticas
      const ordenesFiltradas = ordenesArray.filter(o => {
        const ordenId = o.id ? String(o.id) : '';
        const debeEliminar = ordenIds.some(id => {
          const idStr = String(id);
          // Comparar por ID completo o por los últimos 6 dígitos (formato OP-XXXXXX)
          return (
            ordenId === idStr ||
            ordenId.endsWith(idStr) ||
            idStr.endsWith(ordenId) ||
            ordenId.includes(idStr.replace('OP-', '')) ||
            idStr.replace('OP-', '').includes(ordenId)
          );
        });
        return !debeEliminar;
      });

      console.log(
        `📊 Antes: ${ordenesArray.length} órdenes, Después: ${ordenesFiltradas.length} órdenes`
      );

      // Guardar las órdenes filtradas
      await saveOrdenes(ordenesFiltradas);

      // Eliminar de Firebase también
      if (window.firebaseRepos && window.firebaseRepos.tesoreria) {
        for (const ordenId of ordenIds) {
          try {
            // Intentar diferentes formatos de ID
            const idSinPrefijo = String(ordenId).replace('OP-', '');
            const posiblesIds = [
              `orden_${ordenId}`,
              `orden_${idSinPrefijo}`,
              ordenId,
              idSinPrefijo
            ];

            for (const idFirebase of posiblesIds) {
              try {
                await window.firebaseRepos.tesoreria.delete(idFirebase);
                console.log(`✅ Orden eliminada de Firebase: ${idFirebase}`);
                break; // Si se eliminó exitosamente, no intentar otros formatos
              } catch (error) {
                // Continuar con el siguiente formato
              }
            }
          } catch (error) {
            console.warn(`⚠️ Error eliminando orden ${ordenId} de Firebase:`, error);
          }
        }
      }

      // Recargar la vista
      await aplicarFiltros();

      console.log(`✅ ${ordenIds.length} orden(es) problemática(s) eliminada(s) exitosamente`);
      if (typeof showNotification === 'function') {
        showNotification(`✅ ${ordenIds.length} orden(es) eliminada(s) exitosamente`, 'success');
      } else {
        alert(`✅ ${ordenIds.length} orden(es) eliminada(s) exitosamente`);
      }
    } catch (error) {
      console.error('❌ Error eliminando órdenes problemáticas:', error);
      if (typeof showNotification === 'function') {
        showNotification('❌ Error al eliminar las órdenes', 'error');
      } else {
        alert('❌ Error al eliminar las órdenes');
      }
    }
  }

  // Exponer función globalmente para uso desde consola
  window.eliminarOrdenesProblematicas = eliminarOrdenesProblematicas;

  window.tesoreriaUI = {
    aplicarFiltros,
    limpiarFiltrosSolicitudes,
    verDetalle,
    marcarPagando,
    marcarPagado,
    marcarRechazado,
    abrirModalPago,
    eliminarOrdenPago,
    descargarPDFOrdenPago,
    eliminarOrdenesProblematicas
  };

  // Función para mostrar preview de archivos
  function previewComprobantesSolicitud() {
    const input = document.getElementById('comprobantesPagoSolicitud');
    const preview = document.getElementById('previewComprobantesSolicitud');

    preview.innerHTML = '';

    if (input.files.length > 0) {
      const fileList = document.createElement('div');
      fileList.className = 'list-group';

      Array.from(input.files).forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';

        const fileInfo = document.createElement('div');
        fileInfo.innerHTML = `
                    <div class="d-flex align-items-center">
                        <i class="fas fa-file-${getFileIcon(file.type)} me-2"></i>
                        <div>
                            <strong>${file.name}</strong><br>
                            <small class="text-muted">${formatFileSize(file.size)}</small>
                        </div>
                    </div>
                `;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-outline-danger';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => {
          // Crear nueva lista de archivos sin este archivo
          const dt = new DataTransfer();
          Array.from(input.files).forEach((f, i) => {
            if (i !== index) {
              dt.items.add(f);
            }
          });
          input.files = dt.files;
          previewComprobantesSolicitud(); // Recargar preview
        };

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        fileList.appendChild(fileItem);
      });

      preview.appendChild(fileList);
    }
  }

  // Función para obtener icono según tipo de archivo
  function getFileIcon(type) {
    if (type.includes('pdf')) {
      return 'pdf';
    }
    if (type.includes('image')) {
      return 'image';
    }
    if (type.includes('word') || type.includes('document')) {
      return 'word';
    }
    return 'alt';
  }

  // Función para formatear tamaño de archivo
  function formatFileSize(bytes) {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Hacer las funciones globales
  window.registrarPagoSolicitud = registrarPagoSolicitud;
  window.previewComprobantesSolicitud = previewComprobantesSolicitud;

  // Función global para cambiar de página en solicitudes de tesorería
  window.cambiarPaginaSolicitudesTesoreria = function (accion) {
    if (!window._paginacionSolicitudesTesoreriaManager) {
      console.warn('⚠️ window._paginacionSolicitudesTesoreriaManager no está disponible');
      return;
    }

    let cambioExitoso = false;

    if (accion === 'anterior') {
      cambioExitoso = window._paginacionSolicitudesTesoreriaManager.paginaAnterior();
    } else if (accion === 'siguiente') {
      cambioExitoso = window._paginacionSolicitudesTesoreriaManager.paginaSiguiente();
    } else if (typeof accion === 'number') {
      cambioExitoso = window._paginacionSolicitudesTesoreriaManager.irAPagina(accion);
    }

    if (cambioExitoso) {
      renderizarOrdenesPaginadas();
      // Scroll suave hacia la tabla
      const tabla = document.getElementById('tbodyOrdenesPago');
      if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Función para inicializar órdenes de pago
  async function inicializarOrdenesPago() {
    console.log('🚀 Inicializando sistema de órdenes de pago...');
    // Cargar órdenes desde Firebase primero
    const ops = await loadOrdenes();
    console.log(`🏦 Tesorería lista. Órdenes existentes: ${ops.length}`);

    // Log detallado de las órdenes cargadas para diagnóstico
    if (ops.length > 0) {
      console.log(
        '📋 Órdenes cargadas:',
        ops.map(o => ({
          id: o.id,
          solicitudId: o.solicitudId,
          proveedor: o.proveedor,
          monto: o.monto,
          estado: o.estado,
          tipo: o.tipo || 'orden_pago'
        }))
      );
    } else {
      console.log('⚠️ No se encontraron órdenes. Verificando localStorage...');
      const localData = localStorage.getItem('erp_teso_ordenes_pago');
      if (localData) {
        try {
          const localOrdenes = JSON.parse(localData);
          console.log(`📦 Órdenes en localStorage: ${localOrdenes.length}`);
          if (localOrdenes.length > 0) {
            console.log(
              '📋 Órdenes en localStorage:',
              localOrdenes.map(o => ({
                id: o.id,
                solicitudId: o.solicitudId,
                proveedor: o.proveedor,
                estado: o.estado
              }))
            );
          }
        } catch (e) {
          console.error('❌ Error leyendo localStorage:', e);
        }
      }
    }

    // Renderizar todas las órdenes primero, luego aplicar filtros
    if (typeof renderOrdenes === 'function') {
      renderOrdenes(ops);
      console.log('✅ Órdenes renderizadas en la tabla');
    } else {
      console.warn('⚠️ renderOrdenes no está disponible');
    }
    aplicarFiltros();

    // Listener para cuando se active el tab de solicitudes
    const solicitudesTab = document.getElementById('solicitudes-tab');
    if (solicitudesTab) {
      solicitudesTab.addEventListener('shown.bs.tab', async () => {
        console.log('📋 Tab de Solicitudes activado, recargando órdenes...');
        await aplicarFiltros();
        // Configurar filtros automáticos cuando se muestra la pestaña
        configurarFiltrosAutomaticos();
      });
    }

    // Configurar filtros automáticos
    function configurarFiltrosAutomaticos() {
      console.log('🔧 Configurando filtros automáticos para solicitudes...');

      const filtros = [
        { id: 'tesoFiltroProveedor', tipo: 'text' },
        { id: 'tesoFiltroEstado', tipo: 'text' },
        { id: 'tesoFiltroDesde', tipo: 'date' },
        { id: 'tesoFiltroHasta', tipo: 'date' },
        { id: 'tesoFiltroPrioridad', tipo: 'select' }
      ];

      filtros.forEach(filtro => {
        const elemento = document.getElementById(filtro.id);
        if (elemento) {
          // Remover listeners anteriores si existen
          const nuevoElemento = elemento.cloneNode(true);
          elemento.parentNode.replaceChild(nuevoElemento, elemento);

          if (filtro.tipo === 'text') {
            // Para campos de texto, usar debounce
            let debounceTimer;
            nuevoElemento.addEventListener('input', () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                console.log(`🔍 Filtro automático ejecutado desde: ${filtro.id}`);
                aplicarFiltros();
              }, 500);
            });
          } else {
            // Para selects y dates, usar change
            nuevoElemento.addEventListener('change', () => {
              console.log(`🔍 Filtro automático ejecutado desde: ${filtro.id}`);
              aplicarFiltros();
            });
          }
          console.log(`✅ Listener configurado para filtro: ${filtro.id}`);
        } else {
          console.warn(`⚠️ Elemento de filtro no encontrado: ${filtro.id}`);
        }
      });
    }

    // Configurar filtros automáticos inmediatamente si la pestaña ya está activa
    const tabSolicitudesContent = document.getElementById('solicitudes');
    if (
      tabSolicitudesContent &&
      (tabSolicitudesContent.classList.contains('active') ||
        tabSolicitudesContent.classList.contains('show'))
    ) {
      setTimeout(() => {
        configurarFiltrosAutomaticos();
      }, 500);
    }

    // También configurar después de un delay para asegurar que todo esté listo
    setTimeout(() => {
      configurarFiltrosAutomaticos();
    }, 1500);

    // Configurar listener para órdenes de pago en tiempo real
    async function configurarListenerOrdenes() {
      try {
        if (!window.firebaseRepos?.tesoreria) {
          console.warn('⚠️ Repositorio Tesorería no disponible para listener de órdenes');
          return;
        }

        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 20 &&
          (!window.firebaseRepos.tesoreria.db || !window.firebaseRepos.tesoreria.tenantId)
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          if (window.firebaseRepos.tesoreria && !window.firebaseRepos.tesoreria.db) {
            await window.firebaseRepos.tesoreria.init();
          }
        }

        if (window.firebaseRepos.tesoreria.db && window.firebaseRepos.tesoreria.tenantId) {
          console.log('📡 Suscribiéndose a cambios en tiempo real de órdenes de pago...');

          const unsubscribe = await window.firebaseRepos.tesoreria.subscribe(items => {
            console.log(
              `📡 Actualización en tiempo real Tesorería: ${items.length} items recibidos`
            );

            // Log detallado de los items recibidos para diagnóstico
            if (items.length > 0) {
              console.log(
                '📋 Items recibidos (primeros 3):',
                items.slice(0, 3).map(item => ({
                  id: item.id,
                  tipo: item.tipo,
                  proveedor: item.proveedor,
                  estado: item.estado,
                  solicitudId: item.solicitudId || 'N/A'
                }))
              );
            }

            // Filtrar solo órdenes de pago
            // Incluir items que:
            // 1. Tengan tipo 'orden_pago'
            // 2. Tengan solicitudId (vienen de CXP) - incluso si no tienen tipo
            // 3. Tengan campos típicos de órdenes de pago (proveedor, monto, etc.)
            const ordenesFiltradas = items
              .filter(item => {
                // Excluir movimientos (ingresos/egresos) que no son órdenes de pago
                if (item.tipo === 'ingreso' || item.tipo === 'egreso') {
                  return false;
                }

                // Si tiene tipo 'orden_pago', incluirlo
                if (item.tipo === 'orden_pago') {
                  return true;
                }
                // Si tiene solicitudId, es una orden de CXP, incluirlo
                if (item.solicitudId) {
                  return true;
                }
                // Si tiene campos típicos de orden de pago pero sin tipo, incluirlo
                if (item.proveedor && item.monto !== undefined && !item.tipo) {
                  return true;
                }
                return false;
              })
              .map(item => {
                // Asegurar que todas las órdenes tengan el tipo correcto
                if (!item.tipo) {
                  item.tipo = 'orden_pago';
                }
                return item;
              });

            // Filtrar duplicados por ID y solicitudId
            const ordenesUnicas = [];
            const idsVistos = new Set();
            const solicitudesIdsVistos = new Set();

            ordenesFiltradas.forEach(orden => {
              // Evitar duplicados por ID
              if (idsVistos.has(orden.id)) {
                console.warn(
                  `⚠️ Orden duplicada por ID detectada en listener: ${orden.id}, omitiendo`
                );
                return;
              }

              // Evitar duplicados por solicitudId
              if (orden.solicitudId && solicitudesIdsVistos.has(orden.solicitudId)) {
                console.warn(
                  `⚠️ Orden duplicada por solicitudId detectada en listener: ${orden.solicitudId}, omitiendo`
                );
                return;
              }

              idsVistos.add(orden.id);
              if (orden.solicitudId) {
                solicitudesIdsVistos.add(orden.solicitudId);
              }
              ordenesUnicas.push(orden);
            });

            const ordenes = ordenesUnicas;

            console.log(
              `📡 Actualización en tiempo real: ${ordenes.length} órdenes de pago únicas recibidas de ${items.length} items totales (${ordenesFiltradas.length} después de filtrar por tipo, ${ordenes.length} después de eliminar duplicados)`
            );

            // Log detallado de órdenes con solicitudId (de CXP)
            const ordenesCXP = ordenes.filter(o => o.solicitudId);
            console.log(
              `📋 Órdenes de CXP (con solicitudId): ${ordenesCXP.length} de ${ordenes.length}`
            );
            if (ordenesCXP.length > 0) {
              console.log(
                '📋 Detalles de órdenes de CXP:',
                ordenesCXP.map(o => ({
                  id: o.id,
                  solicitudId: o.solicitudId,
                  proveedor: o.proveedor,
                  monto: o.monto,
                  estado: o.estado,
                  tipo: o.tipo
                }))
              );
            }

            // Log de órdenes encontradas
            if (ordenes.length > 0) {
              console.log(
                '📋 Órdenes de pago encontradas:',
                ordenes.map(o => ({
                  id: o.id,
                  solicitudId: o.solicitudId || 'N/A',
                  proveedor: o.proveedor,
                  monto: o.monto,
                  estado: o.estado,
                  tipo: o.tipo
                }))
              );
            }

            // Obtener datos previos para detectar eliminaciones
            const ordenesPrevias = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').length;

            // Actualizar localStorage SIEMPRE con los datos de Firebase (solo órdenes únicas)
            // Esto asegura que los documentos eliminados también se eliminen del localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ordenes));

            // Log para debugging
            if (ordenesPrevias > ordenes.length) {
              console.log(
                `🗑️ ${ordenesPrevias - ordenes.length} orden(es) eliminada(s) del localStorage de Tesorería (sincronizado con Firebase)`
              );
            } else if (ordenes.length > ordenesPrevias) {
              console.log(
                `✅ ${ordenes.length - ordenesPrevias} nueva(s) orden(es) agregada(s) al localStorage de Tesorería`
              );
            }

            console.log(`🔄 Renderizando ${ordenes.length} orden(es) en la tabla...`);

            // Recargar tabla
            renderOrdenes(ordenes);
            aplicarFiltros();
          });

          if (unsubscribe && typeof unsubscribe === 'function') {
            window.__tesoreriaOrdenesUnsubscribe = unsubscribe;
            console.log('✅ Suscripción a órdenes de pago configurada correctamente');
          }
        }
      } catch (error) {
        console.error('❌ Error configurando listener de órdenes:', error);
      }
    }

    // Configurar listener después de un breve delay
    setTimeout(() => {
      configurarListenerOrdenes();
    }, 3000);
  }

  // Función para verificar y crear órdenes faltantes para solicitudes de CXP en estado "en tesoreria"
  async function verificarYCrearOrdenesFaltantesCXP() {
    // Usar un flag para evitar ejecuciones simultáneas
    if (window._verificandoOrdenesCXP) {
      console.log('⏳ Verificación de órdenes CXP ya en progreso, omitiendo...');
      return;
    }

    window._verificandoOrdenesCXP = true;

    try {
      console.log('🔍 Verificando solicitudes de CXP que deberían tener órdenes en Tesorería...');

      // Cargar solicitudes de CXP desde Firebase
      let solicitudesCXP = [];
      if (window.firebaseRepos?.cxp) {
        try {
          solicitudesCXP = await window.firebaseRepos.cxp.getAllSolicitudes();
          console.log(`📊 ${solicitudesCXP.length} solicitudes cargadas desde Firebase CXP`);
        } catch (error) {
          console.warn('⚠️ Error cargando solicitudes desde Firebase CXP:', error);
        }
      }

      // Si no hay solicitudes desde Firebase, intentar desde localStorage
      if (solicitudesCXP.length === 0) {
        try {
          const solicitudesData = localStorage.getItem('erp_cxp_solicitudes');
          if (solicitudesData) {
            solicitudesCXP = JSON.parse(solicitudesData);
            console.log(`📊 ${solicitudesCXP.length} solicitudes cargadas desde localStorage CXP`);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando solicitudes desde localStorage CXP:', error);
        }
      }

      // Filtrar SOLO solicitudes en estado "en tesoreria" (excluir pagadas, parcial pagadas, rechazadas, etc.)
      const solicitudesEnTesoreria = solicitudesCXP.filter(s => s.estado === 'en tesoreria');
      console.log(`📋 Solicitudes en estado "en tesoreria": ${solicitudesEnTesoreria.length}`);

      if (solicitudesEnTesoreria.length === 0) {
        console.log('ℹ️ No hay solicitudes en estado "en tesoreria"');
        return;
      }

      // Cargar órdenes existentes
      const ordenesExistentes = await loadOrdenes();
      const ordenesArray = Array.isArray(ordenesExistentes) ? ordenesExistentes : [];
      console.log(`📊 ${ordenesArray.length} órdenes existentes en Tesorería`);

      // Verificar cuáles solicitudes no tienen orden
      let ordenesCreadas = 0;
      for (const solicitud of solicitudesEnTesoreria) {
        // NO crear órdenes para solicitudes que ya están pagadas o parcialmente pagadas
        if (solicitud.estado === 'pagada' || solicitud.estado === 'parcial pagado') {
          console.log(
            `ℹ️ Solicitud ${solicitud.id} ya está ${solicitud.estado}, omitiendo creación de orden`
          );
          continue;
        }

        // Verificar por solicitudId primero
        const ordenPorSolicitudId = ordenesArray.find(op => op.solicitudId === solicitud.id);

        // También verificar por monto y proveedor para evitar duplicados
        const ordenPorDatos = ordenesArray.find(
          op =>
            op.proveedor === solicitud.proveedor &&
            Math.abs(parseFloat(op.monto || 0) - parseFloat(solicitud.monto || 0)) < 0.01 &&
            op.facturasIncluidas &&
            Array.isArray(op.facturasIncluidas) &&
            solicitud.facturasIncluidas &&
            Array.isArray(solicitud.facturasIncluidas) &&
            op.facturasIncluidas.length === solicitud.facturasIncluidas.length &&
            op.facturasIncluidas.every((fid, idx) => fid === solicitud.facturasIncluidas[idx])
        );

        const tieneOrden = ordenPorSolicitudId || ordenPorDatos;

        if (!tieneOrden) {
          // Verificar que la solicitud realmente necesita una orden
          // NO crear órdenes para solicitudes pagadas o parcialmente pagadas
          if (solicitud.estado === 'pagada' || solicitud.estado === 'parcial pagado') {
            console.log(`ℹ️ Solicitud ${solicitud.id} está ${solicitud.estado}, NO creando orden`);
            continue;
          }

          console.log(`⚠️ Solicitud ${solicitud.id} no tiene orden en Tesorería, creando...`, {
            solicitudId: solicitud.id,
            proveedor: solicitud.proveedor,
            monto: solicitud.monto,
            facturasIncluidas: solicitud.facturasIncluidas,
            estado: solicitud.estado
          });
          try {
            const ordenCreada = await addOrdenPagoFromSolicitud(solicitud);
            if (ordenCreada && ordenCreada.id) {
              ordenesCreadas++;
              console.log(`✅ Orden creada para solicitud ${solicitud.id}:`, ordenCreada.id);
            } else {
              console.log(`ℹ️ Orden ya existía para solicitud ${solicitud.id}`);
            }
          } catch (error) {
            console.error(`❌ Error creando orden para solicitud ${solicitud.id}:`, error);
          }
        } else {
          const ordenEncontrada = ordenPorSolicitudId || ordenPorDatos;
          console.log(`✅ Solicitud ${solicitud.id} ya tiene orden en Tesorería:`, {
            ordenId: ordenEncontrada.id,
            estado: ordenEncontrada.estado,
            proveedor: ordenEncontrada.proveedor
          });
        }
      }

      if (ordenesCreadas > 0) {
        console.log(`✅ ${ordenesCreadas} orden(es) creada(s) para solicitudes de CXP`);
        // Recargar órdenes después de crear las faltantes
        setTimeout(async () => {
          const ordenesActualizadas = await loadOrdenes();
          renderOrdenes(ordenesActualizadas);
        }, 1000);
      } else {
        console.log('ℹ️ Todas las solicitudes ya tienen órdenes en Tesorería');
      }
    } catch (error) {
      console.error('❌ Error verificando órdenes faltantes de CXP:', error);
    } finally {
      // Liberar flag
      delete window._verificandoOrdenesCXP;
    }
  }

  // Exponer función globalmente
  window.verificarYCrearOrdenesFaltantesCXP = verificarYCrearOrdenesFaltantesCXP;

  // Ejecutar inmediatamente si el DOM ya está listo, o esperar al evento
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarOrdenesPago);
  } else {
    // DOM ya está listo, ejecutar inmediatamente
    inicializarOrdenesPago();

    // Verificar y crear órdenes faltantes después de inicializar (solo una vez)
    // Usar un flag para evitar múltiples ejecuciones
    if (!window._verificacionCXPRealizada) {
      window._verificacionCXPRealizada = true;
      setTimeout(async () => {
        await verificarYCrearOrdenesFaltantesCXP();
      }, 5000);
    }
  }
})();
