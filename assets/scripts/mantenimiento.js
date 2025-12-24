// Mantenimiento Manager - ERP Rankiao
// Gestiona el módulo de mantenimiento de tractocamiones

console.log('📦 [mantenimiento.js] Script iniciando carga...');

class MantenimientoManager {
  constructor() {
    this.mantenimientosStorageKey = 'erp_mantenimientos';
    this.initializeData();
  }

  initializeData() {
    if (!localStorage.getItem(this.mantenimientosStorageKey)) {
      localStorage.setItem(this.mantenimientosStorageKey, JSON.stringify([]));
    }
  }

  async getMantenimientos() {
    try {
      // Intentar cargar desde Firebase primero
      if (window.firebaseRepos && window.firebaseRepos.mantenimiento) {
        try {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.mantenimiento.db || !window.firebaseRepos.mantenimiento.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.mantenimiento.init();
          }

          const mantenimientosFirebase = await window.firebaseRepos.mantenimiento.getAllRegistros();
          if (mantenimientosFirebase && mantenimientosFirebase.length > 0) {
            console.log(
              '✅ Mantenimientos cargados desde Firebase:',
              mantenimientosFirebase.length
            );
            // Sincronizar con localStorage
            this.setMantenimientos(mantenimientosFirebase);
            return mantenimientosFirebase;
          }
        } catch (firebaseError) {
          console.warn(
            '⚠️ Error cargando desde Firebase, usando localStorage como respaldo:',
            firebaseError
          );
        }
      }

      // FIREBASE ES LA FUENTE DE VERDAD
      // localStorage solo como cache/respaldo de emergencia (NO debe ser la fuente principal)
      // Solo usar si Firebase falló completamente o no está disponible
      const mantenimientosLocal = JSON.parse(
        localStorage.getItem(this.mantenimientosStorageKey) || '[]'
      );
      if (mantenimientosLocal.length > 0) {
        console.log(
          `⚠️ ${mantenimientosLocal.length} mantenimientos cargados desde localStorage (respaldo de emergencia - Firebase es la fuente de verdad)`
        );
      }
      return mantenimientosLocal;
    } catch (error) {
      console.error('Error al cargar mantenimientos:', error);
      return [];
    }
  }

  setMantenimientos(mantenimientos) {
    try {
      localStorage.setItem(this.mantenimientosStorageKey, JSON.stringify(mantenimientos));
      return true;
    } catch (error) {
      console.error('Error al guardar mantenimientos:', error);
      return false;
    }
  }

  async saveMantenimiento(mantenimiento) {
    try {
      const mantenimientos = await this.getMantenimientos();
      const nuevoMantenimiento = {
        id: Date.now(),
        fechaCreacion: new Date().toISOString(),
        ...mantenimiento,
        // Asegurar que tiempoEjecucion siempre esté presente (incluso si está vacío)
        tiempoEjecucion:
          mantenimiento.tiempoEjecucion || mantenimiento.tiempoEjecucion === ''
            ? mantenimiento.tiempoEjecucion
            : ''
      };

      // Verificar que tiempoEjecucion esté en el objeto antes de guardar
      if (!('tiempoEjecucion' in nuevoMantenimiento)) {
        console.warn('⚠️ tiempoEjecucion no está en mantenimientoData, agregándolo...');
        nuevoMantenimiento.tiempoEjecucion = mantenimiento.tiempoEjecucion || '';
      }

      console.log(
        '💾 Guardando mantenimiento con tiempoEjecucion:',
        nuevoMantenimiento.tiempoEjecucion
      );

      mantenimientos.push(nuevoMantenimiento);

      // Guardar en localStorage
      this.setMantenimientos(mantenimientos);

      // Guardar en Firebase
      try {
        if (window.firebaseRepos && window.firebaseRepos.mantenimiento) {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.mantenimiento.db || !window.firebaseRepos.mantenimiento.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.mantenimiento.init();
          }

          const registroId = `mant_${nuevoMantenimiento.id}`;
          // Asegurar que tiempoEjecucion esté en el objeto antes de guardar en Firebase
          const mantenimientoParaFirebase = {
            ...nuevoMantenimiento,
            tiempoEjecucion: nuevoMantenimiento.tiempoEjecucion || ''
          };
          await window.firebaseRepos.mantenimiento.saveRegistro(
            registroId,
            mantenimientoParaFirebase
          );
          console.log(
            '✅ Mantenimiento guardado en Firebase:',
            registroId,
            'con tiempoEjecucion:',
            mantenimientoParaFirebase.tiempoEjecucion
          );
        } else {
          console.warn('⚠️ Repositorio de Firebase Mantenimiento no disponible');
        }
      } catch (firebaseError) {
        console.error('❌ Error guardando mantenimiento en Firebase:', firebaseError);
        // Continuar aunque falle Firebase, ya que se guardó en localStorage
      }

      return true;
    } catch (error) {
      console.error('Error al guardar mantenimiento:', error);
      return false;
    }
  }

  async getMantenimiento(id) {
    const mantenimientos = await this.getMantenimientos();
    // Intentar búsqueda exacta primero
    let mantenimiento = mantenimientos.find(m => m.id === id);

    // Si no se encuentra, intentar comparación flexible (string vs número)
    if (!mantenimiento) {
      mantenimiento = mantenimientos.find(m => String(m.id) === String(id));
    }

    // Si aún no se encuentra, intentar buscar por ID numérico convertido
    if (!mantenimiento && !isNaN(id)) {
      const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
      mantenimiento = mantenimientos.find(m => m.id === idNum || String(m.id) === String(idNum));
    }

    console.log('🔍 Búsqueda de mantenimiento:', {
      idBuscado: id,
      tipoId: typeof id,
      encontrado: Boolean(mantenimiento),
      totalMantenimientos: mantenimientos.length,
      idsDisponibles: mantenimientos.slice(0, 5).map(m => ({ id: m.id, tipo: typeof m.id }))
    });

    return mantenimiento;
  }

  async updateMantenimiento(id, datosActualizados) {
    try {
      const mantenimientos = await this.getMantenimientos();
      const index = mantenimientos.findIndex(m => m.id === id || String(m.id) === String(id));

      if (index === -1) {
        console.error('❌ Mantenimiento no encontrado para actualizar:', id);
        return false;
      }

      // Actualizar el mantenimiento
      const mantenimientoActualizado = {
        ...mantenimientos[index],
        ...datosActualizados,
        fechaActualizacion: new Date().toISOString(),
        // Asegurar que tiempoEjecucion siempre esté presente (incluso si está vacío)
        tiempoEjecucion:
          datosActualizados.tiempoEjecucion !== undefined
            ? datosActualizados.tiempoEjecucion
            : mantenimientos[index].tiempoEjecucion || ''
      };
      mantenimientos[index] = mantenimientoActualizado;

      // Verificar que tiempoEjecucion esté en el objeto antes de guardar
      if (!('tiempoEjecucion' in mantenimientoActualizado)) {
        console.warn('⚠️ tiempoEjecucion no está en datosActualizados, agregándolo...');
        mantenimientoActualizado.tiempoEjecucion =
          datosActualizados.tiempoEjecucion || mantenimientos[index].tiempoEjecucion || '';
      }

      console.log(
        '💾 Actualizando mantenimiento con tiempoEjecucion:',
        mantenimientoActualizado.tiempoEjecucion
      );

      // Guardar en localStorage
      this.setMantenimientos(mantenimientos);

      // Guardar en Firebase
      try {
        if (window.firebaseRepos && window.firebaseRepos.mantenimiento) {
          // Esperar a que el repositorio esté inicializado
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.mantenimiento.db || !window.firebaseRepos.mantenimiento.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.mantenimiento.init();
          }

          const registroId = `mant_${id}`;
          // Asegurar que tiempoEjecucion esté en el objeto antes de guardar en Firebase
          const mantenimientoParaFirebase = {
            ...mantenimientoActualizado,
            tiempoEjecucion: mantenimientoActualizado.tiempoEjecucion || ''
          };
          console.log('💾 Guardando en Firebase con ID:', registroId, 'Datos:', {
            economico: mantenimientoParaFirebase.economico,
            fechaServicio: mantenimientoParaFirebase.fechaServicio,
            tiempoEjecucion: mantenimientoParaFirebase.tiempoEjecucion,
            id: mantenimientoParaFirebase.id
          });
          await window.firebaseRepos.mantenimiento.saveRegistro(
            registroId,
            mantenimientoParaFirebase
          );
          console.log(
            '✅ Mantenimiento actualizado en Firebase:',
            registroId,
            'con tiempoEjecucion:',
            mantenimientoParaFirebase.tiempoEjecucion
          );
        } else {
          console.warn('⚠️ Repositorio de Firebase Mantenimiento no disponible');
        }
      } catch (firebaseError) {
        console.error('❌ Error actualizando mantenimiento en Firebase:', firebaseError);
        // Continuar aunque falle Firebase, ya que se guardó en localStorage
      }

      return true;
    } catch (error) {
      console.error('Error al actualizar mantenimiento:', error);
      return false;
    }
  }

  async deleteMantenimiento(id) {
    try {
      const mantenimientos = await this.getMantenimientos();
      const mantenimientosFiltrados = mantenimientos.filter(m => m.id !== id);
      return this.setMantenimientos(mantenimientosFiltrados);
    } catch (error) {
      console.error('Error al eliminar mantenimiento:', error);
      return false;
    }
  }

  async getAllMantenimientos() {
    return this.getMantenimientos();
  }
}

// Inicializar el manager global
window.mantenimientoManager = new MantenimientoManager();

