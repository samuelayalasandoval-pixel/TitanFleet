(function () {
  function loadEstanciasToSelects() {
    try {
      const origen = document.getElementById('LugarOrigen');
      const destino = document.getElementById('LugarDestino');
      if (!origen || !destino) {
        return;
      }

      const hasManager = Boolean(
        window.configuracionManager && window.configuracionManager.getEstancias
      );
      if (!hasManager) {
        console.debug('Tráfico: configuracionManager aún no listo.');
        return false;
      }

      const estancias = window.configuracionManager.getEstancias() || [];
      const opts = ['<option value="">Seleccione una estancia...</option>'].concat(
        estancias.map(
          e =>
            `<option value="${(e.nombre || '').replace(/"/g, '&quot;')}">${e.nombre || ''}${e.codigo ? ` (${e.codigo})` : ''}</option>`
        )
      );
      origen.innerHTML = opts.join('');
      destino.innerHTML = opts.join('');
      console.debug(`Tráfico: estancias cargadas (${estancias.length}).`);
      return true;
    } catch (e) {
      console.error('Error cargando estancias en tráfico:', e);
      return false;
    }
  }

  window.refreshEstanciasListTrafico = function () {
    const ok = loadEstanciasToSelects();
    if (!ok) {
      setTimeout(loadEstanciasToSelects, 300);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Intentar cargar inmediatamente
    if (!loadEstanciasToSelects()) {
      // Si falla, reintentar con intervalos crecientes
      let attempts = 0;
      const maxAttempts = 20;
      const timer = setInterval(() => {
        attempts++;
        console.log(`⏳ Intento ${attempts} de cargar estancias en tráfico...`);
        if (loadEstanciasToSelects()) {
          console.log('✅ Estancias cargadas exitosamente en tráfico');
          clearInterval(timer);
        } else if (attempts >= maxAttempts) {
          console.warn('⚠️ No se pudieron cargar estancias después de', maxAttempts, 'intentos');
          clearInterval(timer);
        }
      }, 300);
    } else {
      console.log('✅ Estancias cargadas inmediatamente en tráfico');
    }
  });
})();
// Sistema de Listas Desplegables para Tráfico
class TraficoListasManager {
  constructor() {
    this.economicosSelect = null;
    this.operadorPrincipalSelect = null;
    this.operadorSecundarioSelect = null;
    this.initializeSelects();
    this.loadInitialData();
  }

  // Inicializar referencias a los selects
  initializeSelects() {
    this.economicosSelect = document.getElementById('economico');
    this.operadorPrincipalSelect = document.getElementById('operadorprincipal');
    this.operadorSecundarioSelect = document.getElementById('operadorsecundario');

    // Agregar event listeners para verificar carga automática
    if (this.operadorPrincipalSelect) {
      this.operadorPrincipalSelect.addEventListener('focus', () => {
        this.checkAndReloadOperadores();
      });
    }

    if (this.operadorSecundarioSelect) {
      this.operadorSecundarioSelect.addEventListener('focus', () => {
        this.checkAndReloadOperadores();
      });
    }
  }

  // Verificar y recargar operadores si es necesario
  checkAndReloadOperadores() {
    // Verificar si hay operadores en el caché global
    const hasOperadores =
      window._operadoresCache &&
      Array.isArray(window._operadoresCache) &&
      window._operadoresCache.length > 0;

    if (!hasOperadores) {
      console.log('🔄 Caché de operadores vacío, recargando operadores...');
      this.loadOperadoresList();
    }
  }

