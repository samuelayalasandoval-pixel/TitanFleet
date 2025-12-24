/**
 * Funciones de InicializaciÃ³n y Utilidades - trafico.html
 * Funciones para inicializar y utilidades generales
 *
 * @module trafico/init-utils
 */

(function () {
  'use strict';
  window.inicializarRegistrosSincronizacion = function () {
    console.log('ðŸ”„ === INICIALIZANDO REGISTROS EN SINCRONIZACIÃ“N ===');

    if (typeof window.sincronizacionUtils === 'undefined') {
      console.error('âŒ SincronizacionUtils no disponible');
      return false;
    }

    // Obtener registros de logÃ­stica
    const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '[]');
    console.log('ðŸ“Š Registros de logÃ­stica encontrados:', logisticaData.length);

    let inicializados = 0;
    let marcadosLogistica = 0;

    // Inicializar cada registro de logÃ­stica
    logisticaData.forEach(registro => {
      const registroId = registro.numeroRegistro || registro.id;
      if (!registroId) {return;}

      // Inicializar registro en sincronizaciÃ³n
      window.sincronizacionUtils.initRegistro(registroId, ['logistica', 'trafico', 'facturacion']);
      inicializados++;

      // Marcar logÃ­stica como completado (ya que viene de logÃ­stica)
      window.sincronizacionUtils.marcarCompletado(registroId, 'logistica');
      marcadosLogistica++;
    });

    console.log('ðŸ“Š Resumen de inicializaciÃ³n:');
    console.log(`   - Registros inicializados: ${inicializados}`);
    console.log(`   - Registros completados en logÃ­stica: ${marcadosLogistica}`);

    // Actualizar contadores
    setTimeout(() => {
      window.sincronizacionUtils.actualizarContadoresBuzon();
      console.log('ðŸ”„ Contadores actualizados');
    }, 500);

    console.log('ðŸ”„ === INICIALIZACIÃ“N COMPLETADA ===');
    return true;
  };

  window.actualizarContador = async function () {
    try {
      let pendientesCount = 0;

      // Obtener registros de logÃ­stica desde Firebase
      let registrosLogistica = [];
      if (window.firebaseRepos?.logistica) {
        try {
          const repoLogistica = window.firebaseRepos.logistica;

          // Intentar inicializar una vez si no estÃ¡ listo
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

          // Intentar usar Firebase si estÃ¡ disponible
          try {
            if (repoLogistica.db && repoLogistica.tenantId) {
              registrosLogistica = await repoLogistica.getAllRegistros();
            }
          } catch (e) {
            console.warn('âš ï¸ Error cargando logÃ­stica desde Firebase:', e);
          }
        } catch (e) {
          console.warn('âš ï¸ Error accediendo repositorio logÃ­stica:', e);
        }
      }

      // Obtener registros de trÃ¡fico desde Firebase
      let registrosTrafico = [];
      if (window.firebaseRepos?.trafico) {
        try {
          const repoTrafico = window.firebaseRepos.trafico;

          // Intentar inicializar una vez si no estÃ¡ listo
          if (
            typeof repoTrafico.init === 'function' &&
            (!repoTrafico.db || !repoTrafico.tenantId)
          ) {
            try {
              await repoTrafico.init();
            } catch (e) {
              // Ignorar error intencionalmente
            }
          }

          // Intentar usar Firebase si estÃ¡ disponible
          try {
            if (repoTrafico.db && repoTrafico.tenantId) {
              registrosTrafico = await repoTrafico.getAllRegistros();
            }
          } catch (e) {
            console.warn('âš ï¸ Error cargando trÃ¡fico desde Firebase:', e);
          }
        } catch (e) {
          console.warn('âš ï¸ Error accediendo repositorio trÃ¡fico:', e);
        }
      }

      // Calcular pendientes: registros en logÃ­stica que NO estÃ¡n en trÃ¡fico
      const idsTrafico = new Set(registrosTrafico.map(r => r.id || r.numeroRegistro));
      const pendientes = registrosLogistica.filter(r => !idsTrafico.has(r.id || r.numeroRegistro));
      pendientesCount = pendientes.length;

      console.log(
        `ðŸ“Š Pendientes en trÃ¡fico: ${pendientesCount} (LogÃ­stica: ${registrosLogistica.length}, TrÃ¡fico: ${registrosTrafico.length})`
      );

      // Actualizar contador en el DOM
      const contador = document.getElementById('contadorPendientesTrafico');
      if (contador) {
        contador.textContent = pendientesCount;
        contador.className = `badge ${  pendientesCount > 0 ? 'bg-warning' : 'bg-success'}`;
      }

      return pendientesCount;
    } catch (error) {
      console.error('âŒ Error actualizando contador:', error);
      return 0;
    }
  };

  async function _obtenerClienteNombre(rfc) {
    if (!rfc) {return '';}

    // Buscar en Firebase en configuracion/clientes (estructura nueva)
    if (window.firebaseDb && window.fs) {
      try {
        const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
        const clientesDoc = await window.fs.getDoc(clientesDocRef);

        if (clientesDoc.exists()) {
          const data = clientesDoc.data();
          if (data.clientes && Array.isArray(data.clientes)) {
            const cliente = data.clientes.find(c => c.rfc === rfc);
            if (cliente && (cliente.nombre || cliente.razonSocial)) {
              return cliente.nombre || cliente.razonSocial || '';
            }
          }
        }
      } catch (e) {
        console.warn('âš ï¸ Error buscando cliente en Firebase:', e);
      }
    }

    // Fallback a localStorage
    try {
      if (
        window.configuracionManager &&
        typeof window.configuracionManager.getCliente === 'function'
      ) {
        const c = window.configuracionManager.getCliente(rfc);
        if (c && (c.nombre || c.razonSocial)) {return c.nombre || c.razonSocial || '';}
      }
    } catch {}

    // Usar sistema de caché como último fallback
    try {
      const clientes = await window.getDataWithCache('clientes', async () => {
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllClientes === 'function'
        ) {
          const todosLosClientes = window.configuracionManager.getAllClientes() || [];

          // Obtener tenantId actual
          let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          if (window.licenseManager && window.licenseManager.isLicenseActive()) {
            const licenseTenantId = window.licenseManager.getTenantId();
            if (licenseTenantId) {tenantId = licenseTenantId;}
          } else {
            const savedTenantId = localStorage.getItem('tenantId');
            if (savedTenantId) {tenantId = savedTenantId;}
          }

          // CRÍTICO: Filtrar por tenantId
          return todosLosClientes.filter(cliente => {
            const clienteTenantId = cliente.tenantId;
            return clienteTenantId === tenantId;
          });
        }
        return [];
      });

      if (clientes && Array.isArray(clientes)) {
        const c = clientes.find(cl => cl.rfc === rfc);
        if (c && (c.nombre || c.razonSocial)) {return c.nombre || c.razonSocial || '';}
      } else if (clientes && typeof clientes === 'object') {
        const c = clientes[rfc];
        if (c && (c.nombre || c.razonSocial)) {return c.nombre || c.razonSocial || '';}
      }
    } catch {}

    return rfc; // Si no se encuentra, retornar el RFC
  }

  async function _obtenerOperadorNombre(valorOperador) {
    if (!valorOperador || valorOperador === 'N/A' || valorOperador === '-') {return 'N/A';}

    // Si el valor contiene " - ", extraer solo el nombre (parte antes del " - ")
    if (valorOperador.includes(' - ')) {
      const nombre = valorOperador.split(' - ')[0].trim();
      if (nombre) {return nombre;}
    }

    // Si el valor parece ser solo un nombre (no contiene caracteres que sugieran un ID)
    // y no es muy corto, probablemente ya es el nombre
    if (valorOperador.length > 3 && !valorOperador.match(/^[A-Z0-9-]+$/)) {
      return valorOperador;
    }

    // Buscar el operador en Firebase primero
    if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
      try {
        const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
        const querySnapshot = await window.fs.getDocs(
          window.fs.query(
            operadoresRef,
            window.fs.where(
              'tenantId',
              '==',
              window.firebaseAuth?.currentUser?.uid || window.DEMO_CONFIG?.tenantId || 'demo_tenant'
            ),
            window.fs.where('nombre', '==', valorOperador)
          )
        );

        if (!querySnapshot.empty) {
          const operador = querySnapshot.docs[0].data();
          if (operador && operador.nombre) {return operador.nombre;}
        }

        // Si no se encuentra por nombre, buscar por ID o licencia
        const querySnapshot2 = await window.fs.getDocs(
          window.fs.query(
            operadoresRef,
            window.fs.where(
              'tenantId',
              '==',
              window.firebaseAuth?.currentUser?.uid || 'demo_tenant'
            )
          )
        );

        if (!querySnapshot2.empty) {
          const operador = querySnapshot2.docs.find(doc => {
            const data = doc.data();
            return (
              data.id === valorOperador ||
              data.licencia === valorOperador ||
              data.numeroLicencia === valorOperador ||
              (data.nombre && data.nombre.includes(valorOperador))
            );
          });
          if (operador && operador.data() && operador.data().nombre) {
            return operador.data().nombre;
          }
        }
      } catch (e) {
        console.warn('âš ï¸ Error buscando operador en Firebase:', e);
      }
    }

    // Fallback a configuracionManager
    try {
      if (window.configuracionManager) {
        const operadores = await window.configuracionManager.getAllOperadores();
        if (operadores && Array.isArray(operadores)) {
          const operador = operadores.find(
            o =>
              o.nombre === valorOperador ||
              o.id === valorOperador ||
              o.licencia === valorOperador ||
              o.numeroLicencia === valorOperador ||
              (o.nombre && o.nombre.includes(valorOperador))
          );
          if (operador && operador.nombre) {return operador.nombre;}
        }
      }
    } catch {}

    // Fallback usando sistema de caché
    try {
      const operadores = await window.getDataWithCache('operadores', async () => {
        if (
          window.configuracionManager &&
          typeof window.configuracionManager.getAllOperadores === 'function'
        ) {
          const ops = window.configuracionManager.getAllOperadores() || [];
          return Array.isArray(ops) ? ops : Object.values(ops);
        }
        return [];
      });

      const operadoresArray = Array.isArray(operadores)
        ? operadores
        : Object.values(operadores || {});
      const operador = operadoresArray.find(
        o =>
          o &&
          (o.nombre === valorOperador ||
            o.id === valorOperador ||
            o.licencia === valorOperador ||
            o.numeroLicencia === valorOperador ||
            (o.nombre && o.nombre.includes(valorOperador)))
      );
      if (operador && operador.nombre) {return operador.nombre;}
    } catch {}

    // Si no se encuentra, retornar el valor original si parece un nombre, o 'N/A'
    return valorOperador.length > 3 ? valorOperador : 'N/A';
  }

  window.cargarRegistroEnTrafico = function (registroId) {
    console.log('ðŸ”„ Cargando registro en trÃ¡fico:', registroId);

    // Verificar si el registro existe en LogÃ­stica (requisito para procesarlo)
    const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '{}');
    const registroEnLogistica = logisticaData[registroId];

    if (!registroEnLogistica) {
      console.log('âŒ Registro no existe en LogÃ­stica');
      alert(
        `El registro ${registroId} no puede procesarse porque no existe en LogÃ­stica.\n\nPrimero debe crearse en el mÃ³dulo de LogÃ­stica.`
      );
      return;
    }

    console.log('âœ… Registro vÃ¡lido para procesar en TrÃ¡fico - existe en LogÃ­stica');

    // Llenar el campo de nÃºmero de registro
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (numeroRegistroInput) {
      numeroRegistroInput.value = registroId;
      // Disparar eventos para que los listeners se activen
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
      numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
      // Actualizar header
      if (typeof window.updateHeaderRegistrationNumber === 'function') {
        window.updateHeaderRegistrationNumber(registroId);
        console.log('✅ Header actualizado desde buzón de pendientes con:', registroId);
      }
    }

    // Buscar y llenar datos automÃ¡ticamente solo si no fue procesado en TrÃ¡fico
    if (typeof window.searchAndFillData === 'function') {
      window.searchAndFillData(registroId);
    } else if (typeof window.safeSearchAndFillData === 'function') {
      window.safeSearchAndFillData(registroId);
    }

    // Cerrar el modal
    const modal = document.getElementById('modalBuzonPendientesTrafico');
    if (modal) {
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        } else {
          // Si no hay instancia, intentar cerrar manualmente
          modal.style.display = 'none';
          modal.classList.remove('show');
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) {backdrop.remove();}
        }
      } else {
        // Fallback: cerrar modal manualmente
        modal.style.display = 'none';
        modal.classList.remove('show');
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {backdrop.remove();}
        console.warn('âš ï¸ Modal cerrado manualmente (Bootstrap no disponible)');
      }
    }

    // Mostrar notificaciÃ³n
    if (typeof window.showNotification === 'function') {
      window.showNotification(`Registro ${registroId} cargado en trÃ¡fico`, 'success');
    }
  };

  window.mostrarVistaDependencias = function (registroId) {
    if (typeof window.sincronizacionUtils === 'undefined') {
      alert('Sistema de sincronizaciÃ³n no estÃ¡ disponible');
      return;
    }

    const estado = window.sincronizacionUtils.getRegistroStatus(registroId);
    if (!estado) {
      alert(`No se encontrÃ³ informaciÃ³n del registro ${  registroId}`);
      return;
    }

    // Crear modal para mostrar dependencias
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'modalVistaDependencias';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-info text-white">
              <h5 class="modal-title">
                <i class="fas fa-project-diagram"></i>
                Dependencias del Registro ${registroId}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-4">
                  <div class="card ${estado.modulos.logistica.completado ? 'border-success' : 'border-warning'}">
                    <div class="card-header ${estado.modulos.logistica.completado ? 'bg-success' : 'bg-warning'} text-white">
                      <h6 class="mb-0">
                        <i class="fas fa-truck"></i>
                        LogÃ­stica
                      </h6>
                    </div>
                    <div class="card-body text-center">
                      <i class="fas fa-${estado.modulos.logistica.completado ? 'check-circle' : 'clock'} fa-3x ${estado.modulos.logistica.completado ? 'text-success' : 'text-warning'} mb-3"></i>
                      <p class="mb-0">
                        ${estado.modulos.logistica.completado ? 'Completado' : 'Pendiente'}
                      </p>
                      ${estado.modulos.logistica.fecha ? `<small class="text-muted">${new Date(estado.modulos.logistica.fecha).toLocaleString()}</small>` : ''}
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card ${estado.modulos.trafico.completado ? 'border-success' : 'border-warning'}">
                    <div class="card-header ${estado.modulos.trafico.completado ? 'bg-success' : 'bg-warning'} text-white">
                      <h6 class="mb-0">
                        <i class="fas fa-route"></i>
                        TrÃ¡fico
                      </h6>
                    </div>
                    <div class="card-body text-center">
                      <i class="fas fa-${estado.modulos.trafico.completado ? 'check-circle' : 'clock'} fa-3x ${estado.modulos.trafico.completado ? 'text-success' : 'text-warning'} mb-3"></i>
                      <p class="mb-0">
                        ${estado.modulos.trafico.completado ? 'Completado' : 'Pendiente'}
                      </p>
                      ${estado.modulos.trafico.fecha ? `<small class="text-muted">${new Date(estado.modulos.trafico.fecha).toLocaleString()}</small>` : ''}
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card ${estado.modulos.facturacion.completado ? 'border-success' : 'border-warning'}">
                    <div class="card-header ${estado.modulos.facturacion.completado ? 'bg-success' : 'bg-warning'} text-white">
                      <h6 class="mb-0">
                        <i class="fas fa-file-invoice"></i>
                        FacturaciÃ³n
                      </h6>
                    </div>
                    <div class="card-body text-center">
                      <i class="fas fa-${estado.modulos.facturacion.completado ? 'check-circle' : 'clock'} fa-3x ${estado.modulos.facturacion.completado ? 'text-success' : 'text-warning'} mb-3"></i>
                      <p class="mb-0">
                        ${estado.modulos.facturacion.completado ? 'Completado' : 'Pendiente'}
                      </p>
                      ${estado.modulos.facturacion.fecha ? `<small class="text-muted">${new Date(estado.modulos.facturacion.fecha).toLocaleString()}</small>` : ''}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row mt-4">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h6 class="mb-0">Progreso General</h6>
                    </div>
                    <div class="card-body">
                      <div class="progress mb-3" style="height: 25px;">
                        <div class="progress-bar" role="progressbar" style="width: ${(estado.modulosProcesados / estado.totalModulos) * 100}%">
                          ${estado.modulosProcesados} de ${estado.totalModulos} mÃ³dulos completados
                        </div>
                      </div>
                      <div class="text-center">
                        <strong>${Math.round((estado.modulosProcesados / estado.totalModulos) * 100)}% Completado</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" class="btn btn-primary" onclick="window.open('sincronizacion.html', '_blank')">
                <i class="fas fa-sync-alt"></i>
                Ver SincronizaciÃ³n Completa
              </button>
            </div>
          </div>
        </div>
      `;

    document.body.appendChild(modal);
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } else {
      console.error('âŒ Bootstrap Modal no estÃ¡ disponible');
      // Fallback: mostrar modal manualmente
      modal.style.display = 'block';
      modal.classList.add('show');
      modal.setAttribute('aria-modal', 'true');
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
      console.warn('âš ï¸ Modal mostrado manualmente (Bootstrap no disponible)');
    }

    // Limpiar modal cuando se cierre
    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  };

  // Función validateRegistrationNumber movida a assets/scripts/trafico/validation-utils.js
  // Funciones del contador movidas a assets/scripts/trafico/counter-utils.js
  // - actualizarContadorPendientes
  // - fijarContadorPendientes
  // - detenerBucleContador
  // - reiniciarContador
  // - configurarContadorOptimizado
  // - cargarNumeroActivoTrafico
})();