// Funciones de UI para Mantenimiento
// DEFINIR INMEDIATAMENTE para que esté disponible tan pronto como se cargue el script
window.loadEconomicosMantenimiento = async function loadEconomicosMantenimiento() {
  console.log('🔄 [loadEconomicosMantenimiento] Iniciando carga de económicos en caché...');
  let tractocamiones = [];

  try {
    // Ya no necesitamos el select, solo cargar en caché

    // Esperar a que configuracionManager esté disponible
    let attempts = 0;
    while (attempts < 10 && !window.configuracionManager) {
      attempts++;
      console.log(`⏳ Esperando configuracionManager... (${attempts}/10)`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 1. PRIORIDAD: Intentar desde el caché de Firestore (más actual)
    if (
      window.__economicosCache &&
      Array.isArray(window.__economicosCache) &&
      window.__economicosCache.length > 0
    ) {
      tractocamiones = window.__economicosCache;
      console.log('✅ Tractocamiones cargados desde Firestore cache:', tractocamiones.length);
    }

    // 2. Intentar cargar desde configuracionManager usando getAllEconomicos
    if (tractocamiones.length === 0 && window.configuracionManager) {
      try {
        if (typeof window.configuracionManager.getAllEconomicos === 'function') {
          const economicosData = window.configuracionManager.getAllEconomicos();
          if (Array.isArray(economicosData) && economicosData.length > 0) {
            tractocamiones = economicosData;
            console.log(
              '✅ Tractocamiones cargados desde getAllEconomicos:',
              tractocamiones.length
            );
          }
        } else if (typeof window.configuracionManager.getEconomicos === 'function') {
          const economicosData = window.configuracionManager.getEconomicos();
          // Si es un objeto, convertirlo a array
          if (
            economicosData &&
            typeof economicosData === 'object' &&
            !Array.isArray(economicosData)
          ) {
            tractocamiones = Object.values(economicosData);
          } else if (Array.isArray(economicosData)) {
            tractocamiones = economicosData;
          }
          console.log('✅ Tractocamiones cargados desde getEconomicos:', tractocamiones.length);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando desde configuracionManager:', error);
      }
    }

    // 3. Si no hay datos, usar sistema de caché inteligente: Firebase primero, luego caché
    if (tractocamiones.length === 0) {
      const tractocamionesCache = await window.getDataWithCache('economicos', async () => {
        let tractocamionesData = [];

        // Esperar a que Firebase esté disponible
        let attempts = 0;
        while (attempts < 10 && (!window.firebaseDb || !window.fs)) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (window.firebaseDb && window.fs) {
          try {
            console.log('📊 Intentando cargar tractocamiones desde Firebase...');

            // PRIORIDAD 1: Intentar desde configuracion/tractocamiones (documento con array)
            try {
              console.log('📊 [PRIORIDAD] Buscando en configuracion/tractocamiones...');
              const tractocamionesDocRef = window.fs.doc(
                window.firebaseDb,
                'configuracion',
                'tractocamiones'
              );
              const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

              if (tractocamionesDoc.exists()) {
                const data = tractocamionesDoc.data();
                if (data.economicos && Array.isArray(data.economicos)) {
                  const todosLosEconomicos = data.economicos;

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
                  tractocamionesData = todosLosEconomicos.filter(economico => {
                    const economicoTenantId = economico.tenantId;
                    return economicoTenantId === tenantId;
                  });

                  console.log(
                    `🔒 Tractocamiones filtrados por tenantId (${tenantId}): ${tractocamionesData.length} de ${todosLosEconomicos.length} totales`
                  );
                }
              }
            } catch (error) {
              console.warn('⚠️ Error cargando desde configuracion/tractocamiones:', error);
            }

            // PRIORIDAD 2: Si no hay datos, intentar desde la colección de económicos
            if (tractocamionesData.length === 0) {
              try {
                console.log('📊 Buscando en colección economicos...');
                const economicosRef = window.fs.collection(window.firebaseDb, 'economicos');
                const tenantId =
                  window.firebaseAuth?.currentUser?.uid ||
                  localStorage.getItem('tenantId') ||
                  window.DEMO_CONFIG?.tenantId ||
                  'demo_tenant';
                const querySnapshot = await window.fs.getDocs(
                  window.fs.query(economicosRef, window.fs.where('tenantId', '==', tenantId))
                );
                tractocamionesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(
                  '✅ Tractocamiones cargados desde colección economicos:',
                  tractocamionesData.length
                );
              } catch (error) {
                console.warn('⚠️ Error cargando desde colección economicos:', error);
              }
            }
          } catch (error) {
            console.warn('⚠️ Error cargando tractocamiones desde Firebase:', error);
          }
        }

        // Fallback: Intentar desde DataPersistence (solo como último recurso)
        if (
          tractocamionesData.length === 0 &&
          window.DataPersistence &&
          typeof window.DataPersistence.getAllEconomicos === 'function'
        ) {
          try {
            tractocamionesData = window.DataPersistence.getAllEconomicos() || [];
            console.log(
              '✅ Tractocamiones cargados desde DataPersistence:',
              tractocamionesData.length
            );
          } catch (error) {
            console.warn('⚠️ Error cargando tractocamiones desde DataPersistence:', error);
          }
        }

        return tractocamionesData;
      });

      if (tractocamionesCache && tractocamionesCache.length > 0) {
        tractocamiones = tractocamionesCache;
      }
    }

    // Si no hay datos, mostrar advertencia
    if (tractocamiones.length === 0) {
      console.warn('⚠️ No hay tractocamiones registrados en el sistema');
    }

    console.log('📋 Total de tractocamiones encontrados:', tractocamiones.length);

    // Filtrar solo tractocamiones activos
    const tractocamionesActivos = tractocamiones.filter(
      tracto =>
        // Verificar que tenga número y que esté activo (o no tenga campo estadoVehiculo inactivo)
        tracto &&
        tracto.numero &&
        tracto.estadoVehiculo !== 'inactivo' &&
        tracto.estadoVehiculo !== 'retirado'
    );

    // Actualizar caché global para los searchable dropdowns
    window._economicosCache = tractocamionesActivos;
    window.__economicosCache = tractocamionesActivos;

    // Actualizar caché de ERPState si está disponible
    if (window.ERPState && typeof window.ERPState.setCache === 'function') {
      window.ERPState.setCache('economicos', tractocamionesActivos);
      console.log('✅ Caché de ERPState actualizado');
    }

    console.log(`✅ Caché actualizado con ${tractocamionesActivos.length} tractocamiones activos`);
  } catch (err) {
    console.error('❌ Error cargando económicos para Mantenimiento:', err);
  }
};

function loadPlacasMantenimiento() {
  // Obtener el número del económico desde el input searchable
  const hiddenInput = document.getElementById('economico_value');
  const visibleInput = document.getElementById('economico');
  const inputPlacas = document.getElementById('Placa');
  const inputMarca = document.getElementById('marca');
  const inputModelo = document.getElementById('modelo');

  if (!visibleInput || !inputPlacas || !inputMarca || !inputModelo) {
    console.warn('⚠️ [loadPlacasMantenimiento] No se encontraron todos los campos necesarios');
    return;
  }

  // Obtener el número del económico
  let numero = '';
  if (hiddenInput && hiddenInput.value) {
    numero = hiddenInput.value;
    console.log('✅ [loadPlacasMantenimiento] Número obtenido del hiddenInput:', numero);
  } else if (visibleInput && visibleInput.value) {
    // Extraer el número del texto (formato: "numero - marca modelo (placa)")
    const match = visibleInput.value.match(/^(\d+)/);
    if (match) {
      numero = match[1];
      console.log('✅ [loadPlacasMantenimiento] Número extraído del visibleInput:', numero);
    }
  }

  if (!numero) {
    console.warn('⚠️ [loadPlacasMantenimiento] No se pudo obtener el número del económico');
    inputPlacas.value = '';
    inputMarca.value = '';
    inputModelo.value = '';
    return;
  }

  // Buscar el económico en el caché
  let economicoData = null;

  // PRIORIDAD 1: Buscar en el caché de ERPState (usado por los dropdowns)
  if (window.ERPState && typeof window.ERPState.getCache === 'function') {
    const economicosCache = window.ERPState.getCache('economicos');
    if (Array.isArray(economicosCache) && economicosCache.length > 0) {
      economicoData = economicosCache.find(
        tracto =>
          (tracto.numero && tracto.numero.toString() === numero.toString()) ||
          (tracto.economico && tracto.economico.toString() === numero.toString()) ||
          (tracto.id && tracto.id.toString() === numero.toString())
      );
    }
  }

  // PRIORIDAD 2: Buscar en el caché de Firestore
  if (!economicoData && window.__economicosCache && Array.isArray(window.__economicosCache)) {
    economicoData = window.__economicosCache.find(
      tracto =>
        (tracto.numero && tracto.numero.toString() === numero.toString()) ||
        (tracto.economico && tracto.economico.toString() === numero.toString()) ||
        (tracto.id && tracto.id.toString() === numero.toString())
    );
  }

  // PRIORIDAD 3: Buscar en configuracionManager
  if (!economicoData && window.configuracionManager) {
    if (typeof window.configuracionManager.getEconomico === 'function') {
      economicoData = window.configuracionManager.getEconomico(numero);
    } else if (typeof window.configuracionManager.getAllEconomicos === 'function') {
      const economicos = window.configuracionManager.getAllEconomicos() || [];
      economicoData = economicos.find(
        eco =>
          (eco.numero && eco.numero.toString() === numero.toString()) ||
          (eco.economico && eco.economico.toString() === numero.toString())
      );
    }
  }

  if (economicoData) {
    const placa = economicoData.placaTracto || economicoData.placa || '';
    const marca = economicoData.marca || '';
    const modelo = economicoData.modelo || '';

    inputPlacas.value = placa;
    inputMarca.value = marca;
    inputModelo.value = modelo;

    console.log('✅ [loadPlacasMantenimiento] Campos llenados:', { placa, marca, modelo });
  } else {
    console.warn(
      '⚠️ [loadPlacasMantenimiento] No se encontraron datos del económico para el número:',
      numero
    );
    inputPlacas.value = '';
    inputMarca.value = '';
    inputModelo.value = '';
  }
}

window.refreshEconomicosListMantenimiento = async function refreshEconomicosListMantenimiento() {
  console.log('🔄 Refrescando lista de económicos en mantenimiento...');
  // Limpiar caché y recargar
  window._economicosCache = [];
  window.__economicosCache = [];
  await window.loadEconomicosMantenimiento();
  // Si hay función de carga de caché en el HTML, llamarla también
  if (typeof cargarTractocamionesEnCacheMantenimiento === 'function') {
    await cargarTractocamionesEnCacheMantenimiento();
  }
};

function _openConfiguracionEconomicosMantenimiento() {
  if (confirm('¿Desea abrir la configuración de económicos?')) {
    window.open('configuracion.html#economicos', '_blank');
  }
}

// Eliminado: carga de operadores; el responsable técnico es texto libre

// Variable para evitar dobles clics
let isProcessingMantenimiento = false;

async function saveMantenimientoData() {
  // Prevenir dobles clics
  if (isProcessingMantenimiento) {
    console.log('⚠️ Ya hay un proceso de guardado en curso, ignorando clic duplicado');
    return false;
  }

  // Obtener el botón de submit (fuera del try para que esté disponible en el catch)
  const submitButton = document.querySelector('button[data-action="saveMantenimientoData"]');
  const originalButtonHTML = submitButton ? submitButton.innerHTML : '';
  const originalButtonStyle = submitButton
    ? {
      backgroundColor: submitButton.style.backgroundColor || '',
      borderColor: submitButton.style.borderColor || '',
      color: submitButton.style.color || ''
    }
    : {};

  try {
    // Deshabilitar botón y cambiar texto inmediatamente
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
      submitButton.style.opacity = '0.7';
      submitButton.style.cursor = 'not-allowed';
      submitButton.style.pointerEvents = 'none'; // Prevenir cualquier interacción
    }

    // Marcar como procesando
    isProcessingMantenimiento = true;

    // Validar formulario
    const form = document.querySelector('.needs-validation');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      // Restaurar botón si la validación falla
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHTML;
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
        submitButton.style.pointerEvents = 'auto';
        if (originalButtonStyle.backgroundColor) {
          submitButton.style.backgroundColor = originalButtonStyle.backgroundColor;
          submitButton.style.borderColor = originalButtonStyle.borderColor;
          submitButton.style.color = originalButtonStyle.color;
        }
      }
      isProcessingMantenimiento = false;
      return false;
    }

    // Validar que se haya seleccionado un tipo de mantenimiento
    const tipoMantenimientoSeleccionado = document.querySelector(
      'input[name="fav_language"]:checked'
    )?.value;
    if (!tipoMantenimientoSeleccionado) {
      showNotification(
        'Por favor, selecciona un tipo de mantenimiento (Preventivo, Correctivo o Predictivo)',
        'error'
      );
      // Resaltar visualmente el campo
      const tipoMantenimientoSection = document.querySelector(
        '.form-section:has(input[name="fav_language"])'
      );
      if (tipoMantenimientoSection) {
        tipoMantenimientoSection.style.border = '2px solid #dc3545';
        tipoMantenimientoSection.style.borderRadius = '5px';
        tipoMantenimientoSection.style.padding = '10px';
        setTimeout(() => {
          tipoMantenimientoSection.style.border = '';
          tipoMantenimientoSection.style.padding = '';
        }, 3000);
      }
      // Restaurar botón si la validación falla
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonHTML;
        submitButton.style.opacity = '1';
        submitButton.style.cursor = 'pointer';
        submitButton.style.pointerEvents = 'auto';
        if (originalButtonStyle.backgroundColor) {
          submitButton.style.backgroundColor = originalButtonStyle.backgroundColor;
          submitButton.style.borderColor = originalButtonStyle.borderColor;
          submitButton.style.color = originalButtonStyle.color;
        }
      }
      isProcessingMantenimiento = false;
      return false;
    }

    // Recopilar datos del formulario
    // Asegurar que la fecha se guarde en formato YYYY-MM-DD sin problemas de zona horaria
    let fechaServicio = document.getElementById('Fecha').value;
    if (fechaServicio && typeof fechaServicio === 'string') {
      // Si ya está en formato YYYY-MM-DD, usarlo directamente
      if (!/^\d{4}-\d{2}-\d{2}/.test(fechaServicio)) {
        // Si no está en formato YYYY-MM-DD, intentar parsearlo
        try {
          const fecha = new Date(fechaServicio);
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          fechaServicio = `${year}-${month}-${day}`;
        } catch (e) {
          console.warn('⚠️ Error parseando fechaServicio:', fechaServicio, e);
        }
      } else {
        // Ya está en formato YYYY-MM-DD, tomar solo la parte de fecha si viene con hora
        fechaServicio = fechaServicio.split('T')[0];
      }
    }

    // Obtener el número del económico desde el input searchable
    const hiddenInput = document.getElementById('economico_value');
    const visibleInput = document.getElementById('economico');
    let economicoNumero = '';
    if (hiddenInput && hiddenInput.value) {
      economicoNumero = hiddenInput.value;
    } else if (visibleInput && visibleInput.value) {
      // Extraer el número del texto (formato: "numero - marca modelo (placa)")
      const match = visibleInput.value.match(/^(\d+)/);
      if (match) {
        economicoNumero = match[1];
      } else {
        economicoNumero = visibleInput.value.trim();
      }
    }

    // Capturar tiempo de ejecución
    const tiempoEjecucionInput = document.getElementById('tiempoejecucion');
    const tiempoEjecucion = tiempoEjecucionInput ? tiempoEjecucionInput.value.trim() : '';

    const mantenimientoData = {
      fechaServicio: fechaServicio,
      economico: economicoNumero,
      kilometraje: parseInt(document.getElementById('kilometraje').value, 10),
      placas: document.getElementById('Placa').value,
      marca: document.getElementById('marca').value,
      modelo: document.getElementById('modelo').value,
      tipoMantenimiento: tipoMantenimientoSeleccionado,
      nivelCombustible: parseInt(document.getElementById('nivelCombustible').value, 10),
      nivelUrea: parseInt(document.getElementById('nivelUrea').value, 10),
      responsableTecnico: document.getElementById('responsabletecnico').value,
      tiempoEjecucion: tiempoEjecucion, // Tiempo de ejecución (siempre presente)
      subcontratacion: document.getElementById('subcontratacion').value,
      servicio: document.getElementById('servicio').value,
      descripcion: document.getElementById('descripcion').value,
      refacciones: collectRefaccionesData(),
      fechaSiguienteServicio: document.getElementById('fechaSiguienteServicio').value,
      estadoEconomico: document.getElementById('estadoeconomico').value,
      kilometrajeSiguienteServicio: parseInt(
        document.getElementById('kilometrajesiguienteservicio').value,
        10
      ),
      evidencias: collectEvidenciasData()
    };

    console.log('📋 Datos de mantenimiento a guardar (incluyendo tiempoEjecucion):', {
      tiempoEjecucion: mantenimientoData.tiempoEjecucion,
      tieneTiempoEjecucion: 'tiempoEjecucion' in mantenimientoData
    });

    // Guardar en el manager (ahora es async)
    const success = await window.mantenimientoManager.saveMantenimiento(mantenimientoData);

    if (success) {
      // Cambiar botón a estado "procesado" con checkmark verde
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-check-circle"></i> Procesado';
        submitButton.style.opacity = '0.8';
        submitButton.style.cursor = 'not-allowed';
        submitButton.style.backgroundColor = '#28a745';
        submitButton.style.borderColor = '#28a745';
        submitButton.style.color = '#ffffff';
      }

      showNotification('Mantenimiento registrado exitosamente', 'success');
      try {
        console.log('🔧 Datos de refacciones a descontar:', mantenimientoData.refacciones);
        // Pasar la fecha del servicio de mantenimiento para usar en el movimiento de inventario
        const fechaServicio =
          mantenimientoData.fechaServicio ||
          mantenimientoData.fecha ||
          new Date().toISOString().split('T')[0];
        await descontarRefaccionesDeInventario(mantenimientoData.refacciones, fechaServicio);

        // Actualizar lista de refacciones disponibles
        if (window.actualizarListaRefacciones) {
          setTimeout(() => {
            window.actualizarListaRefacciones();
          }, 500);
        }

        // Actualizar stock en el formulario de mantenimiento
        if (window.actualizarStockEnFormulario) {
          setTimeout(() => {
            window.actualizarStockEnFormulario();
          }, 600);
        }
      } catch (e) {
        console.error('Error al descontar refacciones:', e);
      }

      // Limpiar formulario
      clearMantenimientoForm();

      // Actualizar tabla de mantenimientos
      await loadMantenimientosTable();

      // Recargar la página después de un breve delay para que el usuario vea el mensaje de éxito
      // Usar location.reload() para forzar recarga completa como F5
      setTimeout(() => {
        console.log('🔄 Recargando página después de guardar mantenimiento...');
        // No restaurar el botón ya que la página se va a recargar
        // Usar reload() sin parámetros para recarga completa (equivalente a F5)
        window.location.reload();
      }, 1500);

      return true;
    }
    showNotification('Error al registrar el mantenimiento', 'error');
    // Restaurar botón si falla
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHTML;
      submitButton.style.opacity = '1';
      submitButton.style.cursor = 'pointer';
      submitButton.style.pointerEvents = 'auto';
      if (originalButtonStyle.backgroundColor) {
        submitButton.style.backgroundColor = originalButtonStyle.backgroundColor;
        submitButton.style.borderColor = originalButtonStyle.borderColor;
        submitButton.style.color = originalButtonStyle.color;
      }
    }
    isProcessingMantenimiento = false;
    return false;
  } catch (error) {
    console.error('Error al guardar datos de mantenimiento:', error);
    showNotification('Error al procesar el formulario', 'error');

    // Restaurar botón en caso de error
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML =
        originalButtonHTML || '<i class="fas fa-check"></i> Registrar Mantenimiento';
      submitButton.style.opacity = '1';
      submitButton.style.cursor = 'pointer';
      submitButton.style.pointerEvents = 'auto';
      if (originalButtonStyle.backgroundColor) {
        submitButton.style.backgroundColor = originalButtonStyle.backgroundColor;
        submitButton.style.borderColor = originalButtonStyle.borderColor;
        submitButton.style.color = originalButtonStyle.color;
      }
    }
    isProcessingMantenimiento = false;
    return false;
  }
}
// Descuenta del inventario de refacciones según los códigos usados en mantenimiento
async function descontarRefaccionesDeInventario(lista, fechaServicio = null) {
  console.log('🔧 Descontando refacciones del inventario:', lista);
  if (!Array.isArray(lista) || lista.length === 0) {
    console.log('⚠️ No hay refacciones para descontar');
    return;
  }
  // Cargar helpers de inventario
  const STOCK_KEY = 'erp_inv_refacciones_stock';
  const MOVS_KEY = 'erp_inv_refacciones_movs';
  const loadJSON = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (_) {
      return d;
    }
  };
  const saveJSON = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (_) {
      // Ignorar error intencionalmente
    }
  };

  const stock = loadJSON(STOCK_KEY, {});
  const movs = loadJSON(MOVS_KEY, []);

  // Usar la fecha del servicio de mantenimiento si se proporciona, sino usar la fecha actual
  let fecha = fechaServicio;
  if (!fecha) {
    const today = new Date();
    fecha = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  } else if (typeof fecha === 'string') {
    // Si es formato YYYY-MM-DD, usarlo directamente
    if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) {
      fecha = fecha.split('T')[0]; // Tomar solo la parte de fecha si viene con hora
    } else if (fecha.includes('T')) {
      // Formato ISO con hora, extraer solo la fecha
      fecha = fecha.split('T')[0];
    } else {
      // Otro formato, intentar parsear sin problemas de zona horaria
      try {
        // Si es formato DD/MM/YYYY
        if (fecha.includes('/')) {
          const partes = fecha.split('/');
          if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const año = parseInt(partes[2], 10);
            const fechaObj = new Date(año, mes, dia);
            const year = fechaObj.getFullYear();
            const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getDate()).padStart(2, '0');
            fecha = `${year}-${month}-${day}`;
          } else {
            // Fallback: intentar parsear como Date
            const fechaObj = new Date(fecha);
            const year = fechaObj.getFullYear();
            const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getDate()).padStart(2, '0');
            fecha = `${year}-${month}-${day}`;
          }
        } else {
          // Fallback: intentar parsear como Date
          const fechaObj = new Date(fecha);
          const year = fechaObj.getFullYear();
          const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
          const day = String(fechaObj.getDate()).padStart(2, '0');
          fecha = `${year}-${month}-${day}`;
        }
      } catch (e) {
        // Si falla el parseo, usar la fecha actual
        const today = new Date();
        fecha = today.toISOString().split('T')[0];
      }
    }
  }

  console.log(
    `📅 Fecha del movimiento de salida: ${fecha} (fechaServicio original: ${fechaServicio})`
  );

  // Guardar movimientos en Firebase
  try {
    if (window.firebaseRepos && window.firebaseRepos.inventario) {
      // Esperar a que el repositorio esté inicializado
      let attempts = 0;
      while (
        attempts < 10 &&
        (!window.firebaseRepos.inventario.db || !window.firebaseRepos.inventario.tenantId)
      ) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
        await window.firebaseRepos.inventario.init();
      }
    }
  } catch (error) {
    console.warn('⚠️ Error inicializando repositorio de inventario:', error);
  }

  for (const item of lista) {
    const cod = (item.codigo || '').trim();
    const cant = parseInt(item.cantidad || 0, 10);
    if (!cod || !cant || cant <= 0) {
      continue;
    }

    // Verificar stock disponible antes del descuento
    const stockActual = stock[cod]?.qty || 0;
    if (stockActual < cant) {
      console.warn(
        `⚠️ ADVERTENCIA: Stock insuficiente para ${cod}. Stock actual: ${stockActual}, Cantidad solicitada: ${cant}`
      );
      // Ajustar la cantidad al stock disponible
      const cantidadAjustada = stockActual;
      if (cantidadAjustada <= 0) {
        console.error(`❌ No se puede descontar ${cod}: sin stock disponible`);
        continue;
      }
      console.log(`🔧 Ajustando cantidad de ${cant} a ${cantidadAjustada} para ${cod}`);
    }

    // Usar la cantidad ajustada si es necesario
    const cantidadFinal = Math.min(cant, stockActual);

    // Crear movimiento de salida
    const movimiento = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      fecha,
      tipo: 'salida',
      cod,
      desc: item.descripcion || item.refaccion || '',
      cant: cantidadFinal,
      obs: 'Salida por mantenimiento',
      factura: '',
      proveedor: '',
      unidad: item.unidad || 'piezas',
      almacen: item.almacen || 'Almacén Central'
    };

    // Guardar en localStorage
    movs.unshift(movimiento);

    // Guardar en Firebase
    try {
      if (window.firebaseRepos && window.firebaseRepos.inventario) {
        const movimientoId = `mov_${movimiento.id}`;
        await window.firebaseRepos.inventario.saveMovimiento(movimientoId, movimiento);
        console.log('✅ Movimiento de salida guardado en Firebase:', movimientoId);
      }
    } catch (firebaseError) {
      console.error('❌ Error guardando movimiento en Firebase:', firebaseError);
      // Continuar aunque falle Firebase
    }

    // Actualizar stock con protección contra números negativos
    const cur = stock[cod] || {
      desc: item.descripcion || item.refaccion || '',
      qty: 0,
      last: null
    };
    cur.desc = item.descripcion || item.refaccion || cur.desc;
    cur.qty = Math.max(0, (cur.qty || 0) - cantidadFinal);
    cur.last = fecha;
    stock[cod] = cur;

    console.log(
      `✅ Stock actualizado para ${cod}: ${cur.qty} unidades (descontado: ${cantidadFinal})`
    );
  }

  // Guardar en localStorage
  saveJSON(MOVS_KEY, movs);
  saveJSON(STOCK_KEY, stock);

  console.log('✅ Refacciones descontadas del inventario exitosamente');
  console.log('📦 Movimientos guardados:', movs.length);
  console.log('📊 Stock actualizado:', Object.keys(stock).length, 'items');

  // Recalcular stock desde movimientos para asegurar consistencia
  if (window.refaccionesUI && typeof window.refaccionesUI.refreshAll === 'function') {
    try {
      await window.refaccionesUI.refreshAll();
    } catch (e) {
      console.warn('⚠️ Error refrescando inventario:', e);
    }
  }
}

