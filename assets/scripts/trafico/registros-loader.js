/**
 * Cargador de Registros - trafico.html
 * Funciones para cargar, filtrar y renderizar registros de tráfico
 */

(function () {
  'use strict';

  // Helper para obtener nombre de cliente (debe estar disponible globalmente)
  async function obtenerClienteNombre(rfc) {
    if (typeof window.obtenerClienteNombre === 'function') {
      return window.obtenerClienteNombre(rfc);
    }
    return rfc || '';
  }

  // Helper para obtener nombre de operador (debe estar disponible globalmente)
  async function obtenerOperadorNombre(valorOperador) {
    if (typeof window.obtenerOperadorNombre === 'function') {
      return window.obtenerOperadorNombre(valorOperador);
    }
    return valorOperador || 'N/A';
  }

  // Función para renderizar registros directamente (sin paginación)
  async function renderizarRegistrosTraficoDirectamente(registrosOrdenados) {
    const cuerpoTabla = document.getElementById('cuerpoTablaTrafico');
    if (!cuerpoTabla || !window.registrosMapTrafico) {
      return;
    }

    // Obtener nombres de clientes y operadores de forma asíncrona
    const filasHTML = await Promise.all(
      registrosOrdenados.map(async regId => {
        const registro = window.registrosMapTrafico[regId];

        // Obtener nombre del cliente
        const rfcCliente = registro.cliente || registro.rfcCliente || '';
        const nombreCliente = rfcCliente ? await obtenerClienteNombre(rfcCliente) : 'N/A';

        // Obtener nombre del operador principal
        const valorOperador =
          registro.operadorprincipal ||
          registro.operadorPrincipal ||
          registro.OperadorPrincipal ||
          '';
        const nombreOperador = await obtenerOperadorNombre(valorOperador);

        const estadoPlataforma = registro.estadoPlataforma || registro.estado || 'cargado';
        const estadoBadge = {
          cargado: { class: 'warning', icon: 'box', text: 'Cargado' },
          descargado: { class: 'success', icon: 'check-circle', text: 'Descargado' },
          'En tránsito': { class: 'info', icon: 'truck', text: 'En tránsito' },
          completado: { class: 'success', icon: 'check-circle', text: 'Completado' }
        }[estadoPlataforma] || { class: 'warning', icon: 'box', text: 'Cargado' };

        let botonesEstado = '';
        if (estadoPlataforma === 'cargado' || estadoPlataforma === 'En tránsito') {
          botonesEstado = `<button class="btn btn-sm btn-success" onclick="abrirModalDescarga('${regId}')" title="Registrar Descarga"><i class="fas fa-truck-loading"></i> Descargar</button>`;
        }

        return `
                <tr>
                    <td><strong>${regId}</strong></td>
                    <td>${nombreCliente}</td>
                    <td>${registro.origen || registro.LugarOrigen || 'N/A'}</td>
                    <td>${registro.destino || registro.LugarDestino || 'N/A'}</td>
                    <td>${nombreOperador}</td>
                    <td>${registro.plataformaServicio || 'N/A'}</td>
                    <td>${registro.Placas || registro.placas || 'N/A'}</td>
                    <td><span class="badge bg-${estadoBadge.class}"><i class="fas fa-${estadoBadge.icon}"></i> ${estadoBadge.text}</span></td>
                    <td>
                        <div class="btn-group" role="group">
                            ${botonesEstado}
                            <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroTrafico('${regId}')" title="Ver detalles"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroTrafico('${regId}')" title="Editar"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFTrafico('${regId}')" title="Descargar PDF"><i class="fas fa-file-pdf"></i></button>
                            <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarRegistroTrafico('${regId}')" title="Eliminar"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
      })
    );

    cuerpoTabla.innerHTML = filasHTML.join('');

    // Limpiar paginación si no está disponible
    const contenedorPaginacion = document.getElementById('paginacionTrafico');
    if (contenedorPaginacion) {
      contenedorPaginacion.innerHTML = '';
    }

    // console.log('✅ Registros de Tráfico renderizados correctamente sin paginación');
  }

  // Función para renderizar los registros de la página actual
  async function renderizarRegistrosTrafico() {
    const cuerpoTabla = document.getElementById('cuerpoTablaTrafico');
    if (!cuerpoTabla || !window._paginacionTraficoManager || !window.registrosMapTrafico) {
      return;
    }

    const registrosPagina = window._paginacionTraficoManager.obtenerRegistrosPagina();

    if (registrosPagina.length === 0) {
      cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        <i class="fas fa-inbox"></i> No hay registros de Tráfico
                    </td>
                </tr>
            `;
      const contenedorPaginacion = document.getElementById('paginacionTrafico');
      if (contenedorPaginacion) {
        contenedorPaginacion.innerHTML = '';
      }
      return;
    }

    // Obtener nombres de clientes y operadores de forma asíncrona solo para la página actual
    const filasHTML = await Promise.all(
      registrosPagina.map(async regId => {
        const registro = window.registrosMapTrafico[regId];

        // Obtener nombre del cliente
        const rfcCliente = registro.cliente || registro.rfcCliente || '';
        const nombreCliente = rfcCliente ? await obtenerClienteNombre(rfcCliente) : 'N/A';

        // Obtener nombre del operador principal
        const valorOperador =
          registro.operadorprincipal ||
          registro.operadorPrincipal ||
          registro.OperadorPrincipal ||
          '';
        const nombreOperador = await obtenerOperadorNombre(valorOperador);

        // Determinar estado de la plataforma (por defecto: cargado)
        const estadoPlataforma = registro.estadoPlataforma || registro.estado || 'cargado';
        const estadoBadge = {
          cargado: { class: 'warning', icon: 'box', text: 'Cargado' },
          descargado: { class: 'success', icon: 'check-circle', text: 'Descargado' },
          'En tránsito': { class: 'info', icon: 'truck', text: 'En tránsito' },
          completado: { class: 'success', icon: 'check-circle', text: 'Completado' }
        }[estadoPlataforma] || { class: 'warning', icon: 'box', text: 'Cargado' };

        // Botones de acción según estado
        let botonesEstado = '';
        if (estadoPlataforma === 'cargado' || estadoPlataforma === 'En tránsito') {
          botonesEstado = `
                    <button class="btn btn-sm btn-success" onclick="abrirModalDescarga('${regId}')" title="Registrar Descarga">
                        <i class="fas fa-truck-loading"></i> Descargar
                    </button>
                `;
        }

        return `
                <tr>
                    <td><strong>${regId}</strong></td>
                    <td>${nombreCliente}</td>
                    <td>${registro.origen || registro.LugarOrigen || 'N/A'}</td>
                    <td>${registro.destino || registro.LugarDestino || 'N/A'}</td>
                    <td>${nombreOperador}</td>
                    <td>${registro.plataformaServicio || 'N/A'}</td>
                    <td>${registro.Placas || registro.placas || 'N/A'}</td>
                    <td>
                        <span class="badge bg-${estadoBadge.class}">
                            <i class="fas fa-${estadoBadge.icon}"></i> ${estadoBadge.text}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            ${botonesEstado}
                            <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroTrafico('${regId}')" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroTrafico('${regId}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFTrafico('${regId}')" title="Descargar PDF">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarRegistroTrafico('${regId}')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      })
    );

    cuerpoTabla.innerHTML = filasHTML.join('');

    // Mostrar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionTrafico');
    if (contenedorPaginacion && window._paginacionTraficoManager) {
      if (typeof window._paginacionTraficoManager.generarControlesPaginacion === 'function') {
        const controlesHTML = window._paginacionTraficoManager.generarControlesPaginacion(
          'paginacionTrafico',
          'cambiarPaginaTrafico'
        );
        contenedorPaginacion.innerHTML = controlesHTML;
        // console.log('✅ Controles de paginación generados');
      } else {
        console.warn('⚠️ generarControlesPaginacion no está disponible');
        contenedorPaginacion.innerHTML = '';
      }
    } else {
      console.warn('⚠️ Contenedor de paginación o paginacionTrafico no disponible');
    }

    if (window._paginacionTraficoManager) {
      const totalPaginas = window._paginacionTraficoManager.obtenerTotalPaginas();
      // console.log(`✅ ${window._paginacionTraficoManager.totalRegistros} registros de Tráfico cargados (página ${window._paginacionTraficoManager.paginaActual} de ${totalPaginas})`);
      if (totalPaginas > 1) {
        console.log(
          `📄 Mostrando ${registrosPagina.length} registros de la página ${window._paginacionTraficoManager.paginaActual}`
        );
      }
    }
  }

  // Función para cambiar de página
  window.cambiarPaginaTrafico = async function (accion) {
    if (!window._paginacionTraficoManager) {
      return;
    }

    let cambioExitoso = false;

    if (accion === 'anterior') {
      cambioExitoso = window._paginacionTraficoManager.paginaAnterior();
    } else if (accion === 'siguiente') {
      cambioExitoso = window._paginacionTraficoManager.paginaSiguiente();
    } else if (typeof accion === 'number') {
      cambioExitoso = window._paginacionTraficoManager.irAPagina(accion);
    }

    if (cambioExitoso) {
      await renderizarRegistrosTrafico();
      // Scroll suave hacia la tabla
      const tabla = document.getElementById('tablaRegistrosTrafico');
      if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Función auxiliar para cargar registros directamente desde Firebase (sin firebaseRepos)
  async function cargarRegistrosDesdeFirebaseDirecto() {
    if (!window.firebaseDb || !window.fs || !window.firebaseAuth?.currentUser) {
      console.warn('⚠️ Firebase no está completamente inicializado para carga directa');
      return [];
    }

    try {
      // CRÍTICO: Obtener tenantId actual para filtrar por cliente
      let tenantId = null;

      // PRIORIDAD 1: Verificar si es un usuario recién creado
      const newUserCreated = localStorage.getItem('newUserCreated');
      const newUserTenantId = localStorage.getItem('newUserTenantId');
      if (newUserCreated === 'true' && newUserTenantId) {
        tenantId = newUserTenantId;
      }

      // PRIORIDAD 2: Verificar licencia activa
      if (!tenantId && window.licenseManager && window.licenseManager.isLicenseActive()) {
        tenantId = window.licenseManager.getTenantId();
      }

      // PRIORIDAD 3: Verificar localStorage
      if (!tenantId) {
        const savedTenantId = localStorage.getItem('tenantId');
        if (savedTenantId) {
          tenantId = savedTenantId;
        }
      }

      // PRIORIDAD 4: Verificar documento users/{uid}
      if (!tenantId && window.firebaseAuth?.currentUser) {
        try {
          const userRef = window.fs.doc(
            window.firebaseDb,
            'users',
            window.firebaseAuth.currentUser.uid
          );
          const userDoc = await window.fs.getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.tenantId) {
              tenantId = userData.tenantId;
            }
          }
        } catch (e) {
          console.warn('⚠️ Error obteniendo tenantId del documento users/{uid}:', e);
        }
      }

      if (!tenantId) {
        console.warn('⚠️ No se pudo obtener tenantId, usando DEMO_CONFIG.tenantId como fallback');
        tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
      }

      console.log(`🔑 Filtrando registros de tráfico por tenantId: ${tenantId}`);

      const { collection, getDocs, query, where } = window.fs;
      const db = window.firebaseDb;

      // CRÍTICO: Consultar documentos de tráfico filtrando por tenantId, tipo='registro' y deleted=false
      const traficoRef = collection(db, 'trafico');
      const q = query(
        traficoRef,
        where('tipo', '==', 'registro'),
        where('deleted', '==', false),
        where('tenantId', '==', tenantId)
      );

      const snapshot = await getDocs(q);
      const registros = [];

      // Filtrar adicionalmente por tenantId (por si acaso)
      snapshot.forEach(doc => {
        const data = doc.data();
        const docTenantId = data.tenantId;

        // Verificar que el documento pertenezca al tenantId correcto
        // Todos los usuarios solo ven documentos con su tenantId exacto
        if (docTenantId === tenantId) {
          registros.push({
            id: doc.id,
            ...data,
            numeroRegistro: data.numeroRegistro || doc.id
          });
        } else {
          console.debug(
            `🔒 Registro de tráfico filtrado por tenantId: ${doc.id} (tenantId: ${docTenantId}, esperado: ${tenantId})`
          );
        }
      });

      console.log(
        `📊 Registros cargados directamente desde Firebase (filtrados por tenantId ${tenantId}): ${registros.length}`
      );
      return registros;
    } catch (error) {
      console.error('❌ Error cargando registros directamente desde Firebase:', error);
      // Si el error es porque no existe el índice compuesto para tenantId, intentar sin ese filtro y filtrar después
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn(
          '⚠️ Índice compuesto no disponible, cargando sin filtro de tenantId y filtrando después...'
        );
        try {
          const { collection, getDocs, query, where } = window.fs;
          const db = window.firebaseDb;
          const traficoRef = collection(db, 'trafico');
          const q = query(
            traficoRef,
            where('tipo', '==', 'registro'),
            where('deleted', '==', false)
          );
          const snapshot = await getDocs(q);
          const registros = [];

          // Obtener tenantId para el filtro
          let tenantId = localStorage.getItem('tenantId');
          if (!tenantId && window.licenseManager && window.licenseManager.isLicenseActive()) {
            tenantId = window.licenseManager.getTenantId();
          }
          if (!tenantId) {
            tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          }

          snapshot.forEach(doc => {
            const data = doc.data();
            const docTenantId = data.tenantId;
            // Todos los usuarios solo ven documentos con su tenantId exacto
            if (docTenantId === tenantId) {
              registros.push({
                id: doc.id,
                ...data,
                numeroRegistro: data.numeroRegistro || doc.id
              });
            }
          });
          console.log(
            `📊 Registros cargados y filtrados después de la consulta: ${registros.length}`
          );
          return registros;
        } catch (fallbackError) {
          console.error('❌ Error en fallback:', fallbackError);
        }
      }
      return [];
    }
  }

  // Cargar registros con filtro aplicado
  window.cargarRegistrosTraficoConFiltro = async function () {
    // Verificar que PaginacionManager esté disponible
    if (typeof window.PaginacionManager === 'undefined') {
      console.warn('⚠️ PaginacionManager no está disponible aún, esperando...');
      // Esperar un momento y reintentar
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof window.PaginacionManager === 'undefined') {
        console.error('❌ PaginacionManager aún no está disponible después de esperar');
      }
    }

    const registrosMap = {}; // Mapa de registros: { registroId: datos }

    // 1. PRIORIDAD: Cargar desde Firebase
    try {
      // Intentar usar firebaseRepos si está disponible
      if (window.firebaseRepos?.trafico) {
        const repoTrafico = window.firebaseRepos.trafico;

        // Intentar inicializar una vez si no está listo
        if (typeof repoTrafico.init === 'function' && (!repoTrafico.db || !repoTrafico.tenantId)) {
          try {
            await repoTrafico.init();
          } catch (e) {
            // Ignorar error intencionalmente
          }
        }

        // Intentar usar Firebase si está disponible
        try {
          if (repoTrafico.db && repoTrafico.tenantId) {
            console.log('📊 Cargando registros desde Firebase (usando firebaseRepos)...');
            // getAllRegistros() no acepta parámetros, usa getAll() internamente que ya filtra por tenantId
            const registrosFirebase = await repoTrafico.getAllRegistros();

            console.log(`📊 Registros obtenidos de Firebase: ${registrosFirebase.length}`);

            // Log detallado de los primeros registros para diagnóstico
            if (registrosFirebase.length > 0) {
              console.log(
                '📋 Primeros 3 registros obtenidos:',
                registrosFirebase.slice(0, 3).map(r => ({
                  id: r.id,
                  numeroRegistro: r.numeroRegistro,
                  tipo: r.tipo,
                  cliente: r.cliente,
                  deleted: r.deleted
                }))
              );
            } else {
              console.warn(
                '⚠️ No se obtuvieron registros de Firebase. Verificando si hay documentos en la colección...'
              );
              // Intentar obtener todos los documentos sin filtrar por tipo
              try {
                const allDocs = await repoTrafico.getAll({ limit: 100, useCache: false });
                console.log(
                  `📊 Total de documentos en colección trafico (sin filtrar): ${allDocs.length}`
                );
                if (allDocs.length > 0) {
                  console.log(
                    '📋 Tipos encontrados:',
                    allDocs.map(d => ({ id: d.id, tipo: d.tipo || 'sin tipo', deleted: d.deleted }))
                  );
                }
              } catch (error) {
                console.error('❌ Error obteniendo todos los documentos:', error);
              }
            }

            // Convertir array a mapa usando numeroRegistro o id como clave
            registrosFirebase.forEach(registro => {
              const regId = registro.numeroRegistro || registro.id || registro.registroId;
              if (regId) {
                registrosMap[regId] = registro;
                console.log(
                  `✅ Registro agregado al mapa: ${regId} (tipo: ${registro.tipo || 'sin tipo'})`
                );
              } else {
                console.warn('⚠️ Registro sin ID válido:', registro);
              }
            });

            console.log(`📊 Total de registros en mapa: ${Object.keys(registrosMap).length}`);
          } else {
            console.warn('⚠️ Repositorio de tráfico no está inicializado (db o tenantId faltante)');
          }
        } catch (error) {
          console.error('❌ Error cargando desde Firebase (firebaseRepos):', error);
          console.error('📋 Stack:', error.stack);
        }
      }

      // Si firebaseRepos no está disponible o no se cargaron registros, intentar carga directa
      if (Object.keys(registrosMap).length === 0) {
        console.log('📊 Intentando cargar registros directamente desde Firebase...');
        try {
          const registrosDirectos = await cargarRegistrosDesdeFirebaseDirecto();

          registrosDirectos.forEach(registro => {
            const regId = registro.numeroRegistro || registro.id || registro.registroId;
            if (regId) {
              registrosMap[regId] = registro;
              console.log(
                `✅ Registro agregado al mapa (directo): ${regId} (tipo: ${registro.tipo || 'sin tipo'})`
              );
            }
          });

          console.log(
            `📊 Total de registros en mapa (después de carga directa): ${Object.keys(registrosMap).length}`
          );
        } catch (error) {
          console.error('❌ Error cargando directamente desde Firebase:', error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error general cargando desde Firebase:', error);
    }

    // 2. NO combinar con localStorage para evitar restaurar datos eliminados
    // Firebase es la fuente de verdad. Si Firebase está vacío Y hay conexión, significa que los datos fueron eliminados
    const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
    const hayConexion = navigator.onLine;
    const firebaseVacio = Object.keys(registrosMap).length === 0;

    if (datosLimpios === 'true' || (firebaseVacio && hayConexion)) {
      const razon =
        datosLimpios === 'true'
          ? 'Datos operativos fueron limpiados (flag local)'
          : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
      console.log(`⚠️ ${razon}. No se combinará con localStorage para evitar restauración.`);
    } else if (!hayConexion && firebaseVacio) {
      // Solo en modo offline real, usar localStorage como fallback temporal
      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminado combinación con localStorage para evitar inconsistencias entre navegadores
      console.log(
        '✅ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
      );
    } else {
      console.log(
        '✅ Firebase es la fuente de verdad. localStorage ha sido deshabilitado para evitar inconsistencias.'
      );
    }

    let registrosArray = Object.keys(registrosMap);
    const cuerpoTabla = document.getElementById('cuerpoTablaTrafico');
    if (!cuerpoTabla) {
      return;
    }

    // Calcular contadores
    const contadores = {
      todos: registrosArray.length,
      cargado: 0,
      descargado: 0
    };

    registrosArray.forEach(regId => {
      const estado =
        registrosMap[regId].estadoPlataforma || registrosMap[regId].estado || 'cargado';
      if (contadores[estado] !== undefined) {
        contadores[estado]++;
      }
    });

    // Actualizar badges
    const badgeTodos = document.getElementById('badgeTodos');
    const badgeCargados = document.getElementById('badgeCargados');
    const badgeDescargados = document.getElementById('badgeDescargados');

    if (badgeTodos) {
      badgeTodos.textContent = contadores.todos;
    }
    if (badgeCargados) {
      badgeCargados.textContent = contadores.cargado;
    }
    if (badgeDescargados) {
      badgeDescargados.textContent = contadores.descargado;
    }

    // Aplicar filtro de estado
    if (window.__filtroEstadoActivo) {
      registrosArray = registrosArray.filter(regId => {
        const estado =
          registrosMap[regId].estadoPlataforma || registrosMap[regId].estado || 'cargado';
        return estado === window.__filtroEstadoActivo;
      });
    }

    // Aplicar filtros adicionales (sincrónico primero, luego async para cliente)
    const filtroNumeroRegistro =
      document.getElementById('filtroNumeroRegistro')?.value?.trim().toLowerCase() || '';
    const filtroCliente =
      document.getElementById('filtroCliente')?.value?.trim().toLowerCase() || '';
    const filtroPlataforma =
      document.getElementById('filtroPlataforma')?.value?.trim().toLowerCase() || '';
    const filtroEconomico =
      document.getElementById('filtroEconomico')?.value?.trim().toLowerCase() || '';
    const filtroFechaOrigen = document.getElementById('filtroFechaOrigen')?.value || '';
    const filtroFechaDestino = document.getElementById('filtroFechaDestino')?.value || '';

    if (
      filtroNumeroRegistro ||
      filtroCliente ||
      filtroPlataforma ||
      filtroEconomico ||
      filtroFechaOrigen ||
      filtroFechaDestino
    ) {
      // Primero filtrar campos síncronos
      registrosArray = registrosArray.filter(regId => {
        const registro = registrosMap[regId];

        // Filtro por N° Registro
        if (filtroNumeroRegistro) {
          const regIdStr = String(regId).toLowerCase();
          if (!regIdStr.includes(filtroNumeroRegistro)) {
            return false;
          }
        }

        // Filtro por Plataforma
        if (filtroPlataforma) {
          const plataforma = (
            registro.plataformaServicio ||
            registro.plataforma ||
            ''
          ).toLowerCase();
          if (!plataforma.includes(filtroPlataforma)) {
            return false;
          }
        }

        // Filtro por Económico
        if (filtroEconomico) {
          const economico = (
            registro.economico ||
            registro.numeroEconomico ||
            registro.tractocamion ||
            ''
          ).toLowerCase();
          if (!economico.includes(filtroEconomico)) {
            return false;
          }
        }

        // Filtro por Fecha Origen
        if (filtroFechaOrigen) {
          const fechaCreacion =
            registro.fechaCreacion || registro.fecha || registro.fechaEnvio || '';
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
            if (fechaFormateada !== filtroFechaOrigen) {
              return false;
            }
          } else {
            return false;
          }
        }

        // Filtro por Fecha Destino (usando fecha de descarga si existe)
        if (filtroFechaDestino) {
          const fechaDescarga = registro.fechaDescarga || '';
          if (fechaDescarga) {
            let fechaFormateada = '';
            try {
              if (typeof fechaDescarga === 'string' && fechaDescarga.includes('T')) {
                fechaFormateada = fechaDescarga.split('T')[0];
              } else if (
                typeof fechaDescarga === 'string' &&
                /^\d{4}-\d{2}-\d{2}/.test(fechaDescarga)
              ) {
                fechaFormateada = fechaDescarga.substring(0, 10);
              } else {
                const fecha = new Date(fechaDescarga);
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
            if (fechaFormateada !== filtroFechaDestino) {
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
        for (const regId of registrosArray) {
          const registro = registrosMap[regId];
          const rfcCliente = registro.cliente || registro.rfcCliente || '';
          let nombreCliente = '';
          if (rfcCliente) {
            try {
              nombreCliente = await obtenerClienteNombre(rfcCliente);
            } catch (e) {
              nombreCliente = rfcCliente;
            }
          } else {
            nombreCliente = registro.cliente || '';
          }
          if (nombreCliente.toLowerCase().includes(filtroCliente)) {
            registrosFiltrados.push(regId);
          }
        }
        registrosArray = registrosFiltrados;
      }
    }

    if (registrosArray.length === 0) {
      cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted">
                        <i class="fas fa-inbox"></i> No hay registros con el filtro seleccionado
                    </td>
                </tr>
            `;
      return;
    }

    // Ordenar registros por número de registro (más nuevo al más viejo) - SIN considerar estado
    // IMPORTANTE: El ordenamiento es únicamente por número de registro, el estado NO afecta el orden
    // Ejemplo: 2500020, 2500019, 2500018, etc.
    const registrosOrdenados = registrosArray.sort((a, b) => {
      // Convertir IDs a números para comparación
      const idA = parseInt(a, 10) || 0;
      const idB = parseInt(b, 10) || 0;

      // Ordenar del más nuevo (número mayor) al más viejo (número menor)
      // NO considerar estado en el ordenamiento
      return idB - idA; // ID más grande primero
    });

    console.log(
      `📄 Registros ordenados: ${registrosOrdenados.length} (del más nuevo al más viejo por número de registro)`
    );
    if (registrosOrdenados.length > 0) {
      console.log(`📄 Primeros 3 IDs: ${registrosOrdenados.slice(0, 3).join(', ')}`);
    }

    // Guardar registrosMap globalmente para usar en renderizarRegistrosTrafico
    window.registrosMapTrafico = registrosMap;

    // Inicializar paginación - simplificado
    // NOTA: Usamos _paginacionTraficoManager para evitar conflicto con el ID del elemento DOM
    const PaginacionManagerClass = window.PaginacionManager;

    // Crear o reutilizar instancia de paginación
    if (!window._paginacionTraficoManager) {
      if (typeof PaginacionManagerClass === 'function') {
        try {
          window._paginacionTraficoManager = new PaginacionManagerClass();
          // console.log('✅ Instancia de PaginacionManager creada para Tráfico');
        } catch (error) {
          console.error('❌ Error creando instancia de PaginacionManager:', error);
          window._paginacionTraficoManager = null;
        }
      } else {
        console.error(
          '❌ PaginacionManager no está disponible. Tipo:',
          typeof PaginacionManagerClass
        );
        window._paginacionTraficoManager = null;
      }
    }

    // Intentar usar paginación si está disponible
    if (
      window._paginacionTraficoManager &&
      typeof window._paginacionTraficoManager.inicializar === 'function'
    ) {
      try {
        window._paginacionTraficoManager.inicializar(registrosOrdenados, 15);
        console.log(
          `📄 Paginación inicializada: ${window._paginacionTraficoManager.totalRegistros} registros, ${window._paginacionTraficoManager.obtenerTotalPaginas()} páginas`
        );

        // Renderizar registros de la página actual usando la función común
        await renderizarRegistrosTrafico();
        // console.log('✅ Registros de Tráfico renderizados correctamente con filtro y paginación');
      } catch (error) {
        console.error('❌ Error inicializando paginación:', error);
        console.log('⚠️ Paginación no disponible, usando función helper');
        await renderizarRegistrosTraficoDirectamente(registrosOrdenados);
      }
    } else {
      // Paginación no disponible, renderizar todos los registros
      console.log('⚠️ Paginación no disponible, renderizando todos los registros');
      await renderizarRegistrosTraficoDirectamente(registrosOrdenados);
    }
  };
})();
