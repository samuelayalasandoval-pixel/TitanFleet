/**
 * Buzón de Pendientes - trafico.html
 * Funciones para mostrar y gestionar registros pendientes de tráfico
 */

(function () {
  'use strict';

  /**
   * Función helper para obtener nombre del cliente por RFC
   */
  async function obtenerClienteNombre(rfcOCliente) {
    if (!rfcOCliente) {
      return 'N/A';
    }

    const valor = String(rfcOCliente).trim();

    // Si el valor ya parece un nombre completo (contiene espacios y no es solo RFC), devolverlo directamente
    if (valor.includes(' ') && valor.length > 15) {
      console.log(`✅ Valor ya es nombre completo: ${valor}`);
      return valor;
    }

    // Esperar a que configuracionManager esté disponible (máximo 2 segundos)
    let intentos = 0;
    const maxIntentos = 20;
    while (!window.configuracionManager && intentos < maxIntentos) {
      await new Promise(resolve => setTimeout(resolve, 100));
      intentos++;
    }

    // Intentar buscar el nombre del cliente desde configuracionManager usando getAllClientes
    try {
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getAllClientes === 'function'
      ) {
        console.log(`🔍 Buscando cliente para RFC: ${valor}`);
        const clientes = await window.configuracionManager.getAllClientes();
        console.log(`📊 Clientes disponibles desde configuracionManager: ${clientes?.length || 0}`);

        if (clientes && Array.isArray(clientes) && clientes.length > 0) {
          // Buscar por RFC
          let cliente = clientes.find(c => {
            const rfc = (c.rfc || c.rfcCliente || '').toString().trim();
            return rfc === valor || rfc.toUpperCase() === valor.toUpperCase();
          });

          // Si no se encuentra por RFC, buscar por nombre (por si acaso el valor es un nombre parcial)
          if (!cliente) {
            cliente = clientes.find(c => {
              const nombre = (c.nombre || c.nombreCliente || '').toString().trim();
              return nombre === valor || nombre.includes(valor) || valor.includes(nombre);
            });
          }

          if (cliente && (cliente.nombre || cliente.nombreCliente)) {
            const nombreCliente = cliente.nombre || cliente.nombreCliente;
            console.log(`✅ Nombre del cliente encontrado: ${nombreCliente} (RFC: ${valor})`);
            return nombreCliente;
          }
          console.warn(
            `⚠️ Cliente no encontrado para: ${valor} (${clientes.length} clientes disponibles)`
          );
        } else {
          console.warn('⚠️ No hay clientes disponibles desde configuracionManager');
        }
      } else {
        console.warn('⚠️ configuracionManager no disponible o getAllClientes no es una función');
      }
    } catch (e) {
      console.warn('⚠️ Error obteniendo nombre del cliente desde configuracionManager:', e);
    }

    // Fallback: intentar buscar en Firebase directamente
    try {
      if (window.firebaseDb && window.fs) {
        console.log(`🔍 Buscando cliente en Firebase para RFC: ${valor}`);
        // La estructura es configuracion/clientes como documento, no colección
        const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
        const clientesDoc = await window.fs.getDoc(clientesDocRef);

        if (clientesDoc.exists()) {
          const data = clientesDoc.data();
          if (data.clientes && Array.isArray(data.clientes)) {
            const cliente = data.clientes.find(c => {
              const rfc = (c.rfc || c.rfcCliente || '').toString().trim();
              return rfc === valor || rfc.toUpperCase() === valor.toUpperCase();
            });

            if (cliente && (cliente.nombre || cliente.nombreCliente)) {
              const nombreCliente = cliente.nombre || cliente.nombreCliente;
              console.log(
                `✅ Nombre del cliente encontrado desde Firebase: ${nombreCliente} (RFC: ${valor})`
              );
              return nombreCliente;
            }
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Error buscando cliente en Firebase:', e);
    }

    // Fallback: intentar buscar usando sistema de caché
    try {
      const clientes = await window.getDataWithCache('clientes', async () => {
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllClientes === 'function'
        ) {
          return window.configuracionManager.getAllClientes() || [];
        }
        return [];
      });

      const clientesArray = Array.isArray(clientes) ? clientes : Object.values(clientes || {});

      // Buscar por RFC
      const cliente = clientesArray.find(c => {
        const rfc = (c.rfc || c.rfcCliente || '').toString().trim();
        return rfc === valor || rfc.toUpperCase() === valor.toUpperCase();
      });

      if (cliente && (cliente.nombre || cliente.nombreCliente)) {
        const nombreCliente = cliente.nombre || cliente.nombreCliente;
        console.log(
          `✅ Nombre del cliente encontrado desde sistema de caché: ${nombreCliente} (RFC: ${valor})`
        );
        return nombreCliente;
      }
    } catch (e) {
      console.warn('⚠️ Error buscando cliente en localStorage:', e);
    }

    // Si parece un RFC pero no se encontró el nombre
    if (/^[A-Z]{3,4}\d{6}[A-Z0-9]{2,3}$/.test(valor)) {
      console.warn(`⚠️ RFC encontrado pero no se pudo obtener el nombre: ${valor}`);
    }

    // Si no se encontró el nombre, devolver el valor original
    console.warn(`⚠️ No se encontró nombre del cliente para: ${valor}, devolviendo RFC`);
    return valor;
  }

  // Exponer función globalmente para uso en otros módulos
  window.obtenerClienteNombre = obtenerClienteNombre;

  /**
   * Función helper para obtener nombre del operador
   */
  async function obtenerOperadorNombre(valorOperador) {
    if (!valorOperador || valorOperador === 'N/A' || valorOperador === '-') {
      return 'N/A';
    }

    // Si el valor contiene " - ", extraer solo el nombre (parte antes del " - ")
    if (valorOperador.includes(' - ')) {
      const nombre = valorOperador.split(' - ')[0].trim();
      if (nombre) {
        return nombre;
      }
    }

    // Si el valor parece ser solo un nombre (no contiene caracteres que sugieran un ID)
    // y no es muy corto, probablemente ya es el nombre
    if (valorOperador.length > 3 && !valorOperador.match(/^[A-Z0-9-]+$/)) {
      return valorOperador;
    }

    // Buscar el operador en el caché
    const operadoresCache = window.ERPState?.getCache('operadores') || [];
    const operador = operadoresCache.find(op => {
      const nombre = (op.nombre || '').toString().trim();
      const id = (op.id || '').toString().trim();
      const licencia = (op.licencia || op.numeroLicencia || '').toString().trim();

      return (
        nombre === valorOperador ||
        id === valorOperador ||
        licencia === valorOperador ||
        nombre.includes(valorOperador) ||
        valorOperador.includes(nombre)
      );
    });

    if (operador && operador.nombre) {
      return operador.nombre;
    }

    // Si no se encuentra, devolver el valor original
    return valorOperador;
  }

  // Exponer función globalmente para uso en otros módulos
  window.obtenerOperadorNombre = obtenerOperadorNombre;

  /**
   * Función para mostrar buzón de pendientes - Definida temprano para disponibilidad
   */
  window.mostrarBuzonPendientesTrafico = async function () {
    console.log('🔍 Abriendo buzón de pendientes...');

    let registrosPendientes = [];

    try {
      // Obtener registros de logística desde Firebase
      let registrosLogistica = [];
      if (window.firebaseRepos?.logistica) {
        const repoLogistica = window.firebaseRepos.logistica;

        // Intentar inicializar una vez si no está listo
        if (
          typeof repoLogistica.init === 'function' &&
          (!repoLogistica.db || !repoLogistica.tenantId)
        ) {
          try {
            await repoLogistica.init();
          } catch (e) {
            // Ignorar error intencionalmente
          }
        }

        // Intentar usar Firebase si está disponible
        try {
          if (repoLogistica.db && repoLogistica.tenantId) {
            registrosLogistica = await repoLogistica.getAllRegistros();
            console.log(`📊 Registros de logística desde repo: ${registrosLogistica.length}`);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando logística desde repo:', error.message);
        }
      }

      // Si no se obtuvieron registros desde el repo, intentar Firebase directamente
      if (registrosLogistica.length === 0 && window.firebaseDb && window.fs) {
        try {
          console.log(
            '🔄 Intentando obtener registros de logística directamente desde Firebase...'
          );
          const logisticaRef = window.fs.collection(window.firebaseDb, 'logistica');
          const logisticaSnapshot = await window.fs.getDocs(logisticaRef);
          registrosLogistica = logisticaSnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                numeroRegistro: data.numeroRegistro || data.registroId || doc.id
              };
            })
            .filter(r => !r.deleted); // Filtrar eliminados
          console.log(
            `📊 Registros de logística desde Firebase directo: ${registrosLogistica.length}`
          );
        } catch (error) {
          console.warn('⚠️ Error cargando logística desde Firebase directo:', error.message);
        }
      }

      // Obtener registros de tráfico desde Firebase
      let registrosTrafico = [];
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
            registrosTrafico = await repoTrafico.getAllRegistros();
            console.log(`📊 Registros de tráfico desde repo: ${registrosTrafico.length}`);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando tráfico desde repo:', error.message);
        }
      }

      // Si no se obtuvieron registros desde el repo, intentar Firebase directamente
      if (registrosTrafico.length === 0 && window.firebaseDb && window.fs) {
        try {
          console.log('🔄 Intentando obtener registros de tráfico directamente desde Firebase...');
          const traficoRef = window.fs.collection(window.firebaseDb, 'trafico');
          const traficoSnapshot = await window.fs.getDocs(traficoRef);
          registrosTrafico = traficoSnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                numeroRegistro: data.numeroRegistro || data.registroId || doc.id
              };
            })
            .filter(r => !r.deleted); // Filtrar eliminados
          console.log(`📊 Registros de tráfico desde Firebase directo: ${registrosTrafico.length}`);
        } catch (error) {
          console.warn('⚠️ Error cargando tráfico desde Firebase directo:', error.message);
        }
      }

      // Calcular pendientes: registros en logística que NO están en tráfico
      console.log(`📊 Registros de logística obtenidos: ${registrosLogistica.length}`);
      console.log(`📊 Registros de tráfico obtenidos: ${registrosTrafico.length}`);

      // Extraer IDs de logística para debugging
      const idsLogistica = new Set();
      registrosLogistica.forEach(r => {
        const id = String(r.numeroRegistro || r.id || r.registroId || '').trim();
        if (id) {
          idsLogistica.add(id);
        }
      });
      console.log(
        `📊 IDs únicos de logística: ${idsLogistica.size}`,
        Array.from(idsLogistica).slice(0, 5)
      );

      // Extraer IDs de tráfico - convertir a string para comparación consistente
      const idsTrafico = new Set();
      registrosTrafico.forEach(r => {
        const id = String(r.numeroRegistro || r.id || r.registroId || '').trim();
        if (id) {
          idsTrafico.add(id);
        }
      });
      console.log(
        `📊 IDs únicos de tráfico: ${idsTrafico.size}`,
        Array.from(idsTrafico).slice(0, 5)
      );

      // Filtrar pendientes: registros en logística que NO están en tráfico
      registrosPendientes = registrosLogistica.filter(r => {
        const regId = String(r.numeroRegistro || r.id || r.registroId || '').trim();
        if (!regId) {
          console.warn('⚠️ Registro de logística sin ID:', r);
          return false;
        }
        const esPendiente = !idsTrafico.has(regId);
        if (esPendiente) {
          console.log(`📋 Registro pendiente encontrado: ${regId}`);
        } else {
          console.log(`✅ Registro ya procesado en tráfico: ${regId}`);
        }
        return esPendiente;
      });

      console.log(`📊 Registros pendientes calculados: ${registrosPendientes.length}`);
      if (registrosPendientes.length > 0) {
        console.log(
          '📋 IDs pendientes:',
          registrosPendientes
            .map(r => String(r.numeroRegistro || r.id || r.registroId || '').trim())
            .slice(0, 5)
        );
      } else {
        console.warn('⚠️ No se encontraron registros pendientes. Verificando datos...');
        console.log('📋 IDs de logística:', Array.from(idsLogistica));
        console.log('📋 IDs de tráfico:', Array.from(idsTrafico));
        console.log(
          '📋 Diferencia (logística - tráfico):',
          Array.from(idsLogistica).filter(id => !idsTrafico.has(id))
        );
      }

      if (registrosPendientes.length === 0) {
        alert(
          '✅ No hay registros pendientes en Tráfico.\n\nTodos los registros de logística han sido procesados en tráfico.'
        );
        return;
      }
    } catch (error) {
      console.error('❌ Error obteniendo pendientes:', error);
      alert('❌ Error al obtener registros pendientes.');
      return;
    }

    // Crear modal para mostrar registros pendientes de tráfico
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalBuzonPendientesTrafico';

    // Generar contenido del modal de forma asíncrona
    const cardsHTML = await Promise.all(
      registrosPendientes.map(async registro => {
        // Priorizar nombreCliente si existe, luego cliente, luego rfcCliente
        const clienteValue = registro.nombreCliente || registro.cliente || registro.rfcCliente;
        const nombreCliente = await obtenerClienteNombre(clienteValue);
        const regId = registro.numeroRegistro || registro.id || registro.registroId;

        return `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h6 class="card-title mb-1">
                                    <i class="fas fa-hashtag"></i>
                                    Registro: ${regId}
                                </h6>
                                <p class="card-text text-muted mb-0">
                                    <i class="fas fa-user"></i> Cliente: ${nombreCliente}
                                    <br>
                                    <i class="fas fa-map-marker-alt"></i> ${registro.origen || 'N/A'} → ${registro.destino || 'N/A'}
                                    <br>
                                    <i class="fas fa-calendar"></i> ${registro.fechaCreacion ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES') : 'N/A'}
                                </p>
                            </div>
                            <div class="col-md-4 text-end">
                                <span class="badge bg-warning mb-2">Pendiente en Tráfico</span>
                                <br>
                                <button class="btn btn-sm btn-primary" onclick="window.seleccionarRegistroTrafico('${regId}')">
                                    <i class="fas fa-arrow-right"></i> Seleccionar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
    );

    modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title text-white">
                            <i class="fas fa-route"></i>
                            Registros Pendientes - Tráfico
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="fas fa-info-circle"></i>
                            <strong>${registrosPendientes.length}</strong> registros pendientes de procesar en Tráfico
                            <br><small>Estos registros ya fueron completados en Logística y están listos para procesar.</small>
                        </div>
                        
                        <div class="registros-pendientes" style="max-height: 400px; overflow-y: auto;">
                            ${cardsHTML.join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } else {
      console.error('❌ Bootstrap Modal no está disponible');
      // Fallback: mostrar modal manualmente
      modal.style.display = 'block';
      modal.classList.add('show');
      modal.setAttribute('aria-modal', 'true');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
      console.warn('⚠️ Modal mostrado manualmente (Bootstrap no disponible)');
    }

    // Limpiar modal cuando se cierre
    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  };

  console.log('✅ Función mostrarBuzonPendientesTrafico definida temprano');
  console.log(
    '✅ Verificación: typeof window.mostrarBuzonPendientesTrafico =',
    typeof window.mostrarBuzonPendientesTrafico
  );

  // Disparar evento personalizado para notificar que la función está disponible
  document.dispatchEvent(
    new CustomEvent('mostrarBuzonPendientesTraficoReady', {
      detail: { function: window.mostrarBuzonPendientesTrafico }
    })
  );

  /**
   * Función para seleccionar un registro del buzón y cargarlo en tráfico
   */
  window.seleccionarRegistroTrafico = function (numeroRegistro) {
    console.log('📋 Seleccionando registro:', numeroRegistro);

    // Cerrar el modal
    const modalElement = document.getElementById('modalBuzonPendientesTrafico');
    if (modalElement) {
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
          modal.hide();
        } else {
          // Si no hay instancia, intentar cerrar manualmente
          modalElement.style.display = 'none';
          modalElement.classList.remove('show');
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) {
            backdrop.remove();
          }
        }
      } else {
        // Fallback: cerrar modal manualmente
        modalElement.style.display = 'none';
        modalElement.classList.remove('show');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.remove();
        }
        console.warn('⚠️ Modal cerrado manualmente (Bootstrap no disponible)');
      }
    }

    // Poner el número en el campo
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (numeroRegistroInput) {
      numeroRegistroInput.value = numeroRegistro;
      // Disparar eventos para que los listeners se activen
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`✅ Número de registro establecido: ${numeroRegistro}`);
    } else {
      console.error('❌ Campo numeroRegistro no encontrado');
    }

    // Esperar a que buscarDatosConValidacion esté disponible
    const buscarYLLenarDatos = async () => {
      // Esperar hasta 5 segundos a que la función esté disponible
      let intentos = 0;
      const maxIntentos = 50; // 5 segundos

      while (intentos < maxIntentos) {
        if (typeof window.buscarDatosConValidacion === 'function') {
          console.log('🔄 Ejecutando buscarDatosConValidacion...');
          try {
            await window.buscarDatosConValidacion();
            console.log('✅ Registro seleccionado y datos cargados');
            return;
          } catch (error) {
            console.error('❌ Error ejecutando buscarDatosConValidacion:', error);
            break;
          }
        }

        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
      }

      // Si no está disponible después de esperar, intentar fallbacks
      console.warn('⚠️ buscarDatosConValidacion no está disponible después de esperar');

      // Fallback: intentar con searchAndFillData
      if (typeof window.searchAndFillData === 'function') {
        console.log('🔄 Intentando con searchAndFillData...');
        try {
          await window.searchAndFillData(numeroRegistro);
          console.log('✅ Datos cargados usando searchAndFillData');
          return;
        } catch (error) {
          console.error('❌ Error con searchAndFillData:', error);
        }
      }

      // Fallback: intentar con safeSearchAndFillData
      if (typeof window.safeSearchAndFillData === 'function') {
        console.log('🔄 Intentando con safeSearchAndFillData...');
        try {
          await window.safeSearchAndFillData(numeroRegistro);
          console.log('✅ Datos cargados usando safeSearchAndFillData');
          return;
        } catch (error) {
          console.error('❌ Error con safeSearchAndFillData:', error);
        }
      }

      console.error('❌ Ninguna función de búsqueda disponible');
      if (typeof window.showNotification === 'function') {
        window.showNotification(
          'Error: No se pudieron cargar los datos automáticamente. Por favor, busca el registro manualmente.',
          'error'
        );
      }
    };

    // Esperar un momento para que el campo se actualice, luego buscar datos
    setTimeout(() => {
      buscarYLLenarDatos();
    }, 300);
  };
})();