function collectRefaccionesData() {
  const refacciones = [];

  // Usar la nueva función de refacciones si está disponible
  if (
    window.obtenerRefaccionesUtilizadas &&
    typeof window.obtenerRefaccionesUtilizadas === 'function'
  ) {
    const refaccionesObtenidas = window.obtenerRefaccionesUtilizadas();
    console.log(
      '📋 Refacciones obtenidas desde obtenerRefaccionesUtilizadas:',
      refaccionesObtenidas
    );
    return refaccionesObtenidas;
  }

  // Fallback: buscar en la estructura antigua
  const section = document.getElementById('refaccionesSection');
  if (!section) {
    return refacciones;
  }

  // Buscar todos los selects de refacciones
  const selects = section.querySelectorAll('[id^="refaccion_codigo_"]');
  selects.forEach(select => {
    const codigo = select.value?.trim();
    if (codigo) {
      const numeroFila = select.id.split('_')[2];
      const cantidadInput = document.getElementById(`refaccion_cantidad_${numeroFila}`);
      const descInput = document.getElementById(`refaccion_desc_${numeroFila}`);

      if (cantidadInput && cantidadInput.value) {
        const cantidad = parseInt(cantidadInput.value, 10) || 0;
        if (cantidad > 0) {
          refacciones.push({
            codigo: codigo,
            descripcion: descInput?.value || '',
            cantidad: cantidad
          });
        }
      }
    }
  });

  return refacciones;
}

function collectEvidenciasData() {
  const evidencias = {
    antes: document.querySelector('input[type="file"]')?.files[0] || null,
    despues: document.querySelectorAll('input[type="file"]')[1]?.files[0] || null,
    proceso: document.querySelectorAll('input[type="file"]')[2]?.files[0] || null,
    facturas: document.querySelectorAll('input[type="file"]')[3]?.files[0] || null
  };

  return evidencias;
}

function clearMantenimientoForm() {
  const form = document.querySelector('.needs-validation');
  form.reset();
  form.classList.remove('was-validated');

  // Limpiar campos específicos
  const placaEl = document.getElementById('Placa');
  const marcaEl = document.getElementById('marca');
  const modeloEl = document.getElementById('modelo');
  if (placaEl) {
    placaEl.value = '';
  }
  if (marcaEl) {
    marcaEl.value = '';
  }
  if (modeloEl) {
    modeloEl.value = '';
  }

  // Reiniciar select de económico y limpiar dependientes
  const economicoSel = document.getElementById('economico');
  if (economicoSel) {
    economicoSel.value = '';
    try {
      loadPlacasMantenimiento();
    } catch (_) {
      // Ignorar error intencionalmente
    }
  }

  // Limpiar campos de refacciones
  try {
    for (let i = 1; i <= 10; i++) {
      // Limpiar hasta 10 filas de refacciones
      const buscarEl = document.getElementById(`refaccion_buscar_${i}`);
      const descEl = document.getElementById(`refaccion_desc_${i}`);
      const almacenEl = document.getElementById(`refaccion_almacen_${i}`);
      const stockEl = document.getElementById(`refaccion_stock_${i}`);
      const cantidadEl = document.getElementById(`refaccion_cantidad_${i}`);

      if (buscarEl) {
        buscarEl.value = '';
        buscarEl.dataset.codigo = '';
        buscarEl.dataset.almacen = '';
      }
      if (descEl) {
        descEl.value = '';
      }
      if (almacenEl) {
        almacenEl.value = '';
      }
      if (stockEl) {
        stockEl.value = '';
      }
      if (cantidadEl) {
        cantidadEl.value = '';
        cantidadEl.max = '';
      }
    }
  } catch (e) {
    console.log('Error limpiando campos de refacciones:', e);
  }

  // Reiniciar sliders y sus outputs
  const combustibleSlider = document.getElementById('nivelCombustible');
  const combustibleOutput = document.getElementById('nivelCombustibleValue');
  if (combustibleSlider) {
    combustibleSlider.value = 50;
  }
  if (combustibleOutput) {
    combustibleOutput.textContent = combustibleSlider ? `${combustibleSlider.value}%` : '';
  }
  const ureaSlider = document.getElementById('nivelUrea');
  const ureaOutput = document.getElementById('nivelUreaValue');
  if (ureaSlider) {
    ureaSlider.value = 50;
  }
  if (ureaOutput) {
    ureaOutput.textContent = ureaSlider ? `${ureaSlider.value}%` : '';
  }

  // Limpiar refacciones (inputs dentro de la sección)
  const refSection = document.getElementById('refaccionesSection');
  if (refSection) {
    refSection.querySelectorAll('input.form-control').forEach(inp => (inp.value = ''));
  }

  // Limpiar evidencias (file inputs)
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(fi => {
    try {
      fi.value = '';
    } catch (_) {
      // Ignorar error intencionalmente
    }
  });

  // Campos de seguimiento
  const fechaSig = document.getElementById('fechaSiguienteServicio');
  if (fechaSig) {
    fechaSig.value = '';
  }
  const estadoEco = document.getElementById('estadoeconomico');
  if (estadoEco) {
    estadoEco.value = '';
  }
  const kmSig = document.getElementById('kilometrajesiguienteservicio');
  if (kmSig) {
    kmSig.value = '';
  }

  showNotification('Formulario limpiado', 'info');
}