  // Cargar datos iniciales cuando se carga la página
  loadInitialData() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.refreshAllLists();
        this.debugDataAvailability();
      });
    } else {
      this.refreshAllLists();
      this.debugDataAvailability();
    }
  }

  // Función de depuración para verificar disponibilidad de datos
  debugDataAvailability() {
    console.log('=== DEBUG: Verificando disponibilidad de datos ===');

    // Verificar configuracionManager
    console.log('configuracionManager disponible:', Boolean(window.configuracionManager));
    if (window.configuracionManager) {
      const economicos = window.configuracionManager.getEconomicos();
      const operadores = window.configuracionManager.getOperadores();
      console.log('Económicos en configuracionManager:', economicos);
      console.log('Operadores en configuracionManager:', operadores);
    }

    // Verificar DataPersistence
    console.log('DataPersistence disponible:', Boolean(window.DataPersistence));
    if (
      window.DataPersistence &&
      typeof window.DataPersistence.getAllEconomicos === 'function' &&
      typeof window.DataPersistence.getAllOperadores === 'function'
    ) {
      try {
        const economicos = window.DataPersistence.getAllEconomicos();
        const operadores = window.DataPersistence.getAllOperadores();
        console.log('Económicos en DataPersistence:', economicos);
        console.log('Operadores en DataPersistence:', operadores);
      } catch (error) {
        console.warn('⚠️ Error accediendo a DataPersistence:', error);
      }
    }

    // Verificar localStorage directamente
    console.log('localStorage erp_economicos:', localStorage.getItem('erp_economicos'));
    console.log('localStorage erp_operadores:', localStorage.getItem('erp_operadores'));
    console.log('localStorage erp_data:', localStorage.getItem('erp_data'));

    console.log('=== FIN DEBUG ===');
  }

  // Refrescar todas las listas
  async refreshAllLists() {
    await this.loadEconomicosList();
    await this.loadOperadoresList();
  }

  // Cargar lista de económicos
  async loadEconomicosList() {
    // Nota: Ya no modificamos el select directamente, solo actualizamos el caché global
    // El input de búsqueda usa window._economicosCache

    // Obtener económicos del sistema de configuración
    let economicos = [];

    // 1. PRIORIDAD: Cargar desde configuracion/tractocamiones (NUEVO SISTEMA)
    if (window.firebaseDb && window.fs) {
      try {
        console.log('📊 [PRIORIDAD] Cargando económicos desde configuracion/tractocamiones...');

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

        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
        const doc = await window.fs.getDoc(docRef);

        if (doc.exists() && doc.data().economicos) {
          const todosLosEconomicos = doc.data().economicos;

          // CRÍTICO: Filtrar económicos por tenantId individual para mantener privacidad
          economicos = todosLosEconomicos.filter(economico => {
            const economicoTenantId = economico.tenantId;
            // Todos los usuarios solo ven económicos con su tenantId exacto
            return economicoTenantId === tenantId;
          });

          console.log(
            `🔒 Económicos filtrados por tenantId (${tenantId}): ${economicos.length} de ${todosLosEconomicos.length} totales`
          );

          // Actualizar caché global
          window.__economicosCache = economicos;
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde configuracion/tractocamiones:', error);
      }
    } else if (typeof firebase !== 'undefined' && firebase.firestore) {
      // Fallback para sistema antiguo
      try {
        console.log(
          '📊 [PRIORIDAD] Cargando económicos desde configuracion/tractocamiones (sistema antiguo)...'
        );
        const db = firebase.firestore();
        const docRef = db.collection('configuracion').doc('tractocamiones');
        const doc = await docRef.get();

        if (doc.exists && doc.data().economicos) {
          const todosLosEconomicos = doc.data().economicos;

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

          // CRÍTICO: Filtrar económicos por tenantId individual
          economicos = todosLosEconomicos.filter(economico => {
            const economicoTenantId = economico.tenantId;
            return economicoTenantId === tenantId;
          });

          console.log(
            `🔒 Económicos filtrados por tenantId (${tenantId}): ${economicos.length} de ${todosLosEconomicos.length} totales`
          );

          // Actualizar caché global
          window.__economicosCache = economicos;
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde configuracion/tractocamiones:', error);
      }
    }

    // 2. Fallback: Para usuarios anónimos, cargar desde colección economicos (SISTEMA VIEJO)
    if (
      economicos.length === 0 &&
      window.firebaseDb &&
      window.fs &&
      window.firebaseAuth?.currentUser?.isAnonymous
    ) {
      try {
        console.log('📊 [Fallback] Cargando económicos desde colección economicos (viejo)...');
        const economicosRef = window.fs.collection(window.firebaseDb, 'economicos');
        const querySnapshot = await window.fs.getDocs(
          window.fs.query(
            economicosRef,
            window.fs.where('tenantId', '==', window.DEMO_CONFIG?.tenantId || 'demo_tenant')
          )
        );
        economicos = querySnapshot.docs.map(doc => doc.data());
        console.log('⚠️ Económicos cargados desde sistema viejo:', economicos.length);
      } catch (error) {
        console.warn('⚠️ Error cargando económicos desde colección vieja:', error);
      }
    }

    // 2. Fallback: Intentar desde caché de Firestore
    if (
      economicos.length === 0 &&
      window.__economicosCache &&
      window.__economicosCache.length > 0
    ) {
      economicos = window.__economicosCache;
      console.log('✅ Económicos cargados desde Firestore cache:', economicos.length);
    }

    // 3. Fallback: Intentar obtener del sistema de configuración
    if (economicos.length === 0 && window.configuracionManager) {
      const economicosData = window.configuracionManager.getEconomicos();
      if (economicosData) {
        economicos = Object.keys(economicosData).map(numero => ({
          numero: numero,
          ...economicosData[numero]
        }));
        console.log('✅ Económicos cargados desde configuracionManager:', economicos.length);
      }
    }

    // 3. Si no hay datos en configuración, intentar del sistema de persistencia
    if (
      economicos.length === 0 &&
      window.DataPersistence &&
      typeof window.DataPersistence.getAllEconomicos === 'function'
    ) {
      try {
        economicos = window.DataPersistence.getAllEconomicos();
        console.log('✅ Económicos cargados desde DataPersistence:', economicos.length);
      } catch (error) {
        console.warn('⚠️ Error cargando económicos desde DataPersistence:', error);
        economicos = [];
      }
    }

    // 4. Si aún no hay datos, intentar cargar desde localStorage directamente
    if (economicos.length === 0) {
      try {
        const economicosData = localStorage.getItem('erp_economicos');
        if (economicosData) {
          const parsed = JSON.parse(economicosData);
          economicos = Object.keys(parsed).map(numero => ({
            numero: numero,
            ...parsed[numero]
          }));
          console.log('✅ Económicos cargados desde localStorage directo:', economicos.length);
        }
      } catch (error) {
        console.error('Error cargando económicos desde localStorage:', error);
      }
    }

    // Actualizar caché global para el input de búsqueda
    window._economicosCache = economicos.filter(e => e.deleted !== true);

    if (economicos.length === 0) {
      console.warn('⚠️ No hay económicos registrados');
      return;
    }

    console.log(
      `✅ Lista de económicos cargada en caché: ${window._economicosCache.length} elementos`
    );
  }

  // Cargar lista de operadores
  async loadOperadoresList(retryCount = 0) {
    // Nota: Ya no modificamos los selects directamente, solo actualizamos el caché global
    // Los inputs de búsqueda usan window._operadoresCache

    // Obtener operadores del sistema de configuración
    let operadores = [];

    // 1. PRIORIDAD: Cargar desde configuracion/operadores (documento con array)
    if (window.firebaseDb && window.fs) {
      try {
        console.log('📊 [PRIORIDAD] Cargando operadores desde configuracion/operadores...');
        const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
        const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

        if (operadoresDoc.exists()) {
          const data = operadoresDoc.data();
          if (data.operadores && Array.isArray(data.operadores)) {
            const todosLosOperadores = data.operadores;

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

            // CRÍTICO: Filtrar operadores por tenantId individual
            operadores = todosLosOperadores.filter(operador => {
              const operadorTenantId = operador.tenantId;
              return operadorTenantId === tenantId;
            });

            console.log(
              `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${todosLosOperadores.length} totales`
            );
          } else {
            console.warn(
              '⚠️ El documento configuracion/operadores existe pero no tiene array válido'
            );
          }
        } else {
          console.warn('⚠️ El documento configuracion/operadores no existe en Firebase');
        }
      } catch (error) {
        console.warn('⚠️ Error cargando operadores desde Firebase:', error);

        // Reintentar si Firebase no está listo (máximo 3 intentos)
        if (retryCount < 3) {
          console.log(`🔄 Reintentando carga de operadores (intento ${retryCount + 1}/3)...`);
          setTimeout(
            () => {
              this.loadOperadoresList(retryCount + 1);
            },
            2000 * (retryCount + 1)
          ); // Esperar 2s, 4s, 6s
          return;
        }
      }
    } else if (retryCount < 3) {
      // Si Firebase no está listo, reintentar
      console.log(`🔄 Firebase no está listo, reintentando (intento ${retryCount + 1}/3)...`);
      setTimeout(
        () => {
          this.loadOperadoresList(retryCount + 1);
        },
        2000 * (retryCount + 1)
      );
      return;
    }

    // 2. Fallback: Intentar obtener del sistema de configuración (getAllOperadores)
    if (operadores.length === 0 && window.configuracionManager) {
      try {
        // Intentar con getAllOperadores primero (más confiable)
        if (typeof window.configuracionManager.getAllOperadores === 'function') {
          const operadoresData = await window.configuracionManager.getAllOperadores();
          if (operadoresData && Array.isArray(operadoresData)) {
            operadores = operadoresData;
            console.log(
              '✅ Operadores cargados desde configuracionManager.getAllOperadores():',
              operadores.length
            );
          } else if (operadoresData && typeof operadoresData === 'object') {
            operadores = Object.keys(operadoresData).map(nombre => ({
              nombre: nombre,
              ...operadoresData[nombre]
            }));
            console.log(
              '✅ Operadores cargados desde configuracionManager (objeto):',
              operadores.length
            );
          }
        } else {
          // Fallback a getOperadores si getAllOperadores no existe
          const operadoresData = window.configuracionManager.getOperadores();
          if (operadoresData) {
            if (Array.isArray(operadoresData)) {
              operadores = operadoresData;
            } else {
              operadores = Object.keys(operadoresData).map(nombre => ({
                nombre: nombre,
                ...operadoresData[nombre]
              }));
            }
            console.log(
              '✅ Operadores cargados desde configuracionManager.getOperadores():',
              operadores.length
            );
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cargando operadores desde configuracionManager:', error);
      }
    }

    // 3. Fallback: Si no hay datos en configuración, intentar del sistema de persistencia
    if (
      operadores.length === 0 &&
      window.DataPersistence &&
      typeof window.DataPersistence.getAllOperadores === 'function'
    ) {
      try {
        operadores = window.DataPersistence.getAllOperadores();
        console.log('✅ Operadores cargados desde DataPersistence:', operadores.length);
      } catch (error) {
        console.warn('⚠️ Error cargando operadores desde DataPersistence:', error);
        operadores = [];
      }
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores

    // Filtrar operadores activos
    const operadoresActivos = operadores.filter(op => op.deleted !== true);

    // Actualizar TODOS los sistemas de caché para mantener sincronización
    // 1. Caché legacy (para compatibilidad)
    window._operadoresCache = operadoresActivos;

    // 2. Caché ERPState (usado por trafico.html)
    if (window.ERPState && typeof window.ERPState.setCache === 'function') {
      window.ERPState.setCache('operadores', operadoresActivos);
      console.log('✅ Caché ERPState actualizado:', operadoresActivos.length);
    }

    // 3. Caché alternativo (para compatibilidad)
    window.__operadoresCache = operadoresActivos;

    if (operadores.length === 0) {
      console.warn('⚠️ No hay operadores registrados');
      // También llenar dropdowns de gastos (si existen)
      if (typeof this.loadOperadoresGastos === 'function') {
        this.loadOperadoresGastos(operadores);
      }
      return;
    }

    // Filtrar operadores por tipoOperador (campo en la configuración)
    // Operadores principales: tipoOperador === 'principal'
    // Operadores secundarios: tipoOperador === 'secundario'

    const operadoresPrincipales = operadoresActivos.filter(op => {
      const tipo = op.tipoOperador || op.tipo || '';
      return tipo.toLowerCase() === 'principal';
    });

    const operadoresSecundarios = operadoresActivos.filter(op => {
      const tipo = op.tipoOperador || op.tipo || '';
      return tipo.toLowerCase() === 'secundario';
    });

    console.log(
      '🔍 Operadores principales (por tipoOperador):',
      operadoresPrincipales.map(op => op.nombre)
    );
    console.log(
      '🔍 Operadores secundarios (por tipoOperador):',
      operadoresSecundarios.map(op => op.nombre)
    );
    console.log('🔍 Total operadores disponibles:', operadoresActivos.length);
    console.log(`✅ ${operadoresActivos.length} operadores cargados en caché global`);

    console.log(
      `📊 Operadores cargados en caché: ${operadoresPrincipales.length} principales, ${operadoresSecundarios.length} secundarios`
    );

    // También cargar en dropdowns de gastos
    this.loadOperadoresGastos(operadores);

    console.log(`Lista de operadores cargada: ${operadores.length} elementos`);
  }

  // Cargar operadores en los dropdowns de gastos
  loadOperadoresGastos(operadores) {
    // Buscar todos los dropdowns de operadores de gastos (pueden ser dinámicos)
    const gastosOperadores = document.querySelectorAll('[id^="gasto_operador_"]');

    console.log(`🔄 Cargando operadores en ${gastosOperadores.length} dropdowns de gastos...`);

    gastosOperadores.forEach(select => {
      // Guardar valor actual si existe
      const valorActual = select.value;

      // Limpiar opciones existentes
      select.innerHTML = '<option value="">Seleccione operador...</option>';

      if (operadores.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay operadores registrados';
        option.disabled = true;
        select.appendChild(option);
      } else {
        // Agregar operadores (solo nombre, sin licencia)
        operadores.forEach(operador => {
          const option = document.createElement('option');
          option.value = operador.nombre;
          option.textContent = operador.nombre;
          select.appendChild(option);
        });

        // Restaurar valor si existía
        if (valorActual && operadores.find(o => o.nombre === valorActual)) {
          select.value = valorActual;
        }
      }
    });

    console.log('✅ Operadores cargados en dropdowns de gastos');
  }

  // Cargar datos del económico seleccionado
  async loadEconomicoData() {
    const select = this.economicosSelect;
    if (!select || !select.value) {
      return;
    }

    const numeroEconomico = select.value;
    console.log('Cargando datos del económico:', numeroEconomico);

    // Obtener datos del económico
    let economicoData = null;

    // 1. Intentar desde el caché de Firestore (más actual)
    if (window.__economicosCache && window.__economicosCache.length > 0) {
      economicoData = window.__economicosCache.find(e => e.numero === numeroEconomico);
      if (economicoData) {
        console.log('✅ Datos del económico desde Firestore cache:', economicoData);
      }
    }

    // 2. Intentar desde configuracionManager
    if (!economicoData && window.configuracionManager) {
      const allEconomicos = window.configuracionManager.getEconomicos();
      economicoData = allEconomicos ? allEconomicos.find(e => e.numero === numeroEconomico) : null;
      if (economicoData) {
        console.log('✅ Datos del económico desde configuracionManager:', economicoData);
      }
    }

    // 3. Si no se encuentra en configuracionManager, intentar con DataPersistence
    if (!economicoData && window.DataPersistence) {
      economicoData = window.DataPersistence.getEconomicoData(numeroEconomico);
      if (economicoData) {
        console.log('✅ Datos del económico desde DataPersistence:', economicoData);
      }
    }

    // 4. Si aún no se encuentra, intentar desde el sistema de caché
    if (!economicoData) {
      try {
        const economicos = await window.getDataWithCache('economicos', async () => {
          // Intentar desde configuracionManager
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getAllEconomicos === 'function'
          ) {
            return window.configuracionManager.getAllEconomicos() || [];
          }
          return [];
        });

        if (economicos && Array.isArray(economicos) && economicos.length > 0) {
          economicoData = economicos.find(e => e.numero === numeroEconomico);
          if (economicoData) {
            console.log('✅ Datos del económico desde sistema de caché:', economicoData);
          }
        }
      } catch (error) {
        console.error('Error cargando datos del económico desde caché:', error);
      }
    }

    if (economicoData) {
      console.log('Datos del económico encontrados:', economicoData);

      // Llenar campos automáticamente
      const economicoField = document.getElementById('economico');
      const placasField = document.getElementById('Placas');
      const permisoSCTField = document.getElementById('permisosct');

      // Llenar el campo económico con el nombre del tractocamión
      if (economicoField) {
        // Usar el número económico como nombre del tractocamión
        economicoField.value = economicoData.numeroEconomico || numeroEconomico;
        console.log('Campo económico llenado:', economicoField.value);
      }

      if (placasField && economicoData.placaTracto) {
        placasField.value = economicoData.placaTracto;
        console.log('Placas llenadas:', economicoData.placaTracto);
      }

      if (permisoSCTField && economicoData.permisoSCT) {
        permisoSCTField.value = economicoData.permisoSCT;
        console.log('Permiso SCT llenado:', economicoData.permisoSCT);
      }

      // Mostrar notificación de éxito
      this.showNotification(
        `Datos del económico ${numeroEconomico} cargados automáticamente`,
        'success'
      );
    } else {
      console.log('No se encontraron datos para el económico:', numeroEconomico);
      this.showNotification(
        `No se encontraron datos para el económico ${numeroEconomico}`,
        'warning'
      );
    }
  }

  // Cargar datos del operador principal seleccionado
  async loadOperadorPrincipalData() {
    // Obtener valor del input hidden o del input visible
    const hiddenInput = document.getElementById('operadorprincipal_value');
    const visibleInput = document.getElementById('operadorprincipal');

    let nombreOperador = hiddenInput?.value || visibleInput?.value || '';

    // Si el input visible tiene texto con formato "Nombre - Licencia", extraer solo el nombre
    if (visibleInput && visibleInput.value && !hiddenInput?.value) {
      nombreOperador = visibleInput.value.split(' - ')[0].trim();
    }

    if (!nombreOperador) {
      return;
    }

    console.log('Cargando datos del operador principal:', nombreOperador);

    // Obtener datos del operador
    let operadorData = null;

    // 1. PRIORIDAD: Buscar en Firebase
    if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser) {
      try {
        console.log('📊 [PRIORIDAD] Buscando operador en Firebase...');
        const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
        const querySnapshot = await window.fs.getDocs(
          window.fs.query(
            operadoresRef,
            window.fs.where(
              'tenantId',
              '==',
              window.firebaseAuth?.currentUser?.uid || window.DEMO_CONFIG?.tenantId || 'demo_tenant'
            ),
            window.fs.where('nombre', '==', nombreOperador)
          )
        );

        if (!querySnapshot.empty) {
          operadorData = querySnapshot.docs[0].data();
          console.log('✅ Datos del operador desde Firebase:', operadorData);
        }
      } catch (error) {
        console.warn('⚠️ Error buscando operador en Firebase:', error);
      }
    }

    // 2. Fallback: Buscar en configuracionManager
    if (!operadorData && window.configuracionManager) {
      const allOperadores = window.configuracionManager.getOperadores();
      operadorData = allOperadores ? allOperadores.find(o => o.nombre === nombreOperador) : null;
      console.log('✅ Datos del operador desde configuracionManager:', operadorData);
    }

    // 3. Fallback: Buscar en DataPersistence
    if (!operadorData && window.DataPersistence) {
      operadorData = window.DataPersistence.getOperadorData(nombreOperador);
      console.log('✅ Datos del operador desde DataPersistence:', operadorData);
    }

    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores

    if (operadorData) {
      console.log('Datos del operador encontrados:', operadorData);

      // Llenar campo de licencia automáticamente
      const licenciaField = document.getElementById('Licencia');

      if (licenciaField && operadorData.licencia) {
        licenciaField.value = operadorData.licencia;
        console.log('Número de licencia llenado:', operadorData.licencia);
      }

      // Mostrar notificación de éxito
      this.showNotification(
        `Datos del operador ${nombreOperador} cargados automáticamente`,
        'success'
      );
    } else {
      console.log('No se encontraron datos para el operador:', nombreOperador);
      this.showNotification(
        `No se encontraron datos para el operador ${nombreOperador}`,
        'warning'
      );
    }
  }

  // Cargar datos del operador secundario seleccionado
  async loadOperadorSecundarioData() {
    // Obtener valor del input hidden o del input visible
    const hiddenInput = document.getElementById('operadorsecundario_value');
    const visibleInput = document.getElementById('operadorsecundario');

    let nombreOperador = hiddenInput?.value || visibleInput?.value || '';

    // Si el input visible tiene texto con formato "Nombre - Licencia", extraer solo el nombre
    if (visibleInput && visibleInput.value && !hiddenInput?.value) {
      nombreOperador = visibleInput.value.split(' - ')[0].trim();
    }

    // Si no hay valor seleccionado, limpiar campos
    if (!nombreOperador) {
      console.log('Limpiando campos del operador secundario');

      // Limpiar campo de licencia secundaria si existe
      const licenciaSecundariaField = document.getElementById('LicenciaSecundaria');
      if (licenciaSecundariaField) {
        licenciaSecundariaField.value = '';
        licenciaSecundariaField.placeholder = 'Se llena automáticamente';
      }

      // También limpiar el campo de licencia principal si es que se estaba usando para el secundario
      const licenciaField = document.getElementById('Licencia');
      if (licenciaField && licenciaField.value) {
        // Solo limpiar si el operador principal no está seleccionado
        const operadorPrincipal = document.getElementById('operadorprincipal');
        if (!operadorPrincipal || !operadorPrincipal.value) {
          licenciaField.value = '';
          licenciaField.placeholder = 'Se llena automáticamente';
        }
      }

      this.showNotification('Campos del operador secundario limpiados', 'info');
      return;
    }

    console.log('Cargando datos del operador secundario:', nombreOperador);

    // Obtener datos del operador
    let operadorData = null;

    // 1. PRIORIDAD: Buscar en Firebase
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
              window.firebaseAuth?.currentUser?.uid || window.DEMO_CONFIG?.tenantId || 'demo_tenant'
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

    // 2. Fallback: Buscar en configuracionManager
    if (!operadorData && window.configuracionManager) {
      const allOperadores = window.configuracionManager.getOperadores();
      operadorData = allOperadores ? allOperadores.find(o => o.nombre === nombreOperador) : null;
      console.log('✅ Datos del operador secundario desde configuracionManager:', operadorData);
    }

    // 3. Fallback: Buscar en DataPersistence
    if (!operadorData && window.DataPersistence) {
      operadorData = window.DataPersistence.getOperadorData(nombreOperador);
      console.log('✅ Datos del operador secundario desde DataPersistence:', operadorData);
    }

    // 4. Fallback: Buscar en localStorage directamente
    // NO USAR localStorage - Solo Firebase es la fuente de verdad
    // Eliminado fallback a localStorage para evitar inconsistencias entre navegadores

    if (operadorData) {
      console.log('Datos del operador secundario encontrados:', operadorData);

      // Para el operador secundario, podrías llenar campos adicionales si los hay
      // Por ejemplo, si hay un campo separado para licencia del operador secundario
      const licenciaSecundariaField = document.getElementById('LicenciaSecundaria');

      if (licenciaSecundariaField && operadorData.licencia) {
        licenciaSecundariaField.value = operadorData.licencia;
        console.log('Número de licencia secundaria llenado:', operadorData.licencia);
      }

      // Mostrar notificación de éxito
      this.showNotification(
        `Datos del operador secundario ${nombreOperador} cargados automáticamente`,
        'success'
      );
    } else {
      console.log('No se encontraron datos para el operador secundario:', nombreOperador);
      this.showNotification(
        `No se encontraron datos para el operador secundario ${nombreOperador}`,
        'warning'
      );
    }
  }

  // Mostrar notificación (con control de spam)
  showNotification(message, type = 'info') {
    // Evitar notificaciones durante la inicialización de la página
    if (window._inicializandoPagina) {
      console.log(`🔇 Notificación suprimida durante inicialización: ${message}`);
      return;
    }

    // Evitar notificaciones duplicadas en un corto período
    const now = Date.now();
    const lastNotification = window._ultimaNotificacion || 0;
    const timeSinceLastNotification = now - lastNotification;

    if (timeSinceLastNotification < 1000) {
      // Menos de 1 segundo
      console.log(`🔇 Notificación suprimida (muy reciente): ${message}`);
      return;
    }

    window._ultimaNotificacion = now;

    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Instancia global del gestor de listas
window.traficoListasManager = new TraficoListasManager();

// Funciones globales para los botones
window.refreshEconomicosList = async function () {
  await window.traficoListasManager.loadEconomicosList();
  window.traficoListasManager.showNotification('Lista de económicos actualizada', 'success');
};

window.refreshOperadoresList = async function () {
  await window.traficoListasManager.loadOperadoresList();
  window.traficoListasManager.showNotification('Lista de operadores actualizada', 'success');
};

window.loadEconomicoData = function () {
  window.traficoListasManager.loadEconomicoData();
};

window.loadOperadorPrincipalData = async function () {
  await window.traficoListasManager.loadOperadorPrincipalData();
};

window.loadOperadorSecundarioData = async function () {
  await window.traficoListasManager.loadOperadorSecundarioData();
};

window.openConfiguracionEconomicos = function () {
  // Abrir página de configuración en nueva pestaña, enfocando en económicos
  const url = 'configuracion.html#economicos';
  window.open(url, '_blank');
  window.traficoListasManager.showNotification('Abriendo configuración de económicos...', 'info');
};

window.openConfiguracionOperadores = function () {
  // Abrir página de configuración en nueva pestaña, enfocando en operadores
  const url = 'configuracion.html#operadores';
  window.open(url, '_blank');
  window.traficoListasManager.showNotification('Abriendo configuración de operadores...', 'info');
};

// Función para recargar listas cuando se regresa de configuración
window.addEventListener('focus', () => {
  // Recargar listas cuando la ventana recupera el foco (por ejemplo, al regresar de configuración)
  if (window.traficoListasManager) {
    window.traficoListasManager.refreshAllLists();
  }
});

// Función para manejar cambios en localStorage (cuando se agregan nuevos registros)
window.addEventListener('storage', e => {
  if (e.key === 'erp_economicos' || e.key === 'erp_operadores') {
    // Recargar listas cuando cambian los datos en localStorage
    if (window.traficoListasManager) {
      window.traficoListasManager.refreshAllLists();
    }
  }
});
