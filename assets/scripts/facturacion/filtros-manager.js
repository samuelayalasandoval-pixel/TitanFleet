/**
 * Gestión de Filtros - facturacion.html
 * Sistema de filtrado para registros de facturación
 */

(function () {
  'use strict';

  /**
   * Aplicar filtros de facturación
   */
  window.aplicarFiltrosFacturacion = async function () {
    console.log('🔍 Aplicando filtros de facturación...');
    await window.cargarRegistrosFacturacionConFiltro();
  };

  /**
   * Limpiar filtros de facturación
   */
  window.limpiarFiltrosFacturacion = async function () {
    console.log('🧹 Limpiando filtros de facturación...');
    const filtros = [
      'filtroNumeroRegistroFacturacion',
      'filtroClienteFacturacion',
      'filtroSerieFacturacion',
      'filtroFolioFacturacion',
      'filtroFechaInicioFacturacion',
      'filtroFechaFinFacturacion'
    ];

    filtros.forEach(filtroId => {
      const elemento = document.getElementById(filtroId);
      if (elemento) {
        elemento.value = '';
      }
    });

    await window.cargarRegistrosFacturacionConFiltro();
  };

  /**
   * Helper para limpiar formato de moneda
   */
  function limpiarMoneda(valor) {
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
  }

  /**
   * Cargar registros de Facturación con filtros aplicados
   * Esta función es similar a cargarRegistrosFacturacion pero aplica filtros antes de renderizar
   */
  window.cargarRegistrosFacturacionConFiltro = async function () {
    try {
      console.log('🔄 Iniciando carga de registros de Facturación con filtros...');

      // PRIORIDAD: Cargar desde Firebase primero
      const facturacion = {};
      let registros = [];

      if (window.firebaseRepos?.facturacion) {
        try {
          console.log('📊 Cargando registros desde Firebase...');
          const repo = window.firebaseRepos.facturacion;

          // Esperar a que el repositorio esté listo
          if (window.__firebaseReposReady) {
            await window.__firebaseReposReady;
          }

          // Usar consulta optimizada
          const allRegistros = await repo.getAllRegistros({
            limit: 100,
            useCache: true
          });
          console.log('✅ Registros obtenidos desde Firebase:', allRegistros.length);

          // Convertir a formato de objeto para compatibilidad
          allRegistros.forEach(registro => {
            const regId = registro.numeroRegistro || registro.id || registro.registroId;
            if (regId) {
              facturacion[regId] = registro;
              registros.push(regId);
            }
          });

          console.log('📋 Registros procesados desde Firebase:', registros.length);
        } catch (error) {
          console.warn('⚠️ Error cargando desde Firebase, usando localStorage:', error);
        }
      }

      // RESPALDO: Cargar desde localStorage si Firebase está vacío o falló
      const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
      const hayConexion = navigator.onLine;
      const firebaseVacio = registros.length === 0;

      // Si no hay registros de Firebase, intentar cargar desde localStorage
      if (registros.length === 0 && datosLimpios !== 'true') {
        console.log(
          '📊 Firebase vacío o sin permisos. Cargando registros desde localStorage (respaldo)...'
        );

        // Buscar en múltiples ubicaciones de localStorage
        // 1. erp_facturacion (donde se guarda cuando Firebase falla)
        try {
          const erpFacturacion = JSON.parse(localStorage.getItem('erp_facturacion') || '{}');
          if (Object.keys(erpFacturacion).length > 0) {
            console.log(
              '✅ Registros encontrados en erp_facturacion:',
              Object.keys(erpFacturacion).length
            );
            Object.keys(erpFacturacion).forEach(regId => {
              if (!facturacion[regId]) {
                facturacion[regId] = erpFacturacion[regId];
                registros.push(regId);
              }
            });
          }
        } catch (e) {
          console.warn('⚠️ Error leyendo erp_facturacion:', e);
        }

        // 2. erp_shared_data.facturas o erp_shared_data.facturacion
        if (registros.length === 0) {
          try {
            const data = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
            const facturasData = data.facturas || data.facturacion || {};
            if (Object.keys(facturasData).length > 0) {
              console.log(
                '✅ Registros encontrados en erp_shared_data:',
                Object.keys(facturasData).length
              );
              Object.keys(facturasData).forEach(regId => {
                if (!facturacion[regId]) {
                  facturacion[regId] = facturasData[regId];
                  registros.push(regId);
                }
              });
            }
          } catch (e) {
            console.warn('⚠️ Error leyendo erp_shared_data:', e);
          }
        }

        if (registros.length === 0 && hayConexion && firebaseVacio) {
          console.log(
            '⚠️ Firebase está vacío y hay conexión. No se cargará desde localStorage para evitar restauración de datos eliminados.'
          );
        }
      }

      console.log('📋 Registros encontrados:', registros.length);

      // Obtener valores de filtros
      const filtroNumeroRegistro =
        document.getElementById('filtroNumeroRegistroFacturacion')?.value?.trim().toLowerCase() ||
        '';
      const filtroCliente =
        document.getElementById('filtroClienteFacturacion')?.value?.trim().toLowerCase() || '';
      const filtroSerie =
        document.getElementById('filtroSerieFacturacion')?.value?.trim().toLowerCase() || '';
      const filtroFolio =
        document.getElementById('filtroFolioFacturacion')?.value?.trim().toLowerCase() || '';
      const filtroFechaInicio =
        document.getElementById('filtroFechaInicioFacturacion')?.value || '';
      const filtroFechaFin = document.getElementById('filtroFechaFinFacturacion')?.value || '';

      // Aplicar filtros si hay alguno activo
      if (
        filtroNumeroRegistro ||
        filtroCliente ||
        filtroSerie ||
        filtroFolio ||
        filtroFechaInicio ||
        filtroFechaFin
      ) {
        // Primero filtrar campos síncronos
        registros = registros.filter(regId => {
          const registro = facturacion[regId];

          // Filtro por N° Registro
          if (filtroNumeroRegistro) {
            const regIdStr = String(regId).toLowerCase();
            if (!regIdStr.includes(filtroNumeroRegistro)) {
              return false;
            }
          }

          // Filtro por Serie
          if (filtroSerie) {
            const serie = (registro.serie || '').toLowerCase();
            if (!serie.includes(filtroSerie)) {
              return false;
            }
          }

          // Filtro por Folio
          if (filtroFolio) {
            const folio = (registro.folio || '').toLowerCase();
            if (!folio.includes(filtroFolio)) {
              return false;
            }
          }

          // Filtro por Fecha Inicio
          if (filtroFechaInicio) {
            const fechaCreacion =
              registro.fechaCreacion || registro.fechaFactura || registro.fecha || '';
            if (fechaCreacion) {
              let fechaFormateada = '';
              try {
                if (typeof fechaCreacion === 'string' && fechaCreacion.includes('T')) {
                  fechaFormateada = fechaCreacion.split('T')[0];
                } else if (
                  typeof fechaCreacion === 'string' &&
                  /^\d{4}-\d{2}-\d{2}/.test(fechaCreacion)
                ) {
                  fechaFormateada = fechaCreacion.substring(0, 10);
                } else {
                  const fecha = new Date(fechaCreacion);
                  if (!isNaN(fecha.getTime())) {
                    const año = fecha.getFullYear();
                    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                    const dia = String(fecha.getDate()).padStart(2, '0');
                    fechaFormateada = `${año}-${mes}-${dia}`;
                  }
                }
              } catch (e) {
                fechaFormateada = '';
              }
              if (fechaFormateada < filtroFechaInicio) {
                return false;
              }
            } else {
              return false;
            }
          }

          // Filtro por Fecha Fin
          if (filtroFechaFin) {
            const fechaCreacion =
              registro.fechaCreacion || registro.fechaFactura || registro.fecha || '';
            if (fechaCreacion) {
              let fechaFormateada = '';
              try {
                if (typeof fechaCreacion === 'string' && fechaCreacion.includes('T')) {
                  fechaFormateada = fechaCreacion.split('T')[0];
                } else if (
                  typeof fechaCreacion === 'string' &&
                  /^\d{4}-\d{2}-\d{2}/.test(fechaCreacion)
                ) {
                  fechaFormateada = fechaCreacion.substring(0, 10);
                } else {
                  const fecha = new Date(fechaCreacion);
                  if (!isNaN(fecha.getTime())) {
                    const año = fecha.getFullYear();
                    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                    const dia = String(fecha.getDate()).padStart(2, '0');
                    fechaFormateada = `${año}-${mes}-${dia}`;
                  }
                }
              } catch (e) {
                fechaFormateada = '';
              }
              if (fechaFormateada > filtroFechaFin) {
                return false;
              }
            } else {
              return false;
            }
          }

          return true;
        });

        // Filtro por Cliente (requiere async, aplicar después)
        if (filtroCliente) {
          const registrosFiltrados = [];
          for (const regId of registros) {
            const registro = facturacion[regId];

            // Obtener nombre del cliente
            let nombreCliente = '';
            const rfcCliente =
              registro.rfcCliente || registro.RFC || registro.rfc || registro.cliente || '';

            if (rfcCliente) {
              try {
                // Intentar obtener desde configuracionManager
                if (
                  window.configuracionManager &&
                  typeof window.configuracionManager.getCliente === 'function'
                ) {
                  const clienteData = window.configuracionManager.getCliente(rfcCliente);
                  if (clienteData) {
                    nombreCliente =
                      clienteData.nombre ||
                      clienteData.nombreCliente ||
                      clienteData.razonSocial ||
                      '';
                  }
                }

                // Si no se encontró, buscar en localStorage
                if (!nombreCliente) {
                  const clientesData = localStorage.getItem('erp_clientes');
                  if (clientesData) {
                    const clientes = JSON.parse(clientesData);
                    let clienteData = null;

                    if (Array.isArray(clientes)) {
                      clienteData = clientes.find(c => (c.rfc || c.RFC) === rfcCliente);
                    } else {
                      clienteData = clientes[rfcCliente];
                    }

                    if (clienteData) {
                      nombreCliente =
                        clienteData.nombre ||
                        clienteData.nombreCliente ||
                        clienteData.razonSocial ||
                        '';
                    }
                  }
                }
              } catch (e) {
                console.warn('⚠️ Error obteniendo nombre del cliente:', e);
              }
            }

            // Si aún no se encontró nombre, usar el valor del campo Cliente del registro
            if (!nombreCliente) {
              nombreCliente = registro.cliente || registro.Cliente || '';
            }

            if (nombreCliente.toLowerCase().includes(filtroCliente)) {
              registrosFiltrados.push(regId);
            }
          }
          registros = registrosFiltrados;
        }
      }

      // Ordenar registros por número de registro en orden descendente
      registros.sort((a, b) => {
        const numA = parseInt(a, 10) || 0;
        const numB = parseInt(b, 10) || 0;
        return numB - numA;
      });

      console.log('📋 Registros después de filtros:', registros.length);

      const tbody = document.querySelector('#tablaRegistrosFacturacion tbody');
      const mensajeSinRegistros = document.getElementById('mensajeSinRegistrosFacturacion');

      if (!tbody || !mensajeSinRegistros) {
        console.error('❌ Elementos de la tabla no encontrados');
        return;
      }

      if (registros.length === 0) {
        console.log('📋 No hay registros después de aplicar filtros');
        tbody.innerHTML = '';
        mensajeSinRegistros.classList.add('show');
        return;
      }

      console.log(`📋 Procesando ${registros.length} registros después de filtros...`);
      mensajeSinRegistros.classList.remove('show');
      tbody.innerHTML = '';

      // Procesar registros de forma asíncrona (reutilizar lógica de cargarRegistrosFacturacion)
      // Llamar a la función de carga normal pero con los registros ya filtrados
      // Para simplificar, reutilizamos la lógica de procesamiento de registros-loader.js
      // pero aplicamos los filtros primero

      // Usar la función de renderizado de registros-loader.js si está disponible
      // o procesar directamente aquí
      const rowsPromises = registros.map(async regId => {
        const registro = facturacion[regId];

        // Obtener datos de logística y tráfico (mismo código que en registros-loader.js)
        let registroLogistica = null;
        let registroTrafico = null;

        if (window.obtenerRegistroLogistica) {
          try {
            registroLogistica = await window.obtenerRegistroLogistica(regId);
          } catch (e) {
            console.warn('⚠️ Error en obtenerRegistroLogistica:', e);
          }
        }

        if (!registroLogistica && window.firebaseRepos?.logistica) {
          try {
            registroLogistica =
              (await window.firebaseRepos.logistica.get(regId)) ||
              (await window.firebaseRepos.logistica.getRegistro(regId));
          } catch (e) {
            console.warn('⚠️ Error buscando logística en Firebase:', e);
          }
        }

        if (!registroLogistica) {
          try {
            const raw = localStorage.getItem('erp_shared_data');
            if (raw) {
              const parsed = JSON.parse(raw);
              registroLogistica = parsed.registros?.[regId] || parsed.logistica?.[regId];
            }
          } catch (e) {
            console.warn('⚠️ Error obteniendo datos de logística:', e);
          }
        }

        if (window.obtenerRegistroTrafico) {
          registroTrafico = await window.obtenerRegistroTrafico(regId);
        } else {
          try {
            const raw = localStorage.getItem('erp_shared_data');
            if (raw) {
              const parsed = JSON.parse(raw);
              registroTrafico = parsed.trafico?.[regId];
            }
          } catch (e) {
            console.warn('⚠️ Error obteniendo datos de tráfico:', e);
          }
        }

        // Obtener información del cliente
        const rfcCliente =
          registroLogistica?.rfcCliente ||
          registroLogistica?.RFC ||
          registroLogistica?.rfc ||
          registro?.rfcCliente ||
          registro?.RFC ||
          registro?.cliente ||
          '';
        let clienteNombre = 'N/A';

        if (rfcCliente) {
          try {
            if (
              window.configuracionManager &&
              typeof window.configuracionManager.getCliente === 'function'
            ) {
              const clienteData = window.configuracionManager.getCliente(rfcCliente);
              if (clienteData && clienteData.nombre) {
                clienteNombre = clienteData.nombre;
              }
            } else {
              const clientesData = localStorage.getItem('erp_clientes');
              if (clientesData) {
                const clientes = JSON.parse(clientesData);
                let clienteData = null;

                if (Array.isArray(clientes)) {
                  clienteData = clientes.find(c => c.rfc === rfcCliente);
                } else {
                  clienteData = clientes[rfcCliente];
                }

                if (clienteData && clienteData.nombre) {
                  clienteNombre = clienteData.nombre;
                } else if (clienteData && clienteData.nombreCliente) {
                  clienteNombre = clienteData.nombreCliente;
                } else if (clienteData && clienteData.razonSocial) {
                  clienteNombre = clienteData.razonSocial;
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Error obteniendo nombre del cliente:', error);
          }
        }

        if (clienteNombre === 'N/A' && registro.cliente) {
          clienteNombre = registro.cliente;
        }

        const referenciaCliente =
          registroLogistica?.referenciaCliente ||
          registroLogistica?.ReferenciaCliente ||
          registroLogistica?.['referencia cliente'] ||
          'N/A';

        const estanciaOrigen =
          registroLogistica?.origen ||
          registroTrafico?.origen ||
          registroTrafico?.LugarOrigen ||
          'N/A';
        const estanciaDestino =
          registroLogistica?.destino ||
          registroTrafico?.destino ||
          registroTrafico?.LugarDestino ||
          'N/A';

        let estanciaPrincipal = 'N/A';
        let estanciaNorte = 'N/A';

        if (estanciaOrigen && estanciaOrigen !== 'N/A') {
          if (estanciaOrigen.toLowerCase().includes('principal')) {
            estanciaPrincipal = estanciaOrigen;
            estanciaNorte = estanciaDestino !== 'N/A' ? estanciaDestino : 'N/A';
          } else if (estanciaOrigen.toLowerCase().includes('norte')) {
            estanciaNorte = estanciaOrigen;
            estanciaPrincipal = estanciaDestino !== 'N/A' ? estanciaDestino : 'N/A';
          } else {
            estanciaPrincipal = estanciaOrigen;
            estanciaNorte = estanciaDestino !== 'N/A' ? estanciaDestino : 'N/A';
          }
        }

        const fecha =
          registro.fechaFactura ||
          registro.fecha ||
          (registro.fechaCreacion
            ? window.formatearFechaCreacionFacturacion
              ? window.formatearFechaCreacionFacturacion(registro.fechaCreacion, false)
              : new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
            : 'N/A');

        const subtotal = limpiarMoneda(
          registro.Subtotal || registro.subtotal || registro.montoSubtotal || 0
        );
        const iva = limpiarMoneda(registro.iva || registro.IVA || registro.montoIva || 0);
        const ivaRetenido = limpiarMoneda(
          registro['iva retenido'] || registro.ivaRetenido || registro['IVA Retenido'] || 0
        );
        const isrRetenido = limpiarMoneda(
          registro['isr retenido'] || registro.isrRetenido || registro['ISR Retenido'] || 0
        );
        const otrosMontos = limpiarMoneda(
          registro['Otros Montos'] ||
            registro.otrosMontos ||
            registro['Otros Montos a Favor o Contra'] ||
            0
        );
        let total = limpiarMoneda(
          registro['total factura'] ||
            registro.totalFactura ||
            registro.montoTotal ||
            registro.total ||
            registro.monto ||
            0
        );

        if (total === 0 && (subtotal > 0 || iva > 0)) {
          total = subtotal + iva - ivaRetenido - isrRetenido + otrosMontos;
        }

        const serie = registro.serie || '';
        const folio = registro.folio || '';
        const moneda = registro.moneda || registro.tipoMoneda || 'MXN';
        const tipoCambio = registro.tipoCambio || (moneda === 'MXN' ? '0' : 'N/A');
        const observaciones =
          registro.descripcionFacturacion ||
          registro.observaciones ||
          registro.descripcionObservaciones ||
          '';
        const hayObservaciones = observaciones && observaciones.trim() !== '' ? 'Sí' : 'No';

        return {
          regId,
          numeroRegistro: regId,
          clienteNombre,
          rfcCliente: rfcCliente || 'N/A',
          referenciaCliente,
          estanciaPrincipal,
          estanciaNorte,
          serie,
          folio,
          fecha,
          moneda,
          tipoCambio,
          subtotal,
          iva,
          ivaRetenido,
          isrRetenido,
          otrosMontos,
          total,
          hayObservaciones
        };
      });

      const rowsData = await Promise.all(rowsPromises);

      // Almacenar datos globalmente para la paginación
      window._registrosFacturacionCompletos = registros;
      window._rowsDataFacturacionCompletos = rowsData;

      // Inicializar paginación (reutilizar lógica de registros-loader.js)
      const obtenerPaginacionManager = () => {
        if (typeof PaginacionManager !== 'undefined') {
          return PaginacionManager;
        }
        if (typeof window.PaginacionManager !== 'undefined') {
          return window.PaginacionManager;
        }
        return null;
      };

      let PaginacionManagerClass = obtenerPaginacionManager();
      let intentos = 0;
      const maxIntentos = 5;

      while (!PaginacionManagerClass && intentos < maxIntentos) {
        await new Promise(resolve => setTimeout(resolve, 100));
        PaginacionManagerClass = obtenerPaginacionManager();
        intentos++;
      }

      let paginacionDisponible = false;

      if (PaginacionManagerClass) {
        if (!window._paginacionFacturacionManager) {
          try {
            window._paginacionFacturacionManager = new PaginacionManagerClass();
          } catch (error) {
            console.error('❌ Error creando instancia de PaginacionManager:', error);
          }
        }

        if (
          window._paginacionFacturacionManager &&
          typeof window._paginacionFacturacionManager.inicializar === 'function'
        ) {
          try {
            window._paginacionFacturacionManager.inicializar(registros, 15);
            window._paginacionFacturacionManager.paginaActual = 1;
            paginacionDisponible = true;
          } catch (error) {
            console.warn('⚠️ Error inicializando paginación:', error);
          }
        }
      }

      // Obtener registros de la página actual
      let registrosPagina = registros;
      let rowsDataPagina = rowsData;

      if (
        paginacionDisponible &&
        window._paginacionFacturacionManager &&
        typeof window._paginacionFacturacionManager.obtenerRegistrosPagina === 'function'
      ) {
        try {
          registrosPagina = window._paginacionFacturacionManager.obtenerRegistrosPagina();
          rowsDataPagina = rowsData.filter(rowData => registrosPagina.includes(rowData.regId));
        } catch (error) {
          console.warn('⚠️ Error obteniendo registros de la página:', error);
          rowsDataPagina = rowsData;
        }
      }

      // Renderizar tabla (reutilizar lógica de registros-loader.js)
      tbody.innerHTML = '';

      rowsDataPagina.forEach(rowData => {
        const row = document.createElement('tr');

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

      // Mostrar controles de paginación
      const contenedorPaginacion = document.getElementById('paginacionFacturacion');
      if (contenedorPaginacion) {
        if (
          paginacionDisponible &&
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
            contenedorPaginacion.innerHTML = '';
          }
        } else {
          contenedorPaginacion.innerHTML = '';
        }
      }

      if (paginacionDisponible && window._paginacionFacturacionManager) {
        try {
          const totalPaginas =
            typeof window._paginacionFacturacionManager.obtenerTotalPaginas === 'function'
              ? window._paginacionFacturacionManager.obtenerTotalPaginas()
              : 1;
          console.log(
            `✅ ${window._paginacionFacturacionManager.totalRegistros} registros de Facturación cargados con filtros (página ${window._paginacionFacturacionManager.paginaActual} de ${totalPaginas})`
          );
        } catch (error) {
          console.log(`✅ ${rowsData.length} registros de Facturación cargados con filtros`);
        }
      } else {
        console.log(
          `✅ ${rowsData.length} registros de Facturación cargados con filtros (sin paginación)`
        );
      }
    } catch (error) {
      console.error('❌ Error cargando registros de Facturación con filtros:', error);
      const tbody = document.querySelector('#tablaRegistrosFacturacion tbody');
      if (tbody) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="17" class="text-center text-danger">
                            <i class="fas fa-exclamation-triangle"></i> Error al cargar los registros: ${error.message}
                        </td>
                    </tr>
                `;
      }
    }
  };

  console.log('✅ Módulo filtros-manager.js cargado');
})();