// Variable global para almacenar todos los mantenimientos filtrados
window._mantenimientosCompletos = [];

// Función para aplicar filtros
window.aplicarFiltrosMantenimiento = async function aplicarFiltrosMantenimiento() {
  const filtroEconomico = (document.getElementById('filtroEconomicoMantenimiento')?.value || '')
    .toLowerCase()
    .trim();
  const filtroResponsable = (document.getElementById('filtroResponsableMantenimiento')?.value || '')
    .toLowerCase()
    .trim();
  const filtroTipoServicio = (
    document.getElementById('filtroTipoServicioMantenimiento')?.value || ''
  )
    .toLowerCase()
    .trim();
  const filtroSKU = (document.getElementById('filtroSKUMantenimiento')?.value || '')
    .toLowerCase()
    .trim();
  const filtroNombrePiezas = (
    document.getElementById('filtroNombrePiezasMantenimiento')?.value || ''
  )
    .toLowerCase()
    .trim();

  // Obtener todos los mantenimientos
  const todosMantenimientos = await window.mantenimientoManager.getAllMantenimientos();

  // Aplicar filtros
  const mantenimientosFiltrados = todosMantenimientos.filter(mantenimiento => {
    // Filtro por económico
    const okEconomico =
      !filtroEconomico || (mantenimiento.economico || '').toLowerCase().includes(filtroEconomico);

    // Filtro por responsable
    const okResponsable =
      !filtroResponsable ||
      (mantenimiento.responsableTecnico || '').toLowerCase().includes(filtroResponsable);

    // Filtro por tipo de servicio
    const okTipoServicio =
      !filtroTipoServicio ||
      (mantenimiento.tipoMantenimiento || '').toLowerCase() === filtroTipoServicio;

    // Filtros por SKU y nombre de piezas (buscar en refacciones)
    let okSKU = !filtroSKU;
    let okNombrePiezas = !filtroNombrePiezas;

    if (filtroSKU || filtroNombrePiezas) {
      if (Array.isArray(mantenimiento.refacciones) && mantenimiento.refacciones.length > 0) {
        const tieneSKU = mantenimiento.refacciones.some(ref => {
          const codigo = (ref.codigo || ref.sku || '').toLowerCase();
          return codigo.includes(filtroSKU);
        });
        const tieneNombre = mantenimiento.refacciones.some(ref => {
          const descripcion = (ref.descripcion || ref.nombre || ref.refaccion || '').toLowerCase();
          return descripcion.includes(filtroNombrePiezas);
        });
        okSKU = !filtroSKU || tieneSKU;
        okNombrePiezas = !filtroNombrePiezas || tieneNombre;
      } else {
        // Si hay filtro de SKU o nombre pero no hay refacciones, no mostrar
        okSKU = !filtroSKU;
        okNombrePiezas = !filtroNombrePiezas;
      }
    }

    return okEconomico && okResponsable && okTipoServicio && okSKU && okNombrePiezas;
  });

  // Ordenar por fecha más reciente primero
  mantenimientosFiltrados.sort((a, b) => {
    const fechaA = new Date(a.fechaServicio || a.fecha || 0);
    const fechaB = new Date(b.fechaServicio || b.fecha || 0);
    return fechaB - fechaA;
  });

  // Guardar mantenimientos filtrados para paginación
  window._mantenimientosCompletos = mantenimientosFiltrados;

  // Reinicializar paginación con los resultados filtrados
  await renderizarMantenimientosPaginados();
};

// Función para limpiar filtros
window.limpiarFiltrosMantenimiento = function limpiarFiltrosMantenimiento() {
  document.getElementById('filtroEconomicoMantenimiento').value = '';
  document.getElementById('filtroResponsableMantenimiento').value = '';
  document.getElementById('filtroTipoServicioMantenimiento').value = '';
  document.getElementById('filtroSKUMantenimiento').value = '';
  document.getElementById('filtroNombrePiezasMantenimiento').value = '';
  aplicarFiltrosMantenimiento();
};

// Función para renderizar mantenimientos paginados
async function renderizarMantenimientosPaginados() {
  const tbody = document.getElementById('tablaMantenimientosBody');
  if (!tbody) {
    return;
  }

  // Verificar si PaginacionManager está disponible
  let PaginacionManagerClass = null;
  if (typeof window !== 'undefined' && window.PaginacionManager) {
    PaginacionManagerClass = window.PaginacionManager;
  } else if (typeof PaginacionManager !== 'undefined') {
    PaginacionManagerClass = PaginacionManager;
  }

  if (!PaginacionManagerClass) {
    console.warn(
      '⚠️ PaginacionManager no está disponible, mostrando todos los mantenimientos sin paginación'
    );
    renderizarMantenimientosDirectamente(window._mantenimientosCompletos);
    return;
  }

  // Inicializar o reutilizar el manager de paginación
  if (!window._paginacionMantenimientoManager) {
    try {
      window._paginacionMantenimientoManager = new PaginacionManagerClass();
      console.log('✅ Nueva instancia de PaginacionManager creada para Mantenimiento');
    } catch (error) {
      console.error('❌ Error creando instancia de PaginacionManager:', error);
      renderizarMantenimientosDirectamente(window._mantenimientosCompletos);
      return;
    }
  }

  try {
    // Inicializar paginación con los mantenimientos completos (no solo IDs)
    window._paginacionMantenimientoManager.inicializar(window._mantenimientosCompletos, 15);
    window._paginacionMantenimientoManager.paginaActual = 1;
    console.log(
      `✅ Paginación inicializada: ${window._paginacionMantenimientoManager.totalRegistros} mantenimientos, ${window._paginacionMantenimientoManager.obtenerTotalPaginas()} páginas`
    );

    // Renderizar mantenimientos de la página actual
    renderizarMantenimientosDirectamente();

    // Generar controles de paginación
    const contenedorPaginacion = document.getElementById('paginacionMantenimiento');
    if (contenedorPaginacion && window._paginacionMantenimientoManager) {
      contenedorPaginacion.innerHTML =
        window._paginacionMantenimientoManager.generarControlesPaginacion(
          'paginacionMantenimiento',
          'cambiarPaginaMantenimiento'
        );
    }
  } catch (error) {
    console.error('❌ Error inicializando paginación:', error);
    renderizarMantenimientosDirectamente(window._mantenimientosCompletos);
  }
}

// Función para renderizar mantenimientos directamente (con o sin paginación)
function renderizarMantenimientosDirectamente(mantenimientosParaRenderizar = null) {
  const tbody = document.getElementById('tablaMantenimientosBody');
  if (!tbody) {
    return;
  }

  let mantenimientos = mantenimientosParaRenderizar;

  // Si no se proporcionan mantenimientos, usar los de la página actual de la paginación
  if (!mantenimientos && window._paginacionMantenimientoManager) {
    mantenimientos = window._paginacionMantenimientoManager.obtenerRegistrosPagina();
  } else if (!mantenimientos) {
    mantenimientos = window._mantenimientosCompletos;
  }

  if (mantenimientos.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted">No hay registros de mantenimiento</td></tr>';
    return;
  }

  tbody.innerHTML = mantenimientos
    .map(mantenimiento => {
      // Formatear fecha sin problemas de zona horaria
      let fecha = 'N/A';
      const fechaStr = mantenimiento.fechaServicio || mantenimiento.fecha;
      if (fechaStr) {
        try {
          // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
          if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            const fechaStrClean = fechaStr.split('T')[0];
            const [year, month, day] = fechaStrClean.split('-');
            const fechaObj = new Date(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10)
            );
            fecha = fechaObj.toLocaleDateString('es-MX');
          } else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
            // Formato DD/MM/YYYY
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const año = parseInt(partes[2], 10);
              const fechaObj = new Date(año, mes, dia);
              fecha = fechaObj.toLocaleDateString('es-MX');
            } else {
              fecha = new Date(fechaStr).toLocaleDateString('es-MX');
            }
          } else {
            fecha = new Date(fechaStr).toLocaleDateString('es-MX');
          }
        } catch (e) {
          console.warn('⚠️ Error formateando fecha de mantenimiento:', fechaStr, e);
          fecha = String(fechaStr);
        }
      }

      const tipoMantenimiento = mantenimiento.tipoMantenimiento
        ? mantenimiento.tipoMantenimiento.charAt(0).toUpperCase() +
          mantenimiento.tipoMantenimiento.slice(1)
        : 'No especificado';

      return `
            <tr>
                <td>${mantenimiento.id}</td>
                <td>${fecha}</td>
                <td>${mantenimiento.economico || 'N/A'}</td>
                <td>${mantenimiento.placas || 'N/A'}</td>
                <td><span class="badge bg-info">${tipoMantenimiento}</span></td>
                <td>${mantenimiento.responsableTecnico || 'N/A'}</td>
                <td><span class="badge bg-${getEstadoBadgeColor(mantenimiento.estadoEconomico)}">${mantenimiento.estadoEconomico || 'N/A'}</span></td>
                <td>
                    <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetallesMantenimiento(${mantenimiento.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="editarMantenimiento(${mantenimiento.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="descargarPDFMantenimiento(${mantenimiento.id})" title="Descargar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarMantenimiento(${mantenimiento.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                    </div>
                </td>
            </tr>
        `;
    })
    .join('');
}

// Función global para cambiar página
window.cambiarPaginaMantenimiento = function (accion) {
  if (!window._paginacionMantenimientoManager) {
    return;
  }

  if (accion === 'anterior' && window._paginacionMantenimientoManager.paginaActual > 1) {
    window._paginacionMantenimientoManager.paginaActual--;
  } else if (
    accion === 'siguiente' &&
    window._paginacionMantenimientoManager.paginaActual <
      window._paginacionMantenimientoManager.obtenerTotalPaginas()
  ) {
    window._paginacionMantenimientoManager.paginaActual++;
  } else if (typeof accion === 'number') {
    window._paginacionMantenimientoManager.paginaActual = accion;
  }

  renderizarMantenimientosDirectamente();

  // Regenerar controles de paginación
  const contenedorPaginacion = document.getElementById('paginacionMantenimiento');
  if (contenedorPaginacion && window._paginacionMantenimientoManager) {
    contenedorPaginacion.innerHTML =
      window._paginacionMantenimientoManager.generarControlesPaginacion(
        'paginacionMantenimiento',
        'cambiarPaginaMantenimiento'
      );
  }
};

async function loadMantenimientosTable() {
  // Cargar todos los mantenimientos y aplicar filtros
  await aplicarFiltrosMantenimiento();
}

function getEstadoBadgeColor(estado) {
  switch (estado) {
    case 'operativo':
      return 'success';
    case 'enespera':
      return 'warning';
    case 'fueradeservicio':
      return 'danger';
    default:
      return 'secondary';
  }
}

async function _verDetallesMantenimiento(id) {
  console.log('🔍 Buscando mantenimiento con ID:', id, typeof id);

  // Convertir ID a número si es string
  const idNum = typeof id === 'string' ? parseInt(id, 10) : id;

  const mantenimiento = await window.mantenimientoManager.getMantenimiento(idNum);

  if (!mantenimiento) {
    console.error('❌ Mantenimiento no encontrado con ID:', idNum);
    // Intentar buscar como string también
    const mantenimientos = await window.mantenimientoManager.getMantenimientos();
    const mantenimientoAlt = mantenimientos.find(m => String(m.id) === String(id));
    if (mantenimientoAlt) {
      console.log('✅ Mantenimiento encontrado con búsqueda alternativa');
      mostrarDetallesMantenimiento(mantenimientoAlt, id);
      return;
    }
    showNotification('Mantenimiento no encontrado', 'error');
    return;
  }

  console.log('✅ Mantenimiento encontrado:', mantenimiento);
  mostrarDetallesMantenimiento(mantenimiento, id);
}

