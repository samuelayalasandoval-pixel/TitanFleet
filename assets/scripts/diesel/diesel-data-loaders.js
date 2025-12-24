/**
 * Módulo de Carga de Datos Diesel
 * Maneja la carga de económicos y operadores desde diferentes fuentes
 */

(function () {
  'use strict';

  /**
   * Carga lista de económicos desde Configuración
   */
  async function loadEconomicosDieselList() {
    console.log('🔄 Cargando económicos para Diesel...');
    let tractocamiones = [];

    try {
      const select = document.getElementById('economico');
      if (!select) {
        console.warn('⚠️ Select de económicos no encontrado');
        return;
      }

      // Limpiar dejando la primera opción
      const firstOption = select.firstElementChild;
      select.innerHTML = '';
      if (firstOption) {
        select.appendChild(firstOption);
      } else {
        select.innerHTML = '<option value="">Seleccione un económico...</option>';
      }

      // 1. PRIORIDAD: Intentar desde el caché de Firestore (más actual)
      if (
        window.ERPState &&
        window.ERPState.getCache('economicosAlt') &&
        Array.isArray(window.ERPState.getCache('economicosAlt')) &&
        window.ERPState.getCache('economicosAlt').length > 0
      ) {
        tractocamiones = window.ERPState.getCache('economicosAlt');
        console.log('✅ Tractocamiones cargados desde Firestore cache:', tractocamiones.length);
      }

      // 2. Intentar cargar desde configuracionManager usando getAllEconomicos
      if (tractocamiones.length === 0 && window.configuracionManager) {
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
      }

      // 3. Si no hay datos, intentar desde Firebase
      if (
        tractocamiones.length === 0 &&
        window.firebaseDb &&
        window.fs &&
        window.firebaseAuth?.currentUser
      ) {
        try {
          console.log('📊 Intentando cargar tractocamiones desde Firebase...');

          const tractocamionesDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'tractocamiones'
          );
          const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

          if (tractocamionesDoc.exists()) {
            const data = tractocamionesDoc.data();
            if (data.economicos && Array.isArray(data.economicos)) {
              tractocamiones = data.economicos;
              if (window.ERPState && typeof window.ERPState.setCache === 'function') {
                window.ERPState.setCache('economicosAlt', tractocamiones);
              }
              console.log(
                '✅ Tractocamiones cargados desde configuracion/tractocamiones:',
                tractocamiones.length
              );
            }
          }
        } catch (error) {
          console.warn('⚠️ Error cargando tractocamiones desde Firebase:', error);
        }
      }

      // 4. Fallback: Intentar desde DataPersistence
      if (
        tractocamiones.length === 0 &&
        window.DataPersistence &&
        typeof window.DataPersistence.getAllEconomicos === 'function'
      ) {
        try {
          tractocamiones = window.DataPersistence.getAllEconomicos() || [];
          console.log('✅ Tractocamiones cargados desde DataPersistence:', tractocamiones.length);
        } catch (error) {
          console.warn('⚠️ Error cargando tractocamiones desde DataPersistence:', error);
        }
      }

      // 5. Fallback final: Intentar desde localStorage directamente
      if (tractocamiones.length === 0) {
        try {
          const economicosData = localStorage.getItem('erp_economicos');
          if (economicosData) {
            const parsed = JSON.parse(economicosData);
            if (Array.isArray(parsed)) {
              tractocamiones = parsed;
            } else if (typeof parsed === 'object') {
              tractocamiones = Object.values(parsed);
            }
            console.log('✅ Tractocamiones cargados desde localStorage:', tractocamiones.length);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando tractocamiones desde localStorage:', error);
        }
      }

      if (tractocamiones.length === 0) {
        console.warn('⚠️ No hay tractocamiones registrados en el sistema');
      }

      console.log('📋 Total de tractocamiones encontrados:', tractocamiones.length);

      // Filtrar solo tractocamiones activos
      const tractocamionesActivos = tractocamiones.filter(
        tracto =>
          tracto &&
          tracto.numero &&
          tracto.estadoVehiculo !== 'inactivo' &&
          tracto.estadoVehiculo !== 'retirado'
      );

      console.log(`📋 Agregando ${tractocamionesActivos.length} tractocamiones activos al select`);

      // Agregar tractocamiones
      tractocamionesActivos.forEach(tracto => {
        const option = document.createElement('option');
        option.value = tracto.numero || tracto.id || tracto.economico;

        const economico = tracto.numero || tracto.economico || tracto.id || 'N/A';
        const placa = tracto.placaTracto || tracto.placa || '';
        const marca = tracto.marca || '';
        const modelo = tracto.modelo || '';

        let texto = economico;
        if (marca || modelo) {
          texto += ` - ${marca} ${modelo}`.trim();
        }
        if (placa) {
          texto += ` (${placa})`;
        }

        option.textContent = texto;
        select.appendChild(option);
      });

      console.log(`✅ Select actualizado con ${tractocamionesActivos.length} tractocamiones`);
    } catch (err) {
      console.error('❌ Error cargando económicos para Diesel:', err);
    }
  }

  /**
   * Carga operadores desde Configuración
   */
  async function loadOperadoresDieselList() {
    console.log('🔄 Cargando operadores para Diesel...');
    let operadores = [];

    try {
      const principal = document.getElementById('operadorprincipal');
      const secundario = document.getElementById('operadorsecundario');
      if (!principal || !secundario) {
        console.warn('⚠️ Selects de operadores no encontrados');
        return;
      }

      // Limpiar dejando placeholder
      const firstOptionPrincipal = principal.firstElementChild;
      principal.innerHTML = '';
      if (firstOptionPrincipal) {
        principal.appendChild(firstOptionPrincipal);
      } else {
        principal.innerHTML = '<option value="">Seleccione un operador...</option>';
      }

      const firstOptionSecundario = secundario.firstElementChild;
      secundario.innerHTML = '';
      if (firstOptionSecundario) {
        secundario.appendChild(firstOptionSecundario);
      } else {
        secundario.innerHTML = '<option value="">Seleccione un operador...</option>';
      }

      // PRIORIDAD: Intentar cargar desde configuracionManager
      if (window.configuracionManager) {
        if (typeof window.configuracionManager.getAllOperadores === 'function') {
          operadores = window.configuracionManager.getAllOperadores() || [];
          console.log('✅ Operadores cargados desde getAllOperadores:', operadores.length);
        } else if (typeof window.configuracionManager.getOperadores === 'function') {
          const operadoresData = window.configuracionManager.getOperadores();
          if (
            operadoresData &&
            typeof operadoresData === 'object' &&
            !Array.isArray(operadoresData)
          ) {
            operadores = Object.values(operadoresData);
          } else if (Array.isArray(operadoresData)) {
            operadores = operadoresData;
          }
          console.log('✅ Operadores cargados desde getOperadores:', operadores.length);
        }
      }

      // Si no hay operadores, intentar desde Firebase
      if (
        operadores.length === 0 &&
        window.firebaseDb &&
        window.fs &&
        window.firebaseAuth?.currentUser
      ) {
        try {
          console.log('📊 Intentando cargar operadores desde Firebase...');

          const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
          const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

          if (operadoresDoc.exists()) {
            const data = operadoresDoc.data();
            if (data.operadores && Array.isArray(data.operadores)) {
              operadores = data.operadores;
              console.log(
                '✅ Operadores cargados desde configuracion/operadores:',
                operadores.length
              );
            }
          }

          // Si no hay datos, intentar desde la colección operadores
          if (operadores.length === 0) {
            const operadoresRef = window.fs.collection(window.firebaseDb, 'operadores');
            const tenantId =
              window.firebaseAuth?.currentUser?.uid ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
            const querySnapshot = await window.fs.getDocs(
              window.fs.query(operadoresRef, window.fs.where('tenantId', '==', tenantId))
            );
            operadores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('✅ Operadores cargados desde colección operadores:', operadores.length);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando operadores desde Firebase:', error);
        }
      }

      // Fallback: usar datos locales
      if (operadores.length === 0 && window.operadoresManager) {
        operadores = window.operadoresManager.getOperadores() || [];
        console.log('✅ Operadores cargados desde operadoresManager:', operadores.length);
      }

      // Fallback final: intentar desde localStorage
      if (operadores.length === 0) {
        try {
          const operadoresData = localStorage.getItem('erp_operadores');
          if (operadoresData) {
            const parsed = JSON.parse(operadoresData);
            if (Array.isArray(parsed)) {
              operadores = parsed;
            } else if (typeof parsed === 'object') {
              operadores = Object.values(parsed);
            }
            console.log('✅ Operadores cargados desde localStorage:', operadores.length);
          }
        } catch (error) {
          console.warn('⚠️ Error cargando operadores desde localStorage:', error);
        }
      }

      console.log('📋 Total de operadores encontrados:', operadores.length);

      // Agregar operadores activos
      const operadoresActivos = operadores.filter(
        op => op && op.nombre && op.activo !== false && op.estado !== 'inactivo'
      );

      console.log(`📋 Agregando ${operadoresActivos.length} operadores activos a los selects`);

      operadoresActivos.forEach(operador => {
        const opt1 = document.createElement('option');
        opt1.value = operador.id || operador.nombre || operador.numeroLicencia;
        const nombre = operador.nombre || operador.nombreCompleto || 'Sin nombre';
        const licencia = operador.licencia || operador.numeroLicencia || 'Sin Licencia';
        opt1.textContent = `${nombre} - ${licencia}`;
        principal.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = operador.id || operador.nombre || operador.numeroLicencia;
        opt2.textContent = `${nombre} - ${licencia}`;
        secundario.appendChild(opt2);
      });

      console.log(`✅ Selects actualizados con ${operadoresActivos.length} operadores`);
    } catch (err) {
      console.error('❌ Error cargando operadores para Diesel:', err);
    }
  }

  /**
   * Carga datos del económico seleccionado y llena las placas automáticamente
   */
  async function loadEconomicoDieselData() {
    try {
      const hiddenInput = document.getElementById('economico_value');
      const inputVisible = document.getElementById('economico');
      let numero = '';

      if (hiddenInput && hiddenInput.value) {
        numero = hiddenInput.value;
      } else if (inputVisible && inputVisible.value) {
        const match = inputVisible.value.match(/^(\d+)/);
        if (match) {
          numero = match[1];
        }
      }

      if (!numero) {
        const placas = document.getElementById('Placas');
        if (placas) {
          placas.value = '';
        }
        return;
      }

      console.log('🔄 Cargando datos del económico:', numero);
      let economicoData = null;

      // 1. PRIORIDAD: Buscar en el caché de Firestore
      if (
        window.ERPState &&
        window.ERPState.getCache('economicosAlt') &&
        Array.isArray(window.ERPState.getCache('economicosAlt'))
      ) {
        economicoData = window.ERPState.getCache('economicosAlt').find(
          tracto =>
            (tracto.numero && tracto.numero.toString() === numero.toString()) ||
            (tracto.economico && tracto.economico.toString() === numero.toString()) ||
            (tracto.id && tracto.id.toString() === numero.toString())
        );
        if (economicoData) {
          console.log('✅ Económico encontrado en caché Firestore');
        }
      }

      // 2. Buscar en configuracionManager
      if (!economicoData && window.configuracionManager) {
        if (typeof window.configuracionManager.getEconomico === 'function') {
          economicoData = window.configuracionManager.getEconomico(numero);
          if (economicoData) {
            console.log('✅ Económico encontrado en configuracionManager');
          }
        }

        if (!economicoData && typeof window.configuracionManager.getAllEconomicos === 'function') {
          const economicos = window.configuracionManager.getAllEconomicos() || [];
          economicoData = economicos.find(
            eco =>
              (eco.numero && eco.numero.toString() === numero.toString()) ||
              (eco.economico && eco.economico.toString() === numero.toString())
          );
          if (economicoData) {
            console.log('✅ Económico encontrado en getAllEconomicos');
          }
        }
      }

      // 3. Buscar en Firebase
      if (!economicoData && window.firebaseDb && window.fs) {
        try {
          const tractocamionesDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'tractocamiones'
          );
          const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

          if (tractocamionesDoc.exists()) {
            const data = tractocamionesDoc.data();
            if (data.economicos && Array.isArray(data.economicos)) {
              economicoData = data.economicos.find(
                eco =>
                  (eco.numero && eco.numero.toString() === numero.toString()) ||
                  (eco.economico && eco.economico.toString() === numero.toString())
              );
              if (economicoData) {
                console.log('✅ Económico encontrado en configuracion/tractocamiones');
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error buscando económico en Firebase:', error);
        }
      }

      // 4. Fallback: buscar en localStorage
      if (!economicoData) {
        try {
          const economicosData = localStorage.getItem('erp_economicos');
          if (economicosData) {
            const parsed = JSON.parse(economicosData);
            const economicos = Array.isArray(parsed) ? parsed : Object.values(parsed);
            economicoData = economicos.find(
              eco =>
                (eco.numero && eco.numero.toString() === numero.toString()) ||
                (eco.economico && eco.economico.toString() === numero.toString())
            );
            if (economicoData) {
              console.log('✅ Económico encontrado en localStorage');
            }
          }
        } catch (error) {
          console.warn('⚠️ Error buscando económico en localStorage:', error);
        }
      }

      // Llenar placas si se encontró el económico
      if (economicoData) {
        const placas = document.getElementById('Placas');
        if (placas) {
          const placaTracto = economicoData.placaTracto || economicoData.placa || '';
          placas.value = placaTracto;
          console.log('✅ Placas llenadas automáticamente:', placaTracto);
        } else {
          console.warn('⚠️ Campo de placas no encontrado');
        }
      } else {
        console.warn('⚠️ Económico no encontrado:', numero);
        const placas = document.getElementById('Placas');
        if (placas) {
          placas.value = '';
        }
      }
    } catch (err) {
      console.error('❌ Error llenando placas para Diesel:', err);
    }
  }

  // Exponer funciones globalmente
  window.loadEconomicosDieselList = loadEconomicosDieselList;
  window.loadOperadoresDieselList = loadOperadoresDieselList;
  window.loadEconomicoDieselData = loadEconomicoDieselData;
  window.refreshEconomicosDieselList = () => loadEconomicosDieselList();
  window.refreshOperadoresDieselList = () => loadOperadoresDieselList();
  window.openConfiguracionEconomicos = () => window.open('configuracion.html#economicos', '_blank');
  window.openConfiguracionOperadores = () => window.open('configuracion.html#operadores', '_blank');

  console.log('✅ Módulo diesel-data-loaders.js cargado');
})();
