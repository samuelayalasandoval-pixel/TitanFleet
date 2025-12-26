/**
 * Configuración Firebase para la página de configuración
 * Este script maneja TODOS los datos de configuración en Firebase
 */

(function () {
  'use strict';

  console.log('🔧 Iniciando configuracion-firebase.js');

  // Esperar a que Firebase v10 se inicialice
  function waitForFirebase(callback, maxAttempts = 100) {
    let attempts = 0;

    // console.log('⏳ Esperando a que Firebase v10 se cargue...');

    const checkFirebase = setInterval(() => {
      attempts++;

      // Verificar Firebase v10 modular (exposición desde firebase-init.js)
      const hasFirebase =
        window.firebaseDb && window.fs && window.fs.doc && window.fs.getDoc && window.fs.setDoc;
      const hasAuth = window.firebaseAuth && window.firebaseAuth.currentUser;

      if (hasFirebase && hasAuth) {
        clearInterval(checkFirebase);
        // console.log('✅ Firebase v10 y autenticación detectados después de', attempts, 'intentos');
        callback();
      } else if (hasFirebase && !hasAuth && attempts > 30) {
        // Si Firebase está listo pero no hay usuario después de 3 segundos, intentar autenticación anónima
        if (attempts === 31) {
          console.log('⏳ Firebase listo pero sin usuario. Intentando autenticación anónima...');
          (async () => {
            try {
              const { signInAnonymously } = await import(
                'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
              );
              await signInAnonymously(window.firebaseAuth);
              console.log('✅ Autenticación anónima exitosa');
            } catch (authErr) {
              console.warn('⚠️ Error en autenticación anónima:', authErr);
            }
          })();
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkFirebase);
        console.error(
          '❌ Firebase v10 o autenticación no disponibles después de',
          maxAttempts,
          'intentos'
        );
        console.warn('⚠️ Estado de disponibilidad:', {
          firebaseDb: Boolean(window.firebaseDb),
          fs: Boolean(window.fs),
          firebaseAuth: Boolean(window.firebaseAuth),
          currentUser: Boolean(window.firebaseAuth && window.firebaseAuth.currentUser),
          firebaseApp: Boolean(window.firebaseApp),
          firebaseConfig: Boolean(window.firebaseConfig)
        });
        // Continuar de todas formas si Firebase está disponible (puede que se autentique después)
        if (hasFirebase) {
          console.log('⚠️ Continuando sin autenticación - las operaciones pueden fallar');
          callback();
        }
      } else if (attempts % 10 === 0) {
        // Log cada 10 intentos para debugging
        console.log(
          '⏳ Esperando Firebase v10 y autenticación... intento',
          attempts,
          '/',
          maxAttempts,
          hasFirebase ? '(Firebase listo, esperando auth)' : '(Esperando Firebase)'
        );
      }
    }, 100);
  }

  // Inicializar cuando Firebase esté listo
  waitForFirebase(async () => {
    const db = window.firebaseDb;
    const {
      doc,
      getDoc,
      setDoc,
      updateDoc: _updateDoc,
      collection,
      getDocs,
      query: queryFn,
      where: whereFn
    } = window.fs;
    // console.log('✅ Firestore v10 inicializado');

    // Asegurar que el usuario esté autenticado antes de continuar
    if (window.firebaseAuth) {
      try {
        const { currentUser } = window.firebaseAuth;
        if (!currentUser) {
          console.log('🔐 No hay usuario autenticado, intentando autenticación anónima...');
          const { signInAnonymously } = await import(
            'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
          );
          await signInAnonymously(window.firebaseAuth);
          console.log('✅ Autenticación anónima exitosa');
        } else {
          console.log(
            '✅ Usuario ya autenticado:',
            currentUser.uid,
            currentUser.isAnonymous ? '(anónimo)' : '(email)'
          );
        }
      } catch (authError) {
        console.error('❌ Error en autenticación:', authError);
        console.warn(
          '⚠️ Continuando sin autenticación - las operaciones de Firestore pueden fallar'
        );
      }
    } else {
      console.warn('⚠️ window.firebaseAuth no está disponible');
    }

    // ===========================================
    // ECONÓMICOS - FIREBASE
    // ===========================================

    /**
     * Guardar económico en Firebase
     */
    window.saveEconomicoFirebase = async function (economicoData) {
      try {
        console.log('💾 Guardando económico en Firebase:', economicoData);

        // Obtener tenantId actual
        const tenantId = await obtenerTenantIdActual();

        // Preparar datos (usar fecha ISO en lugar de serverTimestamp porque está dentro de un array)
        const ahora = new Date().toISOString();
        const economico = {
          ...economicoData,
          numero: economicoData.numero || economicoData.numeroEconomico,
          fechaActualizacion: ahora,
          fechaCreacion: economicoData.fechaCreacion || ahora,
          tenantId: tenantId // CRÍTICO: Asignar tenantId al económico
        };

        // Leer económicos actuales
        const docRef = doc(db, 'configuracion', 'tractocamiones');
        const docSnap = await getDoc(docRef);

        let economicos = [];
        if (docSnap.exists() && docSnap.data().economicos) {
          economicos = docSnap.data().economicos;
        }

        // Buscar si ya existe
        const existingIndex = economicos.findIndex(e => e.numero === economico.numero);

        if (existingIndex >= 0) {
          // Actualizar existente (preservar tenantId si ya existe, o asignar el nuevo)
          economicos[existingIndex] = {
            ...economico,
            tenantId: economico.tenantId || economicos[existingIndex].tenantId || tenantId
          };
          console.log(
            '🔄 Actualizando económico existente:',
            economico.numero,
            'tenantId:',
            economico.tenantId
          );
        } else {
          // Agregar nuevo
          economicos.push(economico);
          console.log(
            '➕ Agregando nuevo económico:',
            economico.numero,
            'tenantId:',
            economico.tenantId
          );
        }

        // Guardar en Firebase con tenantId en el documento también
        await setDoc(
          docRef,
          {
            economicos,
            tenantId: tenantId,
            updatedAt: ahora
          },
          { merge: true }
        );
        console.log('✅ Económico guardado exitosamente en Firebase con tenantId:', tenantId);

        // Invalidar caché de economicos después de guardar
        if (window.invalidateCache) {
          window.invalidateCache('economicos');
          console.log('🗑️ Caché de economicos invalidado después de guardar');
        }

        return true;
      } catch (error) {
        console.error('❌ Error guardando económico en Firebase:', error);
        return false;
      }
    };

    /**
     * Cargar económicos desde Firebase
     */
    window.loadEconomicosFromFirebase = async function () {
      try {
        // console.log('📖 Cargando económicos desde Firebase...');

        // Obtener tenantId actual
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

        const docRef = doc(db, 'configuracion', 'tractocamiones');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().economicos) {
          const data = docSnap.data();
          const economicos = data.economicos || [];

          // CRÍTICO: Filtrar económicos por tenantId individual para mantener privacidad
          const economicosFiltrados = economicos.filter(economico => {
            const economicoTenantId = economico.tenantId;
            // Todos los usuarios solo ven económicos con su tenantId exacto
            return economicoTenantId === tenantId;
          });

          console.log(
            `🔒 Económicos filtrados por tenantId (${tenantId}): ${economicosFiltrados.length} de ${economicos.length} totales`
          );

          return economicosFiltrados;
        }
        console.log('⚠️ No hay económicos en Firebase');
        return [];
      } catch (error) {
        console.error('❌ Error cargando económicos:', error);
        return [];
      }
    };

    /**
     * Cargar tabla de económicos
     */
    window.loadEconomicosTableFirebase = async function () {
      try {
        // console.log('📊 Cargando tabla de económicos...');

        const economicos = await window.loadEconomicosFromFirebase();
        const tbody = document.getElementById('economicosTableBody');

        if (!tbody) {
          console.error('❌ No se encontró economicosTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (economicos && economicos.length > 0) {
          // console.log(`✅ Renderizando ${economicos.length} económicos en la tabla`);

          economicos.forEach(economico => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${economico.numero || ''}</td>
              <td>${economico.placaTracto || ''}</td>
              <td>${economico.placaRemolque || '-'}</td>
              <td>${economico.marca || ''} ${economico.modelo || ''}</td>
              <td>${economico.año || ''}</td>
              <td>${economico.operadorAsignado || '-'}</td>
              <td>
                <span class="badge bg-${
  economico.estadoVehiculo === 'activo'
    ? 'success'
    : economico.estadoVehiculo === 'mantenimiento'
      ? 'warning'
      : economico.estadoVehiculo === 'inactivo'
        ? 'secondary'
        : 'info'
  }">
                  ${economico.estadoVehiculo || 'N/A'}
                </span>
              </td>
              <td>${economico.fechaRegistro ? new Date(economico.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
              <td>
                <button class="btn btn-sm btn-outline-info" onclick="verEconomicoFirebase('${economico.numero}')" title="Ver detalles">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="editarEconomicoFirebase('${economico.numero}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarEconomicoFirebase('${economico.numero}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });

          // Actualizar contadores
          updateEconomicosCountersFirebase(economicos);
        } else {
          tbody.innerHTML =
            '<tr><td colspan="9" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay económicos registrados. Use el formulario para agregar uno.</td></tr>';

          // Resetear contadores
          updateEconomicosCountersFirebase([]);
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de económicos:', error);
      }
    };

    /**
     * Actualizar contadores
     */
    function updateEconomicosCountersFirebase(economicos) {
      const total = economicos ? economicos.length : 0;
      const activos = economicos ? economicos.filter(e => e.estadoVehiculo === 'activo').length : 0;
      const mantenimiento = economicos
        ? economicos.filter(e => e.estadoVehiculo === 'mantenimiento').length
        : 0;

      const totalElement = document.getElementById('totalEconomicos');
      const activosElement = document.getElementById('activosEconomicos');
      const mantenimientoElement = document.getElementById('mantenimientoEconomicos');

      if (totalElement) {
        totalElement.textContent = total;
      }
      if (activosElement) {
        activosElement.textContent = activos;
      }
      if (mantenimientoElement) {
        mantenimientoElement.textContent = mantenimiento;
      }
    }

    /**
     * Eliminar económico de Firebase
     */
    window.eliminarEconomicoFirebase = async function (numero) {
      if (!confirm(`¿Está seguro de eliminar el económico ${numero}?`)) {
        return;
      }

      try {
        console.log('🗑️ Eliminando económico:', numero);

        const docRef = doc(db, 'configuracion', 'tractocamiones');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().economicos) {
          let { economicos } = docSnap.data();
          economicos = economicos.filter(e => e.numero !== numero);

          await setDoc(docRef, { economicos }, { merge: true });
          console.log('✅ Económico eliminado');

          // Invalidar caché de economicos después de eliminar
          if (window.invalidateCache) {
            window.invalidateCache('economicos');
            console.log('🗑️ Caché de economicos invalidado después de eliminar');
          }

          // Recargar tabla
          await window.loadEconomicosTableFirebase();

          // Mostrar notificación
          if (window.configuracionManager) {
            window.configuracionManager.showNotification(
              'Económico eliminado exitosamente',
              'success'
            );
          }
        }
      } catch (error) {
        console.error('❌ Error eliminando económico:', error);
        alert('Error al eliminar el económico');
      }
    };

    /**
     * Ver detalles de económico (modal de solo lectura)
     */
    window.verEconomicoFirebase = async function (numero) {
      try {
        const economicos = await window.loadEconomicosFromFirebase();
        const economico = economicos.find(e => e.numero === numero);

        if (!economico) {
          alert('Económico no encontrado');
          return;
        }

        // Crear modal dinámico para mostrar detalles
        const modalHtml = `
          <div class="modal fade" id="verEconomicoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header bg-info text-white">
                  <h5 class="modal-title">
                    <i class="fas fa-truck"></i> Detalles del Económico ${economico.numero}
                  </h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <strong>Número de Económico:</strong><br>
                      ${economico.numero || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Tipo de Vehículo:</strong><br>
                      ${economico.tipoVehiculo || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Placa del Tracto:</strong><br>
                      ${economico.placaTracto || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Placa del Remolque:</strong><br>
                      ${economico.placaRemolque || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Estado de Placas:</strong><br>
                      ${economico.estadoPlacas || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Permiso SCT:</strong><br>
                      ${economico.permisoSCT || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Vencimiento SCT:</strong><br>
                      ${economico.fechaVencimientoSCT || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Seguro Vehicular:</strong><br>
                      ${economico.seguroVehicular || '-'}
                    </div>
                    <div class="col-md-4">
                      <strong>Marca:</strong><br>
                      ${economico.marca || '-'}
                    </div>
                    <div class="col-md-4">
                      <strong>Modelo:</strong><br>
                      ${economico.modelo || '-'}
                    </div>
                    <div class="col-md-4">
                      <strong>Año:</strong><br>
                      ${economico.año || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Capacidad de Carga:</strong><br>
                      ${economico.capacidadCarga ? `${economico.capacidadCarga} kg` : '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Número de Motor:</strong><br>
                      ${economico.numeroMotor || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Operador Asignado:</strong><br>
                      ${economico.operadorAsignado || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Teléfono Operador:</strong><br>
                      ${economico.telefonoOperador || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Estado del Vehículo:</strong><br>
                      <span class="badge bg-${
  economico.estadoVehiculo === 'activo'
    ? 'success'
    : economico.estadoVehiculo === 'mantenimiento'
      ? 'warning'
      : economico.estadoVehiculo === 'inactivo'
        ? 'secondary'
        : 'info'
  }">
                        ${economico.estadoVehiculo || 'N/A'}
                      </span>
                    </div>
                    <div class="col-md-6">
                      <strong>Fecha de Registro:</strong><br>
                      ${economico.fechaRegistro ? new Date(economico.fechaRegistro).toLocaleDateString() : '-'}
                    </div>
                    ${
  economico.observaciones
    ? `
                    <div class="col-12">
                      <strong>Observaciones:</strong><br>
                      ${economico.observaciones}
                    </div>
                    `
    : ''
  }
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times"></i> Cerrar
                  </button>
                  <button type="button" class="btn btn-primary" onclick="editarEconomicoFirebase('${economico.numero}'); bootstrap.Modal.getInstance(document.getElementById('verEconomicoModal')).hide();">
                    <i class="fas fa-edit"></i> Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('verEconomicoModal');
        if (modalAnterior) {
          modalAnterior.remove();
        }

        // Agregar modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('verEconomicoModal'));
        modal.show();

        // Limpiar modal cuando se cierre
        document
          .getElementById('verEconomicoModal')
          .addEventListener('hidden.bs.modal', function () {
            this.remove();
          });
      } catch (error) {
        console.error('❌ Error mostrando detalles del económico:', error);
      }
    };

    /**
     * Editar económico (cargar en formulario)
     */
    window.editarEconomicoFirebase = async function (numero) {
      try {
        const economicos = await window.loadEconomicosFromFirebase();
        const economico = economicos.find(e => e.numero === numero);

        if (!economico) {
          alert('Económico no encontrado');
          return;
        }

        // Llenar formulario
        document.getElementById('numeroEconomico').value = economico.numero || '';
        document.getElementById('tipoVehiculo').value = economico.tipoVehiculo || '';
        document.getElementById('placaTracto').value = economico.placaTracto || '';
        document.getElementById('placaRemolque').value = economico.placaRemolque || '';
        document.getElementById('estadoPlacas').value = economico.estadoPlacas || '';
        document.getElementById('permisoSCT').value = economico.permisoSCT || '';
        document.getElementById('fechaVencimientoSCT').value = economico.fechaVencimientoSCT || '';
        document.getElementById('seguroVehicular').value = economico.seguroVehicular || '';
        document.getElementById('fechaVencimientoSeguro').value =
          economico.fechaVencimientoSeguro || '';
        document.getElementById('marca').value = economico.marca || '';
        document.getElementById('modelo').value = economico.modelo || '';
        document.getElementById('año').value = economico.año || '';
        document.getElementById('capacidadCarga').value = economico.capacidadCarga || '';
        document.getElementById('numeroMotor').value = economico.numeroMotor || '';
        document.getElementById('operadorAsignado').value = economico.operadorAsignado || '';
        document.getElementById('telefonoOperador').value = economico.telefonoOperador || '';
        document.getElementById('estadoVehiculo').value = economico.estadoVehiculo || '';
        document.getElementById('observaciones').value = economico.observaciones || '';

        // Scroll al formulario
        document.getElementById('economicoForm').scrollIntoView({ behavior: 'smooth' });

        // Mostrar notificación
        if (window.configuracionManager) {
          window.configuracionManager.showNotification('Económico cargado para edición', 'info');
        }
      } catch (error) {
        console.error('❌ Error cargando económico para edición:', error);
      }
    };

    // ===========================================
    // REEMPLAZAR FUNCIÓN DE GUARDADO ORIGINAL
    // ===========================================

    /**
     * Sobrescribir saveEconomico() original
     */
    window.saveEconomico = async function () {
      console.log('💾 saveEconomico() llamado');

      // Validar formulario
      const form = document.getElementById('economicoForm');
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        window.configuracionManager.showNotification(
          'Por favor complete todos los campos requeridos',
          'error'
        );
        return false;
      }

      // Recopilar datos del formulario
      const economico = {
        numero: document.getElementById('numeroEconomico').value,
        tipoVehiculo: document.getElementById('tipoVehiculo').value,
        placaTracto: document.getElementById('placaTracto').value,
        placaRemolque: document.getElementById('placaRemolque').value,
        estadoPlacas: document.getElementById('estadoPlacas').value,
        permisoSCT: document.getElementById('permisoSCT').value,
        fechaVencimientoSCT: document.getElementById('fechaVencimientoSCT').value,
        seguroVehicular: document.getElementById('seguroVehicular').value,
        fechaVencimientoSeguro: document.getElementById('fechaVencimientoSeguro').value,
        marca: document.getElementById('marca').value,
        modelo: document.getElementById('modelo').value,
        año: parseInt(document.getElementById('año').value, 10),
        capacidadCarga: document.getElementById('capacidadCarga').value,
        numeroMotor: document.getElementById('numeroMotor').value,
        operadorAsignado: document.getElementById('operadorAsignado').value,
        telefonoOperador: document.getElementById('telefonoOperador').value,
        estadoVehiculo: document.getElementById('estadoVehiculo').value,
        observaciones: document.getElementById('observaciones').value,
        fechaRegistro: new Date().toISOString()
      };

      // Guardar en Firebase
      const success = await window.saveEconomicoFirebase(economico);

      if (success) {
        window.configuracionManager.showNotification('Económico guardado exitosamente', 'success');

        // Limpiar formulario
        form.reset();
        form.classList.remove('was-validated');

        // Recargar tabla
        await window.loadEconomicosTableFirebase();

        return true;
      }
      window.configuracionManager.showNotification('Error al guardar el económico', 'error');
      return false;
    };

    /**
     * Sobrescribir loadEconomicosTable() original
     */
    window.loadEconomicosTable = async function () {
      await window.loadEconomicosTableFirebase();
    };

    // ===========================================
    // OPERADORES - FIREBASE
    // ===========================================

    /**
     * Cargar operadores desde Firebase
     */
    window.loadOperadoresFromFirebase = async function () {
      try {
        // console.log('📖 Cargando operadores desde Firebase...');

        // Cargar desde configuracion/operadores (documento)
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        console.log('🔑 TenantId para cargar operadores:', tenantId);

        const docRef = doc(db, 'configuracion', 'operadores');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().operadores) {
          const data = docSnap.data();
          const operadores = data.operadores || [];

          // CRÍTICO: Filtrar operadores por tenantId individual para mantener privacidad
          const operadoresFiltrados = operadores.filter(operador => {
            const operadorTenantId = operador.tenantId;
            // Todos los usuarios solo ven operadores con su tenantId exacto
            return operadorTenantId === tenantId;
          });

          console.log(
            `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadoresFiltrados.length} de ${operadores.length} totales`
          );

          return operadoresFiltrados;
        }
        console.warn('⚠️ No hay operadores en configuracion/operadores');
        return [];
      } catch (error) {
        console.error('❌ Error cargando operadores:', error);
        return [];
      }
    };

    /**
     * Cargar tabla de operadores
     */
    window.loadOperadoresTableFirebase = async function () {
      try {
        // console.log('📊 Cargando tabla de operadores...');

        const operadores = await window.loadOperadoresFromFirebase();
        const tbody = document.getElementById('operadoresTableBody');

        if (!tbody) {
          console.error('❌ No se encontró operadoresTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (operadores && operadores.length > 0) {
          // console.log(`✅ Renderizando ${operadores.length} operadores en la tabla`);

          operadores.forEach(operador => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${operador.nombre || ''}</td>
              <td>${operador.licencia || ''}</td>
              <td>${operador.seguroSocial || ''}</td>
              <td>${operador.tipo || ''}</td>
              <td>
                <span class="badge bg-${
  operador.estado === 'activo'
    ? 'success'
    : operador.estado === 'vacaciones'
      ? 'info'
      : operador.estado === 'incapacidad'
        ? 'warning'
        : operador.estado === 'suspendido'
          ? 'danger'
          : 'secondary'
  }">
                  ${operador.estado || 'N/A'}
                </span>
              </td>
              <td>${operador.telefono || '-'}</td>
              <td>${operador.fechaIngreso ? new Date(operador.fechaIngreso).toLocaleDateString() : 'N/A'}</td>
              <td>${operador.fechaRegistro ? new Date(operador.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarOperadorFirebase('${operador.licencia}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarOperadorFirebase('${operador.licencia}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });

          // Actualizar contadores
          updateOperadoresCountersFirebase(operadores);
        } else {
          tbody.innerHTML =
            '<tr><td colspan="9" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay operadores registrados. Use el formulario para agregar uno.</td></tr>';

          // Resetear contadores
          updateOperadoresCountersFirebase([]);
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de operadores:', error);
      }
    };

    /**
     * Actualizar contadores de operadores
     */
    function updateOperadoresCountersFirebase(operadores) {
      const total = operadores ? operadores.length : 0;
      const activos = operadores
        ? operadores.filter(o => o.estado === 'activo' || !o.estado).length
        : 0;
      const vacaciones = operadores ? operadores.filter(o => o.estado === 'vacaciones').length : 0;

      const totalElement = document.getElementById('totalOperadores');
      const activosElement = document.getElementById('activosOperadores');
      const vacacionesElement = document.getElementById('vacacionesOperadores');

      if (totalElement) {
        totalElement.textContent = total;
      }
      if (activosElement) {
        activosElement.textContent = activos;
      }
      if (vacacionesElement) {
        vacacionesElement.textContent = vacaciones;
      }
    }

    /**
     * Eliminar operador de Firebase
     */
    window.eliminarOperadorFirebase = async function (licencia) {
      if (!confirm(`¿Está seguro de eliminar el operador con licencia ${licencia}?`)) {
        return;
      }

      try {
        console.log('🗑️ Eliminando operador:', licencia);

        const docRef = doc(db, 'configuracion', 'operadores');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().operadores) {
          let { operadores } = docSnap.data();
          operadores = operadores.filter(o => o.licencia !== licencia);

          await setDoc(docRef, { operadores }, { merge: true });
          console.log('✅ Operador eliminado');

          // Invalidar caché de operadores después de eliminar
          if (window.invalidateCache) {
            window.invalidateCache('operadores');
            console.log('🗑️ Caché de operadores invalidado después de eliminar');
          }

          // Recargar tabla
          await window.loadOperadoresTableFirebase();

          // Mostrar notificación
          if (window.configuracionManager) {
            window.configuracionManager.showNotification(
              'Operador eliminado exitosamente',
              'success'
            );
          }
        }
      } catch (error) {
        console.error('❌ Error eliminando operador:', error);
        alert('Error al eliminar el operador');
      }
    };

    /**
     * Editar operador (cargar en formulario)
     */
    window.editarOperadorFirebase = async function (licencia) {
      try {
        const operadores = await window.loadOperadoresFromFirebase();
        const operador = operadores.find(o => o.licencia === licencia);

        if (!operador) {
          alert('Operador no encontrado');
          return;
        }

        // Cambiar a la pestaña de operadores
        const operadoresTab = document.getElementById('operadores-tab');
        if (operadoresTab) {
          operadoresTab.click();
        }

        // Llenar formulario
        setTimeout(() => {
          document.getElementById('nombreOperador').value = operador.nombre || '';
          document.getElementById('numeroLicencia').value = operador.licencia || '';
          document.getElementById('seguroSocial').value = operador.seguroSocial || '';
          document.getElementById('telefono').value = operador.telefono || '';
          document.getElementById('fechaNacimiento').value = operador.fechaNacimiento || '';
          document.getElementById('direccionOperador').value = operador.direccion || '';
          document.getElementById('fechaIngreso').value = operador.fechaIngreso || '';
          document.getElementById('tipoOperador').value = operador.tipo || '';
          document.getElementById('estadoOperador').value = operador.estado || '';
          document.getElementById('salarioOperador').value = operador.salario || '';
          document.getElementById('fechaVencimientoLicencia').value =
            operador.fechaVencimientoLicencia || '';
          document.getElementById('certificadoMedico').value = operador.certificadoMedico || '';
          document.getElementById('fechaVencimientoCertificado').value =
            operador.fechaVencimientoCertificado || '';
          document.getElementById('observacionesOperador').value = operador.observaciones || '';

          // Scroll al formulario
          document.getElementById('operadorForm').scrollIntoView({ behavior: 'smooth' });

          // Mostrar notificación
          if (window.configuracionManager) {
            window.configuracionManager.showNotification('Operador cargado para edición', 'info');
          }
        }, 300);
      } catch (error) {
        console.error('❌ Error cargando operador para edición:', error);
      }
    };

    /**
     * Sobrescribir loadOperadoresTable() original
     */
    window.loadOperadoresTable = async function () {
      await window.loadOperadoresTableFirebase();
    };

    /**
     * Sobrescribir loadOperadoresList() original
     */
    window.loadOperadoresList = async function () {
      await window.loadOperadoresTableFirebase();
    };

    /**
     * Guardar operador en Firebase - Sobrescribir función original
     */
    window.saveOperadorFirebase = async function (operadorData) {
      try {
        console.log('💾 Guardando operador en Firebase:', operadorData);

        // Preparar datos con tenant ID correcto
        const ahora = new Date().toISOString();
        const operador = {
          ...operadorData,
          nombre: operadorData.nombre || operadorData.nombreOperador,
          licencia: operadorData.licencia || operadorData.numeroLicencia,
          tipo: operadorData.tipoOperador || operadorData.tipo,
          estado: operadorData.estadoOperador || operadorData.estado,
          fechaActualizacion: ahora,
          fechaCreacion: operadorData.fechaCreacion || ahora,
          fechaRegistro: operadorData.fechaRegistro || ahora
        };

        // Guardar en configuracion/operadores como documento (igual que clientes, tractocamiones, etc.)
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const operadoresDocRef = doc(db, 'configuracion', 'operadores');
        const operadoresDocSnap = await getDoc(operadoresDocRef);

        let operadoresArray = [];
        // Verificar si el documento existe
        if (operadoresDocSnap.exists()) {
          const docData = operadoresDocSnap.data();
          if (docData && docData.operadores) {
            operadoresArray = docData.operadores || [];
          }
        }

        // Buscar si ya existe un operador con la misma licencia
        const existingIndex = operadoresArray.findIndex(o => o.licencia === operador.licencia);

        if (existingIndex >= 0) {
          // Actualizar existente
          operadoresArray[existingIndex] = {
            ...operador,
            tenantId: tenantId
          };
          // console.log('🔄 Actualizando operador existente en configuracion/operadores:', operador.nombre);
        } else {
          // Agregar nuevo
          operadoresArray.push({
            ...operador,
            tenantId: tenantId
          });
          console.log('➕ Agregando nuevo operador en configuracion/operadores:', operador.nombre);
        }

        // Guardar el documento completo
        await setDoc(
          operadoresDocRef,
          {
            operadores: operadoresArray,
            tenantId: tenantId,
            updatedAt: ahora
          },
          { merge: true }
        );

        console.log('✅ Operador guardado exitosamente en Firebase (configuracion/operadores)');

        // Invalidar caché de operadores después de guardar
        if (window.invalidateCache) {
          window.invalidateCache('operadores');
          console.log('🗑️ Caché de operadores invalidado después de guardar');
        }

        return true;
      } catch (error) {
        console.error('❌ Error guardando operador en Firebase:', error);
        return false;
      }
    };

    /**
     * Sobrescribir saveOperador() para usar Firebase
     */
    const _originalSaveOperador = window.saveOperador;
    window.saveOperador = async function () {
      try {
        console.log('💾 saveOperador() llamado');

        // Obtener datos del formulario
        const operador = {
          nombre: document.getElementById('nombreOperador')?.value || '',
          licencia: document.getElementById('numeroLicencia')?.value || '',
          seguroSocial: document.getElementById('seguroSocial')?.value || '',
          telefono: document.getElementById('telefono')?.value || '',
          fechaNacimiento: document.getElementById('fechaNacimiento')?.value || '',
          direccion: document.getElementById('direccionOperador')?.value || '',
          fechaIngreso: document.getElementById('fechaIngreso')?.value || '',
          tipo: document.getElementById('tipoOperador')?.value || '',
          estado: document.getElementById('estadoOperador')?.value || '',
          salario: document.getElementById('salarioOperador')?.value || '',
          fechaVencimientoLicencia:
            document.getElementById('fechaVencimientoLicencia')?.value || '',
          certificadoMedico: document.getElementById('certificadoMedico')?.value || '',
          fechaVencimientoCertificado:
            document.getElementById('fechaVencimientoCertificado')?.value || '',
          observaciones: document.getElementById('observacionesOperador')?.value || '',
          fechaRegistro: new Date().toISOString()
        };

        // Validar campos requeridos
        if (!operador.nombre) {
          alert('Por favor ingrese el nombre completo');
          return false;
        }
        if (!operador.licencia) {
          alert('Por favor ingrese el número de licencia');
          return false;
        }
        if (!operador.seguroSocial) {
          alert('Por favor ingrese el número de seguro social');
          return false;
        }
        if (!operador.fechaIngreso) {
          alert('Por favor seleccione la fecha de ingreso');
          return false;
        }
        if (!operador.tipo) {
          alert('Por favor seleccione el tipo de operador');
          return false;
        }
        if (!operador.estado) {
          alert('Por favor seleccione el estado del operador');
          return false;
        }
        if (!operador.fechaVencimientoLicencia) {
          alert('Por favor seleccione la fecha de vencimiento de la licencia');
          return false;
        }

        // Guardar en Firebase
        const success = await window.saveOperadorFirebase(operador);

        if (success) {
          alert('Operador guardado exitosamente (sincronizado con Firebase)');

          // Limpiar formulario
          document.getElementById('operadorForm').reset();

          // Recargar tabla
          await window.loadOperadoresTableFirebase();

          return true;
        }
        alert('Error al guardar el operador');
        return false;
      } catch (error) {
        console.error('Error en saveOperador:', error);
        alert(`Error al guardar el operador: ${error.message}`);
        return false;
      }
    };

    // ===========================================
    // CLIENTES - FIREBASE
    // ===========================================

    /**
     * Cargar clientes desde Firebase
     */
    window.loadClientesFromFirebase = async function () {
      try {
        // console.log('📖 Cargando clientes desde Firebase...');

        // Verificar si se limpiaron los datos intencionalmente
        const datosLimpiados = localStorage.getItem('configuracion_limpiada_intencionalmente');
        if (datosLimpiados === 'true') {
          console.log('ℹ️ Clientes no se cargarán porque se limpiaron intencionalmente');
          return [];
        }

        // PRIORIDAD 1: Cargar desde configuracion/clientes (documento)
        const docRef = doc(db, 'configuracion', 'clientes');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().clientes) {
          const data = docSnap.data();
          const clientes = data.clientes || [];

          // Verificar si el documento fue limpiado definitivamente
          if (data.limpiadoDefinitivamente === true) {
            console.log(
              'ℹ️ Clientes no se cargarán porque el documento fue limpiado definitivamente'
            );
            return [];
          }

          // CRÍTICO: Filtrar clientes por tenantId individual para mantener privacidad
          const tenantId =
            (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

          const clientesFiltrados = clientes.filter(cliente => {
            const clienteTenantId = cliente.tenantId;
            // Todos los usuarios solo ven clientes con su tenantId exacto
            return clienteTenantId === tenantId;
          });

          console.log(
            `🔒 Clientes filtrados por tenantId (${tenantId}): ${clientesFiltrados.length} de ${clientes.length} totales`
          );

          if (clientesFiltrados.length > 0) {
            return clientesFiltrados;
          }
        }

        // PRIORIDAD 2: Si no hay en configuracion/clientes, cargar desde la colección clientes (raíz)
        console.log(
          '📊 No hay clientes en configuracion/clientes, intentando desde colección clientes...'
        );
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const clientesCollectionRef = collection(db, 'clientes');
        const q = queryFn(clientesCollectionRef, whereFn('tenantId', '==', tenantId));
        const querySnapshot = await getDocs(q);

        const clientes = [];
        querySnapshot.forEach(docSnap => {
          clientes.push(docSnap.data());
        });

        if (clientes.length > 0) {
          // console.log(`✅ ${clientes.length} clientes cargados desde colección clientes (tenantId: ${tenantId})`);

          // Migrar a configuracion/clientes para futuras cargas
          // console.log('🔄 Migrando clientes a configuracion/clientes...');
          await setDoc(docRef, {
            clientes: clientes.map(c => ({ ...c, tenantId: tenantId })),
            tenantId: tenantId,
            updatedAt: new Date().toISOString()
          });
          console.log('✅ Clientess migrados a configuracion/clientes');
        } else {
          console.warn('⚠️ No se encontraron clientes en ninguna ubicación');
        }

        return clientes;
      } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        return [];
      }
    };

    /**
     * Cargar tabla de clientes
     */
    window.loadClientesTableFirebase = async function () {
      try {
        // console.log('📊 Cargando tabla de clientes...');

        const clientes = await window.loadClientesFromFirebase();
        const tbody = document.getElementById('clientesTableBody');

        if (!tbody) {
          console.error('❌ No se encontró clientesTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (clientes && clientes.length > 0) {
          // console.log(`✅ Renderizando ${clientes.length} clientes en la tabla`);

          clientes.forEach(cliente => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${cliente.nombre || ''}</td>
              <td>${cliente.rfc || ''}</td>
              <td>${cliente.contacto || ''}</td>
              <td>${cliente.telefono || ''}</td>
              <td>${cliente.email || '-'}</td>
              <td>${cliente.tipoCliente || cliente.tipo || ''}</td>
              <td>
                <span class="badge bg-${
  cliente.estado === 'activo' || cliente.estadoComercial === 'activo'
    ? 'success'
    : cliente.estado === 'suspendido' || cliente.estadoComercial === 'suspendido'
      ? 'warning'
      : cliente.estado === 'moroso' || cliente.estadoComercial === 'moroso'
        ? 'danger'
        : 'secondary'
  }">
                  ${cliente.estado || cliente.estadoComercial || 'N/A'}
                </span>
              </td>
              <td>${cliente.ciudad || '-'}</td>
              <td>${cliente.fechaRegistro ? new Date(cliente.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarClienteFirebase('${cliente.rfc}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarClienteFirebase('${cliente.rfc}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });

          // Actualizar contadores
          updateClientesCountersFirebase(clientes);
        } else {
          tbody.innerHTML =
            '<tr><td colspan="10" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay clientes registrados. Use el formulario para agregar uno.</td></tr>';

          // Resetear contadores
          updateClientesCountersFirebase([]);
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de clientes:', error);
      }
    };

    /**
     * Actualizar contadores de clientes
     */
    function updateClientesCountersFirebase(clientes) {
      const total = clientes ? clientes.length : 0;
      const activos = clientes
        ? clientes.filter(
          c =>
            c.estado === 'activo' ||
              c.estadoComercial === 'activo' ||
              (!c.estado && !c.estadoComercial)
        ).length
        : 0;
      const suspendidos = clientes
        ? clientes.filter(c => c.estado === 'suspendido' || c.estadoComercial === 'suspendido')
          .length
        : 0;
      const morosos = clientes
        ? clientes.filter(c => c.estado === 'moroso' || c.estadoComercial === 'moroso').length
        : 0;

      const totalElement = document.getElementById('totalClientes');
      const activosElement = document.getElementById('activosClientes');
      const suspendidosElement = document.getElementById('suspendidosClientes');
      const morososElement = document.getElementById('morososClientes');

      if (totalElement) {
        totalElement.textContent = total;
      }
      if (activosElement) {
        activosElement.textContent = activos;
      }
      if (suspendidosElement) {
        suspendidosElement.textContent = suspendidos;
      }
      if (morososElement) {
        morososElement.textContent = morosos;
      }
    }

    /**
     * Eliminar cliente de Firebase
     */
    window.eliminarClienteFirebase = async function (rfc) {
      if (!confirm(`¿Está seguro de eliminar el cliente con RFC ${rfc}?`)) {
        return;
      }

      try {
        console.log('🗑️ Eliminando cliente:', rfc);

        const docRef = doc(db, 'configuracion', 'clientes');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().clientes) {
          let { clientes } = docSnap.data();
          clientes = clientes.filter(c => c.rfc !== rfc);

          await setDoc(docRef, { clientes }, { merge: true });
          console.log('✅ Cliente eliminado');

          // Invalidar caché de clientes después de eliminar
          if (window.invalidateCache) {
            window.invalidateCache('clientes');
            console.log('🗑️ Caché de clientes invalidado después de eliminar');
          }

          // Recargar tabla
          await window.loadClientesTableFirebase();

          // Mostrar notificación
          if (window.configuracionManager) {
            window.configuracionManager.showNotification(
              'Cliente eliminado exitosamente',
              'success'
            );
          }
        }
      } catch (error) {
        console.error('❌ Error eliminando cliente:', error);
        alert('Error al eliminar el cliente');
      }
    };

    /**
     * Editar cliente (cargar en formulario)
     */
    window.editarClienteFirebase = async function (rfc) {
      try {
        const clientes = await window.loadClientesFromFirebase();
        const cliente = clientes.find(c => c.rfc === rfc);

        if (!cliente) {
          alert('Cliente no encontrado');
          return;
        }

        // Cambiar a la pestaña de clientes
        const clientesTab = document.getElementById('clientes-tab');
        if (clientesTab) {
          clientesTab.click();
        }

        // Llenar formulario
        setTimeout(() => {
          document.getElementById('nombreCliente').value = cliente.nombre || '';
          document.getElementById('rfcCliente').value = cliente.rfc || '';
          document.getElementById('contactoCliente').value = cliente.contacto || '';
          document.getElementById('telefonoCliente').value = cliente.telefono || '';
          document.getElementById('emailCliente').value = cliente.email || '';
          document.getElementById('celularCliente').value = cliente.celular || '';
          document.getElementById('direccionCliente').value = cliente.direccion || '';
          document.getElementById('codigoPostalCliente').value = cliente.codigoPostal || '';
          document.getElementById('ciudadCliente').value = cliente.ciudad || '';
          document.getElementById('estadoCliente').value = cliente.estado || '';
          document.getElementById('regimenFiscal').value = cliente.regimenFiscal || '';
          document.getElementById('tipoCliente').value = cliente.tipoCliente || cliente.tipo || '';
          document.getElementById('limiteCredito').value = cliente.limiteCredito || '';
          document.getElementById('diasCredito').value = cliente.diasCredito || '';
          document.getElementById('descuentoCliente').value = cliente.descuento || '';
          document.getElementById('estadoClienteComercial').value =
            cliente.estadoComercial || cliente.estado || '';
          document.getElementById('observacionesCliente').value = cliente.observaciones || '';

          // Scroll al formulario
          document.getElementById('clienteForm').scrollIntoView({ behavior: 'smooth' });

          // Mostrar notificación
          if (window.configuracionManager) {
            window.configuracionManager.showNotification('Cliente cargado para edición', 'info');
          }
        }, 300);
      } catch (error) {
        console.error('❌ Error cargando cliente para edición:', error);
      }
    };

    /**
     * Guardar cliente en Firebase
     */
    window.saveClienteFirebase = async function (clienteData) {
      try {
        console.log('💾 Guardando cliente en Firebase (configuracion/clientes):', clienteData);

        // Preparar datos
        const ahora = new Date().toISOString();
        const cliente = {
          ...clienteData,
          fechaActualizacion: ahora,
          fechaCreacion: clienteData.fechaCreacion || ahora,
          fechaRegistro: clienteData.fechaRegistro || ahora
        };

        // Guardar en configuracion/clientes como documento (igual que operadores, tractocamiones, etc.)
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const clientesDocRef = doc(db, 'configuracion', 'clientes');
        const clientesDocSnap = await getDoc(clientesDocRef);

        let clientesArray = [];
        // Verificar si el documento existe (compatible con Firebase v10)
        if (clientesDocSnap.exists()) {
          const docData = clientesDocSnap.data();
          if (docData && docData.clientes) {
            clientesArray = docData.clientes || [];
          }
        }

        // Buscar si ya existe un cliente con el mismo RFC
        const existingIndex = clientesArray.findIndex(c => c.rfc === cliente.rfc);

        if (existingIndex >= 0) {
          // Actualizar existente
          clientesArray[existingIndex] = {
            ...cliente,
            tenantId: tenantId
          };
          // console.log('🔄 Actualizando cliente existente en configuracion/clientes:', cliente.nombre);
        } else {
          // Agregar nuevo
          clientesArray.push({
            ...cliente,
            tenantId: tenantId
          });
          console.log('➕ Agregando nuevo cliente en configuracion/clientes:', cliente.nombre);
        }

        // Guardar el documento completo
        await setDoc(
          clientesDocRef,
          {
            clientes: clientesArray,
            tenantId: tenantId,
            updatedAt: ahora
          },
          { merge: true }
        );

        console.log('✅ Cliente guardado exitosamente en configuracion/clientes');

        return true;
      } catch (error) {
        console.error('❌ Error guardando cliente en Firebase:', error);
        return false;
      }
    };

    /**
     * Sobrescribir saveCliente() para usar Firebase
     */
    window.saveCliente = async function () {
      try {
        console.log('💾 saveCliente() llamado');

        // Obtener datos del formulario
        const cliente = {
          nombre: document.getElementById('nombreCliente')?.value || '',
          rfc: document.getElementById('rfcCliente')?.value || '',
          contacto: document.getElementById('contactoCliente')?.value || '',
          telefono: document.getElementById('telefonoCliente')?.value || '',
          email: document.getElementById('emailCliente')?.value || '',
          celular: document.getElementById('celularCliente')?.value || '',
          direccion: document.getElementById('direccionCliente')?.value || '',
          codigoPostal: document.getElementById('codigoPostalCliente')?.value || '',
          ciudad: document.getElementById('ciudadCliente')?.value || '',
          estado: document.getElementById('estadoCliente')?.value || '',
          regimenFiscal: document.getElementById('regimenFiscal')?.value || '',
          tipoCliente: document.getElementById('tipoCliente')?.value || '',
          limiteCredito: document.getElementById('limiteCredito')?.value || '',
          diasCredito: document.getElementById('diasCredito')?.value || '',
          descuento: document.getElementById('descuentoCliente')?.value || '',
          estadoComercial: document.getElementById('estadoClienteComercial')?.value || '',
          observaciones: document.getElementById('observacionesCliente')?.value || '',
          fechaRegistro: new Date().toISOString()
        };

        // Validar campos requeridos
        if (!cliente.nombre) {
          alert('Por favor ingrese el nombre o razón social');
          return false;
        }
        if (!cliente.rfc) {
          alert('Por favor ingrese el RFC');
          return false;
        }
        if (!cliente.contacto) {
          alert('Por favor ingrese la persona de contacto');
          return false;
        }
        if (!cliente.telefono) {
          alert('Por favor ingrese el teléfono');
          return false;
        }
        if (!cliente.direccion) {
          alert('Por favor ingrese la dirección');
          return false;
        }
        if (!cliente.ciudad) {
          alert('Por favor ingrese la ciudad');
          return false;
        }
        if (!cliente.estado) {
          alert('Por favor seleccione el estado');
          return false;
        }
        if (!cliente.regimenFiscal) {
          alert('Por favor seleccione el régimen fiscal');
          return false;
        }
        if (!cliente.tipoCliente) {
          alert('Por favor seleccione el tipo de cliente');
          return false;
        }
        if (!cliente.estadoComercial) {
          alert('Por favor seleccione el estado comercial');
          return false;
        }

        // Guardar en Firebase
        const success = await window.saveClienteFirebase(cliente);

        if (success) {
          // Invalidar caché de clientes después de guardar
          if (window.invalidateCache) {
            window.invalidateCache('clientes');
            console.log('🗑️ Caché de clientes invalidado después de guardar');
          }

          alert('Cliente guardado exitosamente (sincronizado con Firebase)');

          // Limpiar formulario
          document.getElementById('clienteForm').reset();

          // Recargar tabla
          await window.loadClientesTableFirebase();

          return true;
        }
        alert('Error al guardar el cliente');
        return false;
      } catch (error) {
        console.error('Error en saveCliente:', error);
        alert(`Error al guardar el cliente: ${error.message}`);
        return false;
      }
    };

    /**
     * Sobrescribir loadClientes() para usar Firebase
     */
    window.loadClientes = async function () {
      await window.loadClientesTableFirebase();
    };

    /**
     * Limpiar clientes de localStorage
     */
    window.limpiarClientesLocalStorage = function () {
      if (
        confirm(
          '¿Está seguro de eliminar todos los clientes de localStorage? Esta acción no se puede deshacer.'
        )
      ) {
        localStorage.removeItem('erp_clientes');
        console.log('✅ Clientes eliminados de localStorage');
        alert(
          'Clientes eliminados de localStorage. Ahora use Firebase para crear nuevos clientes.'
        );
      }
    };

    // ===========================================
    // PROVEEDORES - FIREBASE
    // ===========================================

    /**
     * Cargar proveedores desde Firebase
     */
    window.loadProveedoresFromFirebase = async function () {
      try {
        // console.log('📖 Cargando proveedores desde Firebase...');
        console.log('🔍 Buscando en: configuracion/proveedores');

        const docRef = doc(db, 'configuracion', 'proveedores');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // console.log('📋 Documento existe. Datos:', {
          //   tieneProveedores: !!data.proveedores,
          //   esArray: Array.isArray(data.proveedores),
          //   cantidad: data.proveedores?.length || 0,
          //   keys: Object.keys(data)
          // });

          if (data.proveedores && Array.isArray(data.proveedores)) {
            const { proveedores } = data;

            // CRÍTICO: Filtrar proveedores por tenantId individual para mantener privacidad
            const tenantId =
              (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

            const proveedoresFiltrados = proveedores.filter(proveedor => {
              const proveedorTenantId = proveedor.tenantId;
              // Todos los usuarios solo ven proveedores con su tenantId exacto
              return proveedorTenantId === tenantId;
            });

            console.log(
              `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedoresFiltrados.length} de ${proveedores.length} totales`
            );

            return proveedoresFiltrados;
          }
          console.warn('⚠️ El documento existe pero no tiene array proveedores válido');
          console.warn('📋 Contenido del documento:', data);
          return [];
        }
        console.warn('⚠️ El documento configuracion/proveedores NO existe en Firebase');
        console.warn('💡 Intentando verificar si hay proveedores en localStorage...');

        // Intentar cargar desde localStorage como fallback
        try {
          const proveedoresLocal = localStorage.getItem('erp_proveedores');
          if (proveedoresLocal) {
            const proveedores = JSON.parse(proveedoresLocal);
            if (Array.isArray(proveedores) && proveedores.length > 0) {
              console.log(
                `📦 Encontrados ${proveedores.length} proveedores en localStorage, intentando guardar en Firebase...`
              );
              // Intentar guardar en Firebase
              await setDoc(docRef, {
                proveedores: proveedores,
                tenantId:
                  (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant',
                updatedAt: new Date().toISOString()
              });
              console.log('✅ Proveedores de localStorage guardados en Firebase');
              return proveedores;
            }
          }
        } catch (localError) {
          console.warn('⚠️ Error al intentar cargar desde localStorage:', localError);
        }

        return [];
      } catch (error) {
        console.error('❌ Error cargando proveedores:', error);
        console.error('Stack trace:', error.stack);
        return [];
      }
    };

    /**
     * Cargar tabla de proveedores
     */
    window.loadProveedoresTableFirebase = async function () {
      try {
        // console.log('📊 Cargando tabla de proveedores...');

        const proveedores = await window.loadProveedoresFromFirebase();
        const tbody = document.getElementById('proveedoresTableBody');

        if (!tbody) {
          console.error('❌ No se encontró proveedoresTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (proveedores && proveedores.length > 0) {
          // console.log(`✅ Renderizando ${proveedores.length} proveedores en la tabla`);

          proveedores.forEach(proveedor => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${proveedor.nombre || ''}</td>
              <td>${proveedor.rfc || ''}</td>
              <td>${proveedor.contacto || '-'}</td>
              <td>${proveedor.telefono || '-'}</td>
              <td>${proveedor.email || '-'}</td>
              <td>
                <span class="badge bg-${
  proveedor.estado === 'activo'
    ? 'success'
    : proveedor.estado === 'suspendido'
      ? 'warning'
      : proveedor.estado === 'inactivo'
        ? 'secondary'
        : 'info'
  }">
                  ${proveedor.estado || 'activo'}
                </span>
              </td>
              <td>${proveedor.diasCredito || '0'}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarProveedorFirebase('${proveedor.rfc}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarProveedorFirebase('${proveedor.rfc}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });

          // Actualizar contadores
          updateProveedoresCountersFirebase(proveedores);
        } else {
          tbody.innerHTML =
            '<tr><td colspan="8" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay proveedores registrados. Use el formulario para agregar uno.</td></tr>';

          // Resetear contadores
          updateProveedoresCountersFirebase([]);
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de proveedores:', error);
      }
    };

    /**
     * Actualizar contadores de proveedores
     */
    function updateProveedoresCountersFirebase(proveedores) {
      const total = proveedores ? proveedores.length : 0;
      const activos = proveedores
        ? proveedores.filter(p => p.estado === 'activo' || !p.estado).length
        : 0;
      const inactivos = proveedores ? proveedores.filter(p => p.estado === 'inactivo').length : 0;
      const suspendidos = proveedores
        ? proveedores.filter(p => p.estado === 'suspendido').length
        : 0;

      const totalElement = document.getElementById('totalProveedores');
      const activosElement = document.getElementById('activosProveedores');
      const inactivosElement = document.getElementById('inactivosProveedores');
      const suspendidosElement = document.getElementById('suspendidosProveedores');

      if (totalElement) {
        totalElement.textContent = total;
      }
      if (activosElement) {
        activosElement.textContent = activos;
      }
      if (inactivosElement) {
        inactivosElement.textContent = inactivos;
      }
      if (suspendidosElement) {
        suspendidosElement.textContent = suspendidos;
      }
    }

    /**
     * Eliminar proveedor de Firebase
     */
    window.eliminarProveedorFirebase = async function (rfc) {
      if (!confirm(`¿Está seguro de eliminar el proveedor con RFC ${rfc}?`)) {
        return;
      }

      try {
        console.log('🗑️ Eliminando proveedor:', rfc);

        const docRef = doc(db, 'configuracion', 'proveedores');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().proveedores) {
          let { proveedores } = docSnap.data();
          proveedores = proveedores.filter(p => p.rfc !== rfc);

          await setDoc(docRef, { proveedores }, { merge: true });
          console.log('✅ Proveedor eliminado');

          // Invalidar caché de proveedores después de eliminar
          if (window.invalidateCache) {
            window.invalidateCache('proveedores');
            console.log('🗑️ Caché de proveedores invalidado después de eliminar');
          }

          // Recargar tabla
          await window.loadProveedoresTableFirebase();

          // Mostrar notificación
          if (window.configuracionManager) {
            window.configuracionManager.showNotification(
              'Proveedor eliminado exitosamente',
              'success'
            );
          } else {
            alert('Proveedor eliminado exitosamente');
          }
        }
      } catch (error) {
        console.error('❌ Error eliminando proveedor:', error);
        alert('Error al eliminar el proveedor');
      }
    };

    /**
     * Editar proveedor (cargar en formulario)
     */
    window.editarProveedorFirebase = async function (rfc) {
      try {
        const proveedores = await window.loadProveedoresFromFirebase();
        const proveedor = proveedores.find(p => p.rfc === rfc);

        if (!proveedor) {
          alert('Proveedor no encontrado');
          return;
        }

        // Cambiar a la pestaña de proveedores
        const proveedoresTab = document.getElementById('proveedores-tab');
        if (proveedoresTab) {
          proveedoresTab.click();
        }

        // Llenar formulario
        setTimeout(() => {
          document.getElementById('nombreProveedor').value = proveedor.nombre || '';
          document.getElementById('rfcProveedor').value = proveedor.rfc || '';
          document.getElementById('contactoProveedor').value = proveedor.contacto || '';
          document.getElementById('telefonoProveedor').value = proveedor.telefono || '';
          document.getElementById('emailProveedor').value = proveedor.email || '';
          document.getElementById('diasCreditoProveedor').value = proveedor.diasCredito || '';
          document.getElementById('direccionProveedor').value = proveedor.direccion || '';
          document.getElementById('bancoProveedor').value = proveedor.banco || '';
          document.getElementById('cuentaProveedor').value = proveedor.cuenta || '';
          document.getElementById('estadoProveedor').value = proveedor.estado || 'activo';

          // Scroll al formulario
          document.getElementById('proveedorForm').scrollIntoView({ behavior: 'smooth' });

          // Mostrar notificación
          if (window.configuracionManager) {
            window.configuracionManager.showNotification('Proveedor cargado para edición', 'info');
          }
        }, 300);
      } catch (error) {
        console.error('❌ Error cargando proveedor para edición:', error);
      }
    };

    /**
     * Guardar proveedor en Firebase
     */
    window.saveProveedorFirebase = async function (proveedorData) {
      try {
        console.log('💾 Guardando proveedor en Firebase:', proveedorData);

        // CRÍTICO: Obtener tenantId actual para asignarlo al proveedor
        let tenantId;
        try {
          if (typeof obtenerTenantIdActual === 'function') {
            tenantId = await obtenerTenantIdActual();
          } else {
            console.warn('⚠️ obtenerTenantIdActual no está disponible, usando fallback');
            tenantId = null;
          }
        } catch (tenantError) {
          console.warn('⚠️ Error obteniendo tenantId:', tenantError);
          tenantId = null;
        }

        // Fallback si no se pudo obtener el tenantId
        if (!tenantId) {
          tenantId =
            window.DEMO_CONFIG?.tenantId || localStorage.getItem('tenantId') || 'demo_tenant';
        }

        console.log('🔑 TenantId a asignar al proveedor:', tenantId);

        // Preparar datos
        const ahora = new Date().toISOString();
        const proveedor = {
          ...proveedorData,
          tenantId: tenantId, // Agregar tenantId al proveedor
          fechaActualizacion: ahora,
          fechaCreacion: proveedorData.fechaCreacion || ahora,
          fechaRegistro: proveedorData.fechaRegistro || ahora
        };

        // Verificar que Firebase esté disponible
        if (!db || !doc || !getDoc || !setDoc) {
          console.error('❌ Firebase no está completamente inicializado:', {
            db: Boolean(db),
            doc: Boolean(doc),
            getDoc: Boolean(getDoc),
            setDoc: Boolean(setDoc)
          });
          throw new Error('Firebase no está completamente inicializado');
        }

        // Leer proveedores actuales
        const docRef = doc(db, 'configuracion', 'proveedores');
        const docSnap = await getDoc(docRef);

        let proveedores = [];
        if (docSnap.exists() && docSnap.data().proveedores) {
          proveedores = docSnap.data().proveedores;
          console.log(`📊 Proveedores existentes en Firebase: ${proveedores.length}`);
        } else {
          console.log('📝 Creando nuevo documento configuracion/proveedores');
        }

        // Buscar si ya existe
        const existingIndex = proveedores.findIndex(p => p.rfc === proveedor.rfc);

        if (existingIndex >= 0) {
          // Actualizar existente
          proveedores[existingIndex] = proveedor;
          console.log('🔄 Actualizando proveedor existente:', proveedor.nombre);
        } else {
          // Agregar nuevo
          proveedores.push(proveedor);
          console.log('➕ Agregando nuevo proveedor:', proveedor.nombre);
        }

        // Guardar en Firebase
        console.log(`💾 Guardando ${proveedores.length} proveedor(es) en Firebase...`);
        await setDoc(docRef, { proveedores }, { merge: true });

        // Verificar que se guardó correctamente
        const verifyDoc = await getDoc(docRef);
        if (verifyDoc.exists()) {
          const verifyData = verifyDoc.data();
          const verifyCount = verifyData.proveedores?.length || 0;
          console.log(
            `✅ Verificación: ${verifyCount} proveedor(es) en Firebase después de guardar`
          );
          if (verifyCount !== proveedores.length) {
            console.warn('⚠️ Advertencia: El número de proveedores no coincide después de guardar');
          }
        } else {
          console.error('❌ ERROR: El documento no existe después de guardar');
          throw new Error('El documento no existe después de guardar');
        }

        console.log('✅ Proveedor guardado exitosamente en Firebase');

        // Invalidar caché de proveedores después de guardar
        if (window.invalidateCache) {
          window.invalidateCache('proveedores');
          console.log('🗑️ Caché de proveedores invalidado después de guardar');
        }

        return true;
      } catch (error) {
        console.error('❌ Error guardando proveedor en Firebase:', error);
        return false;
      }
    };

    /**
     * Sobrescribir el submit del formulario de proveedores
     * Esta función tiene prioridad sobre el listener en configuracion.js
     */
    function setupProveedorFormListener() {
      const proveedorForm = document.getElementById('proveedorForm');
      if (!proveedorForm) {
        console.warn('⚠️ No se encontró el formulario proveedorForm, reintentando...');
        setTimeout(setupProveedorFormListener, 500);
        return;
      }

      // Remover listeners anteriores clonando el formulario
      const newForm = proveedorForm.cloneNode(true);
      proveedorForm.parentNode.replaceChild(newForm, proveedorForm);

      const formToUse = document.getElementById('proveedorForm');
      if (!formToUse) {
        console.error('❌ Error al reemplazar el formulario');
        return;
      }

      formToUse.addEventListener('submit', async e => {
        e.preventDefault();

        console.log('💾 Formulario de proveedor enviado');

        // Obtener datos del formulario
        const proveedor = {
          nombre: document.getElementById('nombreProveedor')?.value || '',
          rfc: document.getElementById('rfcProveedor')?.value || '',
          contacto: document.getElementById('contactoProveedor')?.value || '',
          telefono: document.getElementById('telefonoProveedor')?.value || '',
          email: document.getElementById('emailProveedor')?.value || '',
          diasCredito: document.getElementById('diasCreditoProveedor')?.value || '30',
          direccion: document.getElementById('direccionProveedor')?.value || '',
          banco: document.getElementById('bancoProveedor')?.value || '',
          cuenta: document.getElementById('cuentaProveedor')?.value || '',
          estado: document.getElementById('estadoProveedor')?.value || 'activo',
          fechaRegistro: new Date().toISOString()
        };

        // Validar campos requeridos
        if (!proveedor.nombre) {
          alert('Por favor ingrese el nombre o razón social del proveedor');
          return false;
        }
        if (!proveedor.rfc) {
          alert('Por favor ingrese el RFC del proveedor');
          return false;
        }

        // Guardar en Firebase
        const success = await window.saveProveedorFirebase(proveedor);

        if (success) {
          alert('Proveedor guardado exitosamente (sincronizado con Firebase)');

          // Limpiar formulario
          formToUse.reset();

          // Recargar tabla
          await window.loadProveedoresTableFirebase();

          return true;
        }
        alert('Error al guardar el proveedor. Revise la consola para más detalles.');
        return false;
      });

      console.log('✅ Listener de formulario de proveedores configurado (Firebase)');
    }

    // Configurar el listener cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupProveedorFormListener);
    } else {
      // DOM ya está listo, pero esperar un poco para que otros scripts se ejecuten primero
      setTimeout(setupProveedorFormListener, 1000);
    }

    /**
     * Sobrescribir loadProveedores() para usar Firebase
     */
    window.loadProveedores = async function () {
      await window.loadProveedoresTableFirebase();
    };

    /**
     * Limpiar proveedores de localStorage
     */
    window.limpiarProveedoresLocalStorage = function () {
      if (
        confirm(
          '¿Está seguro de eliminar todos los proveedores de localStorage? Esta acción no se puede deshacer.'
        )
      ) {
        localStorage.removeItem('erp_proveedores');
        console.log('✅ Proveedores eliminados de localStorage');
        alert(
          'Proveedores eliminados de localStorage. Ahora use Firebase para crear nuevos proveedores.'
        );
      }
    };

    // ===========================================
    // ESTANCIAS - FIREBASE
    // ===========================================

    /**
     * Cargar estancias desde Firebase
     */
    window.loadEstanciasFromFirebase = async function () {
      try {
        // console.log('📖 Cargando estancias desde Firebase...');

        const docRef = doc(db, 'configuracion', 'estancias');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().estancias) {
          const { estancias } = docSnap.data();

          // CRÍTICO: Filtrar estancias por tenantId individual para mantener privacidad
          const tenantId =
            (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

          const estanciasFiltradas = estancias.filter(estancia => {
            const estanciaTenantId = estancia.tenantId;
            // Todos los usuarios solo ven estancias con su tenantId exacto
            return estanciaTenantId === tenantId;
          });

          console.log(
            `🔒 Estancias filtradas por tenantId (${tenantId}): ${estanciasFiltradas.length} de ${estancias.length} totales`
          );

          return estanciasFiltradas;
        }
        console.log('⚠️ No hay estancias en Firebase');
        return [];
      } catch (error) {
        console.error('❌ Error cargando estancias:', error);
        return [];
      }
    };

    /**
     * Cargar tabla de estancias
     */
    window.loadEstanciasTableFirebase = async function () {
      try {
        // console.log('📊 Cargando tabla de estancias...');

        const estancias = await window.loadEstanciasFromFirebase();
        const tbody = document.getElementById('estanciasTableBody');

        if (!tbody) {
          console.error('❌ No se encontró estanciasTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (estancias && estancias.length > 0) {
          // console.log(`✅ Renderizando ${estancias.length} estancias en la tabla`);

          estancias.forEach(estancia => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${estancia.nombre || ''}</td>
              <td>${estancia.codigo || '-'}</td>
              <td>${estancia.direccion || '-'}</td>
              <td>${estancia.observaciones || '-'}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarEstanciaFirebase('${estancia.codigo || estancia.nombre}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstanciaFirebase('${estancia.codigo || estancia.nombre}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML =
            '<tr><td colspan="5" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay estancias registradas. Use el formulario para agregar una.</td></tr>';
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de estancias:', error);
      }
    };

    /**
     * Eliminar estancia de Firebase
     */
    window.eliminarEstanciaFirebase = async function (identificador) {
      if (!confirm(`¿Está seguro de eliminar la estancia "${identificador}"?`)) {
        return;
      }

      try {
        console.log('🗑️ Eliminando estancia:', identificador);

        const docRef = doc(db, 'configuracion', 'estancias');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().estancias) {
          let { estancias } = docSnap.data();
          estancias = estancias.filter(e => (e.codigo || e.nombre) !== identificador);

          await setDoc(docRef, { estancias }, { merge: true });
          console.log('✅ Estancia eliminada');

          // Invalidar caché de estancias después de eliminar
          if (window.invalidateCache) {
            window.invalidateCache('estancias');
            console.log('🗑️ Caché de estancias invalidado después de eliminar');
          }

          // Recargar tabla
          await window.loadEstanciasTableFirebase();

          alert('Estancia eliminada exitosamente');
        }
      } catch (error) {
        console.error('❌ Error eliminando estancia:', error);
        alert('Error al eliminar la estancia');
      }
    };

    /**
     * Editar estancia (cargar en formulario)
     */
    window.editarEstanciaFirebase = async function (identificador) {
      try {
        const estancias = await window.loadEstanciasFromFirebase();
        const estancia = estancias.find(e => (e.codigo || e.nombre) === identificador);

        if (!estancia) {
          alert('Estancia no encontrada');
          return;
        }

        // Cambiar a la pestaña de estancias
        const estanciasTab = document.getElementById('estancias-tab');
        if (estanciasTab) {
          estanciasTab.click();
        }

        // Llenar formulario
        setTimeout(() => {
          document.getElementById('nombreEstancia').value = estancia.nombre || '';
          document.getElementById('codigoEstancia').value = estancia.codigo || '';
          document.getElementById('direccionEstancia').value = estancia.direccion || '';
          document.getElementById('observacionesEstancia').value = estancia.observaciones || '';

          // Scroll al formulario
          document.getElementById('estanciaForm').scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } catch (error) {
        console.error('❌ Error cargando estancia para edición:', error);
      }
    };

    /**
     * Guardar estancia en Firebase
     */
    window.saveEstanciaFirebase = async function (estanciaData) {
      try {
        console.log('💾 Guardando estancia en Firebase:', estanciaData);

        // CRÍTICO: Obtener tenantId actual para asignarlo a la estancia
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        console.log('🔑 TenantId a asignar a la estancia:', tenantId);

        // Preparar datos
        const ahora = new Date().toISOString();
        const estancia = {
          ...estanciaData,
          tenantId: tenantId, // Agregar tenantId a la estancia
          fechaActualizacion: ahora,
          fechaCreacion: estanciaData.fechaCreacion || ahora,
          fechaRegistro: estanciaData.fechaRegistro || ahora
        };

        // Leer estancias actuales
        const docRef = doc(db, 'configuracion', 'estancias');
        const docSnap = await getDoc(docRef);

        let estancias = [];
        if (docSnap.exists() && docSnap.data().estancias) {
          estancias = docSnap.data().estancias;
        }

        // Buscar si ya existe (por código o por nombre)
        const identificador = estancia.codigo || estancia.nombre;
        const existingIndex = estancias.findIndex(e => (e.codigo || e.nombre) === identificador);

        if (existingIndex >= 0) {
          // Actualizar existente
          estancias[existingIndex] = estancia;
          // console.log('🔄 Actualizando estancia existente:', estancia.nombre);
        } else {
          // Agregar nueva
          estancias.push(estancia);
          console.log('➕ Agregando nueva estancia:', estancia.nombre);
        }

        // Guardar en Firebase
        await setDoc(docRef, { estancias }, { merge: true });
        console.log('✅ Estancia guardada exitosamente en Firebase');

        return true;
      } catch (error) {
        console.error('❌ Error guardando estancia en Firebase:', error);
        return false;
      }
    };

    /**
     * Sobrescribir saveEstancia() para usar Firebase
     */
    window.saveEstancia = async function () {
      try {
        console.log('💾 saveEstancia() llamado');

        // Obtener datos del formulario
        const estancia = {
          nombre: document.getElementById('nombreEstancia')?.value || '',
          codigo: document.getElementById('codigoEstancia')?.value || '',
          direccion: document.getElementById('direccionEstancia')?.value || '',
          observaciones: document.getElementById('observacionesEstancia')?.value || '',
          fechaRegistro: new Date().toISOString()
        };

        // Validar campos requeridos
        if (!estancia.nombre) {
          alert('Por favor ingrese el nombre de la estancia');
          return false;
        }
        if (!estancia.direccion) {
          alert('Por favor ingrese la dirección de la estancia');
          return false;
        }

        // Guardar en Firebase
        const success = await window.saveEstanciaFirebase(estancia);

        if (success) {
          // Invalidar caché de estancias después de guardar
          if (window.invalidateCache) {
            window.invalidateCache('estancias');
            console.log('🗑️ Caché de estancias invalidado después de guardar');
          }

          alert('Estancia guardada exitosamente (sincronizada con Firebase)');

          // Limpiar formulario
          document.getElementById('estanciaForm').reset();

          // Recargar tabla
          await window.loadEstanciasTableFirebase();

          return true;
        }
        alert('Error al guardar la estancia');
        return false;
      } catch (error) {
        console.error('Error en saveEstancia:', error);
        alert(`Error al guardar la estancia: ${error.message}`);
        return false;
      }
    };

    /**
     * Sobrescribir loadEstanciasTable() para usar Firebase
     */
    window.loadEstanciasTable = async function () {
      await window.loadEstanciasTableFirebase();
    };

    /**
     * Sobrescribir clearEstanciaForm()
     */
    window.clearEstanciaForm = function () {
      document.getElementById('estanciaForm').reset();
    };

    /**
     * Limpiar estancias de localStorage
     */
    window.limpiarEstanciasLocalStorage = function () {
      if (
        confirm(
          '¿Está seguro de eliminar todas las estancias de localStorage? Esta acción no se puede deshacer.'
        )
      ) {
        localStorage.removeItem('erp_estancias');
        console.log('✅ Estancias eliminadas de localStorage');
        alert(
          'Estancias eliminadas de localStorage. Ahora use Firebase para crear nuevas estancias.'
        );
      }
    };

    // ===========================================
    // ALMACENES - FIREBASE
    // ===========================================

    /**
     * Cargar almacenes desde Firebase
     */
    window.loadAlmacenesFromFirebase = async function () {
      try {
        // console.log('📖 Cargando almacenes desde Firebase...');

        const docRef = doc(db, 'configuracion', 'almacenes');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().almacenes) {
          const { almacenes } = docSnap.data();

          // CRÍTICO: Filtrar almacenes por tenantId individual para mantener privacidad
          const tenantId =
            (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

          const almacenesFiltrados = almacenes.filter(almacen => {
            const almacenTenantId = almacen.tenantId;
            // Todos los usuarios solo ven almacenes con su tenantId exacto
            return almacenTenantId === tenantId;
          });

          console.log(
            `🔒 Almacenes filtrados por tenantId (${tenantId}): ${almacenesFiltrados.length} de ${almacenes.length} totales`
          );

          return almacenesFiltrados;
        }
        console.log('⚠️ No hay almacenes en Firebase');
        return [];
      } catch (error) {
        console.error('❌ Error cargando almacenes:', error);
        return [];
      }
    };

    /**
     * Cargar tabla de almacenes
     */
    window.loadAlmacenesTableFirebase = async function () {
      try {
        // console.log('📊 Cargando tabla de almacenes...');

        const almacenes = await window.loadAlmacenesFromFirebase();
        const tbody = document.getElementById('almacenesTableBody');

        if (!tbody) {
          console.error('❌ No se encontró almacenesTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (almacenes && almacenes.length > 0) {
          // console.log(`✅ Renderizando ${almacenes.length} almacenes en la tabla`);

          almacenes.forEach(almacen => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${almacen.nombre || ''}</td>
              <td>${almacen.codigo || '-'}</td>
              <td>${almacen.direccion || almacen.ubicacion || '-'}</td>
              <td>${almacen.observaciones || '-'}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editarAlmacenFirebase('${almacen.codigo || almacen.nombre}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarAlmacenFirebase('${almacen.codigo || almacen.nombre}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML =
            '<tr><td colspan="5" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay almacenes registrados. Use el formulario para agregar uno.</td></tr>';
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de almacenes:', error);
      }
    };

    /**
     * Eliminar almacén de Firebase
     */
    window.eliminarAlmacenFirebase = async function (identificador) {
      if (!confirm(`¿Está seguro de eliminar el almacén "${identificador}"?`)) {
        return;
      }

      try {
        console.log('🗑️ Eliminando almacén:', identificador);

        const docRef = doc(db, 'configuracion', 'almacenes');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().almacenes) {
          let { almacenes } = docSnap.data();
          almacenes = almacenes.filter(a => (a.codigo || a.nombre) !== identificador);

          await setDoc(docRef, { almacenes }, { merge: true });
          console.log('✅ Almacén eliminado');

          // Recargar tabla
          await window.loadAlmacenesTableFirebase();

          alert('Almacén eliminado exitosamente');
        }
      } catch (error) {
        console.error('❌ Error eliminando almacén:', error);
        alert('Error al eliminar el almacén');
      }
    };

    /**
     * Editar almacén (cargar en formulario)
     */
    window.editarAlmacenFirebase = async function (identificador) {
      try {
        const almacenes = await window.loadAlmacenesFromFirebase();
        const almacen = almacenes.find(a => (a.codigo || a.nombre) === identificador);

        if (!almacen) {
          alert('Almacén no encontrado');
          return;
        }

        // Cambiar a la pestaña de almacenes
        const almacenesTab = document.getElementById('almacenes-tab');
        if (almacenesTab) {
          almacenesTab.click();
        }

        // Llenar formulario
        setTimeout(() => {
          document.getElementById('nombreAlmacen').value = almacen.nombre || '';
          document.getElementById('codigoAlmacen').value = almacen.codigo || '';
          document.getElementById('direccionAlmacen').value =
            almacen.direccion || almacen.ubicacion || '';
          document.getElementById('observacionesAlmacen').value = almacen.observaciones || '';

          // Scroll al formulario
          document.getElementById('almacenForm').scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } catch (error) {
        console.error('❌ Error cargando almacén para edición:', error);
      }
    };

    /**
     * Guardar almacén en Firebase
     */
    window.saveAlmacenFirebase = async function (almacenData) {
      try {
        console.log('💾 Guardando almacén en Firebase:', almacenData);

        // CRÍTICO: Obtener tenantId actual para asignarlo al almacén
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        console.log('🔑 TenantId a asignar al almacén:', tenantId);

        // Preparar datos
        const ahora = new Date().toISOString();
        const almacen = {
          ...almacenData,
          tenantId: tenantId, // Agregar tenantId al almacén
          fechaActualizacion: ahora,
          fechaCreacion: almacenData.fechaCreacion || ahora,
          fechaRegistro: almacenData.fechaRegistro || ahora
        };

        // Leer almacenes actuales
        const docRef = doc(db, 'configuracion', 'almacenes');
        const docSnap = await getDoc(docRef);

        let almacenes = [];
        if (docSnap.exists() && docSnap.data().almacenes) {
          almacenes = docSnap.data().almacenes;
        }

        // Buscar si ya existe (por código o por nombre)
        const identificador = almacen.codigo || almacen.nombre;
        const existingIndex = almacenes.findIndex(a => (a.codigo || a.nombre) === identificador);

        if (existingIndex >= 0) {
          // Actualizar existente
          almacenes[existingIndex] = almacen;
          // console.log('🔄 Actualizando almacén existente:', almacen.nombre);
        } else {
          // Agregar nuevo
          almacenes.push(almacen);
          console.log('➕ Agregando nuevo almacén:', almacen.nombre);
        }

        // Guardar en Firebase
        await setDoc(docRef, { almacenes }, { merge: true });
        console.log('✅ Almacén guardado exitosamente en Firebase');

        return true;
      } catch (error) {
        console.error('❌ Error guardando almacén en Firebase:', error);
        return false;
      }
    };

    /**
     * Sobrescribir saveAlmacen() para usar Firebase
     */
    window.saveAlmacen = async function () {
      try {
        console.log('💾 saveAlmacen() llamado');

        // Obtener datos del formulario
        const almacen = {
          nombre: document.getElementById('nombreAlmacen')?.value || '',
          codigo: document.getElementById('codigoAlmacen')?.value || '',
          direccion: document.getElementById('direccionAlmacen')?.value || '',
          ubicacion: document.getElementById('direccionAlmacen')?.value || '', // Alias para compatibilidad
          observaciones: document.getElementById('observacionesAlmacen')?.value || '',
          fechaRegistro: new Date().toISOString()
        };

        // Validar campos requeridos
        if (!almacen.nombre) {
          alert('Por favor ingrese el nombre del almacén');
          return false;
        }

        // Guardar en Firebase
        const success = await window.saveAlmacenFirebase(almacen);

        if (success) {
          alert('Almacén guardado exitosamente (sincronizado con Firebase)');

          // Limpiar formulario
          document.getElementById('almacenForm').reset();

          // Recargar tabla
          await window.loadAlmacenesTableFirebase();

          return true;
        }
        alert('Error al guardar el almacén');
        return false;
      } catch (error) {
        console.error('Error en saveAlmacen:', error);
        alert(`Error al guardar el almacén: ${error.message}`);
        return false;
      }
    };

    /**
     * Sobrescribir loadAlmacenesTable() para usar Firebase
     */
    window.loadAlmacenesTable = async function () {
      await window.loadAlmacenesTableFirebase();
    };

    /**
     * Sobrescribir clearAlmacenForm()
     */
    window.clearAlmacenForm = function () {
      document.getElementById('almacenForm').reset();
    };

    /**
     * Limpiar almacenes de localStorage
     */
    window.limpiarAlmacenesLocalStorage = function () {
      if (
        confirm(
          '¿Está seguro de eliminar todos los almacenes de localStorage? Esta acción no se puede deshacer.'
        )
      ) {
        localStorage.removeItem('erp_almacenes');
        console.log('✅ Almacenes eliminados de localStorage');
        alert(
          'Almacenes eliminados de localStorage. Ahora use Firebase para crear nuevos almacenes.'
        );
      }
    };

    // ===========================================
    // USUARIOS - FIREBASE
    // ===========================================

    /**
     * Cargar usuarios desde Firebase
     */
    window.loadUsuariosFromFirebase = async function () {
      try {
        console.log('📖 Cargando usuarios desde Firebase...');

        // CRÍTICO: Obtener tenantId actual para filtrar usuarios por cliente
        const tenantIdActual = await obtenerTenantIdActual();
        console.log(`🔑 Filtrando usuarios por tenantId: ${tenantIdActual}`);

        const docRef = doc(db, 'configuracion', 'usuarios');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          if (data.usuarios) {
            // Asegurar que es un array
            let usuarios = Array.isArray(data.usuarios)
              ? data.usuarios
              : Object.values(data.usuarios);

            // CRÍTICO: Filtrar por tenantId para evitar riesgos de privacidad
            // Solo mostrar usuarios del mismo cliente (mismo tenantId)
            const usuariosAntesFiltro = usuarios.length;
            usuarios = usuarios.filter(
              u =>
                // Incluir solo usuarios con el mismo tenantId
                u.tenantId === tenantIdActual
            );

            console.log(
              `✅ Usuarios cargados: ${usuarios.length} de ${usuariosAntesFiltro} (filtrados por tenantId: ${tenantIdActual})`
            );

            return usuarios;
          }
          console.log('⚠️ Campo usuarios no existe en el documento');
          return [];
        }
        console.log('⚠️ No hay usuarios en Firebase (documento no existe)');
        return [];
      } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        return [];
      }
    };

    /**
     * Cargar tabla de usuarios
     */
    window.loadUsuariosTableFirebase = async function () {
      try {
        console.log('📊 Cargando tabla de usuarios...');

        const usuarios = await window.loadUsuariosFromFirebase();
        const tbody = document.getElementById('usuariosTableBody');

        if (!tbody) {
          console.error('❌ No se encontró usuariosTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (usuarios && usuarios.length > 0) {
          console.log(`✅ Renderizando ${usuarios.length} usuarios en la tabla`);

          usuarios.forEach(usuario => {
            // Obtener módulos que puede ver
            const modulosVer = usuario.permisos?.ver || [];
            const modulosVerTexto = modulosVer.length > 0 ? modulosVer.join(', ') : 'Ninguno';

            // Verificar si puede aprobar
            const puedeAprobar = usuario.permisos?.puedeAprobarSolicitudes || false;

            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${usuario.nombre || ''}</td>
              <td>${usuario.email || ''}</td>
              <td><small>${modulosVerTexto}</small></td>
              <td>
                ${puedeAprobar ? '<span class="badge bg-success"><i class="fas fa-check"></i> Sí</span>' : '<span class="badge bg-secondary"><i class="fas fa-times"></i> No</span>'}
              </td>
              <td>
                <button class="btn btn-sm btn-outline-info" onclick="verDetallesUsuarioFirebase('${usuario.email}')" title="Ver Detalles">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="editarUsuarioFirebase('${usuario.email}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuarioFirebase('${usuario.email}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML =
            '<tr><td colspan="5" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay usuarios registrados. Use el formulario para agregar uno.</td></tr>';
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de usuarios:', error);
      }
    };

    /**
     * Eliminar usuario de Firebase
     */
    window.eliminarUsuarioFirebase = async function (email) {
      if (!confirm(`¿Está seguro de eliminar el usuario con email ${email}?`)) {
        return;
      }

      try {
        console.log('🗑️ Eliminando usuario:', email);

        // CRÍTICO: Verificar que el usuario pertenece al tenantId actual antes de eliminar
        const tenantIdActual = await obtenerTenantIdActual();
        const usuariosActuales = await window.loadUsuariosFromFirebase();
        const usuarioAEliminar = usuariosActuales.find(u => u.email === email);

        if (!usuarioAEliminar) {
          alert('Usuario no encontrado o no pertenece a su organización');
          return;
        }

        // Verificar que el usuario pertenece al tenantId actual
        if (usuarioAEliminar.tenantId && usuarioAEliminar.tenantId !== tenantIdActual) {
          alert('⚠️ No tiene permisos para eliminar usuarios de otra organización');
          console.warn('⚠️ Intento de eliminar usuario de otro tenantId:', {
            usuarioTenantId: usuarioAEliminar.tenantId,
            tenantIdActual: tenantIdActual
          });
          return;
        }

        const docRef = doc(db, 'configuracion', 'usuarios');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().usuarios) {
          let { usuarios } = docSnap.data();
          usuarios = usuarios.filter(u => u.email !== email);

          await setDoc(docRef, { usuarios }, { merge: true });
          console.log('✅ Usuario eliminado');

          // Recargar tabla
          await window.loadUsuariosTableFirebase();

          alert('Usuario eliminado exitosamente');
        }
      } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        alert('Error al eliminar el usuario');
      }
    };

    /**
     * Ver detalles de usuario (modal de solo lectura)
     */
    window.verDetallesUsuarioFirebase = async function (email) {
      try {
        // CRÍTICO: loadUsuariosFromFirebase ya filtra por tenantId, pero verificamos por seguridad
        const usuarios = await window.loadUsuariosFromFirebase();
        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
          alert('Usuario no encontrado o no pertenece a su organización');
          return;
        }

        // Obtener módulos que puede ver
        const modulosVer = usuario.permisos?.ver || [];
        const modulosVerTexto = modulosVer.length > 0 ? modulosVer.join(', ') : 'Ninguno';

        // Verificar si puede aprobar
        const puedeAprobar = usuario.permisos?.puedeAprobarSolicitudes || false;

        // Obtener contraseña de aprobación
        const passwordAprobacion = usuario.passwordAprobacion || '';

        // Crear modal dinámico para mostrar detalles
        const modalHtml = `
          <div class="modal fade" id="verUsuarioModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header bg-info text-white">
                  <h5 class="modal-title">
                    <i class="fas fa-user"></i> Detalles del Usuario
                  </h5>
                  <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <strong>Nombre:</strong><br>
                      ${usuario.nombre || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Email:</strong><br>
                      ${usuario.email || '-'}
                    </div>
                    <div class="col-md-6">
                      <strong>Contraseña:</strong><br>
                      <div class="input-group">
                        <input type="password" class="form-control" id="passwordUsuarioDetalle" value="${usuario.password || ''}" readonly style="background-color: #f8f9fa;">
                        <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordDetalleUsuario()" title="Mostrar/Ocultar">
                          <i id="iconPasswordUsuarioDetalle" class="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                    <div class="col-md-12">
                      <strong>Módulos que puede ver:</strong><br>
                      ${modulosVerTexto}
                    </div>
                    <div class="col-md-6">
                      <strong>Puede aprobar solicitudes:</strong><br>
                      ${puedeAprobar ? '<span class="badge bg-success"><i class="fas fa-check"></i> Sí</span>' : '<span class="badge bg-secondary"><i class="fas fa-times"></i> No</span>'}
                    </div>
                    ${
  puedeAprobar && passwordAprobacion
    ? `
                    <div class="col-md-6">
                      <strong>Contraseña de Aprobación:</strong><br>
                      <div class="input-group">
                        <input type="password" class="form-control" id="passwordAprobacionDetalle" value="${passwordAprobacion}" readonly style="background-color: #f8f9fa;">
                        <button class="btn btn-outline-secondary" type="button" onclick="togglePasswordAprobacionDetalle()" title="Mostrar/Ocultar">
                          <i id="iconPasswordAprobacionDetalle" class="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                    `
    : ''
  }
                    ${
  usuario.fechaCreacion
    ? `
                    <div class="col-md-6">
                      <strong>Fecha de Creación:</strong><br>
                      ${new Date(usuario.fechaCreacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    `
    : ''
  }
                    ${
  usuario.fechaActualizacion
    ? `
                    <div class="col-md-6">
                      <strong>Última Actualización:</strong><br>
                      ${new Date(usuario.fechaActualizacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    `
    : ''
  }
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                  <button type="button" class="btn btn-danger" onclick="descargarPDFUsuarioFirebase('${usuario.email}')" title="Descargar PDF">
                    <i class="fas fa-file-pdf"></i> PDF
                  </button>
                  <button type="button" class="btn btn-primary" onclick="editarUsuarioFirebase('${usuario.email}'); bootstrap.Modal.getInstance(document.getElementById('verUsuarioModal')).hide();">
                    <i class="fas fa-edit"></i> Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('verUsuarioModal');
        if (modalAnterior) {
          modalAnterior.remove();
        }

        // Agregar modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('verUsuarioModal'));
        modal.show();

        // Limpiar modal cuando se cierre
        document.getElementById('verUsuarioModal').addEventListener('hidden.bs.modal', function () {
          this.remove();
        });

        // Función para mostrar/ocultar contraseña en el modal
        window.togglePasswordDetalleUsuario = function () {
          const input = document.getElementById('passwordUsuarioDetalle');
          const icon = document.getElementById('iconPasswordUsuarioDetalle');
          if (!input || !icon) {
            return;
          }
          if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        };

        // Función para mostrar/ocultar contraseña de aprobación en el modal
        window.togglePasswordAprobacionDetalle = function () {
          const input = document.getElementById('passwordAprobacionDetalle');
          const icon = document.getElementById('iconPasswordAprobacionDetalle');
          if (!input || !icon) {
            return;
          }
          if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        };
      } catch (error) {
        console.error('❌ Error mostrando detalles del usuario:', error);
        alert('Error al cargar los detalles del usuario');
      }
    };

    /**
     * Descargar PDF de detalles del usuario
     */
    window.descargarPDFUsuarioFirebase = async function (email) {
      try {
        // CRÍTICO: loadUsuariosFromFirebase ya filtra por tenantId
        const usuarios = await window.loadUsuariosFromFirebase();
        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
          alert('Usuario no encontrado o no pertenece a su organización');
          return;
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

        // Título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLES DEL USUARIO', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Información básica
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMACIÓN BÁSICA', margin, yPosition);
        yPosition += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Nombre: ${usuario.nombre || 'N/A'}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Email: ${usuario.email || 'N/A'}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Contraseña: ${usuario.password || 'N/A'}`, margin, yPosition);
        yPosition += 10;

        // Permisos
        doc.setFont('helvetica', 'bold');
        doc.text('PERMISOS', margin, yPosition);
        yPosition += 10;

        doc.setFont('helvetica', 'normal');
        const modulosVer = usuario.permisos?.ver || [];
        const modulosVerTexto = modulosVer.length > 0 ? modulosVer.join(', ') : 'Ninguno';
        doc.text(`Módulos que puede ver: ${modulosVerTexto}`, margin, yPosition);
        yPosition += 7;

        const puedeAprobar = usuario.permisos?.puedeAprobarSolicitudes || false;
        doc.text(`Puede aprobar solicitudes: ${puedeAprobar ? 'Sí' : 'No'}`, margin, yPosition);
        yPosition += 7;

        const passwordAprobacion = usuario.passwordAprobacion || '';
        if (puedeAprobar && passwordAprobacion) {
          doc.text(`Contraseña de Aprobación: ${passwordAprobacion}`, margin, yPosition);
          yPosition += 7;
        }
        yPosition += 5;

        // Fechas
        if (usuario.fechaCreacion || usuario.fechaActualizacion) {
          doc.setFont('helvetica', 'bold');
          doc.text('FECHAS', margin, yPosition);
          yPosition += 10;

          doc.setFont('helvetica', 'normal');
          if (usuario.fechaCreacion) {
            const fechaCreacion = new Date(usuario.fechaCreacion).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            doc.text(`Fecha de Creación: ${fechaCreacion}`, margin, yPosition);
            yPosition += 7;
          }
          if (usuario.fechaActualizacion) {
            const fechaActualizacion = new Date(usuario.fechaActualizacion).toLocaleDateString(
              'es-ES',
              { year: 'numeric', month: 'long', day: 'numeric' }
            );
            doc.text(`Última Actualización: ${fechaActualizacion}`, margin, yPosition);
            yPosition += 7;
          }
        }

        // Guardar PDF
        const fileName = `Usuario_${usuario.email.replace('@', '_').replace('.', '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      } catch (error) {
        console.error('❌ Error generando PDF del usuario:', error);
        alert('Error al generar el PDF del usuario');
      }
    };

    /**
     * Editar usuario (cargar en formulario)
     */
    window.editarUsuarioFirebase = async function (email) {
      try {
        // CRÍTICO: Verificar que el usuario pertenece al tenantId actual antes de editar
        const tenantIdActual = await obtenerTenantIdActual();
        const usuarios = await window.loadUsuariosFromFirebase();
        const usuario = usuarios.find(u => u.email === email);

        if (!usuario) {
          alert('Usuario no encontrado o no pertenece a su organización');
          return;
        }

        // Verificar que el usuario pertenece al tenantId actual
        if (usuario.tenantId && usuario.tenantId !== tenantIdActual) {
          alert('⚠️ No tiene permisos para editar usuarios de otra organización');
          console.warn('⚠️ Intento de editar usuario de otro tenantId:', {
            usuarioTenantId: usuario.tenantId,
            tenantIdActual: tenantIdActual
          });
          return;
        }

        // Cambiar a la pestaña de usuarios
        const usuariosTab = document.getElementById('usuarios-tab');
        if (usuariosTab) {
          usuariosTab.click();
        }

        // Llenar formulario
        setTimeout(() => {
          document.getElementById('usuarioNombre').value = usuario.nombre || '';
          document.getElementById('usuarioEmail').value = usuario.email || '';
          document.getElementById('usuarioPassword').value = ''; // No mostrar contraseña por seguridad
          document.getElementById('usuarioConfirmPassword').value = ''; // Limpiar confirmación también

          // Renderizar checkboxes de módulos si no existen
          const contenedorCheckboxes = document.getElementById('modulosVerContainer');
          if (!contenedorCheckboxes || contenedorCheckboxes.children.length === 0) {
            if (typeof renderModulosCheckboxes === 'function') {
              renderModulosCheckboxes();
              // console.log('✅ Checkboxes de módulos renderizados al editar usuario');
            } else {
              console.warn('⚠️ Función renderModulosCheckboxes no está disponible');
            }
          }

          // Marcar módulos que puede ver
          const modulosVer = usuario.permisos?.ver || [];
          // Esperar un momento para que los checkboxes se rendericen
          setTimeout(() => {
            const checkboxes = document.querySelectorAll(
              '#modulosVerContainer input[type="checkbox"]'
            );
            checkboxes.forEach(checkbox => {
              checkbox.checked = modulosVer.includes(checkbox.value);
            });

            // Marcar si puede aprobar
            const puedeAprobarCheckbox = document.getElementById('puedeAprobarSolicitudes');
            if (puedeAprobarCheckbox) {
              puedeAprobarCheckbox.checked = usuario.permisos?.puedeAprobarSolicitudes || false;
            }
          }, 100);

          // Scroll al formulario
          document.getElementById('usuarioForm').scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } catch (error) {
        console.error('❌ Error cargando usuario para edición:', error);
      }
    };

    /**
     * Función auxiliar para obtener el tenantId actual
     * Sigue la misma lógica que firebase-repo-base.js
     * NOTA: La función de verificación window.verificarTenantIdUsuarios()
     * está disponible en firebase-init.js para todos los usuarios
     */
    async function obtenerTenantIdActual() {
      try {
        let tenantId = null;
        let fuente = '';

        // PRIORIDAD 1: Verificar si hay una licencia activa
        if (window.licenseManager && window.licenseManager.isLicenseActive()) {
          const licenseTenantId = window.licenseManager.getTenantId();
          if (licenseTenantId) {
            tenantId = licenseTenantId;
            fuente = 'licencia activa';
          }
        }

        // PRIORIDAD 2: Verificar tenantId guardado en localStorage
        if (!tenantId) {
          const savedTenantId = localStorage.getItem('tenantId');
          if (savedTenantId) {
            tenantId = savedTenantId;
            fuente = 'localStorage';
          }
        }

        // PRIORIDAD 3: Obtener tenantId del usuario actual
        if (
          !tenantId &&
          window.firebaseAuth &&
          window.firebaseAuth.currentUser &&
          window.fs &&
          window.firebaseDb
        ) {
          try {
            const { currentUser } = window.firebaseAuth;
            const userDocRef = window.fs.doc(window.firebaseDb, 'users', currentUser.uid);
            const userDoc = await window.fs.getDoc(userDocRef);
            if (userDoc.exists()) {
              const userTenantId = userDoc.data().tenantId;
              if (userTenantId) {
                tenantId = userTenantId;
                fuente = 'usuario Firebase';
              }
            }
          } catch (error) {
            console.warn('⚠️ Error obteniendo tenantId del usuario actual:', error);
          }
        }

        // PRIORIDAD 4: Fallback a DEMO_CONFIG.tenantId si está disponible
        if (!tenantId && window.DEMO_CONFIG && window.DEMO_CONFIG.tenantId) {
          tenantId = window.DEMO_CONFIG.tenantId;
          fuente = 'DEMO_CONFIG';
        }

        // Fallback final
        if (!tenantId) {
          tenantId = 'demo_tenant';
          fuente = 'fallback (demo_tenant)';
        }

        // Log visible del tenantId actual
        console.log(
          '%c🔑 TENANT ID ACTUAL',
          'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;'
        );
        console.log(
          `%cTenantId: ${tenantId}`,
          'color: #2196F3; font-weight: bold; font-size: 16px;'
        );
        console.log(`%cFuente: ${fuente}`, 'color: #666; font-size: 12px;');
        console.log('─'.repeat(50));

        return tenantId;
      } catch (error) {
        console.error('❌ Error obteniendo tenantId:', error);
        // En caso de error, intentar usar DEMO_CONFIG.tenantId si está disponible
        const fallbackTenantId =
          (window.DEMO_CONFIG && window.DEMO_CONFIG.tenantId) || 'demo_tenant';
        console.log(
          '%c🔑 TENANT ID ACTUAL (FALLBACK)',
          'background: #FF9800; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
        );
        console.log(
          `%cTenantId: ${fallbackTenantId}`,
          'color: #FF9800; font-weight: bold; font-size: 16px;'
        );
        return fallbackTenantId;
      }
    }

    /**
     * Función global para mostrar el tenantId actual
     */
    window.mostrarTenantIdActual = async function () {
      const tenantId = await obtenerTenantIdActual();
      console.log(
        '%c═══════════════════════════════════════════════════════════',
        'color: #4CAF50; font-weight: bold;'
      );
      console.log(
        '%c🔑 TENANT ID ACTUAL',
        'background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 16px;'
      );
      console.log(`%c   ${tenantId}`, 'color: #2196F3; font-weight: bold; font-size: 18px;');
      console.log(
        '%c═══════════════════════════════════════════════════════════',
        'color: #4CAF50; font-weight: bold;'
      );
      return tenantId;
    };

    /**
     * Guardar usuario en Firebase (Firestore + Authentication)
     */
    window.saveUsuarioFirebase = async function (usuarioData) {
      try {
        console.log('💾 Guardando usuario en Firebase:', { ...usuarioData, password: '***' });

        // Verificar que db, doc y setDoc estén disponibles
        if (!db || !doc || !setDoc || !getDoc) {
          console.error('❌ Firebase no está completamente inicializado:', {
            db: Boolean(db),
            doc: Boolean(doc),
            setDoc: Boolean(setDoc),
            getDoc: Boolean(getDoc)
          });
          return false;
        }

        // CRÍTICO: Obtener tenantId actual para asignarlo al usuario
        const tenantId = await obtenerTenantIdActual();
        console.log('🔑 TenantId a asignar al usuario:', tenantId);

        // Preparar datos
        const ahora = new Date().toISOString();
        const usuario = {
          nombre: usuarioData.nombre,
          email: usuarioData.email,
          password: usuarioData.password, // Guardado para referencia (no es seguro en producción)
          permisos: usuarioData.permisos || { ver: [], puedeAprobarSolicitudes: false },
          passwordAprobacion: usuarioData.passwordAprobacion || '',
          fechaActualizacion: ahora,
          fechaCreacion: usuarioData.fechaCreacion || ahora,
          fechaRegistro: usuarioData.fechaRegistro || ahora,
          tenantId: tenantId // CRÍTICO: Asignar tenantId al usuario
        };

        // Leer usuarios actuales
        const docRef = doc(db, 'configuracion', 'usuarios');
        console.log('📄 Referencia del documento:', docRef.path);

        const docSnap = await getDoc(docRef);
        console.log('📖 Documento existe:', docSnap.exists());

        let usuarios = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('📋 Datos completos del documento:', data);
          console.log('📋 Campo usuarios existe?:', Boolean(data.usuarios));
          console.log('📋 Tipo de usuarios:', typeof data.usuarios);
          console.log('📋 Es array?:', Array.isArray(data.usuarios));

          if (data.usuarios) {
            usuarios = Array.isArray(data.usuarios) ? data.usuarios : Object.values(data.usuarios);
            console.log('📊 Usuarios existentes antes de guardar:', usuarios.length);
            console.log(
              '📋 Emails de usuarios existentes:',
              usuarios.map(u => u.email || 'sin email')
            );
          } else {
            console.log('📊 Campo usuarios no existe o está vacío');
          }
        } else {
          console.log('📊 Documento no existe, creando nuevo array');
        }

        // Buscar si ya existe
        const existingIndex = usuarios.findIndex(u => u.email === usuario.email);
        let nuevoUsuarioUid = null;

        if (existingIndex >= 0) {
          // Actualizar existente
          // Si no se proporciona nueva contraseña, mantener la anterior
          if (!usuarioData.password) {
            usuario.password = usuarios[existingIndex].password;
          }
          // CRÍTICO: Preservar el tenantId existente del usuario (no cambiarlo al actualizar)
          if (usuarios[existingIndex].tenantId) {
            usuario.tenantId = usuarios[existingIndex].tenantId;
            console.log('🔑 Preservando tenantId existente del usuario:', usuario.tenantId);
          } else {
            // Si no tenía tenantId, asignar el actual
            usuario.tenantId = tenantId;
            console.log('🔑 Asignando tenantId al usuario actualizado (no tenía uno):', tenantId);
          }
          usuarios[existingIndex] = usuario;
          // console.log('🔄 Actualizando usuario existente:', usuario.email, 'en índice:', existingIndex);
        } else {
          // Agregar nuevo
          usuarios.push(usuario);
          console.log('➕ Agregando nuevo usuario:', usuario.email);
          console.log('📊 Total de usuarios después de agregar:', usuarios.length);
          console.log(
            '📋 Todos los emails después de agregar:',
            usuarios.map(u => u.email)
          );

          // CREAR USUARIO EN FIREBASE AUTHENTICATION (solo para nuevos usuarios)
          if (usuarioData.password) {
            try {
              console.log('🔐 Creando usuario en Firebase Authentication...');

              // Verificar que Firebase Auth esté disponible
              if (!window.firebaseAuth) {
                console.warn('⚠️ Firebase Auth no está disponible, guardando solo en Firestore');
              } else {
                // Guardar el usuario actual para restaurarlo después
                const { currentUser: _currentUser } = window.firebaseAuth;

                // Importar funciones de autenticación de Firebase v9+
                const { createUserWithEmailAndPassword, updateProfile, signOut: _signOut } = await import(
                  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
                );

                // Crear el nuevo usuario en Authentication usando Firebase v9+ modular
                const userCredential = await createUserWithEmailAndPassword(
                  window.firebaseAuth,
                  usuarioData.email,
                  usuarioData.password
                );

                nuevoUsuarioUid = userCredential.user.uid;
                console.log('✅ Usuario creado en Authentication:', nuevoUsuarioUid);

                // Actualizar el perfil con el nombre
                if (usuarioData.nombre) {
                  await updateProfile(userCredential.user, {
                    displayName: usuarioData.nombre
                  });
                }

                // Obtener el tenantId correcto para el nuevo usuario
                const tenantId = await obtenerTenantIdActual();

                // CREAR DOCUMENTO users/{uid} CON EL tenantId CORRECTO
                // Intentar con Firebase v10 primero, luego fallback a v8
                if (nuevoUsuarioUid) {
                  try {
                    // PRIORIDAD 1: Intentar con Firebase v10 (window.fs)
                    if (window.fs && window.firebaseDb) {
                      const userDocRef = window.fs.doc(window.firebaseDb, 'users', nuevoUsuarioUid);
                      await window.fs.setDoc(
                        userDocRef,
                        {
                          tenantId: tenantId,
                          email: usuarioData.email,
                          nombre: usuarioData.nombre,
                          createdAt: new Date().toISOString(),
                          isAnonymous: false
                        },
                        { merge: true }
                      );
                      console.log(
                        `✅ Documento users/${nuevoUsuarioUid} creado con tenantId: ${tenantId} (Firebase v10)`
                      );
                    } else if (db && doc && setDoc) {
                    // PRIORIDAD 2: Fallback usando Firebase v10 (si no está disponible de otra manera)
                      const userDocRef = doc(db, 'users', nuevoUsuarioUid);
                      await setDoc(
                        userDocRef,
                        {
                          tenantId: tenantId,
                          email: usuarioData.email,
                          nombre: usuarioData.nombre,
                          createdAt: new Date().toISOString(),
                          isAnonymous: false
                        },
                        { merge: true }
                      );
                      console.log(
                        `✅ Documento users/${nuevoUsuarioUid} creado con tenantId: ${tenantId} (Firebase v10)`
                      );
                    } else {
                      console.warn(
                        '⚠️ No hay instancia de Firebase disponible para crear documento users/{uid}'
                      );
                    }
                  } catch (userDocError) {
                    console.error('❌ Error creando documento users/{uid}:', userDocError);
                    // No lanzar error, continuar con el proceso
                  }
                }

                // NO hacer signOut aquí - necesitamos mantener la sesión para guardar en Firestore
                // El signOut se hará después de guardar exitosamente en Firestore (si es necesario)
                console.log('✅ Usuario creado exitosamente en Authentication');
              }
            } catch (authError) {
              console.warn(
                '⚠️ Error creando usuario en Authentication:',
                authError.message,
                authError.code
              );
              // Si el usuario ya existe en Auth, continuar guardando en Firestore de todas formas
              if (authError.code === 'auth/email-already-in-use') {
                console.log(
                  'ℹ️ El usuario ya existe en Authentication, guardando en Firestore de todas formas...'
                );
                // Continuar con el guardado en Firestore
              } else {
                // Para otros errores, loguear pero continuar guardando en Firestore
                console.warn(
                  '⚠️ Error en Authentication, pero se guardará en Firestore de todas formas:',
                  authError.message
                );
              }
            }
          }
        }

        // Guardar en Firestore (SIEMPRE, incluso si hubo errores en Authentication)
        try {
          console.log('💾 Intentando guardar en Firestore...');
          console.log('📊 Datos a guardar:', {
            totalUsuarios: usuarios.length,
            usuarios: usuarios.map(u => ({ nombre: u.nombre, email: u.email }))
          });

          // VERIFICAR AUTENTICACIÓN ANTES DE GUARDAR
          console.log('🔐 Verificando autenticación antes de guardar...');
          console.log('  - window.firebaseAuth existe?:', Boolean(window.firebaseAuth));
          console.log(
            '  - currentUser existe?:',
            Boolean(window.firebaseAuth && window.firebaseAuth.currentUser)
          );

          if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
            console.warn('⚠️ No hay usuario autenticado. Intentando autenticación anónima...');
            try {
              const { signInAnonymously } = await import(
                'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'
              );
              await signInAnonymously(window.firebaseAuth);
              console.log('✅ Autenticación anónima exitosa antes de guardar');
            } catch (authErr) {
              console.error('❌ Error en autenticación anónima:', authErr);
              throw new Error(
                'No se pudo autenticar. Las operaciones de Firestore requieren autenticación.'
              );
            }
          } else {
            const { currentUser } = window.firebaseAuth;
            console.log(
              '✅ Usuario autenticado:',
              currentUser.uid,
              currentUser.isAnonymous ? '(anónimo)' : `(${currentUser.email})`
            );
            console.log('  - UID:', currentUser.uid);
            console.log('  - Is Anonymous:', currentUser.isAnonymous);
            console.log('  - Email:', currentUser.email || 'N/A');
          }

          // Obtener tenantId para incluirlo en el documento
          const tenantId = await obtenerTenantIdActual();
          console.log('🔑 TenantId a usar al guardar:', tenantId);

          // Guardar usando las funciones desestructuradas, INCLUYENDO tenantId
          await setDoc(
            docRef,
            {
              usuarios,
              tenantId: tenantId,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          console.log('✅ Usuario guardado exitosamente en Firestore');
          console.log('📊 Total de usuarios guardados:', usuarios.length);

          // Verificar que se guardó correctamente leyendo de nuevo (esperar un poco)
          await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms para que Firestore se sincronice

          const verifyDoc = await getDoc(docRef);
          if (verifyDoc.exists()) {
            const verifyData = verifyDoc.data();
            const verifyUsuarios = verifyData.usuarios || [];
            console.log(
              '✅ Verificación: Usuarios en Firestore después de guardar:',
              verifyUsuarios.length
            );
            console.log(
              '📋 Emails de usuarios guardados:',
              verifyUsuarios.map(u => u.email)
            );

            if (verifyUsuarios.length !== usuarios.length) {
              console.warn('⚠️ ADVERTENCIA: El número de usuarios no coincide después de guardar!');
              console.warn('⚠️ Esperado:', usuarios.length, '| Encontrado:', verifyUsuarios.length);
            } else {
              console.log('✅ Verificación exitosa: El número de usuarios coincide');
            }
          } else {
            console.error('❌ ERROR: El documento no existe después de guardar!');
            return false;
          }

          // Después de guardar exitosamente, opcionalmente restaurar sesión original
          // Por ahora, dejamos la sesión activa ya que el guardado fue exitoso
          console.log('✅ Usuario guardado completamente. Sesión mantenida activa.');
        } catch (firestoreError) {
          console.error('❌ Error guardando en Firestore:', firestoreError);
          console.error('❌ Detalles del error:', {
            code: firestoreError.code,
            message: firestoreError.message,
            stack: firestoreError.stack
          });

          // Diagnóstico adicional
          console.error('🔍 Diagnóstico de autenticación:');
          console.error('  - window.firebaseAuth existe?:', Boolean(window.firebaseAuth));
          console.error(
            '  - currentUser existe?:',
            Boolean(window.firebaseAuth && window.firebaseAuth.currentUser)
          );
          if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            const user = window.firebaseAuth.currentUser;
            console.error('  - User UID:', user.uid);
            console.error('  - Is Anonymous:', user.isAnonymous);
            console.error('  - Email:', user.email || 'N/A');
          }
          console.error('  - Documento:', docRef.path);
          const tenantId = await obtenerTenantIdActual();
          console.error('  - TenantId:', tenantId);

          // Si es error de permisos, dar instrucciones claras
          if (firestoreError.code === 'permission-denied') {
            console.error('');
            console.error('╔═══════════════════════════════════════════════════════════════╗');
            console.error('║          ⚠️  ERROR DE PERMISOS EN FIRESTORE  ⚠️               ║');
            console.error('╠═══════════════════════════════════════════════════════════════╣');
            console.error('║ Las reglas de Firestore NO están desplegadas o no permiten   ║');
            console.error('║ la escritura. Para solucionarlo, ejecuta:                     ║');
            console.error('║                                                               ║');
            console.error('║  npm run deploy:firestore                                     ║');
            console.error('║                                                               ║');
            console.error('║ O manualmente:                                                ║');
            console.error('║  firebase deploy --only firestore:rules                       ║');
            console.error('║                                                               ║');
            console.error('║ Si no tienes Firebase CLI instalado:                          ║');
            console.error('║  1. npm install -g firebase-tools                             ║');
            console.error('║  2. firebase login                                             ║');
            console.error('║  3. npm run deploy:firestore                                   ║');
            console.error('║                                                               ║');
            console.error('║ O desde Firebase Console:                                     ║');
            console.error('║  1. Ve a https://console.firebase.google.com/                 ║');
            console.error('║  2. Selecciona tu proyecto                                    ║');
            console.error('║  3. Firestore Database → Reglas                               ║');
            console.error('║  4. Copia el contenido de firestore.rules                     ║');
            console.error('║  5. Pega y Publica                                            ║');
            console.error('╚═══════════════════════════════════════════════════════════════╝');
            console.error('');
          }

          throw firestoreError; // Este error SÍ debe detener el proceso
        }

        return true;
      } catch (error) {
        console.error('❌ Error guardando usuario en Firebase:', error);
        return false;
      }
    };

    /**
     * Sobrescribir saveUsuario() para usar Firebase
     * IMPORTANTE: Esta función DEBE sobrescribir la función de configuracion.js
     */
    // console.log('🔄 Sobrescribiendo window.saveUsuario con versión Firebase...');
    const oldSaveUsuario = window.saveUsuario;
    // if (oldSaveUsuario) {
    //   console.log('⚠️ Se encontró una función saveUsuario anterior. Será reemplazada.');
    // }

    // Guardar referencia a la función antigua para depuración
    window._oldSaveUsuario = oldSaveUsuario;

    window.saveUsuario = async function () {
      try {
        // console.log('💾 saveUsuario() llamado (VERSIÓN FIREBASE)');
        // console.log('🔍 Verificando que esta es la función correcta de Firebase...');

        // Verificar que Firebase esté disponible
        if (!db || !doc || !setDoc || !getDoc) {
          console.error('❌ Firebase no está inicializado. Esperando...');
          alert(
            'Firebase aún no está listo. Por favor, espera unos segundos e intenta nuevamente.'
          );
          return false;
        }

        // Obtener datos del formulario
        const nombre = document.getElementById('usuarioNombre')?.value || '';
        const email = document.getElementById('usuarioEmail')?.value || '';
        const password = document.getElementById('usuarioPassword')?.value || '';
        const passwordAprobacion = document.getElementById('passwordAprobacion')?.value || '';
        const confirmPasswordAprobacion =
          document.getElementById('confirmPasswordAprobacion')?.value || '';

        // Validar campos requeridos
        if (!nombre) {
          alert('Por favor ingrese el nombre del usuario');
          return false;
        }
        if (!email) {
          alert('Por favor ingrese el email del usuario');
          return false;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert('Por favor ingrese un email válido');
          return false;
        }

        // Si es nuevo usuario, validar contraseña
        const usuarios = await window.loadUsuariosFromFirebase();
        const usuarioExistente = usuarios.find(u => u.email === email);

        if (!usuarioExistente && !password) {
          alert('Por favor ingrese una contraseña para el nuevo usuario');
          return false;
        }

        // Validar contraseña de aprobación si se proporcionó
        if (passwordAprobacion || confirmPasswordAprobacion) {
          if (passwordAprobacion !== confirmPasswordAprobacion) {
            alert('Las contraseñas de aprobación no coinciden');
            return false;
          }
        }

        // Obtener módulos seleccionados
        const modulosVer = [];
        const checkboxes = document.querySelectorAll(
          '#modulosVerContainer input[type="checkbox"]:checked'
        );
        checkboxes.forEach(checkbox => {
          modulosVer.push(checkbox.value);
        });

        // Obtener si puede aprobar
        const puedeAprobar = document.getElementById('puedeAprobarSolicitudes')?.checked || false;

        // Preparar datos del usuario
        const usuario = {
          nombre: nombre,
          email: email,
          password: password,
          permisos: {
            ver: modulosVer,
            puedeAprobarSolicitudes: puedeAprobar
          },
          passwordAprobacion: passwordAprobacion,
          fechaRegistro: new Date().toISOString()
        };

        // Guardar en Firebase
        const success = await window.saveUsuarioFirebase(usuario);

        if (success) {
          alert('Usuario guardado exitosamente (sincronizado con Firebase)');

          // Limpiar formulario
          document.getElementById('usuarioForm').reset();

          // Desmarcar checkboxes
          const allCheckboxes = document.querySelectorAll(
            '#modulosVerContainer input[type="checkbox"]'
          );
          allCheckboxes.forEach(cb => (cb.checked = false));

          // Recargar tabla
          await window.loadUsuariosTableFirebase();

          return true;
        }
        alert('Error al guardar el usuario');
        return false;
      } catch (error) {
        console.error('Error en saveUsuario:', error);
        alert(`Error al guardar el usuario: ${error.message}`);
        return false;
      }
    };

    /**
     * Sobrescribir loadUsuariosTable() para usar Firebase
     */
    window.loadUsuariosTable = async function () {
      await window.loadUsuariosTableFirebase();
    };

    /**
     * Sobrescribir clearUsuarioForm()
     */
    window.clearUsuarioForm = function () {
      document.getElementById('usuarioForm')?.reset();

      // Renderizar checkboxes de módulos si no existen
      if (typeof renderModulosCheckboxes === 'function') {
        renderModulosCheckboxes();
      } else {
        // Si la función no está disponible, intentar desmarcar los existentes
        const checkboxes = document.querySelectorAll('#modulosVerContainer input[type="checkbox"]');
        checkboxes.forEach(cb => (cb.checked = false));
      }

      // Limpiar checkbox de aprobación
      const puedeAprobarCheckbox = document.getElementById('puedeAprobarSolicitudes');
      if (puedeAprobarCheckbox) {
        puedeAprobarCheckbox.checked = false;
      }

      // Limpiar campos de contraseña de aprobación
      const passwordAprobacion = document.getElementById('passwordAprobacion');
      const confirmPasswordAprobacion = document.getElementById('confirmPasswordAprobacion');
      if (passwordAprobacion) {
        passwordAprobacion.value = '';
      }
      if (confirmPasswordAprobacion) {
        confirmPasswordAprobacion.value = '';
      }
    };

    /**
     * Limpiar usuarios de localStorage
     */
    window.limpiarUsuariosLocalStorage = function () {
      if (
        confirm(
          '¿Está seguro de eliminar todos los usuarios de localStorage? Esta acción no se puede deshacer.'
        )
      ) {
        localStorage.removeItem('erp_usuarios');
        console.log('✅ Usuarios eliminados de localStorage');
        alert(
          'Usuarios eliminados de localStorage. Ahora use Firebase para crear nuevos usuarios.'
        );
      }
    };

    // ===========================================
    // FUNCIONES DE LIMPIEZA MASIVA
    // ===========================================

    /**
     * Limpiar todos los económicos de localStorage y Firebase
     */
    window.limpiarTodosEconomicos = async function () {
      if (
        !confirm(
          '¿Está seguro de eliminar TODOS los económicos de localStorage y Firebase? Esta acción no se puede deshacer.'
        )
      ) {
        return;
      }

      try {
        // Limpiar localStorage
        localStorage.removeItem('erp_economicos');
        console.log('✅ Económicos eliminados de localStorage');

        // Limpiar Firebase
        const { collection, query, where, getDocs, deleteDoc } = window.fs;
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const economicosRef = collection(window.firebaseDb, 'economicos');
        const q = query(economicosRef, where('tenantId', '==', tenantId));

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${snapshot.docs.length} económicos eliminados de Firebase`);

        // Recargar tabla
        window.loadEconomicosTableFirebase();

        alert(
          `✅ Se eliminaron ${snapshot.docs.length} económicos de Firebase y todos los de localStorage`
        );
      } catch (error) {
        console.error('❌ Error eliminando económicos:', error);
        alert(`❌ Error al eliminar económicos: ${error.message}`);
      }
    };

    /**
     * Limpiar todos los operadores de localStorage y Firebase
     */
    window.limpiarTodosOperadores = async function () {
      if (
        !confirm(
          '¿Está seguro de eliminar TODOS los operadores de localStorage y Firebase? Esta acción no se puede deshacer.'
        )
      ) {
        return;
      }

      try {
        // Limpiar localStorage
        localStorage.removeItem('erp_operadores');
        console.log('✅ Operadores eliminados de localStorage');

        // Limpiar Firebase
        const { collection, query, where, getDocs, deleteDoc } = window.fs;
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const operadoresRef = collection(window.firebaseDb, 'operadores_config');
        const q = query(operadoresRef, where('tenantId', '==', tenantId));

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${snapshot.docs.length} operadores eliminados de Firebase`);

        // Recargar tabla
        window.loadOperadoresTableFirebase();

        alert(
          `✅ Se eliminaron ${snapshot.docs.length} operadores de Firebase y todos los de localStorage`
        );
      } catch (error) {
        console.error('❌ Error eliminando operadores:', error);
        alert(`❌ Error al eliminar operadores: ${error.message}`);
      }
    };

    /**
     * Limpiar todos los clientes de localStorage y Firebase
     */
    window.limpiarTodosClientes = async function () {
      if (
        !confirm(
          '¿Está seguro de eliminar TODOS los clientes de localStorage y Firebase? Esta acción no se puede deshacer.'
        )
      ) {
        return;
      }

      try {
        // Limpiar localStorage
        localStorage.removeItem('erp_clientes');
        console.log('✅ Clientes eliminados de localStorage');

        // Limpiar Firebase
        const { collection, query, where, getDocs, deleteDoc } = window.fs;
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const clientesRef = collection(window.firebaseDb, 'clientes');
        const q = query(clientesRef, where('tenantId', '==', tenantId));

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${snapshot.docs.length} clientes eliminados de Firebase`);

        // Recargar tabla
        window.loadClientesTableFirebase();

        alert(
          `✅ Se eliminaron ${snapshot.docs.length} clientes de Firebase y todos los de localStorage`
        );
      } catch (error) {
        console.error('❌ Error eliminando clientes:', error);
        alert(`❌ Error al eliminar clientes: ${error.message}`);
      }
    };

    /**
     * Limpiar todos los proveedores de localStorage y Firebase
     */
    window.limpiarTodosProveedores = async function () {
      if (
        !confirm(
          '¿Está seguro de eliminar TODOS los proveedores de localStorage y Firebase? Esta acción no se puede deshacer.'
        )
      ) {
        return;
      }

      try {
        // Limpiar localStorage
        localStorage.removeItem('erp_proveedores');
        console.log('✅ Proveedores eliminados de localStorage');

        // Limpiar Firebase
        const { collection, query, where, getDocs, deleteDoc } = window.fs;
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const proveedoresRef = collection(window.firebaseDb, 'proveedores');
        const q = query(proveedoresRef, where('tenantId', '==', tenantId));

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${snapshot.docs.length} proveedores eliminados de Firebase`);

        // Recargar tabla
        window.loadProveedoresTableFirebase();

        alert(
          `✅ Se eliminaron ${snapshot.docs.length} proveedores de Firebase y todos los de localStorage`
        );
      } catch (error) {
        console.error('❌ Error eliminando proveedores:', error);
        alert(`❌ Error al eliminar proveedores: ${error.message}`);
      }
    };

    /**
     * Limpiar todas las estancias de localStorage y Firebase
     */
    window.limpiarTodasEstancias = async function () {
      if (
        !confirm(
          '¿Está seguro de eliminar TODAS las estancias de localStorage y Firebase? Esta acción no se puede deshacer.'
        )
      ) {
        return;
      }

      try {
        // Limpiar localStorage
        localStorage.removeItem('erp_estancias');
        console.log('✅ Estancias eliminadas de localStorage');

        // Limpiar Firebase
        const { collection, query, where, getDocs, deleteDoc } = window.fs;
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const estanciasRef = collection(window.firebaseDb, 'estancias');
        const q = query(estanciasRef, where('tenantId', '==', tenantId));

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${snapshot.docs.length} estancias eliminadas de Firebase`);

        // Recargar tabla
        window.loadEstanciasTableFirebase();

        alert(
          `✅ Se eliminaron ${snapshot.docs.length} estancias de Firebase y todas las de localStorage`
        );
      } catch (error) {
        console.error('❌ Error eliminando estancias:', error);
        alert(`❌ Error al eliminar estancias: ${error.message}`);
      }
    };

    /**
     * Limpiar todos los almacenes de localStorage y Firebase
     */
    window.limpiarTodosAlmacenes = async function () {
      if (
        !confirm(
          '¿Está seguro de eliminar TODOS los almacenes de localStorage y Firebase? Esta acción no se puede deshacer.'
        )
      ) {
        return;
      }

      try {
        // Limpiar localStorage
        localStorage.removeItem('erp_almacenes');
        console.log('✅ Almacenes eliminados de localStorage');

        // Limpiar Firebase
        const { collection, query, where, getDocs, deleteDoc } = window.fs;
        const tenantId =
          (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const almacenesRef = collection(window.firebaseDb, 'almacenes');
        const q = query(almacenesRef, where('tenantId', '==', tenantId));

        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ ${snapshot.docs.length} almacenes eliminados de Firebase`);

        // Recargar tabla
        window.loadAlmacenesTableFirebase();

        alert(
          `✅ Se eliminaron ${snapshot.docs.length} almacenes de Firebase y todos los de localStorage`
        );
      } catch (error) {
        console.error('❌ Error eliminando almacenes:', error);
        alert(`❌ Error al eliminar almacenes: ${error.message}`);
      }
    };

    /**
     * Cargar cuentas bancarias desde Firebase
     */
    window.loadCuentasBancariasFromFirebase = async function () {
      try {
        if (!db || !doc || !getDoc) {
          console.warn('⚠️ Firebase no está completamente inicializado');
          return [];
        }

        const docRef = doc(db, 'configuracion', 'cuentas_bancarias');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().cuentasBancarias) {
          const { cuentasBancarias } = docSnap.data();

          // CRÍTICO: Filtrar cuentas bancarias por tenantId individual para mantener privacidad
          const tenantId =
            (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

          const cuentasFiltradas = cuentasBancarias.filter(cuenta => {
            const cuentaTenantId = cuenta.tenantId;
            // Todos los usuarios solo ven cuentas con su tenantId exacto
            return cuentaTenantId === tenantId;
          });

          console.log(
            `🔒 Cuentas bancarias filtradas por tenantId (${tenantId}): ${cuentasFiltradas.length} de ${cuentasBancarias.length} totales`
          );

          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setCuentasBancarias(cuentasFiltradas);
          }

          return cuentasFiltradas;
        }
        console.log('📋 No hay cuentas bancarias en Firebase');
        return [];
      } catch (error) {
        console.error('❌ Error cargando cuentas bancarias desde Firebase:', error);
        return [];
      }
    };

    /**
     * Cargar tabla de cuentas bancarias desde Firebase
     */
    window.loadCuentasBancariasTableFirebase = async function () {
      try {
        const cuentasBancarias = await window.loadCuentasBancariasFromFirebase();
        const tbody = document.getElementById('cuentasBancariasTableBody');

        if (!tbody) {
          console.error('❌ No se encontró cuentasBancariasTableBody');
          return;
        }

        tbody.innerHTML = '';

        if (cuentasBancarias && cuentasBancarias.length > 0) {
          console.log(`✅ Renderizando ${cuentasBancarias.length} cuentas bancarias en la tabla`);

          cuentasBancarias.forEach(cuenta => {
            const numeroCuentaEscaped = (cuenta.numeroCuenta || '').replace(/'/g, "\\'");
            const saldoInicial = parseFloat(cuenta.saldoInicial || 0);
            const saldoFormateado = new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: cuenta.moneda || 'MXN',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(saldoInicial);

            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${cuenta.banco || ''}</td>
              <td>${cuenta.numeroCuenta || ''}</td>
              <td>${cuenta.clabe || ''}</td>
              <td>${cuenta.tipoCuenta || ''}</td>
              <td>${cuenta.moneda || ''}</td>
              <td><strong>${saldoFormateado}</strong></td>
              <td>${cuenta.observaciones || ''}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCuentaBancaria('${numeroCuentaEscaped}')" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCuentaBancaria('${numeroCuentaEscaped}')" title="Eliminar">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;
            tbody.appendChild(row);
          });
        } else {
          tbody.innerHTML =
            '<tr><td colspan="8" class="text-center text-muted"><i class="fas fa-info-circle"></i> No hay cuentas bancarias registradas. Use el formulario para agregar una.</td></tr>';
        }
      } catch (error) {
        console.error('❌ Error cargando tabla de cuentas bancarias:', error);
      }
    };

    // Cargar tablas al inicio - esperar a que el DOM esté listo
    // console.log('🚀 Cargando datos al inicio...');

    // Función para cargar todas las tablas
    const cargarTodasLasTablas = async () => {
      try {
        // console.log('🔄 Iniciando carga de todas las tablas...');

        // Cargar clientes primero (más importante)
        // console.log('🔄 Cargando clientes...');
        await window.loadClientesTableFirebase();
        // console.log('✅ Clientes cargados');

        // Cargar el resto
        window.loadEconomicosTableFirebase();
        window.loadOperadoresTableFirebase();
        window.loadProveedoresTableFirebase();
        window.loadEstanciasTableFirebase();
        window.loadAlmacenesTableFirebase();
        window.loadUsuariosTableFirebase();
        window.loadCuentasBancariasTableFirebase();

        // Inicializar checkboxes de módulos para el formulario de usuarios
        if (typeof renderModulosCheckboxes === 'function') {
          renderModulosCheckboxes();
          // console.log('✅ Checkboxes de módulos renderizados');
        } else {
          // Intentar de nuevo después de un pequeño delay en caso de que la función aún no esté cargada
          setTimeout(() => {
            if (typeof renderModulosCheckboxes === 'function') {
              renderModulosCheckboxes();
              // console.log('✅ Checkboxes de módulos renderizados (retry)');
            } else {
              console.warn('⚠️ Función renderModulosCheckboxes no está disponible');
            }
          }, 500);
        }

        // console.log('✅ Todas las tablas cargadas');
      } catch (error) {
        console.error('❌ Error cargando tablas:', error);
      }
    };

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cargarTodasLasTablas);
    } else {
      // DOM ya está listo
      cargarTodasLasTablas();
    }

    // console.log('✅ configuracion-firebase.js inicializado correctamente');

    // Verificar que saveUsuario fue sobrescrito correctamente
    if (window.saveUsuario && window.saveUsuario.toString().includes('VERSIÓN FIREBASE')) {
      // console.log('✅ saveUsuario fue sobrescrito correctamente con la versión Firebase');
    } else {
      console.warn(
        '⚠️ ADVERTENCIA: saveUsuario no parece ser la versión Firebase. Verificar orden de carga de scripts.'
      );
    }
  });
})();