function mostrarDetallesMantenimiento(mantenimiento, id) {
  // Función auxiliar para formatear fechas
  function formatearFecha(fechaStr) {
    if (!fechaStr) {
      return 'N/A';
    }
    try {
      let fecha;
      // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
      if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
        const fechaStrClean = fechaStr.split('T')[0];
        const [year, month, day] = fechaStrClean.split('-');
        fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      } else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
        // Formato DD/MM/YYYY
        const partes = fechaStr.split('/');
        if (partes.length === 3) {
          const dia = parseInt(partes[0], 10);
          const mes = parseInt(partes[1], 10) - 1;
          const año = parseInt(partes[2], 10);
          fecha = new Date(año, mes, dia);
        } else {
          fecha = new Date(fechaStr);
        }
      } else {
        fecha = new Date(fechaStr);
      }

      if (isNaN(fecha.getTime())) {
        return 'N/A';
      }
      // Formatear como dd/mm/aaaa
      const day = String(fecha.getDate()).padStart(2, '0');
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const year = fecha.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.warn('⚠️ Error formateando fecha:', fechaStr, error);
      return 'N/A';
    }
  }

  // Función auxiliar para obtener valor o 'N/A'
  function obtenerValor(valor) {
    return valor !== undefined && valor !== null && valor !== '' ? valor : 'N/A';
  }

  // Función auxiliar para obtener color del badge según estado
  function getEstadoBadgeColor(estado) {
    if (!estado) {
      return 'secondary';
    }
    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case 'operativo':
      case 'disponible':
        return 'success';
      case 'en mantenimiento':
      case 'mantenimiento':
        return 'warning';
      case 'fuera de servicio':
      case 'inactivo':
        return 'danger';
      default:
        return 'info';
    }
  }

  // Crear modal de detalles
  const modalHtml = `
        <div class="modal fade" id="modalDetallesMantenimiento" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles del Mantenimiento #${id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Información Importante del Próximo Servicio -->
                        <div class="alert alert-info mb-4">
                            <h6 class="alert-heading mb-3"><i class="fas fa-calendar-check"></i> Información del Próximo Servicio</h6>
                            <div class="row">
                                <div class="col-md-4">
                                    <p class="mb-2"><strong>Fecha del siguiente Servicio:</strong></p>
                                    <p class="fs-5">${formatearFecha(mantenimiento.fechaSiguienteServicio)}</p>
                                </div>
                                <div class="col-md-4">
                                    <p class="mb-2"><strong>Estado del Económico:</strong></p>
                                    <p class="fs-5">
                                        <span class="badge bg-${getEstadoBadgeColor(mantenimiento.estadoEconomico)}">
                                            ${obtenerValor(mantenimiento.estadoEconomico)}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-md-4">
                                    <p class="mb-2"><strong>Kilometraje del siguiente Servicio:</strong></p>
                                    <p class="fs-5">${mantenimiento.kilometrajeSiguienteServicio ? `${mantenimiento.kilometrajeSiguienteServicio.toLocaleString('es-MX')} km` : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Información General</h6>
                                <p><strong>Fecha:</strong> ${formatearFecha(mantenimiento.fechaServicio)}</p>
                                <p><strong>Económico:</strong> ${obtenerValor(mantenimiento.economico)}</p>
                                <p><strong>Placas:</strong> ${obtenerValor(mantenimiento.placas)}</p>
                                <p><strong>Marca:</strong> ${obtenerValor(mantenimiento.marca)}</p>
                                <p><strong>Modelo:</strong> ${obtenerValor(mantenimiento.modelo)}</p>
                                <p><strong>Kilometraje:</strong> ${mantenimiento.kilometraje ? `${mantenimiento.kilometraje.toLocaleString('es-MX')} km` : 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Detalles del Servicio</h6>
                                <p><strong>Tipo:</strong> ${obtenerValor(mantenimiento.tipoMantenimiento)}</p>
                                <p><strong>Responsable:</strong> ${obtenerValor(mantenimiento.responsableTecnico)}</p>
                                <p><strong>Tiempo de Ejecución:</strong> ${obtenerValor(mantenimiento.tiempoEjecucion)}</p>
                                <p><strong>Nivel Combustible:</strong> ${mantenimiento.nivelCombustible !== undefined && mantenimiento.nivelCombustible !== null ? `${mantenimiento.nivelCombustible}%` : 'N/A'}</p>
                                <p><strong>Nivel Urea:</strong> ${mantenimiento.nivelUrea !== undefined && mantenimiento.nivelUrea !== null ? `${mantenimiento.nivelUrea}%` : 'N/A'}</p>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Descripción del Servicio</h6>
                                <p>${mantenimiento.descripcion || 'Sin descripción'}</p>
                            </div>
                        </div>
                        ${
  mantenimiento.refacciones &&
                          Array.isArray(mantenimiento.refacciones) &&
                          mantenimiento.refacciones.length > 0
    ? `
                        <div class="row mt-3">
                            <div class="col-12">
                                <h6>Refacciones Utilizadas</h6>
                                <ul>
                                    ${mantenimiento.refacciones
    .map(ref => {
      // Obtener el nombre/descripción de la refacción
      const nombreRefaccion =
                                          ref.descripcion || ref.refaccion || ref.nombre || 'N/A';
      const codigo = ref.codigo || ref.sku || '';
      const cantidad = ref.cantidad || 0;
      const unidad = ref.unidad || 'pza';
      return `<li>${codigo ? `[${codigo}] ` : ''}${nombreRefaccion} - ${cantidad} ${unidad}</li>`;
    })
    .join('')}
                                </ul>
                            </div>
                        </div>
                        `
    : ''
}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Remover modal existente si existe
  const existingModal = document.getElementById('modalDetallesMantenimiento');
  if (existingModal) {
    existingModal.remove();
  }

  // Agregar nuevo modal
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalDetallesMantenimiento'));
  modal.show();
}

// Función auxiliar para convertir fecha al formato yyyy-MM-dd
function convertirFechaAFormatoInput(fecha) {
  if (!fecha) {
    return '';
  }

  try {
    // Si ya está en formato yyyy-MM-dd, retornarlo directamente
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
      return fecha.split('T')[0]; // Tomar solo la parte de fecha si viene con hora
    }

    // Si es un objeto Date o string parseable, convertirlo
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      console.warn('⚠️ Fecha inválida:', fecha);
      return '';
    }

    // Formatear como yyyy-MM-dd
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('⚠️ Error convirtiendo fecha:', fecha, error);
    return '';
  }
}

async function editarMantenimiento(id) {
  console.log(`✏️ Editando mantenimiento: ${id}`);

  const mantenimiento = await window.mantenimientoManager.getMantenimiento(id);
  if (!mantenimiento) {
    showNotification('Mantenimiento no encontrado', 'error');
    return;
  }

  console.log('📝 Datos del mantenimiento a editar:', mantenimiento);

  // Cargar datos en el modal
  document.getElementById('editarMantenimiento_id').value = id;

  // Fecha de servicio
  const fechaFormateada = convertirFechaAFormatoInput(mantenimiento.fechaServicio);
  document.getElementById('editarMantenimiento_Fecha').value = fechaFormateada;
  console.log('📅 Fecha servicio:', mantenimiento.fechaServicio, '→', fechaFormateada);

  // Económico
  const economicoInput = document.getElementById('editarMantenimiento_economico');
  const economicoValue = document.getElementById('editarMantenimiento_economico_value');
  if (economicoInput && economicoValue) {
    const economicoNumero = mantenimiento.economico || '';
    economicoValue.value = economicoNumero;

    // Buscar el económico completo para mostrar el texto completo
    let economicoData = null;

    // PRIORIDAD 1: Buscar en ERPState cache
    if (window.ERPState && typeof window.ERPState.getCache === 'function') {
      const economicosCache = window.ERPState.getCache('economicos') || [];
      economicoData = economicosCache.find(
        e =>
          (e.numero && String(e.numero).trim() === String(economicoNumero).trim()) ||
          (e.economico && String(e.economico).trim() === String(economicoNumero).trim())
      );
    }

    // PRIORIDAD 2: Buscar en configuracionManager
    if (!economicoData && window.configuracionManager) {
      if (typeof window.configuracionManager.getEconomico === 'function') {
        economicoData = window.configuracionManager.getEconomico(economicoNumero);
      } else if (typeof window.configuracionManager.getAllEconomicos === 'function') {
        const allEconomicos = window.configuracionManager.getAllEconomicos() || [];
        economicoData = allEconomicos.find(
          e =>
            (e.numero && String(e.numero).trim() === String(economicoNumero).trim()) ||
            (e.economico && String(e.economico).trim() === String(economicoNumero).trim())
        );
      }
    }

    // PRIORIDAD 3: Buscar en caché global
    if (!economicoData && (window.__economicosCache || window._economicosCache)) {
      const cache = window.__economicosCache || window._economicosCache || [];
      economicoData = cache.find(
        e =>
          (e.numero && String(e.numero).trim() === String(economicoNumero).trim()) ||
          (e.economico && String(e.economico).trim() === String(economicoNumero).trim())
      );
    }

    if (economicoData) {
      const numero = economicoData.numero || economicoData.economico || economicoNumero;
      const placa = economicoData.placaTracto || economicoData.placa || '';
      const marca = economicoData.marca || '';
      const modelo = economicoData.modelo || '';

      let texto = numero;
      if (marca || modelo) {
        texto += ` - ${marca} ${modelo}`.trim();
      }
      if (placa) {
        texto += ` (${placa})`;
      }
      economicoInput.value = texto;

      // Guardar los datos del económico para que se usen al guardar
      window._editarMantenimientoEconomicoData = {
        numero: String(numero).trim(),
        placa: placa,
        marca: marca,
        modelo: modelo
      };
      console.log(
        '💾 Datos del económico guardados al cargar mantenimiento:',
        window._editarMantenimientoEconomicoData
      );
    } else {
      economicoInput.value = economicoNumero;
      // Limpiar datos guardados si no se encuentra el económico
      if (window._editarMantenimientoEconomicoData) {
        delete window._editarMantenimientoEconomicoData;
      }
    }
  }

  // Kilometraje
  document.getElementById('editarMantenimiento_kilometraje').value =
    mantenimiento.kilometraje || '';

  // Tipo de mantenimiento
  if (mantenimiento.tipoMantenimiento) {
    const tipoRadio = document.querySelector(
      `input[name="editarMantenimiento_tipo"][value="${mantenimiento.tipoMantenimiento}"]`
    );
    if (tipoRadio) {
      tipoRadio.checked = true;
    }
  }

  // Niveles
  const nivelCombustible =
    mantenimiento.nivelCombustible !== undefined && mantenimiento.nivelCombustible !== null
      ? mantenimiento.nivelCombustible
      : 50;
  document.getElementById('editarMantenimiento_nivelCombustible').value = nivelCombustible;
  document.getElementById('editarMantenimiento_nivelCombustibleValue').textContent =
    `${nivelCombustible}%`;

  const nivelUrea =
    mantenimiento.nivelUrea !== undefined && mantenimiento.nivelUrea !== null
      ? mantenimiento.nivelUrea
      : 50;
  document.getElementById('editarMantenimiento_nivelUrea').value = nivelUrea;
  document.getElementById('editarMantenimiento_nivelUreaValue').textContent = `${nivelUrea}%`;

  // Responsable y tiempo
  document.getElementById('editarMantenimiento_responsabletecnico').value =
    mantenimiento.responsableTecnico || '';
  document.getElementById('editarMantenimiento_tiempoejecucion').value =
    mantenimiento.tiempoEjecucion || '';
  document.getElementById('editarMantenimiento_subcontratacion').value =
    mantenimiento.subcontratacion || '';
  document.getElementById('editarMantenimiento_servicio').value = mantenimiento.servicio || '';
  document.getElementById('editarMantenimiento_descripcion').value =
    mantenimiento.descripcion || '';

  // Fecha siguiente servicio
  const fechaSiguienteFormateada = convertirFechaAFormatoInput(
    mantenimiento.fechaSiguienteServicio
  );
  document.getElementById('editarMantenimiento_fechaSiguienteServicio').value =
    fechaSiguienteFormateada;
  console.log(
    '📅 Fecha siguiente servicio:',
    mantenimiento.fechaSiguienteServicio,
    '→',
    fechaSiguienteFormateada
  );

  // Estado económico
  document.getElementById('editarMantenimiento_estadoeconomico').value =
    mantenimiento.estadoEconomico || '';

  // Kilometraje siguiente servicio
  document.getElementById('editarMantenimiento_kilometrajesiguienteservicio').value =
    mantenimiento.kilometrajeSiguienteServicio || '';

  // Cargar refacciones si existen
  if (
    mantenimiento.refacciones &&
    Array.isArray(mantenimiento.refacciones) &&
    mantenimiento.refacciones.length > 0
  ) {
    try {
      const contenedorRefacciones = document.getElementById(
        'editarMantenimiento_refaccionesAdicionales'
      );
      if (contenedorRefacciones) {
        contenedorRefacciones.innerHTML = ''; // Limpiar contenedor
      }

      // Resetear contador de refacciones
      if (typeof window !== 'undefined') {
        window.contadorRefaccionesEditar = 0;
      }

      console.log(`📦 Cargando ${mantenimiento.refacciones.length} refacciones en el modal...`);

      // Cargar refacciones después de que se muestre el modal
      const modalElement = document.getElementById('modalEditarMantenimiento');
      const cargarRefaccionesEnModal = function () {
        console.log(`📦 Iniciando carga de ${mantenimiento.refacciones.length} refacciones...`);

        // Función auxiliar para llenar una fila de refacción
        const llenarFilaRefaccion = function (numeroFila, ref) {
          const buscarInput = document.getElementById(
            `editarMantenimiento_refaccion_buscar_${numeroFila}`
          );
          const descInput = document.getElementById(
            `editarMantenimiento_refaccion_desc_${numeroFila}`
          );
          const almacenInput = document.getElementById(
            `editarMantenimiento_refaccion_almacen_${numeroFila}`
          );
          const stockInput = document.getElementById(
            `editarMantenimiento_refaccion_stock_${numeroFila}`
          );
          const unidadInput = document.getElementById(
            `editarMantenimiento_refaccion_unidad_${numeroFila}`
          );
          const cantidadInput = document.getElementById(
            `editarMantenimiento_refaccion_cantidad_${numeroFila}`
          );

          const codigo = ref.codigo || ref.sku || '';

          if (buscarInput) {
            buscarInput.value = codigo;
            buscarInput.dataset.codigo = codigo;
            buscarInput.dataset.almacen = ref.almacen || '';
          } else {
            console.warn(`⚠️ No se encontró buscarInput para fila ${numeroFila}`);
          }
          if (descInput) {
            descInput.value = ref.descripcion || '';
          }
          if (almacenInput) {
            almacenInput.value = ref.almacen || '';
          }
          if (stockInput) {
            stockInput.value = ref.stockDisponible || ref.stock || '';
          }
          if (unidadInput) {
            unidadInput.value = ref.unidad || 'piezas';
          }
          if (cantidadInput) {
            cantidadInput.value = ref.cantidad || '';
          }
          console.log(`✅ Refacción ${numeroFila} cargada:`, codigo);
        };

        // Cargar primera refacción en la fila existente
        if (mantenimiento.refacciones.length > 0) {
          setTimeout(() => {
            llenarFilaRefaccion(1, mantenimiento.refacciones[0]);
          }, 200);
        }

        // Cargar refacciones adicionales (a partir de la segunda)
        mantenimiento.refacciones.slice(1).forEach((ref, index) => {
          const numeroFila = index + 2; // +2 porque index empieza en 0 y ya procesamos la primera
          console.log(
            `📦 Preparando refacción ${numeroFila}/${mantenimiento.refacciones.length}:`,
            ref.codigo || ref.sku || 'sin código'
          );

          // Establecer el contador ANTES de agregar la fila
          // El contador debe ser numeroFila - 1 porque agregarFilaRefaccionEditar lo incrementa
          window.contadorRefaccionesEditar = numeroFila - 1;

          if (typeof window.agregarFilaRefaccionEditar === 'function') {
            // Agregar la fila con delay escalonado
            setTimeout(() => {
              window.agregarFilaRefaccionEditar();

              // Esperar a que se cree el DOM y luego llenar los datos
              setTimeout(() => {
                // Verificar que la fila existe antes de llenarla
                const fila = document.getElementById(
                  `editarMantenimiento_fila_refaccion_${numeroFila}`
                );
                if (fila) {
                  llenarFilaRefaccion(numeroFila, ref);
                } else {
                  console.error(`❌ No se encontró la fila ${numeroFila} después de crearla`);
                  // Reintentar después de un delay adicional
                  setTimeout(() => {
                    llenarFilaRefaccion(numeroFila, ref);
                  }, 300);
                }
              }, 300);
            }, 400 * index); // Delay escalonado: 0ms, 400ms, 800ms, etc.
          } else {
            console.error('❌ agregarFilaRefaccionEditar no está disponible');
          }
        });

        // Remover el listener después de usarlo
        if (modalElement) {
          modalElement.removeEventListener('shown.bs.modal', cargarRefaccionesEnModal);
        }
      };

      // Agregar listener para cuando el modal se muestre
      if (modalElement) {
        modalElement.addEventListener('shown.bs.modal', cargarRefaccionesEnModal, { once: true });
      } else {
        // Fallback: usar setTimeout si el modal no está disponible
        setTimeout(cargarRefaccionesEnModal, 500);
      }
    } catch (error) {
      console.error('Error cargando refacciones en modal:', error);
    }
  }

  // Mostrar el modal
  const modalElement = document.getElementById('modalEditarMantenimiento');
  if (!modalElement) {
    showNotification('Error: Modal de edición no encontrado', 'error');
    return;
  }

  const modal = new bootstrap.Modal(modalElement);
  modal.show();

  showNotification('Mantenimiento cargado para editar', 'success');
  console.log('✅ Mantenimiento cargado en modal para editar');
}

async function guardarMantenimientoEditado() {
  console.log('💾 Guardando cambios del mantenimiento editado...');

  // Función para activar estado de carga
  const activarEstadoCarga = () => {
    const modalElement = document.getElementById('modalEditarMantenimiento');
    if (!modalElement) {
      return;
    }

    const btnGuardar = modalElement.querySelector('[data-action="guardarMantenimientoEditado"]');
    const btnCancelar = modalElement.querySelector('button[data-bs-dismiss="modal"]');
    const form = document.getElementById('formEditarMantenimiento');
    const modalContent = modalElement.querySelector('.modal-content');

    // Guardar estados originales para restaurar después
    if (!modalElement._originalBtnGuardarHtml) {
      modalElement._originalBtnGuardarHtml = btnGuardar?.innerHTML || '';
    }

    // Deshabilitar botones
    if (btnGuardar) {
      btnGuardar.disabled = true;
      btnGuardar.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';
      btnGuardar.classList.add('disabled');
    }
    if (btnCancelar) {
      btnCancelar.disabled = true;
      btnCancelar.classList.add('disabled');
    }

    // Deshabilitar todos los inputs del formulario
    if (form) {
      const inputs = form.querySelectorAll('input, select, textarea, button');
      inputs.forEach(input => {
        if (!input.hasAttribute('data-keep-enabled')) {
          input.disabled = true;
        }
      });
    }

    // Crear overlay visual si no existe
    let overlay = modalElement.querySelector('.processing-overlay');
    if (!overlay && modalContent) {
      overlay = document.createElement('div');
      overlay.className = 'processing-overlay';
      overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1055;
                border-radius: 0.375rem;
            `;
      overlay.innerHTML = `
                <div style="text-align: center;">
                    <div class="spinner-border text-primary mb-2" role="status">
                        <span class="visually-hidden">Procesando...</span>
                    </div>
                    <div style="color: #495057; font-weight: 500;">Guardando cambios...</div>
                </div>
            `;
      modalContent.style.position = 'relative';
      modalContent.appendChild(overlay);
    }

    // Prevenir cierre del modal con ESC o clic fuera
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      // Guardar configuración original
      if (!modalElement._originalBackdrop) {
        modalElement._originalBackdrop = modalInstance._config.backdrop;
      }
      if (!modalElement._originalKeyboard) {
        modalElement._originalKeyboard = modalInstance._config.keyboard;
      }
      // Cambiar a modo estático
      modalInstance._config.backdrop = 'static';
      modalInstance._config.keyboard = false;
    }
  };

  // Función para desactivar estado de carga
  const desactivarEstadoCarga = () => {
    const modalElement = document.getElementById('modalEditarMantenimiento');
    if (!modalElement) {
      return;
    }

    const btnGuardar = modalElement.querySelector('[data-action="guardarMantenimientoEditado"]');
    const btnCancelar = modalElement.querySelector('button[data-bs-dismiss="modal"]');
    const form = document.getElementById('formEditarMantenimiento');

    // Rehabilitar botones
    if (btnGuardar) {
      btnGuardar.disabled = false;
      btnGuardar.innerHTML =
        modalElement._originalBtnGuardarHtml || '<i class="fas fa-save"></i> Guardar Cambios';
      btnGuardar.classList.remove('disabled');
    }
    if (btnCancelar) {
      btnCancelar.disabled = false;
      btnCancelar.classList.remove('disabled');
    }

    // Rehabilitar todos los inputs del formulario
    if (form) {
      const inputs = form.querySelectorAll('input, select, textarea, button');
      inputs.forEach(input => {
        input.disabled = false;
      });
    }

    // Remover overlay visual
    const overlay = modalElement.querySelector('.processing-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Restaurar comportamiento normal del modal
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      if (modalElement._originalBackdrop !== undefined) {
        modalInstance._config.backdrop = modalElement._originalBackdrop;
      }
      if (modalElement._originalKeyboard !== undefined) {
        modalInstance._config.keyboard = modalElement._originalKeyboard;
      }
    }
  };

  const form = document.getElementById('formEditarMantenimiento');
  if (!form) {
    showNotification('Error: Formulario no encontrado', 'error');
    return false;
  }

  // Validar formulario
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    showNotification('Por favor completa todos los campos requeridos', 'error');
    return false;
  }

  // Activar estado de carga
  activarEstadoCarga();

  // Asegurar que siempre se restaure el estado, incluso si hay errores
  let estadoRestaurado = false;
  const restaurarEstado = () => {
    if (!estadoRestaurado) {
      estadoRestaurado = true;
      desactivarEstadoCarga();
    }
  };

  try {
    const id = document.getElementById('editarMantenimiento_id').value;
    if (!id) {
      restaurarEstado();
      showNotification('Error: ID de mantenimiento no encontrado', 'error');
      return false;
    }

    // Obtener el número del económico desde el input searchable
    const obtenerNumeroEconomico = () => {
      const hiddenInput = document.getElementById('editarMantenimiento_economico_value');
      const visibleInput = document.getElementById('editarMantenimiento_economico');

      console.log('🔍 Obteniendo número de económico:', {
        hiddenInputExists: Boolean(hiddenInput),
        hiddenInputValue: hiddenInput?.value,
        visibleInputExists: Boolean(visibleInput),
        visibleInputValue: visibleInput?.value
      });

      if (hiddenInput && hiddenInput.value) {
        const numero = hiddenInput.value.trim();
        console.log('✅ Número obtenido del hidden input:', numero);
        return numero;
      }

      if (visibleInput && visibleInput.value) {
        const match = visibleInput.value.match(/^(\d+)/);
        if (match) {
          const numero = match[1];
          console.log('✅ Número extraído del input visible:', numero);
          return numero;
        }
        const numero = visibleInput.value.trim();
        console.log('✅ Valor completo del input visible:', numero);
        return numero;
      }

      console.warn('⚠️ No se pudo obtener el número de económico');
      return '';
    };

    // Función para obtener refacciones del modal de edición
    const obtenerRefaccionesEditadas = () => {
      const refacciones = [];

      // Buscar todas las filas de refacciones en el modal
      // Primero buscar la primera fila (que está en el HTML directamente)
      const primeraFila = document.getElementById('editarMantenimiento_fila_refaccion_1');
      if (primeraFila) {
        const buscarInput = document.getElementById('editarMantenimiento_refaccion_buscar_1');
        const cantidadInput = document.getElementById('editarMantenimiento_refaccion_cantidad_1');

        if (buscarInput && cantidadInput) {
          const codigo = buscarInput.dataset.codigo || buscarInput.value.trim();
          const cantidad = parseInt(cantidadInput.value, 10) || 0;

          if (codigo && cantidad > 0) {
            const descripcion =
              document.getElementById('editarMantenimiento_refaccion_desc_1')?.value || '';
            const almacen =
              buscarInput.dataset.almacen ||
              document.getElementById('editarMantenimiento_refaccion_almacen_1')?.value ||
              '';
            const stock = parseInt(
              document.getElementById('editarMantenimiento_refaccion_stock_1')?.value || 0,
              10
            );
            const unidad =
              document.getElementById('editarMantenimiento_refaccion_unidad_1')?.value || 'piezas';

            refacciones.push({
              codigo: codigo,
              descripcion: descripcion,
              cantidad: cantidad,
              almacen: almacen,
              stockDisponible: stock,
              unidad: unidad
            });
          }
        }
      }

      // Buscar filas adicionales en el contenedor
      const contenedor = document.getElementById('editarMantenimiento_refaccionesAdicionales');
      if (contenedor) {
        const filasAdicionales = contenedor.querySelectorAll(
          '[id^="editarMantenimiento_fila_refaccion_"]'
        );

        filasAdicionales.forEach(fila => {
          // Extraer el número de fila del ID
          const match = fila.id.match(/editarMantenimiento_fila_refaccion_(\d+)/);
          if (!match) {
            return;
          }

          const numeroFila = match[1];
          const buscarInput = document.getElementById(
            `editarMantenimiento_refaccion_buscar_${numeroFila}`
          );
          const cantidadInput = document.getElementById(
            `editarMantenimiento_refaccion_cantidad_${numeroFila}`
          );

          if (buscarInput && cantidadInput) {
            const codigo = buscarInput.dataset.codigo || buscarInput.value.trim();
            const cantidad = parseInt(cantidadInput.value, 10) || 0;

            if (codigo && cantidad > 0) {
              const descripcion =
                document.getElementById(`editarMantenimiento_refaccion_desc_${numeroFila}`)
                  ?.value || '';
              const almacen =
                buscarInput.dataset.almacen ||
                document.getElementById(`editarMantenimiento_refaccion_almacen_${numeroFila}`)
                  ?.value ||
                '';
              const stock = parseInt(
                document.getElementById(`editarMantenimiento_refaccion_stock_${numeroFila}`)
                  ?.value || 0,
                10
              );
              const unidad =
                document.getElementById(`editarMantenimiento_refaccion_unidad_${numeroFila}`)
                  ?.value || 'piezas';

              refacciones.push({
                codigo: codigo,
                descripcion: descripcion,
                cantidad: cantidad,
                almacen: almacen,
                stockDisponible: stock,
                unidad: unidad
              });
            }
          }
        });
      }

      console.log('📦 Refacciones obtenidas del modal de edición:', refacciones);
      return refacciones;
    };

    const economicoNumero = obtenerNumeroEconomico();

    console.log('🔍 Número de económico obtenido:', economicoNumero);
    console.log(
      '🔍 Hidden input value:',
      document.getElementById('editarMantenimiento_economico_value')?.value
    );
    console.log(
      '🔍 Visible input value:',
      document.getElementById('editarMantenimiento_economico')?.value
    );

    if (!economicoNumero || economicoNumero.trim() === '') {
      restaurarEstado();
      showNotification('Error: Debe seleccionar un económico válido', 'error');
      return false;
    }

    // Convertir ID a número si es string
    const mantenimientoId = isNaN(parseInt(id, 10)) ? id : parseInt(id, 10);

    // Obtener fecha formateada
    const fechaServicio = convertirFechaAFormatoInput(
      document.getElementById('editarMantenimiento_Fecha').value
    );
    const fechaSiguienteServicio = convertirFechaAFormatoInput(
      document.getElementById('editarMantenimiento_fechaSiguienteServicio').value
    );

    // Obtener refacciones editadas
    const refaccionesEditadas = obtenerRefaccionesEditadas();

    // Obtener datos del económico seleccionado (Placa, Marca, Modelo)
    let placa = '';
    let marca = '';
    let modelo = '';
    let economicoData = null;

    // PRIORIDAD 1: Intentar obtener desde los datos guardados cuando se seleccionó el económico
    if (window._editarMantenimientoEconomicoData) {
      // Comparar números como strings para evitar problemas de tipo
      const numeroGuardado = String(window._editarMantenimientoEconomicoData.numero || '').trim();
      const numeroBuscado = String(economicoNumero || '').trim();

      console.log('🔍 Comparando números de económico:', {
        numeroGuardado,
        numeroBuscado,
        coinciden: numeroGuardado === numeroBuscado,
        datosGuardados: window._editarMantenimientoEconomicoData
      });

      if (numeroGuardado === numeroBuscado) {
        placa = window._editarMantenimientoEconomicoData.placa || '';
        marca = window._editarMantenimientoEconomicoData.marca || '';
        modelo = window._editarMantenimientoEconomicoData.modelo || '';
        console.log('✅ Datos del económico obtenidos desde selección:', {
          numero: economicoNumero,
          placa,
          marca,
          modelo
        });
      } else {
        console.warn('⚠️ El número del económico guardado no coincide con el buscado:', {
          guardado: numeroGuardado,
          buscado: numeroBuscado
        });
      }
    }

    // PRIORIDAD 2: Si no hay datos guardados o no coinciden, buscar el económico en el caché
    if (!placa && !marca && !modelo && economicoNumero) {
      // Intentar desde ERPState cache (más actualizado)
      if (window.ERPState && typeof window.ERPState.getCache === 'function') {
        const economicosCache = window.ERPState.getCache('economicos') || [];
        economicoData = economicosCache.find(
          e =>
            (e.numero && e.numero.toString() === economicoNumero.toString()) ||
            (e.economico && e.economico.toString() === economicoNumero.toString()) ||
            (e.id && e.id.toString() === economicoNumero.toString())
        );

        if (economicoData) {
          placa = economicoData.placaTracto || economicoData.placa || '';
          marca = economicoData.marca || '';
          modelo = economicoData.modelo || '';
          console.log('📋 Datos del económico obtenidos desde ERPState cache:', {
            numero: economicoNumero,
            placa,
            marca,
            modelo
          });
        }
      }

      // PRIORIDAD 3: Intentar desde configuracionManager
      if (!economicoData && window.configuracionManager) {
        if (typeof window.configuracionManager.getEconomico === 'function') {
          economicoData = window.configuracionManager.getEconomico(economicoNumero);
        } else if (typeof window.configuracionManager.getAllEconomicos === 'function') {
          const allEconomicos = window.configuracionManager.getAllEconomicos() || [];
          economicoData = allEconomicos.find(
            e =>
              (e.numero && e.numero.toString() === economicoNumero.toString()) ||
              (e.economico && e.economico.toString() === economicoNumero.toString())
          );
        }

        if (economicoData) {
          placa = economicoData.placaTracto || economicoData.placa || '';
          marca = economicoData.marca || '';
          modelo = economicoData.modelo || '';
          console.log('📋 Datos del económico obtenidos desde configuracionManager:', {
            numero: economicoNumero,
            placa,
            marca,
            modelo
          });
        }
      }

      // PRIORIDAD 4: Intentar desde caché global
      if (!economicoData && (window.__economicosCache || window._economicosCache)) {
        const cache = window.__economicosCache || window._economicosCache || [];
        economicoData = cache.find(
          e =>
            (e.numero && e.numero.toString() === economicoNumero.toString()) ||
            (e.economico && e.economico.toString() === economicoNumero.toString())
        );

        if (economicoData) {
          placa = economicoData.placaTracto || economicoData.placa || '';
          marca = economicoData.marca || '';
          modelo = economicoData.modelo || '';
          console.log('📋 Datos del económico obtenidos desde caché global:', {
            numero: economicoNumero,
            placa,
            marca,
            modelo
          });
        }
      }

      // Si aún no se encontraron datos, mostrar advertencia
      if (!placa && !marca && !modelo) {
        console.warn('⚠️ No se pudieron obtener los datos del económico:', economicoNumero);
        console.warn('⚠️ Se guardará el mantenimiento con placa, marca y modelo vacíos');
      }
    }

    const mantenimientoActualizado = {
      id: mantenimientoId,
      fechaServicio: fechaServicio,
      economico: economicoNumero,
      placa: placa,
      marca: marca,
      modelo: modelo,
      kilometraje: parseInt(document.getElementById('editarMantenimiento_kilometraje').value, 10) || 0,
      tipoMantenimiento:
        document.querySelector('input[name="editarMantenimiento_tipo"]:checked')?.value || '',
      nivelCombustible:
        parseInt(document.getElementById('editarMantenimiento_nivelCombustible').value, 10) || 50,
      nivelUrea: parseInt(document.getElementById('editarMantenimiento_nivelUrea').value, 10) || 50,
      responsableTecnico:
        document.getElementById('editarMantenimiento_responsabletecnico').value || '',
      tiempoEjecucion: document.getElementById('editarMantenimiento_tiempoejecucion').value || '',
      subcontratacion: document.getElementById('editarMantenimiento_subcontratacion').value || '',
      servicio: document.getElementById('editarMantenimiento_servicio').value || '',
      descripcion: document.getElementById('editarMantenimiento_descripcion').value || '',
      fechaSiguienteServicio: fechaSiguienteServicio,
      estadoEconomico: document.getElementById('editarMantenimiento_estadoeconomico').value || '',
      kilometrajeSiguienteServicio:
        parseInt(
          document.getElementById('editarMantenimiento_kilometrajesiguienteservicio').value,
          10
        ) || 0,
      refacciones: refaccionesEditadas
    };

    console.log('📝 Datos del mantenimiento actualizado:', mantenimientoActualizado);
    console.log(
      '🆔 ID del mantenimiento a actualizar:',
      mantenimientoId,
      '(tipo:',
      typeof mantenimientoId,
      ')'
    );
    console.log('🚛 Económico a guardar:', economicoNumero, '(tipo:', typeof economicoNumero, ')');
    console.log('📋 Verificación de campos:', {
      economico: mantenimientoActualizado.economico,
      placa: mantenimientoActualizado.placa,
      marca: mantenimientoActualizado.marca,
      modelo: mantenimientoActualizado.modelo,
      fechaServicio: mantenimientoActualizado.fechaServicio,
      responsableTecnico: mantenimientoActualizado.responsableTecnico,
      refaccionesCount: mantenimientoActualizado.refacciones?.length || 0
    });

    // Validar datos críticos
    if (
      !mantenimientoActualizado.fechaServicio ||
      !mantenimientoActualizado.economico ||
      !mantenimientoActualizado.responsableTecnico
    ) {
      restaurarEstado();
      showNotification('Por favor completa todos los campos requeridos', 'error');
      return false;
    }

    console.log('💾 Actualizando mantenimiento...');
    const success = await window.mantenimientoManager.updateMantenimiento(
      mantenimientoId,
      mantenimientoActualizado
    );

    if (success) {
      console.log('✅ Mantenimiento actualizado exitosamente');

      // Restaurar estado antes de cerrar modal
      restaurarEstado();

      // Cerrar el modal
      const modal = bootstrap.Modal.getInstance(
        document.getElementById('modalEditarMantenimiento')
      );
      if (modal) {
        modal.hide();
      }

      // Actualizar tabla
      await loadMantenimientosTable();

      showNotification('Mantenimiento actualizado exitosamente', 'success');
      return true;
    }
    restaurarEstado();
    showNotification('Error al actualizar el mantenimiento', 'error');
    return false;
  } catch (error) {
    console.error('❌ Error actualizando mantenimiento:', error);
    restaurarEstado();
    showNotification(`Error al actualizar el mantenimiento: ${error.message}`, 'error');
    return false;
  } finally {
    // Asegurar que siempre se restaure el estado
    restaurarEstado();
  }
}

