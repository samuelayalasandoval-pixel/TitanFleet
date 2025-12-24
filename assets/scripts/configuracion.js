class ConfiguracionManager {
  constructor() {
    this.economicosStorageKey = 'erp_economicos';
    this.operadoresStorageKey = 'erp_operadores';
    this.clientesStorageKey = 'erp_clientes';
    this.proveedoresStorageKey = 'erp_proveedores';
    this.cuentasBancariasStorageKey = 'erp_cuentas_bancarias';
    this.estanciasStorageKey = 'erp_estancias';
    this.almacenesStorageKey = 'erp_almacenes';
    this.usuariosStorageKey = 'erp_usuarios';
    this.initializeData();
  }

  initializeData() {
    if (!this.getEconomicos()) {
      this.setEconomicos([]);
    }
    if (!this.getOperadores()) {
      this.setOperadores([]);
    }
    if (!this.getClientes()) {
      this.setClientes([]);
    }
    if (!this.getProveedores()) {
      this.setProveedores([]);
    }
    if (!this.getCuentasBancarias()) {
      this.setCuentasBancarias([]);
    }
    if (!this.getEstancias()) {
      this.setEstancias([]);
    }
    if (!this.getAlmacenes()) {
      this.setAlmacenes([]);
    }
    if (!this.getUsuarios()) {
      this.setUsuarios([]);
    }
  }

  // === MÉTODOS PARA ECONÓMICOS ===

  getEconomicos() {
    try {
      const data = localStorage.getItem(this.economicosStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al obtener económicos:', error);
      return null;
    }
  }

  setEconomicos(economicos) {
    try {
      localStorage.setItem(this.economicosStorageKey, JSON.stringify(economicos));
      return true;
    } catch (error) {
      console.error('Error al guardar económicos:', error);
      return false;
    }
  }

  async saveEconomico(economico) {
    try {
      const economicos = this.getEconomicos() || [];

      // Verificar si ya existe un económico con el mismo número
      const existingIndex = economicos.findIndex(e => e.numero === economico.numero);

      let economicoData;
      if (existingIndex >= 0) {
        // Actualizar existente
        economicoData = {
          ...economico,
          fechaActualizacion: new Date().toISOString()
        };
        economicos[existingIndex] = economicoData;
      } else {
        // Agregar nuevo
        economicoData = {
          ...economico,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        economicos.push(economicoData);
      }

      // Guardar en Firebase (siempre, no solo para usuarios anónimos)
      if (window.firebaseDb && window.fs) {
        try {
          const tenantId =
            window.firebaseAuth?.currentUser?.uid || window.DEMO_CONFIG?.tenantId || 'demo_tenant';

          // PRIORIDAD 1: Guardar en configuracion/tractocamiones como documento (similar a operadores)
          try {
            console.log('💾 Guardando económico en configuracion/tractocamiones...');
            const tractocamionesDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'tractocamiones'
            );
            const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

            let economicosArray = [];
            if (tractocamionesDoc.exists()) {
              const data = tractocamionesDoc.data();
              economicosArray = data.economicos || [];
            }

            // Buscar si ya existe un económico con el mismo número
            const existingIndex = economicosArray.findIndex(e => e.numero === economicoData.numero);

            if (existingIndex >= 0) {
              // Actualizar existente
              economicosArray[existingIndex] = {
                ...economicoData,
                tenantId: tenantId
              };
              console.log(
                '🔄 Actualizando económico existente en configuracion/tractocamiones:',
                economicoData.numero
              );
            } else {
              // Agregar nuevo
              economicosArray.push({
                ...economicoData,
                tenantId: tenantId
              });
              console.log(
                '➕ Agregando nuevo económico en configuracion/tractocamiones:',
                economicoData.numero
              );
            }

            // Guardar el documento completo
            await window.fs.setDoc(
              tractocamionesDocRef,
              {
                economicos: economicosArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            // Actualizar caché global
            window.__economicosCache = economicosArray;

            console.log(
              '✅ Económico guardado en configuracion/tractocamiones:',
              economicoData.numero
            );
          } catch (error) {
            console.warn('⚠️ Error guardando en configuracion/tractocamiones:', error);
          }
        } catch (error) {
          console.warn('⚠️ Error guardando económico en Firebase:', error);
        }
      }

      return this.setEconomicos(economicos);
    } catch (error) {
      console.error('Error al guardar económico:', error);
      return false;
    }
  }

  getEconomico(numero) {
    const economicos = this.getEconomicos() || [];
    return economicos.find(e => e.numero === numero) || null;
  }

  async deleteEconomico(numero) {
    try {
      console.log(`🗑️ Eliminando tractocamión ${numero} de todas las ubicaciones...`);

      // 1. Eliminar de localStorage
      const economicos = this.getEconomicos() || [];
      const filteredEconomicos = Array.isArray(economicos)
        ? economicos.filter(e => String(e.numero) !== String(numero))
        : Object.values(economicos).filter(e => String(e.numero) !== String(numero));

      // Si era un objeto, convertirlo a array
      const economicosArray = Array.isArray(economicos) ? filteredEconomicos : filteredEconomicos;
      this.setEconomicos(economicosArray);
      console.log(`✅ Tractocamión ${numero} eliminado de localStorage`);

      // 2. Eliminar de Firebase configuracion/tractocamiones
      if (window.firebaseDb && window.fs) {
        try {
          const tenantId =
            window.firebaseAuth?.currentUser?.uid || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          const tractocamionesDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'tractocamiones'
          );
          const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

          if (tractocamionesDoc.exists()) {
            const data = tractocamionesDoc.data();
            const economicosArray = data.economicos || [];

            // Filtrar el tractocamión a eliminar
            const economicosFiltrados = economicosArray.filter(
              e => String(e.numero) !== String(numero)
            );

            // Guardar el documento actualizado
            await window.fs.setDoc(
              tractocamionesDocRef,
              {
                economicos: economicosFiltrados,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            // Actualizar caché global
            window.__economicosCache = economicosFiltrados;

            console.log(`✅ Tractocamión ${numero} eliminado de configuracion/tractocamiones`);
          }
        } catch (error) {
          console.warn('⚠️ Error eliminando de configuracion/tractocamiones:', error);
        }
      }

      // 4. Actualizar caché global si existe
      if (window.__economicosCache && Array.isArray(window.__economicosCache)) {
        const antes = window.__economicosCache.length;
        window.__economicosCache = window.__economicosCache.filter(
          e => String(e.numero) !== String(numero)
        );
        const despues = window.__economicosCache.length;
        console.log(`✅ Caché global actualizado (${antes} → ${despues})`);
      }

      // 5. Forzar recarga de todas las listas que usan económicos
      // Esto asegura que el 440 no aparezca en ningún dropdown
      setTimeout(() => {
        if (typeof window.loadEconomicos === 'function') {
          window.loadEconomicos();
        }
        if (typeof window.loadEconomicosTable === 'function') {
          window.loadEconomicosTable();
        }
        // Notificar a otros módulos que actualicen sus listas
        if (window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('economicosUpdated', { detail: { deleted: numero } })
          );
        }
      }, 100);

      console.log(`✅ Tractocamión ${numero} eliminado exitosamente de todas las ubicaciones`);
      return true;
    } catch (error) {
      console.error(`❌ Error al eliminar tractocamión ${numero}:`, error);
      return false;
    }
  }

  getAllEconomicos() {
    const economicosData = this.getEconomicos();

    // Si es null o undefined, retornar array vacío
    if (!economicosData) {
      return [];
    }

    // Si ya es un array, retornarlo directamente
    if (Array.isArray(economicosData)) {
      return economicosData;
    }

    // Si es un objeto, convertirlo a array
    if (typeof economicosData === 'object') {
      return Object.values(economicosData);
    }

    // Fallback: retornar array vacío
    return [];
  }

  // === MÉTODOS PARA OPERADORES ===

  getOperadores() {
    try {
      const data = localStorage.getItem(this.operadoresStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al obtener operadores:', error);
      return null;
    }
  }

  setOperadores(operadores) {
    try {
      localStorage.setItem(this.operadoresStorageKey, JSON.stringify(operadores));
      return true;
    } catch (error) {
      console.error('Error al guardar operadores:', error);
      return false;
    }
  }

  async saveOperador(operador) {
    try {
      const operadores = this.getOperadores() || [];

      // Generar RFC si no existe (usando licencia como base)
      if (!operador.rfc && operador.licencia) {
        operador.rfc = `OP-${operador.licencia}`;
      }

      // Verificar si ya existe un operador con la misma licencia
      const existingIndex = operadores.findIndex(o => o.licencia === operador.licencia);

      let operadorData;
      if (existingIndex >= 0) {
        // Actualizar existente
        operadorData = {
          ...operador,
          fechaActualizacion: new Date().toISOString()
        };
        operadores[existingIndex] = operadorData;
      } else {
        // Agregar nuevo
        operadorData = {
          ...operador,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        operadores.push(operadorData);
      }

      // Guardar en Firebase (siempre, no solo para usuarios anónimos)
      if (window.firebaseDb && window.fs) {
        try {
          const tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          console.log('🔑 TenantId para guardar operador:', tenantId);

          // PRIORIDAD 1: Guardar en configuracion/operadores como documento (similar a tractocamiones)
          try {
            console.log('💾 Guardando operador en configuracion/operadores...');
            const operadoresDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'operadores'
            );
            const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

            let operadoresArray = [];
            if (operadoresDoc.exists()) {
              const data = operadoresDoc.data();
              operadoresArray = data.operadores || [];
            }

            // Buscar si ya existe un operador con la misma licencia
            const existingIndex = operadoresArray.findIndex(
              o => o.licencia === operadorData.licencia
            );

            if (existingIndex >= 0) {
              // Actualizar existente
              operadoresArray[existingIndex] = {
                ...operadorData,
                tenantId: tenantId
              };
              console.log(
                '🔄 Actualizando operador existente en configuracion/operadores:',
                operadorData.nombre
              );
            } else {
              // Agregar nuevo
              operadoresArray.push({
                ...operadorData,
                tenantId: tenantId
              });
              console.log(
                '➕ Agregando nuevo operador en configuracion/operadores:',
                operadorData.nombre
              );
            }

            // Guardar el documento completo
            await window.fs.setDoc(
              operadoresDocRef,
              {
                operadores: operadoresArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            console.log('✅ Operador guardado en configuracion/operadores:', operadorData.nombre);
          } catch (error) {
            console.warn('⚠️ Error guardando en configuracion/operadores:', error);
          }

          // NO guardar en la colección operadores directamente - solo en configuracion/operadores
          // Esto asegura que todos los datos estén organizados dentro de configuracion
        } catch (error) {
          console.warn('⚠️ Error guardando operador en Firebase:', error);
        }
      }

      return this.setOperadores(operadores);
    } catch (error) {
      console.error('Error al guardar operador:', error);
      return false;
    }
  }

  getOperador(identificador) {
    const operadores = this.getOperadores() || [];
    // Buscar por RFC o por licencia
    return operadores.find(o => o.rfc === identificador || o.licencia === identificador) || null;
  }

  deleteOperador(identificador) {
    try {
      const operadores = this.getOperadores() || [];
      // Eliminar por RFC o por licencia
      const filteredOperadores = operadores.filter(
        o => o.rfc !== identificador && o.licencia !== identificador
      );
      return this.setOperadores(filteredOperadores);
    } catch (error) {
      console.error('Error al eliminar operador:', error);
      return false;
    }
  }

  getAllOperadores() {
    const operadoresData = this.getOperadores();

    // Si es null o undefined, retornar array vacío
    if (!operadoresData) {
      return [];
    }

    // Si ya es un array, retornarlo directamente
    if (Array.isArray(operadoresData)) {
      return operadoresData;
    }

    // Si es un objeto, convertirlo a array
    if (typeof operadoresData === 'object') {
      return Object.values(operadoresData);
    }

    // Fallback: retornar array vacío
    return [];
  }

  // === MÉTODOS PARA CLIENTES ===

  getClientes() {
    try {
      const data = localStorage.getItem(this.clientesStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      return null;
    }
  }

  setClientes(clientes) {
    try {
      localStorage.setItem(this.clientesStorageKey, JSON.stringify(clientes));
      return true;
    } catch (error) {
      console.error('Error al guardar clientes:', error);
      return false;
    }
  }

  async saveCliente(cliente) {
    try {
      const clientesData = this.getClientes();
      let clientes = [];

      // Si clientesData es un objeto, convertirlo a array
      if (clientesData && typeof clientesData === 'object' && !Array.isArray(clientesData)) {
        clientes = Object.values(clientesData);
      } else if (Array.isArray(clientesData)) {
        clientes = clientesData;
      }

      // Verificar si ya existe un cliente con el mismo RFC
      const existingIndex = clientes.findIndex(c => c.rfc === cliente.rfc);

      let clienteData;
      if (existingIndex >= 0) {
        // Actualizar existente
        clienteData = {
          ...cliente,
          fechaActualizacion: new Date().toISOString()
        };
        clientes[existingIndex] = clienteData;
      } else {
        // Agregar nuevo
        clienteData = {
          ...cliente,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        clientes.push(clienteData);
      }

      // Guardar en Firebase (siempre que Firebase esté disponible)
      if (window.firebaseDb && window.fs) {
        try {
          const tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';

          // PRIORIDAD 1: Guardar en configuracion/clientes como documento (similar a operadores y tractocamiones)
          try {
            console.log('💾 Guardando cliente en configuracion/clientes...');
            const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
            const clientesDoc = await window.fs.getDoc(clientesDocRef);

            let clientesArray = [];
            if (clientesDoc.exists()) {
              const data = clientesDoc.data();
              clientesArray = data.clientes || [];
            }

            // Buscar si ya existe un cliente con el mismo RFC
            const existingIndex = clientesArray.findIndex(c => c.rfc === clienteData.rfc);

            if (existingIndex >= 0) {
              // Actualizar existente
              clientesArray[existingIndex] = {
                ...clienteData,
                tenantId: tenantId
              };
              console.log(
                '🔄 Actualizando cliente existente en configuracion/clientes:',
                clienteData.nombre
              );
            } else {
              // Agregar nuevo
              clientesArray.push({
                ...clienteData,
                tenantId: tenantId
              });
              console.log(
                '➕ Agregando nuevo cliente en configuracion/clientes:',
                clienteData.nombre
              );
            }

            // Guardar el documento completo
            await window.fs.setDoc(
              clientesDocRef,
              {
                clientes: clientesArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            console.log('✅ Cliente guardado en configuracion/clientes:', clienteData.nombre);
          } catch (error) {
            console.warn('⚠️ Error guardando en configuracion/clientes:', error);
          }

          // NO guardar en la colección clientes directamente - solo en configuracion/clientes
          // Esto asegura que todos los clientes estén organizados dentro de configuracion
        } catch (error) {
          console.warn('⚠️ Error guardando cliente en Firebase:', error);
        }
      }

      return this.setClientes(clientes);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      return false;
    }
  }

  getCliente(rfc) {
    const clientesData = this.getClientes();
    let clientes = [];

    // Si clientesData es un objeto, convertirlo a array
    if (clientesData && typeof clientesData === 'object' && !Array.isArray(clientesData)) {
      clientes = Object.values(clientesData);
    } else if (Array.isArray(clientesData)) {
      clientes = clientesData;
    }

    return clientes.find(c => c.rfc === rfc) || null;
  }

  deleteCliente(rfc) {
    try {
      const clientesData = this.getClientes();
      let clientes = [];

      // Si clientesData es un objeto, convertirlo a array
      if (clientesData && typeof clientesData === 'object' && !Array.isArray(clientesData)) {
        clientes = Object.values(clientesData);
      } else if (Array.isArray(clientesData)) {
        clientes = clientesData;
      }

      const filteredClientes = clientes.filter(c => c.rfc !== rfc);
      return this.setClientes(filteredClientes);
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      return false;
    }
  }

  async getAllClientes() {
    let clientes = [];

    // PRIORIDAD 1: Cargar desde Firebase en configuracion/clientes (estructura nueva)
    if (window.firebaseDb && window.fs) {
      try {
        const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
        const clientesDoc = await window.fs.getDoc(clientesDocRef);

        if (clientesDoc.exists()) {
          const data = clientesDoc.data();
          if (data.clientes && Array.isArray(data.clientes)) {
            clientes = data.clientes;
            console.log('✅ getAllClientes desde configuracion/clientes:', clientes.length);
            // Sincronizar con localStorage
            this.setClientes(clientes);
            return clientes;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error en getAllClientes desde Firebase:', error);
      }
    }

    // PRIORIDAD 2: Fallback a localStorage
    const clientesData = this.getClientes();

    // Si clientesData es un objeto, convertirlo a array
    if (clientesData && typeof clientesData === 'object' && !Array.isArray(clientesData)) {
      clientes = Object.values(clientesData);
    } else if (Array.isArray(clientesData)) {
      clientes = clientesData;
    }

    return clientes;
  }

  // === MÉTODOS PARA PROVEEDORES ===

  getProveedores() {
    try {
      const data = localStorage.getItem(this.proveedoresStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return null;
    }
  }

  setProveedores(proveedores) {
    try {
      localStorage.setItem(this.proveedoresStorageKey, JSON.stringify(proveedores));
      return true;
    } catch (error) {
      console.error('Error al guardar proveedores:', error);
      return false;
    }
  }

  async saveProveedor(proveedor) {
    try {
      const proveedores = this.getProveedores() || [];

      // Verificar si ya existe un proveedor con el mismo RFC
      const existingIndex = proveedores.findIndex(p => p.rfc === proveedor.rfc);

      let proveedorData;
      if (existingIndex >= 0) {
        // Actualizar existente
        proveedorData = {
          ...proveedor,
          fechaActualizacion: new Date().toISOString()
        };
        proveedores[existingIndex] = proveedorData;
      } else {
        // Agregar nuevo
        proveedorData = {
          ...proveedor,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        proveedores.push(proveedorData);
      }

      // Guardar en Firebase PRIMERO (siempre que Firebase esté disponible)
      if (window.firebaseDb && window.fs) {
        try {
          // CRÍTICO: Obtener tenantId actual usando la función disponible
          let tenantId;
          if (typeof obtenerTenantIdActual === 'function') {
            tenantId =
              (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          } else if (typeof window.obtenerTenantIdActual === 'function') {
            tenantId =
              (await window.obtenerTenantIdActual()) ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
          } else {
            tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          }

          console.log('💾 Guardando proveedor en Firebase (configuracion/proveedores)...');
          console.log('🔑 TenantId:', tenantId);
          console.log('📋 Proveedor:', { nombre: proveedorData.nombre, rfc: proveedorData.rfc });

          const proveedoresDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'proveedores'
          );
          const proveedoresDoc = await window.fs.getDoc(proveedoresDocRef);

          let proveedoresArray = [];
          if (proveedoresDoc.exists()) {
            const data = proveedoresDoc.data();
            proveedoresArray = data.proveedores || [];
            console.log(`📊 Proveedores existentes en Firebase: ${proveedoresArray.length}`);
          } else {
            console.log('📝 Creando nuevo documento configuracion/proveedores');
          }

          // Buscar si ya existe un proveedor con el mismo RFC
          const existingIndex = proveedoresArray.findIndex(p => p.rfc === proveedorData.rfc);

          if (existingIndex >= 0) {
            // Actualizar existente
            proveedoresArray[existingIndex] = {
              ...proveedorData,
              tenantId: tenantId
            };
            console.log('🔄 Actualizando proveedor existente en Firebase:', proveedorData.nombre);
          } else {
            // Agregar nuevo
            proveedoresArray.push({
              ...proveedorData,
              tenantId: tenantId
            });
            console.log('➕ Agregando nuevo proveedor en Firebase:', proveedorData.nombre);
          }

          // Guardar el documento completo en Firebase
          await window.fs.setDoc(
            proveedoresDocRef,
            {
              proveedores: proveedoresArray,
              tenantId: tenantId,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );

          console.log(`✅ Proveedor guardado en Firebase. Total: ${proveedoresArray.length}`);

          // Verificar que se guardó correctamente
          const verifyDoc = await window.fs.getDoc(proveedoresDocRef);
          if (verifyDoc.exists()) {
            const verifyData = verifyDoc.data();
            console.log(
              `✅ Verificación: ${verifyData.proveedores?.length || 0} proveedores en Firebase después de guardar`
            );
          } else {
            console.error('❌ ERROR: El documento no existe después de guardar');
          }

          // Sincronizar localStorage con los datos de Firebase (usar el array de Firebase)
          proveedores = proveedoresArray;
        } catch (error) {
          console.error('❌ Error guardando proveedor en Firebase:', error);
          console.error('Stack trace:', error.stack);
          // Continuar guardando en localStorage aunque falle Firebase
        }
      }

      // Guardar en localStorage (sincronizado con Firebase si se guardó correctamente)
      return this.setProveedores(proveedores);
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      return false;
    }
  }

  getProveedor(rfc) {
    const proveedores = this.getProveedores() || [];
    return proveedores.find(p => p.rfc === rfc) || null;
  }

  deleteProveedor(rfc) {
    try {
      const proveedores = this.getProveedores() || [];
      const filteredProveedores = proveedores.filter(p => p.rfc !== rfc);
      return this.setProveedores(filteredProveedores);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      return false;
    }
  }

  getProveedoresList() {
    try {
      const proveedores = this.getProveedores() || [];
      return proveedores.map(p => ({
        rfc: p.rfc,
        nombre: p.nombre,
        email: p.email,
        telefono: p.telefono
      }));
    } catch (error) {
      console.error('Error al obtener lista de proveedores:', error);
      return [];
    }
  }

  // === MÉTODOS PARA CUENTAS BANCARIAS ===
  getCuentasBancarias() {
    try {
      const data = localStorage.getItem(this.cuentasBancariasStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error al obtener cuentas bancarias:', e);
      return null;
    }
  }

  setCuentasBancarias(cuentasBancarias) {
    try {
      localStorage.setItem(this.cuentasBancariasStorageKey, JSON.stringify(cuentasBancarias));
      return true;
    } catch (e) {
      console.error('Error al guardar cuentas bancarias:', e);
      return false;
    }
  }

  async saveCuentaBancaria(cuentaBancaria) {
    try {
      const cuentasBancarias = this.getCuentasBancarias() || [];
      const key = cuentaBancaria.numeroCuenta || '';
      const idx = cuentasBancarias.findIndex(c => c.numeroCuenta === key);
      const base = {
        ...cuentaBancaria,
        id: cuentaBancaria.id || Date.now()
      };

      let cuentaBancariaData;
      if (idx >= 0) {
        cuentaBancariaData = {
          ...cuentasBancarias[idx],
          ...base,
          fechaActualizacion: new Date().toISOString()
        };
        cuentasBancarias[idx] = cuentaBancariaData;
      } else {
        cuentaBancariaData = {
          ...base,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        cuentasBancarias.push(cuentaBancariaData);
      }

      // Guardar en Firebase
      if (window.firebaseDb && window.fs) {
        try {
          // CRÍTICO: Obtener tenantId actual usando la función disponible
          let tenantId;
          if (typeof obtenerTenantIdActual === 'function') {
            tenantId =
              (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          } else if (typeof window.obtenerTenantIdActual === 'function') {
            tenantId =
              (await window.obtenerTenantIdActual()) ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
          } else {
            tenantId =
              window.DEMO_CONFIG?.tenantId || localStorage.getItem('tenantId') || 'demo_tenant';
          }

          console.log('🔑 TenantId a asignar a la cuenta bancaria:', tenantId);

          try {
            console.log('💾 Guardando cuenta bancaria en configuracion/cuentas_bancarias...');
            const cuentasBancariasDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'cuentas_bancarias'
            );
            const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

            let cuentasBancariasArray = [];
            if (cuentasBancariasDoc.exists()) {
              const data = cuentasBancariasDoc.data();
              cuentasBancariasArray = data.cuentasBancarias || [];
            }

            const existingIndex = cuentasBancariasArray.findIndex(
              c => c.numeroCuenta === cuentaBancariaData.numeroCuenta
            );

            if (existingIndex >= 0) {
              cuentasBancariasArray[existingIndex] = {
                ...cuentaBancariaData,
                tenantId: tenantId
              };
              console.log(
                '🔄 Actualizando cuenta bancaria existente:',
                cuentaBancariaData.numeroCuenta
              );
            } else {
              cuentasBancariasArray.push({
                ...cuentaBancariaData,
                tenantId: tenantId
              });
              console.log('➕ Agregando nueva cuenta bancaria:', cuentaBancariaData.numeroCuenta);
            }

            await window.fs.setDoc(
              cuentasBancariasDocRef,
              {
                cuentasBancarias: cuentasBancariasArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            console.log('✅ Cuenta bancaria guardada en configuracion/cuentas_bancarias');
          } catch (error) {
            console.warn('⚠️ Error guardando en configuracion/cuentas_bancarias:', error);
          }
        } catch (error) {
          console.warn('⚠️ Error en Firebase para cuenta bancaria:', error);
        }
      }

      this.setCuentasBancarias(cuentasBancarias);
      return true;
    } catch (e) {
      console.error('Error al guardar cuenta bancaria:', e);
      return false;
    }
  }

  deleteCuentaBancaria(numeroCuenta) {
    try {
      const cuentasBancarias = this.getCuentasBancarias() || [];
      const filtered = cuentasBancarias.filter(c => c.numeroCuenta !== numeroCuenta);
      this.setCuentasBancarias(filtered);

      // Eliminar de Firebase
      if (window.firebaseDb && window.fs) {
        (async () => {
          try {
            // CRÍTICO: Obtener tenantId actual usando la función disponible
            let tenantId;
            if (typeof obtenerTenantIdActual === 'function') {
              tenantId =
                (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            } else if (typeof window.obtenerTenantIdActual === 'function') {
              tenantId =
                (await window.obtenerTenantIdActual()) ||
                window.DEMO_CONFIG?.tenantId ||
                'demo_tenant';
            } else {
              tenantId =
                window.DEMO_CONFIG?.tenantId || localStorage.getItem('tenantId') || 'demo_tenant';
            }

            const cuentasBancariasDocRef = window.fs.doc(
              window.firebaseDb,
              'configuracion',
              'cuentas_bancarias'
            );
            const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

            if (cuentasBancariasDoc.exists()) {
              const data = cuentasBancariasDoc.data();
              let cuentasBancariasArray = data.cuentasBancarias || [];
              cuentasBancariasArray = cuentasBancariasArray.filter(
                c => c.numeroCuenta !== numeroCuenta
              );

              await window.fs.setDoc(
                cuentasBancariasDocRef,
                {
                  cuentasBancarias: cuentasBancariasArray,
                  tenantId: tenantId,
                  updatedAt: new Date().toISOString()
                },
                { merge: true }
              );

              console.log('✅ Cuenta bancaria eliminada de Firebase');
            }
          } catch (error) {
            console.warn('⚠️ Error eliminando cuenta bancaria de Firebase:', error);
          }
        })();
      }

      return true;
    } catch (e) {
      console.error('Error al eliminar cuenta bancaria:', e);
      return false;
    }
  }

  getCuentaBancaria(numeroCuenta) {
    try {
      const cuentasBancarias = this.getCuentasBancarias() || [];
      return cuentasBancarias.find(c => c.numeroCuenta === numeroCuenta) || null;
    } catch (e) {
      console.error('Error al obtener cuenta bancaria:', e);
      return null;
    }
  }

  // === MÉTODOS PARA ESTANCIAS ===
  getEstancias() {
    try {
      const data = localStorage.getItem(this.estanciasStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error al obtener estancias:', e);
      return null;
    }
  }
  setEstancias(estancias) {
    try {
      localStorage.setItem(this.estanciasStorageKey, JSON.stringify(estancias));
      return true;
    } catch (e) {
      console.error('Error al guardar estancias:', e);
      return false;
    }
  }
  async saveEstancia(estancia) {
    try {
      const estancias = this.getEstancias() || [];
      const key = (estancia.codigo || estancia.nombre || '').toLowerCase();
      const idx = estancias.findIndex(e => (e.codigo || e.nombre || '').toLowerCase() === key);
      const base = {
        ...estancia,
        id: estancia.id || Date.now()
      };

      let estanciaData;
      if (idx >= 0) {
        estanciaData = { ...estancias[idx], ...base, fechaActualizacion: new Date().toISOString() };
        estancias[idx] = estanciaData;
      } else {
        estanciaData = {
          ...base,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        estancias.push(estanciaData);
      }

      // Guardar en Firebase (siempre, no solo para usuarios anónimos)
      if (window.firebaseDb && window.fs) {
        try {
          // CRÍTICO: Obtener tenantId actual usando la función disponible
          let tenantId;
          if (typeof obtenerTenantIdActual === 'function') {
            tenantId =
              (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          } else if (typeof window.obtenerTenantIdActual === 'function') {
            tenantId =
              (await window.obtenerTenantIdActual()) ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
          } else {
            tenantId =
              window.DEMO_CONFIG?.tenantId || localStorage.getItem('tenantId') || 'demo_tenant';
          }

          console.log('🔑 TenantId a asignar a la estancia:', tenantId);

          // PRIORIDAD 1: Guardar en configuracion/estancias como documento
          try {
            console.log('💾 Guardando estancia en configuracion/estancias...');
            const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
            const estanciasDoc = await window.fs.getDoc(estanciasDocRef);

            let estanciasArray = [];
            if (estanciasDoc.exists()) {
              const data = estanciasDoc.data();
              estanciasArray = data.estancias || [];
            }

            // Buscar si ya existe una estancia con el mismo código o nombre
            const identificador = estanciaData.codigo || estanciaData.nombre;
            const existingIndex = estanciasArray.findIndex(
              e =>
                (e.codigo && e.codigo === identificador) || (e.nombre && e.nombre === identificador)
            );

            if (existingIndex >= 0) {
              // Actualizar existente
              estanciasArray[existingIndex] = {
                ...estanciaData,
                tenantId: tenantId
              };
              console.log(
                '🔄 Actualizando estancia existente en configuracion/estancias:',
                estanciaData.nombre
              );
            } else {
              // Agregar nueva
              estanciasArray.push({
                ...estanciaData,
                tenantId: tenantId
              });
              console.log(
                '➕ Agregando nueva estancia en configuracion/estancias:',
                estanciaData.nombre
              );
            }

            // Guardar el documento completo
            await window.fs.setDoc(
              estanciasDocRef,
              {
                estancias: estanciasArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            console.log('✅ Estancia guardada en configuracion/estancias:', estanciaData.nombre);
          } catch (error) {
            console.warn('⚠️ Error guardando en configuracion/estancias:', error);
          }

          // NO guardar en la colección estancias directamente - solo en configuracion/estancias
          // Esto asegura que todos los datos estén organizados dentro de configuracion
        } catch (error) {
          console.warn('⚠️ Error guardando estancia en Firebase:', error);
        }
      }

      return this.setEstancias(estancias);
    } catch (e) {
      console.error('Error al guardar estancia:', e);
      return false;
    }
  }
  deleteEstancia(idOrCode) {
    try {
      const estancias = this.getEstancias() || [];
      const filtered = estancias.filter(e => e.id !== idOrCode && e.codigo !== idOrCode);
      return this.setEstancias(filtered);
    } catch (e) {
      console.error('Error al eliminar estancia:', e);
      return false;
    }
  }

  // === MÉTODOS PARA ALMACENES ===
  getAlmacenes() {
    try {
      const data = localStorage.getItem(this.almacenesStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error al obtener almacenes:', e);
      return null;
    }
  }
  setAlmacenes(almacenes) {
    try {
      localStorage.setItem(this.almacenesStorageKey, JSON.stringify(almacenes));
      return true;
    } catch (e) {
      console.error('Error al guardar almacenes:', e);
      return false;
    }
  }
  async saveAlmacen(almacen) {
    try {
      const almacenes = this.getAlmacenes() || [];
      const key = (almacen.codigo || almacen.nombre || '').toLowerCase();
      const idx = almacenes.findIndex(a => (a.codigo || a.nombre || '').toLowerCase() === key);
      const base = { ...almacen, id: almacen.id || Date.now() };

      let almacenData;
      if (idx >= 0) {
        almacenData = { ...almacenes[idx], ...base, fechaActualizacion: new Date().toISOString() };
        almacenes[idx] = almacenData;
      } else {
        almacenData = {
          ...base,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        };
        almacenes.push(almacenData);
      }

      // Guardar en Firebase (siempre, no solo para usuarios anónimos)
      if (window.firebaseDb && window.fs) {
        try {
          // CRÍTICO: Obtener tenantId actual usando la función disponible
          let tenantId;
          if (typeof obtenerTenantIdActual === 'function') {
            tenantId =
              (await obtenerTenantIdActual()) || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          } else if (typeof window.obtenerTenantIdActual === 'function') {
            tenantId =
              (await window.obtenerTenantIdActual()) ||
              window.DEMO_CONFIG?.tenantId ||
              'demo_tenant';
          } else {
            tenantId =
              window.DEMO_CONFIG?.tenantId || localStorage.getItem('tenantId') || 'demo_tenant';
          }

          console.log('🔑 TenantId a asignar al almacén:', tenantId);

          // PRIORIDAD 1: Guardar en configuracion/almacenes como documento (similar a operadores y tractocamiones)
          try {
            console.log('💾 Guardando almacén en configuracion/almacenes...');
            const almacenesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'almacenes');
            const almacenesDoc = await window.fs.getDoc(almacenesDocRef);

            let almacenesArray = [];
            if (almacenesDoc.exists()) {
              const data = almacenesDoc.data();
              almacenesArray = data.almacenes || [];
            }

            // Buscar si ya existe un almacén con el mismo código o nombre
            const identificador = almacenData.codigo || almacenData.nombre;
            const existingIndex = almacenesArray.findIndex(
              a =>
                (a.codigo && a.codigo === identificador) || (a.nombre && a.nombre === identificador)
            );

            if (existingIndex >= 0) {
              // Actualizar existente
              almacenesArray[existingIndex] = {
                ...almacenData,
                tenantId: tenantId
              };
              console.log(
                '🔄 Actualizando almacén existente en configuracion/almacenes:',
                almacenData.nombre
              );
            } else {
              // Agregar nuevo
              almacenesArray.push({
                ...almacenData,
                tenantId: tenantId
              });
              console.log(
                '➕ Agregando nuevo almacén en configuracion/almacenes:',
                almacenData.nombre
              );
            }

            // Guardar el documento completo
            await window.fs.setDoc(
              almacenesDocRef,
              {
                almacenes: almacenesArray,
                tenantId: tenantId,
                updatedAt: new Date().toISOString()
              },
              { merge: true }
            );

            console.log('✅ Almacén guardado en configuracion/almacenes:', almacenData.nombre);
          } catch (error) {
            console.warn('⚠️ Error guardando en configuracion/almacenes:', error);
          }

          // NO guardar en la colección almacenes directamente - solo en configuracion/almacenes
          // Esto asegura que todos los datos estén organizados dentro de configuracion
        } catch (error) {
          console.warn('⚠️ Error guardando almacén en Firebase:', error);
        }
      }

      return this.setAlmacenes(almacenes);
    } catch (e) {
      console.error('Error al guardar almacén:', e);
      return false;
    }
  }
  deleteAlmacen(idOrCode) {
    try {
      const almacenes = this.getAlmacenes() || [];
      const filtered = almacenes.filter(a => a.id !== idOrCode && a.codigo !== idOrCode);
      return this.setAlmacenes(filtered);
    } catch (e) {
      console.error('Error al eliminar almacén:', e);
      return false;
    }
  }

  // === MÉTODOS PARA USUARIOS ===
  getUsuarios() {
    try {
      const data = localStorage.getItem(this.usuariosStorageKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error al obtener usuarios:', e);
      return null;
    }
  }
  setUsuarios(usuarios) {
    try {
      localStorage.setItem(this.usuariosStorageKey, JSON.stringify(usuarios));
      return true;
    } catch (e) {
      console.error('Error al guardar usuarios:', e);
      return false;
    }
  }
  saveUsuario(usuario) {
    try {
      const usuarios = this.getUsuarios() || [];
      const key = (usuario.email || '').toLowerCase();
      const idx = usuarios.findIndex(u => (u.email || '').toLowerCase() === key);
      const base = { ...usuario, id: usuario.id || Date.now() };
      if (idx >= 0) {
        usuarios[idx] = { ...usuarios[idx], ...base, fechaActualizacion: new Date().toISOString() };
      } else {
        usuarios.push({
          ...base,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString()
        });
      }
      return this.setUsuarios(usuarios);
    } catch (e) {
      console.error('Error al guardar usuario:', e);
      return false;
    }
  }
  deleteUsuario(idOrEmail) {
    try {
      const usuarios = this.getUsuarios() || [];
      const filtered = usuarios.filter(
        u => u.id !== idOrEmail && (u.email || '').toLowerCase() !== String(idOrEmail).toLowerCase()
      );
      return this.setUsuarios(filtered);
    } catch (e) {
      console.error('Error al eliminar usuario:', e);
      return false;
    }
  }

  // === MÉTODOS DE UTILIDAD ===

  showNotification(message, type = 'info') {
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
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
}

// Instancia global
window.configuracionManager = new ConfiguracionManager();

// === FUNCIONES GLOBALES PARA COMPATIBILIDAD ===

// Funciones para económicos
window.getEconomicos = () => {
  try {
    if (window.economicosRepo) {
      // Preferir datos ya sincronizados si existen en memoria
      return window.__economicosCache || [];
    }
    return window.configuracionManager.getAllEconomicos();
  } catch (_) {
    return [];
  }
};

window.saveEconomico = function () {
  try {
    // Obtener datos del formulario
    const economico = {
      numero: document.getElementById('numeroEconomico')?.value || '',
      tipoVehiculo: document.getElementById('tipoVehiculo')?.value || '',
      placaTracto: document.getElementById('placaTracto')?.value || '',
      placaRemolque: document.getElementById('placaRemolque')?.value || '',
      estadoPlacas: document.getElementById('estadoPlacas')?.value || '',
      permisoSCT: document.getElementById('permisoSCT')?.value || '',
      fechaVencimientoSCT: document.getElementById('fechaVencimientoSCT')?.value || '',
      seguroVehicular: document.getElementById('seguroVehicular')?.value || '',
      fechaVencimientoSeguro: document.getElementById('fechaVencimientoSeguro')?.value || '',
      marca: document.getElementById('marca')?.value || '',
      modelo: document.getElementById('modelo')?.value || '',
      año: document.getElementById('año')?.value || '',
      capacidadCarga: document.getElementById('capacidadCarga')?.value || '',
      numeroMotor: document.getElementById('numeroMotor')?.value || '',
      operadorAsignado: document.getElementById('operadorAsignado')?.value || '',
      telefonoOperador: document.getElementById('telefonoOperador')?.value || '',
      estadoVehiculo: document.getElementById('estadoVehiculo')?.value || '',
      observaciones: document.getElementById('observaciones')?.value || ''
    };

    // Validar campos requeridos
    if (!economico.numero) {
      alert('Por favor ingrese el número de económico');
      return false;
    }
    if (!economico.tipoVehiculo) {
      alert('Por favor seleccione el tipo de vehículo');
      return false;
    }
    if (!economico.placaTracto) {
      alert('Por favor ingrese la placa del tracto');
      return false;
    }
    if (!economico.estadoPlacas) {
      alert('Por favor seleccione el estado de las placas');
      return false;
    }
    if (!economico.permisoSCT) {
      alert('Por favor ingrese el permiso SCT');
      return false;
    }
    if (!economico.fechaVencimientoSCT) {
      alert('Por favor seleccione la fecha de vencimiento SCT');
      return false;
    }
    if (!economico.marca) {
      alert('Por favor ingrese la marca');
      return false;
    }
    if (!economico.modelo) {
      alert('Por favor ingrese el modelo');
      return false;
    }
    if (!economico.año) {
      alert('Por favor ingrese el año');
      return false;
    }
    if (!economico.estadoVehiculo) {
      alert('Por favor seleccione el estado del vehículo');
      return false;
    }

    const _resultado = false;
    if (window.economicosRepo) {
      // Guardar en Firestore
      return window.economicosRepo
        .save(economico)
        .then(() => {
          alert('Económico guardado exitosamente');
          document.getElementById('economicoForm').reset();
          return true;
        })
        .catch(err => {
          console.error('Error al guardar en Firestore:', err);
          alert('Error al guardar el económico');
          return false;
        });
    }
    // Guardar local (fallback)
    const resultadoLocal = window.configuracionManager.saveEconomico(economico);

    if (resultadoLocal) {
      alert('Económico guardado exitosamente');
      // Limpiar formulario
      document.getElementById('economicoForm').reset();
      // Actualizar lista
      window.loadEconomicos();
      return true;
    }
    alert('Error al guardar el económico');
    return false;
  } catch (error) {
    console.error('Error en saveEconomico:', error);
    alert(`Error al guardar el económico: ${error.message}`);
    return false;
  }
};

// Buscar económico por "numero" con coerción a string para mayor robustez
window.getEconomico = numero => {
  try {
    const lista = window.economicosRepo
      ? window.__economicosCache || []
      : window.configuracionManager.getAllEconomicos() || [];
    const key = String(numero).trim();
    return lista.find(e => String(e?.numero ?? '').trim() === key) || null;
  } catch (e) {
    console.error('❌ Error en getEconomico:', e);
    return null;
  }
};
window.deleteEconomico = numero => window.configuracionManager.deleteEconomico(numero);

// Funciones para operadores
window.getOperadores = () => window.configuracionManager.getAllOperadores();
// Obtener un operador por RFC o por licencia (fallback)
window.getOperador = function (id) {
  try {
    const operadores = window.configuracionManager.getAllOperadores() || [];
    return operadores.find(o => o && (o.rfc === id || o.licencia === id));
  } catch (e) {
    console.error('❌ Error obteniendo operador:', e);
    return null;
  }
};

window.saveOperador = async function () {
  try {
    // Obtener datos del formulario
    const operador = {
      nombre: document.getElementById('nombreOperador')?.value || '',
      licencia: document.getElementById('numeroLicencia')?.value || '',
      seguroSocial: document.getElementById('seguroSocial')?.value || '',
      telefono: document.getElementById('telefono')?.value || '',
      fechaNacimiento: document.getElementById('fechaNacimiento')?.value || '',
      direccion: document.getElementById('direccionOperador')?.value || '',
      fechaIngreso: document.getElementById('fechaIngreso')?.value || '',
      tipoOperador: document.getElementById('tipoOperador')?.value || '',
      estadoOperador: document.getElementById('estadoOperador')?.value || '',
      salario: document.getElementById('salarioOperador')?.value || '',
      fechaVencimientoLicencia: document.getElementById('fechaVencimientoLicencia')?.value || '',
      certificadoMedico: document.getElementById('certificadoMedico')?.value || '',
      fechaVencimientoCertificado:
        document.getElementById('fechaVencimientoCertificado')?.value || '',
      observaciones: document.getElementById('observacionesOperador')?.value || ''
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
    if (!operador.tipoOperador) {
      alert('Por favor seleccione el tipo de operador');
      return false;
    }
    if (!operador.estadoOperador) {
      alert('Por favor seleccione el estado del operador');
      return false;
    }
    if (!operador.fechaVencimientoLicencia) {
      alert('Por favor seleccione la fecha de vencimiento de la licencia');
      return false;
    }

    // Guardar usando el manager
    const resultado = await window.configuracionManager.saveOperador(operador);

    if (resultado) {
      alert('Operador guardado exitosamente (sincronizado con Firebase)');
      // Limpiar formulario
      document.getElementById('operadorForm').reset();
      // Actualizar lista
      window.loadOperadores();
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

window.getOperador = rfc => window.configuracionManager.getOperador(rfc);
window.deleteOperador = rfc => window.configuracionManager.deleteOperador(rfc);

// Funciones para clientes
window.getClientes = async () => await window.configuracionManager.getAllClientes();

window.saveCliente = async function () {
  try {
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
      observaciones: document.getElementById('observacionesCliente')?.value || ''
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
      alert('Por favor ingrese el nombre del contacto');
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

    // Guardar usando el manager
    const resultado = await window.configuracionManager.saveCliente(cliente);

    if (resultado) {
      alert('Cliente guardado exitosamente (sincronizado con Firebase)');
      // Limpiar formulario
      document.getElementById('clienteForm').reset();
      // Actualizar lista
      window.loadClientes();
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

window.getCliente = rfc => window.configuracionManager.getCliente(rfc);
window.deleteCliente = rfc => window.configuracionManager.deleteCliente(rfc);

// Funciones para mostrar modales de eliminación
window.showDeleteEconomicoModal = function () {
  const select = document.getElementById('economicoToDelete');
  if (!select || !select.value) {
    alert('Por favor seleccione un económico para eliminar');
    return;
  }

  const economico = window.configuracionManager.getEconomico(select.value);
  if (economico) {
    document.getElementById('deleteEconomicoInfo').textContent =
      `Económico: ${economico.numero} - ${economico.marca} ${economico.modelo}`;
    document.getElementById('deleteEconomicoRfc').value = select.value;

    const modal = new bootstrap.Modal(document.getElementById('deleteEconomicoModal'));
    modal.show();
  }
};

window.showDeleteOperadorModal = function () {
  const select = document.getElementById('operadorToDelete');
  if (!select || !select.value) {
    alert('Por favor seleccione un operador para eliminar');
    return;
  }

  const operador = window.configuracionManager.getOperador(select.value);
  if (operador) {
    document.getElementById('deleteOperadorInfo').textContent =
      `Operador: ${operador.nombre} - ${operador.licencia}`;
    document.getElementById('deleteOperadorRfc').value = select.value;

    const modal = new bootstrap.Modal(document.getElementById('deleteOperadorModal'));
    modal.show();
  }
};

window.showDeleteClienteModal = function () {
  const select = document.getElementById('clienteToDelete');
  if (!select || !select.value) {
    alert('Por favor seleccione un cliente para eliminar');
    return;
  }

  const cliente = window.configuracionManager.getCliente(select.value);
  if (cliente) {
    document.getElementById('deleteClienteInfo').textContent =
      `Cliente: ${cliente.nombre} - ${cliente.rfc}`;
    document.getElementById('deleteClienteRfc').value = select.value;

    const modal = new bootstrap.Modal(document.getElementById('deleteClienteModal'));
    modal.show();
  }
};

// Funciones para confirmar eliminación
window.confirmDeleteEconomicoFromModal = async function () {
  const numero = document.getElementById('deleteEconomicoRfc').value;
  console.log('Eliminando económico con número:', numero);

  if (numero && (await window.configuracionManager.deleteEconomico(numero))) {
    console.log('✅ Económico eliminado exitosamente');
    alert('Económico eliminado exitosamente');
    window.loadEconomicos();
    window.loadEconomicosTable();

    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteEconomicoModal'));
    modal.hide();
  } else {
    console.error('❌ Error al eliminar el económico');
    alert('Error al eliminar el económico');
  }
};

window.confirmDeleteOperadorFromModal = function () {
  const licencia = document.getElementById('deleteOperadorRfc').value;
  console.log('Eliminando operador con licencia:', licencia);

  // Buscar el operador por licencia para obtener su RFC
  const operadores = window.configuracionManager.getAllOperadores();
  const operador = operadores.find(o => o.licencia === licencia);

  if (operador && window.configuracionManager.deleteOperador(operador.rfc)) {
    console.log('✅ Operador eliminado exitosamente');
    alert('Operador eliminado exitosamente');
    window.loadOperadores();
    window.loadOperadoresTable();

    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteOperadorModal'));
    modal.hide();
  } else {
    console.error('❌ Error al eliminar el operador');
    alert('Error al eliminar el operador');
  }
};

window.confirmDeleteClienteFromModal = function () {
  const rfc = document.getElementById('deleteClienteRfc').value;
  console.log('Eliminando cliente con RFC:', rfc);

  if (rfc && window.configuracionManager.deleteCliente(rfc)) {
    console.log('✅ Cliente eliminado exitosamente');
    alert('Cliente eliminado exitosamente');
    window.loadClientes();
    (async () => await window.loadClientesTable())();

    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteClienteModal'));
    modal.hide();
  } else {
    console.error('❌ Error al eliminar el cliente');
    alert('Error al eliminar el cliente');
  }
};

// Funciones para cargar listas en selects
window.loadEconomicos = function () {
  const select = document.getElementById('economicoToDelete');
  if (!select) {
    return;
  }

  select.innerHTML = '<option value="">Seleccione un económico...</option>';

  const economicos = window.economicosRepo
    ? window.__economicosCache || []
    : window.configuracionManager.getAllEconomicos();
  if (economicos && economicos.length > 0) {
    economicos.forEach(economico => {
      const option = document.createElement('option');
      option.value = economico.numero;
      option.textContent = `${economico.numero} - ${economico.marca} ${economico.modelo}`;
      select.appendChild(option);
    });
  }
};

window.loadOperadores = function () {
  const select = document.getElementById('operadorToDelete');
  if (!select) {
    return;
  }

  select.innerHTML = '<option value="">Seleccione un operador...</option>';

  const operadores = window.configuracionManager.getAllOperadores();
  if (operadores && operadores.length > 0) {
    operadores.forEach(operador => {
      const option = document.createElement('option');
      option.value = operador.licencia;
      option.textContent = `${operador.nombre} - ${operador.licencia}`;
      select.appendChild(option);
    });
  }
};

window.loadClientes = function () {
  const select = document.getElementById('clienteToDelete');
  if (!select) {
    return;
  }

  select.innerHTML = '<option value="">Seleccione un cliente...</option>';

  const clientes = window.configuracionManager.getAllClientes();
  if (clientes && clientes.length > 0) {
    clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.rfc;
      option.textContent = `${cliente.nombre} - ${cliente.rfc}`;
      select.appendChild(option);
    });
  }
};

// Funciones de filtrado
window.filterEconomicos = function () {
  const searchTerm = document.getElementById('searchEconomicos')?.value.toLowerCase() || '';
  const estadoFilter = document.getElementById('filterEstadoEconomicos')?.value || '';

  const economicos = window.configuracionManager.getAllEconomicos();
  const tbody = document.getElementById('economicosTableBody');

  if (!tbody) {
    return;
  }

  const filteredEconomicos = economicos.filter(economico => {
    const matchesSearch =
      !searchTerm ||
      economico.numero.toLowerCase().includes(searchTerm) ||
      economico.placaTracto.toLowerCase().includes(searchTerm) ||
      economico.marca.toLowerCase().includes(searchTerm) ||
      economico.modelo.toLowerCase().includes(searchTerm);

    const matchesEstado = !estadoFilter || economico.estadoVehiculo === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  // Limpiar tabla
  tbody.innerHTML = '';

  // Llenar tabla con resultados filtrados
  filteredEconomicos.forEach(economico => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${economico.numero}</td>
            <td>${economico.tipoVehiculo}</td>
            <td>${economico.placaTracto}</td>
            <td>${economico.marca} ${economico.modelo}</td>
            <td>${economico.año}</td>
            <td><span class="badge bg-${economico.estadoVehiculo === 'activo' ? 'success' : 'warning'}">${economico.estadoVehiculo}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="openEditEconomicoModal('${economico.numero}')">
                        <i class="fas fa-edit"></i>
                    </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEconomicoFromTable('${economico.numero}')">
                        <i class="fas fa-trash"></i>
                    </button>
            </td>
        `;
    tbody.appendChild(row);
  });

  // Actualizar contadores con datos filtrados
  updateEconomicosCounters(filteredEconomicos);
};

window.filterOperadores = function () {
  const searchTerm = document.getElementById('searchOperadores')?.value.toLowerCase() || '';
  const estadoFilter = document.getElementById('filterEstadoOperadores')?.value || '';

  const operadores = window.configuracionManager.getAllOperadores();
  const tbody = document.getElementById('operadoresTableBody');

  if (!tbody) {
    return;
  }

  const filteredOperadores = operadores.filter(operador => {
    const matchesSearch =
      !searchTerm ||
      operador.nombre.toLowerCase().includes(searchTerm) ||
      operador.licencia.toLowerCase().includes(searchTerm) ||
      operador.telefono.toLowerCase().includes(searchTerm);

    const matchesEstado = !estadoFilter || operador.estadoOperador === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  // Limpiar tabla
  tbody.innerHTML = '';

  // Llenar tabla con resultados filtrados
  filteredOperadores.forEach(operador => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${operador.nombre}</td>
            <td>${operador.licencia}</td>
            <td>${operador.telefono}</td>
            <td>${operador.tipoOperador}</td>
            <td><span class="badge bg-${operador.estadoOperador === 'activo' ? 'success' : 'warning'}">${operador.estadoOperador}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editOperador('${operador.rfc}')">
                        <i class="fas fa-edit"></i>
                    </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteOperadorFromTable('${operador.licencia}')">
                        <i class="fas fa-trash"></i>
                    </button>
            </td>
        `;
    tbody.appendChild(row);
  });
};

window.filterClientes = function () {
  const searchTerm = document.getElementById('searchClientes')?.value.toLowerCase() || '';
  const estadoFilter = document.getElementById('filterEstadoClientes')?.value || '';

  const clientes = window.configuracionManager.getAllClientes();
  const tbody = document.getElementById('clientesTableBody');

  if (!tbody) {
    return;
  }

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch =
      !searchTerm ||
      cliente.nombre.toLowerCase().includes(searchTerm) ||
      cliente.rfc.toLowerCase().includes(searchTerm) ||
      cliente.contacto.toLowerCase().includes(searchTerm) ||
      cliente.telefono.toLowerCase().includes(searchTerm);

    const matchesEstado = !estadoFilter || cliente.estadoComercial === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  // Limpiar tabla
  tbody.innerHTML = '';

  // Llenar tabla con resultados filtrados
  filteredClientes.forEach(cliente => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${cliente.nombre}</td>
            <td>${cliente.rfc}</td>
            <td>${cliente.contacto}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.tipoCliente}</td>
            <td><span class="badge bg-${cliente.estadoComercial === 'Activo' ? 'success' : 'warning'}">${cliente.estadoComercial}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCliente('${cliente.rfc}')">
                        <i class="fas fa-edit"></i>
                    </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteClienteFromTable('${cliente.rfc}')">
                        <i class="fas fa-trash"></i>
                    </button>
            </td>
        `;
    tbody.appendChild(row);
  });
};

// Funciones para proveedores
window.getProveedores = () => window.configuracionManager.getProveedores();
window.setProveedores = proveedores => window.configuracionManager.setProveedores(proveedores);
window.saveProveedor = async proveedor =>
  await window.configuracionManager.saveProveedor(proveedor);
window.getProveedor = rfc => window.configuracionManager.getProveedor(rfc);
window.deleteProveedor = rfc => window.configuracionManager.deleteProveedor(rfc);
window.getProveedoresList = () => window.configuracionManager.getProveedoresList();

// Funciones para cuentas bancarias
window.getCuentasBancarias = () => window.configuracionManager.getCuentasBancarias();
window.setCuentasBancarias = cuentasBancarias =>
  window.configuracionManager.setCuentasBancarias(cuentasBancarias);
window.getCuentaBancaria = numeroCuenta =>
  window.configuracionManager.getCuentaBancaria(numeroCuenta);

// === FUNCIONES DE CARGA Y ACTUALIZACIÓN ===

// ====== ESTANCIAS (UI helpers) ======
window.saveEstancia = async function () {
  const nombre = document.getElementById('nombreEstancia')?.value || '';
  const direccion = document.getElementById('direccionEstancia')?.value || '';
  const codigo = document.getElementById('codigoEstancia')?.value || '';
  const observaciones = document.getElementById('observacionesEstancia')?.value || '';
  if (!nombre || !direccion) {
    alert('Complete nombre y dirección');
    return false;
  }
  const ok = await window.configuracionManager.saveEstancia({
    nombre,
    direccion,
    codigo,
    observaciones
  });
  if (ok) {
    alert('Estancia guardada (sincronizada con Firebase)');
    document.getElementById('estanciaForm')?.reset();
    await loadEstanciasTable();
  } else {
    alert('Error al guardar estancia');
  }
  return ok;
};

window.loadEstanciasTable = async function () {
  const tbody = document.getElementById('estanciasTableBody');
  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="5" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  let estancias = [];

  // PRIORIDAD 1: Cargar desde Firebase si está disponible
  if (window.firebaseDb && window.fs) {
    try {
      console.log('📊 Cargando estancias desde Firebase...');
      const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
      const estanciasDoc = await window.fs.getDoc(estanciasDocRef);

      if (estanciasDoc.exists()) {
        const data = estanciasDoc.data();
        if (data.estancias && Array.isArray(data.estancias)) {
          estancias = data.estancias;
          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setEstancias(estancias);
          }
          console.log(`✅ ${estancias.length} estancias cargadas desde Firebase`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando estancias desde Firebase:', error);
    }
  }

  // PRIORIDAD 2: Si no hay datos en Firebase, usar getEstancias()
  if (estancias.length === 0) {
    estancias = window.configuracionManager.getEstancias() || [];
    console.log(`📊 ${estancias.length} estancias cargadas desde localStorage`);
  }

  tbody.innerHTML = '';
  if (estancias.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>';
    return;
  }
  estancias.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${e.nombre || ''}</td>
            <td>${e.codigo || ''}</td>
            <td>${e.direccion || ''}</td>
            <td>${e.observaciones || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editEstancia(${e.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEstancia(${e.id})"><i class="fas fa-trash"></i></button>
            </td>`;
    tbody.appendChild(tr);
  });
};

window.filterEstancias = function () {
  const q = (document.getElementById('searchEstancias')?.value || '').toLowerCase();
  const all = window.configuracionManager.getEstancias() || [];
  const tbody = document.getElementById('estanciasTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '';
  all
    .filter(
      e =>
        !q ||
        (e.nombre || '').toLowerCase().includes(q) ||
        (e.codigo || '').toLowerCase().includes(q)
    )
    .forEach(e => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
            <td>${e.nombre || ''}</td>
            <td>${e.codigo || ''}</td>
            <td>${e.direccion || ''}</td>
            <td>${e.observaciones || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editEstancia(${e.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEstancia(${e.id})"><i class="fas fa-trash"></i></button>
            </td>`;
      tbody.appendChild(tr);
    });
};

window.editEstancia = function (id) {
  const e = (window.configuracionManager.getEstancias() || []).find(x => x.id === id);
  if (!e) {
    alert('No se encontró la estancia para editar');
    return;
  }

  // Llenar el modal
  document.getElementById('editEstanciaIdOriginal').value = e.id || id;
  document.getElementById('editEstanciaNombre').value = e.nombre || '';
  document.getElementById('editEstanciaCodigo').value = e.codigo || '';
  document.getElementById('editEstanciaDireccion').value = e.direccion || '';
  document.getElementById('editEstanciaObservaciones').value = e.observaciones || '';

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editEstanciaModal'));
  modal.show();
};

window.deleteEstancia = async function (idOrCode) {
  if (!confirm('¿Eliminar estancia?')) {
    return;
  }
  if (window.configuracionManager.deleteEstancia(idOrCode)) {
    await loadEstanciasTable();
  }
};

window.clearEstanciaForm = function () {
  document.getElementById('estanciaForm')?.reset();
};

// ====== ALMACENES (UI helpers) ======
window.saveAlmacen = async function () {
  const nombre = document.getElementById('nombreAlmacen')?.value || '';
  const direccion = document.getElementById('direccionAlmacen')?.value || '';
  const codigo = document.getElementById('codigoAlmacen')?.value || '';
  const observaciones = document.getElementById('observacionesAlmacen')?.value || '';
  if (!nombre) {
    alert('Ingrese el nombre del almacén');
    return false;
  }
  const ok = await window.configuracionManager.saveAlmacen({
    nombre,
    direccion,
    codigo,
    observaciones
  });
  if (ok) {
    alert('Almacén guardado (sincronizado con Firebase)');
    document.getElementById('almacenForm')?.reset();
    await loadAlmacenesTable();
  } else {
    alert('Error al guardar almacén');
  }
  return ok;
};

window.loadAlmacenesTable = async function () {
  const tbody = document.getElementById('almacenesTableBody');
  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="5" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  let almacenes = [];

  // PRIORIDAD 1: Cargar desde Firebase si está disponible
  if (window.firebaseDb && window.fs) {
    try {
      console.log('📊 Cargando almacenes desde Firebase...');
      const almacenesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'almacenes');
      const almacenesDoc = await window.fs.getDoc(almacenesDocRef);

      if (almacenesDoc.exists()) {
        const data = almacenesDoc.data();
        if (data.almacenes && Array.isArray(data.almacenes)) {
          almacenes = data.almacenes;
          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setAlmacenes(almacenes);
          }
          console.log(`✅ ${almacenes.length} almacenes cargados desde Firebase`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando almacenes desde Firebase:', error);
    }
  }

  // PRIORIDAD 2: Si no hay datos en Firebase, usar getAlmacenes()
  if (almacenes.length === 0) {
    almacenes = window.configuracionManager.getAlmacenes() || [];
    console.log(`📊 ${almacenes.length} almacenes cargados desde localStorage`);
  }

  tbody.innerHTML = '';
  if (almacenes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>';
    return;
  }
  almacenes.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${a.nombre || ''}</td>
            <td>${a.codigo || ''}</td>
            <td>${a.direccion || ''}</td>
            <td>${a.observaciones || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editAlmacen(${a.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAlmacen(${a.id})"><i class="fas fa-trash"></i></button>
            </td>`;
    tbody.appendChild(tr);
  });
};

window.filterAlmacenes = function () {
  const q = (document.getElementById('searchAlmacenes')?.value || '').toLowerCase();
  const all = window.configuracionManager.getAlmacenes() || [];
  const tbody = document.getElementById('almacenesTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '';
  all
    .filter(
      a =>
        !q ||
        (a.nombre || '').toLowerCase().includes(q) ||
        (a.codigo || '').toLowerCase().includes(q)
    )
    .forEach(a => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
            <td>${a.nombre || ''}</td>
            <td>${a.codigo || ''}</td>
            <td>${a.direccion || ''}</td>
            <td>${a.observaciones || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editAlmacen(${a.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAlmacen(${a.id})"><i class="fas fa-trash"></i></button>
            </td>`;
      tbody.appendChild(tr);
    });
};

window.editAlmacen = function (id) {
  const a = (window.configuracionManager.getAlmacenes() || []).find(x => x.id === id);
  if (!a) {
    alert('No se encontró el almacén para editar');
    return;
  }

  // Llenar el modal
  document.getElementById('editAlmacenIdOriginal').value = a.id || id;
  document.getElementById('editAlmacenNombre').value = a.nombre || '';
  document.getElementById('editAlmacenCodigo').value = a.codigo || '';
  document.getElementById('editAlmacenDireccion').value = a.direccion || '';
  document.getElementById('editAlmacenObservaciones').value = a.observaciones || '';

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editAlmacenModal'));
  modal.show();
};

window.deleteAlmacen = async function (idOrCode) {
  if (!confirm('¿Eliminar almacén?')) {
    return;
  }
  if (window.configuracionManager.deleteAlmacen(idOrCode)) {
    await loadAlmacenesTable();
  }
};

window.clearAlmacenForm = function () {
  document.getElementById('almacenForm')?.reset();
};

// ====== BANCOS (UI helpers) ======
// FUNCIÓN ELIMINADA: agregarDatosEjemploBancos
// Los datos de ejemplo ahora solo se generan mediante los botones manuales

window.saveCuentaBancaria = async function () {
  const banco = document.getElementById('bancoCuentaBancaria')?.value || '';
  const numeroCuenta = document.getElementById('numeroCuentaBancaria')?.value || '';
  const clabe = document.getElementById('clabeCuentaBancaria')?.value || '';
  const tipoCuenta = document.getElementById('tipoCuentaBancaria')?.value || '';
  const moneda = document.getElementById('monedaCuentaBancaria')?.value || '';
  const saldoInicial =
    parseFloat(document.getElementById('saldoInicialCuentaBancaria')?.value || '0') || 0;
  const observaciones = document.getElementById('observacionesCuentaBancaria')?.value || '';

  if (!banco || !numeroCuenta || !tipoCuenta || !moneda) {
    alert('Por favor complete todos los campos obligatorios');
    return false;
  }

  // Si estamos en modo edición, usar el número de cuenta original
  const numeroCuentaParaGuardar = window.__editingCuentaBancariaNumero || numeroCuenta;
  const isEditing = Boolean(window.__editingCuentaBancariaNumero);

  const ok = await window.configuracionManager.saveCuentaBancaria({
    banco,
    numeroCuenta: numeroCuentaParaGuardar, // Usar el número original si estamos editando
    clabe,
    tipoCuenta,
    moneda,
    saldoInicial: saldoInicial,
    observaciones
  });

  if (ok) {
    alert(
      isEditing
        ? '✅ Banco actualizado correctamente (sincronizado con Firebase)'
        : '✅ Banco guardado correctamente (sincronizado con Firebase)'
    );
    clearCuentaBancariaForm();
    // Intentar usar la función de Firebase primero, luego fallback
    if (typeof window.loadCuentasBancariasTableFirebase === 'function') {
      await window.loadCuentasBancariasTableFirebase();
    } else {
      await loadCuentasBancariasTable();
    }
  } else {
    alert('❌ Error al guardar banco');
  }
  return ok;
};

window.loadCuentasBancariasTable = async function () {
  const tbody = document.getElementById('cuentasBancariasTableBody');
  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="8" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  // NO agregar datos de ejemplo automáticamente - el usuario debe usar el botón manualmente
  // await window.agregarDatosEjemploBancos(); // DESHABILITADO

  let cuentasBancarias = [];

  // PRIORIDAD 1: Cargar desde Firebase si está disponible
  // Intentar usar la función de configuracion-firebase.js primero
  if (typeof window.loadCuentasBancariasFromFirebase === 'function') {
    try {
      console.log(
        '📊 Cargando cuentas bancarias desde Firebase (usando loadCuentasBancariasFromFirebase)...'
      );
      cuentasBancarias = await window.loadCuentasBancariasFromFirebase();
      if (cuentasBancarias && cuentasBancarias.length > 0) {
        console.log(`✅ ${cuentasBancarias.length} cuentas bancarias cargadas desde Firebase`);
      }
    } catch (error) {
      console.warn(
        '⚠️ Error cargando cuentas bancarias desde Firebase (loadCuentasBancariasFromFirebase):',
        error
      );
    }
  }

  // Fallback: intentar cargar directamente si la función no está disponible
  if ((!cuentasBancarias || cuentasBancarias.length === 0) && window.firebaseDb && window.fs) {
    try {
      console.log('📊 Cargando cuentas bancarias desde Firebase (fallback directo)...');
      const cuentasBancariasDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'cuentas_bancarias'
      );
      const cuentasBancariasDoc = await window.fs.getDoc(cuentasBancariasDocRef);

      if (cuentasBancariasDoc.exists()) {
        const data = cuentasBancariasDoc.data();
        if (data.cuentasBancarias && Array.isArray(data.cuentasBancarias)) {
          cuentasBancarias = data.cuentasBancarias;
          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setCuentasBancarias(cuentasBancarias);
          }
          console.log(
            `✅ ${cuentasBancarias.length} cuentas bancarias cargadas desde Firebase (fallback)`
          );
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cuentas bancarias desde Firebase (fallback):', error);
    }
  }

  // PRIORIDAD 2: Si no hay datos en Firebase, usar getCuentasBancarias()
  if (cuentasBancarias.length === 0) {
    cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
    console.log(`📊 ${cuentasBancarias.length} cuentas bancarias cargadas desde localStorage`);
  }

  tbody.innerHTML = '';
  if (cuentasBancarias.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Sin registros</td></tr>';
    return;
  }

  cuentasBancarias.forEach(c => {
    const tr = document.createElement('tr');
    const numeroCuentaEscaped = (c.numeroCuenta || '').replace(/'/g, "\\'");
    const saldoInicial = parseFloat(c.saldoInicial || 0);
    const saldoFormateado = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: c.moneda || 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(saldoInicial);
    tr.innerHTML = `
            <td>${c.banco || ''}</td>
            <td>${c.numeroCuenta || ''}</td>
            <td>${c.clabe || ''}</td>
            <td>${c.tipoCuenta || ''}</td>
            <td>${c.moneda || ''}</td>
            <td><strong>${saldoFormateado}</strong></td>
            <td>${c.observaciones || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCuentaBancaria('${numeroCuentaEscaped}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCuentaBancaria('${numeroCuentaEscaped}')"><i class="fas fa-trash"></i></button>
            </td>`;
    tbody.appendChild(tr);
  });
};

window.filterCuentasBancarias = function () {
  const q = (document.getElementById('searchCuentasBancarias')?.value || '').toLowerCase();
  const monedaFilter = document.getElementById('filterMonedaCuentasBancarias')?.value || '';
  const tipoFilter = document.getElementById('filterTipoCuentasBancarias')?.value || '';

  const all = window.configuracionManager.getCuentasBancarias() || [];
  const tbody = document.getElementById('cuentasBancariasTableBody');
  if (!tbody) {
    return;
  }

  tbody.innerHTML = '';

  const filtered = all.filter(c => {
    const matchesSearch =
      !q ||
      (c.banco || '').toLowerCase().includes(q) ||
      (c.numeroCuenta || '').toLowerCase().includes(q);
    const matchesMoneda = !monedaFilter || c.moneda === monedaFilter;
    const matchesTipo = !tipoFilter || c.tipoCuenta === tipoFilter;
    return matchesSearch && matchesMoneda && matchesTipo;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Sin registros</td></tr>';
    return;
  }

  filtered.forEach(c => {
    const tr = document.createElement('tr');
    const numeroCuentaEscaped = (c.numeroCuenta || '').replace(/'/g, "\\'");
    const saldoInicial = parseFloat(c.saldoInicial || 0);
    const saldoFormateado = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: c.moneda || 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(saldoInicial);
    tr.innerHTML = `
            <td>${c.banco || ''}</td>
            <td>${c.numeroCuenta || ''}</td>
            <td>${c.clabe || ''}</td>
            <td>${c.tipoCuenta || ''}</td>
            <td>${c.moneda || ''}</td>
            <td><strong>${saldoFormateado}</strong></td>
            <td>${c.observaciones || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="editCuentaBancaria('${numeroCuentaEscaped}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCuentaBancaria('${numeroCuentaEscaped}')"><i class="fas fa-trash"></i></button>
            </td>`;
    tbody.appendChild(tr);
  });
};

window.editCuentaBancaria = function (numeroCuenta) {
  const c = (window.configuracionManager.getCuentasBancarias() || []).find(
    x => x.numeroCuenta === numeroCuenta
  );
  if (!c) {
    alert('❌ Cuenta bancaria no encontrada');
    return;
  }

  // Llenar el modal
  document.getElementById('editCuentaBancariaNumeroOriginal').value =
    c.numeroCuenta || numeroCuenta;
  document.getElementById('editCuentaBancariaBanco').value = c.banco || '';
  document.getElementById('editCuentaBancariaNumero').value = c.numeroCuenta || '';
  document.getElementById('editCuentaBancariaClabe').value = c.clabe || '';
  document.getElementById('editCuentaBancariaTipo').value = c.tipoCuenta || '';
  document.getElementById('editCuentaBancariaMoneda').value = c.moneda || '';
  document.getElementById('editCuentaBancariaSaldoInicial').value = parseFloat(c.saldoInicial || 0);
  document.getElementById('editCuentaBancariaObservaciones').value = c.observaciones || '';

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editCuentaBancariaModal'));
  modal.show();
};

window.deleteCuentaBancaria = async function (numeroCuenta) {
  if (!confirm('¿Eliminar cuenta bancaria?')) {
    return;
  }
  if (window.configuracionManager.deleteCuentaBancaria(numeroCuenta)) {
    // Intentar usar la función de Firebase primero, luego fallback
    if (typeof window.loadCuentasBancariasTableFirebase === 'function') {
      await window.loadCuentasBancariasTableFirebase();
    } else {
      await loadCuentasBancariasTable();
    }
  }
};

window.clearCuentaBancariaForm = function () {
  // Limpiar el formulario
  document.getElementById('cuentaBancariaForm')?.reset();

  // Habilitar el campo de número de cuenta
  const numeroCuentaInput = document.getElementById('numeroCuentaBancaria');
  if (numeroCuentaInput) {
    numeroCuentaInput.disabled = false;
    numeroCuentaInput.style.backgroundColor = '';
  }

  // Restaurar el texto del botón a "Guardar"
  const saveButton = document.querySelector(
    '#cuentaBancariaForm button[onclick="saveCuentaBancaria()"]'
  );
  if (saveButton) {
    saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Banco';
    saveButton.classList.remove('btn-warning');
    saveButton.classList.add('btn-primary');
  }

  // Limpiar el modo edición
  window.__editingCuentaBancariaNumero = null;

  console.log('🧹 Formulario de cuenta bancaria limpiado');
};

window.exportCuentasBancarias = function () {
  const cuentasBancarias = window.configuracionManager.getCuentasBancarias() || [];
  if (cuentasBancarias.length === 0) {
    alert('No hay bancos para exportar');
    return;
  }

  const ws = XLSX.utils.json_to_sheet(
    cuentasBancarias.map(c => ({
      Banco: c.banco || '',
      'Número de Cuenta': c.numeroCuenta || '',
      CLABE: c.clabe || '',
      'Tipo de Cuenta': c.tipoCuenta || '',
      Moneda: c.moneda || '',
      Observaciones: c.observaciones || ''
    }))
  );

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bancos');
  XLSX.writeFile(wb, `bancos_${new Date().toISOString().split('T')[0]}.xlsx`);
};

window.limpiarTodasCuentasBancarias = function () {
  if (!confirm('¿Está seguro de eliminar todos los bancos? Esta acción no se puede deshacer.')) {
    return;
  }

  if (window.configuracionManager) {
    window.configuracionManager.setCuentasBancarias([]);

    // Eliminar de Firebase
    if (window.firebaseDb && window.fs) {
      (async () => {
        try {
          const tenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
          const cuentasBancariasDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'cuentas_bancarias'
          );
          await window.fs.setDoc(
            cuentasBancariasDocRef,
            {
              cuentasBancarias: [],
              tenantId: tenantId,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          console.log('✅ Todos los bancos eliminados de Firebase');
        } catch (error) {
          console.warn('⚠️ Error eliminando bancos de Firebase:', error);
        }
      })();
    }

    loadCuentasBancariasTable();
    alert('Todos los bancos han sido eliminados');
  }
};

// ====== USUARIOS (UI helpers) ======
const MODULOS_SISTEMA = [
  'Logística',
  'Facturación',
  'Tráfico',
  'Operadores',
  'Diesel',
  'Mantenimiento',
  'Tesoreria',
  'Cuentas x Cobrar',
  'Cuentas x Pagar',
  'Inventario',
  'Configuración',
  'Reportes',
  'Dashboard'
];

function renderModulosCheckboxes() {
  const contVer = document.getElementById('modulosVerContainer');
  if (!contVer) {
    console.log('❌ No se encontró el contenedor de módulos');
    return;
  }
  contVer.innerHTML = '';
  console.log('✅ Renderizando checkboxes para', MODULOS_SISTEMA.length, 'módulos');
  MODULOS_SISTEMA.forEach((m, idx) => {
    const idV = `permVer_${idx}`;
    const colV = document.createElement('div');
    colV.className = 'col';
    colV.innerHTML = `<div class="form-check"><input class="form-check-input" type="checkbox" id="${idV}" value="${m}"><label class="form-check-label" for="${idV}">${m}</label></div>`;
    contVer.appendChild(colV);
  });
}

window.saveUsuario = function () {
  console.warn('⚠️ ATENCIÓN: Se está usando la versión ANTIGUA de saveUsuario (localStorage)');
  console.warn(
    '⚠️ Esta función NO guarda en Firebase. Debería usar la versión de configuracion-firebase.js'
  );
  const nombre = document.getElementById('usuarioNombre')?.value || '';
  const email = document.getElementById('usuarioEmail')?.value || '';
  const password = document.getElementById('usuarioPassword')?.value || '';
  const confirmPassword = document.getElementById('usuarioConfirmPassword')?.value || '';

  if (!nombre || !email || !password) {
    alert('Complete nombre, email y contraseña');
    return false;
  }

  // Validar que las contraseñas coincidan
  if (password !== confirmPassword) {
    alert('❌ Las contraseñas no coinciden. Por favor, verifique e intente nuevamente.');
    document.getElementById('usuarioConfirmPassword').focus();
    return false;
  }

  // Validar longitud mínima de contraseña
  if (password.length < 4) {
    alert('❌ La contraseña debe tener al menos 4 caracteres');
    document.getElementById('usuarioPassword').focus();
    return false;
  }
  const puedeVer = Array.from(
    document.querySelectorAll('#modulosVerContainer input[type="checkbox"]:checked')
  ).map(i => i.value);
  const puedeAprobarSolicitudes =
    document.getElementById('puedeAprobarSolicitudes')?.checked || false;

  // Guardar configuración de contraseña de aprobación si se proporcionó
  const passwordAprobacion = document.getElementById('passwordAprobacion')?.value || '';
  const confirmPasswordAprobacion =
    document.getElementById('confirmPasswordAprobacion')?.value || '';

  if (passwordAprobacion && confirmPasswordAprobacion) {
    if (passwordAprobacion !== confirmPasswordAprobacion) {
      alert('❌ Las contraseñas de aprobación no coinciden');
      return false;
    }
    if (passwordAprobacion.length < 4) {
      alert('❌ La contraseña de aprobación debe tener al menos 4 caracteres');
      return false;
    }

    // Guardar configuración de contraseña de aprobación
    const config = {
      passwordAprobacion: passwordAprobacion,
      lastUpdate: new Date().toLocaleString('es-MX')
    };
    localStorage.setItem('sistema_config', JSON.stringify(config));
    console.log('✅ Configuración de contraseña de aprobación guardada');
  }

  // Eliminar permisos de editar: sólo manejamos "ver"
  const ok = window.configuracionManager.saveUsuario({
    nombre,
    email,
    password,
    puedeVer,
    puedeAprobarSolicitudes
  });
  if (ok) {
    alert('Usuario y configuración guardados correctamente');
    document.getElementById('usuarioForm')?.reset();
    renderModulosCheckboxes();
    loadUsuariosTable();
  } else {
    alert('Error al guardar usuario');
  }
  return ok;
};

window.loadUsuariosTable = function () {
  const tbody = document.getElementById('usuariosTableBody');
  if (!tbody) {
    return;
  }
  const usuarios = window.configuracionManager.getUsuarios() || [];
  tbody.innerHTML = '';
  if (usuarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Sin registros</td></tr>';
    return;
  }
  usuarios.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td>${u.nombre || ''}</td>
            <td>${u.email || ''}</td>
            <td>${(u.puedeVer || []).join(', ')}</td>
            <td class="text-center">
                ${u.puedeAprobarSolicitudes ? '<i class="fas fa-check-circle text-success" title="Puede aprobar solicitudes"></i>' : '<i class="fas fa-times-circle text-muted" title="No puede aprobar solicitudes"></i>'}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="verDetallesUsuario(${u.id})" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-primary" onclick="editUsuario(${u.id})" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUsuario(${u.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>`;
    tbody.appendChild(tr);
  });
};

window.filterUsuarios = function () {
  const q = (document.getElementById('searchUsuarios')?.value || '').toLowerCase();
  const all = window.configuracionManager.getUsuarios() || [];
  const tbody = document.getElementById('usuariosTableBody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '';
  all
    .filter(
      u =>
        !q ||
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    )
    .forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
            <td>${u.nombre || ''}</td>
            <td>${u.email || ''}</td>
            <td>${(u.puedeVer || []).join(', ')}</td>
            <td>${(u.puedeEditar || []).join(', ')}</td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="verDetallesUsuario(${u.id})" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-primary" onclick="editUsuario(${u.id})" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteUsuario(${u.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>`;
      tbody.appendChild(tr);
    });
};

window.editUsuario = function (id) {
  const u = (window.configuracionManager.getUsuarios() || []).find(x => x.id === id);
  if (!u) {
    alert('No se encontró el usuario para editar');
    return;
  }

  // Llenar el modal
  document.getElementById('editUsuarioIdOriginal').value = u.id || id;
  document.getElementById('editUsuarioNombre').value = u.nombre || '';
  document.getElementById('editUsuarioEmail').value = u.email || '';
  document.getElementById('editUsuarioPassword').value = '';
  document.getElementById('editUsuarioConfirmPassword').value = '';
  document.getElementById('editUsuarioPuedeAprobar').checked = u.puedeAprobarSolicitudes || false;

  // Generar checkboxes de módulos
  const modulosContainer = document.getElementById('editUsuarioModulosContainer');
  if (modulosContainer) {
    const modulos = [
      'logistica',
      'facturacion',
      'trafico',
      'operadores',
      'diesel',
      'mantenimiento',
      'tesoreria',
      'cxc',
      'cxp',
      'inventario',
      'configuracion',
      'reportes'
    ];
    modulosContainer.innerHTML = '';
    modulos.forEach(modulo => {
      const div = document.createElement('div');
      div.className = 'form-check';
      div.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${modulo}" id="editUsuarioModulo_${modulo}" ${(u.puedeVer || []).includes(modulo) ? 'checked' : ''}>
                <label class="form-check-label" for="editUsuarioModulo_${modulo}">
                    ${modulo.charAt(0).toUpperCase() + modulo.slice(1)}
                </label>
            `;
      modulosContainer.appendChild(div);
    });
  }

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editUsuarioModal'));
  modal.show();
};

window.verDetallesUsuario = function (id) {
  const u = (window.configuracionManager.getUsuarios() || []).find(x => x.id === id);
  if (!u) {
    alert('Usuario no encontrado');
    return;
  }

  // Obtener módulos que puede ver
  const modulosVer = u.puedeVer || [];
  const modulosVerTexto = modulosVer.length > 0 ? modulosVer.join(', ') : 'Ninguno';

  // Verificar si puede aprobar
  const puedeAprobar = u.puedeAprobarSolicitudes || false;

  // Obtener contraseña de aprobación (puede estar en el usuario o en localStorage)
  let passwordAprobacion = u.passwordAprobacion || '';
  if (!passwordAprobacion) {
    try {
      const config = JSON.parse(localStorage.getItem('sistema_config') || '{}');
      passwordAprobacion = config.passwordAprobacion || '';
    } catch (e) {
      console.warn('Error obteniendo contraseña de aprobación:', e);
    }
  }

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
                  ${u.nombre || '-'}
                </div>
                <div class="col-md-6">
                  <strong>Email:</strong><br>
                  ${u.email || '-'}
                </div>
                <div class="col-md-6">
                  <strong>Contraseña:</strong><br>
                  <div class="input-group">
                    <input type="password" class="form-control" id="passwordUsuarioDetalle" value="${u.password || ''}" readonly style="background-color: #f8f9fa;">
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
  u.fechaCreacion
    ? `
                <div class="col-md-6">
                  <strong>Fecha de Creación:</strong><br>
                  ${new Date(u.fechaCreacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                `
    : ''
}
                ${
  u.fechaActualizacion
    ? `
                <div class="col-md-6">
                  <strong>Última Actualización:</strong><br>
                  ${new Date(u.fechaActualizacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                `
    : ''
}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" class="btn btn-danger" onclick="descargarPDFUsuario(${u.id})" title="Descargar PDF">
                <i class="fas fa-file-pdf"></i> PDF
              </button>
              <button type="button" class="btn btn-primary" onclick="editUsuario(${u.id}); bootstrap.Modal.getInstance(document.getElementById('verUsuarioModal')).hide();">
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
};

window.descargarPDFUsuario = async function (id) {
  const u = (window.configuracionManager.getUsuarios() || []).find(x => x.id === id);
  if (!u) {
    alert('Usuario no encontrado');
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
    doc.text(`Nombre: ${u.nombre || 'N/A'}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Email: ${u.email || 'N/A'}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Contraseña: ${u.password || 'N/A'}`, margin, yPosition);
    yPosition += 10;

    // Permisos
    doc.setFont('helvetica', 'bold');
    doc.text('PERMISOS', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    const modulosVer = u.puedeVer || [];
    const modulosVerTexto = modulosVer.length > 0 ? modulosVer.join(', ') : 'Ninguno';
    doc.text(`Módulos que puede ver: ${modulosVerTexto}`, margin, yPosition);
    yPosition += 7;

    const puedeAprobar = u.puedeAprobarSolicitudes || false;
    doc.text(`Puede aprobar solicitudes: ${puedeAprobar ? 'Sí' : 'No'}`, margin, yPosition);
    yPosition += 7;

    // Obtener contraseña de aprobación
    let passwordAprobacion = u.passwordAprobacion || '';
    if (!passwordAprobacion) {
      try {
        const config = JSON.parse(localStorage.getItem('sistema_config') || '{}');
        passwordAprobacion = config.passwordAprobacion || '';
      } catch (e) {
        console.warn('Error obteniendo contraseña de aprobación:', e);
      }
    }

    if (puedeAprobar && passwordAprobacion) {
      doc.text(`Contraseña de Aprobación: ${passwordAprobacion}`, margin, yPosition);
      yPosition += 7;
    }
    yPosition += 5;

    // Fechas
    if (u.fechaCreacion || u.fechaActualizacion) {
      doc.setFont('helvetica', 'bold');
      doc.text('FECHAS', margin, yPosition);
      yPosition += 10;

      doc.setFont('helvetica', 'normal');
      if (u.fechaCreacion) {
        const fechaCreacion = new Date(u.fechaCreacion).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text(`Fecha de Creación: ${fechaCreacion}`, margin, yPosition);
        yPosition += 7;
      }
      if (u.fechaActualizacion) {
        const fechaActualizacion = new Date(u.fechaActualizacion).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.text(`Última Actualización: ${fechaActualizacion}`, margin, yPosition);
        yPosition += 7;
      }
    }

    // Guardar PDF
    const fileName = `Usuario_${(u.email || u.id).toString().replace('@', '_').replace('.', '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('❌ Error generando PDF del usuario:', error);
    alert('Error al generar el PDF del usuario');
  }
};

window.deleteUsuario = function (idOrEmail) {
  if (!confirm('¿Eliminar usuario?')) {
    return;
  }
  if (window.configuracionManager.deleteUsuario(idOrEmail)) {
    loadUsuariosTable();
  }
};

window.clearUsuarioForm = function () {
  document.getElementById('usuarioForm')?.reset();
  renderModulosCheckboxes();

  // Limpiar checkbox de aprobación
  const puedeAprobarCheckbox = document.getElementById('puedeAprobarSolicitudes');
  if (puedeAprobarCheckbox) {
    puedeAprobarCheckbox.checked = false;
  }
};

window.toggleUsuarioPassword = function () {
  const input = document.getElementById('usuarioPassword');
  const icon = document.getElementById('iconUsuarioPassword');
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

window.toggleUsuarioConfirmPassword = function () {
  const input = document.getElementById('usuarioConfirmPassword');
  const icon = document.getElementById('iconUsuarioConfirmPassword');
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

// Validar confirmación de contraseña en tiempo real
window.validarConfirmacionPassword = function () {
  const password = document.getElementById('usuarioPassword')?.value || '';
  const confirmPassword = document.getElementById('usuarioConfirmPassword')?.value || '';
  const confirmInput = document.getElementById('usuarioConfirmPassword');

  if (!confirmInput) {
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    confirmInput.setCustomValidity('Las contraseñas no coinciden');
    confirmInput.classList.add('is-invalid');
  } else {
    confirmInput.setCustomValidity('');
    confirmInput.classList.remove('is-invalid');
    if (confirmPassword) {
      confirmInput.classList.add('is-valid');
    }
  }
};

window.selectAllPermisos = function () {
  document
    .querySelectorAll('#modulosVerContainer input[type="checkbox"]')
    .forEach(el => (el.checked = true));
};

window.exportUsuarios = function () {
  const usuarios = window.configuracionManager.getUsuarios() || [];
  if (usuarios.length === 0) {
    alert('No hay usuarios para exportar');
    return;
  }

  const csvContent = [
    ['Nombre', 'Email', 'Puede Ver', 'Fecha Creación'],
    ...usuarios.map(u => [
      u.nombre || '',
      u.email || '',
      (u.puedeVer || []).join(', '),
      u.fechaCreacion ? new Date(u.fechaCreacion).toLocaleDateString() : ''
    ])
  ]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Inicializar listas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 Configuración cargada, inicializando listas...');

  // Mostrar tenantId actual al cargar la página
  setTimeout(async () => {
    try {
      // Obtener tenantId usando la misma lógica
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

      console.log(
        '%c═══════════════════════════════════════════════════════════',
        'color: #4CAF50; font-weight: bold;'
      );
      console.log(
        '%c🔑 TENANT ID ACTUAL EN CONFIGURACIÓN',
        'background: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; font-size: 16px;'
      );
      console.log(`%c   ${tenantId}`, 'color: #2196F3; font-weight: bold; font-size: 18px;');
      console.log(
        '%c═══════════════════════════════════════════════════════════',
        'color: #4CAF50; font-weight: bold;'
      );
      console.log(
        '💡 Tip: Puedes usar mostrarTenantIdActual() en la consola para ver el tenantId en cualquier momento'
      );
    } catch (error) {
      console.warn('⚠️ Error mostrando tenantId:', error);
    }
  }, 1500);

  // Si estamos en modo demo, asegurarnos de que los datos se hayan cargado
  if (window.demoDataLoader && window.demoDataLoader.isDemoMode) {
    console.log('🔄 Modo demo detectado, asegurando que los datos estén cargados...');

    // Esperar a que Firebase esté listo
    let attempts = 0;
    while ((!window.firebaseDb || !window.fs || !window.configuracionManager) && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }

    await window.demoDataLoader.initialize();
    // Esperar un poco más para que Firebase se sincronice
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Forzar recarga de datos desde Firebase (con múltiples intentos)
    console.log('🔄 Forzando recarga de datos desde Firebase...');

    // Intentar cargar varias veces para asegurar que los datos estén disponibles
    for (let i = 0; i < 3; i++) {
      console.log(`🔄 Intento ${i + 1} de recarga...`);
      if (window.loadOperadoresTable) {
        await window.loadOperadoresTable();
      }
      if (window.loadClientesTable) {
        await window.loadClientesTable();
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // También cargar económicos y proveedores
    if (window.loadEconomicosTable) {
      await window.loadEconomicosTable();
    }
    if (window.loadProveedoresTable) {
      await window.loadProveedoresTable();
    }
  }

  // Cargar listas de selects y tablas
  setTimeout(async () => {
    if (window.economicosRepo) {
      // Suscripción en tiempo real a Firestore
      try {
        if (window.__economicosUnsub) {
          window.__economicosUnsub();
        }
        window.__economicosUnsub = window.economicosRepo.subscribe(list => {
          window.__economicosCache = list;
          window.loadEconomicos();
          window.loadEconomicosTable();
        });
        // Sembrar datos demo si aplica
        try {
          window.seedDemoEconomicos && window.seedDemoEconomicos();
        } catch (_) {
          // Ignorar error intencionalmente
        }
      } catch (e) {
        console.warn('No se pudo suscribir a economicosRepo:', e);
      }
    } else {
      window.loadEconomicos();
      await window.loadEconomicosTable();
    }
    window.loadOperadores();
    window.loadClientes();
    (async () => {
      await window.loadOperadoresTable();
      await window.loadClientesTable();
      await window.loadProveedoresTable();
    })();
  }, 500);
});

// Cargar económicos en la tabla
window.loadEconomicosTable = async function () {
  const tbody = document.getElementById('economicosTableBody');

  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="9" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  let economicos = [];

  // PRIORIDAD 1: Cargar desde Firebase si está disponible
  if (window.firebaseDb && window.fs) {
    try {
      // Obtener tenantId actual (misma lógica que configuracion-firebase.js)
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

      console.log('📊 Cargando económicos desde Firebase...');
      console.log('🔑 TenantId:', tenantId);
      const tractocamionesDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'tractocamiones'
      );
      const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

      if (tractocamionesDoc.exists()) {
        const data = tractocamionesDoc.data();
        if (data.economicos && Array.isArray(data.economicos)) {
          // CRÍTICO: Filtrar económicos por tenantId individual para mantener privacidad
          economicos = data.economicos.filter(economico => {
            const economicoTenantId = economico.tenantId;
            // Todos los usuarios solo ven económicos con su tenantId exacto
            return economicoTenantId === tenantId;
          });

          console.log(
            `🔒 Económicos filtrados por tenantId (${tenantId}): ${economicos.length} de ${data.economicos.length} totales`
          );
          // Actualizar caché global
          window.__economicosCache = economicos;
          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setEconomicos(economicos);
          }
          console.log(`✅ ${economicos.length} económicos cargados desde Firebase`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando económicos desde Firebase:', error);
    }
  }

  // PRIORIDAD 2: Si no hay datos en Firebase, usar getEconomicos()
  if (economicos.length === 0) {
    economicos = window.getEconomicos() || [];
    console.log(`📊 ${economicos.length} económicos cargados desde getEconomicos()`);
  }

  tbody.innerHTML = '';

  if (economicos && economicos.length > 0) {
    economicos.forEach(economico => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${economico.numero}</td>
                <td>${economico.placaTracto || ''}</td>
                <td>${economico.placaRemolque || ''}</td>
                <td>${economico.marca} ${economico.modelo}</td>
                <td>${economico.año || ''}</td>
                <td>${economico.operadorAsignado || ''}</td>
                <td><span class="badge bg-${economico.estadoVehiculo === 'activo' ? 'success' : 'warning'}">${economico.estadoVehiculo || 'N/A'}</span></td>
                <td>${economico.fechaCreacion ? new Date(economico.fechaCreacion).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditEconomicoModal('${economico.numero}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteEconomicoFromTable('${economico.numero}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center text-muted">No hay económicos registrados</td></tr>';
  }

  // Actualizar contadores
  updateEconomicosCounters(economicos);
};

// Función para actualizar los contadores de económicos
function updateEconomicosCounters(economicos) {
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

// Función para actualizar los contadores de operadores
function updateOperadoresCounters(operadores) {
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

// Función para actualizar los contadores de clientes
function updateClientesCounters(clientes) {
  const total = clientes ? clientes.length : 0;
  const activos = clientes ? clientes.filter(c => c.estado === 'activo' || !c.estado).length : 0;
  const inactivos = clientes ? clientes.filter(c => c.estado === 'inactivo').length : 0;

  const totalElement = document.getElementById('totalClientes');
  const activosElement = document.getElementById('activosClientes');
  const inactivosElement = document.getElementById('inactivosClientes');

  if (totalElement) {
    totalElement.textContent = total;
  }
  if (activosElement) {
    activosElement.textContent = activos;
  }
  if (inactivosElement) {
    inactivosElement.textContent = inactivos;
  }
}

// Función para actualizar los contadores de proveedores
function updateProveedoresCounters(proveedores) {
  const total = proveedores ? proveedores.length : 0;
  const activos = proveedores
    ? proveedores.filter(p => p.estado === 'activo' || !p.estado).length
    : 0;
  const inactivos = proveedores ? proveedores.filter(p => p.estado === 'inactivo').length : 0;

  const totalElement = document.getElementById('totalProveedores');
  const activosElement = document.getElementById('activosProveedores');
  const inactivosElement = document.getElementById('inactivosProveedores');

  if (totalElement) {
    totalElement.textContent = total;
  }
  if (activosElement) {
    activosElement.textContent = activos;
  }
  if (inactivosElement) {
    inactivosElement.textContent = inactivos;
  }
}

// Cargar operadores en la tabla
window.loadOperadoresTable = async function () {
  const tbody = document.getElementById('operadoresTableBody');

  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="9" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  let operadores = [];

  // PRIORIDAD 1: Cargar desde Firebase si está disponible
  if (window.firebaseDb && window.fs) {
    try {
      // Obtener tenantId actual (misma lógica que configuracion-firebase.js)
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

      console.log('📊 Cargando operadores desde Firebase...');
      console.log('🔑 TenantId:', tenantId);

      const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
      const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

      if (operadoresDoc.exists()) {
        const data = operadoresDoc.data();
        console.log('📋 Datos del documento operadores:', {
          tieneOperadores: Boolean(data.operadores),
          esArray: Array.isArray(data.operadores),
          cantidad: data.operadores?.length || 0,
          tenantId: data.tenantId
        });

        if (data.operadores && Array.isArray(data.operadores)) {
          // CRÍTICO: Filtrar operadores por tenantId individual para mantener privacidad
          operadores = data.operadores.filter(operador => {
            const operadorTenantId = operador.tenantId;
            // Todos los usuarios solo ven operadores con su tenantId exacto
            return operadorTenantId === tenantId;
          });

          console.log(
            `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${data.operadores.length} totales`
          );

          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setOperadores(operadores);
            console.log('✅ Operadores sincronizados con localStorage');
          }
          console.log(`✅ ${operadores.length} operadores cargados desde Firebase`);
        } else {
          console.warn('⚠️ data.operadores no es un array válido:', typeof data.operadores);
        }
      } else {
        console.warn('⚠️ El documento configuracion/operadores no existe en Firebase');
      }
    } catch (error) {
      console.error('❌ Error cargando operadores desde Firebase:', error);
    }
  }

  // PRIORIDAD 2: Si no hay datos en Firebase, cargar desde localStorage
  if (operadores.length === 0) {
    console.log('📊 No hay datos en Firebase, cargando desde localStorage...');
    if (window.configuracionManager) {
      const operadoresData = window.configuracionManager.getAllOperadores();
      operadores = Array.isArray(operadoresData) ? operadoresData : [];
      console.log(
        `📊 ${operadores.length} operadores cargados desde localStorage (getAllOperadores)`
      );
    }

    // Si aún no hay datos, intentar con getOperadores()
    if (operadores.length === 0) {
      try {
        const operadoresData = await window.getOperadores();
        operadores = Array.isArray(operadoresData) ? operadoresData : [];
        console.log(`📊 ${operadores.length} operadores cargados desde getOperadores()`);
      } catch (error) {
        console.warn('⚠️ Error en getOperadores():', error);
      }
    }
  }

  console.log(`📋 Total de operadores a mostrar: ${operadores.length}`);
  if (operadores.length > 0) {
    console.log(
      '📋 Primeros operadores:',
      operadores.slice(0, 3).map(o => ({
        nombre: o.nombre,
        licencia: o.licencia,
        rfc: o.rfc
      }))
    );
  }

  tbody.innerHTML = '';

  if (operadores && operadores.length > 0) {
    operadores.forEach(operador => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${operador.nombre || ''}</td>
                <td>${operador.licencia || ''}</td>
                <td>${operador.seguroSocial || ''}</td>
                <td>${operador.tipoOperador || ''}</td>
                <td><span class="badge bg-${operador.estadoOperador === 'activo' ? 'success' : 'warning'}">${operador.estadoOperador || 'N/A'}</span></td>
                <td>${operador.telefono || ''}</td>
                <td>${operador.fechaIngreso ? new Date(operador.fechaIngreso).toLocaleDateString() : 'N/A'}</td>
                <td>${operador.fechaCreacion ? new Date(operador.fechaCreacion).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editOperador('${operador.rfc || operador.licencia}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOperadorFromTable('${operador.licencia}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center text-muted">No hay operadores registrados</td></tr>';
  }

  // Actualizar contadores
  updateOperadoresCounters(operadores);
};

// Cargar clientes en la tabla
window.loadClientesTable = async function () {
  const tbody = document.getElementById('clientesTableBody');

  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="10" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  // Verificar si se limpiaron los datos intencionalmente
  const datosLimpiados = localStorage.getItem('configuracion_limpiada_intencionalmente');
  if (datosLimpiados === 'true') {
    console.log('ℹ️ Clientes no se cargarán porque se limpiaron intencionalmente');
    tbody.innerHTML =
      '<tr><td colspan="10" class="text-center text-muted">No hay clientes registrados</td></tr>';
    if (window.configuracionManager) {
      window.configuracionManager.setClientes([]);
    }
    return;
  }

  let clientes = [];

  // PRIORIDAD 1: Cargar desde Firebase si está disponible
  if (window.firebaseDb && window.fs) {
    try {
      // Obtener tenantId actual (misma lógica que configuracion-firebase.js)
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

      console.log('📊 Cargando clientes desde Firebase...');
      console.log('🔑 TenantId:', tenantId);

      // PRIORIDAD 1A: Intentar cargar desde configuracion/clientes (documento)
      const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
      const clientesDoc = await window.fs.getDoc(clientesDocRef);

      if (clientesDoc.exists()) {
        const data = clientesDoc.data();

        // Verificar si el documento fue limpiado definitivamente
        if (data.limpiadoDefinitivamente === true) {
          console.log(
            'ℹ️ Clientes no se cargarán porque el documento fue limpiado definitivamente'
          );
          tbody.innerHTML =
            '<tr><td colspan="10" class="text-center text-muted">No hay clientes registrados</td></tr>';
          if (window.configuracionManager) {
            window.configuracionManager.setClientes([]);
          }
          return;
        }

        console.log('📋 Datos del documento configuracion/clientes:', {
          tieneClientes: Boolean(data.clientes),
          esArray: Array.isArray(data.clientes),
          cantidad: data.clientes?.length || 0,
          tenantId: data.tenantId
        });

        if (data.clientes && Array.isArray(data.clientes) && data.clientes.length > 0) {
          // CRÍTICO: Filtrar clientes por tenantId individual para mantener privacidad
          clientes = data.clientes.filter(cliente => {
            const clienteTenantId = cliente.tenantId;
            // Todos los usuarios solo ven clientes con su tenantId exacto
            return clienteTenantId === tenantId;
          });

          console.log(
            `🔒 Clientes filtrados por tenantId (${tenantId}): ${clientes.length} de ${data.clientes.length} totales`
          );

          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setClientes(clientes);
            console.log('✅ Clientess sincronizados con localStorage');
          }
        }
      }

      // PRIORIDAD 1B: Si no hay clientes en configuracion/clientes, intentar desde la colección clientes (raíz)
      // SOLO si no se limpiaron los datos intencionalmente
      if (clientes.length === 0 && datosLimpiados !== 'true') {
        console.log(
          '📊 No hay clientes en configuracion/clientes, intentando desde colección clientes...'
        );
        try {
          const clientesCollectionRef = window.fs.collection(window.firebaseDb, 'clientes');
          // Buscar clientes con el tenantId actual (no hardcodeado)
          const querySnapshot = await window.fs.getDocs(
            window.fs.query(clientesCollectionRef, window.fs.where('tenantId', '==', tenantId))
          );

          if (!querySnapshot.empty) {
            clientes = querySnapshot.docs.map(doc => doc.data());
            console.log(
              `✅ ${clientes.length} clientes cargados desde colección clientes (tenantId: ${tenantId})`
            );

            // Sincronizar con localStorage
            if (window.configuracionManager) {
              window.configuracionManager.setClientes(clientes);
              console.log('✅ Clientess sincronizados con localStorage');
            }

            // Migrar a configuracion/clientes para futuras cargas
            console.log('🔄 Migrando clientes a configuracion/clientes...');
            await window.fs.setDoc(clientesDocRef, {
              clientes: clientes.map(c => ({ ...c, tenantId: tenantId })),
              tenantId: tenantId,
              updatedAt: new Date().toISOString()
            });
            console.log('✅ Clientess migrados a configuracion/clientes');
          } else {
            console.warn(
              `⚠️ No se encontraron clientes en la colección clientes con tenantId: ${tenantId}`
            );
          }
        } catch (error) {
          console.warn('⚠️ Error cargando desde colección clientes:', error);
        }
      } else if (datosLimpiados === 'true') {
        console.log(
          'ℹ️ No se cargarán clientes desde la colección raíz porque se limpiaron intencionalmente'
        );
      }
    } catch (error) {
      console.error('❌ Error cargando clientes desde Firebase:', error);
    }
  }

  // PRIORIDAD 2: Si no hay datos en Firebase, cargar desde localStorage
  if (clientes.length === 0) {
    console.log('📊 No hay datos en Firebase, cargando desde localStorage...');
    if (window.configuracionManager) {
      const clientesData = window.configuracionManager.getAllClientes();
      clientes = Array.isArray(clientesData) ? clientesData : [];
      console.log(`📊 ${clientes.length} clientes cargados desde localStorage (getAllClientes)`);
    }

    // Si aún no hay datos, intentar con getClientes()
    if (clientes.length === 0) {
      try {
        const clientesData = await window.getClientes();
        clientes = Array.isArray(clientesData) ? clientesData : [];
        console.log(`📊 ${clientes.length} clientes cargados desde getClientes()`);
      } catch (error) {
        console.warn('⚠️ Error en getClientes():', error);
      }
    }
  }

  console.log(`📋 Total de clientes a mostrar: ${clientes.length}`);
  if (clientes.length > 0) {
    console.log(
      '📋 Primeros clientes:',
      clientes.slice(0, 3).map(c => ({
        nombre: c.nombre,
        rfc: c.rfc
      }))
    );
  }

  tbody.innerHTML = '';

  if (clientes && clientes.length > 0) {
    clientes.forEach(cliente => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${cliente.nombre || ''}</td>
                <td>${cliente.rfc || ''}</td>
                <td>${cliente.contacto || ''}</td>
                <td>${cliente.telefono || ''}</td>
                <td>${cliente.email || ''}</td>
                <td>${cliente.tipoCliente || ''}</td>
                <td><span class="badge bg-${cliente.estadoComercial === 'Activo' ? 'success' : 'warning'}">${cliente.estadoComercial || 'N/A'}</span></td>
                <td>${cliente.ciudad || ''}</td>
                <td>${cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editCliente('${cliente.rfc}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteClienteFromTable('${cliente.rfc}')">
                        <i class="fas fa-trash"></i>
                    </button>
            </td>
            `;
      tbody.appendChild(row);
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="10" class="text-center text-muted">No hay clientes registrados</td></tr>';
  }

  // Actualizar contadores
  updateClientesCounters(clientes);
};

// Cargar proveedores en la tabla
window.loadProveedoresTable = async function () {
  const tbody = document.getElementById('proveedoresTableBody');

  if (!tbody) {
    return;
  }

  tbody.innerHTML =
    '<tr><td colspan="8" class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

  let proveedores = [];

  // PRIORIDAD 1: Cargar desde Firebase si está disponible
  if (window.firebaseDb && window.fs) {
    try {
      // Obtener tenantId actual (misma lógica que configuracion-firebase.js)
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

      console.log('📊 Cargando proveedores desde Firebase...');
      console.log('🔑 TenantId:', tenantId);

      const proveedoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'proveedores');
      const proveedoresDoc = await window.fs.getDoc(proveedoresDocRef);

      if (proveedoresDoc.exists()) {
        const data = proveedoresDoc.data();
        console.log('📋 Datos del documento proveedores:', {
          tieneProveedores: Boolean(data.proveedores),
          esArray: Array.isArray(data.proveedores),
          cantidad: data.proveedores?.length || 0,
          tenantId: data.tenantId
        });

        if (data.proveedores && Array.isArray(data.proveedores)) {
          // CRÍTICO: Filtrar proveedores por tenantId individual para mantener privacidad
          const todosLosProveedores = data.proveedores;
          proveedores = todosLosProveedores.filter(proveedor => {
            const proveedorTenantId = proveedor.tenantId;
            // Todos los usuarios solo ven proveedores con su tenantId exacto
            return proveedorTenantId === tenantId;
          });

          console.log(
            `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedores.length} de ${todosLosProveedores.length} totales`
          );

          // Sincronizar con localStorage
          if (window.configuracionManager) {
            window.configuracionManager.setProveedores(proveedores);
            console.log('✅ Proveedores sincronizados con localStorage');
          }
        } else {
          console.warn('⚠️ data.proveedores no es un array válido:', typeof data.proveedores);
        }
      } else {
        console.warn('⚠️ El documento configuracion/proveedores no existe en Firebase');
      }
    } catch (error) {
      console.error('❌ Error cargando proveedores desde Firebase:', error);
    }
  }

  // PRIORIDAD 2: Si no hay datos en Firebase, cargar desde localStorage
  if (proveedores.length === 0) {
    console.log('📊 No hay datos en Firebase, cargando desde localStorage...');
    if (window.configuracionManager) {
      const todosLosProveedores = window.configuracionManager.getProveedores();
      const proveedoresData = Array.isArray(todosLosProveedores) ? todosLosProveedores : [];

      // CRÍTICO: Filtrar por tenantId también desde localStorage
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

      proveedores = proveedoresData.filter(proveedor => {
        const proveedorTenantId = proveedor.tenantId;
        return proveedorTenantId === tenantId;
      });

      console.log(
        `🔒 Proveedores filtrados por tenantId (${tenantId}): ${proveedores.length} de ${proveedoresData.length} totales`
      );
    }
  }

  console.log(`📋 Total de proveedores a mostrar: ${proveedores.length}`);
  if (proveedores.length > 0) {
    console.log(
      '📋 Primeros proveedores:',
      proveedores.slice(0, 3).map(p => ({
        nombre: p.nombre,
        rfc: p.rfc
      }))
    );
  }

  tbody.innerHTML = '';

  if (proveedores && proveedores.length > 0) {
    proveedores.forEach(proveedor => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${proveedor.nombre || ''}</td>
                <td>${proveedor.rfc || ''}</td>
                <td>${proveedor.contacto || ''}</td>
                <td>${proveedor.telefono || ''}</td>
                <td>${proveedor.email || ''}</td>
                <td><span class="badge bg-${proveedor.estado === 'Activo' || proveedor.estado === 'activo' ? 'success' : 'warning'}">${proveedor.estado || 'N/A'}</span></td>
                <td>${proveedor.diasCredito || ''}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editProveedor('${proveedor.rfc}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProveedorFromTable('${proveedor.rfc}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
      tbody.appendChild(row);
    });
  } else {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-muted">No hay proveedores registrados</td></tr>';
  }

  // Actualizar contadores
  updateProveedoresCounters(proveedores);
};

// === FUNCIONES DE EDICIÓN Y ELIMINACIÓN ===

// Abrir modal de edición de económico
window.openEditEconomicoModal = function (numero) {
  console.log('🔧 Abriendo modal de edición para económico:', numero);
  const economico = window.getEconomico(numero);
  if (!economico) {
    alert('No se encontró el económico para editar');
    return;
  }

  // Llenar el formulario del modal
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val ?? '';
    }
  };

  setVal('editNumeroEconomico', economico.numero);
  setVal('editTipoVehiculo', economico.tipoVehiculo);
  setVal('editPlacaTracto', economico.placaTracto || economico.placas || '');
  setVal('editPlacaRemolque', economico.placaRemolque);
  setVal('editEstadoPlacas', economico.estadoPlacas);
  setVal('editMarca', economico.marca);
  setVal('editModelo', economico.modelo);
  setVal('editAño', economico.año);
  setVal('editEstadoVehiculo', economico.estadoVehiculo);
  setVal('editObservaciones', economico.observaciones);

  // Guardar el número original para la actualización
  window.__editingEconomicoNumero = numero;

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editEconomicoModal'));
  modal.show();
};

// Guardar cambios del modal de edición
window.saveEditedEconomico = function () {
  console.log('💾 Guardando cambios del económico editado...');

  const getVal = id => document.getElementById(id)?.value || '';
  const economico = {
    numero: getVal('editNumeroEconomico'),
    tipoVehiculo: getVal('editTipoVehiculo'),
    placaTracto: getVal('editPlacaTracto'),
    placaRemolque: getVal('editPlacaRemolque'),
    estadoPlacas: getVal('editEstadoPlacas'),
    marca: getVal('editMarca'),
    modelo: getVal('editModelo'),
    año: getVal('editAño'),
    estadoVehiculo: getVal('editEstadoVehiculo'),
    observaciones: getVal('editObservaciones')
  };

  if (!economico.numero) {
    alert('El número de económico es requerido');
    return;
  }

  if (window.economicosRepo) {
    // Guardar en Firestore
    window.economicosRepo
      .save(economico)
      .then(() => {
        window.configuracionManager.showNotification(
          'Económico actualizado exitosamente',
          'success'
        );
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editEconomicoModal'));
        modal.hide();
        // Limpiar variable temporal
        window.__editingEconomicoNumero = null;
      })
      .catch(err => {
        console.error('Error guardando económico en Firestore:', err);
        window.configuracionManager.showNotification('Error al actualizar económico', 'error');
      });
  } else {
    // Fallback local
    const ok = window.configuracionManager.saveEconomico(economico);
    if (ok) {
      window.configuracionManager.showNotification('Económico actualizado exitosamente', 'success');
      const modal = bootstrap.Modal.getInstance(document.getElementById('editEconomicoModal'));
      modal.hide();
      window.__editingEconomicoNumero = null;
    } else {
      window.configuracionManager.showNotification('Error al actualizar económico', 'error');
    }
  }
};

// Asegurar que la pestaña de Económicos esté visible antes de editar
function ensureEconomicosTabVisible(whenVisibleCallback) {
  try {
    const economicosTabBtn = document.querySelector('#economicos-tab');
    const economicosPane = document.getElementById('economicos');
    const isActive = economicosPane && economicosPane.classList.contains('active');
    if (!isActive && economicosTabBtn) {
      economicosTabBtn.click();
    }
    // Dar un pequeño tiempo para que Bootstrap aplique clases y renderice
    setTimeout(() => {
      if (typeof whenVisibleCallback === 'function') {
        whenVisibleCallback();
      }
    }, 50);
  } catch (e) {
    console.warn('⚠️ No se pudo forzar la visibilidad de la pestaña Económicos:', e);
    if (typeof whenVisibleCallback === 'function') {
      whenVisibleCallback();
    }
  }
}

// Función de diagnóstico para el botón de editar económicos
window.diagnosticarEditEconomico = function () {
  console.log('🔍 Diagnosticando botón de editar económicos...');
  const economicos = window.getEconomicos();
  console.log('📊 Total económicos:', economicos.length);
  if (economicos.length > 0) {
    const economico = economicos[0];
    console.log('📋 Primer económico:', economico);
    console.log('🔧 Probando editEconomico con número:', economico.numero);
    try {
      window.editEconomico(economico.numero);
      console.log('✅ editEconomico ejecutado sin errores');
      // Verificar si los campos se llenaron
      const numeroField = document.getElementById('numeroEconomico');
      const placaField = document.getElementById('placaTracto');
      console.log(
        '📝 Campo número llenado:',
        numeroField ? numeroField.value : 'Campo no encontrado'
      );
      console.log('📝 Campo placa llenado:', placaField ? placaField.value : 'Campo no encontrado');
    } catch (error) {
      console.error('❌ Error en editEconomico:', error);
    }
  } else {
    console.log('⚠️ No hay económicos para probar');
  }
};

// Editar económico
window.editEconomico = function (numero) {
  console.log('🔧 editEconomico llamado con número:', numero);
  const economico = window.getEconomico(numero);
  console.log('📋 Económico encontrado:', economico);
  if (!economico) {
    console.log('❌ No se encontró el económico');
    return;
  }

  ensureEconomicosTabVisible(() => {
    // Campos principales
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = val ?? '';
        console.log(`📝 Campo ${id} llenado con:`, val ?? '');
      } else {
        console.log(`❌ Campo ${id} no encontrado en el DOM`);
      }
    };

    // Si los campos aún no están listos, reintentar una vez más tras un breve delay
    const tryFill = (attempt = 1) => {
      const numeroEl = document.getElementById('numeroEconomico');
      if (!numeroEl && attempt <= 2) {
        setTimeout(() => tryFill(attempt + 1), 100);
        return;
      }

      setVal('numeroEconomico', economico.numero);
      setVal('tipoVehiculo', economico.tipoVehiculo);
      // Placas y estado
      setVal('placaTracto', economico.placaTracto || economico.placas || '');
      setVal('placaRemolque', economico.placaRemolque);
      setVal('estadoPlacas', economico.estadoPlacas);
      // Permisos/seguros
      setVal('permisoSCT', economico.permisoSCT);
      setVal('fechaVencimientoSCT', economico.fechaVencimientoSCT);
      setVal('seguroVehicular', economico.seguroVehicular);
      setVal('fechaVencimientoSeguro', economico.fechaVencimientoSeguro);
      // Especificaciones técnicas
      setVal('marca', economico.marca);
      setVal('modelo', economico.modelo);
      setVal('año', economico.año);
      setVal('capacidadCarga', economico.capacidadCarga);
      setVal('numeroMotor', economico.numeroMotor);
      // Operador asignado
      setVal('operadorAsignado', economico.operadorAsignado);
      setVal('telefonoOperador', economico.telefonoOperador);
      // Estado y observaciones
      setVal('estadoVehiculo', economico.estadoVehiculo);
      setVal(
        'fechaRegistro',
        economico.fechaCreacion ? new Date(economico.fechaCreacion).toLocaleDateString() : ''
      );
      setVal('observaciones', economico.observaciones);

      // Cambiar el botón a modo edición (usar botón de Actualizar del formulario)
      const updateBtn = document.querySelector('#economicoForm button.btn-outline-warning');
      if (updateBtn) {
        updateBtn.onclick = () => window.updateEconomico();
        console.log('✅ Botón de actualizar configurado');
      } else {
        console.log('❌ Botón de actualizar no encontrado');
      }
      console.log('✅ editEconomico completado exitosamente');
    };

    tryFill();
  });
};

// Actualizar económico
window.updateEconomico = function () {
  console.log('🛠️ Iniciando actualización de económico...');
  const getVal = id => document.getElementById(id)?.value || '';
  const economico = {
    numero: getVal('numeroEconomico'),
    tipoVehiculo: getVal('tipoVehiculo'),
    placaTracto: getVal('placaTracto'),
    placaRemolque: getVal('placaRemolque'),
    estadoPlacas: getVal('estadoPlacas'),
    permisoSCT: getVal('permisoSCT'),
    fechaVencimientoSCT: getVal('fechaVencimientoSCT'),
    seguroVehicular: getVal('seguroVehicular'),
    fechaVencimientoSeguro: getVal('fechaVencimientoSeguro'),
    marca: getVal('marca'),
    modelo: getVal('modelo'),
    año: getVal('año'),
    capacidadCarga: getVal('capacidadCarga'),
    numeroMotor: getVal('numeroMotor'),
    operadorAsignado: getVal('operadorAsignado'),
    telefonoOperador: getVal('telefonoOperador'),
    estadoVehiculo: getVal('estadoVehiculo'),
    observaciones: getVal('observaciones')
  };
  console.log('📦 Datos a actualizar:', economico);

  if (!economico.numero) {
    window.configuracionManager.showNotification('Número de económico requerido', 'error');
    return false;
  }

  // Usar el manager directamente para no aplicar las validaciones estrictas de alta
  if (window.economicosRepo) {
    return window.economicosRepo
      .save(economico)
      .then(() => {
        window.configuracionManager.showNotification('Económico actualizado', 'success');
        return true;
      })
      .catch(err => {
        console.error('Error guardando económico en Firestore:', err);
        window.configuracionManager.showNotification('Error al actualizar económico', 'error');
        return false;
      });
  }
  const ok = window.configuracionManager.saveEconomico(economico);
  console.log('💾 Resultado saveEconomico:', ok);
  if (ok) {
    window.configuracionManager.showNotification('Económico actualizado', 'success');
    window.loadEconomicos();
    window.loadEconomicosTable();
    return true;
  }
  window.configuracionManager.showNotification('Error al actualizar económico', 'error');
  return false;
};

// Función para eliminar económico desde la tabla (sin confirmación adicional)
window.deleteEconomicoFromTable = async function (numero) {
  if (
    confirm(
      `¿Estás seguro de que quieres eliminar el tractocamión ${numero}?\n\nEsta acción eliminará el tractocamión de:\n- Firebase (configuracion/tractocamiones y colección economicos)\n- localStorage\n- Caché global\n\nEsta acción no se puede deshacer.`
    )
  ) {
    console.log(`🗑️ Eliminando tractocamión ${numero} desde la tabla...`);

    try {
      const resultado = await window.configuracionManager.deleteEconomico(numero);

      if (resultado) {
        console.log(`✅ Tractocamión ${numero} eliminado exitosamente`);

        // Limpiar caché global explícitamente
        if (window.__economicosCache && Array.isArray(window.__economicosCache)) {
          window.__economicosCache = window.__economicosCache.filter(
            e => String(e.numero) !== String(numero)
          );
          console.log('✅ Caché global actualizado');
        }

        // Recargar listas y tablas
        window.loadEconomicos();
        window.loadEconomicosTable();

        // Forzar actualización del caché si hay suscripción
        if (window.__economicosUnsub) {
          // La suscripción debería actualizar automáticamente, pero forzamos una recarga
          setTimeout(() => {
            window.loadEconomicos();
            window.loadEconomicosTable();
          }, 500);
        }

        window.configuracionManager.showNotification(
          `Tractocamión ${numero} eliminado exitosamente`,
          'success'
        );

        // Mostrar mensaje adicional
        alert(
          `✅ Tractocamión ${numero} eliminado exitosamente de todas las ubicaciones.\n\nPor favor, recarga la página de reportes para ver los cambios.`
        );
      } else {
        console.error(`❌ Error al eliminar tractocamión ${numero}`);
        window.configuracionManager.showNotification('Error al eliminar económico', 'error');
      }
    } catch (error) {
      console.error(`❌ Error al eliminar tractocamión ${numero}:`, error);
      window.configuracionManager.showNotification(`Error al eliminar: ${error.message}`, 'error');
    }
  }
};

// Editar operador
window.editOperador = function (id) {
  const operador = window.getOperador(id);
  if (!operador) {
    alert('No se encontró el operador para editar');
    return;
  }

  // Llenar el modal
  document.getElementById('editOperadorRfcOriginal').value = operador.rfc || id;
  document.getElementById('editOperadorNombre').value = operador.nombre || '';
  document.getElementById('editOperadorLicencia').value = operador.licencia || '';
  document.getElementById('editOperadorRfc').value = operador.rfc || '';
  document.getElementById('editOperadorSeguroSocial').value = operador.seguroSocial || '';
  document.getElementById('editOperadorTelefono').value = operador.telefono || '';
  document.getElementById('editOperadorEmail').value = operador.email || '';
  document.getElementById('editOperadorTipo').value = operador.tipoOperador || '';
  document.getElementById('editOperadorEstado').value = operador.estadoOperador || '';
  document.getElementById('editOperadorFechaIngreso').value = operador.fechaIngreso
    ? operador.fechaIngreso.split('T')[0]
    : '';
  document.getElementById('editOperadorFechaNacimiento').value = operador.fechaNacimiento
    ? operador.fechaNacimiento.split('T')[0]
    : '';
  document.getElementById('editOperadorDireccion').value = operador.direccion || '';
  document.getElementById('editOperadorSalario').value = operador.salario || '';
  document.getElementById('editOperadorVencimientoLicencia').value =
    operador.fechaVencimientoLicencia ? operador.fechaVencimientoLicencia.split('T')[0] : '';
  document.getElementById('editOperadorCertificadoMedico').value = operador.certificadoMedico || '';
  document.getElementById('editOperadorVencimientoCertificado').value =
    operador.fechaVencimientoCertificado ? operador.fechaVencimientoCertificado.split('T')[0] : '';
  document.getElementById('editOperadorObservaciones').value = operador.observaciones || '';

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editOperadorModal'));
  modal.show();
};

// Actualizar operador
window.updateOperador = function () {
  const operador = {
    rfc: document.getElementById('rfcOperador').value,
    nombre: document.getElementById('nombreOperador').value,
    licencia: document.getElementById('licenciaOperador').value,
    telefono: document.getElementById('telefono').value,
    email: document.getElementById('emailOperador').value
  };

  if (window.saveOperador(operador)) {
    window.configuracionManager.showNotification('Operador actualizado', 'success');
    window.loadOperadores();
    document.getElementById('operadorForm').reset();

    // Restaurar botón
    const submitBtn = document.querySelector('#operadorForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar';
    submitBtn.onclick = null;
  } else {
    window.configuracionManager.showNotification('Error al actualizar operador', 'error');
  }
};

// Eliminar operador
window.deleteOperadorFromTable = function (licencia) {
  if (confirm('¿Estás seguro de que quieres eliminar este operador?')) {
    // Buscar el operador por licencia para obtener su RFC
    const operadores = window.configuracionManager.getAllOperadores();
    const operador = operadores.find(o => o.licencia === licencia);

    if (operador && window.configuracionManager.deleteOperador(operador.rfc)) {
      window.configuracionManager.showNotification('Operador eliminado', 'success');
      window.loadOperadores();
      window.loadEconomicosTable();
    } else {
      window.configuracionManager.showNotification('Error al eliminar operador', 'error');
    }
  }
};

// Editar cliente
window.editCliente = function (rfc) {
  const cliente = window.getCliente(rfc);
  if (!cliente) {
    alert('No se encontró el cliente para editar');
    return;
  }

  // Llenar el modal
  document.getElementById('editClienteRfcOriginal').value = cliente.rfc || rfc;
  document.getElementById('editClienteRfc').value = cliente.rfc || '';
  document.getElementById('editClienteNombre').value = cliente.nombre || '';
  document.getElementById('editClienteTelefono').value = cliente.telefono || '';
  document.getElementById('editClienteEmail').value = cliente.email || '';
  document.getElementById('editClienteContacto').value = cliente.contacto || '';
  document.getElementById('editClienteTipo').value = cliente.tipoCliente || '';
  document.getElementById('editClienteEstado').value = cliente.estadoComercial || '';
  document.getElementById('editClienteCiudad').value = cliente.ciudad || '';
  document.getElementById('editClienteLimiteCredito').value = cliente.limiteCredito || '';
  document.getElementById('editClienteDiasCredito').value = cliente.diasCredito || '';
  document.getElementById('editClienteDireccion').value = cliente.direccion || '';

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editClienteModal'));
  modal.show();
};

// Actualizar cliente
window.updateCliente = function () {
  const cliente = {
    rfc: document.getElementById('rfcCliente').value,
    nombre: document.getElementById('nombreCliente').value,
    telefono: document.getElementById('telefonoCliente').value,
    email: document.getElementById('emailCliente').value,
    direccion: document.getElementById('direccionCliente').value
  };

  if (window.saveCliente(cliente)) {
    window.configuracionManager.showNotification('Cliente actualizado', 'success');
    window.loadClientes();
    document.getElementById('clienteForm').reset();

    // Restaurar botón
    const submitBtn = document.querySelector('#clienteForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar';
    submitBtn.onclick = null;
  } else {
    window.configuracionManager.showNotification('Error al actualizar cliente', 'error');
  }
};

// Eliminar cliente
window.deleteClienteFromTable = function (rfc) {
  if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
    if (window.configuracionManager.deleteCliente(rfc)) {
      window.configuracionManager.showNotification(`Cliente ${rfc} eliminado`, 'success');
      window.loadClientes();
    } else {
      window.configuracionManager.showNotification('Error al eliminar el cliente', 'error');
    }
  }
};

// Editar proveedor
window.editProveedor = function (rfc) {
  const proveedor = window.getProveedor(rfc);
  if (!proveedor) {
    alert('No se encontró el proveedor para editar');
    return;
  }

  // Llenar el modal
  document.getElementById('editProveedorRfcOriginal').value = proveedor.rfc || rfc;
  document.getElementById('editProveedorRfc').value = proveedor.rfc || '';
  document.getElementById('editProveedorNombre').value = proveedor.nombre || '';
  document.getElementById('editProveedorContacto').value = proveedor.contacto || '';
  document.getElementById('editProveedorTelefono').value = proveedor.telefono || '';
  document.getElementById('editProveedorEmail').value = proveedor.email || '';
  document.getElementById('editProveedorEstado').value = proveedor.estado || '';
  document.getElementById('editProveedorDiasCredito').value = proveedor.diasCredito || '30';
  document.getElementById('editProveedorDireccion').value = proveedor.direccion || '';

  // Abrir el modal
  const modal = new bootstrap.Modal(document.getElementById('editProveedorModal'));
  modal.show();
};

// Agregar nuevo proveedor
window.addProveedor = async function () {
  const proveedor = {
    rfc: document.getElementById('rfcProveedor').value,
    nombre: document.getElementById('nombreProveedor').value,
    contacto: document.getElementById('contactoProveedor').value,
    telefono: document.getElementById('telefonoProveedor').value,
    email: document.getElementById('emailProveedor').value,
    estado: document.getElementById('estadoProveedor').value,
    diasCredito: document.getElementById('diasCreditoProveedor').value,
    direccion: document.getElementById('direccionProveedor').value
  };

  // Validar campos requeridos
  if (!proveedor.rfc || !proveedor.nombre) {
    alert('Por favor complete los campos requeridos (RFC y Nombre)');
    return false;
  }

  const result = await window.saveProveedor(proveedor);
  if (result) {
    window.configuracionManager.showNotification('Proveedor agregado exitosamente', 'success');
    await window.loadProveedoresTable();
    document.getElementById('proveedorForm').reset();
    return true;
  }
  window.configuracionManager.showNotification('Error al agregar proveedor', 'error');
  return false;
};

// Actualizar proveedor
window.updateProveedor = async function () {
  const proveedor = {
    rfc: document.getElementById('rfcProveedor').value,
    nombre: document.getElementById('nombreProveedor').value,
    contacto: document.getElementById('contactoProveedor').value,
    telefono: document.getElementById('telefonoProveedor').value,
    email: document.getElementById('emailProveedor').value,
    estado: document.getElementById('estadoProveedor').value,
    diasCredito: document.getElementById('diasCreditoProveedor').value,
    direccion: document.getElementById('direccionProveedor').value
  };

  const result = await window.saveProveedor(proveedor);
  if (result) {
    window.configuracionManager.showNotification('Proveedor actualizado', 'success');
    await window.loadProveedoresTable();
    document.getElementById('proveedorForm').reset();

    // Restaurar botón
    const submitBtn = document.querySelector('#proveedorForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar';
    submitBtn.onclick = null;
  } else {
    window.configuracionManager.showNotification('Error al actualizar proveedor', 'error');
  }
};

// Eliminar proveedor
window.deleteProveedorFromTable = async function (rfc) {
  if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
    // Eliminar de Firebase primero
    if (window.firebaseDb && window.fs) {
      try {
        const _tenantId = 'demo_tenant';
        const proveedoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'proveedores');
        const proveedoresDoc = await window.fs.getDoc(proveedoresDocRef);

        if (proveedoresDoc.exists()) {
          const data = proveedoresDoc.data();
          let proveedoresArray = data.proveedores || [];
          proveedoresArray = proveedoresArray.filter(p => p.rfc !== rfc);

          await window.fs.setDoc(
            proveedoresDocRef,
            {
              proveedores: proveedoresArray,
              tenantId: tenantId,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );

          console.log('✅ Proveedor eliminado de Firebase');
        }
      } catch (error) {
        console.error('❌ Error eliminando proveedor de Firebase:', error);
      }
    }

    // Eliminar de localStorage
    if (window.configuracionManager.deleteProveedor(rfc)) {
      window.configuracionManager.showNotification(`Proveedor ${rfc} eliminado`, 'success');
      await window.loadProveedoresTable();
    } else {
      window.configuracionManager.showNotification('Error al eliminar el proveedor', 'error');
    }
  }
};

// === INICIALIZACIÓN ===

document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 Configuración cargada, inicializando listas...');

  // Verificar que el ConfiguracionManager esté disponible
  if (window.configuracionManager) {
    console.log('✅ ConfiguracionManager disponible');
  } else {
    console.log('❌ ConfiguracionManager NO disponible');
  }

  // Cargar datos con un pequeño delay para asegurar que el DOM esté completamente renderizado
  setTimeout(() => {
    console.log('🔄 Inicializando componentes...');

    window.loadEconomicos();
    window.loadOperadores();
    window.loadClientes();
    (async () => {
      await window.loadProveedoresTable();
    })();
    (async () => {
      await window.loadEstanciasTable?.();
      await window.loadAlmacenesTable?.();
    })();

    // Inicializar usuarios
    console.log('👥 Inicializando sección de usuarios...');
    renderModulosCheckboxes?.();
    window.loadUsuariosTable?.();

    // Configurar event listener para el formulario de proveedores
    const proveedorForm = document.getElementById('proveedorForm');
    if (proveedorForm) {
      proveedorForm.addEventListener('submit', e => {
        e.preventDefault();
        window.addProveedor();
      });
    }
  }, 100);
});

// ===== CONFIGURACIÓN DEL SISTEMA =====

// Cargar configuración del sistema al inicializar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    loadSistemaConfig();
  }, 500);
});

// Cargar configuración del sistema
function loadSistemaConfig() {
  try {
    const config = JSON.parse(localStorage.getItem('sistema_config') || '{}');

    // Mostrar información actual
    const _currentPassword = config.passwordAprobacion || 'ASD123';
    const lastUpdate = config.lastUpdate || 'Nunca';

    const currentPasswordDisplay = document.getElementById('currentPasswordDisplay');
    const lastPasswordUpdate = document.getElementById('lastPasswordUpdate');

    if (currentPasswordDisplay) {
      currentPasswordDisplay.textContent = '••••••••';
    }
    if (lastPasswordUpdate) {
      lastPasswordUpdate.textContent = lastUpdate;
    }

    console.log('✅ Configuración del sistema cargada');
  } catch (error) {
    console.error('❌ Error cargando configuración del sistema:', error);
  }
}

// Guardar configuración del sistema
function saveSistemaConfig() {
  try {
    const password = document.getElementById('passwordAprobacion').value;
    const confirmPassword = document.getElementById('confirmPasswordAprobacion').value;

    // Validar contraseñas
    if (password !== confirmPassword) {
      alert('❌ Las contraseñas no coinciden');
      return false;
    }

    if (password.length < 4) {
      alert('❌ La contraseña debe tener al menos 4 caracteres');
      return false;
    }

    // Guardar configuración
    const config = {
      passwordAprobacion: password,
      lastUpdate: new Date().toLocaleString('es-MX')
    };

    localStorage.setItem('sistema_config', JSON.stringify(config));

    // Actualizar display
    loadSistemaConfig();

    alert('✅ Configuración guardada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
    alert('❌ Error al guardar la configuración');
    return false;
  }
}

// Obtener contraseña de aprobación
function getPasswordAprobacion() {
  try {
    const config = JSON.parse(localStorage.getItem('sistema_config') || '{}');
    return config.passwordAprobacion || 'ASD123';
  } catch (error) {
    console.error('❌ Error obteniendo contraseña:', error);
    return 'ASD123';
  }
}

// Exponer función globalmente
window.getPasswordAprobacion = getPasswordAprobacion;

// Toggle visibilidad de contraseña
function _togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(`${inputId}-icon`);

  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

// Resetear formulario del sistema
function _resetSistemaForm() {
  document.getElementById('sistemaForm').reset();
  loadSistemaConfig();
}

// Event listener para el formulario del sistema
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const sistemaForm = document.getElementById('sistemaForm');
    if (sistemaForm) {
      sistemaForm.addEventListener('submit', e => {
        e.preventDefault();
        saveSistemaConfig();
      });
    }
  }, 1000);
});

// Función para limpiar todos los datos de configuración
window.limpiarTodosLosDatosConfiguracion = async function () {
  // Confirmar acción con doble confirmación
  if (
    !confirm(
      '⚠️ ADVERTENCIA CRÍTICA:\n\nEsta acción eliminará TODOS los datos de configuración del sistema ERP.\n\nSe ELIMINARÁ:\n• Económicos (Tractocamiones)\n• Operadores\n• Clientes\n• Proveedores\n• Bancos (Cuentas Bancarias)\n• Estancias\n• Almacenes\n• Usuarios\n\nEsta acción NO se puede deshacer.\n\n¿Estás ABSOLUTAMENTE seguro?'
    )
  ) {
    return;
  }

  // Segunda confirmación
  if (
    !confirm(
      '⚠️ ÚLTIMA CONFIRMACIÓN:\n\nSe eliminarán TODOS los datos de configuración.\n\nEsto afectará:\n• Todas las listas desplegables del sistema\n• Todos los formularios que dependen de estos datos\n• Todos los registros que referencian estos datos\n\n¿Continuar de todas formas?'
    )
  ) {
    return;
  }

  console.log('🗑️ Iniciando limpieza de todos los datos de configuración...');

  try {
    // Limpiar localStorage
    console.log('🧹 Limpiando datos de configuración de localStorage...');
    const configKeys = [
      'erp_economicos',
      'erp_operadores',
      'erp_clientes',
      'erp_proveedores',
      'erp_cuentas_bancarias',
      'erp_estancias',
      'erp_almacenes',
      'erp_usuarios'
    ];

    let eliminados = 0;
    configKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        eliminados++;
        console.log(`🗑️ Eliminado de localStorage: ${key}`);
      }
    });

    // Limpiar también desde ConfiguracionManager
    if (window.configuracionManager) {
      console.log('🧹 Limpiando ConfiguracionManager...');
      window.configuracionManager.setEconomicos([]);
      window.configuracionManager.setOperadores([]);
      window.configuracionManager.setClientes([]);
      console.log('✅ Clientes limpiados en ConfiguracionManager');
      window.configuracionManager.setProveedores([]);
      window.configuracionManager.setCuentasBancarias([]);
      console.log('✅ Cuentas bancarias limpiadas en ConfiguracionManager');
      window.configuracionManager.setEstancias([]);
      window.configuracionManager.setAlmacenes([]);
      window.configuracionManager.setUsuarios([]);
      console.log('✅ ConfiguracionManager completamente limpiado');
    }

    // Marcar que se limpiaron los datos intencionalmente ANTES de recargar tablas
    // Esto evita que se agreguen datos de ejemplo automáticamente
    localStorage.setItem('configuracion_limpiada_intencionalmente', 'true');
    localStorage.setItem('bancos_datos_ejemplo_deshabilitados', 'true');
    console.log(
      '🏷️ Marcado: datos de configuración limpiados intencionalmente (no se agregarán datos de ejemplo)'
    );

    // Limpiar Firebase
    if (window.firebaseDb && window.fs) {
      console.log('🔥 Limpiando datos de configuración de Firebase...');
      const _tenantId = 'demo_tenant';

      const configDocs = [
        'tractocamiones',
        'operadores',
        'clientes',
        'proveedores',
        'cuentas_bancarias',
        'estancias',
        'almacenes',
        'usuarios'
      ];

      let firebaseEliminados = 0;
      for (const docName of configDocs) {
        try {
          const docRef = window.fs.doc(window.firebaseDb, 'configuracion', docName);

          // Obtener el nombre del array según el documento
          let arrayName = '';
          switch (docName) {
            case 'tractocamiones':
              arrayName = 'economicos';
              break;
            case 'cuentas_bancarias':
              arrayName = 'cuentasBancarias';
              break;
            default:
              arrayName = docName;
          }

          // Verificar el documento antes de limpiar
          const docSnap = await window.fs.getDoc(docRef);
          if (docSnap.exists()) {
            const dataBefore = docSnap.data();
            const arrayBefore = dataBefore[arrayName] || [];
            const docTenantId = dataBefore.tenantId;
            console.log(
              `📋 ${docName}: ${arrayBefore.length} registros antes de limpiar (tenantId: ${docTenantId})`
            );

            // Eliminar completamente el documento de Firebase
            // Esto asegura que los datos se eliminen definitivamente
            await window.fs.deleteDoc(docRef);
            console.log(`🗑️ ${docName} eliminado completamente de Firebase`);

            // NO recrear el documento - dejarlo eliminado definitivamente
            // Esto evita que se vuelvan a cargar datos

            // Verificar que el documento fue eliminado
            const docSnapAfter = await window.fs.getDoc(docRef);
            if (!docSnapAfter.exists()) {
              console.log(
                `✅ ${docName} eliminado definitivamente de Firebase (documento no existe)`
              );
            } else {
              console.warn(
                `⚠️ ${docName} aún existe después de eliminar, intentando nuevamente...`
              );
              // Intentar eliminar nuevamente
              await window.fs.deleteDoc(docRef);
            }
          } else {
            console.log(`ℹ️ ${docName} no existe en Firebase, ya está limpio`);
          }

          // Si es clientes, también eliminar de la colección raíz si existe
          if (docName === 'clientes') {
            try {
              console.log('🗑️ Eliminando clientes de la colección raíz...');
              const clientesCollectionRef = window.fs.collection(window.firebaseDb, 'clientes');
              const querySnapshot = await window.fs.getDocs(
                window.fs.query(
                  clientesCollectionRef,
                  window.fs.where('tenantId', '==', 'xGltZpVT9pex6PvQeo8o8bKiP082')
                )
              );

              if (!querySnapshot.empty) {
                const deletePromises = [];
                querySnapshot.forEach(doc => {
                  deletePromises.push(window.fs.deleteDoc(doc.ref));
                });
                await Promise.all(deletePromises);
                console.log(`✅ ${querySnapshot.size} clientes eliminados de la colección raíz`);
              }

              // También eliminar con demo_tenant por si acaso
              const querySnapshotDemo = await window.fs.getDocs(
                window.fs.query(
                  clientesCollectionRef,
                  window.fs.where('tenantId', '==', 'demo_tenant')
                )
              );

              if (!querySnapshotDemo.empty) {
                const deletePromisesDemo = [];
                querySnapshotDemo.forEach(doc => {
                  deletePromisesDemo.push(window.fs.deleteDoc(doc.ref));
                });
                await Promise.all(deletePromisesDemo);
                console.log(
                  `✅ ${querySnapshotDemo.size} clientes eliminados de la colección raíz (demo_tenant)`
                );
              }
            } catch (error) {
              console.warn('⚠️ Error eliminando clientes de la colección raíz:', error);
            }
          }

          firebaseEliminados++;
        } catch (error) {
          console.warn(`⚠️ Error limpiando ${docName} de Firebase:`, error);
          console.error('Detalles del error:', error.message, error.stack);
        }
      }

      console.log(`✅ ${firebaseEliminados} documentos de configuración limpiados de Firebase`);
    }

    // Recargar todas las tablas
    console.log('🔄 Recargando tablas...');
    if (typeof window.loadEconomicosTable === 'function') {
      await window.loadEconomicosTable();
    }
    if (typeof window.loadOperadoresTable === 'function') {
      await window.loadOperadoresTable();
    }
    if (typeof window.loadClientesTable === 'function') {
      await window.loadClientesTable();
    }
    if (typeof window.loadProveedoresTable === 'function') {
      await window.loadProveedoresTable();
    }
    if (typeof window.loadCuentasBancariasTable === 'function') {
      await window.loadCuentasBancariasTable();
    }
    if (typeof window.loadEstanciasTable === 'function') {
      await window.loadEstanciasTable();
    }
    if (typeof window.loadAlmacenesTable === 'function') {
      await window.loadAlmacenesTable();
    }
    if (typeof window.loadUsuariosTable === 'function') {
      await window.loadUsuariosTable();
    }

    alert(
      `✅ Limpieza completada:\n\n• ${eliminados} claves eliminadas de localStorage\n• Todos los datos de configuración eliminados de Firebase\n• Todas las tablas recargadas\n\n⚠️ Nota: Los datos de ejemplo NO se agregarán automáticamente. Si necesitas datos de prueba, puedes agregarlos manualmente.`
    );

    console.log('✅ Limpieza de datos de configuración completada');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    alert('❌ Error durante la limpieza. Por favor, revisa la consola para más detalles.');
  }
};

// ===========================================
// FUNCIÓN PARA GENERAR DATOS DE EJEMPLO COMPLETOS
// ===========================================

window.generarDatosEjemploCompletos = async function () {
  try {
    console.log('🚀 Iniciando generación de datos de ejemplo completos...');

    if (!window.firebaseDb || !window.fs) {
      alert(
        '❌ Firebase no está inicializado. Por favor, espera unos segundos e intenta nuevamente.'
      );
      return;
    }

    const confirmacion = confirm(
      '¿Deseas generar datos de ejemplo completos?\n\nEsto creará:\n• 9 Operadores\n• 10 Clientes\n• 14 Proveedores\n• 3 Bancos (BBVA, Banamex - 2 cuentas)\n• 6 Estancias\n• 5 Almacenes\n• 3 Usuarios\n\n⚠️ Si ya existen datos, estos se agregarán a los existentes.'
    );

    if (!confirmacion) {
      return;
    }

    // Desactivar el flag de limpieza para permitir cargar los datos generados
    localStorage.removeItem('configuracion_limpiada_intencionalmente');
    localStorage.removeItem('bancos_datos_ejemplo_deshabilitados');
    console.log('✅ Flags de limpieza desactivados para permitir carga de datos generados');

    // ===========================================
    // 9 OPERADORES
    // ===========================================
    const operadores = [
      {
        nombre: 'Juan Carlos Pérez Martínez',
        licencia: 'DL-1234567',
        seguroSocial: '123-45-6789',
        telefono: '(555) 123-4567',
        fechaNacimiento: '1985-03-15',
        direccion: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
        fechaIngreso: '2020-01-15',
        tipo: 'principal',
        estado: 'activo',
        salario: '15000',
        fechaVencimientoLicencia: '2026-12-31',
        certificadoMedico: 'CM-2024-001',
        fechaVencimientoCertificado: '2025-12-31',
        observaciones: 'Operador con excelente historial. Especializado en rutas largas.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'María Elena González López',
        licencia: 'DL-2345678',
        seguroSocial: '234-56-7890',
        telefono: '(555) 234-5678',
        fechaNacimiento: '1990-07-22',
        direccion: 'Calle Reforma 567, Col. Centro, Guadalajara, Jalisco',
        fechaIngreso: '2021-03-10',
        tipo: 'principal',
        estado: 'activo',
        salario: '14500',
        fechaVencimientoLicencia: '2026-06-30',
        certificadoMedico: 'CM-2024-002',
        fechaVencimientoCertificado: '2025-06-30',
        observaciones: 'Experiencia en transporte de carga peligrosa.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Roberto Sánchez Hernández',
        licencia: 'DL-3456789',
        seguroSocial: '345-67-8901',
        telefono: '(555) 345-6789',
        fechaNacimiento: '1988-11-08',
        direccion: 'Blvd. López Mateos 890, Col. Industrial, Monterrey, NL',
        fechaIngreso: '2019-08-20',
        tipo: 'secundario',
        estado: 'activo',
        salario: '14000',
        fechaVencimientoLicencia: '2027-03-15',
        certificadoMedico: 'CM-2024-003',
        fechaVencimientoCertificado: '2025-03-15',
        observaciones: 'Operador de relevo. Disponible para turnos nocturnos.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Ana Patricia Ramírez Torres',
        licencia: 'DL-4567890',
        seguroSocial: '456-78-9012',
        telefono: '(555) 456-7890',
        fechaNacimiento: '1992-05-14',
        direccion: 'Av. Universidad 234, Col. Copilco, CDMX',
        fechaIngreso: '2022-02-01',
        tipo: 'principal',
        estado: 'activo',
        salario: '14800',
        fechaVencimientoLicencia: '2026-09-20',
        certificadoMedico: 'CM-2024-004',
        fechaVencimientoCertificado: '2025-09-20',
        observaciones: 'Especialista en rutas internacionales.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Carlos Alberto Morales Díaz',
        licencia: 'DL-5678901',
        seguroSocial: '567-89-0123',
        telefono: '(555) 567-8901',
        fechaNacimiento: '1987-09-30',
        direccion: 'Calle 5 de Mayo 456, Col. Centro, Puebla, Puebla',
        fechaIngreso: '2020-11-15',
        tipo: 'relevo',
        estado: 'activo',
        salario: '13500',
        fechaVencimientoLicencia: '2026-11-30',
        certificadoMedico: 'CM-2024-005',
        fechaVencimientoCertificado: '2025-11-30',
        observaciones: 'Operador temporal disponible para picos de carga.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Luis Fernando Jiménez Castro',
        licencia: 'DL-6789012',
        seguroSocial: '678-90-1234',
        telefono: '(555) 678-9012',
        fechaNacimiento: '1986-12-25',
        direccion: 'Av. Revolución 789, Col. San Ángel, CDMX',
        fechaIngreso: '2021-07-01',
        tipo: 'principal',
        estado: 'vacaciones',
        salario: '15200',
        fechaVencimientoLicencia: '2027-01-15',
        certificadoMedico: 'CM-2024-006',
        fechaVencimientoCertificado: '2025-01-15',
        observaciones: 'En vacaciones hasta el 15 de enero.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Fernando José Martínez Ruiz',
        licencia: 'DL-7890123',
        seguroSocial: '789-01-2345',
        telefono: '(555) 789-0123',
        fechaNacimiento: '1991-04-18',
        direccion: 'Calle Hidalgo 321, Col. Centro, Querétaro, Qro',
        fechaIngreso: '2022-05-10',
        tipo: 'secundario',
        estado: 'activo',
        salario: '14200',
        fechaVencimientoLicencia: '2026-08-25',
        certificadoMedico: 'CM-2024-007',
        fechaVencimientoCertificado: '2025-08-25',
        observaciones: 'Nuevo operador en periodo de capacitación.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'José Antonio López García',
        licencia: 'DL-8901234',
        seguroSocial: '890-12-3456',
        telefono: '(555) 890-1234',
        fechaNacimiento: '1989-08-03',
        direccion: 'Blvd. Valsequillo 654, Col. Las Ánimas, Puebla',
        fechaIngreso: '2020-04-05',
        tipo: 'principal',
        estado: 'activo',
        salario: '14900',
        fechaVencimientoLicencia: '2026-10-10',
        certificadoMedico: 'CM-2024-008',
        fechaVencimientoCertificado: '2025-10-10',
        observaciones: 'Operador con certificación en manejo de materiales peligrosos.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Miguel Ángel Herrera Silva',
        licencia: 'DL-9012345',
        seguroSocial: '901-23-4567',
        telefono: '(555) 901-2345',
        fechaNacimiento: '1984-01-20',
        direccion: 'Av. Constituyentes 987, Col. San Miguel Chapultepec, CDMX',
        fechaIngreso: '2018-06-12',
        tipo: 'principal',
        estado: 'activo',
        salario: '15500',
        fechaVencimientoLicencia: '2027-05-20',
        certificadoMedico: 'CM-2024-009',
        fechaVencimientoCertificado: '2025-05-20',
        observaciones: 'Operador senior con más de 15 años de experiencia.',
        fechaRegistro: new Date().toISOString()
      }
    ];

    // Guardar operadores
    for (const operador of operadores) {
      await window.saveOperadorFirebase(operador);
    }
    console.log('✅ 9 Operadores creados');

    // ===========================================
    // 10 CLIENTES
    // ===========================================
    const clientes = [
      {
        nombre: 'AstroLogística Global S.A. de C.V.',
        rfc: 'ALG850101ABC',
        contacto: 'Ing. Carlos Mendoza',
        telefono: '(555) 111-2222',
        email: 'carlos.mendoza@astrologistica.com',
        celular: '(555) 111-2223',
        direccion: 'Av. Ejército Nacional 123, Col. Polanco',
        codigoPostal: '11560',
        ciudad: 'Ciudad de México',
        estado: 'cdmx',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '500000',
        diasCredito: '30',
        descuentoCliente: '5',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente principal. Pago puntual. Requiere facturación electrónica.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Transportes del Norte S.A. de C.V.',
        rfc: 'TND920315XYZ',
        contacto: 'Lic. María González',
        telefono: '(555) 222-3333',
        email: 'maria.gonzalez@transportesnorte.com',
        celular: '(555) 222-3334',
        direccion: 'Blvd. López Mateos 456, Col. Industrial',
        codigoPostal: '64000',
        ciudad: 'Monterrey',
        estado: 'nuevo-leon',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '750000',
        diasCredito: '45',
        descuentoCliente: '7',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente estratégico. Volumen alto de operaciones.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Distribuidora del Pacífico S.A. de C.V.',
        rfc: 'DPC880201MNO',
        contacto: 'C.P. Roberto Sánchez',
        telefono: '(555) 333-4444',
        email: 'roberto.sanchez@distribuidorapacifico.com',
        celular: '(555) 333-4445',
        direccion: 'Av. Revolución 789, Col. Centro',
        codigoPostal: '44100',
        ciudad: 'Guadalajara',
        estado: 'jalisco',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '300000',
        diasCredito: '30',
        descuentoCliente: '3',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente regional. Operaciones principalmente en occidente.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Comercializadora del Sureste S.A. de C.V.',
        rfc: 'CSE950505PQR',
        contacto: 'Ing. Ana Ramírez',
        telefono: '(555) 444-5555',
        email: 'ana.ramirez@comercializadorasureste.com',
        celular: '(555) 444-5556',
        direccion: 'Calle 60 No. 456, Col. Centro',
        codigoPostal: '97000',
        ciudad: 'Mérida',
        estado: 'yucatan',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '400000',
        diasCredito: '30',
        descuentoCliente: '4',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente del sureste. Requiere documentación especial para aduanas.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Almacenes Centrales del Bajío S.A. de C.V.',
        rfc: 'ACB900101STU',
        contacto: 'Lic. Luis Martínez',
        telefono: '(555) 555-6666',
        email: 'luis.martinez@almacenesbajio.com',
        celular: '(555) 555-6667',
        direccion: 'Av. Universidad 321, Col. Centro',
        codigoPostal: '76000',
        ciudad: 'Querétaro',
        estado: 'queretaro',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '350000',
        diasCredito: '30',
        descuentoCliente: '5',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente del Bajío. Operaciones regulares.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Grupo Industrial del Golfo S.A. de C.V.',
        rfc: 'GIG870707VWX',
        contacto: 'C.P. Fernando Herrera',
        telefono: '(555) 666-7777',
        email: 'fernando.herrera@grupogolfo.com',
        celular: '(555) 666-7778',
        direccion: 'Blvd. Adolfo Ruiz Cortines 654, Col. Reforma',
        codigoPostal: '91919',
        ciudad: 'Veracruz',
        estado: 'veracruz',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '600000',
        diasCredito: '45',
        descuentoCliente: '6',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente importante del Golfo. Alto volumen mensual.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Distribuidora Nacional de Abarrotes S.A. de C.V.',
        rfc: 'DNA930303YZA',
        contacto: 'Ing. Patricia López',
        telefono: '(555) 777-8888',
        email: 'patricia.lopez@distribuidoranacional.com',
        celular: '(555) 777-8889',
        direccion: 'Av. Insurgentes Sur 987, Col. Del Valle',
        codigoPostal: '03100',
        ciudad: 'Ciudad de México',
        estado: 'cdmx',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '800000',
        diasCredito: '60',
        descuentoCliente: '8',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente nacional. Distribución a nivel país.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Transportes Especializados del Centro S.A. de C.V.',
        rfc: 'TEC850505BCD',
        contacto: 'Lic. José Antonio Morales',
        telefono: '(555) 888-9999',
        email: 'jose.morales@transportesespecializados.com',
        celular: '(555) 888-9990',
        direccion: 'Calle 5 de Mayo 147, Col. Centro',
        codigoPostal: '72000',
        ciudad: 'Puebla',
        estado: 'puebla',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '250000',
        diasCredito: '30',
        descuentoCliente: '3',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente especializado en carga frágil.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Comercializadora Internacional del Norte S.A. de C.V.',
        rfc: 'CIN910101CDE',
        contacto: 'C.P. Miguel Ángel Torres',
        telefono: '(555) 999-0000',
        email: 'miguel.torres@comercializadoranorte.com',
        celular: '(555) 999-0001',
        direccion: 'Av. Constitución 258, Col. Centro',
        codigoPostal: '64000',
        ciudad: 'Monterrey',
        estado: 'nuevo-leon',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '900000',
        diasCredito: '45',
        descuentoCliente: '10',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente internacional. Operaciones fronterizas frecuentes.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Almacenes y Distribuidora del Sur S.A. de C.V.',
        rfc: 'ADS880808DEF',
        contacto: 'Ing. Laura Jiménez',
        telefono: '(555) 000-1111',
        email: 'laura.jimenez@almacenessur.com',
        celular: '(555) 000-1112',
        direccion: 'Blvd. Benito Juárez 369, Col. Centro',
        codigoPostal: '29000',
        ciudad: 'Tuxtla Gutiérrez',
        estado: 'chiapas',
        regimenFiscal: '601',
        tipoCliente: 'empresa',
        limiteCredito: '200000',
        diasCredito: '30',
        descuentoCliente: '2',
        estadoClienteComercial: 'activo',
        observaciones: 'Cliente del sur. Operaciones regionales.',
        fechaRegistro: new Date().toISOString()
      }
    ];

    // Guardar clientes
    for (const cliente of clientes) {
      await window.saveClienteFirebase(cliente);
    }
    console.log('✅ 10 Clientes creados');

    // ===========================================
    // 14 PROVEEDORES
    // ===========================================
    const proveedores = [
      {
        nombre: 'Refacciones y Servicios del Norte S.A. de C.V.',
        rfc: 'RSN850101FGH',
        contacto: 'Ing. Jorge Ramírez',
        telefono: '(555) 111-0000',
        email: 'jorge.ramirez@refaccionesnorte.com',
        direccion: 'Av. Industrial 123, Col. Parque Industrial',
        codigoPostal: '64000',
        ciudad: 'Monterrey',
        estado: 'nuevo-leon',
        tipoProveedor: 'refacciones',
        diasCredito: '30',
        observaciones: 'Proveedor principal de refacciones. Stock amplio.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Combustibles y Lubricantes del Centro S.A. de C.V.',
        rfc: 'CLC900505HIJ',
        contacto: 'Lic. Carmen Silva',
        telefono: '(555) 222-1111',
        email: 'carmen.silva@combustiblescentro.com',
        direccion: 'Blvd. Valsequillo 456, Col. Industrial',
        codigoPostal: '72000',
        ciudad: 'Puebla',
        estado: 'puebla',
        tipoProveedor: 'combustible',
        diasCredito: '15',
        observaciones: 'Proveedor de diesel y lubricantes. Precios competitivos.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Servicios de Mantenimiento Integral S.A. de C.V.',
        rfc: 'SMI920202JKL',
        contacto: 'Ing. Roberto Castro',
        telefono: '(555) 333-2222',
        email: 'roberto.castro@serviciosmantenimiento.com',
        direccion: 'Calle Tecnológico 789, Col. Industrial',
        codigoPostal: '44100',
        ciudad: 'Guadalajara',
        estado: 'jalisco',
        tipoProveedor: 'servicios',
        diasCredito: '30',
        observaciones: 'Servicios de mantenimiento preventivo y correctivo.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Neumáticos y Llantas del Bajío S.A. de C.V.',
        rfc: 'NLB880808KLM',
        contacto: 'C.P. Ana Martínez',
        telefono: '(555) 444-3333',
        email: 'ana.martinez@neumaticosbajio.com',
        direccion: 'Av. Universidad 321, Col. Centro',
        codigoPostal: '76000',
        ciudad: 'Querétaro',
        estado: 'queretaro',
        tipoProveedor: 'refacciones',
        diasCredito: '30',
        observaciones: 'Especialista en llantas para transporte pesado.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Seguros y Fianzas del Golfo S.A. de C.V.',
        rfc: 'SFG850505LMN',
        contacto: 'Lic. Luis González',
        telefono: '(555) 555-4444',
        email: 'luis.gonzalez@segurosgolfo.com',
        direccion: 'Blvd. Adolfo Ruiz Cortines 654, Col. Reforma',
        codigoPostal: '91919',
        ciudad: 'Veracruz',
        estado: 'veracruz',
        tipoProveedor: 'seguros',
        diasCredito: '0',
        observaciones: 'Seguros vehiculares y de carga. Cobertura nacional.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Herramientas y Equipos Industriales S.A. de C.V.',
        rfc: 'HEI930303MNO',
        contacto: 'Ing. Fernando Herrera',
        telefono: '(555) 666-5555',
        email: 'fernando.herrera@herramientasindustriales.com',
        direccion: 'Av. Ejército Nacional 987, Col. Polanco',
        codigoPostal: '11560',
        ciudad: 'Ciudad de México',
        estado: 'cdmx',
        tipoProveedor: 'refacciones',
        diasCredito: '30',
        observaciones: 'Herramientas especializadas y equipos de taller.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Lavado y Detallado Profesional S.A. de C.V.',
        rfc: 'LDP900101NOP',
        contacto: 'Lic. Patricia López',
        telefono: '(555) 777-6666',
        email: 'patricia.lopez@lavadoprofesional.com',
        direccion: 'Calle Reforma 147, Col. Centro',
        codigoPostal: '44100',
        ciudad: 'Guadalajara',
        estado: 'jalisco',
        tipoProveedor: 'servicios',
        diasCredito: '15',
        observaciones: 'Servicios de lavado y detallado de unidades.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Almacenes de Materiales de Construcción S.A. de C.V.',
        rfc: 'AMC880808OPQ',
        contacto: 'C.P. José Antonio Morales',
        telefono: '(555) 888-7777',
        email: 'jose.morales@almacenesmateriales.com',
        direccion: 'Blvd. López Mateos 258, Col. Industrial',
        codigoPostal: '64000',
        ciudad: 'Monterrey',
        estado: 'nuevo-leon',
        tipoProveedor: 'materiales',
        diasCredito: '30',
        observaciones: 'Materiales para mantenimiento de instalaciones.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Servicios de Grúa y Remolque S.A. de C.V.',
        rfc: 'SGR920202PQR',
        contacto: 'Ing. Miguel Ángel Torres',
        telefono: '(555) 999-8888',
        email: 'miguel.torres@serviciosgrua.com',
        direccion: 'Av. Revolución 369, Col. Centro',
        codigoPostal: '72000',
        ciudad: 'Puebla',
        estado: 'puebla',
        tipoProveedor: 'servicios',
        diasCredito: '0',
        observaciones: 'Servicios de grúa y remolque 24/7.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Filtros y Lubricantes del Sureste S.A. de C.V.',
        rfc: 'FLS850505QRS',
        contacto: 'Lic. Laura Jiménez',
        telefono: '(555) 000-9999',
        email: 'laura.jimenez@filtroslubricantes.com',
        direccion: 'Calle 60 No. 456, Col. Centro',
        codigoPostal: '97000',
        ciudad: 'Mérida',
        estado: 'yucatan',
        tipoProveedor: 'refacciones',
        diasCredito: '30',
        observaciones: 'Filtros y lubricantes especializados.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Equipos de Comunicación y Rastreo S.A. de C.V.',
        rfc: 'ECR900101RST',
        contacto: 'Ing. Carlos Mendoza',
        telefono: '(555) 111-2222',
        email: 'carlos.mendoza@equiposcomunicacion.com',
        direccion: 'Av. Insurgentes Sur 654, Col. Del Valle',
        codigoPostal: '03100',
        ciudad: 'Ciudad de México',
        estado: 'cdmx',
        tipoProveedor: 'servicios',
        diasCredito: '30',
        observaciones: 'Equipos GPS y sistemas de rastreo vehicular.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Pinturas y Recubrimientos Industriales S.A. de C.V.',
        rfc: 'PRI880808STU',
        contacto: 'C.P. María González',
        telefono: '(555) 222-3333',
        email: 'maria.gonzalez@pinturasindustriales.com',
        direccion: 'Blvd. Benito Juárez 123, Col. Industrial',
        codigoPostal: '29000',
        ciudad: 'Tuxtla Gutiérrez',
        estado: 'chiapas',
        tipoProveedor: 'materiales',
        diasCredito: '30',
        observaciones: 'Pinturas y recubrimientos para unidades.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Servicios de Alineación y Balanceo S.A. de C.V.',
        rfc: 'SAB920202TUV',
        contacto: 'Lic. Roberto Sánchez',
        telefono: '(555) 333-4444',
        email: 'roberto.sanchez@alineacionbalanceo.com',
        direccion: 'Calle Tecnológico 789, Col. Industrial',
        codigoPostal: '44100',
        ciudad: 'Guadalajara',
        estado: 'jalisco',
        tipoProveedor: 'servicios',
        diasCredito: '15',
        observaciones: 'Servicios de alineación, balanceo y rotación de llantas.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Baterías y Sistemas Eléctricos S.A. de C.V.',
        rfc: 'BSE850505UVW',
        contacto: 'Ing. Ana Ramírez',
        telefono: '(555) 444-5555',
        email: 'ana.ramirez@bateriaselectricos.com',
        direccion: 'Av. Industrial 456, Col. Parque Industrial',
        codigoPostal: '64000',
        ciudad: 'Monterrey',
        estado: 'nuevo-leon',
        tipoProveedor: 'refacciones',
        diasCredito: '30',
        observaciones: 'Baterías y componentes eléctricos para vehículos pesados.',
        fechaRegistro: new Date().toISOString()
      }
    ];

    // Guardar proveedores
    for (const proveedor of proveedores) {
      await window.saveProveedorFirebase(proveedor);
    }
    console.log('✅ 14 Proveedores creados');

    // ===========================================
    // 3 BANCOS (BBVA, Banamex - 2 cuentas)
    // ===========================================
    const bancos = [
      {
        banco: 'BBVA',
        numeroCuenta: '0123456789',
        clabe: '012345678901234567',
        tipoCuenta: 'cheques',
        moneda: 'MXN',
        observaciones: 'Cuenta principal para operaciones en pesos mexicanos.',
        fechaRegistro: new Date().toISOString()
      },
      {
        banco: 'Banamex',
        numeroCuenta: '9876543210',
        clabe: '002180001987654321',
        tipoCuenta: 'cheques',
        moneda: 'MXN',
        observaciones: 'Cuenta secundaria en pesos mexicanos.',
        fechaRegistro: new Date().toISOString()
      },
      {
        banco: 'Banamex',
        numeroCuenta: '5555666677',
        clabe: '002180001555566667',
        tipoCuenta: 'inversion',
        moneda: 'USD',
        observaciones: 'Cuenta de inversión en dólares americanos.',
        fechaRegistro: new Date().toISOString()
      }
    ];

    // Guardar bancos
    for (const banco of bancos) {
      if (window.configuracionManager) {
        await window.configuracionManager.saveCuentaBancaria(banco);
      } else {
        console.warn('⚠️ ConfiguracionManager no disponible');
      }
    }
    console.log('✅ 3 Bancos creados');

    // ===========================================
    // 6 ESTANCIAS (incluyendo patios o clientes)
    // ===========================================
    const estancias = [
      {
        nombre: 'Estancia Principal - CDMX',
        codigo: 'EST-001',
        direccion: 'Av. Ejército Nacional 123, Col. Polanco, CDMX',
        observaciones: 'Estancia principal. Capacidad para 50 unidades. Oficinas administrativas.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Estancia Norte - Monterrey',
        codigo: 'EST-002',
        direccion: 'Blvd. López Mateos 456, Col. Industrial, Monterrey, NL',
        observaciones: 'Estancia del norte. Capacidad para 30 unidades. Patio de maniobras amplio.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Patio de Almacenamiento - Guadalajara',
        codigo: 'EST-003',
        direccion: 'Av. Revolución 789, Col. Centro, Guadalajara, Jalisco',
        observaciones: 'Patio de almacenamiento temporal. Capacidad para 25 unidades.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Estancia Cliente - AstroLogística',
        codigo: 'EST-004',
        direccion: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
        observaciones: 'Estancia asignada al cliente AstroLogística Global. Uso exclusivo.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Patio de Carga - Puebla',
        codigo: 'EST-005',
        direccion: 'Calle 5 de Mayo 147, Col. Centro, Puebla, Puebla',
        observaciones: 'Patio de carga y descarga. Área de maniobras.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Estancia Sur - Veracruz',
        codigo: 'EST-006',
        direccion: 'Blvd. Adolfo Ruiz Cortines 654, Col. Reforma, Veracruz',
        observaciones: 'Estancia del sur. Capacidad para 20 unidades. Cerca del puerto.',
        fechaRegistro: new Date().toISOString()
      }
    ];

    // Guardar estancias
    for (const estancia of estancias) {
      await window.saveEstanciaFirebase(estancia);
    }
    console.log('✅ 6 Estancias creadas');

    // ===========================================
    // 5 ALMACENES
    // ===========================================
    const almacenes = [
      {
        nombre: 'Almacén de Líquidos',
        codigo: 'ALM-LIQ-001',
        direccion: 'Av. Industrial 123, Col. Parque Industrial, Monterrey, NL',
        observaciones:
          'Almacén especializado en líquidos: aceites, lubricantes, combustibles. Cumple con normas de seguridad.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Almacén de Llantas',
        codigo: 'ALM-LLA-001',
        direccion: 'Blvd. López Mateos 456, Col. Industrial, Monterrey, NL',
        observaciones: 'Almacén de llantas y neumáticos. Stock de diferentes medidas y marcas.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Almacén de Herramientas',
        codigo: 'ALM-HER-001',
        direccion: 'Calle Tecnológico 789, Col. Industrial, Guadalajara, Jalisco',
        observaciones: 'Almacén de herramientas manuales y eléctricas. Equipos de taller.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Almacén de Materiales',
        codigo: 'ALM-MAT-001',
        direccion: 'Av. Universidad 321, Col. Centro, Querétaro, Qro',
        observaciones: 'Almacén de materiales diversos: filtros, mangueras, tornillería, etc.',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Almacén Eléctrico',
        codigo: 'ALM-ELE-001',
        direccion: 'Av. Ejército Nacional 987, Col. Polanco, CDMX',
        observaciones:
          'Almacén de componentes eléctricos: baterías, alternadores, arranques, cableado.',
        fechaRegistro: new Date().toISOString()
      }
    ];

    // Guardar almacenes
    for (const almacen of almacenes) {
      await window.saveAlmacenFirebase(almacen);
    }
    console.log('✅ 5 Almacenes creados');

    // ===========================================
    // 3 USUARIOS
    // ===========================================
    const todosLosModulos = [
      'Logística',
      'Facturación',
      'Tráfico',
      'Diesel',
      'Mantenimiento',
      'Tesoreria',
      'Cuentas x Cobrar',
      'Cuentas x Pagar',
      'Inventario',
      'Configuración',
      'Reportes',
      'Dashboard'
    ];

    const usuarios = [
      {
        nombre: 'Administrador Principal',
        email: 'admin@titanfleet.com',
        password: 'Admin123!',
        permisos: {
          ver: todosLosModulos,
          puedeAprobarSolicitudes: true
        },
        passwordAprobacion: 'Aprob123!',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Gerente de Operaciones',
        email: 'gerente.operaciones@titanfleet.com',
        password: 'Gerente123!',
        permisos: {
          ver: [
            'Logística',
            'Tráfico',
            'Diesel',
            'Mantenimiento',
            'Inventario',
            'Reportes',
            'Dashboard'
          ],
          puedeAprobarSolicitudes: false
        },
        passwordAprobacion: '',
        fechaRegistro: new Date().toISOString()
      },
      {
        nombre: 'Contador General',
        email: 'contador@titanfleet.com',
        password: 'Contador123!',
        permisos: {
          ver: [
            'Facturación',
            'Tesoreria',
            'Cuentas x Cobrar',
            'Cuentas x Pagar',
            'Reportes',
            'Dashboard'
          ],
          puedeAprobarSolicitudes: true
        },
        passwordAprobacion: 'AprobCont123!',
        fechaRegistro: new Date().toISOString()
      }
    ];

    // Guardar usuarios
    for (const usuario of usuarios) {
      await window.saveUsuarioFirebase(usuario);
    }
    console.log('✅ 3 Usuarios creados');

    // Recargar todas las tablas
    console.log('🔄 Recargando tablas...');
    if (typeof window.loadOperadoresTable === 'function') {
      await window.loadOperadoresTable();
    }
    if (typeof window.loadClientesTable === 'function') {
      await window.loadClientesTable();
    }
    if (typeof window.loadProveedoresTable === 'function') {
      await window.loadProveedoresTable();
    }
    if (typeof window.loadCuentasBancariasTable === 'function') {
      await window.loadCuentasBancariasTable();
    }
    if (typeof window.loadEstanciasTable === 'function') {
      await window.loadEstanciasTable();
    }
    if (typeof window.loadAlmacenesTable === 'function') {
      await window.loadAlmacenesTable();
    }
    if (typeof window.loadUsuariosTable === 'function') {
      await window.loadUsuariosTable();
    }

    alert(
      '✅ Datos de ejemplo generados exitosamente:\n\n• 9 Operadores\n• 10 Clientes\n• 14 Proveedores\n• 3 Bancos\n• 6 Estancias\n• 5 Almacenes\n• 3 Usuarios\n\nTodas las tablas han sido actualizadas.'
    );

    console.log('✅ Generación de datos de ejemplo completada');
  } catch (error) {
    console.error('❌ Error generando datos de ejemplo:', error);
    alert('❌ Error generando datos de ejemplo. Por favor, revisa la consola para más detalles.');
  }
};

// ===========================================
// FUNCIÓN PARA ELIMINAR DATOS DE EJEMPLO ESPECÍFICOS
// ===========================================
// Función para eliminar registros específicos de Firebase y localStorage
window.eliminarRegistrosEspecificos = async function () {
  try {
    console.log('🗑️ Iniciando eliminación de registros específicos...');

    if (!window.firebaseDb || !window.fs) {
      alert(
        '❌ Firebase no está inicializado. Por favor, espera unos segundos e intenta nuevamente.'
      );
      return;
    }

    const registrosAEliminar = [
      { coleccion: 'cxc', id: '1758662391450' },
      { coleccion: 'diesel', id: '1758663737729' },
      { coleccion: 'tesoreria', id: '1758663991069' }
    ];

    let eliminadosFirebase = 0;
    let eliminadosLocalStorage = 0;

    for (const registro of registrosAEliminar) {
      try {
        console.log(`🗑️ Eliminando ${registro.coleccion}/${registro.id}...`);

        // 1. Eliminar de Firebase
        try {
          const docRef = window.fs.doc(window.firebaseDb, registro.coleccion, registro.id);
          const docSnap = await window.fs.getDoc(docRef);

          if (docSnap.exists()) {
            await window.fs.deleteDoc(docRef);
            console.log(`✅ ${registro.coleccion}/${registro.id} eliminado de Firebase`);
            eliminadosFirebase++;

            // Verificar que fue eliminado
            const docSnapAfter = await window.fs.getDoc(docRef);
            if (!docSnapAfter.exists()) {
              console.log(
                `✅ ${registro.coleccion}/${registro.id} confirmado eliminado de Firebase`
              );
            } else {
              console.warn(
                `⚠️ ${registro.coleccion}/${registro.id} aún existe después de eliminar`
              );
            }
          } else {
            console.log(`ℹ️ ${registro.coleccion}/${registro.id} no existe en Firebase`);
          }
        } catch (error) {
          console.error(
            `❌ Error eliminando ${registro.coleccion}/${registro.id} de Firebase:`,
            error
          );
        }

        // 2. Eliminar de localStorage
        try {
          const key = `erp_${registro.coleccion}`;
          const data = JSON.parse(localStorage.getItem(key) || '{}');

          if (data[registro.id]) {
            delete data[registro.id];
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`✅ ${registro.coleccion}/${registro.id} eliminado de localStorage`);
            eliminadosLocalStorage++;
          } else {
            console.log(`ℹ️ ${registro.coleccion}/${registro.id} no existe en localStorage`);
          }
        } catch (error) {
          console.error(
            `❌ Error eliminando ${registro.coleccion}/${registro.id} de localStorage:`,
            error
          );
        }

        // 3. También eliminar de otros posibles lugares en localStorage
        try {
          // Para CXC, también verificar erp_cxc_data
          if (registro.coleccion === 'cxc') {
            const cxcData = JSON.parse(localStorage.getItem('erp_cxc_data') || '[]');
            const filtered = cxcData.filter(
              item => item.id !== registro.id && item.numeroFactura !== registro.id
            );
            if (filtered.length < cxcData.length) {
              localStorage.setItem('erp_cxc_data', JSON.stringify(filtered));
              console.log(`✅ ${registro.coleccion}/${registro.id} eliminado de erp_cxc_data`);
            }
          }

          // Para diesel, también verificar erp_diesel_movimientos
          if (registro.coleccion === 'diesel') {
            const dieselData = JSON.parse(localStorage.getItem('erp_diesel_movimientos') || '[]');
            const filtered = dieselData.filter(
              item => item.id !== registro.id && item.movimientoId !== registro.id
            );
            if (filtered.length < dieselData.length) {
              localStorage.setItem('erp_diesel_movimientos', JSON.stringify(filtered));
              console.log(
                `✅ ${registro.coleccion}/${registro.id} eliminado de erp_diesel_movimientos`
              );
            }
          }

          // Para tesoreria, también verificar erp_tesoreria_movimientos
          if (registro.coleccion === 'tesoreria') {
            const tesoreriaData = JSON.parse(
              localStorage.getItem('erp_tesoreria_movimientos') || '[]'
            );
            const filtered = tesoreriaData.filter(
              item => item.id !== registro.id && item.movimientoId !== registro.id
            );
            if (filtered.length < tesoreriaData.length) {
              localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(filtered));
              console.log(
                `✅ ${registro.coleccion}/${registro.id} eliminado de erp_tesoreria_movimientos`
              );
            }
          }
        } catch (error) {
          console.warn(`⚠️ Error limpiando datos adicionales de ${registro.coleccion}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error procesando ${registro.coleccion}/${registro.id}:`, error);
      }
    }

    console.log(
      `✅ Eliminación completada: ${eliminadosFirebase} de Firebase, ${eliminadosLocalStorage} de localStorage`
    );
    alert(
      `✅ Eliminación completada:\n\n• ${eliminadosFirebase} registro(s) eliminado(s) de Firebase\n• ${eliminadosLocalStorage} registro(s) eliminado(s) de localStorage\n\nLos registros han sido eliminados definitivamente.`
    );
  } catch (error) {
    console.error('❌ Error durante la eliminación:', error);
    alert('❌ Error durante la eliminación. Por favor, revisa la consola para más detalles.');
  }
};

window.eliminarDatosEjemploEspecificos = async function () {
  console.log('🗑️ Iniciando eliminación de datos de ejemplo específicos...');

  // Esperar a que Firebase esté inicializado
  let intentos = 0;
  const maxIntentos = 20;
  while ((!window.firebaseDb || !window.fs) && intentos < maxIntentos) {
    await new Promise(resolve => setTimeout(resolve, 500));
    intentos++;
  }

  if (!window.firebaseDb || !window.fs) {
    console.error('❌ Firebase no está inicializado. No se pueden eliminar los datos.');
    alert(
      '❌ Firebase no está inicializado. Por favor, espera unos segundos e intenta nuevamente.'
    );
    return;
  }

  let eliminados = 0;
  const errores = [];

  try {
    // 1. Eliminar documentos específicos por ID
    const documentosEspecificos = [
      { coleccion: 'facturacion', id: 'fac_FAC-202410-0001' },
      { coleccion: 'diesel', id: 'diesel_1764560269130_22' }
    ];

    console.log('🔍 Buscando documentos específicos...');
    for (const docInfo of documentosEspecificos) {
      try {
        const docRef = window.fs.doc(window.firebaseDb, docInfo.coleccion, docInfo.id);
        const docSnap = await window.fs.getDoc(docRef);

        if (docSnap.exists()) {
          await window.fs.deleteDoc(docRef);
          eliminados++;
          console.log(`✅ Eliminado: ${docInfo.coleccion}/${docInfo.id}`);
        } else {
          console.log(`ℹ️ No encontrado: ${docInfo.coleccion}/${docInfo.id}`);
        }
      } catch (error) {
        console.error(`❌ Error eliminando ${docInfo.coleccion}/${docInfo.id}:`, error);
        errores.push(`${docInfo.coleccion}/${docInfo.id}: ${error.message}`);
      }
    }

    // 2. Buscar y eliminar registro de logística por numeroRegistro
    try {
      console.log('🔍 Buscando registro de logística 2500019...');
      const logisticaRef = window.fs.collection(window.firebaseDb, 'logistica');
      const query = window.fs.query(
        logisticaRef,
        window.fs.where('numeroRegistro', '==', '2500019')
      );
      const querySnapshot = await window.fs.getDocs(query);

      if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
          await window.fs.deleteDoc(doc.ref);
          eliminados++;
          console.log(`✅ Eliminado: logistica/${doc.id} (numeroRegistro: 2500019)`);
        }
      } else {
        console.log('ℹ️ No se encontró registro de logística con numeroRegistro 2500019');
      }
    } catch (error) {
      console.error('❌ Error buscando registro de logística:', error);
      errores.push(`logistica (2500019): ${error.message}`);
    }

    // 3. Buscar y eliminar otros datos de ejemplo por tenantId, fechas, o flags
    const colecciones = [
      'logistica',
      'trafico',
      'facturacion',
      'cxc',
      'cxp',
      'diesel',
      'mantenimiento',
      'tesoreria',
      'operadores',
      'inventario'
    ];
    const tenantIdsEjemplo = ['oct-nov', 'ejemplo_oct_nov'];

    console.log('🔍 Buscando otros datos de ejemplo...');
    for (const coleccion of colecciones) {
      try {
        const collectionRef = window.fs.collection(window.firebaseDb, coleccion);

        // Buscar por tenantId de ejemplo (solo los específicos de ejemplo, no demo_tenant)
        for (const tenantId of tenantIdsEjemplo) {
          try {
            const q = window.fs.query(collectionRef, window.fs.where('tenantId', '==', tenantId));
            const querySnapshot = await window.fs.getDocs(q);

            if (!querySnapshot.empty) {
              console.log(
                `📊 Encontrados ${querySnapshot.docs.length} documento(s) en ${coleccion} con tenantId ${tenantId}`
              );
              for (const doc of querySnapshot.docs) {
                await window.fs.deleteDoc(doc.ref);
                eliminados++;
              }
              console.log(
                `✅ Eliminados ${querySnapshot.docs.length} documento(s) de ${coleccion} con tenantId ${tenantId}`
              );
            }
          } catch (error) {
            // Ignorar errores de consulta (puede que no exista el campo tenantId)
          }
        }

        // Buscar datos con demo_tenant pero que también tengan indicadores de ejemplo
        try {
          const qDemoTenant = window.fs.query(
            collectionRef,
            window.fs.where('tenantId', '==', 'demo_tenant')
          );
          const querySnapshotDemoTenant = await window.fs.getDocs(qDemoTenant);

          if (!querySnapshotDemoTenant.empty) {
            console.log(
              `📊 Encontrados ${querySnapshotDemoTenant.docs.length} documento(s) en ${coleccion} con tenantId demo_tenant, verificando si son de ejemplo...`
            );
            for (const doc of querySnapshotDemoTenant.docs) {
              const data = doc.data();
              const docId = doc.id;

              // Verificar si tiene indicadores de ejemplo
              const esEjemplo =
                docId.includes('_202410') ||
                docId.includes('_202411') ||
                docId.includes('FAC-202410') ||
                docId.includes('FAC-202411') ||
                docId.includes('diesel_') ||
                docId.includes('ejemplo') ||
                docId.includes('demo') ||
                data.esDatoEjemplo === true ||
                data.tipoDato === 'ejemplo' ||
                (data.fechaCreacion &&
                  (data.fechaCreacion.includes('2024-10') ||
                    data.fechaCreacion.includes('2024-11')));

              if (esEjemplo) {
                await window.fs.deleteDoc(doc.ref);
                eliminados++;
                console.log(
                  `✅ Eliminado: ${coleccion}/${docId} (demo_tenant con indicadores de ejemplo)`
                );
              }
            }
          }
        } catch (error) {
          // Ignorar errores de consulta
        }

        // Buscar por flags de ejemplo
        try {
          const qEjemplo = window.fs.query(
            collectionRef,
            window.fs.where('esDatoEjemplo', '==', true)
          );
          const querySnapshotEjemplo = await window.fs.getDocs(qEjemplo);

          if (!querySnapshotEjemplo.empty) {
            console.log(
              `📊 Encontrados ${querySnapshotEjemplo.docs.length} documento(s) en ${coleccion} con esDatoEjemplo=true`
            );
            for (const doc of querySnapshotEjemplo.docs) {
              await window.fs.deleteDoc(doc.ref);
              eliminados++;
            }
            console.log(
              `✅ Eliminados ${querySnapshotEjemplo.docs.length} documento(s) de ${coleccion} con esDatoEjemplo=true`
            );
          }
        } catch (error) {
          // Ignorar errores de consulta
        }

        // Buscar por tipoDato
        try {
          const qTipo = window.fs.query(
            collectionRef,
            window.fs.where('tipoDato', '==', 'ejemplo')
          );
          const querySnapshotTipo = await window.fs.getDocs(qTipo);

          if (!querySnapshotTipo.empty) {
            console.log(
              `📊 Encontrados ${querySnapshotTipo.docs.length} documento(s) en ${coleccion} con tipoDato=ejemplo`
            );
            for (const doc of querySnapshotTipo.docs) {
              await window.fs.deleteDoc(doc.ref);
              eliminados++;
            }
            console.log(
              `✅ Eliminados ${querySnapshotTipo.docs.length} documento(s) de ${coleccion} con tipoDato=ejemplo`
            );
          }
        } catch (error) {
          // Ignorar errores de consulta
        }

        // Buscar por fechas de octubre/noviembre 2024
        try {
          const fechaInicio = new Date('2024-10-01T00:00:00Z');
          const fechaFin = new Date('2024-11-30T23:59:59Z');

          // Buscar en fechaCreacion
          const qFechaCreacion = window.fs.query(
            collectionRef,
            window.fs.where('fechaCreacion', '>=', fechaInicio.toISOString()),
            window.fs.where('fechaCreacion', '<=', fechaFin.toISOString())
          );
          const querySnapshotFecha = await window.fs.getDocs(qFechaCreacion);

          if (!querySnapshotFecha.empty) {
            console.log(
              `📊 Encontrados ${querySnapshotFecha.docs.length} documento(s) en ${coleccion} con fechas Oct-Nov 2024`
            );
            // Filtrar solo los que parecen ser de ejemplo (IDs con patrones específicos)
            for (const doc of querySnapshotFecha.docs) {
              const data = doc.data();
              const docId = doc.id;

              // Verificar si el ID o los datos sugieren que es de ejemplo
              const esEjemplo =
                docId.includes('_202410') ||
                docId.includes('_202411') ||
                docId.includes('FAC-202410') ||
                docId.includes('FAC-202411') ||
                (data.numeroRegistro && String(data.numeroRegistro).startsWith('25000')) ||
                docId.includes('diesel_') ||
                docId.includes('ejemplo') ||
                docId.includes('demo');

              if (esEjemplo) {
                await window.fs.deleteDoc(doc.ref);
                eliminados++;
                console.log(
                  `✅ Eliminado: ${coleccion}/${docId} (fecha Oct-Nov 2024, parece ejemplo)`
                );
              }
            }
          }
        } catch (error) {
          // Ignorar errores de consulta de fechas
        }
      } catch (error) {
        console.error(`❌ Error procesando colección ${coleccion}:`, error);
        errores.push(`${coleccion}: ${error.message}`);
      }
    }

    // Limpiar también de localStorage
    console.log('🧹 Limpiando datos de ejemplo de localStorage...');
    const keysLocalStorage = [
      'erp_shared_data',
      'erp_registros',
      'erp_trafico',
      'erp_facturas',
      'erp_facturacion',
      'erp_operadores_incidencias',
      'erp_mantenimientos',
      'erp_inventario_movimientos',
      'erp_inventario_stock',
      'erp_tesoreria',
      'erp_cxc',
      'erp_cxp',
      'erp_diesel'
    ];

    for (const key of keysLocalStorage) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            // ====== FUNCIONES DE GUARDADO DESDE MODALES ======

            // Guardar operador editado desde modal
            window.saveEditedOperador = async function () {
              const form = document.getElementById('editOperadorForm');
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }

              const rfcOriginal = document.getElementById('editOperadorRfcOriginal').value;
              const operador = {
                rfc: document.getElementById('editOperadorRfc').value || rfcOriginal,
                nombre: document.getElementById('editOperadorNombre').value,
                licencia: document.getElementById('editOperadorLicencia').value,
                seguroSocial: document.getElementById('editOperadorSeguroSocial').value,
                telefono: document.getElementById('editOperadorTelefono').value,
                email: document.getElementById('editOperadorEmail').value,
                tipoOperador: document.getElementById('editOperadorTipo').value,
                estadoOperador: document.getElementById('editOperadorEstado').value,
                fechaIngreso: document.getElementById('editOperadorFechaIngreso').value,
                fechaNacimiento: document.getElementById('editOperadorFechaNacimiento').value,
                direccion: document.getElementById('editOperadorDireccion').value,
                salario: document.getElementById('editOperadorSalario').value,
                fechaVencimientoLicencia: document.getElementById('editOperadorVencimientoLicencia')
                  .value,
                certificadoMedico: document.getElementById('editOperadorCertificadoMedico').value,
                fechaVencimientoCertificado: document.getElementById(
                  'editOperadorVencimientoCertificado'
                ).value,
                observaciones: document.getElementById('editOperadorObservaciones').value
              };

              if (await window.configuracionManager.saveOperador(operador)) {
                window.configuracionManager.showNotification(
                  'Operador actualizado correctamente',
                  'success'
                );
                const modal = bootstrap.Modal.getInstance(
                  document.getElementById('editOperadorModal')
                );
                modal.hide();
                if (window.loadOperadoresTable) {
                  await window.loadOperadoresTable();
                }
              } else {
                window.configuracionManager.showNotification(
                  'Error al actualizar operador',
                  'error'
                );
              }
            };

            // Guardar cliente editado desde modal
            window.saveEditedCliente = async function () {
              const form = document.getElementById('editClienteForm');
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }

              const rfcOriginal = document.getElementById('editClienteRfcOriginal').value;
              const cliente = {
                rfc: document.getElementById('editClienteRfc').value || rfcOriginal,
                nombre: document.getElementById('editClienteNombre').value,
                telefono: document.getElementById('editClienteTelefono').value,
                email: document.getElementById('editClienteEmail').value,
                contacto: document.getElementById('editClienteContacto').value,
                tipoCliente: document.getElementById('editClienteTipo').value,
                estadoComercial: document.getElementById('editClienteEstado').value,
                ciudad: document.getElementById('editClienteCiudad').value,
                limiteCredito:
                  parseFloat(document.getElementById('editClienteLimiteCredito').value) || 0,
                diasCredito: parseInt(document.getElementById('editClienteDiasCredito').value, 10) || 0,
                direccion: document.getElementById('editClienteDireccion').value
              };

              if (await window.configuracionManager.saveCliente(cliente)) {
                window.configuracionManager.showNotification(
                  'Cliente actualizado correctamente',
                  'success'
                );
                const modal = bootstrap.Modal.getInstance(
                  document.getElementById('editClienteModal')
                );
                modal.hide();
                if (window.loadClientesTable) {
                  await window.loadClientesTable();
                }
              } else {
                window.configuracionManager.showNotification(
                  'Error al actualizar cliente',
                  'error'
                );
              }
            };

            // Guardar proveedor editado desde modal
            window.saveEditedProveedor = async function () {
              const form = document.getElementById('editProveedorForm');
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }

              const rfcOriginal = document.getElementById('editProveedorRfcOriginal').value;
              const proveedor = {
                rfc: document.getElementById('editProveedorRfc').value || rfcOriginal,
                nombre: document.getElementById('editProveedorNombre').value,
                contacto: document.getElementById('editProveedorContacto').value,
                telefono: document.getElementById('editProveedorTelefono').value,
                email: document.getElementById('editProveedorEmail').value,
                estado: document.getElementById('editProveedorEstado').value,
                diasCredito:
                  parseInt(document.getElementById('editProveedorDiasCredito').value, 10) || 30,
                direccion: document.getElementById('editProveedorDireccion').value
              };

              if (await window.configuracionManager.saveProveedor(proveedor)) {
                window.configuracionManager.showNotification(
                  'Proveedor actualizado correctamente',
                  'success'
                );
                const modal = bootstrap.Modal.getInstance(
                  document.getElementById('editProveedorModal')
                );
                modal.hide();
                if (window.loadProveedoresTable) {
                  await window.loadProveedoresTable();
                }
              } else {
                window.configuracionManager.showNotification(
                  'Error al actualizar proveedor',
                  'error'
                );
              }
            };

            // Guardar estancia editada desde modal
            window.saveEditedEstancia = async function () {
              const form = document.getElementById('editEstanciaForm');
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }

              const idOriginal = document.getElementById('editEstanciaIdOriginal').value;
              const estancia = {
                id: idOriginal,
                nombre: document.getElementById('editEstanciaNombre').value,
                codigo: document.getElementById('editEstanciaCodigo').value,
                direccion: document.getElementById('editEstanciaDireccion').value,
                observaciones: document.getElementById('editEstanciaObservaciones').value
              };

              if (await window.configuracionManager.saveEstancia(estancia)) {
                window.configuracionManager.showNotification(
                  'Estancia actualizada correctamente',
                  'success'
                );
                const modal = bootstrap.Modal.getInstance(
                  document.getElementById('editEstanciaModal')
                );
                modal.hide();
                if (window.loadEstanciasTable) {
                  await window.loadEstanciasTable();
                }
              } else {
                window.configuracionManager.showNotification(
                  'Error al actualizar estancia',
                  'error'
                );
              }
            };

            // Guardar almacén editado desde modal
            window.saveEditedAlmacen = async function () {
              const form = document.getElementById('editAlmacenForm');
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }

              const idOriginal = document.getElementById('editAlmacenIdOriginal').value;
              const almacen = {
                id: idOriginal,
                nombre: document.getElementById('editAlmacenNombre').value,
                codigo: document.getElementById('editAlmacenCodigo').value,
                direccion: document.getElementById('editAlmacenDireccion').value,
                observaciones: document.getElementById('editAlmacenObservaciones').value
              };

              if (await window.configuracionManager.saveAlmacen(almacen)) {
                window.configuracionManager.showNotification(
                  'Almacén actualizado correctamente',
                  'success'
                );
                const modal = bootstrap.Modal.getInstance(
                  document.getElementById('editAlmacenModal')
                );
                modal.hide();
                if (window.loadAlmacenesTable) {
                  await window.loadAlmacenesTable();
                }
              } else {
                window.configuracionManager.showNotification(
                  'Error al actualizar almacén',
                  'error'
                );
              }
            };

            // Guardar cuenta bancaria editada desde modal
            window.saveEditedCuentaBancaria = async function () {
              try {
                const form = document.getElementById('editCuentaBancariaForm');
                if (!form) {
                  alert('❌ Error: No se encontró el formulario de edición');
                  return;
                }

                if (!form.checkValidity()) {
                  form.reportValidity();
                  return;
                }

                const numeroOriginal = document.getElementById(
                  'editCuentaBancariaNumeroOriginal'
                )?.value;
                if (!numeroOriginal) {
                  alert('❌ Error: No se encontró el número de cuenta original');
                  return;
                }

                const cuentaBancaria = {
                  numeroCuenta: numeroOriginal,
                  banco: document.getElementById('editCuentaBancariaBanco')?.value || '',
                  clabe: document.getElementById('editCuentaBancariaClabe')?.value || '',
                  tipoCuenta: document.getElementById('editCuentaBancariaTipo')?.value || '',
                  moneda: document.getElementById('editCuentaBancariaMoneda')?.value || '',
                  saldoInicial:
                    parseFloat(
                      document.getElementById('editCuentaBancariaSaldoInicial')?.value || '0'
                    ) || 0,
                  observaciones:
                    document.getElementById('editCuentaBancariaObservaciones')?.value || ''
                };

                if (!window.configuracionManager) {
                  alert('❌ Error: ConfiguracionManager no está disponible');
                  return;
                }

                const resultado =
                  await window.configuracionManager.saveCuentaBancaria(cuentaBancaria);

                if (resultado) {
                  alert('✅ Cuenta bancaria actualizada correctamente (sincronizado con Firebase)');
                  const modalElement = document.getElementById('editCuentaBancariaModal');
                  if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) {
                      modal.hide();
                    }
                  }
                  if (window.loadCuentasBancariasTable) {
                    await window.loadCuentasBancariasTable();
                  }
                } else {
                  alert('❌ Error al actualizar cuenta bancaria');
                }
              } catch (error) {
                console.error('❌ Error en saveEditedCuentaBancaria:', error);
                alert(`❌ Error inesperado al guardar cuenta bancaria: ${error.message}`);
              }
            };

            // Guardar usuario editado desde modal
            window.saveEditedUsuario = function () {
              const form = document.getElementById('editUsuarioForm');
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }

              const idOriginal = document.getElementById('editUsuarioIdOriginal').value;
              const password = document.getElementById('editUsuarioPassword').value;
              const confirmPassword = document.getElementById('editUsuarioConfirmPassword').value;

              if (password && password !== confirmPassword) {
                alert('Las contraseñas no coinciden');
                return;
              }

              // Obtener módulos seleccionados
              const modulosSeleccionados = Array.from(
                document.querySelectorAll('#editUsuarioModulosContainer input:checked')
              ).map(cb => cb.value);

              const usuario = {
                id: idOriginal,
                nombre: document.getElementById('editUsuarioNombre').value,
                email: document.getElementById('editUsuarioEmail').value,
                puedeAprobarSolicitudes: document.getElementById('editUsuarioPuedeAprobar').checked,
                puedeVer: modulosSeleccionados
              };

              // Solo actualizar contraseña si se proporcionó una nueva
              if (password) {
                usuario.password = password;
              }

              if (window.configuracionManager.saveUsuario(usuario)) {
                window.configuracionManager.showNotification(
                  'Usuario actualizado correctamente',
                  'success'
                );
                const modal = bootstrap.Modal.getInstance(
                  document.getElementById('editUsuarioModal')
                );
                modal.hide();
                if (window.loadUsuariosTable) {
                  window.loadUsuariosTable();
                }
              } else {
                window.configuracionManager.showNotification(
                  'Error al actualizar usuario',
                  'error'
                );
              }
            };

            // Filtrar datos de ejemplo
            const filtrado = parsed.filter(item => {
              const id = item.id || item.numeroRegistro || item.numeroFactura || '';
              const esEjemplo =
                String(id).includes('_202410') ||
                String(id).includes('_202411') ||
                String(id).includes('FAC-202410') ||
                String(id).includes('FAC-202411') ||
                String(id).includes('2500019') ||
                String(id).includes('diesel_1764560269130_22') ||
                String(id).includes('fac_FAC-202410-0001') ||
                item.esDatoEjemplo === true ||
                item.tipoDato === 'ejemplo' ||
                item.tenantId === 'oct-nov' ||
                item.tenantId === 'ejemplo_oct_nov';

              return !esEjemplo;
            });

            if (filtrado.length < parsed.length) {
              localStorage.setItem(key, JSON.stringify(filtrado));
              console.log(
                `✅ Limpiado localStorage ${key}: ${parsed.length - filtrado.length} registro(s) eliminado(s)`
              );
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error limpiando localStorage ${key}:`, error);
      }
    }

    console.log(`\n✅ Proceso completado. Total eliminados: ${eliminados} documento(s)`);
    if (errores.length > 0) {
      console.warn('⚠️ Errores encontrados:', errores);
    }

    alert(
      `✅ Eliminación completada.\n\nTotal eliminados: ${eliminados} documento(s)\n${errores.length > 0 ? `\n⚠️ Errores: ${errores.length}` : ''}\n\nPor favor, recarga la página para ver los cambios.`
    );
  } catch (error) {
    console.error('❌ Error general eliminando datos de ejemplo:', error);
    alert(`❌ Error eliminando datos de ejemplo: ${error.message}`);
  }
};

// ===========================================
// FUNCIONES DE PRUEBA/DEMO ELIMINADAS
// ===========================================
// Las siguientes funciones fueron eliminadas:
// - generarDatosOperativosEjemplo
// - limpiarDatosOperativosEjemplo
// - borrarTodosLosDatosDemoOctNov
//
// Estas funciones generaban datos de prueba que ya no son necesarios.
