// Cargador de Datos Demo - TitanFleet ERP
// Carga datos de ejemplo cuando se activa el modo demo

class DemoDataLoader {
  constructor() {
    this.isDemoMode = this.checkDemoMode();
  }

  // Verificar si estamos en modo demo
  checkDemoMode() {
    try {
      const license = localStorage.getItem('titanfleet_license');
      if (license) {
        const licenseData = JSON.parse(license);
        return (
          licenseData.licenseKey === 'TITAN-DEMO-0000-0000' ||
          licenseData.type === 'demo' ||
          licenseData.tenantId === (window.DEMO_CONFIG?.tenantId || 'demo_tenant')
        );
      }
    } catch (error) {
      console.error('Error verificando modo demo:', error);
    }
    return false;
  }

  // Eliminar registros demo de logística y tráfico si existen
  async limpiarRegistrosLogisticaDemo() {
    try {
      const registrosDemo = ['2500001', '2500002', '2500003'];
      console.log('🧹 Limpiando registros demo de logística y tráfico...');

      let eliminadosLogistica = 0;
      let eliminadosTrafico = 0;

      // Limpiar de localStorage - erp_shared_data
      const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');

      // Eliminar de registros (logística)
      if (sharedData.registros && typeof sharedData.registros === 'object') {
        registrosDemo.forEach(numero => {
          if (sharedData.registros[numero]) {
            delete sharedData.registros[numero];
            eliminadosLogistica++;
            console.log(`🗑️ Eliminando registro ${numero} de erp_shared_data.registros`);
          }
        });
      }

      // Eliminar de tráfico
      if (sharedData.trafico && typeof sharedData.trafico === 'object') {
        registrosDemo.forEach(numero => {
          if (sharedData.trafico[numero]) {
            delete sharedData.trafico[numero];
            eliminadosTrafico++;
            console.log(`🗑️ Eliminando registro ${numero} de erp_shared_data.trafico`);
          }
        });
      }

      if (eliminadosLogistica > 0 || eliminadosTrafico > 0) {
        localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
        if (eliminadosLogistica > 0) {
          console.log(
            `✅ ${eliminadosLogistica} registros demo de logística eliminados de localStorage`
          );
        }
        if (eliminadosTrafico > 0) {
          console.log(
            `✅ ${eliminadosTrafico} registros demo de tráfico eliminados de localStorage`
          );
        }
      }

      // Limpiar formato antiguo erp_logistica
      try {
        const oldLogistica = localStorage.getItem('erp_logistica');
        if (oldLogistica) {
          const parsed = JSON.parse(oldLogistica);
          let modified = false;

          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(r => {
              const regId = r.numeroRegistro || r.id || r.registroId;
              return !registrosDemo.includes(String(regId));
            });
            if (filtered.length !== parsed.length) {
              localStorage.setItem('erp_logistica', JSON.stringify(filtered));
              console.log(
                `✅ ${parsed.length - filtered.length} registros eliminados de erp_logistica (formato antiguo)`
              );
              modified = true;
            }
          } else if (typeof parsed === 'object') {
            registrosDemo.forEach(numero => {
              if (parsed[numero]) {
                delete parsed[numero];
                modified = true;
              }
            });
            if (modified) {
              localStorage.setItem('erp_logistica', JSON.stringify(parsed));
              console.log('✅ Registros eliminados de erp_logistica (formato antiguo)');
            }
          }
        }
      } catch (e) {
        console.warn('⚠️ Error limpiando erp_logistica:', e);
      }

      // Limpiar de Firebase si está disponible
      if (window.firebaseDb && window.fs) {
        try {
          // Esperar a que los repos estén disponibles
          let attempts = 0;
          while (!window.firebaseRepos && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
          }

          // Eliminar de logística en Firebase
          if (window.firebaseRepos?.logistica) {
            for (const numero of registrosDemo) {
              try {
                await window.firebaseRepos.logistica.delete(numero);
                console.log(`✅ Registro logística ${numero} eliminado de Firebase`);
              } catch (e) {
                // Ignorar si no existe
                if (e.code !== 'not-found' && !e.message?.includes('not found')) {
                  console.warn(`⚠️ Error eliminando ${numero} de Firebase:`, e);
                }
              }
            }
          } else {
            // Intentar eliminar directamente desde Firestore
            try {
              for (const numero of registrosDemo) {
                const docRef = window.fs.doc(window.firebaseDb, 'logistica', numero);
                await window.fs.deleteDoc(docRef);
                console.log(`✅ Registro logística ${numero} eliminado directamente de Firestore`);
              }
            } catch (e) {
              // Ignorar si no existe
            }
          }

          // Eliminar de tráfico en Firebase
          if (window.firebaseRepos?.trafico) {
            for (const numero of registrosDemo) {
              try {
                await window.firebaseRepos.trafico.delete(numero);
                console.log(`✅ Registro tráfico ${numero} eliminado de Firebase`);
              } catch (e) {
                // Ignorar si no existe
              }
            }
          } else {
            // Intentar eliminar directamente desde Firestore
            try {
              for (const numero of registrosDemo) {
                const docRef = window.fs.doc(window.firebaseDb, 'trafico', numero);
                await window.fs.deleteDoc(docRef);
                console.log(`✅ Registro tráfico ${numero} eliminado directamente de Firestore`);
              }
            } catch (e) {
              // Ignorar si no existe
            }
          }
        } catch (error) {
          console.warn('⚠️ Error eliminando registros de Firebase:', error);
        }
      }

      console.log('✅ Limpieza de registros demo completada');
    } catch (error) {
      console.error('❌ Error limpiando registros demo:', error);
    }
  }

  // Cargar datos de ejemplo para Tesorería
  loadTesoreriaDemoData() {
    const demoTesoreria = [
      {
        id: Date.now(),
        tipo: 'ingreso',
        clienteProveedor: 'Empresa ABC S.A.',
        monto: 50000,
        metodoPago: 'transferencia',
        fecha: new Date().toISOString(),
        fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        descripcion: 'Pago de factura FAC-001',
        origen: 'CXC'
      },
      {
        id: Date.now() + 1,
        tipo: 'egreso',
        clienteProveedor: 'Proveedor ABC',
        monto: 30000,
        metodoPago: 'cheque',
        fecha: new Date().toISOString(),
        fechaCreacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        descripcion: 'Pago a proveedor',
        origen: 'CXP'
      }
    ];

    localStorage.setItem('erp_tesoreria_movimientos', JSON.stringify(demoTesoreria));
    console.log('✅ Datos demo de Tesorería cargados');
  }

  // Cargar datos de ejemplo para Configuración
  // ELIMINADO: Los datos de prueba se crean manualmente desde el usuario demo con tenantId: demo_tenant
  async loadConfiguracionDemoData() {
    console.log(
      'ℹ️ loadConfiguracionDemoData() - Función deshabilitada. Los datos de prueba se crean manualmente desde el usuario demo.'
    );
    return;

    /* DATOS DE PRUEBA ELIMINADOS - Crear manualmente desde usuario demo con tenantId: demo_tenant
        // Clientes (formato completo)
        const demoClientes = [
            {
                rfc: 'ABC123456XYZ',
                nombre: 'Empresa ABC S.A. de C.V.',
                contacto: 'Juan Carlos López',
                telefono: '555-1234-567',
                email: 'contacto@empresaabc.com',
                celular: '555-1234-5678',
                direccion: 'Av. Principal 123, Col. Centro',
                codigoPostal: '06000',
                ciudad: 'Ciudad de México',
                estado: 'CDMX',
                regimenFiscal: '601 - General de Ley Personas Morales',
                tipoCliente: 'Empresa',
                limiteCredito: '100000',
                diasCredito: '30',
                descuento: '5',
                estadoComercial: 'Activo',
                observaciones: 'Cliente preferencial',
                fechaRegistro: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                rfc: 'XYZ789012ABC',
                nombre: 'Distribuidora XYZ S.A. de C.V.',
                contacto: 'María González',
                telefono: '555-5678-901',
                email: 'info@distribuidoraxyz.com',
                celular: '555-5678-9012',
                direccion: 'Calle Secundaria 456, Col. Industrial',
                codigoPostal: '44100',
                ciudad: 'Guadalajara',
                estado: 'Jalisco',
                regimenFiscal: '601 - General de Ley Personas Morales',
                tipoCliente: 'Empresa',
                limiteCredito: '150000',
                diasCredito: '45',
                descuento: '3',
                estadoComercial: 'Activo',
                observaciones: 'Cliente regular',
                fechaRegistro: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                rfc: 'GLO456789DEF',
                nombre: 'Importadora Global S.A.',
                contacto: 'Roberto Martínez',
                telefono: '555-9012-345',
                email: 'ventas@importadoraglobal.com',
                celular: '555-9012-3456',
                direccion: 'Blvd. Industrial 789, Zona Industrial',
                codigoPostal: '64000',
                ciudad: 'Monterrey',
                estado: 'Nuevo León',
                regimenFiscal: '601 - General de Ley Personas Morales',
                tipoCliente: 'Empresa',
                limiteCredito: '200000',
                diasCredito: '60',
                descuento: '7',
                estadoComercial: 'Activo',
                observaciones: 'Cliente VIP',
                fechaRegistro: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Guardar clientes en localStorage (formato array)
        localStorage.setItem('erp_clientes', JSON.stringify(demoClientes));

        // También guardar en formato objeto para compatibilidad
        const clientesObj = {};
        demoClientes.forEach(cliente => {
            clientesObj[cliente.rfc] = cliente;
        });
        localStorage.setItem('erp_clientes_obj', JSON.stringify(clientesObj));

        // Tractocamiones (formato completo - debe coincidir con el formato esperado por las tablas)
        const demoEconomicos = [
            {
                numero: '550',
                placaTracto: 'ABC-123',
                placaRemolque: 'REM-001',
                placas: 'ABC-123', // Para compatibilidad
                marca: 'Freightliner',
                modelo: 'Cascadia 2022',
                tipoVehiculo: 'Tractocamión',
                año: '2022',
                color: 'Blanco',
                numeroSerie: 'FTL-550-001',
                numeroMotor: 'ENG-550-001',
                estadoVehiculo: 'activo',
                activo: true,
                fechaCreacion: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                numero: '123',
                placaTracto: 'XYZ-456',
                placaRemolque: 'REM-002',
                placas: 'XYZ-456', // Para compatibilidad
                marca: 'Volvo',
                modelo: 'VNL 860',
                tipoVehiculo: 'Tractocamión',
                año: '2021',
                color: 'Azul',
                numeroSerie: 'VOL-123-001',
                numeroMotor: 'ENG-123-001',
                estadoVehiculo: 'activo',
                activo: true,
                fechaCreacion: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                numero: '789',
                placaTracto: 'DEF-789',
                placaRemolque: 'REM-003',
                placas: 'DEF-789', // Para compatibilidad
                marca: 'Kenworth',
                modelo: 'T680',
                tipoVehiculo: 'Tractocamión',
                año: '2023',
                color: 'Rojo',
                numeroSerie: 'KEN-789-001',
                numeroMotor: 'ENG-789-001',
                estadoVehiculo: 'activo',
                activo: true,
                fechaCreacion: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                numero: '456',
                placaTracto: 'GHI-456',
                placaRemolque: 'REM-004',
                placas: 'GHI-456', // Para compatibilidad
                marca: 'Peterbilt',
                modelo: '579',
                tipoVehiculo: 'Tractocamión',
                año: '2022',
                color: 'Negro',
                numeroSerie: 'PET-456-001',
                numeroMotor: 'ENG-456-001',
                estadoVehiculo: 'activo',
                activo: true,
                fechaCreacion: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                numero: '321',
                placaTracto: 'JKL-321',
                placaRemolque: 'REM-005',
                placas: 'JKL-321', // Para compatibilidad
                marca: 'International',
                modelo: 'LT Series',
                tipoVehiculo: 'Tractocamión',
                año: '2023',
                color: 'Gris',
                numeroSerie: 'INT-321-001',
                numeroMotor: 'ENG-321-001',
                estadoVehiculo: 'activo',
                activo: true,
                fechaCreacion: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        localStorage.setItem('erp_economicos', JSON.stringify(demoEconomicos));

        // Operadores (formato completo - debe coincidir con el formato esperado por las tablas)
        const demoOperadores = [
            {
                nombre: 'Juan Pérez Hernández',
                licencia: 'LIC-001-2024',
                rfc: 'OP-LIC-001',
                tipoOperador: 'Principal',
                estadoOperador: 'activo', // En minúsculas para coincidir con la tabla
                fechaVencimientoLicencia: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                telefono: '555-1111-2222',
                email: 'juan.perez@titanfleet.com',
                seguroSocial: 'SS-001-2024',
                fechaIngreso: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
                fechaCreacion: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                nombre: 'María González López',
                licencia: 'LIC-002-2024',
                rfc: 'OP-LIC-002',
                tipoOperador: 'Principal',
                estadoOperador: 'activo', // En minúsculas para coincidir con la tabla
                fechaVencimientoLicencia: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                telefono: '555-2222-3333',
                email: 'maria.gonzalez@titanfleet.com',
                seguroSocial: 'SS-002-2024',
                fechaIngreso: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
                fechaCreacion: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                nombre: 'Carlos Ramírez Torres',
                licencia: 'LIC-003-2024',
                rfc: 'OP-LIC-003',
                tipoOperador: 'Auxiliar',
                estadoOperador: 'activo', // En minúsculas para coincidir con la tabla
                fechaVencimientoLicencia: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                telefono: '555-3333-4444',
                email: 'carlos.ramirez@titanfleet.com',
                seguroSocial: 'SS-003-2024',
                fechaIngreso: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
                fechaCreacion: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
                fechaRegistro: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        localStorage.setItem('erp_operadores', JSON.stringify(demoOperadores));

        // Proveedores
        const demoProveedores = [
            {
                rfc: 'PRO123456XYZ',
                nombre: 'Proveedor de Refacciones ABC',
                contacto: 'Pedro Sánchez',
                telefono: '555-4444-5555',
                email: 'ventas@refaccionesabc.com',
                direccion: 'Av. Industrial 100',
                ciudad: 'Ciudad de México',
                estado: 'CDMX',
                tipoProveedor: 'Refacciones',
                estadoComercial: 'Activo',
                fechaRegistro: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                rfc: 'SER789012ABC',
                nombre: 'Servicios de Mantenimiento XYZ',
                contacto: 'Ana Martínez',
                telefono: '555-5555-6666',
                email: 'servicios@mantenimientoxyz.com',
                direccion: 'Calle Taller 200',
                ciudad: 'Guadalajara',
                estado: 'Jalisco',
                tipoProveedor: 'Servicios',
                estadoComercial: 'Activo',
                fechaRegistro: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                rfc: 'COM456789DEF',
                nombre: 'Combustibles y Lubricantes del Norte',
                contacto: 'Roberto Hernández',
                telefono: '555-7777-8888',
                email: 'ventas@combustiblesnorte.com',
                direccion: 'Blvd. Industrial 500',
                ciudad: 'Monterrey',
                estado: 'Nuevo León',
                tipoProveedor: 'Combustibles',
                estadoComercial: 'Activo',
                fechaRegistro: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                rfc: 'LLA789123GHI',
                nombre: 'Llantas y Servicios del Centro',
                contacto: 'Carlos Mendoza',
                telefono: '555-8888-9999',
                email: 'contacto@llantascentro.com',
                direccion: 'Av. Principal 300',
                ciudad: 'Ciudad de México',
                estado: 'CDMX',
                tipoProveedor: 'Llantas',
                estadoComercial: 'Activo',
                fechaRegistro: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                rfc: 'SEG123789JKL',
                nombre: 'Seguros y Fianzas del Transporte',
                contacto: 'María López',
                telefono: '555-9999-0000',
                email: 'seguros@transportefianzas.com',
                direccion: 'Calle Seguros 150',
                ciudad: 'Guadalajara',
                estado: 'Jalisco',
                tipoProveedor: 'Seguros',
                estadoComercial: 'Activo',
                fechaRegistro: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                rfc: 'TEC456123MNO',
                nombre: 'Tecnología y Sistemas para Transporte',
                contacto: 'Juan Ramírez',
                telefono: '555-1111-2222',
                email: 'ventas@tecnologiatransporte.com',
                direccion: 'Av. Tecnológica 250',
                ciudad: 'Monterrey',
                estado: 'Nuevo León',
                tipoProveedor: 'Tecnología',
                estadoComercial: 'Activo',
                fechaRegistro: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        localStorage.setItem('erp_proveedores', JSON.stringify(demoProveedores));

        // Estancias
        const demoEstancias = [
            {
                codigo: 'EST-001',
                nombre: 'Estancia Principal',
                direccion: 'Carretera Nacional Km 45, Col. Industrial',
                ciudad: 'Ciudad de México',
                estado: 'CDMX',
                telefono: '555-1000-0001',
                observaciones: 'Estancia principal para carga y descarga',
                fechaCreacion: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                codigo: 'EST-002',
                nombre: 'Estancia Norte',
                direccion: 'Av. Industrial 500, Zona Industrial',
                ciudad: 'Monterrey',
                estado: 'Nuevo León',
                telefono: '555-2000-0002',
                observaciones: 'Estancia para operaciones del norte',
                fechaCreacion: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                codigo: 'EST-003',
                nombre: 'Estancia Sur',
                direccion: 'Blvd. Logístico 300, Parque Industrial',
                ciudad: 'Guadalajara',
                estado: 'Jalisco',
                telefono: '555-3000-0003',
                observaciones: 'Estancia para distribución regional',
                fechaCreacion: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        localStorage.setItem('erp_estancias', JSON.stringify(demoEstancias));

        // Almacenes
        const demoAlmacenes = [
            {
                codigo: 'ALM-001',
                nombre: 'Almacén Central',
                direccion: 'Av. Almacenes 100, Zona Industrial',
                ciudad: 'Ciudad de México',
                estado: 'CDMX',
                telefono: '555-4000-0001',
                capacidad: '5000 m²',
                tipo: 'General',
                observaciones: 'Almacén principal para inventario general',
                fechaCreacion: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                codigo: 'ALM-002',
                nombre: 'Almacén de Refacciones',
                direccion: 'Calle Refacciones 200, Col. Industrial',
                ciudad: 'Monterrey',
                estado: 'Nuevo León',
                telefono: '555-5000-0002',
                capacidad: '2000 m²',
                tipo: 'Refacciones',
                observaciones: 'Almacén especializado en refacciones y repuestos',
                fechaCreacion: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                codigo: 'ALM-003',
                nombre: 'Almacén de Materiales',
                direccion: 'Blvd. Materiales 300, Parque Logístico',
                ciudad: 'Guadalajara',
                estado: 'Jalisco',
                telefono: '555-6000-0003',
                capacidad: '3000 m²',
                tipo: 'Materiales',
                observaciones: 'Almacén para materiales y suministros',
                fechaCreacion: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        localStorage.setItem('erp_almacenes', JSON.stringify(demoAlmacenes));

        // Intentar guardar también usando configuracionManager para sincronizar con Firebase
        try {
            // Asegurar que el tenantId esté configurado
            const tenantId = localStorage.getItem('tenantId') || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            localStorage.setItem('tenantId', tenantId);
            localStorage.setItem('useSharedDemo', 'true');

            console.log('🔑 TenantId configurado:', tenantId);

            // Esperar a que Firebase y configuracionManager estén disponibles
            let attempts = 0;
            while ((!window.configuracionManager || !window.firebaseDb || !window.fs) && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (window.configuracionManager && window.firebaseDb && window.fs) {
                console.log('💾 Guardando datos demo usando configuracionManager y Firebase...');
                console.log('🔑 TenantId:', tenantId);
                console.log('✅ Firebase disponible:', {
                    firebaseDb: !!window.firebaseDb,
                    fs: !!window.fs,
                    configuracionManager: !!window.configuracionManager
                });

                // Guardar clientes usando el manager (esto también los guarda en Firebase)
                console.log('👥 Guardando clientes...');
                console.log(`📊 Total de clientes a guardar: ${demoClientes.length}`);

                for (const cliente of demoClientes) {
                    try {
                        console.log(`💾 Guardando cliente: ${cliente.nombre} (RFC: ${cliente.rfc})`);
                        const result = await window.configuracionManager.saveCliente(cliente);
                        if (result) {
                            console.log(`✅ Cliente ${cliente.nombre} guardado exitosamente`);
                        } else {
                            console.error(`❌ No se pudo guardar cliente ${cliente.nombre} - saveCliente retornó false`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 300)); // Pausa más larga entre guardados
                    } catch (e) {
                        console.error(`❌ Error guardando cliente ${cliente.nombre}:`, e);
                        console.error('Stack trace:', e.stack);
                    }
                }

                // Verificar que se guardaron correctamente
                console.log('🔍 Verificando clientes guardados...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar más tiempo
                const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
                const clientesDoc = await window.fs.getDoc(clientesDocRef);
                if (clientesDoc.exists()) {
                    const data = clientesDoc.data();
                    console.log(`✅ Verificación: ${data.clientes?.length || 0} clientes en Firebase`);
                    if (data.clientes && data.clientes.length > 0) {
                        console.log('📋 Primeros clientes guardados:', data.clientes.slice(0, 3).map(c => c.nombre));
                    }
                } else {
                    console.error('❌ ERROR: El documento configuracion/clientes NO existe después de guardar');
                    console.error('🔄 Intentando guardar directamente en Firebase...');
                    // Intentar guardar directamente
                    try {
                        await window.fs.setDoc(clientesDocRef, {
                            clientes: demoClientes.map(c => ({
                                ...c,
                                tenantId: tenantId,
                                fechaCreacion: c.fechaCreacion || new Date().toISOString()
                            })),
                            tenantId: tenantId,
                            updatedAt: new Date().toISOString()
                        });
                        console.log('✅ Clientess guardados directamente en Firebase');
                    } catch (directError) {
                        console.error('❌ Error guardando directamente:', directError);
                    }
                }

                // Verificar que se guardaron correctamente
                console.log('🔍 Verificando operadores guardados...');
                await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar más tiempo
                const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
                const operadoresDoc = await window.fs.getDoc(operadoresDocRef);
                if (operadoresDoc.exists()) {
                    const data = operadoresDoc.data();
                    console.log(`✅ Verificación: ${data.operadores?.length || 0} operadores en Firebase`);
                    if (data.operadores && data.operadores.length > 0) {
                        console.log('📋 Primeros operadores guardados:', data.operadores.slice(0, 3).map(o => o.nombre));
                    }
                } else {
                    console.error('❌ ERROR: El documento configuracion/operadores NO existe después de guardar');
                    console.error('🔄 Intentando guardar directamente en Firebase...');
                    // Intentar guardar directamente
                    try {
                        await window.fs.setDoc(operadoresDocRef, {
                            operadores: demoOperadores.map(o => ({
                                ...o,
                                tenantId: tenantId,
                                fechaCreacion: o.fechaCreacion || new Date().toISOString()
                            })),
                            tenantId: tenantId,
                            updatedAt: new Date().toISOString()
                        });
                        console.log('✅ Operadores guardados directamente en Firebase');
                    } catch (directError) {
                        console.error('❌ Error guardando directamente:', directError);
                    }
                }

                // Guardar tractocamiones usando el manager
                console.log('🚛 Guardando tractocamiones...');
                for (const economico of demoEconomicos) {
                    try {
                        const result = await window.configuracionManager.saveEconomico(economico);
                        if (result) {
                            console.log(`✅ Tractocamión ${economico.numero} guardado`);
                        } else {
                            console.warn(`⚠️ No se pudo guardar tractocamión ${economico.numero}`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 250)); // Pausa entre guardados
                    } catch (e) {
                        console.error(`❌ Error guardando tractocamión ${economico.numero}:`, e);
                    }
                }

                // Guardar operadores usando el manager
                console.log('👨‍✈️ Guardando operadores...');
                console.log(`📊 Total de operadores a guardar: ${demoOperadores.length}`);

                for (const operador of demoOperadores) {
                    try {
                        console.log(`💾 Guardando operador: ${operador.nombre} (Licencia: ${operador.licencia})`);
                        const result = await window.configuracionManager.saveOperador(operador);
                        if (result) {
                            console.log(`✅ Operador ${operador.nombre} guardado exitosamente`);
                        } else {
                            console.error(`❌ No se pudo guardar operador ${operador.nombre} - saveOperador retornó false`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 300)); // Pausa más larga entre guardados
                    } catch (e) {
                        console.error(`❌ Error guardando operador ${operador.nombre}:`, e);
                        console.error('Stack trace:', e.stack);
                    }
                }

                // La verificación de operadores ya se hizo arriba, no duplicar

                // Guardar estancias usando el manager
                console.log('🏢 Guardando estancias...');
                for (const estancia of demoEstancias) {
                    try {
                        const result = await window.configuracionManager.saveEstancia(estancia);
                        if (result) {
                            console.log(`✅ Estancia ${estancia.nombre} guardada`);
                        } else {
                            console.warn(`⚠️ No se pudo guardar estancia ${estancia.nombre}`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 150)); // Pausa entre guardados
                    } catch (e) {
                        console.error(`❌ Error guardando estancia ${estancia.nombre}:`, e);
                    }
                }

                // Guardar almacenes usando el manager
                console.log('📦 Guardando almacenes...');
                for (const almacen of demoAlmacenes) {
                    try {
                        const result = await window.configuracionManager.saveAlmacen(almacen);
                        if (result) {
                            console.log(`✅ Almacén ${almacen.nombre} guardado`);
                        } else {
                            console.warn(`⚠️ No se pudo guardar almacén ${almacen.nombre}`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 150)); // Pausa entre guardados
                    } catch (e) {
                        console.error(`❌ Error guardando almacén ${almacen.nombre}:`, e);
                    }
                }

                // Guardar proveedores directamente en Firebase (más confiable)
                console.log('🏭 Guardando proveedores en Firebase...');
                console.log(`📊 Total de proveedores a guardar: ${demoProveedores.length}`);

                try {
                    const proveedoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'proveedores');
                    const proveedoresDoc = await window.fs.getDoc(proveedoresDocRef);

                    let proveedoresArray = [];
                    if (proveedoresDoc.exists()) {
                        const data = proveedoresDoc.data();
                        proveedoresArray = data.proveedores || [];
                        console.log(`📋 Proveedores existentes en Firebase: ${proveedoresArray.length}`);
                    }

                    // Preparar proveedores con todos los campos necesarios
                    const proveedoresParaGuardar = demoProveedores.map(p => {
                        // Verificar si ya existe
                        const existe = proveedoresArray.find(ex => ex.rfc === p.rfc);
                        if (existe) {
                            console.log(`🔄 Proveedor ${p.nombre} ya existe, actualizando...`);
                            return {
                                ...existe,
                                ...p,
                                tenantId: tenantId,
                                fechaActualizacion: new Date().toISOString()
                            };
                        } else {
                            return {
                                ...p,
                                tenantId: tenantId,
                                fechaCreacion: p.fechaRegistro || new Date().toISOString(),
                                fechaActualizacion: new Date().toISOString(),
                                estado: p.estadoComercial || 'Activo',
                                diasCredito: p.diasCredito || '30'
                            };
                        }
                    });

                    // Combinar con los existentes (evitar duplicados)
                    const rfcExistentes = new Set(proveedoresArray.map(p => p.rfc));
                    const nuevosProveedores = proveedoresParaGuardar.filter(p => !rfcExistentes.has(p.rfc));
                    const proveedoresFinales = [...proveedoresArray, ...nuevosProveedores];

                    // Actualizar los que ya existen
                    proveedoresFinales.forEach((p, index) => {
                        const demoProveedor = demoProveedores.find(d => d.rfc === p.rfc);
                        if (demoProveedor) {
                            proveedoresFinales[index] = {
                                ...p,
                                ...demoProveedor,
                                tenantId: tenantId,
                                fechaActualizacion: new Date().toISOString()
                            };
                        }
                    });

                    // Guardar en Firebase
                    await window.fs.setDoc(proveedoresDocRef, {
                        proveedores: proveedoresFinales,
                        tenantId: tenantId,
                        updatedAt: new Date().toISOString()
                    }, { merge: true });

                    console.log(`✅ ${proveedoresFinales.length} proveedores guardados en Firebase`);
                    console.log(`📋 Nuevos proveedores agregados: ${nuevosProveedores.length}`);

                    // Verificar que se guardaron correctamente
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const verifyDoc = await window.fs.getDoc(proveedoresDocRef);
                    if (verifyDoc.exists()) {
                        const verifyData = verifyDoc.data();
                        console.log(`✅ Verificación: ${verifyData.proveedores?.length || 0} proveedores en Firebase`);
                        if (verifyData.proveedores && verifyData.proveedores.length > 0) {
                            console.log('📋 Primeros proveedores guardados:', verifyData.proveedores.slice(0, 3).map(p => p.nombre));
                        }
                    } else {
                        console.error('❌ ERROR: El documento no existe después de guardar');
                    }

                    // También guardar en localStorage para sincronización
                    if (window.configuracionManager) {
                        window.configuracionManager.setProveedores(proveedoresFinales);
                        console.log('✅ Proveedores sincronizados con localStorage');
                    }

                } catch (error) {
                    console.error('❌ Error guardando proveedores en Firebase:', error);
                    console.error('Stack trace:', error.stack);

                    // Fallback: intentar guardar uno por uno usando el manager
                    console.log('🔄 Intentando guardar proveedores uno por uno...');
                    for (const proveedor of demoProveedores) {
                        try {
                            const result = await window.configuracionManager.saveProveedor(proveedor);
                            if (result) {
                                console.log(`✅ Proveedor ${proveedor.nombre} guardado`);
                            }
                            await new Promise(resolve => setTimeout(resolve, 200));
                        } catch (e) {
                            console.error(`❌ Error guardando proveedor ${proveedor.nombre}:`, e);
                        }
                    }
                }

                // Verificar que se guardaron correctamente en Firebase
                console.log('🔍 Verificando datos guardados en Firebase...');
                await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar a que se complete la escritura

                const tractocamionesDocRefCheck = window.fs.doc(window.firebaseDb, 'configuracion', 'tractocamiones');
                const tractocamionesDocCheck = await window.fs.getDoc(tractocamionesDocRefCheck);
                if (tractocamionesDocCheck.exists()) {
                    const data = tractocamionesDocCheck.data();
                    console.log(`📊 Económicos en Firebase: ${data.economicos?.length || 0}`);
                }

                const operadoresDocRefCheck = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
                const operadoresDocCheck = await window.fs.getDoc(operadoresDocRefCheck);
                if (operadoresDocCheck.exists()) {
                    const data = operadoresDocCheck.data();
                    console.log(`📊 Operadores en Firebase: ${data.operadores?.length || 0}`);
                }

                const clientesDocRefCheck = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
                const clientesDocCheck = await window.fs.getDoc(clientesDocRefCheck);
                if (clientesDocCheck.exists()) {
                    const data = clientesDocCheck.data();
                    console.log(`📊 Clientess en Firebase: ${data.clientes?.length || 0}`);
                }

                console.log('✅ Datos demo de Configuración guardados usando configuracionManager');
            } else {
                console.error('❌ configuracionManager o Firebase no disponible:', {
                    configuracionManager: !!window.configuracionManager,
                    firebaseDb: !!window.firebaseDb,
                    fs: !!window.fs
                });
                console.warn('⚠️ Solo se guardaron en localStorage');
            }
        } catch (error) {
            console.error('❌ Error guardando datos demo:', error);
            console.warn('⚠️ Se guardaron en localStorage, pero puede que no se hayan sincronizado con Firebase');
        }

        console.log('✅ Datos demo de Configuración cargados:', {
            clientes: demoClientes.length,
            tractocamiones: demoEconomicos.length,
            operadores: demoOperadores.length,
            proveedores: demoProveedores.length,
            estancias: demoEstancias.length,
            almacenes: demoAlmacenes.length
        });
        */
  }

  // Cargar todos los datos demo
  // ELIMINADO: No se cargan datos de prueba automáticamente. Crear manualmente desde usuario demo.
  async loadAllDemoData() {
    console.log(
      'ℹ️ loadAllDemoData() - Función deshabilitada. Los datos de prueba se crean manualmente desde el usuario demo con tenantId: demo_tenant.'
    );
    return;

    /* CÓDIGO ELIMINADO - Los datos de prueba se crean manualmente
        if (!this.isDemoMode) {
            console.log('⚠️ No está en modo demo, no se cargarán datos de ejemplo');
            return;
        }

        console.log('🔄 Cargando datos demo...');

        // Limpieza automática de registros demo DESHABILITADA
        // Los registros se guardarán y el usuario puede limpiarlos manualmente si lo desea
        // console.log('🧹 Limpiando registros demo de logística y tráfico...');
        // await this.limpiarRegistrosLogisticaDemo();

        // NO cargar datos de logística - los usuarios crearán sus propios registros
        // this.loadLogisticaDemoData();

        // NO cargar datos de tráfico - los usuarios crearán sus propios registros
        // this.loadTraficoDemoData();

        // NO cargar datos de facturación - los usuarios crearán sus propios registros
        // this.loadFacturacionDemoData();

        // NO cargar datos de CXC - los usuarios crearán sus propios registros
        // this.loadCXCDemoData();

        // NO cargar datos de CXP - los usuarios crearán sus propios registros
        // this.loadCXPDemoData();

        // NO cargar datos de tesorería - los usuarios crearán sus propios registros
        // this.loadTesoreriaDemoData();

        // Solo cargar datos de configuración (clientes, tractocamiones, operadores, etc.)
        await this.loadConfiguracionDemoData();

        console.log('✅ Datos demo de configuración cargados (sin registros de operación)');
        */
  }

  // Verificar y cargar datos si es necesario
  async initialize() {
    // DESHABILITADO: No cargar datos de ejemplo automáticamente
    // El usuario debe usar los botones manualmente para generar datos de ejemplo
    console.log(
      'ℹ️ Carga automática de datos demo DESHABILITADA. Use los botones manuales para generar datos de ejemplo.'
    );
    return;

    // CÓDIGO ELIMINADO: Todo el código que generaba datos de ejemplo automáticamente ha sido eliminado
    // Este código nunca se ejecutará debido al return anterior
    /* eslint-disable-next-line no-unreachable */
    if (this.isDemoMode) {
      // Verificar si se limpiaron los datos intencionalmente
      const datosLimpiados = localStorage.getItem('configuracion_limpiada_intencionalmente');
      if (datosLimpiados === 'true') {
        console.log('ℹ️ Datos demo no se cargarán porque se limpiaron intencionalmente');
        return;
      }

      console.log('🔄 Inicializando datos demo...');

      // Esperar a que Firebase esté listo
      let attempts = 0;
      while ((!window.firebaseDb || !window.fs || !window.configuracionManager) && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 200));
        attempts++;
      }

      // Verificar si hay datos en Firebase
      let hasFirebaseData = false;
      // Declarar variables fuera del try para que estén disponibles en el scope correcto
      let hasOperadores = false;
      let hasClientes = false;
      let hasProveedores = false;

      if (window.firebaseDb && window.fs) {
        try {
          // Verificar económicos en Firebase
          const tractocamionesDocRef = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'tractocamiones'
          );
          const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

          if (tractocamionesDoc.exists()) {
            const data = tractocamionesDoc.data();
            if (data.economicos && Array.isArray(data.economicos) && data.economicos.length > 0) {
              hasFirebaseData = true;
              console.log(`✅ Encontrados ${data.economicos.length} económicos en Firebase`);
            }
          }

          // Verificar operadores en Firebase específicamente
          const operadoresDocRefCheck = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'operadores'
          );
          const operadoresDocCheck = await window.fs.getDoc(operadoresDocRefCheck);

          if (operadoresDocCheck.exists()) {
            const data = operadoresDocCheck.data();
            if (data.operadores && Array.isArray(data.operadores) && data.operadores.length > 0) {
              hasOperadores = true;
              hasFirebaseData = true;
              console.log(`✅ Encontrados ${data.operadores.length} operadores en Firebase`);
            }
          }

          // Verificar clientes en Firebase específicamente
          const clientesDocRefCheck = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
          const clientesDocCheck = await window.fs.getDoc(clientesDocRefCheck);

          if (clientesDocCheck.exists()) {
            const data = clientesDocCheck.data();
            if (data.clientes && Array.isArray(data.clientes) && data.clientes.length > 0) {
              hasClientes = true;
              hasFirebaseData = true;
              console.log(`✅ Encontrados ${data.clientes.length} clientes en Firebase`);
            }
          }

          // Verificar proveedores en Firebase específicamente
          const proveedoresDocRefCheck = window.fs.doc(
            window.firebaseDb,
            'configuracion',
            'proveedores'
          );
          const proveedoresDocCheck = await window.fs.getDoc(proveedoresDocRefCheck);

          if (proveedoresDocCheck.exists()) {
            const data = proveedoresDocCheck.data();
            if (
              data.proveedores &&
              Array.isArray(data.proveedores) &&
              data.proveedores.length > 0
            ) {
              hasProveedores = true;
              hasFirebaseData = true;
              console.log(`✅ Encontrados ${data.proveedores.length} proveedores en Firebase`);
            } else {
              console.warn(
                '⚠️ El documento proveedores existe pero está vacío o no tiene array válido'
              );
            }
          } else {
            console.warn('⚠️ El documento configuracion/proveedores NO existe en Firebase');
          }
        } catch (error) {
          console.warn('⚠️ Error verificando datos en Firebase:', error);
        }
      }

      // Verificar estancias y almacenes específicamente
      const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
      const estanciasDoc = await window.fs.getDoc(estanciasDocRef);
      let hasEstancias = false;
      if (estanciasDoc.exists()) {
        const data = estanciasDoc.data();
        if (data.estancias && Array.isArray(data.estancias) && data.estancias.length > 0) {
          hasEstancias = true;
          console.log(`✅ Encontradas ${data.estancias.length} estancias en Firebase`);
        }
      }

      const almacenesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'almacenes');
      const almacenesDoc = await window.fs.getDoc(almacenesDocRef);
      let hasAlmacenes = false;
      if (almacenesDoc.exists()) {
        const data = almacenesDoc.data();
        if (data.almacenes && Array.isArray(data.almacenes) && data.almacenes.length > 0) {
          hasAlmacenes = true;
          console.log(`✅ Encontrados ${data.almacenes.length} almacenes en Firebase`);
        }
      }

      // Limpieza automática de registros demo DESHABILITADA
      // Los registros se guardarán y el usuario puede limpiarlos manualmente si lo desea
      // console.log('🧹 Limpiando registros demo de logística y tráfico...');
      // await this.limpiarRegistrosLogisticaDemo();

      // Si no hay datos en Firebase, o si faltan operadores/clientes/proveedores/estancias/almacenes, cargar los datos demo
      if (
        !hasFirebaseData ||
        !hasOperadores ||
        !hasClientes ||
        !hasProveedores ||
        !hasEstancias ||
        !hasAlmacenes
      ) {
        if (!hasFirebaseData) {
          console.log('🔄 No hay datos en Firebase, cargando datos demo...');
        } else {
          const faltantes = [];
          if (!hasOperadores) {
            faltantes.push('operadores');
          }
          if (!hasClientes) {
            faltantes.push('clientes');
          }
          if (!hasProveedores) {
            faltantes.push('proveedores');
          }
          if (!hasEstancias) {
            faltantes.push('estancias');
          }
          if (!hasAlmacenes) {
            faltantes.push('almacenes');
          }
          console.log(`🔄 Faltan: ${faltantes.join(', ')}, cargando datos demo...`);
        }
        await this.loadAllDemoData();

        // Después de cargar, verificar nuevamente y forzar guardado directo si es necesario
        await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar a que se complete el guardado

        // Verificar operadores
        if (!hasOperadores) {
          const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
          const operadoresDoc = await window.fs.getDoc(operadoresDocRef);
          if (!operadoresDoc.exists()) {
            console.log('🔄 Forzando guardado directo de operadores...');
            const tenantId =
              localStorage.getItem('tenantId') || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            const demoOperadores = [
              {
                nombre: 'Juan Pérez Hernández',
                licencia: 'LIC-001-2024',
                rfc: 'OP-LIC-001',
                tipoOperador: 'Principal',
                estadoOperador: 'activo',
                fechaVencimientoLicencia: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                telefono: '555-1111-2222',
                email: 'juan.perez@titanfleet.com',
                seguroSocial: 'SS-001-2024',
                fechaIngreso: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                fechaCreacion: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                nombre: 'María González López',
                licencia: 'LIC-002-2024',
                rfc: 'OP-LIC-002',
                tipoOperador: 'Principal',
                estadoOperador: 'activo',
                fechaVencimientoLicencia: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                telefono: '555-2222-3333',
                email: 'maria.gonzalez@titanfleet.com',
                seguroSocial: 'SS-002-2024',
                fechaIngreso: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                fechaCreacion: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                nombre: 'Carlos Rodríguez Martínez',
                licencia: 'LIC-003-2024',
                rfc: 'OP-LIC-003',
                tipoOperador: 'Respaldo',
                estadoOperador: 'activo',
                fechaVencimientoLicencia: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                telefono: '555-3333-4444',
                email: 'carlos.rodriguez@titanfleet.com',
                seguroSocial: 'SS-003-2024',
                fechaIngreso: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split('T')[0],
                fechaCreacion: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
              }
            ];
            await window.fs.setDoc(operadoresDocRef, {
              operadores: demoOperadores.map(o => ({ ...o, tenantId: tenantId })),
              tenantId: tenantId,
              updatedAt: new Date().toISOString()
            });
            console.log('✅ Operadores guardados directamente');
          }
        }

        // Verificar clientes
        if (!hasClientes) {
          const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
          const clientesDoc = await window.fs.getDoc(clientesDocRef);
          if (!clientesDoc.exists()) {
            console.log('🔄 Forzando guardado directo de clientes...');
            const tenantId =
              localStorage.getItem('tenantId') || window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            const demoClientes = [
              {
                rfc: 'ABC123456XYZ',
                nombre: 'Empresa ABC S.A. de C.V.',
                contacto: 'Juan Carlos López',
                telefono: '555-1234-567',
                email: 'contacto@empresaabc.com',
                celular: '555-1234-5678',
                direccion: 'Av. Principal 123, Col. Centro',
                codigoPostal: '06000',
                ciudad: 'Ciudad de México',
                estado: 'CDMX',
                regimenFiscal: '601 - General de Ley Personas Morales',
                tipoCliente: 'Empresa',
                limiteCredito: '100000',
                diasCredito: '30',
                descuento: '5',
                estadoComercial: 'Activo',
                observaciones: 'Cliente preferencial',
                fechaRegistro: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                rfc: 'XYZ789012ABC',
                nombre: 'Distribuidora XYZ S.A. de C.V.',
                contacto: 'María González',
                telefono: '555-5678-901',
                email: 'info@distribuidoraxyz.com',
                celular: '555-5678-9012',
                direccion: 'Calle Secundaria 456, Col. Industrial',
                codigoPostal: '44100',
                ciudad: 'Guadalajara',
                estado: 'Jalisco',
                regimenFiscal: '601 - General de Ley Personas Morales',
                tipoCliente: 'Empresa',
                limiteCredito: '150000',
                diasCredito: '45',
                descuento: '3',
                estadoComercial: 'Activo',
                observaciones: 'Cliente regular',
                fechaRegistro: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                rfc: 'GLO456789DEF',
                nombre: 'Importadora Global S.A.',
                contacto: 'Roberto Martínez',
                telefono: '555-9012-345',
                email: 'ventas@importadoraglobal.com',
                celular: '555-9012-3456',
                direccion: 'Blvd. Industrial 789, Zona Industrial',
                codigoPostal: '64000',
                ciudad: 'Monterrey',
                estado: 'Nuevo León',
                regimenFiscal: '601 - General de Ley Personas Morales',
                tipoCliente: 'Empresa',
                limiteCredito: '200000',
                diasCredito: '60',
                descuento: '7',
                estadoComercial: 'Activo',
                observaciones: 'Cliente VIP',
                fechaRegistro: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            ];
            await window.fs.setDoc(clientesDocRef, {
              clientes: demoClientes.map(c => ({
                ...c,
                tenantId: tenantId,
                fechaCreacion: c.fechaRegistro || new Date().toISOString()
              })),
              tenantId: tenantId,
              updatedAt: new Date().toISOString()
            });
            console.log('✅ Clientess guardados directamente');
          }
        }
      } else {
        console.log('✅ Datos demo ya existen en Firebase');
        // Aún así, sincronizar localStorage con Firebase
        await this.syncFromFirebase();
      }
    }
  }

  // Sincronizar localStorage con Firebase
  async syncFromFirebase() {
    // Verificar si se limpiaron los datos intencionalmente
    const datosLimpiados = localStorage.getItem('configuracion_limpiada_intencionalmente');
    if (datosLimpiados === 'true') {
      console.log(
        'ℹ️ Sincronización desde Firebase omitida porque se limpiaron los datos intencionalmente'
      );
      return;
    }

    if (!window.firebaseDb || !window.fs || !window.configuracionManager) {
      return;
    }

    try {
      // Sincronizar económicos
      const tractocamionesDocRef = window.fs.doc(
        window.firebaseDb,
        'configuracion',
        'tractocamiones'
      );
      const tractocamionesDoc = await window.fs.getDoc(tractocamionesDocRef);

      if (tractocamionesDoc.exists()) {
        const data = tractocamionesDoc.data();
        if (data.economicos && Array.isArray(data.economicos)) {
          window.configuracionManager.setEconomicos(data.economicos);
          console.log(`✅ ${data.economicos.length} económicos sincronizados desde Firebase`);
        }
      }

      // Sincronizar operadores
      const operadoresDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
      const operadoresDoc = await window.fs.getDoc(operadoresDocRef);

      if (operadoresDoc.exists()) {
        const data = operadoresDoc.data();
        if (data.operadores && Array.isArray(data.operadores)) {
          window.configuracionManager.setOperadores(data.operadores);
          console.log(`✅ ${data.operadores.length} operadores sincronizados desde Firebase`);
        }
      }

      // Sincronizar clientes
      const clientesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'clientes');
      const clientesDoc = await window.fs.getDoc(clientesDocRef);

      if (clientesDoc.exists()) {
        const data = clientesDoc.data();
        if (data.clientes && Array.isArray(data.clientes)) {
          window.configuracionManager.setClientes(data.clientes);
          console.log(`✅ ${data.clientes.length} clientes sincronizados desde Firebase`);
        }
      }

      // Sincronizar estancias
      const estanciasDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'estancias');
      const estanciasDoc = await window.fs.getDoc(estanciasDocRef);

      if (estanciasDoc.exists()) {
        const data = estanciasDoc.data();
        if (data.estancias && Array.isArray(data.estancias)) {
          window.configuracionManager.setEstancias(data.estancias);
          console.log(`✅ ${data.estancias.length} estancias sincronizadas desde Firebase`);
        }
      }

      // Sincronizar almacenes
      const almacenesDocRef = window.fs.doc(window.firebaseDb, 'configuracion', 'almacenes');
      const almacenesDoc = await window.fs.getDoc(almacenesDocRef);

      if (almacenesDoc.exists()) {
        const data = almacenesDoc.data();
        if (data.almacenes && Array.isArray(data.almacenes)) {
          window.configuracionManager.setAlmacenes(data.almacenes);
          console.log(`✅ ${data.almacenes.length} almacenes sincronizados desde Firebase`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error sincronizando desde Firebase:', error);
    }
  }
}