async function _eliminarMantenimiento(id) {
  if (confirm('¿Está seguro de que desea eliminar este registro de mantenimiento?')) {
    const success = await window.mantenimientoManager.deleteMantenimiento(id);
    if (success) {
      showNotification('Mantenimiento eliminado exitosamente', 'success');
      await loadMantenimientosTable();
    } else {
      showNotification('Error al eliminar el mantenimiento', 'error');
    }
  }
}

async function descargarPDFMantenimiento(id) {
  console.log(`📄 Descargando PDF del mantenimiento: ${id}`);

  const mantenimiento = await window.mantenimientoManager.getMantenimiento(id);

  if (!mantenimiento) {
    showNotification('Mantenimiento no encontrado', 'error');
    return;
  }

  try {
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
    const col1X = margin + 5;
    const col2X = pageWidth / 2 + 10;

    // Función auxiliar para formatear fechas
    function formatearFecha(fechaStr) {
      if (!fechaStr) {
        return 'N/A';
      }
      try {
        let fecha;
        // Si es formato YYYY-MM-DD, parsearlo directamente sin conversión de zona horaria
        if (typeof fechaStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
          const fechaStrClean = fechaStr.split('T')[0];
          const [year, month, day] = fechaStrClean.split('-');
          fecha = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        } else if (typeof fechaStr === 'string' && fechaStr.includes('/')) {
          // Formato DD/MM/YYYY
          const partes = fechaStr.split('/');
          if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10) - 1;
            const año = parseInt(partes[2], 10);
            fecha = new Date(año, mes, dia);
          } else {
            fecha = new Date(fechaStr);
          }
        } else {
          fecha = new Date(fechaStr);
        }

        if (isNaN(fecha.getTime())) {
          return 'N/A';
        }
        const day = String(fecha.getDate()).padStart(2, '0');
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const year = fecha.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (error) {
        return 'N/A';
      }
    }

    // Función auxiliar para obtener valor o 'N/A'
    function obtenerValor(valor) {
      return valor !== undefined && valor !== null && valor !== '' ? valor : 'N/A';
    }

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTRO DE MANTENIMIENTO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // ID del mantenimiento
    doc.setFontSize(12);
    doc.text(`ID: ${id}`, margin, yPosition);
    yPosition += 10;

    // Fecha de servicio
    const fechaServicio = formatearFecha(mantenimiento.fechaServicio);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Servicio: ${fechaServicio}`, margin, yPosition);
    yPosition += 15;

    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Información General del Vehículo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN DEL VEHÍCULO', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Guardar posición inicial para ambas columnas
    const startY = yPosition;
    let leftY = startY;
    let rightY = startY;

    // Columna izquierda
    doc.text(`Económico: ${obtenerValor(mantenimiento.economico)}`, col1X, leftY);
    leftY += 6;
    doc.text(`Placas: ${obtenerValor(mantenimiento.placas)}`, col1X, leftY);
    leftY += 6;
    doc.text(`Marca: ${obtenerValor(mantenimiento.marca)}`, col1X, leftY);
    leftY += 6;
    doc.text(`Modelo: ${obtenerValor(mantenimiento.modelo)}`, col1X, leftY);
    leftY += 6;
    doc.text(
      `Kilometraje: ${mantenimiento.kilometraje ? `${mantenimiento.kilometraje.toLocaleString('es-MX')} km` : 'N/A'}`,
      col1X,
      leftY
    );
    leftY += 6;

    // Columna derecha
    doc.text(
      `Tipo de Mantenimiento: ${obtenerValor(mantenimiento.tipoMantenimiento)}`,
      col2X,
      rightY
    );
    rightY += 6;
    doc.text(
      `Nivel Combustible: ${mantenimiento.nivelCombustible !== undefined && mantenimiento.nivelCombustible !== null ? `${mantenimiento.nivelCombustible}%` : 'N/A'}`,
      col2X,
      rightY
    );
    rightY += 6;
    doc.text(
      `Nivel Urea: ${mantenimiento.nivelUrea !== undefined && mantenimiento.nivelUrea !== null ? `${mantenimiento.nivelUrea}%` : 'N/A'}`,
      col2X,
      rightY
    );
    rightY += 6;
    doc.text(`Estado del Económico: ${obtenerValor(mantenimiento.estadoEconomico)}`, col2X, rightY);
    rightY += 6;

    // Usar la posición más baja de las dos columnas para continuar
    yPosition = Math.max(leftY, rightY) + 10;

    // Información del Servicio
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORMACIÓN DEL SERVICIO', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text(
      `Responsable Técnico: ${obtenerValor(mantenimiento.responsableTecnico)}`,
      margin,
      yPosition
    );
    yPosition += 6;
    doc.text(
      `Tiempo de Ejecución: ${obtenerValor(mantenimiento.tiempoEjecucion)}`,
      margin,
      yPosition
    );
    yPosition += 6;
    doc.text(`Subcontratación: ${obtenerValor(mantenimiento.subcontratacion)}`, margin, yPosition);
    yPosition += 6;
    doc.text(
      `Servicio Realizado: ${obtenerValor(mantenimiento.servicio || mantenimiento.descripcionServicio)}`,
      margin,
      yPosition
    );
    yPosition += 10;

    // Descripción del Servicio
    if (mantenimiento.descripcion) {
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción del Servicio:', margin, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const splitDescripcion = doc.splitTextToSize(
        mantenimiento.descripcion,
        pageWidth - 2 * margin
      );
      doc.text(splitDescripcion, margin, yPosition);
      yPosition += splitDescripcion.length * 5 + 5;
    }

    // Refacciones Utilizadas
    if (
      mantenimiento.refacciones &&
      Array.isArray(mantenimiento.refacciones) &&
      mantenimiento.refacciones.length > 0
    ) {
      // Verificar si necesitamos nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('REFACCIONES UTILIZADAS', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      mantenimiento.refacciones.forEach((ref, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }

        const codigo = ref.codigo || ref.sku || 'N/A';
        // Buscar el nombre en múltiples campos posibles (descripcion es el campo principal)
        const nombre = ref.descripcion || ref.refaccion || ref.nombre || ref.desc || 'N/A';
        const cantidad = ref.cantidad || 0;
        const unidad = ref.unidad || 'pza';

        doc.text(
          `${index + 1}. [${codigo}] ${nombre} - Cantidad: ${cantidad} ${unidad}`,
          margin,
          yPosition
        );
        yPosition += 6;
      });

      yPosition += 5;
    }

    // Información del Próximo Servicio
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PRÓXIMO SERVICIO', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const fechaSiguienteServicio = formatearFecha(mantenimiento.fechaSiguienteServicio);
    doc.text(`Fecha del Siguiente Servicio: ${fechaSiguienteServicio}`, margin, yPosition);
    yPosition += 6;
    doc.text(
      `Kilometraje del Siguiente Servicio: ${mantenimiento.kilometrajeSiguienteServicio ? `${mantenimiento.kilometrajeSiguienteServicio.toLocaleString('es-MX')} km` : 'N/A'}`,
      margin,
      yPosition
    );

    // Guardar PDF
    const nombreArchivo = `Mantenimiento_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);

    console.log(`✅ PDF generado exitosamente: ${nombreArchivo}`);
    showNotification('PDF del mantenimiento generado exitosamente', 'success');
  } catch (error) {
    console.error('❌ Error generando PDF del mantenimiento:', error);
    showNotification('Error al generar PDF del mantenimiento', 'error');
  }
}

