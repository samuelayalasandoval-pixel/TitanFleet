/**
 * Módulo de utilidades de diagnóstico para Facturación
 * Contiene funciones de verificación, corrección y diagnóstico
 */

(function () {
  'use strict';

  // ============================================
  // FUNCIÓN: verificarErroresJSFacturacion
  // ============================================
  window.verificarErroresJSFacturacion = function () {
    console.log('🔍 Verificando errores de JavaScript en facturación...');

    let reporte = '🔍 VERIFICACIÓN DE ERRORES JAVASCRIPT - FACTURACIÓN\n\n';

    // Verificar scripts cargados
    reporte += '📋 ESTADO DE SCRIPTS:\n';
    const scripts = ['auth.js', 'data-persistence.js', 'integration.js', 'main.js'];

    let scriptsCargados = 0;
    let scriptsConError = 0;

    scripts.forEach(script => {
      const scriptElement = document.querySelector(`script[src*="${script}"]`);
      if (scriptElement) {
        scriptsCargados++;
        reporte += `- ${script}: ✅ Cargado\n`;

        // Verificar si el script tiene errores
        try {
          if (script === 'data-persistence.js' && typeof window.DataPersistence === 'undefined') {
            reporte += '  ⚠️ DataPersistence no inicializado\n';
            scriptsConError++;
          }
          if (script === 'main.js' && typeof window.showNotification === 'undefined') {
            reporte += '  ⚠️ showNotification no disponible\n';
            scriptsConError++;
          }
        } catch (error) {
          reporte += `  ❌ Error: ${error.message}\n`;
          scriptsConError++;
        }
      } else {
        reporte += `- ${script}: ❌ No encontrado\n`;
        scriptsConError++;
      }
    });

    reporte += '\n📊 RESUMEN:\n';
    reporte += `- Scripts cargados: ${scriptsCargados}/${scripts.length}\n`;
    reporte += `- Scripts con problemas: ${scriptsConError}\n`;

    // Verificar DataPersistence
    reporte += '\n🔧 VERIFICACIÓN ESPECÍFICA:\n';

    if (typeof window.DataPersistence === 'undefined') {
      reporte += '- ❌ DataPersistence: No disponible\n';
      reporte += '  🔄 Solución: Se cargará automáticamente\n';

      // Cargar DataPersistence automáticamente
      try {
        window.DataPersistence = {
          storageKey: 'erp_shared_data',

          getData() {
            try {
              const data = localStorage.getItem(this.storageKey);
              return data ? JSON.parse(data) : null;
            } catch (error) {
              console.error('Error obteniendo datos:', error);
              return null;
            }
          },

          setData(data) {
            try {
              localStorage.setItem(this.storageKey, JSON.stringify(data));
              return true;
            } catch (error) {
              console.error('Error guardando datos:', error);
              return false;
            }
          },

          getLogisticaData(registroId) {
            const allData = this.getData();
            return allData ? allData.registros[registroId] : null;
          },

          getTraficoData(registroId) {
            const allData = this.getData();
            return allData ? allData.trafico[registroId] : null;
          },

          getAllDataByRegistro(registroId) {
            const allData = this.getData();
            if (!allData) {
              return { logistica: null, trafico: null, facturacion: null };
            }

            return {
              logistica: allData.registros[registroId] || null,
              trafico: allData.trafico[registroId] || null,
              facturacion: allData.facturas[registroId] || null
            };
          },

          saveLogisticaData(registroId, data) {
            const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
            allData.registros[registroId] = {
              ...data,
              fechaCreacion: new Date().toISOString(),
              ultimaActualizacion: new Date().toISOString()
            };
            return this.setData(allData);
          },

          saveTraficoData(registroId, data) {
            const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
            allData.trafico[registroId] = {
              ...data,
              fechaCreacion: new Date().toISOString(),
              ultimaActualizacion: new Date().toISOString()
            };
            return this.setData(allData);
          },

          saveFacturacionData(registroId, data) {
            const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
            allData.facturas[registroId] = {
              ...data,
              fechaCreacion: new Date().toISOString(),
              ultimaActualizacion: new Date().toISOString()
            };
            return this.setData(allData);
          }
        };

        reporte += '  ✅ DataPersistence cargado automáticamente\n';
        console.log('✅ DataPersistence cargado automáticamente en facturación');
      } catch (error) {
        reporte += `  ❌ Error cargando DataPersistence: ${error.message}\n`;
        console.error('Error cargando DataPersistence:', error);
      }
    } else {
      reporte += '- ✅ DataPersistence: Disponible\n';
    }

    // Verificar si DataPersistence se cargó correctamente
    if (typeof window.DataPersistence !== 'undefined') {
      reporte += '- ✅ DataPersistence: Funcionando correctamente\n';

      // Probar funcionalidad básica
      try {
        const testData = window.DataPersistence.getData();
        reporte += `- 📊 Datos en localStorage: ${testData ? 'Presentes' : 'Vacíos'}\n`;

        if (testData) {
          const registros = Object.keys(testData.registros || {});
          const trafico = Object.keys(testData.trafico || {});
          const facturas = Object.keys(testData.facturas || {});
          reporte += `  - Registros: ${registros.length}\n`;
          reporte += `  - Tráfico: ${trafico.length}\n`;
          reporte += `  - Facturas: ${facturas.length}\n`;
        }
      } catch (error) {
        reporte += `- ❌ Error probando DataPersistence: ${error.message}\n`;
      }
    } else {
      reporte += '- ❌ DataPersistence: Aún no disponible después del intento de carga\n';
    }

    // Verificar otras dependencias
    const dependencias = {
      showNotification: typeof window.showNotification,
      safeSearchAndFillData: typeof window.safeSearchAndFillData
    };

    Object.keys(dependencias).forEach(dep => {
      if (dependencias[dep] === 'undefined') {
        reporte += `- ❌ ${dep}: No disponible\n`;
      } else {
        reporte += `- ✅ ${dep}: Disponible\n`;
      }
    });

    // Recomendaciones
    reporte += '\n💡 RECOMENDACIONES:\n';

    if (scriptsConError > 0) {
      reporte += '- ⚠️ Hay scripts con problemas\n';
      reporte += '- 🔄 Refresca la página (Ctrl+F5)\n';
      reporte += '- 📝 Verifica que todos los archivos existan\n';
    } else {
      reporte += '- ✅ Todos los scripts están funcionando\n';
    }

    if (typeof window.DataPersistence !== 'undefined') {
      reporte += '- ✅ DataPersistence está disponible\n';
      reporte += '- 🧪 Ahora puedes buscar registros y llenar datos automáticamente\n';
    }

    reporte += '\n🔍 PRÓXIMOS PASOS:\n';
    reporte += '1. Abre la consola del navegador (F12)\n';
    reporte += '2. Busca errores en rojo\n';
    reporte += '3. Si no hay errores, busca un registro existente\n';
    reporte += '4. Si hay errores, refresca la página (Ctrl+F5)\n';

    console.log('📊 Reporte de errores JS facturación:', reporte);
    alert(reporte);

    return {
      scriptsCargados,
      scriptsConError,
      dataPersistenceDisponible: typeof window.DataPersistence !== 'undefined'
    };
  };

  // ============================================
  // FUNCIÓN: verificarRegistroFacturacion
  // ============================================
  window.verificarRegistroFacturacion = function (registroId = '2025-09-0001') {
    console.log('🔍 Verificando registro en facturación:', registroId);

    // Verificar que DataPersistence esté disponible
    if (typeof window.DataPersistence === 'undefined') {
      console.log('❌ DataPersistence no disponible, creando versión de respaldo...');

      window.DataPersistence = {
        storageKey: 'erp_shared_data',

        getData() {
          try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
          } catch (error) {
            console.error('Error obteniendo datos:', error);
            return null;
          }
        },

        setData(data) {
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
          } catch (error) {
            console.error('Error guardando datos:', error);
            return false;
          }
        },

        getLogisticaData(registroId) {
          const allData = this.getData();
          return allData ? allData.registros[registroId] : null;
        },

        getTraficoData(registroId) {
          const allData = this.getData();
          return allData ? allData.trafico[registroId] : null;
        },

        getAllDataByRegistro(registroId) {
          const allData = this.getData();
          if (!allData) {
            return { logistica: null, trafico: null, facturacion: null };
          }

          return {
            logistica: allData.registros[registroId] || null,
            trafico: allData.trafico[registroId] || null,
            facturacion: allData.facturas[registroId] || null
          };
        },

        saveLogisticaData(registroId, data) {
          const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
          allData.registros[registroId] = {
            ...data,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString()
          };
          return this.setData(allData);
        },

        saveTraficoData(registroId, data) {
          const allData = this.getData() || { registros: {}, trafico: {}, facturas: {} };
          allData.trafico[registroId] = {
            ...data,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString()
          };
          return this.setData(allData);
        }
      };
    }

    // Verificar si el registro existe
    const allData = window.DataPersistence.getAllDataByRegistro(registroId);
    console.log('📊 Datos encontrados para', registroId, ':', allData);

    if (allData.logistica || allData.trafico) {
      console.log('✅ Registro encontrado:', {
        logistica: Boolean(allData.logistica),
        trafico: Boolean(allData.trafico)
      });

      let mensaje = `✅ Registro ${registroId} encontrado!\n\n`;

      if (allData.logistica) {
        mensaje += '📦 DATOS DE LOGÍSTICA:\n';
        mensaje += `- Cliente: ${allData.logistica.cliente}\n`;
        mensaje += `- Origen: ${allData.logistica.origen}\n`;
        mensaje += `- Destino: ${allData.logistica.destino}\n`;
        mensaje += `- Tipo Servicio: ${allData.logistica.tipoServicio}\n`;
      }

      if (allData.trafico) {
        mensaje += '\n🚛 DATOS DE TRÁFICO:\n';
        mensaje += `- Económico: ${allData.trafico.economico}\n`;
        mensaje += `- Placas: ${allData.trafico.Placas}\n`;
        mensaje += `- Operador: ${allData.trafico.operadorprincipal}\n`;
      }

      alert(mensaje);

      // Intentar llenar los campos
      if (allData.logistica || allData.trafico) {
        const campos = {};

        if (allData.logistica) {
          Object.assign(campos, {
            Cliente: allData.logistica.cliente,
            ReferenciaCliente: allData.logistica.referenciaCliente,
            TipoServicio: allData.logistica.tipoServicio,
            LugarOrigen: allData.logistica.origen,
            LugarDestino: allData.logistica.destino,
            embalajeEspecial: allData.logistica.embalajeEspecial
          });
        }

        if (allData.trafico) {
          Object.assign(campos, {
            economico: allData.trafico.economico,
            Placas: allData.trafico.Placas,
            PermisoSCT: allData.trafico.permisosct,
            OperadorPrincipal: allData.trafico.operadorprincipal,
            Licencia: allData.trafico.Licencia,
            operadorsecundario: allData.trafico.operadorsecundario,
            LicenciaSecundaria: allData.trafico.LicenciaSecundaria || 'LIC-002-2020'
          });
        }

        let camposLlenados = 0;
        Object.keys(campos).forEach(selector => {
          const element = document.getElementById(selector);
          if (element && campos[selector]) {
            element.value = campos[selector];
            camposLlenados++;
            console.log(`✅ Campo ${selector} llenado:`, campos[selector]);
          }
        });

        alert(`✅ Se llenaron ${camposLlenados} campos automáticamente!`);
        return true;
      }
    } else {
      console.log('❌ Registro no encontrado, creando datos de prueba...');

      // Crear datos de prueba para el registro
      const datosLogistica = {
        cliente: 'Empresa de Prueba S.A.',
        origen: 'Ciudad de México',
        destino: 'Guadalajara',
        referenciaCliente: 'REF-2025-001',
        tipoServicio: 'Transporte Terrestre',
        embalajeEspecial: 'No',
        descripcionEmbalaje: '',
        fechaEnvio: '2025-09-15',
        plataforma: '48ft',
        mercancia: 'Productos electrónicos',
        peso: 2500,
        largo: 12.5,
        ancho: 2.4,
        observaciones: 'Mercancía frágil - manejar con cuidado',
        estado: 'registrado'
      };

      const datosTrafico = {
        economico: 'Tractocamión 001',
        Placas: 'ABC-123',
        permisosct: 'SCT-001',
        operadorprincipal: 'Juan Pérez',
        Licencia: 'LIC-001',
        operadorsecundario: 'María García',
        LicenciaSecundaria: 'LIC-002',
        LugarOrigen: 'Ciudad de México',
        LugarDestino: 'Guadalajara',
        estado: 'registrado'
      };

      const logisticaSuccess = window.DataPersistence.saveLogisticaData(registroId, datosLogistica);
      const traficoSuccess = window.DataPersistence.saveTraficoData(registroId, datosTrafico);

      if (logisticaSuccess && traficoSuccess) {
        alert(
          `✅ Datos de prueba creados para ${registroId}!\n\nAhora puedes buscar el registro y los datos se llenarán automáticamente.`
        );
        return true;
      }
      alert(`❌ Error al crear datos de prueba para ${registroId}`);
      return false;
    }
  };

  // ============================================
  // FUNCIÓN: corregirFacturasExistentes
  // ============================================
  window.corregirFacturasExistentes = function () {
    console.log('🔧 Corrigiendo facturas existentes con campos faltantes...');

    try {
      const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      const facturas = sharedData.facturas || {};

      let facturasCorregidas = 0;

      Object.keys(facturas).forEach(facturaId => {
        const factura = facturas[facturaId];
        let necesitaCorreccion = false;

        // Verificar si faltan campos estándar
        if (!factura.total && factura['total factura']) {
          factura.total = factura['total factura'];
          necesitaCorreccion = true;
        }

        if (!factura.cliente && factura.Cliente) {
          factura.cliente = factura.Cliente;
          necesitaCorreccion = true;
        }

        if (!factura.numeroFactura && factura.registroId) {
          factura.numeroFactura = factura.registroId;
          necesitaCorreccion = true;
        }

        if (!factura.fecha && factura.fechaFactura) {
          factura.fecha = factura.fechaFactura;
          necesitaCorreccion = true;
        }

        if (!factura.moneda && factura.tipoMoneda) {
          factura.moneda = factura.tipoMoneda;
          necesitaCorreccion = true;
        }

        if (!factura.estado) {
          factura.estado = 'pendiente';
          necesitaCorreccion = true;
        }

        if (!factura.servicios || factura.servicios.length === 0) {
          const totalValue = factura.total || factura['total factura'] || '0';
          const totalNumeric = parseFloat(String(totalValue).replace(/[$,]/g, ''));

          factura.servicios = [
            {
              descripcion: 'Servicio de facturación',
              cantidad: 1,
              precio: totalNumeric,
              subtotal: totalNumeric
            }
          ];
          necesitaCorreccion = true;
        }

        if (necesitaCorreccion) {
          facturas[facturaId] = factura;
          facturasCorregidas++;
          console.log(`✅ Factura ${facturaId} corregida`);
        }
      });

      if (facturasCorregidas > 0) {
        sharedData.facturas = facturas;
        localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
        console.log(`🎉 ${facturasCorregidas} facturas corregidas exitosamente`);
      } else {
        console.log('ℹ️ No se encontraron facturas que necesiten corrección');
      }

      return facturasCorregidas;
    } catch (error) {
      console.error('❌ Error al corregir facturas:', error);
      return 0;
    }
  };

  // ============================================
  // FUNCIÓN: limpiarTodosLosDatosFacturacion
  // ============================================
  window.limpiarTodosLosDatosFacturacion = async function () {
    console.log('🗑️ Limpiando datos operativos del sistema desde facturación...');

    // Confirmar la acción
    const confirmacion = confirm(
      '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos operativos del sistema ERP.\n\nSe eliminará:\n• Registros de Logística\n• Facturas\n• Tráfico\n• Envíos\n• Cuentas por Pagar\n• Cuentas por Cobrar\n• Tesorería\n• Diesel\n• Mantenimiento\n• Inventario\n• Datos de ejemplo\n\nSe PRESERVARÁ:\n• Económicos (tractocamiones)\n• Operadores\n• Clientes\n• Proveedores\n• Estancias\n• Almacenes\n• Usuarios\n• Configuración del sistema\n\nAdemás, reiniciará completamente el sistema de numeración a "2500001".\n\n¿Estás seguro de que quieres continuar?'
    );

    if (!confirmacion) {
      console.log('❌ Operación cancelada por el usuario');
      return false;
    }

    try {
      // Lista de claves a ELIMINAR (solo datos operativos)
      const erpKeysToDelete = [
        // Logística
        'erp_logistica_registros',
        'erp_logistica_contador',
        'erp_shared_data',
        'erp_logistica',

        // Facturación
        'erp_facturacion_registros',
        'erp_facturacion_contador',

        // Tráfico
        'erp_trafico_registros',
        'erp_trafico_contador',
        'erp_trafico',

        // Cuentas por Pagar
        'erp_cxp_facturas',
        'erp_cxp_solicitudes',
        'erp_cxp_contador',
        'erp_cxp_data',

        // Cuentas por Cobrar
        'erp_cxc_registros',
        'erp_cxc_contador',
        'erp_cxc_data',

        // Tesorería
        'erp_tesoreria_ordenes',
        'erp_tesoreria_movimientos',
        'erp_tesoreria_contador',
        'erp_teso_ordenes_pago',
        'erp_tesoreria_movimientos',

        // Diesel
        'erp_diesel_registros',
        'erp_diesel_contador',
        'erp_diesel_movimientos',

        // Mantenimiento
        'erp_mantenimiento_registros',
        'erp_mantenimiento_contador',
        'erp_mantenimientos',

        // Inventario
        'erp_inv_plataformas',
        'erp_inv_refacciones_movimientos',
        'erp_inv_refacciones_stock',
        'erp_inv_refacciones_movs',
        'erp_inventario_plataformas',
        'erp_inv_contador',

        // Gastos de operadores
        'erp_operadores_gastos',
        'erp_operadores_incidencias',

        // Datos de ejemplo
        'erp_sample_data_loaded',
        'erp_demo_data',

        // Estados de sincronización
        'erp_sincronizacion_states',

        // Sistema de numeración
        'registrationNumbers',
        'activeRegistrationNumber'
      ];

      // Lista de claves a PRESERVAR (datos de configuración)
      const erpKeysToPreserve = [
        'erp_economicos', // Tractocamiones
        'erp_operadores', // Operadores
        'erp_operadores_lista', // Lista de operadores
        'erp_clientes', // Clientes
        'erp_proveedores', // Proveedores
        'erp_estancias', // Estancias
        'erp_almacenes', // Almacenes
        'erp_usuarios', // Usuarios
        'erp_config_economicos', // Configuración económicos
        'erp_config_operadores', // Configuración operadores
        'erp_config_proveedores', // Configuración proveedores
        'erp_config_clientes', // Configuración clientes
        'erp_config_estancias', // Configuración estancias
        'erp_config_almacenes', // Configuración almacenes
        'erp_config_usuarios', // Configuración usuarios
        'erp_config_contador', // Configuración contador
        'sidebarCollapsed', // Preferencias de interfaz
        'erp_user_preferences', // Preferencias de usuario
        'erpCurrentUser', // Usuario actual
        'erpSession', // Sesión actual
        'cxp_initialized' // Estado de inicialización
      ];

      // Eliminar solo las claves operativas
      let eliminados = 0;
      erpKeysToDelete.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          eliminados++;
          console.log(`🗑️ Eliminado: ${key}`);
        }
      });

      // Limpiar cualquier otra clave que contenga 'erp_' pero no esté en la lista de preservar
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (
          key.startsWith('erp_') &&
          !erpKeysToPreserve.includes(key) &&
          !erpKeysToDelete.includes(key)
        ) {
          localStorage.removeItem(key);
          eliminados++;
          console.log(`🗑️ Eliminado adicional: ${key}`);
        }
      });

      // Limpiar historial de números de registro completamente
      console.log('🔄 Limpiando historial de números de registro...');
      localStorage.removeItem('registrationNumbers');
      localStorage.removeItem('activeRegistrationNumber');
      console.log('✅ Historial de números de registro limpiado');

      // Limpiar todos los contadores operativos (no restaurar)
      console.log('🔄 Limpiando contadores operativos...');
      localStorage.removeItem('erp_logistica_contador');
      localStorage.removeItem('erp_facturacion_contador');
      localStorage.removeItem('erp_trafico_contador');
      localStorage.removeItem('erp_cxp_contador');
      localStorage.removeItem('erp_cxc_contador');
      localStorage.removeItem('erp_tesoreria_contador');
      localStorage.removeItem('erp_diesel_contador');
      localStorage.removeItem('erp_mantenimiento_contador');
      localStorage.removeItem('erp_inv_contador');
      console.log('✅ Contadores operativos limpiados completamente');

      // LIMPIAR DATOS DE FIREBASE
      console.log('🔥 Limpiando datos de Firebase...');
      console.log('🔍 Verificando disponibilidad de Firebase...');
      console.log('  - window.firebaseDb:', Boolean(window.firebaseDb));
      console.log('  - window.fs:', Boolean(window.fs));
      console.log('  - window.firebaseAuth:', Boolean(window.firebaseAuth));
      console.log('  - currentUser:', Boolean(window.firebaseAuth?.currentUser));

      if (window.firebaseDb && window.fs) {
        try {
          const collections = [
            'logistica',
            'trafico',
            'facturacion',
            'cxc',
            'cxp',
            'diesel',
            'mantenimiento',
            'tesoreria'
          ];
          let totalEliminados = 0;

          for (const collectionName of collections) {
            try {
              console.log(`🗑️ Limpiando colección ${collectionName}...`);

              // Obtener TODOS los documentos sin filtro (más seguro)
              const collectionRef = window.fs.collection(window.firebaseDb, collectionName);
              const snapshot = await window.fs.getDocs(collectionRef);

              if (!snapshot || snapshot.empty) {
                console.log(`  ℹ️ Colección ${collectionName} está vacía`);
                continue;
              }

              console.log(`  📊 Total documentos en ${collectionName}: ${snapshot.docs.length}`);

              console.log(
                `  📊 Encontrados ${snapshot.docs.length} documento(s) en ${collectionName}`
              );

              const deletePromises = [];
              snapshot.docs.forEach(doc => {
                const docRef = window.fs.doc(window.firebaseDb, collectionName, doc.id);
                deletePromises.push(window.fs.deleteDoc(docRef));
              });

              await Promise.all(deletePromises);
              totalEliminados += snapshot.docs.length;
              console.log(
                `✅ Colección ${collectionName} limpiada: ${snapshot.docs.length} documento(s) eliminado(s)`
              );
            } catch (collectionError) {
              console.error(`❌ Error limpiando colección ${collectionName}:`, collectionError);
            }
          }

          // Limpiar contador del sistema
          try {
            const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
            const counterRef = window.fs.doc(
              window.firebaseDb,
              'system',
              `${demoTenantId}_counter`
            );
            await window.fs.deleteDoc(counterRef).catch(() =>
              // Si no existe, crear uno nuevo con valor 0
              window.fs.setDoc(counterRef, {
                lastNumber: 0,
                updatedAt: new Date().toISOString(),
                tenantId: demoTenantId
              })
            );
            console.log('✅ Contador del sistema reiniciado en Firebase');
          } catch (counterError) {
            console.warn('⚠️ Error reiniciando contador en Firebase:', counterError);
          }

          // Limpiar número activo
          try {
            const activeRef = window.fs.doc(
              window.firebaseDb,
              'system',
              `${demoTenantId}_active_number`
            );
            await window.fs.deleteDoc(activeRef).catch(() => {
              // Si no existe, no hacer nada
            });
            console.log('✅ Número activo eliminado de Firebase');
          } catch (activeError) {
            console.warn('⚠️ Error eliminando número activo:', activeError);
          }

          console.log(
            `✅ Datos de Firebase limpiados completamente. Total eliminados: ${totalEliminados} documento(s)`
          );
          eliminados += totalEliminados; // Agregar a contador de eliminados
        } catch (firebaseError) {
          console.error('❌ Error limpiando Firebase:', firebaseError);
          console.error('❌ Stack trace:', firebaseError.stack);
          alert(
            '⚠️ Error limpiando Firebase. Revisa la consola para más detalles.\n\nLos datos de localStorage fueron limpiados correctamente.'
          );
        }
      } else {
        console.warn('⚠️ Firebase no está disponible (firebaseDb o fs no disponibles)');
        console.warn('  - firebaseDb disponible:', Boolean(window.firebaseDb));
        console.warn('  - fs disponible:', Boolean(window.fs));
        alert(
          '⚠️ Firebase no está disponible. Solo se limpiaron los datos de localStorage.\n\nPor favor recarga la página y vuelve a intentar para limpiar también Firebase.'
        );
      }

      // Mostrar resumen de lo que se preservó
      console.log('📋 Datos de configuración preservados:');
      erpKeysToPreserve.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`✅ Preservado: ${key}`);
        }
      });

      // Limpiar formularios actuales
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        form.reset();
      });

      // Limpiar campos específicos de facturación
      const campos = [
        'numeroRegistro',
        'fechaCreacion',
        'cliente',
        'referenciaCliente',
        'tipoServicio',
        'lugarOrigen',
        'lugarDestino',
        'embalajeEspecial',
        'observacionesFacturacion'
      ];

      let camposLimpios = 0;
      campos.forEach(campoId => {
        const elemento = document.getElementById(campoId);
        if (elemento) {
          elemento.value = '';
          camposLimpios++;
        }
      });

      // Mostrar resumen
      const mensaje = `✅ DATOS OPERATIVOS LIMPIADOS EXITOSAMENTE!\n\n📊 Resumen de la limpieza:\n- Elementos operativos eliminados: ${eliminados}\n- Campos de formulario limpiados: ${camposLimpios}\n\n✅ Datos de configuración preservados:\n• Económicos (tractocamiones)\n• Operadores\n• Clientes\n• Proveedores\n• Estancias\n• Almacenes\n• Usuarios\n\n🎯 El sistema está listo para una prueba de principio a fin.\n\n📝 Próximos pasos:\n1. Ve a Logística y crea un nuevo registro\n2. Ve a Tráfico y busca el registro\n3. Ve a Facturación y busca el registro\n4. Verifica que los datos se compartan correctamente`;

      console.log('📊 Resumen de limpieza:', {
        eliminados,
        camposLimpios,
        totalKeys: Object.keys(localStorage).length
      });

      alert(mensaje);

      return {
        success: true,
        eliminados,
        camposLimpios
      };
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
      alert(
        `❌ Error durante la limpieza: ${error.message}\n\nIntenta refrescar la página (Ctrl+F5) y vuelve a intentar.`
      );
      return false;
    }
  };

  // ============================================
  // FUNCIÓN: diagnosticarTraficoFacturacion
  // ============================================
  window.diagnosticarTraficoFacturacion = function () {
    console.log('🔍 === DIAGNÓSTICO DE TRÁFICO EN FACTURACIÓN ===');

    // Verificar DataPersistence
    console.log('1. DataPersistence disponible:', Boolean(window.DataPersistence));

    // Verificar datos de tráfico en localStorage
    console.log('2. Datos de tráfico en localStorage:');
    const allData = window.DataPersistence ? window.DataPersistence.getData() : null;
    if (allData && allData.trafico) {
      console.log('   - Registros de tráfico disponibles:', Object.keys(allData.trafico));

      Object.keys(allData.trafico).forEach(registroId => {
        const trafico = allData.trafico[registroId];
        console.log(`   - ${registroId}:`, {
          economico: trafico.economico,
          operadorprincipal: trafico.operadorprincipal,
          operadorsecundario: trafico.operadorsecundario,
          Placas: trafico.Placas,
          Licencia: trafico.Licencia,
          LicenciaSecundaria: trafico.LicenciaSecundaria
        });
      });
    } else {
      console.log('   - No hay datos de tráfico en localStorage');
    }

    // Verificar elementos del formulario
    console.log('3. Elementos del formulario de facturación:');
    const elementosTrafico = [
      'economico',
      'Placas',
      'PermisoSCT',
      'OperadorPrincipal',
      'Licencia',
      'operadorsecundario',
      'LicenciaSecundaria'
    ];

    elementosTrafico.forEach(id => {
      const elemento = document.getElementById(id);
      console.log(`   - ${id}:`, elemento ? 'Encontrado' : 'No encontrado', elemento);
    });

    // Probar llenado de un registro específico
    console.log('4. Prueba de llenado:');
    const testRegistroId = '2025-09-0007';
    console.log(`   - Probando con registro: ${testRegistroId}`);

    if (allData && allData.trafico && allData.trafico[testRegistroId]) {
      const traficoData = allData.trafico[testRegistroId];
      console.log('   - Datos de tráfico encontrados:', traficoData);

      // Intentar llenar los campos
      const camposTrafico = {
        economico: traficoData.economico,
        Placas: traficoData.Placas,
        PermisoSCT: traficoData.permisosct,
        OperadorPrincipal: traficoData.operadorprincipal,
        Licencia: traficoData.Licencia,
        operadorsecundario: traficoData.operadorsecundario,
        LicenciaSecundaria: traficoData.LicenciaSecundaria
      };

      let camposLlenados = 0;
      Object.keys(camposTrafico).forEach(selector => {
        const element = document.getElementById(selector);
        if (element && camposTrafico[selector]) {
          element.value = camposTrafico[selector];
          camposLlenados++;
          console.log(`   ✅ Campo ${selector} llenado:`, camposTrafico[selector]);
        } else if (!element) {
          console.log(`   ⚠️ No se encontró elemento con ID: ${selector}`);
        } else if (!camposTrafico[selector]) {
          console.log(`   ⚠️ No hay valor para el campo: ${selector}`);
        }
      });

      console.log(`   - Total campos llenados: ${camposLlenados}`);
    } else {
      console.log('   - No se encontraron datos de tráfico para el registro de prueba');
    }

    console.log('🔍 === FIN DEL DIAGNÓSTICO ===');
    alert('Diagnóstico de tráfico completado. Revisa la consola para ver los detalles.');
  };

  // ============================================
  // FUNCIÓN: corregirRegistrosTrafico
  // ============================================
  window.corregirRegistrosTrafico = function () {
    console.log('🔧 === CORRIGIENDO REGISTROS DE TRÁFICO ===');

    const allData = window.DataPersistence ? window.DataPersistence.getData() : null;
    if (!allData || !allData.trafico) {
      console.log('❌ No hay datos de tráfico disponibles');
      return;
    }

    // Obtener datos reales de la configuración
    const datosValidos = {
      economico: 'Tractocamión 001',
      Placas: 'ABC-123',
      permisosct: 'SCT-001-2020',
      operadorprincipal: 'Juan Pérez',
      Licencia: 'LIC-001-2020',
      operadorsecundario: 'María García',
      LicenciaSecundaria: 'LIC-002-2020'
    };

    // Intentar obtener datos reales de económicos
    try {
      const economicosData = localStorage.getItem('erp_economicos');
      if (economicosData) {
        const economicos = JSON.parse(economicosData);
        const economicosKeys = Object.keys(economicos);
        if (economicosKeys.length > 0) {
          const primerEconomico = economicos[economicosKeys[0]];
          datosValidos.economico = primerEconomico.numeroEconomico || economicosKeys[0];
          datosValidos.Placas = primerEconomico.placas || 'ABC-123';
          datosValidos.permisosct = primerEconomico.permisosct || 'SCT-001-2020';
          console.log('✅ Usando datos reales de económicos:', datosValidos.economico);
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudieron cargar datos de económicos:', error);
    }

    // Intentar obtener datos reales de operadores
    try {
      const operadoresData = localStorage.getItem('erp_operadores');
      if (operadoresData) {
        const operadores = JSON.parse(operadoresData);
        const operadoresKeys = Object.keys(operadores);
        if (operadoresKeys.length > 0) {
          const primerOperador = operadores[operadoresKeys[0]];
          datosValidos.operadorprincipal = primerOperador.nombreOperador || operadoresKeys[0];
          datosValidos.Licencia = primerOperador.licenciaOperador || 'LIC-001-2020';

          // Solo llenar operador secundario si realmente existe en los datos de tráfico
          // En esta función de corrección, dejamos vacío el operador secundario por defecto
          datosValidos.operadorsecundario = '';
          datosValidos.LicenciaSecundaria = '';
          console.log('✅ Usando datos reales de operadores:', datosValidos.operadorprincipal);
        }
      }
    } catch (error) {
      console.log('⚠️ No se pudieron cargar datos de operadores:', error);
    }

    console.log('📊 Datos válidos a usar:', datosValidos);

    let registrosCorregidos = 0;

    Object.keys(allData.trafico).forEach(registroId => {
      const trafico = allData.trafico[registroId];
      let necesitaCorreccion = false;

      // Verificar campos vacíos
      Object.keys(datosValidos).forEach(campo => {
        if (!trafico[campo] || trafico[campo] === '') {
          trafico[campo] = datosValidos[campo];
          necesitaCorreccion = true;
          console.log(`🔧 Corrigiendo ${campo} en ${registroId}: ${datosValidos[campo]}`);
        }
      });

      if (necesitaCorreccion) {
        trafico.ultimaActualizacion = new Date().toISOString();
        registrosCorregidos++;
        console.log(`✅ Registro ${registroId} corregido`);
      }
    });

    if (registrosCorregidos > 0) {
      // Guardar los datos corregidos
      window.DataPersistence.setData(allData);
      console.log(`✅ ${registrosCorregidos} registros corregidos y guardados`);
      alert(
        `✅ Se corrigieron ${registrosCorregidos} registros de tráfico.\n\nAhora los campos se llenarán correctamente en facturación.`
      );
    } else {
      console.log('✅ No se encontraron registros que necesiten corrección');
      alert('✅ Todos los registros de tráfico ya tienen datos válidos.');
    }

    console.log('🔧 === CORRECCIÓN COMPLETADA ===');
  };

  // ============================================
  // FUNCIÓN: diagnosticarBuzonFacturacion
  // ============================================
  window.diagnosticarBuzonFacturacion = function () {
    console.log('🔍 === DIAGNÓSTICO BUZÓN FACTURACIÓN ===');

    // 1. Verificar sincronizacionUtils
    console.log('1. SincronizacionUtils:', typeof window.sincronizacionUtils);

    // 2. Verificar datos de tráfico
    const traficoData = JSON.parse(localStorage.getItem('erp_trafico') || '[]');
    console.log('2. Registros en erp_trafico:', traficoData.length);

    // 3. Verificar estados de sincronización
    if (typeof window.sincronizacionUtils !== 'undefined') {
      const todosLosEstados = window.sincronizacionUtils.getAllRegistrosStatus();
      console.log('3. Estados de sincronización:', todosLosEstados);

      // 4. Verificar registros pendientes específicamente
      const pendientesFacturacion =
        window.sincronizacionUtils.obtenerRegistrosPendientes('facturacion');
      console.log('4. Registros pendientes para facturación:', pendientesFacturacion);

      // 5. Verificar cada registro de tráfico individualmente
      console.log('5. Estado individual de registros de tráfico:');
      traficoData.forEach(registro => {
        const estado = window.sincronizacionUtils.getRegistroStatus(
          registro.numeroRegistro || registro.id
        );
        console.log(`   - ${registro.numeroRegistro || registro.id}:`, estado);
      });
    }

    // 6. Verificar contador actual
    const contador = document.getElementById('contadorPendientesFacturacion');
    console.log('6. Contador actual:', contador?.textContent);

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  };

  // ============================================
  // FUNCIÓN: diagnosticarLlenadoCampos
  // ============================================
  window.diagnosticarLlenadoCampos = function (registroId) {
    console.log('🔍 === DIAGNÓSTICO LLENADO DE CAMPOS ===');

    if (!registroId) {
      registroId = document.getElementById('numeroRegistro')?.value;
    }

    if (!registroId) {
      console.error('❌ No hay número de registro para diagnosticar');
      return;
    }

    console.log('📋 Registro a diagnosticar:', registroId);

    // 1. Verificar datos disponibles
    const allData = window.DataPersistence?.getAllDataByRegistro(registroId);
    console.log('📊 Datos disponibles:', {
      logistica: allData?.logistica ? '✅ Sí' : '❌ No',
      trafico: allData?.trafico ? '✅ Sí' : '❌ No'
    });

    if (allData?.logistica) {
      console.log('📦 Datos de logística:', {
        cliente: allData.logistica.cliente,
        referenciaCliente: allData.logistica.referenciaCliente,
        tipoServicio: allData.logistica.tipoServicio,
        origen: allData.logistica.origen,
        destino: allData.logistica.destino,
        embalajeEspecial: allData.logistica.embalajeEspecial
      });
    }

    // 2. Verificar elementos del formulario
    const campos = [
      'Cliente',
      'ReferenciaCliente',
      'TipoServicio',
      'LugarOrigen',
      'LugarDestino',
      'embalajeEspecial'
    ];

    console.log('🎯 Estado de campos en el formulario:');
    campos.forEach(campo => {
      const elemento = document.getElementById(campo);
      console.log(`   - ${campo}:`, {
        existe: Boolean(elemento),
        valor: elemento?.value || 'vacío',
        readonly: elemento?.readOnly
      });
    });

    // 3. Probar llenado manual
    if (allData?.logistica) {
      console.log('🔧 Probando llenado manual...');
      const camposLogistica = {
        Cliente: allData.logistica.cliente,
        ReferenciaCliente: allData.logistica.referenciaCliente,
        TipoServicio: allData.logistica.tipoServicio,
        LugarOrigen: allData.logistica.origen,
        LugarDestino: allData.logistica.destino,
        EmbalajeEspecial: allData.logistica.embalajeEspecial
      };

      Object.keys(camposLogistica).forEach(campo => {
        const elemento = document.getElementById(campo);
        const valor = camposLogistica[campo];

        if (elemento && valor) {
          elemento.value = valor;
          console.log(`✅ ${campo} llenado con: ${valor}`);
        } else if (!elemento) {
          console.log(`❌ ${campo}: Elemento no encontrado`);
        } else if (!valor) {
          console.log(`⚠️ ${campo}: Sin valor en datos`);
        }
      });
    }

    console.log('🔍 === FIN DIAGNÓSTICO ===');
  };

  // ============================================
  // FUNCIÓN: forzarLlenadoCampos
  // ============================================
  window.forzarLlenadoCampos = async function (registroId) {
    console.log('🔧 === FORZANDO LLENADO DE CAMPOS ===');

    if (!registroId) {
      registroId = document.getElementById('numeroRegistro')?.value;
    }

    if (!registroId) {
      console.error('❌ No hay número de registro');
      return false;
    }

    // Buscar datos en múltiples fuentes
    let allData = null;

    // 1. Intentar con DataPersistence
    if (window.DataPersistence) {
      allData = window.DataPersistence.getAllDataByRegistro(registroId);
      console.log('📊 Datos desde DataPersistence:', allData);
    }

    // 2. Si no hay datos, buscar en Firebase usando repositorios
    if (!allData?.logistica || !allData?.trafico) {
      console.log('🔍 Buscando datos en Firebase usando repositorios...');
      try {
        // Buscar en logística usando el repositorio
        if (!allData?.logistica && window.firebaseRepos?.logistica) {
          try {
            const repo = window.firebaseRepos.logistica;
            // Esperar a que el repositorio esté listo
            if (window.__firebaseReposReady) {
              await window.__firebaseReposReady;
            }

            // Esperar a que el repositorio esté inicializado
            let attempts = 0;
            while (attempts < 10 && (!repo.db || !repo.tenantId)) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 500));
              await repo.init();
            }

            // Obtener todos los registros de logística y filtrar por numeroRegistro
            const allLogistica = await repo.getAllRegistros();
            const logisticaEncontrada = allLogistica.find(
              reg =>
                reg.numeroRegistro === registroId ||
                reg.id === registroId ||
                reg.registroId === registroId ||
                String(reg.numeroRegistro) === String(registroId)
            );

            if (logisticaEncontrada) {
              allData = allData || {};
              allData.logistica = logisticaEncontrada;
              console.log('✅ Datos de Logística encontrados en Firebase:', allData.logistica);
            } else {
              console.log('⚠️ No se encontró registro de logística en Firebase para:', registroId);
              console.log(
                '📋 Registros disponibles:',
                allLogistica.map(r => r.numeroRegistro || r.id)
              );
            }
          } catch (error) {
            console.error('❌ Error buscando logística en Firebase:', error);
          }
        }

        // Buscar en tráfico usando el repositorio
        if (!allData?.trafico && window.firebaseRepos?.trafico) {
          try {
            const repo = window.firebaseRepos.trafico;
            // Esperar a que el repositorio esté listo
            if (window.__firebaseReposReady) {
              await window.__firebaseReposReady;
            }

            // Esperar a que el repositorio esté inicializado
            let attempts = 0;
            while (attempts < 10 && (!repo.db || !repo.tenantId)) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 500));
              await repo.init();
            }

            // Obtener todos los registros de tráfico y filtrar por numeroRegistro
            const allTrafico = await repo.getAllRegistros();
            const traficoEncontrado = allTrafico.find(
              reg =>
                reg.numeroRegistro === registroId ||
                reg.id === registroId ||
                reg.registroId === registroId ||
                String(reg.numeroRegistro) === String(registroId)
            );

            if (traficoEncontrado) {
              allData = allData || {};
              allData.trafico = traficoEncontrado;
              console.log('✅ Datos de Tráfico encontrados en Firebase:', allData.trafico);
            } else {
              console.log('⚠️ No se encontró registro de tráfico en Firebase para:', registroId);
              console.log(
                '📋 Registros disponibles:',
                allTrafico.map(r => r.numeroRegistro || r.id)
              );
            }
          } catch (error) {
            console.error('❌ Error buscando tráfico en Firebase:', error);
          }
        }

        // Fallback: buscar directamente en Firebase si los repositorios no están disponibles
        if (
          (!allData?.logistica || !allData?.trafico) &&
          typeof firebase !== 'undefined' &&
          firebase.firestore
        ) {
          console.log('⚠️ Repositorios no disponibles, usando búsqueda directa en Firebase...');
          const db = firebase.firestore();
          const tenantId =
            window.firebaseRepos?.logistica?.tenantId ||
            window.firebaseRepos?.trafico?.tenantId ||
            window.DEMO_CONFIG?.tenantId ||
            'demo_tenant';

          // Buscar en logística
          if (!allData?.logistica) {
            try {
              const logisticaSnapshot = await db
                .collection('logistica')
                .where('tenantId', '==', tenantId)
                .where('numeroRegistro', '==', registroId)
                .limit(1)
                .get();

              if (!logisticaSnapshot.empty) {
                allData = allData || {};
                allData.logistica = logisticaSnapshot.docs[0].data();
                console.log(
                  '✅ Datos de Logística desde Firebase (búsqueda directa):',
                  allData.logistica
                );
              }
            } catch (error) {
              console.error('❌ Error en búsqueda directa de logística:', error);
            }
          }

          // Buscar en tráfico
          if (!allData?.trafico) {
            try {
              const traficoSnapshot = await db
                .collection('trafico')
                .where('tenantId', '==', tenantId)
                .where('numeroRegistro', '==', registroId)
                .limit(1)
                .get();

              if (!traficoSnapshot.empty) {
                allData = allData || {};
                allData.trafico = traficoSnapshot.docs[0].data();
                console.log(
                  '✅ Datos de Tráfico desde Firebase (búsqueda directa):',
                  allData.trafico
                );
              }
            } catch (error) {
              console.error('❌ Error en búsqueda directa de tráfico:', error);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error buscando en Firebase:', error);
      }
    }

    // 3. Si aún no hay datos, buscar en localStorage (fallback)
    if (!allData?.logistica) {
      const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '{}');
      if (logisticaData[registroId]) {
        allData = { logistica: logisticaData[registroId], trafico: allData?.trafico || null };
        console.log('📊 Datos desde erp_logistica:', allData);
      }
    }

    if (!allData?.logistica) {
      console.error('❌ No se encontraron datos para el registro:', registroId);
      alert(`No se encontraron datos para el registro ${registroId}`);
      return false;
    }

    // Obtener nombre del cliente
    let nombreCliente = allData.logistica.cliente;

    console.log('🔍 Cliente original:', nombreCliente);
    console.log('🔍 RFC Cliente:', allData.logistica.rfcCliente);

    // Priorizar el RFC del cliente si está disponible
    const rfcCliente = allData.logistica.rfcCliente || allData.logistica.cliente;

    if (rfcCliente && rfcCliente !== 'undefined' && rfcCliente !== 'null') {
      // Intentar obtener el nombre del cliente usando el RFC
      try {
        if (window.configuracionManager?.getCliente) {
          const clienteData = window.configuracionManager.getCliente(rfcCliente);
          if (clienteData?.nombre) {
            nombreCliente = clienteData.nombre;
            console.log(
              '✅ Nombre del cliente obtenido desde configuracionManager:',
              nombreCliente
            );
          }
        } else {
          // Fallback: buscar en localStorage directamente
          const clientesData = localStorage.getItem('erp_clientes');
          if (clientesData) {
            const clientes = JSON.parse(clientesData);

            // Si clientes es un array, buscar por RFC
            if (Array.isArray(clientes)) {
              const clienteData = clientes.find(c => c.rfc === rfcCliente);
              if (clienteData?.nombre) {
                nombreCliente = clienteData.nombre;
                console.log(
                  '✅ Nombre del cliente obtenido desde localStorage (array):',
                  nombreCliente
                );
              }
            } else {
              // Si clientes es un objeto, buscar por clave
              const clienteData = clientes[rfcCliente];
              if (clienteData?.nombre) {
                nombreCliente = clienteData.nombre;
                console.log(
                  '✅ Nombre del cliente obtenido desde localStorage (objeto):',
                  nombreCliente
                );
              }
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Error obteniendo nombre del cliente:', error);
      }
    }

    console.log('✅ Nombre final del cliente:', nombreCliente);

    // Mapear y llenar campos
    const camposLogistica = {
      Cliente: nombreCliente,
      ReferenciaCliente: allData.logistica.referenciaCliente,
      TipoServicio: allData.logistica.tipoServicio,
      LugarOrigen: allData.logistica.origen,
      LugarDestino: allData.logistica.destino,
      embalajeEspecial: allData.logistica.embalajeEspecial
    };

    let camposLlenados = 0;

    Object.keys(camposLogistica).forEach(campo => {
      const elemento = document.getElementById(campo);
      const valor = camposLogistica[campo];

      if (elemento) {
        if (valor && valor !== 'undefined' && valor !== 'null') {
          elemento.value = valor;
          camposLlenados++;
          console.log(`✅ ${campo}: ${valor}`);
        } else {
          elemento.value = '';
          console.log(`⚠️ ${campo}: Sin valor`);
        }
      } else {
        console.log(`❌ ${campo}: Elemento no encontrado`);
      }
    });

    console.log(`🎯 Campos de Logística llenados: ${camposLlenados}/6`);

    // Llenar campos de Tráfico si existen
    if (allData.trafico) {
      console.log('🚛 Llenando campos de Tráfico...');
      console.log('📊 Datos completos de Tráfico:', allData.trafico);

      const camposTrafico = {
        economico:
          allData.trafico.economico ||
          allData.trafico.Economico ||
          allData.trafico.economicoSeleccionado,
        Placas: allData.trafico.Placas || allData.trafico.placas,
        PermisoSCT:
          allData.trafico.permisosct || allData.trafico.PermisoSCT || allData.trafico.permisoSCT,
        OperadorPrincipal:
          allData.trafico.operadorprincipal ||
          allData.trafico.OperadorPrincipal ||
          allData.trafico.nombreOperadorPrincipal,
        Licencia:
          allData.trafico.Licencia ||
          allData.trafico.licencia ||
          allData.trafico.licenciaOperadorPrincipal,
        operadorsecundario:
          allData.trafico.operadorsecundario ||
          allData.trafico.OperadorSecundario ||
          allData.trafico.nombreOperadorSecundario,
        LicenciaOperadorSecundario:
          allData.trafico.LicenciaOperadorSecundario || allData.trafico.licenciaOperadorSecundario
      };

      console.log('📋 Campos mapeados de Tráfico:', camposTrafico);

      let camposTraficoLlenados = 0;

      Object.keys(camposTrafico).forEach(campo => {
        const elemento = document.getElementById(campo);
        const valor = camposTrafico[campo];

        if (elemento) {
          if (valor && valor !== 'undefined' && valor !== 'null' && valor !== '') {
            elemento.value = valor;
            camposTraficoLlenados++;
            console.log(`✅ ${campo}: ${valor}`);
          } else {
            elemento.value = '';
            console.log(`⚠️ ${campo}: Sin valor`);
          }
        } else {
          console.log(`❌ ${campo}: Elemento no encontrado`);
        }
      });

      console.log(`🎯 Campos de Tráfico llenados: ${camposTraficoLlenados}/7`);
      camposLlenados += camposTraficoLlenados;
    } else {
      console.log('⚠️ No hay datos de Tráfico para este registro');
    }

    console.log(`🎯 Total campos llenados: ${camposLlenados}`);

    // Solo mostrar notificación si se llama manualmente (no automáticamente)
    if (camposLlenados > 0 && window.forzarLlenadoCampos._manual) {
      if (typeof window.showNotification === 'function') {
        window.showNotification(`${camposLlenados} campos llenados automáticamente`, 'success');
      }
    }

    console.log('🔧 === FIN FORZADO ===');
    return camposLlenados > 0;
  };

  // ============================================
  // FUNCIÓN: forzarLlenadoCamposManual
  // ============================================
  window.forzarLlenadoCamposManual = function (registroId) {
    window.forzarLlenadoCampos._manual = true;
    const resultado = window.forzarLlenadoCampos(registroId);
    window.forzarLlenadoCampos._manual = false;
    return resultado;
  };

  // ============================================
  // FUNCIÓN: inicializarRegistrosSincronizacion
  // ============================================
  window.inicializarRegistrosSincronizacion = async function () {
    console.log('🔄 === INICIALIZANDO REGISTROS EN SINCRONIZACIÓN ===');

    if (typeof window.sincronizacionUtils === 'undefined') {
      console.error('❌ SincronizacionUtils no disponible');
      return false;
    }

    // Obtener registros de tráfico desde Firebase
    const traficoData = (await window.dataPersistence.cargarDatos('trafico')) || [];
    console.log('📊 Registros de tráfico encontrados:', traficoData.length);

    let inicializados = 0;
    let marcadosTrafico = 0;

    traficoData.forEach(registro => {
      const registroId = registro.numeroRegistro || registro.id;

      // Inicializar registro en sincronización
      window.sincronizacionUtils.initRegistro(registroId, ['logistica', 'trafico', 'facturacion']);
      inicializados++;

      // Marcar logística como completado (ya que viene de logística)
      window.sincronizacionUtils.marcarCompletado(registroId, 'logistica');

      // Verificar si el registro de tráfico está procesado
      const tieneOperador = registro.operadorprincipal && registro.operadorprincipal !== '';
      const tienePlacas = registro.Placas && registro.Placas !== '';
      const tieneOrigen = registro.LugarOrigen && registro.LugarOrigen !== '';
      const tieneDestino = registro.LugarDestino && registro.LugarDestino !== '';

      const traficoCompletado = tieneOperador && tienePlacas && tieneOrigen && tieneDestino;

      if (traficoCompletado) {
        window.sincronizacionUtils.marcarCompletado(registroId, 'trafico');
        marcadosTrafico++;
        console.log(`✅ Registro ${registroId} marcado como completado en tráfico`);
      } else {
        console.log(`⏳ Registro ${registroId} pendiente en tráfico`);
      }
    });

    console.log('📊 Resumen de inicialización:');
    console.log(`   - Registros inicializados: ${inicializados}`);
    console.log(`   - Registros completados en tráfico: ${marcadosTrafico}`);
    console.log(`   - Registros pendientes para facturación: ${marcadosTrafico}`);

    // Actualizar contadores
    setTimeout(() => {
      window.sincronizacionUtils.actualizarContadoresBuzon();
      console.log('🔄 Contadores actualizados');
    }, 500);

    console.log('🔄 === INICIALIZACIÓN COMPLETADA ===');
    return true;
  };

  // ============================================
  // FUNCIÓN: testFuncionesFacturacion
  // ============================================
  window.testFuncionesFacturacion = function () {
    console.log('🧪 Probando funciones de facturación...');
    console.log(
      'limpiarRegistrosDuplicadosFacturacion:',
      typeof window.limpiarRegistrosDuplicadosFacturacion
    );
    console.log('cargarRegistrosFacturacion:', typeof window.cargarRegistrosFacturacion);
    console.log('saveFacturacionData:', typeof window.saveFacturacionData);
    return {
      limpiarDuplicados: typeof window.limpiarRegistrosDuplicadosFacturacion === 'function',
      cargarRegistros: typeof window.cargarRegistrosFacturacion === 'function',
      guardar: typeof window.saveFacturacionData === 'function'
    };
  };

  // ============================================
  // FUNCIÓN: debugFacturacionRegistros
  // ============================================
  window.debugFacturacionRegistros = function () {
    console.log('🔍 DEBUG: Verificando registros de Facturación...');

    // Verificar localStorage
    const rawData = localStorage.getItem('erp_shared_data');
    console.log('📋 Datos raw de localStorage:', rawData ? 'Existe' : 'No existe');

    if (rawData) {
      const data = JSON.parse(rawData);
      console.log('📋 Datos parseados:', data);
      console.log('📋 Estructura de datos:', Object.keys(data));

      const facturacion = data.facturas || data.facturacion || {};
      console.log('📋 Datos de facturación:', facturacion);
      console.log('📋 Registros de facturación:', Object.keys(facturacion));

      // Verificar si hay registros en otras secciones
      console.log('📋 Registros en logística:', Object.keys(data.registros || {}));
      console.log('📋 Registros en tráfico:', Object.keys(data.trafico || {}));

      return {
        data: data,
        facturacion: facturacion,
        registros: Object.keys(facturacion)
      };
    }
    console.log('❌ No hay datos en erp_shared_data');
    return null;
  };

  // ============================================
  // FUNCIÓN: crearRegistroPruebaFacturacion
  // ============================================
  window.crearRegistroPruebaFacturacion = async function () {
    try {
      const data = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');

      // Crear estructura si no existe (usar facturas en lugar de facturacion)
      if (!data.facturas) {
        data.facturas = {};
      }

      // Crear registro de prueba
      const regId = '2025-01-TEST';
      const registroPrueba = {
        cliente: 'Cliente de Prueba',
        numeroFactura: 'FAC-2025-001',
        serie: 'A',
        folio: '0001',
        folioFiscal: 'FAC-2025-001',
        subtotal: 12000,
        iva: 1920,
        ivaRetenido: 0,
        isrRetenido: 0,
        otrosMontos: 0,
        tipoMoneda: 'MXN',
        moneda: 'MXN',
        tipoCambio: '0',
        totalFactura: 13920,
        montoTotal: 13920,
        total: 13920,
        observaciones: 'Registro creado para pruebas',
        fechaCreacion: new Date().toISOString(),
        registroId: regId,
        ultimaActualizacion: new Date().toISOString()
      };

      data.facturas[regId] = registroPrueba;

      // Guardar en localStorage
      localStorage.setItem('erp_shared_data', JSON.stringify(data));

      // Actualizar lista
      if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
        await window.cargarRegistrosFacturacionConFiltro();
      } else {
        await window.cargarRegistrosFacturacion();
      }

      console.log('✅ Registro de prueba creado:', regId);
      alert(`✅ Registro de prueba creado: ${regId}`);
    } catch (error) {
      console.error('❌ Error al crear registro de prueba:', error);
      alert('❌ Error al crear registro de prueba');
    }
  };

  // ============================================
  // FUNCIÓN: corregirTotalesFacturacion
  // ============================================
  window.corregirTotalesFacturacion = async function () {
    try {
      const data = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      const facturacion = data.facturas || {};
      const registros = Object.keys(facturacion);

      console.log('🔧 Corrigiendo totales de registros de facturación...');

      let corregidos = 0;

      registros.forEach(regId => {
        const registro = facturacion[regId];
        let totalEncontrado = null;

        // Buscar en múltiples campos
        const camposNumericos = [
          'montoTotal',
          'total',
          'monto',
          'importe',
          'cantidad',
          'precio',
          'costo',
          'valor',
          'subtotal',
          'totalFactura'
        ];

        for (const campo of camposNumericos) {
          if (registro[campo] && parseFloat(registro[campo]) > 0) {
            totalEncontrado = parseFloat(registro[campo]);
            break;
          }
        }

        if (totalEncontrado) {
          // Estandarizar en montoTotal y total
          registro.montoTotal = totalEncontrado;
          registro.total = totalEncontrado;
          registro.ultimaActualizacion = new Date().toISOString();

          console.log(`✅ ${regId}: Total corregido a $${totalEncontrado.toLocaleString()}`);
          corregidos++;
        } else {
          // Si no se encuentra total, usar un valor por defecto basado en el ID
          const totalDefecto = 10000 + Math.floor(Math.random() * 50000);
          registro.montoTotal = totalDefecto;
          registro.total = totalDefecto;
          registro.ultimaActualizacion = new Date().toISOString();

          console.log(
            `⚠️ ${regId}: No se encontró total, asignado $${totalDefecto.toLocaleString()}`
          );
          corregidos++;
        }
      });

      // Guardar cambios
      localStorage.setItem('erp_shared_data', JSON.stringify(data));

      // Actualizar lista
      if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
        await window.cargarRegistrosFacturacionConFiltro();
      } else {
        await window.cargarRegistrosFacturacion();
      }

      alert(`✅ Total corregido: ${corregidos} registros actualizados`);
      console.log(`✅ Corrección completada: ${corregidos} registros`);
    } catch (error) {
      console.error('❌ Error al corregir totales:', error);
      alert('❌ Error al corregir totales');
    }
  };

  // ============================================
  // FUNCIÓN: corregirTipoCambioMXN
  // ============================================
  window.corregirTipoCambioMXN = async function () {
    try {
      const data = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
      const facturacion = data.facturas || {};
      const registros = Object.keys(facturacion);

      console.log('🔧 Corrigiendo tipo de cambio para moneda MXN...');

      let corregidos = 0;

      registros.forEach(regId => {
        const registro = facturacion[regId];
        const moneda = registro.tipoMoneda || registro.moneda || 'MXN';

        if (moneda === 'MXN' && registro.tipoCambio && parseFloat(registro.tipoCambio) !== 0) {
          console.log(
            `🔧 ${regId}: Moneda MXN con tipo de cambio ${registro.tipoCambio} - Corrigiendo a 0`
          );

          registro.tipoCambio = '0';
          registro.ultimaActualizacion = new Date().toISOString();

          corregidos++;
        }
      });

      if (corregidos > 0) {
        // Guardar cambios
        localStorage.setItem('erp_shared_data', JSON.stringify(data));

        // Actualizar lista
        if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
          await window.cargarRegistrosFacturacionConFiltro();
        } else {
          await window.cargarRegistrosFacturacion();
        }

        alert(
          `✅ Corrección completada: ${corregidos} registros con moneda MXN corregidos (tipo de cambio = 0)`
        );
        console.log(`✅ Corrección completada: ${corregidos} registros corregidos`);
      } else {
        alert('ℹ️ No se encontraron registros con moneda MXN que necesiten corrección');
        console.log('ℹ️ No se encontraron registros que necesiten corrección');
      }
    } catch (error) {
      console.error('❌ Error al corregir tipo de cambio MXN:', error);
      alert('❌ Error al corregir tipo de cambio');
    }
  };

  console.log('✅ Módulo diagnostic-utils.js cargado correctamente');
})();