// Inicializar cuando se carga la página
window.demoDataLoader = new DemoDataLoader();

// DESHABILITADO: No cargar datos de ejemplo automáticamente
// El usuario debe usar los botones manuales para generar datos de ejemplo
/*
// Cargar datos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    await window.demoDataLoader.initialize();
});

// También cargar cuando se detecta que es modo demo
if (window.demoDataLoader.isDemoMode) {
    setTimeout(async () => {
        await window.demoDataLoader.initialize();
    }, 1000);
}
*/
console.log(
  'ℹ️ Carga automática de datos demo DESHABILITADA. Use los botones manuales en la página de Configuración.'
);

// Función global para limpiar registros demo manualmente
window.limpiarRegistrosDemo = async function () {
  if (!window.demoDataLoader) {
    console.error('❌ DemoDataLoader no está disponible');
    return false;
  }

  const confirmar = confirm(
    '¿Estás seguro de que deseas eliminar los registros demo (2500001, 2500002, 2500003) de logística y tráfico?\n\nEsto solo eliminará los registros demo, no tus registros reales.'
  );

  if (!confirmar) {
    console.log('❌ Limpieza cancelada por el usuario');
    return false;
  }

  console.log('🧹 Limpiando registros demo manualmente...');
  try {
    await window.demoDataLoader.limpiarRegistrosLogisticaDemo();
    console.log('✅ Limpieza de registros demo completada');
    alert('✅ Registros demo eliminados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error limpiando registros demo:', error);
    alert(`❌ Error al limpiar registros demo: ${error.message}`);
    return false;
  }
};

