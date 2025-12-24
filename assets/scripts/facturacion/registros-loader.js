/**
 * Carga y Renderizado de Registros - facturacion.html
 * Maneja la carga de registros desde Firebase/localStorage y su renderizado paginado
 */

(function () {
  'use strict';

  // Variable global para almacenar todos los registros sin filtrar
  window._registrosFacturacionCompletos = [];
  window._rowsDataFacturacionCompletos = [];

  /**
   * Función helper para limpiar formato de moneda
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
   * Función para obtener un registro de facturación (reutilizable)
   */
  window.obtenerRegistroFacturacion = async function (regId) {
    let registro = null;

    // PRIORIDAD 1: Buscar en Firebase
    try {
      if (window.firebaseRepos?.facturacion) {
        registro = await window.firebaseRepos.facturacion.get(regId);
        if (registro) {
          // console.log('✅ Registro encontrado en Firebase');
          return registro;
        }
      }
    } catch (error) {
      console.debug('ℹ️ Error cargando desde Firebase (continuando con localStorage):', error);
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
    if (!registro) {
      console.warn('⚠️ Registro de facturación no encontrado en Firebase');
      console.warn(
        '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
      );
      return null;
    }

    return registro;
  };

  /**
   * Carga y muestra registros de Facturación
   * Versión completa con múltiples fallbacks y mejor manejo de datos
   */
  window.cargarRegistrosFacturacion = async function () {
    try {
      // console.log('🔄 Iniciando carga de registros de Facturación...');

      // PRIORIDAD: Cargar desde Firebase primero
      const facturacion = {};
      const registros = [];

      if (window.firebaseRepos?.facturacion) {
        try {
          // console.log('📊 Cargando registros desde Firebase...');
          const repo = window.firebaseRepos.facturacion;

          // Esperar a que el repositorio esté listo
          if (window.__firebaseReposReady) {
            await window.__firebaseReposReady;
          }

          // Usar consulta optimizada con límite
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

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
      if (registros.length === 0) {
        console.log('ℹ️ No se encontraron registros en Firebase');
        console.log(
          'ℹ️ Firebase es la única fuente de datos. Si esperabas ver registros, verifica que existan en Firebase.'
        );
      }

      // console.log('📋 Registros encontrados:', registros);
      // console.log('📋 Datos de facturación:', facturacion);

      // Ordenar registros por número de registro en orden descendente (más recientes primero)
      registros.sort((a, b) => {
        const numA = parseInt(a, 10) || 0;
        const numB = parseInt(b, 10) || 0;
        return numB - numA; // Orden descendente
      });

      // console.log('📋 Registros ordenados (descendente):', registros);

      const tbody = document.querySelector('#tablaRegistrosFacturacion tbody');
      const mensajeSinRegistros = document.getElementById('mensajeSinRegistrosFacturacion');

      if (!tbody) {
        console.error('❌ No se encontró el tbody de la tabla');
        return;
      }

      if (!mensajeSinRegistros) {
        console.error('❌ No se encontró el mensaje de sin registros');
        return;
      }

      if (registros.length === 0) {
        // console.log('📋 No hay registros, mostrando mensaje');
        tbody.innerHTML = '';
        mensajeSinRegistros.classList.add('show');
        return;
      }

      console.log(`📋 Procesando ${registros.length} registros...`);
      mensajeSinRegistros.classList.remove('show');
      tbody.innerHTML = '';

      // Procesar registros de forma asíncrona para obtener datos de logística y tráfico
      const rowsPromises = registros.map(async (regId, index) => {
        console.log(`📋 Procesando registro ${index + 1}/${registros.length}: ${regId}`);
        const registro = facturacion[regId];
        console.log(`📋 Datos del registro ${regId}:`, registro);

        // Obtener datos de logística y tráfico para este registro
        let registroLogistica = null;
        let registroTrafico = null;

        // Intentar obtener desde logística - múltiples fuentes
        // 1. Intentar función global
        if (window.obtenerRegistroLogistica) {
          try {
            registroLogistica = await window.obtenerRegistroLogistica(regId);
          } catch (e) {
            console.warn('⚠️ Error en obtenerRegistroLogistica:', e);
          }
        }

        // 2. Si no se encontró, buscar en Firebase directamente
        if (!registroLogistica && window.firebaseRepos?.logistica) {
          try {
            registroLogistica =
              (await window.firebaseRepos.logistica.get(regId)) ||
              (await window.firebaseRepos.logistica.getRegistro(regId));
            if (registroLogistica) {
              console.log(`✅ Registro logística ${regId} encontrado en Firebase`);
            }
          } catch (e) {
            console.warn('⚠️ Error buscando logística en Firebase:', e);
          }
        }

        // NO USAR localStorage - Solo Firebase es la fuente de verdad
        // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores

        // NO USAR localStorage - Solo Firebase es la fuente de verdad
        // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
        // Los registros de logística y tráfico solo se obtienen desde Firebase
        console.log(`📋 Registro logística para ${regId}:`, registroLogistica);

        // Intentar obtener desde tráfico (solo Firebase)
        if (window.obtenerRegistroTrafico) {
          registroTrafico = await window.obtenerRegistroTrafico(regId);
        } else {
          console.warn(
            '⚠️ obtenerRegistroTrafico no disponible. Firebase es la única fuente de datos.'
          );
        }

        // Obtener información del cliente desde logística (prioridad) o facturación - buscar en múltiples campos
        const rfcCliente =
          registroLogistica?.rfcCliente ||
          registroLogistica?.RFC ||
          registroLogistica?.rfc ||
          registroLogistica?.rfcClienteLogistica ||
          registro?.rfcCliente ||
          registro?.RFC ||
          registro?.cliente ||
          '';
        let clienteNombre = 'N/A';
        const rfcMostrar = rfcCliente;

        console.log(`📋 RFC Cliente para ${regId}:`, rfcCliente);

        if (rfcCliente) {
          // Intentar obtener nombre del cliente
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
              // Fallback: buscar directamente en Firebase
              if (window.firebaseDb && window.fs) {
                try {
                  const clientesRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
                  const clientesDoc = await window.fs.getDoc(clientesRef);
                  if (clientesDoc.exists()) {
                    const clientesData = clientesDoc.data();
                    let clienteData = null;

                    if (clientesData.clientes) {
                      if (
                        typeof clientesData.clientes === 'object' &&
                        !Array.isArray(clientesData.clientes)
                      ) {
                        clienteData =
                          clientesData.clientes[rfcCliente] ||
                          Object.values(clientesData.clientes).find(
                            c => (c.rfc || c.RFC || '').toUpperCase() === rfcCliente.toUpperCase()
                          );
                      } else if (Array.isArray(clientesData.clientes)) {
                        clienteData = clientesData.clientes.find(
                          c => (c.rfc || c.RFC || '').toUpperCase() === rfcCliente.toUpperCase()
                        );
                      }
                    }

                    if (clienteData) {
                      clienteNombre =
                        clienteData.nombre ||
                        clienteData.nombreCliente ||
                        clienteData.razonSocial ||
                        clienteNombre;
                    }
                  }
                } catch (error) {
                  console.warn('⚠️ Error obteniendo nombre del cliente desde Firebase:', error);
                }
              }
            }
          } catch (error) {
            console.warn('⚠️ Error obteniendo nombre del cliente:', error);
          }
        }

        // Si no se encontró nombre, usar el valor de cliente de facturación
        if (clienteNombre === 'N/A' && registro.cliente) {
          clienteNombre = registro.cliente;
        }

        // Obtener Referencia Cliente desde logística - buscar en múltiples campos
        const referenciaCliente =
          registroLogistica?.referenciaCliente ||
          registroLogistica?.ReferenciaCliente ||
          registroLogistica?.['referencia cliente'] ||
          registroLogistica?.['Referencia Cliente'] ||
          registroLogistica?.referenciaClienteLogistica ||
          'N/A';

        console.log(`📋 Referencia Cliente para ${regId}:`, referenciaCliente);

        // Obtener estancias (origen y destino) desde logística o tráfico
        // Mapear a "Estancia Principal" y "Estancia Norte"
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

        // Determinar cuál es "Estancia Principal" y cuál es "Estancia Norte"
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
            // Por defecto, origen es Principal y destino es Norte
            estanciaPrincipal = estanciaOrigen;
            estanciaNorte = estanciaDestino !== 'N/A' ? estanciaDestino : 'N/A';
          }
        }

        // Datos de facturación
        const fecha =
          registro.fechaFactura ||
          registro.fecha ||
          (registro.fechaCreacion
            ? window.formatearFechaCreacionFacturacion
              ? window.formatearFechaCreacionFacturacion(registro.fechaCreacion, false)
              : new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
            : 'N/A');

        // Obtener Subtotal
        const subtotal = limpiarMoneda(
          registro.Subtotal || registro.subtotal || registro.montoSubtotal || 0
        );

        // Obtener IVA
        const iva = limpiarMoneda(registro.iva || registro.IVA || registro.montoIva || 0);

        // Obtener IVA Retenido
        const ivaRetenido = limpiarMoneda(
          registro['iva retenido'] || registro.ivaRetenido || registro['IVA Retenido'] || 0
        );

        // Obtener ISR Retenido
        const isrRetenido = limpiarMoneda(
          registro['isr retenido'] || registro.isrRetenido || registro['ISR Retenido'] || 0
        );

        // Obtener Otros Montos
        const otrosMontos = limpiarMoneda(
          registro['Otros Montos'] ||
            registro.otrosMontos ||
            registro['Otros Montos a Favor o Contra'] ||
            0
        );

        // Buscar el total en múltiples campos posibles y convertir a número
        let total = limpiarMoneda(
          registro['total factura'] ||
            registro.totalFactura ||
            registro.montoTotal ||
            registro.total ||
            registro.monto ||
            0
        );

        // Si el total es 0 pero tenemos subtotal e IVA, calcularlo
        if (total === 0 && (subtotal > 0 || iva > 0)) {
          total = subtotal + iva - ivaRetenido - isrRetenido + otrosMontos;
        }

        // Separar Serie y Folio
        const serie = registro.serie || '';
        const folio = registro.folio || '';

        const moneda = registro.moneda || registro.tipoMoneda || 'MXN';
        const tipoCambio = registro.tipoCambio || (moneda === 'MXN' ? '0' : 'N/A');

        // Obtener observaciones
        const observaciones =
          registro.descripcionFacturacion ||
          registro.observaciones ||
          registro.descripcionObservaciones ||
          '';
        const hayObservaciones = observaciones && observaciones.trim() !== '' ? 'Sí' : 'No';
        const detalleObservaciones =
          observaciones && observaciones.trim() !== '' ? observaciones.trim() : '';

        return {
          regId,
          numeroRegistro: regId,
          clienteNombre,
          rfcCliente: rfcMostrar,
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
          hayObservaciones,
          detalleObservaciones
        };
      });

      // Esperar a que se resuelvan todas las promesas
      const rowsData = await Promise.all(rowsPromises);

      console.log('📊 Datos procesados para la tabla:', rowsData.length, 'registros');
      console.log('📊 Ejemplo de datos:', rowsData[0]);

      // Almacenar datos globalmente para la paginación
      window._registrosFacturacionCompletos = registros;
      window._rowsDataFacturacionCompletos = rowsData;

      // Función auxiliar para obtener PaginacionManager con reintentos
      const obtenerPaginacionManager = () => {
        if (typeof PaginacionManager !== 'undefined') {
          return PaginacionManager;
        }
        if (typeof window.PaginacionManager !== 'undefined') {
          return window.PaginacionManager;
        }
        return null;
      };

      // Intentar obtener PaginacionManager con un pequeño retraso si no está disponible
      let PaginacionManagerClass = obtenerPaginacionManager();
      let intentos = 0;
      const maxIntentos = 5;

      while (!PaginacionManagerClass && intentos < maxIntentos) {
        console.log(`⏳ Esperando PaginacionManager... intento ${intentos + 1}/${maxIntentos}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        PaginacionManagerClass = obtenerPaginacionManager();
        intentos++;
      }

      console.log('🔍 Verificando PaginacionManager:', {
        'typeof PaginacionManager': typeof PaginacionManager,
        'typeof window.PaginacionManager': typeof window.PaginacionManager,
        PaginacionManagerClass: PaginacionManagerClass ? 'disponible' : 'no disponible',
        intentos: intentos
      });

      let paginacionDisponible = false;

      if (!PaginacionManagerClass) {
        console.warn(
          '⚠️ PaginacionManager no está disponible después de esperar, mostrando todos los registros sin paginación'
        );
      } else {
        // Crear o reutilizar instancia de paginación
        // Usar _paginacionFacturacionManager para evitar conflicto con el elemento HTML id="paginacionFacturacion"
        if (!window._paginacionFacturacionManager) {
          try {
            window._paginacionFacturacionManager = new PaginacionManagerClass();
            console.log('✅ Nueva instancia de PaginacionManager creada para facturacion');
            console.log('🔍 Instancia creada:', {
              'tiene inicializar': typeof window._paginacionFacturacionManager.inicializar,
              'métodos disponibles': Object.getOwnPropertyNames(
                Object.getPrototypeOf(window._paginacionFacturacionManager)
              )
            });
          } catch (error) {
            console.error('❌ Error creando instancia de PaginacionManager:', error);
          }
        } else {
          console.log('✅ Reutilizando instancia existente de _paginacionFacturacionManager');
        }

        // Inicializar paginación con los registros
        if (window._paginacionFacturacionManager) {
          console.log('🔍 Verificando métodos de la instancia:', {
            inicializar: typeof window._paginacionFacturacionManager.inicializar,
            obtenerRegistrosPagina:
              typeof window._paginacionFacturacionManager.obtenerRegistrosPagina
          });

          if (typeof window._paginacionFacturacionManager.inicializar === 'function') {
            try {
              window._paginacionFacturacionManager.inicializar(registros, 15);
              window._paginacionFacturacionManager.paginaActual = 1;
              paginacionDisponible = true;
              console.log(
                `✅ Paginación inicializada: ${window._paginacionFacturacionManager.totalRegistros} registros, ${window._paginacionFacturacionManager.obtenerTotalPaginas()} páginas`
              );
            } catch (error) {
              console.warn('⚠️ Error inicializando paginación:', error);
              paginacionDisponible = false;
            }
          } else {
            console.warn('⚠️ PaginacionManager no tiene método inicializar');
          }
        } else {
          console.warn('⚠️ window._paginacionFacturacionManager no está definido');
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
          // Filtrar rowsData para mostrar solo los de la página actual
          rowsDataPagina = rowsData.filter(rowData => registrosPagina.includes(rowData.regId));
        } catch (error) {
          console.warn('⚠️ Error obteniendo registros de la página:', error);
          rowsDataPagina = rowsData; // Mostrar todos si hay error
        }
      } else {
        // Sin paginación, mostrar todos
        rowsDataPagina = rowsData;
      }

      // Limpiar tabla completamente antes de agregar nuevas filas
      tbody.innerHTML = '';

      // Crear las filas de la tabla
      rowsDataPagina.forEach((rowData, index) => {
        console.log(`📋 Creando fila ${index + 1}:`, rowData);
        const row = document.createElement('tr');

        // Asegurar que todos los valores estén definidos
        const numeroRegistro = rowData.numeroRegistro || 'N/A';
        const clienteNombre = rowData.clienteNombre || 'N/A';
        const rfcCliente = rowData.rfcCliente || 'N/A';
        const referenciaCliente = rowData.referenciaCliente || 'N/A';
        const _estanciaPrincipal = rowData.estanciaPrincipal || 'N/A';
        const _estanciaNorte = rowData.estanciaNorte || 'N/A';
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

      console.log('✅ Tabla actualizada con', rowsData.length, 'filas');

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

      // Log de resultados
      if (paginacionDisponible && window._paginacionFacturacionManager) {
        try {
          const totalPaginas =
            typeof window._paginacionFacturacionManager.obtenerTotalPaginas === 'function'
              ? window._paginacionFacturacionManager.obtenerTotalPaginas()
              : 1;
          console.log(
            `✅ ${window._paginacionFacturacionManager.totalRegistros} registros de Facturación cargados (página ${window._paginacionFacturacionManager.paginaActual} de ${totalPaginas})`
          );
        } catch (error) {
          console.log(`✅ ${rowsData.length} registros de Facturación cargados`);
        }
      } else {
        console.log(`✅ ${rowsData.length} registros de Facturación cargados (sin paginación)`);
      }
      console.log('📊 Estructura de columnas esperada:', [
        'N° Registro',
        'Cliente',
        'RFC',
        'Referencia Cliente',
        'Serie',
        'Folio',
        'Fecha Factura',
        'Moneda',
        'Tipo de Cambio',
        'Subtotal',
        'IVA',
        'IVA Retenido',
        'ISR Retenido',
        'Otros Montos',
        'Total',
        'Hay Observaciones',
        'Acciones'
      ]);
    } catch (error) {
      console.error('❌ Error cargando registros de Facturación:', error);
      const tbody = document.querySelector('#tablaRegistrosFacturacion tbody');
      if (tbody) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="14" class="text-center text-danger">
                            <i class="fas fa-exclamation-triangle"></i> Error al cargar los registros: ${error.message}
                        </td>
                    </tr>
                `;
      }
    }
  };

  console.log('✅ Módulo registros-loader.js cargado');
})();
