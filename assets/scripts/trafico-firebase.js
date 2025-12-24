/**
 * Integración de Firebase con la página de Tráfico
 * Carga datos de configuración (económicos, operadores, estancias, clientes) desde Firebase
 */

(function () {
  'use strict';

  console.log('🚚 Iniciando trafico-firebase.js');

  // Esperar a que Firebase se inicialice (versión modular)
  function waitForFirebase(callback, maxAttempts = 50) {
    let attempts = 0;

    const checkFirebase = setInterval(() => {
      attempts++;

      // Verificar si Firebase modular está disponible
      if (window.firebaseDb && window.fs && window.fs.doc && window.fs.getDoc) {
        clearInterval(checkFirebase);
        console.log('✅ Firebase modular detectado para Tráfico');
        callback();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkFirebase);
        console.error('❌ Firebase no se cargó en Tráfico');
        console.error('   firebaseDb:', Boolean(window.firebaseDb));
        console.error('   fs:', Boolean(window.fs));
        console.error('   firebaseReady:', window.firebaseReady);
      }
    }, 100);
  }

  // Inicializar cuando Firebase esté listo
  waitForFirebase(() => {
    const db = window.firebaseDb;
    const { fs } = window;
    console.log('✅ Firestore disponible para Tráfico');

    // Función auxiliar para verificar autenticación
    function checkAuth() {
      if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        console.warn('⚠️ Usuario no autenticado, esperando autenticación...');
        return false;
      }
      return true;
    }

    // ===========================================
    // CARGAR ESTANCIAS EN DROPDOWNS
    // ===========================================

    /**
     * Cargar estancias desde Firebase y poblar dropdowns
     */
    window.refreshEstanciasListTrafico = async function () {
      try {
        console.log('📖 Iniciando carga de estancias para dropdowns...');

        // Verificar autenticación
        if (!checkAuth()) {
          console.warn('⚠️ No se pueden cargar estancias: usuario no autenticado');
          return;
        }

        const selectOrigen = document.getElementById('LugarOrigen');
        const selectDestino = document.getElementById('LugarDestino');

        if (!selectOrigen || !selectDestino) {
          console.error('❌ Dropdowns de estancias no encontrados');
          console.log('🔍 Buscando elementos:');
          console.log('  - LugarOrigen:', document.getElementById('LugarOrigen'));
          console.log('  - LugarDestino:', document.getElementById('LugarDestino'));
          return;
        }

        console.log('✅ Dropdowns encontrados, cargando estancias desde Firebase...');

        // Usar sistema de caché inteligente: Firebase primero, luego caché
        const estancias = await window.getDataWithCache('estancias', async () => {
          const docRef = fs.doc(db, 'configuracion', 'estancias');
          const doc = await fs.getDoc(docRef);

          console.log('📊 Documento obtenido, existe:', doc.exists());

          if (doc.exists()) {
            const data = doc.data();
            if (data && data.estancias && Array.isArray(data.estancias)) {
              return data.estancias;
            }
          }
          return [];
        });

        // Limpiar opciones excepto la primera
        selectOrigen.innerHTML = '<option value="">Seleccione una estancia...</option>';
        selectDestino.innerHTML = '<option value="">Seleccione una estancia...</option>';

        if (estancias && estancias.length > 0) {
          console.log(`✅ ${estancias.length} estancias cargadas (desde Firebase o caché)`);

          estancias.forEach(estancia => {
            const nombre = estancia.nombre || '';
            const codigo = estancia.codigo || '';
            const valor = nombre; // Usar nombre como valor
            const texto = codigo ? `${nombre} (${codigo})` : nombre;

            // Agregar a ambos selects
            const optionOrigen = new Option(texto, valor);
            const optionDestino = new Option(texto, valor);

            selectOrigen.appendChild(optionOrigen);
            selectDestino.appendChild(optionDestino);
          });

          console.log('✅ Dropdowns de estancias actualizados');
        } else {
          console.warn('⚠️ No hay estancias disponibles o el array está vacío');
          // Intentar cargar desde configuracionManager como fallback
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getEstancias === 'function'
          ) {
            try {
              const estanciasFallback = window.configuracionManager.getEstancias() || [];
              console.log(
                `📊 Intentando cargar ${estanciasFallback.length} estancias desde configuracionManager...`
              );

              if (estanciasFallback.length > 0) {
                estanciasFallback.forEach(estancia => {
                  const nombre = estancia.nombre || estancia || '';
                  const codigo = estancia.codigo || '';
                  const valor = nombre;
                  const texto = codigo ? `${nombre} (${codigo})` : nombre;

                  const optionOrigen = new Option(texto, valor);
                  const optionDestino = new Option(texto, valor);

                  selectOrigen.appendChild(optionOrigen);
                  selectDestino.appendChild(optionDestino);
                });
                console.log('✅ Estancias cargadas desde configuracionManager');
              }
            } catch (error) {
              console.error('❌ Error cargando estancias desde configuracionManager:', error);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error cargando estancias:', error);
      }
    };

    // ===========================================
    // CARGAR ECONÓMICOS EN DROPDOWN
    // ===========================================

    /**
     * Cargar económicos desde Firebase y poblar dropdown
     */
    window.refreshEconomicosList = async function () {
      try {
        // Verificar autenticación
        if (!checkAuth()) {
          console.warn('⚠️ No se pueden cargar económicos: usuario no autenticado');
          return;
        }

        console.log('📖 Cargando económicos para dropdown...');

        // Leer económicos de Firebase
        const docRef = fs.doc(db, 'configuracion', 'tractocamiones');
        const doc = await fs.getDoc(docRef);

        if (doc.exists() && doc.data()) {
          const data = doc.data();
          const { economicos } = data;
          if (!economicos || !Array.isArray(economicos)) {
            console.log('⚠️ No hay económicos en Firebase o no es un array');
            return;
          }
          console.log(`✅ ${economicos.length} económicos cargados desde Firebase`);

          // Guardar en caché global para uso posterior
          window.__economicosCache = economicos;

          // Filtrar solo económicos activos
          const economicosActivos = economicos.filter(
            e =>
              e.estadoVehiculo === 'activo' ||
              !e.estadoVehiculo ||
              (e.deleted !== true && e.activo !== false)
          );

          // Actualizar caché para el sistema de searchable-select
          if (window.ERPState && typeof window.ERPState.setCache === 'function') {
            window.ERPState.setCache('economicos', economicosActivos);
            console.log('✅ Caché de económicos actualizado:', economicosActivos.length);
          }

          // Si existe la función cargarEconomicosEnCache, llamarla para asegurar sincronización
          if (typeof window.cargarEconomicosEnCache === 'function') {
            await window.cargarEconomicosEnCache();
            console.log('✅ cargarEconomicosEnCache ejecutado para sincronización');
          }

          console.log(
            '✅ Caché de económicos actualizado con',
            economicosActivos.length,
            'activos'
          );
        } else {
          console.log('⚠️ No hay económicos en Firebase');
        }
      } catch (error) {
        console.error('❌ Error cargando económicos:', error);
      }
    };

    // ===========================================
    // CARGAR OPERADORES EN DROPDOWNS
    // ===========================================

    /**
     * Cargar operadores desde Firebase y actualizar caché para dropdowns personalizados
     */
    window.refreshOperadoresList = async function () {
      try {
        console.log('📖 Cargando operadores para dropdowns...');

        // Leer operadores de Firebase
        const docRef = fs.doc(db, 'configuracion', 'operadores');
        const doc = await fs.getDoc(docRef);

        if (doc.exists() && doc.data()) {
          const data = doc.data();
          const todosLosOperadores = data.operadores;
          if (!todosLosOperadores || !Array.isArray(todosLosOperadores)) {
            console.log('⚠️ No hay operadores en Firebase o no es un array');
            return;
          }

          // Obtener tenantId actual
          let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          if (window.licenseManager && window.licenseManager.isLicenseActive()) {
            const licenseTenantId = window.licenseManager.getTenantId();
            if (licenseTenantId) {
              tenantId = licenseTenantId;
            }
          } else {
            const savedTenantId = localStorage.getItem('tenantId');
            if (savedTenantId) {
              tenantId = savedTenantId;
            }
          }

          // CRÍTICO: Filtrar por tenantId primero
          const operadores = todosLosOperadores.filter(operador => {
            const operadorTenantId = operador.tenantId;
            return operadorTenantId === tenantId;
          });

          console.log(
            `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${todosLosOperadores.length} totales`
          );

          // Filtrar solo operadores activos
          // Un operador está activo si: NO está eliminado Y (estado === 'activo' O no tiene estado)
          const operadoresActivos = operadores.filter(o => {
            // Verificar que no esté eliminado
            if (o.deleted === true) {
              return false;
            }

            // Verificar estado: puede ser 'estado' o 'estadoOperador'
            const estado = o.estado || o.estadoOperador;

            // Si no tiene estado definido, se considera activo
            if (!estado) {
              return true;
            }

            // Solo 'activo' es activo, otros estados (suspendido, inactivo, etc.) son inactivos
            return estado.toLowerCase() === 'activo';
          });

          // Filtrar operadores por tipoOperador (campo en la configuración)
          const operadoresPrincipales = operadoresActivos.filter(op => {
            const tipo = op.tipoOperador || op.tipo || '';
            return tipo.toLowerCase() === 'principal';
          });

          const operadoresSecundarios = operadoresActivos.filter(op => {
            const tipo = op.tipoOperador || op.tipo || '';
            return tipo.toLowerCase() === 'secundario' || tipo.toLowerCase() === 'respaldo';
          });

          console.log(
            '🔍 Operadores principales (por tipoOperador):',
            operadoresPrincipales.map(op => op.nombre)
          );
          console.log(
            '🔍 Operadores secundarios (por tipoOperador):',
            operadoresSecundarios.map(op => op.nombre)
          );
          console.log('🔍 Total operadores activos:', operadoresActivos.length);

          // Actualizar TODOS los sistemas de caché para mantener sincronización
          // 1. Caché ERPState (usado por trafico.html)
          if (window.ERPState && typeof window.ERPState.setCache === 'function') {
            window.ERPState.setCache('operadores', operadoresActivos);
          }

          // 2. Caché legacy (para compatibilidad)
          window._operadoresCache = operadoresActivos;

          // 3. Caché alternativo (para compatibilidad)
          window.__operadoresCache = operadoresActivos;

          console.log(
            '✅ Caché de operadores actualizado en todos los sistemas:',
            operadoresActivos.length
          );

          // Si existe la función cargarOperadoresEnCache, llamarla para asegurar sincronización
          if (typeof window.cargarOperadoresEnCache === 'function') {
            await window.cargarOperadoresEnCache();
            console.log('✅ cargarOperadoresEnCache ejecutado para sincronización');
          }

          // Para el select de gastos (si existe como select normal)
          const selectGasto = document.getElementById('gasto_operador_1');
          if (selectGasto && selectGasto.tagName === 'SELECT') {
            // Limpiar opciones existentes
            selectGasto.innerHTML = '<option value="">Seleccione operador...</option>';

            // Agregar todos los operadores activos al select de gastos
            operadoresActivos.forEach(operador => {
              const nombre = operador.nombre || '';
              const licencia = operador.licencia || '';
              const texto = licencia ? `${nombre} (Lic: ${licencia})` : nombre;
              const option = document.createElement('option');
              option.value = nombre;
              option.textContent = texto;
              selectGasto.appendChild(option);
            });
            console.log(`✅ ${operadoresActivos.length} operadores agregados al select de gastos`);
          }

          console.log(
            `📊 Operadores cargados: ${operadoresPrincipales.length} principales, ${operadoresSecundarios.length} secundarios, ${operadoresActivos.length} totales`
          );
          console.log('✅ Caché de operadores actualizado para dropdowns personalizados');
        } else {
          console.log('⚠️ No hay operadores en Firebase');
        }
      } catch (error) {
        console.error('❌ Error cargando operadores:', error);
      }
    };

    // ===========================================
    // CARGAR CLIENTES EN DROPDOWN
    // ===========================================

    /**
     * Cargar clientes desde Firebase
     */
    window.loadClientesFromFirebaseTrafico = async function () {
      try {
        // Verificar autenticación
        if (!checkAuth()) {
          console.warn('⚠️ No se pueden cargar clientes: usuario no autenticado');
          return [];
        }

        console.log('📖 Cargando clientes desde Firebase...');

        const docRef = fs.doc(db, 'configuracion', 'clientes');
        const doc = await fs.getDoc(docRef);

        if (doc.exists() && doc.data()) {
          const data = doc.data();
          const todosLosClientes = data.clientes;
          if (!todosLosClientes || !Array.isArray(todosLosClientes)) {
            console.log('⚠️ No hay clientes en Firebase o no es un array');
            return [];
          }

          // Obtener tenantId actual
          let tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          if (window.licenseManager && window.licenseManager.isLicenseActive()) {
            const licenseTenantId = window.licenseManager.getTenantId();
            if (licenseTenantId) {
              tenantId = licenseTenantId;
            }
          } else {
            const savedTenantId = localStorage.getItem('tenantId');
            if (savedTenantId) {
              tenantId = savedTenantId;
            }
          }

          // CRÍTICO: Filtrar por tenantId
          const clientes = todosLosClientes.filter(cliente => {
            const clienteTenantId = cliente.tenantId;
            return clienteTenantId === tenantId;
          });

          console.log(
            `🔒 Clientes filtrados por tenantId (${tenantId}): ${clientes.length} de ${todosLosClientes.length} totales`
          );

          // Guardar en cache global para uso posterior
          window.__clientesCache = clientes;

          return clientes;
        }
        console.log('⚠️ No hay clientes en Firebase');
        return [];
      } catch (error) {
        console.error('❌ Error cargando clientes:', error);
        return [];
      }
    };

    // ===========================================
    // SOBRESCRIBIR getClientes GLOBAL
    // ===========================================

    /**
     * Sobrescribir función getClientes para que use Firebase
     */
    window.getClientes = async function () {
      // Si ya hay cache, usarlo
      if (window.__clientesCache && window.__clientesCache.length > 0) {
        return window.__clientesCache;
      }

      // Si no, cargar de Firebase
      return window.loadClientesFromFirebaseTrafico();
    };

    // ===========================================
    // SOBRESCRIBIR getEconomicos GLOBAL
    // ===========================================

    /**
     * Sobrescribir función getEconomicos para que use Firebase
     */
    window.getEconomicos = async function () {
      try {
        if (!window.firebaseDb || !window.fs) {
          console.warn('⚠️ Firebase no está disponible aún');
          return [];
        }
        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
        const doc = await window.fs.getDoc(docRef);

        if (doc.exists && doc.data().economicos) {
          return doc.data().economicos;
        }
        return [];
      } catch (error) {
        console.error('❌ Error cargando económicos:', error);
        return [];
      }
    };

    /**
     * Sobrescribir función getOperadores para que use Firebase
     */
    window.getOperadores = async function () {
      try {
        if (!window.firebaseDb || !window.fs) {
          console.warn('⚠️ Firebase no está disponible aún');
          return [];
        }
        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
        const doc = await window.fs.getDoc(docRef);

        if (doc.exists && doc.data().operadores) {
          return doc.data().operadores;
        }
        return [];
      } catch (error) {
        console.error('❌ Error cargando operadores:', error);
        return [];
      }
    };

    // ===========================================
    // LIMPIAR LOCALSTORAGE DE CONFIGURACIÓN
    // ===========================================

    /**
     * Limpiar todos los datos de configuración de localStorage
     */
    window.limpiarConfiguracionLocalStorage = function () {
      console.log('🧹 Limpiando configuración de localStorage...');

      const keys = [
        'erp_economicos',
        'erp_tractocamiones',
        'tractocamiones',
        'configuracion_tractocamiones',
        'erp_operadores',
        'operadores',
        'erp_clientes',
        'clientes',
        'erp_proveedores',
        'proveedores',
        'erp_estancias',
        'estancias',
        'erp_almacenes',
        'almacenes'
      ];

      let removidos = 0;
      keys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removidos++;
          console.log(`  ✅ Eliminado: ${key}`);
        }
      });

      if (removidos > 0) {
        console.log(`✅ ${removidos} items de configuración eliminados de localStorage`);
        alert(
          `✅ Se eliminaron ${removidos} items de configuración viejos. Todos los datos ahora se cargan desde Firebase.`
        );
      } else {
        console.log('ℹ️ No había datos de configuración en localStorage');
        alert('ℹ️ No había datos viejos en localStorage. Todo está limpio.');
      }
    };

    // ===========================================
    // CARGAR DATOS AL INICIO
    // ===========================================

    console.log('🚀 Cargando datos de configuración al inicio...');

    // Limpiar localStorage automáticamente al cargar (para evitar conflictos)
    // Comentar esta línea si no quieres que se limpie automáticamente
    const autoLimpiar = true;
    if (autoLimpiar) {
      console.log('🧹 Auto-limpiando localStorage de configuración...');
      const keys = [
        'erp_economicos',
        'erp_tractocamiones',
        'tractocamiones',
        'configuracion_tractocamiones'
      ];
      keys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`  ✅ Eliminado: ${key}`);
        }
      });
    }

    // ===========================================
    // FUNCIONES PARA LLENAR DATOS AUTOMÁTICAMENTE
    // ===========================================

    /**
     * Cargar datos del económico seleccionado
     */
    window.loadEconomicoData = async function () {
      // Obtener valor del input hidden o del input visible
      const hiddenInput = document.getElementById('economico_value');
      const visibleInput = document.getElementById('economico');

      let numeroEconomico = hiddenInput?.value || visibleInput?.value || '';

      // Si el input visible tiene texto con formato, extraer el número
      if (visibleInput && visibleInput.value && !hiddenInput?.value) {
        const match = visibleInput.value.match(/^([A-Z0-9-]+)/);
        if (match) {
          numeroEconomico = match[1];
        }
      }

      if (!numeroEconomico) {
        return;
      }

      console.log('🚛 Cargando datos del económico:', numeroEconomico);

      // Buscar en el caché o en Firebase
      let economicoData = null;

      if (window.__economicosCache) {
        economicoData = window.__economicosCache.find(e => e.numero === numeroEconomico);
      }

      if (!economicoData) {
        // Buscar en Firebase
        try {
          const docRef = fs.doc(db, 'configuracion', 'tractocamiones');
          const doc = await fs.getDoc(docRef);
          if (doc.exists && doc.data().economicos) {
            economicoData = doc.data().economicos.find(e => e.numero === numeroEconomico);
          }
        } catch (error) {
          console.error('❌ Error buscando económico:', error);
        }
      }

      if (economicoData) {
        console.log('✅ Datos del económico encontrados:', economicoData);

        // Llenar campos
        const placasField = document.getElementById('Placas');
        const permisoField = document.getElementById('permisosct');

        if (placasField) {
          placasField.value = economicoData.placaTracto || '';
        }
        if (permisoField) {
          permisoField.value = economicoData.permisoSCT || '';
        }

        console.log('✅ Campos de económico llenados');
      } else {
        console.warn('⚠️ No se encontraron datos del económico');
      }
    };

    /**
     * Cargar datos del operador principal seleccionado
     */
    window.loadOperadorPrincipalData = async function () {
      const select = document.getElementById('operadorprincipal');
      if (!select || !select.value) {
        return;
      }

      const nombreOperador = select.value;
      console.log('👤 Cargando datos del operador principal:', nombreOperador);

      // Buscar en Firebase - PRIORIDAD: Colección operadores directamente
      let operadorData = null;

      // 1. PRIORIDAD: Buscar en Firebase (colección operadores)
      if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
        try {
          console.log('📊 [PRIORIDAD] Buscando operador principal en Firebase...');
          const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
          const querySnapshot = await window.fs.getDocs(
            window.fs.query(
              operadoresRef,
              window.fs.where(
                'tenantId',
                '==',
                window.firebaseAuth?.currentUser?.uid ||
                  window.DEMO_CONFIG?.tenantId ||
                  'demo_tenant'
              ),
              window.fs.where('nombre', '==', nombreOperador)
            )
          );

          if (!querySnapshot.empty) {
            operadorData = querySnapshot.docs[0].data();
            console.log('✅ Datos del operador principal desde Firebase:', operadorData);
          }
        } catch (error) {
          console.warn('⚠️ Error buscando operador principal en Firebase:', error);
        }
      }

      // 2. Fallback: Buscar en la colección configuracion/operadores (método antiguo)
      if (!operadorData) {
        try {
          const docRef = fs.doc(db, 'configuracion', 'operadores');
          const doc = await fs.getDoc(docRef);
          if (doc.exists && doc.data().operadores) {
            operadorData = doc.data().operadores.find(o => o.nombre === nombreOperador);
            if (operadorData) {
              console.log(
                '✅ Datos del operador principal desde configuracion/operadores:',
                operadorData
              );
            }
          }
        } catch (error) {
          console.error('❌ Error buscando operador principal en configuracion:', error);
        }
      }

      if (operadorData) {
        console.log('✅ Datos del operador encontrados:', operadorData);

        // Llenar campo de licencia
        const licenciaField = document.getElementById('Licencia');
        if (licenciaField) {
          licenciaField.value = operadorData.licencia || '';
          console.log('✅ Licencia llenada:', operadorData.licencia);
        }
      } else {
        console.warn('⚠️ No se encontraron datos del operador');
      }
    };

    /**
     * Cargar datos del operador secundario seleccionado
     */
    window.loadOperadorSecundarioData = async function () {
      const select = document.getElementById('operadorsecundario');
      if (!select || !select.value) {
        return;
      }

      const nombreOperador = select.value;
      console.log('👤 Cargando datos del operador secundario:', nombreOperador);

      // Buscar en Firebase - PRIORIDAD: Colección operadores directamente
      let operadorData = null;

      // 1. PRIORIDAD: Buscar en Firebase (colección operadores)
      if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
        try {
          console.log('📊 [PRIORIDAD] Buscando operador secundario en Firebase...');
          const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
          const querySnapshot = await window.fs.getDocs(
            window.fs.query(
              operadoresRef,
              window.fs.where(
                'tenantId',
                '==',
                window.firebaseAuth?.currentUser?.uid ||
                  window.DEMO_CONFIG?.tenantId ||
                  'demo_tenant'
              ),
              window.fs.where('nombre', '==', nombreOperador)
            )
          );

          if (!querySnapshot.empty) {
            operadorData = querySnapshot.docs[0].data();
            console.log('✅ Datos del operador secundario desde Firebase:', operadorData);
          }
        } catch (error) {
          console.warn('⚠️ Error buscando operador secundario en Firebase:', error);
        }
      }

      // 2. Fallback: Buscar en la colección configuracion/operadores (método antiguo)
      if (!operadorData) {
        try {
          const docRef = fs.doc(db, 'configuracion', 'operadores');
          const doc = await fs.getDoc(docRef);
          if (doc.exists && doc.data().operadores) {
            operadorData = doc.data().operadores.find(o => o.nombre === nombreOperador);
            if (operadorData) {
              console.log(
                '✅ Datos del operador secundario desde configuracion/operadores:',
                operadorData
              );
            }
          }
        } catch (error) {
          console.error('❌ Error buscando operador secundario en configuracion:', error);
        }
      }

      if (operadorData) {
        console.log('✅ Datos del operador secundario encontrados:', operadorData);

        // Llenar campo de licencia secundaria
        const licenciaField = document.getElementById('LicenciaSecundaria');
        if (licenciaField) {
          licenciaField.value = operadorData.licencia || '';
          console.log('✅ Licencia secundaria llenada:', operadorData.licencia);
        }
      } else {
        console.warn('⚠️ No se encontraron datos del operador secundario');
      }
    };

    // Cargar todos los dropdowns después de que el usuario esté autenticado
    function loadAllDropdowns() {
      // Función para intentar cargar dropdowns
      function tryLoadDropdowns() {
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
          console.log('✅ Usuario autenticado, cargando dropdowns...');
          setTimeout(() => {
            window.refreshEstanciasListTrafico();
            window.refreshEconomicosList();
            window.refreshOperadoresList();
            window.loadClientesFromFirebaseTrafico();
          }, 500);
          return true;
        }
        return false;
      }

      // Intentar cargar inmediatamente si el usuario ya está autenticado
      if (tryLoadDropdowns()) {
        return;
      }

      // Si no está autenticado, usar onAuthStateChanged en lugar de polling
      if (window.firebaseAuth && typeof window.firebaseAuth.onAuthStateChanged === 'function') {
        // Intentar usar el listener si está disponible (puede requerir importación)
        try {
          // Usar el listener global de firebase-init.js si está disponible
          const auth = window.firebaseAuth;
          if (auth.onAuthStateChanged) {
            const unsubscribe = auth.onAuthStateChanged(user => {
              if (user) {
                console.log('✅ Usuario autenticado detectado, cargando dropdowns...');
                tryLoadDropdowns();
                unsubscribe(); // Dejar de escuchar después del primer éxito
              }
            });
            return;
          }
        } catch (e) {
          console.warn('⚠️ No se pudo usar onAuthStateChanged, usando polling:', e);
        }
      }

      // Fallback: usar polling con límite
      let attempts = 0;
      const maxAttempts = 20; // 10 segundos máximo
      const checkInterval = setInterval(() => {
        attempts++;
        if (tryLoadDropdowns()) {
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          // Solo mostrar warning una vez al final
          if (attempts === maxAttempts) {
            console.warn(
              '⚠️ Usuario no autenticado después de 10 segundos, no se pueden cargar dropdowns'
            );
          }
        }
      }, 500);
    }

    // Esperar un poco para que la autenticación se complete
    setTimeout(() => {
      loadAllDropdowns();
    }, 1000);

    console.log('✅ trafico-firebase.js inicializado correctamente');
  });
})();