function _prepareNewRegistration() {
  clearMantenimientoForm();
  showNotification('Preparando nuevo registro de mantenimiento', 'info');
}

function clearCurrentForm() {
  clearMantenimientoForm();
}

// Función para manejar el envío del formulario
function handleMantenimientoSubmit(event) {
  event.preventDefault();
  saveMantenimientoData();
}

// Sistema de manejo de eventos para elementos con data-action
function initMantenimientoEventHandlers() {
  // Mapeo de acciones a funciones
  const mantenimientoActions = {
    saveMantenimientoData: async function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('🖱️ Botón de guardar mantenimiento clickeado');

      // Si el botón es de tipo submit, también prevenir el submit del formulario
      if (e.target.type === 'submit' || e.target.closest('button[type="submit"]')) {
        const form = e.target.closest('form');
        if (form) {
          form.addEventListener(
            'submit',
            ev => {
              ev.preventDefault();
              ev.stopPropagation();
            },
            { once: true, capture: true }
          );
        }
      }

      if (typeof saveMantenimientoData === 'function') {
        await saveMantenimientoData();
      } else {
        console.error('❌ saveMantenimientoData no está disponible');
        alert(
          'Error: La función de guardar mantenimiento no está disponible. Por favor recarga la página.'
        );
      }
      return false;
    },
    clearCurrentForm: function (e) {
      e.preventDefault();
      if (typeof clearCurrentForm === 'function') {
        clearCurrentForm();
      } else if (typeof clearMantenimientoForm === 'function') {
        clearMantenimientoForm();
      }
    },
    aplicarFiltrosMantenimiento: function (_e) {
      if (typeof aplicarFiltrosMantenimiento === 'function') {
        aplicarFiltrosMantenimiento();
      }
    },
    limpiarFiltrosMantenimiento: function (_e) {
      if (typeof limpiarFiltrosMantenimiento === 'function') {
        limpiarFiltrosMantenimiento();
      }
    },
    exportarMantenimientoExcel: function (e) {
      e.preventDefault();
      if (typeof exportarMantenimientoExcel === 'function') {
        exportarMantenimientoExcel();
      }
    },
    agregarFilaRefaccion: function (e) {
      e.preventDefault();
      if (typeof agregarFilaRefaccion === 'function') {
        agregarFilaRefaccion();
      }
    },
    eliminarFilaRefaccion: function (e) {
      e.preventDefault();
      const indice =
        e.target.getAttribute('data-indice') ||
        e.target.closest('[data-indice]')?.getAttribute('data-indice');
      if (typeof eliminarFilaRefaccion === 'function' && indice) {
        eliminarFilaRefaccion(indice);
      }
    },
    agregarFilaRefaccionEditar: function (e) {
      e.preventDefault();
      if (typeof agregarFilaRefaccionEditar === 'function') {
        agregarFilaRefaccionEditar();
      }
    },
    eliminarFilaRefaccionEditar: function (e) {
      e.preventDefault();
      const indice =
        e.target.getAttribute('data-indice') ||
        e.target.closest('[data-indice]')?.getAttribute('data-indice');
      if (typeof eliminarFilaRefaccionEditar === 'function' && indice) {
        eliminarFilaRefaccionEditar(indice);
      }
    },
    guardarMantenimientoEditado: async function (e) {
      e.preventDefault();
      if (typeof guardarMantenimientoEditado === 'function') {
        await guardarMantenimientoEditado();
      }
    },
    validarCantidadRefaccion: function (e) {
      // Este es un input, no necesita preventDefault
      if (typeof validarCantidadRefaccion === 'function') {
        validarCantidadRefaccion(e);
      }
    },
    limpiarDatosRefacciones: function (e) {
      e.preventDefault();
      if (typeof limpiarDatosRefacciones === 'function') {
        limpiarDatosRefacciones();
      }
    }
  };

  // Agregar listeners a elementos con data-action
  document.querySelectorAll('[data-action]').forEach(element => {
    const action = element.getAttribute('data-action');

    if (mantenimientoActions[action]) {
      // Evitar duplicados
      if (!element.hasAttribute('data-handler-attached')) {
        // Determinar el tipo de evento según el tipo de elemento
        const tagName = element.tagName.toLowerCase();
        const inputType = element.type ? element.type.toLowerCase() : '';

        // Para inputs, selects y textareas usar 'change' o 'input', para botones usar 'click'
        let eventType = 'click';
        let handler = mantenimientoActions[action];

        if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
          // Para campos de texto, usar 'input' con debounce, para selects usar 'change'
          if (inputType === 'text' || inputType === 'number') {
            eventType = 'input';
            // Agregar debounce para campos de texto (evitar ejecutar en cada tecla)
            let timeout;
            const originalHandler = handler;
            handler = function (e) {
              clearTimeout(timeout);
              timeout = setTimeout(() => originalHandler(e), 500); // Esperar 500ms después de dejar de escribir
            };
          } else {
            eventType = 'change';
          }
        }

        // Agregar el listener
        element.addEventListener(eventType, handler);
        element.setAttribute('data-handler-attached', 'true');

        console.log(`✅ Handler de mantenimiento registrado: ${action} (${eventType})`);
      }
    }
  });

  console.log('✅ Event handlers de mantenimiento inicializados');
}