// Función de utilidad para forzar guardado de proveedores en Firebase
window.forceSaveProveedoresDemo = async function () {
  if (!window.demoDataLoader || !window.demoDataLoader.isDemoMode) {
    console.error('❌ No estás en modo demo');
    return false;
  }

  console.log('🔄 Forzando guardado de proveedores demo en Firebase...');

  // Esperar a que Firebase esté listo
  let attempts = 0;
  while ((!window.firebaseDb || !window.fs || !window.configuracionManager) && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 200));
    attempts++;
  }

  if (!window.firebaseDb || !window.fs) {
    console.error('❌ Firebase no está disponible');
    return false;
  }

  // ELIMINADO: Los datos de prueba se crean manualmente desde el usuario demo
  console.log(
    'ℹ️ forceSaveProveedoresDemo() - Función deshabilitada. Crear proveedores manualmente desde usuario demo con tenantId: demo_tenant.'
  );
  return false;

  /* CÓDIGO ELIMINADO
    try {
        // Cargar solo los datos de proveedores
        await window.demoDataLoader.loadConfiguracionDemoData();
        console.log('✅ Proveedores demo guardados en Firebase');
        return true;
    } catch (error) {
        console.error('❌ Error forzando guardado de proveedores:', error);
        return false;
    }
    */
};

console.log('✅ DemoDataLoader inicializado');
console.log(
  '💡 Para forzar guardado de proveedores demo, ejecuta: await window.forceSaveProveedoresDemo()'
);
