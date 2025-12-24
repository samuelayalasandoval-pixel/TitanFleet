/**
 * Carga y Renderizado de Registros - logistica.html
 * Maneja la carga de registros desde Firebase/localStorage y su renderizado paginado
 */

(function () {
  'use strict';

  // Variable global para almacenar todos los registros sin filtrar
  window._registrosLogisticaCompletos = [];

  // Función para cargar y mostrar registros de Logística
  if (typeof window.cargarRegistrosLogistica === 'undefined') {
    window.cargarRegistrosLogistica = async function () {
      // console.log('📋 === INICIANDO cargarRegistrosLogistica ===');
      // console.log('📋 Cargando registros de Logística...');

      let registrosArray = [];

      try {
        // PRIORIDAD 1: Intentar cargar desde Firebase
        if (window.firebaseRepos?.logistica) {
          try {
            const repoLogistica = window.firebaseRepos.logistica;

            // Intentar inicializar si no está listo
            if (
              typeof repoLogistica.init === 'function' &&
              (!repoLogistica.db || !repoLogistica.tenantId)
            ) {
              try {
                await repoLogistica.init();
              } catch (initError) {
                // Ignorar errores de inicialización y continuar con fallback
                console.debug('ℹ️ Error inicializando repositorio, usando localStorage');
              }
            }

            // Intentar usar Firebase si está disponible
            try {
              if (repoLogistica.db && repoLogistica.tenantId) {
                console.log('📊 Intentando cargar desde Firebase (getAll)...');
                // Intentar con getAll() optimizado (con límite para mejor rendimiento)
                const allData = await repoLogistica.getAll({
                  limit: 100,
                  useCache: true
                });
                if (allData && allData.length > 0) {
                  registrosArray = allData;
                  // console.log(`✅ ${registrosArray.length} registros cargados desde Firebase (getAll)`);
                } else {
                  // Si getAll() no tiene datos, intentar getAllRegistros() optimizado
                  console.log('📊 Intentando cargar desde Firebase (getAllRegistros)...');
                  registrosArray = await repoLogistica.getAllRegistros({
                    limit: 100,
                    useCache: true
                  });
                  // console.log(`✅ ${registrosArray.length} registros cargados desde Firebase (getAllRegistros)`);
                }
              }
            } catch (firebaseError) {
              console.debug(
                'ℹ️ Error cargando desde Firebase, usando localStorage:',
                firebaseError.message
              );
            }
          } catch (error) {
            console.warn('⚠️ Error cargando desde Firebase:', error);
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde Firebase, intentando localStorage:', error);
      }

      // NO USAR localStorage - Solo Firebase es la fuente de verdad
      // Eliminada toda la lógica de combinación con localStorage para evitar inconsistencias entre navegadores
      console.log(
        '✅ Firebase es la única fuente de datos. localStorage ha sido deshabilitado para evitar inconsistencias.'
      );

      // console.log(`📊 Total de registros encontrados: ${registrosArray.length}`);

      // Si no hay registros, verificar una vez más desde Firebase (pero NO restaurar desde localStorage)
      if (registrosArray.length === 0 && window.firebaseRepos?.logistica) {
        const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
        if (datosLimpios === 'true') {
          console.log(
            '⚠️ Datos operativos fueron limpiados. Firebase está vacío intencionalmente. No se cargará desde localStorage.'
          );
        } else {
          console.log('🔄 No se encontraron registros, verificando Firebase una última vez...');
          try {
            const repoLogistica = window.firebaseRepos.logistica;

            // Intentar inicializar una vez si no está listo
            if (
              typeof repoLogistica.init === 'function' &&
              (!repoLogistica.db || !repoLogistica.tenantId)
            ) {
              try {
                await repoLogistica.init();
              } catch (initError) {
                // Ignorar errores y continuar con fallback
              }
            }

            // Intentar usar Firebase si está disponible
            try {
              if (repoLogistica.db && repoLogistica.tenantId) {
                const firebaseData = await repoLogistica.getAll({
                  limit: 100,
                  useCache: true
                });
                if (firebaseData && firebaseData.length > 0) {
                  registrosArray = firebaseData;
                  // console.log(`✅ ${registrosArray.length} registros cargados directamente desde Firebase`);
                } else {
                  console.log(
                    '✅ Firebase confirmado vacío. No se restaurarán datos desde localStorage.'
                  );
                }
              }
            } catch (error) {
              console.error('❌ Error cargando directamente desde Firebase:', error);
            }
          } catch (error) {
            console.warn('⚠️ Error verificando Firebase:', error);
          }
        }
      }

      // Buscar tabla solo si tenemos registros o necesitamos mostrar mensaje
      const cuerpoTabla = document.getElementById('cuerpoTablaLogistica');
      if (!cuerpoTabla) {
        console.warn('⚠️ Tabla de registros no encontrada. ID buscado: cuerpoTablaLogistica');
        return;
      }

      // console.log('✅ Tabla encontrada, procediendo a mostrar registros...');

      if (registrosArray.length === 0) {
        console.warn('⚠️ No hay registros para mostrar');
        cuerpoTabla.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-muted">
                            <i class="fas fa-inbox"></i> No hay registros de Logística
                        </td>
                    </tr>
                `;
        return;
      }

      // console.log(`🔄 Procesando ${registrosArray.length} registros para mostrar...`);

      // Guardar todos los registros sin filtrar
      window._registrosLogisticaCompletos = [...registrosArray];

      // Ordenar registros por número de registro (más actual al más viejo)
      const registrosOrdenados = registrosArray.sort((a, b) => {
        // Asegurar que sean strings antes de usar replace
        const numeroA = String(a.numeroRegistro || a.id || a.registroId || '');
        const numeroB = String(b.numeroRegistro || b.id || b.registroId || '');

        // Extraer el número del formato 25XXXXX
        const numA = parseInt(numeroA.replace(/[^\d]/g, ''), 10) || 0;
        const numB = parseInt(numeroB.replace(/[^\d]/g, ''), 10) || 0;

        // Ordenar del más alto al más bajo (más actual al más viejo)
        return numB - numA;
      });

      // Inicializar paginación - verificar que PaginacionManager esté disponible
      if (
        typeof PaginacionManager === 'undefined' &&
        typeof window.PaginacionManager === 'undefined'
      ) {
        console.warn(
          '⚠️ PaginacionManager no está disponible aún, cargando registros sin paginación'
        );
        // Mostrar todos los registros si no hay paginación disponible
        cuerpoTabla.innerHTML = registrosOrdenados
          .map(registro => {
            const fechaCreacion = registro.fechaCreacion
              ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
              : 'N/A';

            return `
                        <tr>
                            <td><strong>${registro.numeroRegistro || registro.id || 'N/A'}</strong></td>
                            <td>${fechaCreacion}</td>
                            <td>${typeof obtenerClienteNombre === 'function' ? obtenerClienteNombre(registro.cliente) || registro.cliente || 'N/A' : registro.cliente || 'N/A'}</td>
                            <td>${registro.origen || 'N/A'}</td>
                            <td>${registro.destino || 'N/A'}</td>
                            <td>${registro.referenciaCliente || registro['referencia cliente'] || 'N/A'}</td>
                            <td>
                                <span class="badge ${registro.tipoServicio === 'Urgente' ? 'bg-danger' : 'bg-primary'}">
                                    ${registro.tipoServicio || 'General'}
                                </span>
                            </td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Ver detalles">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFLogistica('${registro.numeroRegistro || registro.id}')" title="Descargar PDF">
                                        <i class="fas fa-file-pdf"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
          })
          .join('');
        // console.log(`✅ ${registrosOrdenados.length} registros de Logística cargados (sin paginación)`);
        return;
      }

      // Usar window.PaginacionManager si PaginacionManager no está disponible directamente
      const PaginacionManagerClass =
        typeof PaginacionManager !== 'undefined'
          ? PaginacionManager
          : typeof window.PaginacionManager !== 'undefined'
            ? window.PaginacionManager
            : null;

      if (!PaginacionManagerClass) {
        console.warn(
          '⚠️ PaginacionManager no está disponible aún, cargando registros sin paginación'
        );
        // Mostrar todos los registros si no hay paginación disponible
        cuerpoTabla.innerHTML = registrosOrdenados
          .map(registro => {
            const fechaCreacion = registro.fechaCreacion
              ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
              : 'N/A';

            return `
                        <tr>
                            <td><strong>${registro.numeroRegistro || registro.id || 'N/A'}</strong></td>
                            <td>${fechaCreacion}</td>
                            <td>${typeof obtenerClienteNombre === 'function' ? obtenerClienteNombre(registro.cliente) || registro.cliente || 'N/A' : registro.cliente || 'N/A'}</td>
                            <td>${registro.origen || 'N/A'}</td>
                            <td>${registro.destino || 'N/A'}</td>
                            <td>${registro.referenciaCliente || registro['referencia cliente'] || 'N/A'}</td>
                            <td>
                                <span class="badge ${registro.tipoServicio === 'Urgente' ? 'bg-danger' : 'bg-primary'}">
                                    ${registro.tipoServicio || 'General'}
                                </span>
                            </td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Ver detalles">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFLogistica('${registro.numeroRegistro || registro.id}')" title="Descargar PDF">
                                        <i class="fas fa-file-pdf"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
          })
          .join('');
        // console.log(`✅ ${registrosOrdenados.length} registros de Logística cargados (sin paginación)`);
        return;
      }

      // Crear o reutilizar instancia de paginación
      // Usar un nombre diferente para evitar conflicto con el ID del elemento HTML
      if (!window._paginacionLogisticaManager) {
        try {
          window._paginacionLogisticaManager = new PaginacionManagerClass();
          // console.log('✅ Nueva instancia de PaginacionManager creada para logistica');
        } catch (error) {
          console.error('❌ Error creando instancia de PaginacionManager:', error);
          // Mostrar todos los registros sin paginación
          if (cuerpoTabla) {
            cuerpoTabla.innerHTML = registrosOrdenados
              .map(registro => {
                const fechaCreacion = registro.fechaCreacion
                  ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
                  : 'N/A';

                return `
                                <tr>
                                    <td><strong>${registro.numeroRegistro || registro.id || 'N/A'}</strong></td>
                                    <td>${fechaCreacion}</td>
                                    <td>${typeof obtenerClienteNombre === 'function' ? obtenerClienteNombre(registro.cliente) || registro.cliente || 'N/A' : registro.cliente || 'N/A'}</td>
                                    <td>${registro.origen || 'N/A'}</td>
                                    <td>${registro.destino || 'N/A'}</td>
                                    <td>${registro.referenciaCliente || registro['referencia cliente'] || 'N/A'}</td>
                                    <td>
                                        <span class="badge ${registro.tipoServicio === 'Urgente' ? 'bg-danger' : 'bg-primary'}">
                                            ${registro.tipoServicio || 'General'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Ver detalles">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Editar">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFLogistica('${registro.numeroRegistro || registro.id}')" title="Descargar PDF">
                                                <i class="fas fa-file-pdf"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
              })
              .join('');
            // console.log(`✅ ${registrosOrdenados.length} registros de Logística cargados (sin paginación)`);
            return;
          }
        }
      }

      // Verificar que el método inicializar exista
      if (
        !window._paginacionLogisticaManager ||
        typeof window._paginacionLogisticaManager.inicializar !== 'function'
      ) {
        console.error('❌ window._paginacionLogisticaManager.inicializar no es una función');
        console.error(
          '❌ Tipo de inicializar:',
          typeof window._paginacionLogisticaManager.inicializar
        );
        console.error(
          '❌ Métodos disponibles:',
          Object.getOwnPropertyNames(window._paginacionLogisticaManager)
        );
        // Mostrar todos los registros sin paginación
        cuerpoTabla.innerHTML = registrosOrdenados
          .map(registro => {
            const fechaCreacion = registro.fechaCreacion
              ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
              : 'N/A';

            return `
                        <tr>
                            <td><strong>${registro.numeroRegistro || registro.id || 'N/A'}</strong></td>
                            <td>${fechaCreacion}</td>
                            <td>${typeof obtenerClienteNombre === 'function' ? obtenerClienteNombre(registro.cliente) || registro.cliente || 'N/A' : registro.cliente || 'N/A'}</td>
                            <td>${registro.origen || 'N/A'}</td>
                            <td>${registro.destino || 'N/A'}</td>
                            <td>${registro.referenciaCliente || registro['referencia cliente'] || 'N/A'}</td>
                            <td>
                                <span class="badge ${registro.tipoServicio === 'Urgente' ? 'bg-danger' : 'bg-primary'}">
                                    ${registro.tipoServicio || 'General'}
                                </span>
                            </td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Ver detalles">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFLogistica('${registro.numeroRegistro || registro.id}')" title="Descargar PDF">
                                        <i class="fas fa-file-pdf"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
          })
          .join('');
        console.log(
          `✅ ${registrosOrdenados.length} registros de Logística cargados (sin paginación - método inicializar no disponible)`
        );
        return;
      }

      // Si llegamos aquí, la paginación está disponible
      try {
        console.log(
          `🔄 Inicializando paginación con ${registrosOrdenados.length} registros (15 por página)...`
        );
        console.log(
          '🔍 window._paginacionLogisticaManager antes de inicializar:',
          window._paginacionLogisticaManager
        );
        console.log(
          '🔍 Tipo de inicializar:',
          typeof window._paginacionLogisticaManager.inicializar
        );

        // Reiniciar a la página 1 para mostrar los registros más recientes
        window._paginacionLogisticaManager.inicializar(registrosOrdenados, 15);
        window._paginacionLogisticaManager.paginaActual = 1; // Asegurar que estemos en la página 1

        // console.log(`✅ Paginación inicializada: ${window._paginacionLogisticaManager.totalRegistros} registros, ${window._paginacionLogisticaManager.obtenerTotalPaginas()} páginas`);

        // Renderizar registros de la página actual
        window.renderizarRegistrosLogistica();
      } catch (error) {
        console.error('❌ Error al inicializar paginación:', error);
        console.error('❌ Stack:', error.stack);
        // Fallback: mostrar todos los registros
        cuerpoTabla.innerHTML = registrosOrdenados
          .map(registro => {
            const fechaCreacion = registro.fechaCreacion
              ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
              : 'N/A';

            return `
                        <tr>
                            <td><strong>${registro.numeroRegistro || registro.id || 'N/A'}</strong></td>
                            <td>${fechaCreacion}</td>
                            <td>${typeof obtenerClienteNombre === 'function' ? obtenerClienteNombre(registro.cliente) || registro.cliente || 'N/A' : registro.cliente || 'N/A'}</td>
                            <td>${registro.origen || 'N/A'}</td>
                            <td>${registro.destino || 'N/A'}</td>
                            <td>${registro.referenciaCliente || registro['referencia cliente'] || 'N/A'}</td>
                            <td>
                                <span class="badge ${registro.tipoServicio === 'Urgente' ? 'bg-danger' : 'bg-primary'}">
                                    ${registro.tipoServicio || 'General'}
                                </span>
                            </td>
                            <td>
                                <div class="btn-group" role="group">
                                    <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Ver detalles">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFLogistica('${registro.numeroRegistro || registro.id}')" title="Descargar PDF">
                                        <i class="fas fa-file-pdf"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
          })
          .join('');
        console.log(
          `✅ ${registrosOrdenados.length} registros de Logística cargados (sin paginación - error en paginación)`
        );
      }
    };
    console.log('✅ Función cargarRegistrosLogistica definida correctamente');
  } else {
    console.warn('⚠️ window.cargarRegistrosLogistica ya estaba definida');
  }

  // Función para renderizar los registros de la página actual
  window.renderizarRegistrosLogistica = function () {
    const cuerpoTabla = document.getElementById('cuerpoTablaLogistica');
    if (!cuerpoTabla) {
      console.warn('⚠️ No se encontró el elemento cuerpoTablaLogistica');
      return;
    }

    if (!window._paginacionLogisticaManager) {
      console.warn('⚠️ window._paginacionLogisticaManager no está disponible');
      return;
    }

    console.log(
      `🔄 Renderizando página ${window._paginacionLogisticaManager.paginaActual} de ${window._paginacionLogisticaManager.obtenerTotalPaginas()}`
    );
    const registrosPagina = window._paginacionLogisticaManager.obtenerRegistrosPagina();
    console.log(
      `📋 Registros de la página actual: ${registrosPagina.length} de ${window._paginacionLogisticaManager.totalRegistros} totales`
    );

    if (registrosPagina.length === 0) {
      cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        <i class="fas fa-inbox"></i> No hay registros de Logística
                    </td>
                </tr>
            `;
      const paginacionContainer = document.getElementById('paginacionLogistica');
      if (paginacionContainer) {
        paginacionContainer.innerHTML = '';
      }
      return;
    }

    cuerpoTabla.innerHTML = registrosPagina
      .map(registro => {
        // Función auxiliar para formatear fecha en formato DD/MM/YYYY sin problemas de zona horaria
        const formatearFechaEnvio = fechaStr => {
          if (!fechaStr) {
            return 'N/A';
          }
          try {
            // Si la fecha está en formato YYYY-MM-DD, parsearla directamente sin conversión de zona horaria
            if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
              const [year, month, day] = fechaStr.split('T')[0].split('-');
              return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
            }
            // Si es otro formato, intentar parsear con Date
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) {
              return 'N/A';
            }
            const day = String(fecha.getDate()).padStart(2, '0');
            const month = String(fecha.getMonth() + 1).padStart(2, '0');
            const year = fecha.getFullYear();
            return `${day}/${month}/${year}`;
          } catch (error) {
            console.warn('⚠️ Error formateando fecha:', fechaStr, error);
            return 'N/A';
          }
        };

        const fechaEnvio = formatearFechaEnvio(registro.fechaEnvio);
        const referenciaCliente =
          registro.referenciaCliente || registro['referencia cliente'] || 'N/A';

        return `
                <tr>
                    <td><strong>${registro.numeroRegistro || registro.id || 'N/A'}</strong></td>
                    <td>${fechaEnvio}</td>
                    <td>${typeof obtenerClienteNombre === 'function' ? obtenerClienteNombre(registro.cliente) || registro.cliente || 'N/A' : registro.cliente || 'N/A'}</td>
                    <td>${registro.origen || 'N/A'}</td>
                    <td>${registro.destino || 'N/A'}</td>
                    <td>${referenciaCliente}</td>
                    <td>
                        <span class="badge ${registro.tipoServicio === 'Urgente' ? 'bg-danger' : 'bg-primary'}">
                            ${registro.tipoServicio || 'General'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-info" onclick="window.verRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Ver detalles">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="window.editarRegistroLogistica('${registro.numeroRegistro || registro.id}')" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary" onclick="window.descargarPDFLogistica('${registro.numeroRegistro || registro.id}')" title="Descargar PDF">
                                <i class="fas fa-file-pdf"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
      })
      .join('');

    // Mostrar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionLogistica');
    if (contenedorPaginacion) {
      contenedorPaginacion.innerHTML =
        window._paginacionLogisticaManager.generarControlesPaginacion(
          'paginacionLogistica',
          'cambiarPaginaLogistica'
        );
    }

    // console.log(`✅ ${window._paginacionLogisticaManager.totalRegistros} registros de Logística cargados (página ${window._paginacionLogisticaManager.paginaActual} de ${window._paginacionLogisticaManager.obtenerTotalPaginas()})`);
  };
})();
