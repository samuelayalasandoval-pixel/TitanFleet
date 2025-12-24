/**
 * Acciones de Registros - trafico.html
 * Funciones para ver, editar, eliminar y generar PDF de registros de tráfico
 *
 * @module trafico/registros-actions
 * @requires obtenerClienteNombre
 * @requires obtenerOperadorNombre
 */

(function () {
  'use strict';

  /**
   * Formatea una fecha de manera segura para mostrar en detalles
   * @param {string|Date} fechaStr - Fecha en formato string o Date
   * @returns {string} Fecha formateada en DD/MM/AAAA
   */
  function formatearFechaDetalle(fechaStr) {
    let fecha;

    // Si no hay fecha o es inválida, usar fecha de hoy
    if (!fechaStr) {
      fecha = new Date();
    } else {
      try {
        if (typeof fechaStr === 'string') {
          // Si incluye 'T', es formato ISO
          if (fechaStr.includes('T')) {
            fecha = new Date(fechaStr);
          } else if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            // Formato YYYY-MM-DD
            const [year, month, day] = fechaStr.split('T')[0].split('-');
            fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
          } else {
            fecha = new Date(fechaStr);
          }
        } else if (fechaStr instanceof Date) {
          fecha = fechaStr;
        } else {
          fecha = new Date(fechaStr);
        }

        // Validar que la fecha sea válida
        if (isNaN(fecha.getTime())) {
          fecha = new Date(); // Usar fecha de hoy si es inválida
        }
      } catch (error) {
        console.warn('⚠️ Error formateando fecha:', fechaStr, error);
        fecha = new Date(); // Usar fecha de hoy si hay error
      }
    }

    // Formatear en DD/MM/AAAA
    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const year = fecha.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /**
   * Obtiene un registro de tráfico desde Firebase o localStorage
   * @param {string} regId - ID del registro
   * @returns {Promise<Object|null>} Registro encontrado o null
   */
  window.obtenerRegistroTrafico = async function (regId) {
    if (!regId) {
      console.warn('⚠️ obtenerRegistroTrafico: regId no proporcionado');
      return null;
    }

    let registro = null;

    // 1. PRIORIDAD ABSOLUTA: Intentar cargar desde Firebase usando firebaseRepos (SIN CACHÉ)
    try {
      if (window.firebaseRepos?.trafico) {
        // Intentar obtener sin caché primero
        if (typeof window.firebaseRepos.trafico.get === 'function') {
          registro = await window.firebaseRepos.trafico.get(regId);
        }
        // Si no funciona, intentar getRegistro
        if (!registro && typeof window.firebaseRepos.trafico.getRegistro === 'function') {
          registro = await window.firebaseRepos.trafico.getRegistro(regId);
        }
        if (registro) {
          console.log(
            `✅ Registro ${regId} encontrado en Firebase (firebaseRepos) - FUENTE PRINCIPAL`
          );
          console.log('📋 Datos del registro desde Firebase:', {
            destino: registro.destino || registro.LugarDestino,
            origen: registro.origen || registro.LugarOrigen,
            cliente: registro.cliente,
            numeroRegistro: registro.numeroRegistro
          });
          // Retornar inmediatamente para evitar usar datos de localStorage
          return registro;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando desde Firebase (firebaseRepos):', error);
    }

    // 2. Intentar cargar directamente desde Firebase si firebaseRepos no está disponible
    if (!registro && window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
      try {
        const { doc, getDoc } = window.fs;
        const db = window.firebaseDb;
        const docRef = doc(db, 'trafico', regId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          registro = {
            id: docSnap.id,
            ...docSnap.data(),
            numeroRegistro: docSnap.data().numeroRegistro || docSnap.id
          };
          console.log(`✅ Registro ${regId} encontrado en Firebase (directo) - FUENTE PRINCIPAL`);
          console.log('📋 Datos del registro desde Firebase (directo):', {
            destino: registro.destino || registro.LugarDestino,
            origen: registro.origen || registro.LugarOrigen,
            cliente: registro.cliente,
            numeroRegistro: registro.numeroRegistro
          });
          // Retornar inmediatamente para evitar usar datos de localStorage
          return registro;
        }
      } catch (error) {
        console.warn('⚠️ Error cargando directamente desde Firebase:', error);
      }
    }

    // 3. NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Si no se encontró en Firebase, retornar null
    if (!registro) {
      console.error(`❌ Registro ${regId} no encontrado en Firebase`);
      console.error(
        '❌ Firebase es la única fuente de datos. Asegúrate de que Firebase esté disponible y el registro exista.'
      );
    }

    return registro;
  };

  /**
   * Muestra los detalles de un registro de tráfico en un modal
   * @param {string} regId - ID del registro a mostrar
   */
  window.verRegistroTrafico = async function (regId) {
    if (!regId) {
      alert('❌ ID de registro no proporcionado');
      return;
    }

    console.log(`👁️ Viendo registro de Tráfico: ${regId}`);

    // Mostrar el modal
    const modalElement = document.getElementById('modalVerRegistroTrafico');
    if (!modalElement) {
      alert('❌ Modal no encontrado');
      return;
    }

    let modal;
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      modal = new bootstrap.Modal(modalElement);
    } else {
      console.error('❌ Bootstrap Modal no está disponible');
      // Fallback: mostrar modal manualmente
      modalElement.style.display = 'block';
      modalElement.classList.add('show');
      modalElement.setAttribute('aria-modal', 'true');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
      console.warn('⚠️ Modal mostrado manualmente (Bootstrap no disponible)');
      return; // Salir temprano si no hay Bootstrap
    }

    const modalBody = document.getElementById('modalVerRegistroTraficoBody');
    if (!modalBody) {
      console.error('❌ Modal body no encontrado');
      return;
    }

    // Mostrar spinner mientras carga
    modalBody.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando detalles del registro...</p>
            </div>
        `;

    modal.show();

    try {
      // Obtener registro
      const registro = await window.obtenerRegistroTrafico(regId);

      if (!registro) {
        modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i> <strong>Error:</strong> Registro no encontrado
                    </div>
                `;
        return;
      }

      // Obtener registro de logística para complementar datos
      let registroLogistica = null;
      try {
        if (typeof window.obtenerRegistroLogistica === 'function') {
          registroLogistica = await window.obtenerRegistroLogistica(regId);
        } else {
          // NO USAR localStorage - Solo Firebase es la fuente de verdad
          // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
          console.warn(
            '⚠️ obtenerRegistroLogistica no disponible y Firebase es la única fuente de datos'
          );
        }
      } catch (e) {
        console.warn('⚠️ Error obteniendo registro de logística:', e);
      }

      // Complementar datos del registro de tráfico con datos de logística si faltan
      if (registroLogistica) {
        if (!registro.alto && registroLogistica.alto) {
          registro.alto = registroLogistica.alto;
        }
        if (!registro.largo && registroLogistica.largo) {
          registro.largo = registroLogistica.largo;
        }
        if (!registro.ancho && registroLogistica.ancho) {
          registro.ancho = registroLogistica.ancho;
        }
        if (!registro.peso && registroLogistica.peso) {
          registro.peso = registroLogistica.peso;
        }
        if (!registro.mercancia && registroLogistica.mercancia) {
          registro.mercancia = registroLogistica.mercancia;
        }
        if (!registro.plataforma && registroLogistica.plataforma) {
          registro.plataforma = registroLogistica.plataforma;
        }
        if (!registro.tipoMercancia && registroLogistica.tipoMercancia) {
          registro.tipoMercancia = registroLogistica.tipoMercancia;
        }
      }

      // Obtener RFC del cliente
      let rfcCliente = '';
      if (registroLogistica) {
        rfcCliente =
          registroLogistica.rfcCliente || registroLogistica.RFC || registroLogistica.rfc || '';
      }
      if (!rfcCliente) {
        rfcCliente = registro.rfcCliente || registro.RFC || registro.rfc || '';
      }

      // Obtener nombre del cliente
      const nombreCliente =
        rfcCliente && typeof window.obtenerClienteNombre === 'function'
          ? await window.obtenerClienteNombre(rfcCliente)
          : registro.cliente || 'N/A';

      // Obtener gastos asociados al registro
      let gastosRegistro = [];

      // 1. Buscar gastos en el registro directamente
      if (registro.gastosOperadores && Array.isArray(registro.gastosOperadores)) {
        gastosRegistro = registro.gastosOperadores;
        console.log('✅ Gastos encontrados en el registro:', gastosRegistro.length);
      }

      // 2. Buscar gastos en Firebase desde el sistema de operadores (PRIORIDAD)
      if (gastosRegistro.length === 0 && window.firebaseRepos?.operadores) {
        try {
          console.log('🔍 Buscando gastos en Firebase para registro:', regId);
          const todosGastos = await window.firebaseRepos.operadores.getAll();
          console.log('📊 Total gastos obtenidos de Firebase:', todosGastos.length);

          gastosRegistro = todosGastos.filter(g => {
            const coincideRegistro =
              g.numeroRegistro === regId || g.numeroRegistro === String(regId);
            const esDeTrafico = g.origen === 'trafico';
            return coincideRegistro && esDeTrafico;
          });

          console.log('✅ Gastos encontrados en Firebase:', gastosRegistro.length);
        } catch (e) {
          console.warn('⚠️ Error obteniendo gastos desde Firebase:', e);
        }
      }

      // 3. NO USAR localStorage - Solo Firebase es la fuente de verdad para gastos
      // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
      if (gastosRegistro.length === 0) {
        console.warn('⚠️ No se encontraron gastos en Firebase para este registro');
        console.warn(
          '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
        );
      }

      console.log('📋 Total gastos para mostrar en modal:', gastosRegistro.length);

      // Obtener nombres de operadores
      const valorOperador =
        registro.operadorprincipal ||
        registro.operadorPrincipal ||
        registro.OperadorPrincipal ||
        '';
      const nombreOperador =
        typeof window.obtenerOperadorNombre === 'function'
          ? await window.obtenerOperadorNombre(valorOperador)
          : valorOperador || 'N/A';

      const valorOperadorSec =
        registro.operadorsecundario ||
        registro.operadorSecundario ||
        registro.OperadorSecundario ||
        '';
      const nombreOperadorSec =
        valorOperadorSec && typeof window.obtenerOperadorNombre === 'function'
          ? await window.obtenerOperadorNombre(valorOperadorSec)
          : 'N/A';

      // Formatear fecha - Prioridad: fechaEnvio > fecha > fechaCreacion
      const fechaFormateada = formatearFechaDetalle(
        registro.fechaEnvio ||
          registroLogistica?.fechaEnvio ||
          registro.fecha ||
          registroLogistica?.fecha ||
          registro.fechaCreacion ||
          registro.fechaCreacion
      );

      // Obtener número económico/tractocamión
      const numeroEconomico =
        registro.economico ||
        registro.numeroEconomico ||
        registro.tractocamion ||
        registro.numeroTractocamion ||
        'N/A';

      // Estado de la plataforma
      const estadoPlataforma = registro.estadoPlataforma || registro.estado || 'N/A';
      const estadoBadge =
        estadoPlataforma === 'cargado'
          ? 'success'
          : estadoPlataforma === 'descargado'
            ? 'info'
            : 'secondary';

      // Construir el HTML del modal
      modalBody.innerHTML = `
                <div class="row g-3">
                    <div class="col-12">
                        <div class="card border-primary">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0"><i class="fas fa-hashtag"></i> Información del Registro</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-barcode"></i> Número de Registro:</strong>
                                        <p class="mb-0">${regId}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-calendar"></i> Fecha de Envío:</strong>
                                        <p class="mb-0">${fechaFormateada}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-tag"></i> Estado:</strong>
                                        <p class="mb-0"><span class="badge bg-${estadoBadge}">${estadoPlataforma}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12">
                        <div class="card border-info">
                            <div class="card-header bg-info text-white">
                                <h6 class="mb-0"><i class="fas fa-building"></i> Información del Cliente</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-12">
                                        <strong><i class="fas fa-user-tie"></i> Cliente:</strong>
                                        <p class="mb-0">${nombreCliente}</p>
                                    </div>
                                    ${
  rfcCliente
    ? `
                                    <div class="col-md-12">
                                        <strong><i class="fas fa-id-card"></i> RFC:</strong>
                                        <p class="mb-0">${rfcCliente}</p>
                                    </div>
                                    `
    : ''
  }
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="fas fa-route"></i> Información de Ruta</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-map-marker-alt"></i> Origen:</strong>
                                        <p class="mb-0">${registro.origen || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-map-marker-alt"></i> Destino:</strong>
                                        <p class="mb-0">${registro.destino || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-building"></i> Estancia de Origen:</strong>
                                        <p class="mb-0">${registro.LugarOrigen || registro.lugarOrigen || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-building"></i> Estancia de Destino:</strong>
                                        <p class="mb-0">${registro.LugarDestino || registro.lugarDestino || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-dark">
                                <h6 class="mb-0" style="color: white !important;"><i class="fas fa-users"></i> Información de Operadores</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-user"></i> Operador Principal:</strong>
                                        <p class="mb-0">${nombreOperador}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-user-friends"></i> Operador Secundario:</strong>
                                        <p class="mb-0">${nombreOperadorSec}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12">
                        <div class="card border-secondary">
                            <div class="card-header bg-secondary text-white">
                                <h6 class="mb-0"><i class="fas fa-truck"></i> Información del Vehículo</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-truck-pickup"></i> Número Económico/Tractocamión:</strong>
                                        <p class="mb-0">${numeroEconomico}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-id-badge"></i> Placas Tractor:</strong>
                                        <p class="mb-0">${registro.Placas || registro.placas || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-id-badge"></i> Placas Plataforma:</strong>
                                        <p class="mb-0">${registro.placasPlataforma || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-12">
                        <div class="card border-danger">
                            <div class="card-header bg-danger text-white">
                                <h6 class="mb-0"><i class="fas fa-box"></i> Información de Carga</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-tag"></i> Tipo de Servicio:</strong>
                                        <p class="mb-0">${registro.plataformaServicio || registro.tipoServicio || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-boxes"></i> Tipo de Mercancía:</strong>
                                        <p class="mb-0">${registro.mercancia || registro.tipoMercancia || registroLogistica?.mercancia || registroLogistica?.tipoMercancia || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-weight"></i> Peso:</strong>
                                        <p class="mb-0">${registro.peso || 'N/A'} ${registro.peso ? 'kg' : ''}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-ruler-horizontal"></i> Largo:</strong>
                                        <p class="mb-0">${registro.largo || 'N/A'} ${registro.largo ? 'm' : ''}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-ruler-vertical"></i> Ancho:</strong>
                                        <p class="mb-0">${registro.ancho || 'N/A'} ${registro.ancho ? 'm' : ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${
  gastosRegistro.length > 0
    ? `
                    <div class="col-12">
                        <div class="card border-dark">
                            <div class="card-header bg-dark text-white">
                                <h6 class="mb-0"><i class="fas fa-dollar-sign"></i> Gastos de Operadores</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Operador</th>
                                                <th>Motivo</th>
                                                <th>Monto</th>
                                                <th>Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${gastosRegistro
    .map(gasto => {
      const fechaGasto =
                                                  gasto.fecha || gasto.fechaCreacion || 'N/A';
      let fechaFormateada = 'N/A';
      if (fechaGasto !== 'N/A') {
        try {
          if (
            typeof fechaGasto === 'string' &&
                                                      /^\d{4}-\d{2}-\d{2}/.test(fechaGasto)
          ) {
            const fechaStr = fechaGasto.split('T')[0];
            const [year, month, day] =
                                                        fechaStr.split('-');
            const fecha = new Date(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10)
            );
            fechaFormateada =
                                                        fecha.toLocaleDateString('es-ES');
          } else {
            fechaFormateada = new Date(
              fechaGasto
            ).toLocaleDateString('es-ES');
          }
        } catch (e) {
          console.warn(
            '⚠️ Error formateando fecha de gasto:',
            fechaGasto,
            e
          );
          fechaFormateada = String(fechaGasto);
        }
      }
      return `
                                                    <tr>
                                                        <td>${gasto.operadorNombre || gasto.operador || 'N/A'}</td>
                                                        <td>${gasto.tipoGasto || gasto.motivo || 'N/A'}</td>
                                                        <td>$${parseFloat(gasto.monto || 0).toFixed(2)}</td>
                                                        <td>${fechaFormateada}</td>
                                                    </tr>
                                                `;
    })
    .join('')}
                                        </tbody>
                                        <tfoot>
                                            <tr class="table-info">
                                                <th colspan="2">Total:</th>
                                                <th>$${gastosRegistro.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0).toFixed(2)}</th>
                                                <th></th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    `
    : ''
  }
                    
                    ${
  estadoPlataforma === 'descargado'
    ? `
                    <div class="col-12">
                        <div class="card border-warning">
                            <div class="card-header bg-warning text-dark">
                                <h6 class="mb-0" style="color: white !important;"><i class="fas fa-download"></i> Información de Descarga</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-truck"></i> Tractocamión (Descarga):</strong>
                                        <p class="mb-0">${registro.tractocamionDescarga || registro.economicoDescarga || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-user"></i> Operador Principal (Descarga):</strong>
                                        <p class="mb-0">${registro.operadorPrincipalDescarga || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-user-friends"></i> Operador Secundario (Descarga):</strong>
                                        <p class="mb-0">${registro.operadorSecundarioDescarga || 'N/A'}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <strong><i class="fas fa-calendar-alt"></i> Fecha de Descarga:</strong>
                                        <p class="mb-0">${registro.fechaDescarga ? formatearFechaDetalle(registro.fechaDescarga) : 'N/A'}</p>
                                    </div>
                                    <div class="col-md-12">
                                        <strong><i class="fas fa-sticky-note"></i> Notas de Descarga:</strong>
                                        <p class="mb-0">${registro.notasDescarga || registro.observacionesDescarga || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `
    : ''
  }
                </div>
            `;
    } catch (error) {
      console.error('❌ Error mostrando registro:', error);
      modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> <strong>Error:</strong> ${error.message || 'Error desconocido al cargar el registro'}
                </div>
            `;
    }
  };

  /**
   * Elimina un registro de tráfico con confirmación
   * @param {string} regId - ID del registro a eliminar
   */
  window.eliminarRegistroTrafico = async function (regId) {
    if (!regId) {
      alert('❌ ID de registro no proporcionado');
      return;
    }

    console.log(`🗑️ Eliminando registro de Tráfico: ${regId}`);

    // Confirmar eliminación
    const confirmacion = confirm(
      `¿Estás seguro de que deseas eliminar el registro ${regId}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) {
      console.log('❌ Eliminación cancelada por el usuario');
      return;
    }

    try {
      let eliminado = false;

      // 1. Eliminar de Firebase
      if (window.firebaseRepos?.trafico) {
        try {
          await window.firebaseRepos.trafico.delete(regId);
          console.log(`✅ Registro ${regId} eliminado de Firebase`);
          eliminado = true;
        } catch (error) {
          console.warn('⚠️ Error eliminando de Firebase:', error);
        }
      }

      // 2. Eliminar de localStorage (erp_shared_data.trafico)
      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminado eliminación de localStorage para evitar inconsistencias entre navegadores
      // El registro solo existe en Firebase ahora

      if (eliminado) {
        alert(`✅ Registro ${regId} eliminado exitosamente`);
        // Recargar la tabla
        if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
          await window.cargarRegistrosTraficoConFiltro();
        } else if (typeof window.cargarRegistrosTrafico === 'function') {
          await window.cargarRegistrosTrafico();
        }
      } else {
        alert('⚠️ No se pudo encontrar el registro para eliminar');
      }
    } catch (error) {
      console.error('❌ Error eliminando registro:', error);
      alert(`Error al eliminar el registro: ${error.message}`);
    }
  };

  /**
   * Genera y descarga un PDF del registro de tráfico
   * @param {string} regId - ID del registro
   */
  window.descargarPDFTrafico = async function (regId) {
    if (!regId) {
      alert('❌ ID de registro no proporcionado');
      return;
    }

    console.log(`📄 Descargando PDF del registro de Tráfico: ${regId}`);

    try {
      const registro = await window.obtenerRegistroTrafico(regId);

      if (!registro) {
        alert('❌ Registro no encontrado');
        return;
      }

      // Obtener datos de logística para el mismo registro
      let registroLogistica = null;
      if (typeof window.obtenerRegistroLogistica === 'function') {
        registroLogistica = await window.obtenerRegistroLogistica(regId);
      } else {
        // NO USAR localStorage - Solo Firebase es la fuente de verdad
        // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
        console.warn(
          '⚠️ obtenerRegistroLogistica no disponible y Firebase es la única fuente de datos'
        );
      }

      // Complementar datos del registro de tráfico con datos de logística si faltan
      if (registroLogistica) {
        if (!registro.mercancia && registroLogistica.mercancia) {
          registro.mercancia = registroLogistica.mercancia;
        }
        if (!registro.tipoMercancia && registroLogistica.tipoMercancia) {
          registro.tipoMercancia = registroLogistica.tipoMercancia;
        }
        if (!registro.plataforma && registroLogistica.plataforma) {
          registro.plataforma = registroLogistica.plataforma;
        }
      }

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
      const col1X = margin + 5; // Columna izquierda
      const col2X = pageWidth / 2 + 10; // Columna derecha

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTRO DE TRÁFICO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Número de registro
      doc.setFontSize(14);
      doc.text(`Número de Registro: ${regId}`, margin, yPosition);
      yPosition += 10;

      // Fecha de Envío (prioridad: fechaEnvio > fecha > fechaCreacion)
      const fechaFormateada = formatearFechaDetalle(
        registro.fechaEnvio ||
          registroLogistica?.fechaEnvio ||
          registro.fecha ||
          registroLogistica?.fecha ||
          registro.fechaCreacion ||
          registroLogistica?.fechaCreacion
      );
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de Envío: ${fechaFormateada}`, margin, yPosition);
      yPosition += 15;

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Información del Cliente
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DEL CLIENTE', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Obtener información del cliente
      const rfcCliente =
        registroLogistica?.rfcCliente ||
        registroLogistica?.RFC ||
        registroLogistica?.rfc ||
        registro?.rfcCliente ||
        registro?.cliente ||
        '';
      const nombreCliente =
        rfcCliente && typeof window.obtenerClienteNombre === 'function'
          ? await window.obtenerClienteNombre(rfcCliente)
          : registroLogistica?.cliente || registro?.cliente || 'N/A';

      // Columna izquierda
      doc.text(`Cliente: ${nombreCliente}`, col1X, yPosition);
      yPosition += 6;
      if (rfcCliente && rfcCliente !== nombreCliente) {
        doc.text(`RFC: ${rfcCliente}`, col1X, yPosition);
        yPosition += 6;
      }
      if (registroLogistica?.referenciaCliente || registroLogistica?.ReferenciaCliente) {
        doc.text(
          `Referencia: ${registroLogistica.referenciaCliente || registroLogistica.ReferenciaCliente}`,
          col1X,
          yPosition
        );
        yPosition += 6;
      }

      // Columna derecha - información adicional de logística
      let yPositionDerecha =
        yPosition -
        (rfcCliente && rfcCliente !== nombreCliente ? 12 : 6) -
        (registroLogistica?.referenciaCliente ? 6 : 0);
      if (registroLogistica?.origen) {
        doc.text(`Origen: ${registroLogistica.origen}`, col2X, yPositionDerecha);
        yPositionDerecha += 6;
      }
      if (registroLogistica?.destino) {
        doc.text(`Destino: ${registroLogistica.destino}`, col2X, yPositionDerecha);
        yPositionDerecha += 6;
      }
      if (registroLogistica?.tipoServicio) {
        doc.text(`Tipo Servicio: ${registroLogistica.tipoServicio}`, col2X, yPositionDerecha);
        yPositionDerecha += 6;
      }

      // Ajustar yPosition al máximo de ambas columnas
      yPosition = Math.max(yPosition, yPositionDerecha) + 5;

      // Información de Ruta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE RUTA', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Columna Izquierda
      let yPosRuta = yPosition;
      doc.text(`Origen: ${registro.origen || 'N/A'}`, col1X, yPosRuta);
      yPosRuta += 6;
      doc.text(
        `Estancia de Origen: ${registro.LugarOrigen || registro.lugarOrigen || 'N/A'}`,
        col1X,
        yPosRuta
      );
      yPosRuta += 6;

      // Columna Derecha
      let yPosRutaDerecha = yPosition;
      doc.text(`Destino: ${registro.destino || 'N/A'}`, col2X, yPosRutaDerecha);
      yPosRutaDerecha += 6;
      doc.text(
        `Estancia de Destino: ${registro.LugarDestino || registro.lugarDestino || 'N/A'}`,
        col2X,
        yPosRutaDerecha
      );
      yPosRutaDerecha += 6;

      // Ajustar yPosition al máximo de ambas columnas
      yPosition = Math.max(yPosRuta, yPosRutaDerecha) + 5;

      // Información del Vehículo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DEL VEHÍCULO', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Columna Izquierda
      let yPosVehiculo = yPosition;
      doc.text(
        `Económico/Tractocamión: ${registro.economico || registro.numeroEconomico || registro.tractocamion || 'N/A'}`,
        col1X,
        yPosVehiculo
      );
      yPosVehiculo += 6;
      doc.text(
        `Placas Tractor: ${registro.Placas || registro.placas || 'N/A'}`,
        col1X,
        yPosVehiculo
      );
      yPosVehiculo += 6;
      doc.text(
        `Tipo de Mercancía: ${registro.mercancia || registro.tipoMercancia || registroLogistica?.mercancia || registroLogistica?.tipoMercancia || 'N/A'}`,
        col1X,
        yPosVehiculo
      );
      yPosVehiculo += 6;

      // Columna Derecha
      let yPosVehiculoDerecha = yPosition;
      doc.text(
        `Plataforma: ${registro.plataformaServicio || registro.plataforma || 'N/A'}`,
        col2X,
        yPosVehiculoDerecha
      );
      yPosVehiculoDerecha += 6;
      doc.text(
        `Placas Plataforma: ${registro.placasPlataforma || registro.PlacasPlataforma || 'N/A'}`,
        col2X,
        yPosVehiculoDerecha
      );
      yPosVehiculoDerecha += 6;
      doc.text(
        `Tipo de Plataforma: ${registro.tipoPlataforma || 'N/A'}`,
        col2X,
        yPosVehiculoDerecha
      );
      yPosVehiculoDerecha += 6;

      // Ajustar yPosition al máximo de ambas columnas
      yPosition = Math.max(yPosVehiculo, yPosVehiculoDerecha) + 5;

      // Información de Operadores
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('INFORMACIÓN DE OPERADORES', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Columna Izquierda
      let yPosOperadores = yPosition;
      const valorOperador =
        registro.operadorprincipal ||
        registro.operadorPrincipal ||
        registro.OperadorPrincipal ||
        '';
      const nombreOperador =
        typeof window.obtenerOperadorNombre === 'function'
          ? await window.obtenerOperadorNombre(valorOperador)
          : valorOperador || 'N/A';
      doc.text(`Operador Principal: ${nombreOperador}`, col1X, yPosOperadores);
      yPosOperadores += 6;

      // Obtener licencia del operador principal
      let licenciaPrincipal =
        registro.licenciaPrincipal || registro.Licencia || registro.licenciaOperadorPrincipal || '';
      if (!licenciaPrincipal && valorOperador) {
        // Intentar obtener la licencia desde el operador
        try {
          let operadorEncontrado = null;

          // 1. Buscar en Firebase primero
          if (window.firebaseRepos?.operadores && nombreOperador && nombreOperador !== 'N/A') {
            try {
              const todosOperadores = await window.firebaseRepos.operadores.getAll();
              operadorEncontrado = todosOperadores.find(op => {
                const nombreOp = (op.nombre || '').toString().trim();
                const nombreBuscar = nombreOperador.toString().trim();
                return (
                  nombreOp === nombreBuscar ||
                  nombreOp.includes(nombreBuscar) ||
                  nombreBuscar.includes(nombreOp)
                );
              });
              if (operadorEncontrado) {
                licenciaPrincipal =
                  operadorEncontrado.licencia || operadorEncontrado.Licencia || '';
                console.log('✅ Licencia principal obtenida desde Firebase:', licenciaPrincipal);
              }
            } catch (e) {
              console.warn('⚠️ Error buscando operador en Firebase:', e);
            }
          }

          // 2. Si no se encontró, buscar en caché de operadores usando sistema de caché
          if (!licenciaPrincipal) {
            // Usar sistema de caché para obtener operadores
            let operadores = [];
            try {
              operadores = await window.getDataWithCache('operadores', async () => {
                if (
                  window.configuracionManager &&
                  typeof window.configuracionManager.getAllOperadores === 'function'
                ) {
                  const ops = window.configuracionManager.getAllOperadores() || [];
                  return Array.isArray(ops) ? ops : Object.values(ops);
                }
                return [];
              });

              // Asegurar que sea un array
              if (!Array.isArray(operadores)) {
                operadores = Object.values(operadores || {});
              }
            } catch (e) {
              console.warn('⚠️ Error obteniendo operadores desde caché:', e);
              operadores = [];
            }
            // Buscar operador por nombre (coincidencia exacta o parcial)
            const operador = operadores.find(op => {
              const nombreOp = (op.nombre || '').toString().trim();
              const valorOp = valorOperador.toString().trim();
              return (
                nombreOp === valorOp || nombreOp.includes(valorOp) || valorOp.includes(nombreOp)
              );
            });
            if (operador) {
              licenciaPrincipal = operador.licencia || operador.Licencia || '';
              console.log(
                '✅ Licencia principal obtenida desde caché/localStorage:',
                licenciaPrincipal
              );
            }
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo licencia principal:', e);
        }
      }
      doc.text(`Licencia Operador Principal: ${licenciaPrincipal || 'N/A'}`, col1X, yPosOperadores);
      yPosOperadores += 6;

      // Columna Derecha
      let yPosOperadoresDerecha = yPosition;
      const valorOperadorSec =
        registro.operadorsecundario ||
        registro.operadorSecundario ||
        registro.OperadorSecundario ||
        '';
      const nombreOperadorSec =
        valorOperadorSec && typeof window.obtenerOperadorNombre === 'function'
          ? await window.obtenerOperadorNombre(valorOperadorSec)
          : 'N/A';
      doc.text(`Operador Secundario: ${nombreOperadorSec}`, col2X, yPosOperadoresDerecha);
      yPosOperadoresDerecha += 6;

      // Obtener licencia del operador secundario
      let licenciaSecundaria =
        registro.licenciaSecundaria ||
        registro.LicenciaSecundaria ||
        registro.licenciaOperadorSecundario ||
        '';
      if (!licenciaSecundaria && valorOperadorSec) {
        // Intentar obtener la licencia desde el operador
        try {
          let operadorEncontrado = null;

          // 1. Buscar en Firebase primero
          if (
            window.firebaseRepos?.operadores &&
            nombreOperadorSec &&
            nombreOperadorSec !== 'N/A'
          ) {
            try {
              const todosOperadores = await window.firebaseRepos.operadores.getAll();
              operadorEncontrado = todosOperadores.find(op => {
                const nombreOp = (op.nombre || '').toString().trim();
                const nombreBuscar = nombreOperadorSec.toString().trim();
                return (
                  nombreOp === nombreBuscar ||
                  nombreOp.includes(nombreBuscar) ||
                  nombreBuscar.includes(nombreOp)
                );
              });
              if (operadorEncontrado) {
                licenciaSecundaria =
                  operadorEncontrado.licencia || operadorEncontrado.Licencia || '';
                console.log('✅ Licencia secundaria obtenida desde Firebase:', licenciaSecundaria);
              }
            } catch (e) {
              console.warn('⚠️ Error buscando operador en Firebase:', e);
            }
          }

          // 2. Si no se encontró, buscar en caché de operadores
          if (!licenciaSecundaria) {
            // Usar sistema de caché para obtener operadores
            let operadores = [];
            try {
              operadores = await window.getDataWithCache('operadores', async () => {
                if (
                  window.configuracionManager &&
                  typeof window.configuracionManager.getAllOperadores === 'function'
                ) {
                  const ops = window.configuracionManager.getAllOperadores() || [];
                  return Array.isArray(ops) ? ops : Object.values(ops);
                }
                return [];
              });

              // Asegurar que sea un array
              if (!Array.isArray(operadores)) {
                operadores = Object.values(operadores || {});
              }
            } catch (e) {
              console.warn('⚠️ Error obteniendo operadores desde caché:', e);
              operadores = [];
            }
            // Buscar operador por nombre (coincidencia exacta o parcial)
            const operador = operadores.find(op => {
              const nombreOp = (op.nombre || '').toString().trim();
              const valorOp = valorOperadorSec.toString().trim();
              return (
                nombreOp === valorOp || nombreOp.includes(valorOp) || valorOp.includes(nombreOp)
              );
            });
            if (operador) {
              licenciaSecundaria = operador.licencia || operador.Licencia || '';
              console.log(
                '✅ Licencia secundaria obtenida desde caché/localStorage:',
                licenciaSecundaria
              );
            }
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo licencia secundaria:', e);
        }
      }
      doc.text(
        `Licencia Operador Secundario: ${licenciaSecundaria || 'N/A'}`,
        col2X,
        yPosOperadoresDerecha
      );
      yPosOperadoresDerecha += 6;

      // Ajustar yPosition al máximo de ambas columnas
      yPosition = Math.max(yPosOperadores, yPosOperadoresDerecha) + 5;

      // Estado
      const estadoPlataforma = registro.estadoPlataforma || registro.estado || 'Cargado';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('ESTADO', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(
        `Estado: ${estadoPlataforma === 'cargado' ? 'Cargado' : estadoPlataforma === 'descargado' ? 'Descargado' : estadoPlataforma}`,
        margin + 5,
        yPosition
      );
      yPosition += 10;

      // Información de Descarga (solo si está descargado)
      if (estadoPlataforma === 'descargado') {
        // Verificar si necesitamos una nueva página
        const pageHeight = doc.internal.pageSize.height;
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('INFORMACIÓN DE DESCARGA', margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        if (registro.tractocamionDescarga || registro.economicoDescarga) {
          doc.text(
            `Tractocamión (Descarga): ${registro.tractocamionDescarga || registro.economicoDescarga}`,
            margin + 5,
            yPosition
          );
          yPosition += 6;
        }
        if (registro.operadorPrincipalDescarga) {
          doc.text(
            `Operador Principal (Descarga): ${registro.operadorPrincipalDescarga}`,
            margin + 5,
            yPosition
          );
          yPosition += 6;
        }
        if (registro.operadorSecundarioDescarga) {
          doc.text(
            `Operador Secundario (Descarga): ${registro.operadorSecundarioDescarga}`,
            margin + 5,
            yPosition
          );
          yPosition += 6;
        }
        if (registro.fechaDescarga) {
          const fechaDescargaFormateada = formatearFechaDetalle(registro.fechaDescarga);
          doc.text(`Fecha de Descarga: ${fechaDescargaFormateada}`, margin + 5, yPosition);
          yPosition += 6;
        }
        if (registro.notasDescarga || registro.observacionesDescarga) {
          const notas = (registro.notasDescarga || registro.observacionesDescarga || '').substring(
            0,
            150
          );
          doc.text(`Notas de Descarga: ${notas}`, margin + 5, yPosition);
          yPosition += 6;
        }

        yPosition += 5;
      }

      // Obtener gastos asociados al registro
      let gastosRegistro = [];

      // 1. Buscar gastos en el registro directamente
      if (registro.gastosOperadores && Array.isArray(registro.gastosOperadores)) {
        gastosRegistro = registro.gastosOperadores;
        console.log('✅ Gastos encontrados en el registro:', gastosRegistro.length);
      }

      // 2. Buscar gastos en Firebase desde el sistema de operadores (PRIORIDAD)
      if (gastosRegistro.length === 0 && window.firebaseRepos?.operadores) {
        try {
          console.log('🔍 Buscando gastos en Firebase para registro:', regId);
          const todosGastos = await window.firebaseRepos.operadores.getAll();
          console.log('📊 Total gastos obtenidos de Firebase:', todosGastos.length);

          gastosRegistro = todosGastos.filter(g => {
            const coincideRegistro =
              g.numeroRegistro === regId || g.numeroRegistro === String(regId);
            const esDeTrafico = g.origen === 'trafico';
            return coincideRegistro && esDeTrafico;
          });

          console.log('✅ Gastos encontrados en Firebase:', gastosRegistro.length);
        } catch (e) {
          console.warn('⚠️ Error obteniendo gastos desde Firebase:', e);
        }
      }

      // 3. NO USAR localStorage - Solo Firebase es la fuente de verdad para gastos
      // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores
      if (gastosRegistro.length === 0) {
        console.warn('⚠️ No se encontraron gastos en Firebase para este registro');
        console.warn(
          '⚠️ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
        );
      }

      console.log('📋 Total gastos para mostrar en PDF:', gastosRegistro.length);

      // Información de Gastos (si hay gastos)
      if (gastosRegistro.length > 0) {
        // Verificar si necesitamos una nueva página
        const pageHeight = doc.internal.pageSize.height;
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('GASTOS DE OPERADORES', margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        // Encabezados de tabla
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Operador', margin + 5, yPosition);
        doc.text('Motivo', margin + 50, yPosition);
        doc.text('Monto', margin + 110, yPosition);
        doc.text('Fecha', margin + 150, yPosition);
        yPosition += 6;

        // Línea debajo de encabezados
        doc.setDrawColor(0, 0, 0);
        doc.line(margin + 5, yPosition - 2, pageWidth - margin - 5, yPosition - 2);
        yPosition += 3;

        // Datos de gastos
        doc.setFont('helvetica', 'normal');
        let totalGastos = 0;

        gastosRegistro.forEach(gasto => {
          // Verificar si necesitamos una nueva página
          const pageHeight = doc.internal.pageSize.height;
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          const operador = gasto.operadorNombre || gasto.operador || 'N/A';
          const motivo = gasto.tipoGasto || gasto.motivo || 'N/A';
          const monto = parseFloat(gasto.monto || 0);
          totalGastos += monto;

          const fechaGasto = gasto.fecha || gasto.fechaCreacion || 'N/A';
          let fechaFormateada = 'N/A';
          if (fechaGasto !== 'N/A') {
            try {
              if (typeof fechaGasto === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaGasto)) {
                const fechaStr = fechaGasto.split('T')[0];
                const [year, month, day] = fechaStr.split('-');
                const fecha = new Date(
                  parseInt(year, 10),
                  parseInt(month, 10) - 1,
                  parseInt(day, 10)
                );
                fechaFormateada = fecha.toLocaleDateString('es-ES');
              } else {
                fechaFormateada = new Date(fechaGasto).toLocaleDateString('es-ES');
              }
            } catch (e) {
              console.warn('⚠️ Error formateando fecha de gasto:', fechaGasto, e);
              fechaFormateada = String(fechaGasto);
            }
          }

          // Truncar textos largos si es necesario
          const operadorTruncado =
            operador.length > 20 ? `${operador.substring(0, 17)}...` : operador;
          const motivoTruncado = motivo.length > 25 ? `${motivo.substring(0, 22)}...` : motivo;

          doc.setFontSize(8);
          doc.text(operadorTruncado, margin + 5, yPosition);
          doc.text(motivoTruncado, margin + 50, yPosition);
          doc.text(`$${monto.toFixed(2)}`, margin + 110, yPosition);
          doc.text(fechaFormateada, margin + 150, yPosition);
          yPosition += 6;
        });

        // Línea antes del total
        yPosition += 2;
        doc.setDrawColor(0, 0, 0);
        doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
        yPosition += 4;

        // Total
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('TOTAL:', margin + 110, yPosition);
        doc.text(`$${totalGastos.toFixed(2)}`, margin + 150, yPosition);
        yPosition += 10;
      }

      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Descargar PDF
      const filename = `Trafico_${regId}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);

      console.log(`✅ PDF generado exitosamente: ${filename}`);
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert(`Error al generar el PDF: ${error.message}`);
    }
  };

  // Exponer función helper para uso en otros módulos
  window.formatearFechaDetalle = formatearFechaDetalle;
})();