// Inicialización cuando se carga la página
// Usar múltiples métodos para asegurar que se ejecute
(function () {
  console.log('🔧 [mantenimiento.js] Script cargado, registrando listeners...');

  // Función de inicialización
  async function inicializarMantenimiento() {
    console.log('🔧 [mantenimiento.js] Módulo de Mantenimiento inicializando...');

    // Esperar a que el DOM esté completamente cargado
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verificar que el select existe
    const selectEconomico = document.getElementById('economico');
    if (!selectEconomico) {
      console.error('❌ [mantenimiento.js] Select de económicos no encontrado en el DOM');
    } else {
      console.log('✅ [mantenimiento.js] Select de económicos encontrado:', selectEconomico.id);
    }

    // Función para cargar económicos con múltiples intentos
    async function cargarEconomicosConReintentos() {
      let intentos = 0;
      const maxIntentos = 15;

      while (intentos < maxIntentos) {
        intentos++;

        // Verificar que el select existe
        const select = document.getElementById('economico');
        if (!select) {
          console.warn(
            `⚠️ [mantenimiento.js] Intento ${intentos}: Select no encontrado, esperando...`
          );
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // Verificar que la función existe
        if (typeof window.loadEconomicosMantenimiento !== 'function') {
          console.warn(
            `⚠️ [mantenimiento.js] Intento ${intentos}: Función no disponible, esperando...`
          );
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        // Intentar ejecutar la función
        try {
          console.log(
            `🔄 [mantenimiento.js] Intento ${intentos}: Ejecutando loadEconomicosMantenimiento...`
          );
          await window.loadEconomicosMantenimiento();
          console.log('✅ [mantenimiento.js] loadEconomicosMantenimiento completado exitosamente');
          return true;
        } catch (error) {
          console.error(`❌ [mantenimiento.js] Error en intento ${intentos}:`, error);
          console.error('Stack:', error.stack);
          if (intentos < maxIntentos) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      console.error(
        `❌ [mantenimiento.js] No se pudo cargar económicos después de ${maxIntentos} intentos`
      );
      return false;
    }

    // Cargar listas dinámicas
    setTimeout(async () => {
      // Cargar económicos
      await cargarEconomicosConReintentos();

      await loadMantenimientosTable();

      // Suscribirse a cambios en tiempo real de mantenimientos
      if (window.firebaseRepos && window.firebaseRepos.mantenimiento) {
        try {
          console.log('📡 Suscribiéndose a cambios en tiempo real de mantenimientos...');
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.mantenimiento.db || !window.firebaseRepos.mantenimiento.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 500));
            await window.firebaseRepos.mantenimiento.init();
          }

          window.firebaseRepos.mantenimiento.subscribe(async items => {
            const mantenimientos = items.filter(item => item.tipo === 'registro');

            // Si Firebase está completamente vacío, verificar y sincronizar localStorage
            // NO restaurar desde localStorage si se limpiaron los datos operativos o si Firebase está vacío y hay conexión
            const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
            const hayConexion = navigator.onLine;

            if (items.length === 0) {
              console.log(
                '📡 Firebase está vacío para mantenimiento. Verificando sincronización...'
              );

              // Verificar si Firebase está realmente vacío
              try {
                const repoMantenimiento = window.firebaseRepos.mantenimiento;
                if (repoMantenimiento && repoMantenimiento.db && repoMantenimiento.tenantId) {
                  const firebaseData = await repoMantenimiento.getAll();
                  const mantenimientosFirebaseVerificados = firebaseData.filter(
                    item => item.tipo === 'registro'
                  );

                  if (mantenimientosFirebaseVerificados.length === 0) {
                    const razon =
                      datosLimpios === 'true'
                        ? 'Datos operativos fueron limpiados (flag local)'
                        : hayConexion
                          ? 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)'
                          : 'Firebase está vacío (modo offline)';
                    console.log(
                      `✅ Firebase confirmado vacío. ${razon}. Sincronizando localStorage con Firebase (vacío).`
                    );
                    if (window.mantenimientoManager) {
                      window.mantenimientoManager.setMantenimientos([]);
                    }
                    console.log(
                      '🗑️ Firebase está vacío para mantenimiento. localStorage limpiado.'
                    );

                    // Recargar tabla
                    loadMantenimientosTable();
                    return;
                  }
                  console.log(
                    '⚠️ Firebase no está vacío, hay',
                    mantenimientosFirebaseVerificados.length,
                    'mantenimientos. Continuando con actualización normal.'
                  );
                  // Continuar con el flujo normal usando los datos verificados
                  const mantenimientosVerificados = mantenimientosFirebaseVerificados;
                  console.log(
                    '🔄 Actualización en tiempo real de mantenimientos:',
                    mantenimientosVerificados.length
                  );
                  if (window.mantenimientoManager) {
                    window.mantenimientoManager.setMantenimientos(mantenimientosVerificados);
                  }
                  loadMantenimientosTable();
                  return;
                }
              } catch (error) {
                console.warn('⚠️ Error verificando Firebase para mantenimiento:', error);
              }
            }

            // Verificar flag antes de actualizar
            if (datosLimpios === 'true' || (items.length === 0 && hayConexion)) {
              const razon =
                datosLimpios === 'true'
                  ? 'Datos operativos fueron limpiados (flag local)'
                  : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
              console.log(
                `⚠️ ${razon}. Usando solo Firebase (no se restaurará desde localStorage).`
              );
            }

            console.log(
              '🔄 Actualización en tiempo real de mantenimientos:',
              mantenimientos.length
            );
            // Actualizar localStorage
            if (window.mantenimientoManager) {
              window.mantenimientoManager.setMantenimientos(mantenimientos);
            }
            // Recargar tabla
            loadMantenimientosTable();
          });
          console.log('✅ Listener de mantenimientos activado');
        } catch (error) {
          console.error('❌ Error suscribiéndose a mantenimientos:', error);
        }
      }
    }, 500);

    // Configurar event listeners
    const economicoSelect = document.getElementById('economico');
    if (economicoSelect) {
      economicoSelect.addEventListener('change', loadPlacasMantenimiento);
    }

    const form = document.querySelector('.needs-validation');
    if (form) {
      form.addEventListener('submit', handleMantenimientoSubmit);
    }

    // Configurar sliders de nivel
    setupLevelSliders();

    // Sistema de manejo de eventos para elementos con data-action
    initMantenimientoEventHandlers();

    // Re-inicializar después de un delay para asegurar que todos los elementos estén en el DOM
    setTimeout(initMantenimientoEventHandlers, 500);
  }

  // Ejecutar inmediatamente si el DOM ya está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarMantenimiento);
  } else {
    // DOM ya está listo, ejecutar inmediatamente
    inicializarMantenimiento();
  }
})();

function setupLevelSliders() {
  // Configurar slider de combustible
  const combustibleSlider = document.getElementById('nivelCombustible');
  const combustibleOutput = document.getElementById('nivelCombustibleValue');

  if (combustibleSlider && combustibleOutput) {
    combustibleOutput.textContent = `${combustibleSlider.value}%`;
    combustibleSlider.addEventListener('input', function () {
      combustibleOutput.textContent = `${this.value}%`;
    });
  }

  // Configurar slider de urea
  const ureaSlider = document.getElementById('nivelUrea');
  const ureaOutput = document.getElementById('nivelUreaValue');

  if (ureaSlider && ureaOutput) {
    ureaOutput.textContent = `${ureaSlider.value}%`;
    ureaSlider.addEventListener('input', function () {
      ureaOutput.textContent = `${this.value}%`;
    });
  }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  document.body.appendChild(notification);

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Exponer funciones globalmente
window.descontarRefaccionesDeInventario = descontarRefaccionesDeInventario;
window.collectRefaccionesData = collectRefaccionesData;
window.descargarPDFMantenimiento = descargarPDFMantenimiento;
window.editarMantenimiento = editarMantenimiento;
window.guardarMantenimientoEditado = guardarMantenimientoEditado;

console.log('✅ MantenimientoManager inicializado');
console.log('✅ Funciones globales disponibles:');
console.log('  - window.loadEconomicosMantenimiento:', typeof window.loadEconomicosMantenimiento);
console.log(
  '  - window.refreshEconomicosListMantenimiento:',
  typeof window.refreshEconomicosListMantenimiento
);
console.log('  - window.mantenimientoManager:', typeof window.mantenimientoManager);
console.log('  - window.editarMantenimiento:', typeof window.editarMantenimiento);
console.log('  - window.guardarMantenimientoEditado:', typeof window.guardarMantenimientoEditado);
