/**
 * Buzón de Pendientes - facturacion.html
 * Funciones para mostrar y gestionar registros pendientes de facturación
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

    // Intentar buscar el nombre del cliente desde configuracionManager usando getAllClientes
    try {
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getAllClientes === 'function'
      ) {
        const clientes = await window.configuracionManager.getAllClientes();
        if (clientes && Array.isArray(clientes)) {
          // Buscar por RFC
          let cliente = clientes.find(c => {
            const rfc = (c.rfc || c.rfcCliente || '').toString().trim();
            return rfc === valor || rfc.toUpperCase() === valor.toUpperCase();
          });

          // Si no se encuentra por RFC, buscar por nombre (por si acaso el valor es un nombre parcial)
          if (!cliente) {
            cliente = clientes.find(c => {
              const nombre = (c.nombre || '').toString().trim();
              return nombre === valor || nombre.includes(valor) || valor.includes(nombre);
            });
          }

          if (cliente && cliente.nombre) {
            console.log(`✅ Nombre del cliente encontrado: ${cliente.nombre} (RFC: ${valor})`);
            return cliente.nombre;
          }
          console.warn(`⚠️ Cliente no encontrado para: ${valor}`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Error obteniendo nombre del cliente:', e);
    }

    // Fallback: intentar buscar en localStorage directamente
    try {
      const clientesData = localStorage.getItem('erp_clientes');
      if (clientesData) {
        const clientes = JSON.parse(clientesData);
        const clientesArray = Array.isArray(clientes) ? clientes : Object.values(clientes);

        // Buscar por RFC
        const cliente = clientesArray.find(c => {
          const rfc = (c.rfc || c.rfcCliente || '').toString().trim();
          return rfc === valor || rfc.toUpperCase() === valor.toUpperCase();
        });

        if (cliente && cliente.nombre) {
          console.log(
            `✅ Nombre del cliente encontrado desde localStorage: ${cliente.nombre} (RFC: ${valor})`
          );
          return cliente.nombre;
        }
      }
    } catch (e) {
      console.warn('⚠️ Error buscando cliente en localStorage:', e);
    }

    // Si parece un RFC pero no se encontró el nombre
    if (/^[A-Z]{3,4}\d{6}[A-Z0-9]{2,3}$/.test(valor)) {
      console.warn(`⚠️ RFC encontrado pero no se pudo obtener el nombre: ${valor}`);
    }

    // Si no se encontró el nombre, devolver el valor original
    return valor;
  }

  /**
   * Función para mostrar buzón de pendientes - Definida temprano para disponibilidad
   */
  window.mostrarBuzonPendientesFacturacion = async function () {
    console.log('🔍 Abriendo buzón de pendientes de Facturación...');

    let registrosPendientes = [];

    try {
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
          }
        } catch (error) {
          console.debug(
            'ℹ️ Error cargando tráfico desde Firebase, usando fallback:',
            error.message
          );
        }
      }

      // Obtener registros de facturación desde Firebase
      let registrosFacturacion = [];
      if (window.firebaseRepos?.facturacion) {
        const repoFacturacion = window.firebaseRepos.facturacion;

        // Intentar inicializar una vez si no está listo
        if (
          typeof repoFacturacion.init === 'function' &&
          (!repoFacturacion.db || !repoFacturacion.tenantId)
        ) {
          try {
            await repoFacturacion.init();
          } catch (e) {
            // Ignorar error intencionalmente
          }
        }

        // Intentar usar Firebase si está disponible
        try {
          if (repoFacturacion.db && repoFacturacion.tenantId) {
            registrosFacturacion = await repoFacturacion.getAllRegistros();
          }
        } catch (error) {
          console.debug(
            'ℹ️ Error cargando facturación desde Firebase, usando fallback:',
            error.message
          );
        }
      }

      // Calcular pendientes: registros en tráfico que NO están en facturación
      // Usar múltiples campos para identificar registros
      const idsFacturacion = new Set();
      registrosFacturacion.forEach(r => {
        const id = String(
          r.numeroRegistro || r.id || r.registroId || r.numeroRegistroFacturacion || ''
        );
        if (id) {
          idsFacturacion.add(id);
        }
      });

      registrosPendientes = registrosTrafico.filter(r => {
        const regId = String(
          r.numeroRegistro || r.id || r.registroId || r.numeroRegistroTrafico || ''
        );
        return regId && !idsFacturacion.has(regId);
      });

      console.log(
        `📊 Registros pendientes en Facturación: ${registrosPendientes.length} (Tráfico: ${registrosTrafico.length}, Facturación: ${registrosFacturacion.length})`
      );

      if (registrosPendientes.length === 0) {
        alert(
          '✅ No hay registros pendientes en Facturación.\n\nTodos los registros de tráfico han sido procesados en facturación.'
        );
        return;
      }
    } catch (error) {
      console.error('❌ Error obteniendo pendientes:', error);
      alert('❌ Error al obtener registros pendientes.');
      return;
    }

    // Crear modal para mostrar registros pendientes de facturación
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalBuzonPendientesFacturacion';

    // Generar contenido del modal de forma asíncrona
    const cardsHTML = await Promise.all(
      registrosPendientes.map(async registro => {
        // Priorizar nombreCliente si existe, luego cliente, luego rfcCliente
        const clienteValue = registro.nombreCliente || registro.cliente || registro.rfcCliente;
        const nombreCliente = await obtenerClienteNombre(clienteValue);
        const regId = registro.numeroRegistro || registro.id || registro.registroId;

        // Obtener información adicional del registro
        const origen = registro.origen || registro.LugarOrigen || 'N/A';
        const destino = registro.destino || registro.LugarDestino || 'N/A';
        const fechaCreacion = registro.fechaCreacion
          ? new Date(registro.fechaCreacion).toLocaleDateString('es-ES')
          : 'N/A';
        const tipoServicio = registro.tipoServicio || registro.TipoServicio || 'N/A';

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
                                    <i class="fas fa-map-marker-alt"></i> ${origen} → ${destino}
                                    <br>
                                    <i class="fas fa-truck"></i> Tipo de Servicio: ${tipoServicio}
                                    <br>
                                    <i class="fas fa-calendar"></i> ${fechaCreacion}
                                </p>
                            </div>
                            <div class="col-md-4 text-end">
                                <span class="badge bg-warning mb-2">Pendiente en Facturación</span>
                                <br>
                                <button class="btn btn-sm btn-primary" onclick="window.seleccionarRegistroFacturacion('${regId}')">
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
                            <i class="fas fa-file-invoice"></i>
                            Registros Pendientes - Facturación
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="fas fa-info-circle"></i>
                            <strong>${registrosPendientes.length}</strong> registros pendientes de procesar en Facturación
                            <br><small>Estos registros ya fueron completados en Tráfico y están listos para facturar.</small>
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

  console.log('✅ Función mostrarBuzonPendientesFacturacion definida temprano');

  /**
   * Función para seleccionar un registro del buzón y cargarlo en facturación
   */
  window.seleccionarRegistroFacturacion = function (numeroRegistro) {
    console.log('📋 Seleccionando registro para facturación:', numeroRegistro);

    // Cerrar el modal
    const modalElement = document.getElementById('modalBuzonPendientesFacturacion');
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
      // Disparar evento input para asegurar que los listeners se activen
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Buscar y cargar los datos automáticamente
    // Usar setTimeout para asegurar que el valor se haya establecido en el campo
    setTimeout(() => {
      // Verificar que el valor esté en el campo antes de buscar
      const valorEnCampo = numeroRegistroInput?.value?.trim();
      if (!valorEnCampo) {
        console.warn('⚠️ El valor no se estableció en el campo, reintentando...');
        if (numeroRegistroInput) {
          numeroRegistroInput.value = numeroRegistro;
        }
      }

      // Intentar usar la función de búsqueda y llenado de datos
      // Pasar el número de registro como parámetro
      if (typeof window.safeSearchAndFillData === 'function') {
        window.safeSearchAndFillData(numeroRegistro);
      } else if (typeof window.buscarDatosConValidacion === 'function') {
        // buscarDatosConValidacion lee del campo, así que solo llamarlo si el campo tiene valor
        if (numeroRegistroInput && numeroRegistroInput.value.trim()) {
          window.buscarDatosConValidacion();
        }
      } else if (typeof window.searchAndFillData === 'function') {
        window.searchAndFillData(numeroRegistro);
      }
    }, 150);

    console.log('✅ Registro seleccionado y datos cargados en facturación');
  };
})();
