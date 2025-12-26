/**
 * Vista de Registros de Facturación - facturacion.html
 * Operaciones de lectura: Ver detalles y obtener registros
 */

(function () {
  'use strict';

  /**
   * Función helper para limpiar formato de moneda
   */
  function limpiarFormatoMonedaDetalle(valor) {
    if (!valor) {
      return 0;
    }
    if (typeof valor === 'number') {
      return valor;
    }
    if (typeof valor === 'string') {
      const limpio = valor.replace(/[$,\s]/g, '');
      const numero = parseFloat(limpio);
      return isNaN(numero) ? 0 : numero;
    }
    return 0;
  }

  /**
   * Ver detalles de un registro de Facturación
   */
  window.verRegistroFacturacion = async function (regId) {
    try {
      console.log('🔍 Buscando registro de facturación:', regId);

      // PRIORIDAD 0: Asegurar que Firebase esté completamente inicializado
      if (typeof window.waitForFirebase === 'function') {
        console.log('⏳ Esperando a que Firebase esté completamente inicializado...');
        const firebaseReady = await window.waitForFirebase(30000);
        if (!firebaseReady) {
          console.warn('⚠️ Firebase no está disponible después de esperar 30 segundos');
        } else {
          console.log('✅ Firebase está completamente inicializado');
        }
      }

      // PRIORIDAD 0.5: Esperar a que los repositorios estén disponibles
      if (!window.firebaseRepos || !window.firebaseRepos.facturacion) {
        console.log('⏳ Esperando a que los repositorios Firebase estén disponibles...');
        let intentosRepos = 0;
        const maxIntentosRepos = 60; // 30 segundos

        while (
          (!window.firebaseRepos || !window.firebaseRepos.facturacion) &&
          intentosRepos < maxIntentosRepos
        ) {
          intentosRepos++;
          await new Promise(resolve => setTimeout(resolve, 500));
          if (intentosRepos % 10 === 0) {
            console.log(`⏳ Esperando repositorios... (${intentosRepos}/${maxIntentosRepos})`);
          }
        }

        if (window.firebaseRepos && window.firebaseRepos.facturacion) {
          console.log('✅ Repositorios Firebase están disponibles');
        } else {
          console.warn('⚠️ Repositorios Firebase no están disponibles después de esperar');
        }
      }

      let registro = null;

      // PRIORIDAD 1: Buscar en Firebase usando el repositorio
      if (window.firebaseRepos?.facturacion) {
        const repoFacturacion = window.firebaseRepos.facturacion;

        // Verificar que el repositorio esté inicializado
        if (!repoFacturacion.db || !repoFacturacion.tenantId) {
          console.log('🔄 Repositorio de facturación no inicializado, intentando inicializar...');
          if (typeof repoFacturacion.init === 'function') {
            await repoFacturacion.init();
          }
        }

        // Esperar hasta que el repositorio esté completamente listo
        let intentosInit = 0;
        while ((!repoFacturacion.db || !repoFacturacion.tenantId) && intentosInit < 20) {
          intentosInit++;
          await new Promise(resolve => setTimeout(resolve, 200));
          if (typeof repoFacturacion.init === 'function') {
            await repoFacturacion.init();
          }
        }

        if (repoFacturacion.db && repoFacturacion.tenantId) {
          try {
            console.log('🔍 Buscando en Firebase usando repositorio...');
            console.log('📊 Estado del repositorio:', {
              tieneDb: Boolean(repoFacturacion.db),
              tieneTenantId: Boolean(repoFacturacion.tenantId),
              tenantId: repoFacturacion.tenantId,
              regId: regId
            });

            // Intentar con get()
            registro = await repoFacturacion.get(regId);
            if (registro) {
              console.log('✅ Registro encontrado en Firebase usando get()');
            } else {
              // Intentar con getRegistro() como fallback
              if (typeof repoFacturacion.getRegistro === 'function') {
                console.log('🔄 Intentando con getRegistro()...');
                registro = await repoFacturacion.getRegistro(regId);
                if (registro) {
                  console.log('✅ Registro encontrado en Firebase usando getRegistro()');
                }
              }
            }
          } catch (error) {
            console.error('❌ Error buscando en Firebase con repositorio:', error);
            console.error('📋 Stack:', error.stack);
          }
        } else {
          console.warn('⚠️ Repositorio de facturación no está inicializado correctamente');
        }
      }

      // PRIORIDAD 2: Buscar directamente en Firebase si el repositorio no funcionó
      if (!registro && window.firebaseDb && window.fs && window.fs.doc && window.fs.getDoc) {
        try {
          console.log('🔍 Buscando directamente en Firebase (sin repositorio)...');

          // Intentar con el ID tal cual
          const docRef = window.fs.doc(window.firebaseDb, 'facturacion', regId);
          const docSnap = await window.fs.getDoc(docRef);

          if (docSnap.exists()) {
            registro = { id: docSnap.id, ...docSnap.data() };
            console.log('✅ Registro encontrado directamente en Firebase');
          } else {
            // Intentar buscar por numeroRegistro si el ID directo no funciona
            console.log('🔄 ID directo no encontrado, buscando por numeroRegistro...');
            const collectionRef = window.fs.collection(window.firebaseDb, 'facturacion');
            const q = window.fs.query(
              collectionRef,
              window.fs.where('numeroRegistro', '==', regId),
              window.fs.where('deleted', '==', false)
            );
            const querySnapshot = await window.fs.getDocs(q);

            if (!querySnapshot.empty) {
              const firstDoc = querySnapshot.docs[0];
              registro = { id: firstDoc.id, ...firstDoc.data() };
              console.log('✅ Registro encontrado por numeroRegistro:', firstDoc.id);
            }
          }
        } catch (error) {
          console.error('❌ Error buscando directamente en Firebase:', error);
        }
      }

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      if (!registro) {
        console.error('❌ Registro no encontrado después de todos los intentos');
        console.error('📋 ID buscado:', regId);
        console.error('📋 Tipo de ID:', typeof regId);
        console.error('📋 Firebase disponible:', Boolean(window.firebaseDb));
        console.error('📋 Repositorio disponible:', Boolean(window.firebaseRepos?.facturacion));

        alert(
          `❌ Registro no encontrado en Firebase\n\nID buscado: ${regId}\n\nPor favor, verifica:\n1. Que el registro exista en Firebase\n2. Que tengas conexión a internet\n3. Que el ID sea correcto`
        );
        return;
      }

      // Formatear fecha
      const fecha = window.formatearFechaCreacionFacturacion
        ? window.formatearFechaCreacionFacturacion(registro.fechaCreacion, false)
        : registro.fechaCreacion
          ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
          : 'N/A';

      // Obtener valores numéricos
      const subtotal = limpiarFormatoMonedaDetalle(registro.Subtotal || registro.subtotal || '0');
      const iva = limpiarFormatoMonedaDetalle(registro.iva || registro.IVA || '0');
      const ivaRetenido = limpiarFormatoMonedaDetalle(
        registro['iva retenido'] || registro.ivaRetenido || registro['IVA Retenido'] || '0'
      );
      const isrRetenido = limpiarFormatoMonedaDetalle(
        registro['isr retenido'] || registro.isrRetenido || registro['ISR Retenido'] || '0'
      );
      const otrosMontos = limpiarFormatoMonedaDetalle(
        registro['Otros Montos'] || registro.otrosMontos || '0'
      );
      const totalFactura = limpiarFormatoMonedaDetalle(
        registro['total factura'] ||
          registro.totalFactura ||
          registro.montoTotal ||
          registro.total ||
          '0'
      );

      const tipoCambio = registro.tipoCambio || registro.tipoDeCambio || '0';
      const folioFiscal =
        registro['Folio Fiscal'] || registro.folioFiscal || registro.folioFiscalUUID || 'N/A';

      // Obtener información del cliente
      const clienteNombre = registro.cliente || registro.Cliente || 'N/A';
      let rfcCliente = registro.rfcCliente || registro.RFC || registro.rfc || 'N/A';
      const referenciaCliente =
        registro.referenciaCliente ||
        registro.ReferenciaCliente ||
        registro['referencia cliente'] ||
        registro['Referencia Cliente'] ||
        'N/A';

      // Detectar si clienteNombre es realmente un RFC (formato: 12-13 caracteres, solo letras y números)
      const esRFC = str => {
        if (!str || str === 'N/A') {
          return false;
        }
        // RFC típico: 12-13 caracteres, solo letras y números, sin espacios
        const rfcPattern = /^[A-Z0-9]{12,13}$/i;
        return rfcPattern.test(str.trim()) && str.length <= 13;
      };

      // Si clienteNombre parece ser un RFC, usarlo como RFC y buscar el nombre real
      if (esRFC(clienteNombre)) {
        console.log(
          '🔍 Detectado RFC en campo cliente, se buscará el nombre real...',
          clienteNombre
        );
        if (rfcCliente === 'N/A' || !rfcCliente) {
          rfcCliente = clienteNombre;
        }
        // Mostrar el RFC temporalmente mientras se busca el nombre
        // clienteNombre ya tiene el valor correcto, no necesita reasignación
      }

      // MOSTRAR EL MODAL INMEDIATAMENTE con los datos básicos
      // Los datos adicionales se actualizarán de forma asíncrona

      // Función para actualizar los campos del cliente de forma asíncrona
      const actualizarDatosCliente = async () => {
        try {
          let registroLogistica = null;
          let registroTrafico = null;
          let rfcFinal = rfcCliente;
          let referenciaFinal = referenciaCliente;
          let nombreFinal = clienteNombre;

          // Buscar en Firebase en paralelo (sin esperas largas)
          const buscarLogistica = async () => {
            if (window.firebaseRepos?.logistica) {
              const repo = window.firebaseRepos.logistica;
              if (!repo.db || !repo.tenantId) {
                if (typeof repo.init === 'function') {
                  await repo.init();
                }
              }
              // Solo esperar 1 segundo máximo
              let intentos = 0;
              while ((!repo.db || !repo.tenantId) && intentos < 5) {
                intentos++;
                await new Promise(resolve => setTimeout(resolve, 200));
                if (typeof repo.init === 'function') {
                  await repo.init();
                }
              }
              if (repo.db && repo.tenantId) {
                try {
                  return repo.get(regId);
                } catch (e) {
                  console.debug('ℹ️ Error obteniendo logística:', e);
                }
              }
            }
            return null;
          };

          const buscarTrafico = async () => {
            if (window.firebaseRepos?.trafico) {
              const repo = window.firebaseRepos.trafico;
              if (!repo.db || !repo.tenantId) {
                if (typeof repo.init === 'function') {
                  await repo.init();
                }
              }
              // Solo esperar 1 segundo máximo
              let intentos = 0;
              while ((!repo.db || !repo.tenantId) && intentos < 5) {
                intentos++;
                await new Promise(resolve => setTimeout(resolve, 200));
                if (typeof repo.init === 'function') {
                  await repo.init();
                }
              }
              if (repo.db && repo.tenantId) {
                try {
                  return repo.get(regId);
                } catch (e) {
                  console.debug('ℹ️ Error obteniendo tráfico:', e);
                }
              }
            }
            return null;
          };

          // Buscar en paralelo
          [registroLogistica, registroTrafico] = await Promise.all([
            buscarLogistica(),
            buscarTrafico()
          ]);

          // Obtener RFC desde logística o tráfico
          if (registroLogistica) {
            const rfcLog =
              registroLogistica.rfcCliente ||
              registroLogistica.RFC ||
              registroLogistica.rfc ||
              registroLogistica['RFC Cliente'] ||
              registroLogistica['RFC Cliente Logistica'];
            if (rfcLog && rfcFinal === 'N/A') {
              rfcFinal = rfcLog;
            }

            const refLog =
              registroLogistica.referenciaCliente ||
              registroLogistica.ReferenciaCliente ||
              registroLogistica['referencia cliente'] ||
              registroLogistica['Referencia Cliente'] ||
              registroLogistica.referenciaClienteLogistica ||
              registroLogistica['referenciaClienteLogistica'];
            if (refLog && referenciaFinal === 'N/A') {
              referenciaFinal = refLog;
            }
          }

          if (registroTrafico) {
            const rfcTra =
              registroTrafico.rfcCliente ||
              registroTrafico.RFC ||
              registroTrafico.rfc ||
              registroTrafico['RFC Cliente'];
            if (rfcTra && rfcFinal === 'N/A') {
              rfcFinal = rfcTra;
            }

            if (referenciaFinal === 'N/A') {
              const refTra =
                registroTrafico.referenciaCliente ||
                registroTrafico.ReferenciaCliente ||
                registroTrafico['referencia cliente'] ||
                registroTrafico['Referencia Cliente'];
              if (refTra) {
                referenciaFinal = refTra;
              }
            }
          }

          // Buscar nombre del cliente usando RFC (sin esperas largas)
          if (rfcFinal && rfcFinal !== 'N/A') {
            // Esperar solo 2 segundos máximo
            let intentosConfig = 0;
            while (
              (!window.configuracionManager ||
                typeof window.configuracionManager.getCliente !== 'function') &&
              intentosConfig < 8
            ) {
              intentosConfig++;
              await new Promise(resolve => setTimeout(resolve, 250));
            }

            let clienteEncontrado = null;

            if (
              window.configuracionManager &&
              typeof window.configuracionManager.getCliente === 'function'
            ) {
              clienteEncontrado = window.configuracionManager.getCliente(rfcFinal);
            }

            // Fallback rápido a Firebase
            if (!clienteEncontrado && window.firebaseDb && window.fs) {
              try {
                const clientesRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
                const clientesDoc = await window.fs.getDoc(clientesRef);
                if (clientesDoc.exists()) {
                  const clientesData = clientesDoc.data();
                  if (clientesData.clientes) {
                    if (
                      typeof clientesData.clientes === 'object' &&
                      !Array.isArray(clientesData.clientes)
                    ) {
                      clienteEncontrado =
                        clientesData.clientes[rfcFinal] ||
                        Object.values(clientesData.clientes).find(
                          c => (c.rfc || c.RFC || '').toUpperCase() === rfcFinal.toUpperCase()
                        );
                    } else if (Array.isArray(clientesData.clientes)) {
                      clienteEncontrado = clientesData.clientes.find(
                        c => (c.rfc || c.RFC || '').toUpperCase() === rfcFinal.toUpperCase()
                      );
                    }
                  }
                }
              } catch (e) {
                console.debug('ℹ️ Error buscando cliente en Firebase:', e);
              }
            }

            if (clienteEncontrado) {
              const nombreReal =
                clienteEncontrado.nombre ||
                clienteEncontrado.Nombre ||
                clienteEncontrado.nombreCliente ||
                clienteEncontrado.razonSocial;
              if (nombreReal) {
                nombreFinal = nombreReal;
              }
              if (referenciaFinal === 'N/A' && clienteEncontrado.referenciaCliente) {
                referenciaFinal =
                  clienteEncontrado.referenciaCliente || clienteEncontrado.ReferenciaCliente;
              }
            }
          }

          // Actualizar los campos en el modal (usar selectores más específicos)
          // Buscar la tarjeta de "Información del Cliente" específicamente
          const cardCliente = Array.from(
            document.querySelectorAll('#modalVerDetallesFacturacionBody .card-header')
          ).find(header => header.textContent.includes('Información del Cliente'));

          if (cardCliente) {
            const cardBody = cardCliente.nextElementSibling;
            if (cardBody && cardBody.classList.contains('card-body')) {
              // Buscar los elementos específicos por su contenido (orden específico para evitar coincidencias)
              const parrafos = cardBody.querySelectorAll('p');

              parrafos.forEach(p => {
                const texto = p.textContent || '';
                const innerHTML = p.innerHTML || '';

                // Verificar "Referencia Cliente:" primero (más específico)
                if (
                  texto.trim().startsWith('Referencia Cliente:') ||
                  innerHTML.includes('Referencia Cliente:')
                ) {
                  p.innerHTML = `<strong>Referencia Cliente:</strong><br>${referenciaFinal}`;
                } else if (
                  // Luego verificar "RFC:" (más específico que "Cliente:")
                  texto.trim().startsWith('RFC:') ||
                  innerHTML.includes('<strong>RFC:</strong>')
                ) {
                  p.innerHTML = `<strong>RFC:</strong><br>${rfcFinal}`;
                } else if (
                  // Finalmente verificar "Cliente:" (debe ser exacto, no "Referencia Cliente:")
                  (texto.trim().startsWith('Cliente:') && !texto.includes('Referencia')) ||
                  (innerHTML.includes('<strong>Cliente:</strong>') &&
                    !innerHTML.includes('Referencia'))
                ) {
                  p.innerHTML = `<strong>Cliente:</strong><br>${nombreFinal}`;
                }
              });
            }
          }
        } catch (e) {
          console.warn('⚠️ Error actualizando datos del cliente:', e);
        }
      };

      // Iniciar actualización asíncrona (no bloquea la visualización)
      actualizarDatosCliente();

      // Construir HTML del modal
      const modalBody = document.getElementById('modalVerDetallesFacturacionBody');
      const modalTitle = document.getElementById('modalVerDetallesFacturacionLabel');

      if (!modalBody || !modalTitle) {
        alert('❌ Error: No se pudo abrir el modal de detalles');
        return;
      }

      modalTitle.innerHTML = `<i class="fas fa-eye"></i> Detalles del Registro ${regId}`;

      let contenidoHTML = `
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="card border-primary">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0"><i class="fas fa-calendar"></i> Información General</h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-2"><strong>Fecha de Creación:</strong><br>${fecha}</p>
                                <p class="mb-2"><strong>Serie:</strong><br>${registro.serie || 'N/A'}</p>
                                <p class="mb-2"><strong>Folio:</strong><br>${registro.folio || 'N/A'}</p>
                                <p class="mb-0"><strong>Folio Fiscal:</strong><br>${folioFiscal}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card border-info">
                            <div class="card-header bg-info text-white">
                                <h6 class="mb-0"><i class="fas fa-building"></i> Información del Cliente</h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-2"><strong>Cliente:</strong><br>${clienteNombre}</p>
                                <p class="mb-2"><strong>RFC:</strong><br>${rfcCliente}</p>
                                <p class="mb-0"><strong>Referencia Cliente:</strong><br>${referenciaCliente}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-dark">
                                <h6 class="mb-0"><i class="fas fa-money-bill-wave"></i> Información Monetaria</h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-2"><strong>Tipo de Moneda:</strong><br><span class="badge bg-info">${registro.tipoMoneda || registro.moneda || 'MXN'}</span></p>
                                <p class="mb-2"><strong>Tipo de Cambio:</strong><br>${tipoCambio}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="fas fa-calculator"></i> Desglose de Montos</h6>
                            </div>
                            <div class="card-body">
                                <table class="table table-sm table-bordered mb-0">
                                    <tbody>
                                        <tr>
                                            <td><strong>Subtotal:</strong></td>
                                            <td class="text-end">$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>IVA:</strong></td>
                                            <td class="text-end">$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>IVA Retenido:</strong></td>
                                            <td class="text-end">$${ivaRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>ISR Retenido:</strong></td>
                                            <td class="text-end">$${isrRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Otros Montos:</strong></td>
                                            <td class="text-end">$${otrosMontos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr class="table-primary">
                                            <td><strong>Total Factura:</strong></td>
                                            <td class="text-end"><strong>$${totalFactura.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Agregar observaciones si existen
      if (
        registro.observaciones ||
        registro.descripcionFacturacion ||
        registro.descripcionObservaciones
      ) {
        const observaciones =
          registro.observaciones ||
          registro.descripcionFacturacion ||
          registro.descripcionObservaciones;
        contenidoHTML += `
                    <div class="row">
                        <div class="col-12">
                            <div class="card border-secondary">
                                <div class="card-header bg-secondary text-white">
                                    <h6 class="mb-0"><i class="fas fa-sticky-note"></i> Observaciones</h6>
                                </div>
                                <div class="card-body">
                                    <p class="mb-0">${observaciones}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      }

      modalBody.innerHTML = contenidoHTML;

      // Mostrar el modal usando Bootstrap
      const modalElement = document.getElementById('modalVerDetallesFacturacion');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      } else {
        alert('❌ Error: No se pudo abrir el modal de detalles');
      }
    } catch (error) {
      console.error('❌ Error al ver registro de Facturación:', error);
      alert('❌ Error al cargar los detalles del registro');
    }
  };

  /**
   * Renderizar solo los registros de la página actual
   */
  window.renderizarRegistrosFacturacion = async function () {
    if (
      !window._paginacionFacturacionManager ||
      !window._rowsDataFacturacionCompletos ||
      !window._registrosFacturacionCompletos
    ) {
      console.warn('⚠️ Datos no disponibles para renderizar, recargando...');
      if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
        await window.cargarRegistrosFacturacionConFiltro();
      } else {
        await window.cargarRegistrosFacturacion();
      }
      return;
    }

    const tbody = document.querySelector('#tablaRegistrosFacturacion tbody');
    if (!tbody) {
      console.error('❌ No se encontró el tbody de la tabla');
      return;
    }

    // Obtener registros de la página actual
    let registrosPagina = window._registrosFacturacionCompletos;
    let rowsDataPagina = window._rowsDataFacturacionCompletos;

    if (
      window._paginacionFacturacionManager &&
      typeof window._paginacionFacturacionManager.obtenerRegistrosPagina === 'function'
    ) {
      try {
        registrosPagina = window._paginacionFacturacionManager.obtenerRegistrosPagina();
        // Filtrar rowsData para mostrar solo los de la página actual
        rowsDataPagina = window._rowsDataFacturacionCompletos.filter(rowData =>
          registrosPagina.includes(rowData.regId)
        );
      } catch (error) {
        console.warn('⚠️ Error obteniendo registros de la página:', error);
        rowsDataPagina = window._rowsDataFacturacionCompletos; // Mostrar todos si hay error
      }
    }

    // Limpiar tabla completamente antes de agregar nuevas filas
    tbody.innerHTML = '';

    // Crear las filas de la tabla
    rowsDataPagina.forEach((rowData, _index) => {
      const row = document.createElement('tr');

      // Asegurar que todos los valores estén definidos
      const numeroRegistro = rowData.numeroRegistro || 'N/A';
      const clienteNombre = rowData.clienteNombre || 'N/A';
      const rfcCliente = rowData.rfcCliente || 'N/A';
      const referenciaCliente = rowData.referenciaCliente || 'N/A';
      const serie = rowData.serie || 'N/A';
      const folio = rowData.folio || 'N/A';
      const fecha = rowData.fecha || 'N/A';
      const moneda = rowData.moneda || 'MXN';
      const tipoCambio = rowData.tipoCambio || '0';
      const subtotal = parseFloat(rowData.subtotal || 0);
      const iva = parseFloat(rowData.iva || 0);
      const ivaRetenido = parseFloat(rowData.ivaRetenido || 0);
      const isrRetenido = parseFloat(rowData.isrRetenido || 0);
      const otrosMontos = parseFloat(rowData.otrosMontos || 0);
      const total = parseFloat(rowData.total || 0);
      const hayObservaciones = rowData.hayObservaciones || 'No';

      row.innerHTML = `
                <td><strong>${numeroRegistro}</strong></td>
                <td>${clienteNombre}</td>
                <td>${rfcCliente}</td>
                <td>${referenciaCliente}</td>
                <td>${serie}</td>
                <td>${folio}</td>
                <td>${fecha}</td>
                <td><span class="badge bg-info">${moneda}</span></td>
                <td>${tipoCambio}</td>
                <td><strong>$${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><strong>$${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><strong>$${ivaRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><strong>$${isrRetenido.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><strong>$${otrosMontos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><strong>$${total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><span class="badge ${hayObservaciones === 'Sí' ? 'bg-success' : 'bg-secondary'}">${hayObservaciones}</span></td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroFacturacion('${rowData.regId}')" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroFacturacion('${rowData.regId}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFFacturacion('${rowData.regId}')" title="Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarRegistroFacturacion('${rowData.regId}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
      tbody.appendChild(row);
    });

    // Actualizar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionFacturacion');
    if (
      contenedorPaginacion &&
      window._paginacionFacturacionManager &&
      typeof window._paginacionFacturacionManager.generarControlesPaginacion === 'function'
    ) {
      try {
        contenedorPaginacion.innerHTML =
          window._paginacionFacturacionManager.generarControlesPaginacion(
            'paginacionFacturacion',
            'cambiarPaginaFacturacion'
          );
      } catch (error) {
        console.warn('⚠️ Error generando controles de paginación:', error);
      }
    }

    console.log(
      `✅ Renderizados ${rowsDataPagina.length} registros de la página ${window._paginacionFacturacionManager?.paginaActual || 1}`
    );
  };

  /**
   * Cambiar de página en la tabla de registros
   */
  window.cambiarPaginaFacturacion = async function (accion) {
    if (!window._paginacionFacturacionManager) {
      return;
    }

    let cambioExitoso = false;

    if (accion === 'anterior') {
      cambioExitoso = window._paginacionFacturacionManager.paginaAnterior();
    } else if (accion === 'siguiente') {
      cambioExitoso = window._paginacionFacturacionManager.paginaSiguiente();
    } else if (typeof accion === 'number') {
      cambioExitoso = window._paginacionFacturacionManager.irAPagina(accion);
    }

    if (cambioExitoso) {
      await window.renderizarRegistrosFacturacion();
      // Scroll suave hacia la tabla
      const tabla = document.getElementById('tablaRegistrosFacturacion');
      if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  /**
   * Formatear fecha de creación sin problemas de zona horaria
   */
  window.formatearFechaCreacionFacturacion = function (fechaStr, incluirHora = false) {
    if (!fechaStr) {
      return 'N/A';
    }

    // Si es string en formato YYYY-MM-DD, parsearlo directamente
    if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
      const [year, month, day] = fechaStr.split('T')[0].split('-');
      const fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      if (incluirHora) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return fecha.toLocaleDateString('es-ES');
    }

    // Si es string en formato DD/MM/YYYY, parsearlo correctamente
    if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
      const partes = fechaStr.split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const año = parseInt(partes[2], 10);
        const fecha = new Date(año, mes, dia);
        if (incluirHora) {
          return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return fecha.toLocaleDateString('es-ES');
      }
    }

    // Fallback: intentar parsear como fecha ISO
    try {
      const fecha = new Date(fechaStr);
      if (!isNaN(fecha.getTime())) {
        if (incluirHora) {
          return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        return fecha.toLocaleDateString('es-ES');
      }
    } catch (e) {
      console.warn('⚠️ Error parseando fecha:', e);
    }

    return 'N/A';
  };

  console.log('✅ Módulo registros-view.js cargado');
})();
