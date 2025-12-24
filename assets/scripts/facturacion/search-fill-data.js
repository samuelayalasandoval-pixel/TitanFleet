/**
 * Búsqueda y Llenado de Datos - facturacion.html
 * Función para buscar y llenar automáticamente los campos del formulario
 */

(function () {
  'use strict';

  /**
   * Función de respaldo para searchAndFillData en facturación
   * Busca datos de logística y tráfico y llena los campos del formulario
   * @param {string} registroId - Número de registro a buscar
   * @returns {boolean} true si se llenaron campos, false si no
   */
  window.safeSearchAndFillData = async function (registroId) {
    console.log('🔍 Ejecutando búsqueda segura para facturación:', registroId);

    if (!registroId) {
      alert('Por favor ingrese un número de registro');
      return false;
    }

    // NO usar datos de ejemplo/fallback - solo datos reales de Firebase

    // Verificar que DataPersistence esté disponible
    if (typeof window.DataPersistence === 'undefined') {
      console.error('❌ DataPersistence no disponible, creando versión de respaldo...');

      // Crear DataPersistence de respaldo
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

    console.log('🔍 Buscando datos para registro:', registroId);

    const allData = await window.DataPersistence.getAllDataByRegistro(registroId);

    console.log('📊 Datos encontrados:', {
      logistica: allData.logistica ? '✅ Encontrado' : '❌ No encontrado',
      trafico: allData.trafico ? '✅ Encontrado' : '❌ No encontrado',
      facturacion: allData.facturacion ? '✅ Encontrado' : '❌ No encontrado'
    });

    // Diagnóstico detallado de datos de logística
    if (allData.logistica) {
      console.log('📦 Datos de logística encontrados desde Firebase:', allData.logistica);
    } else {
      console.log('❌ No hay datos de logística en Firebase');

      // SOLO verificar localStorage si Firebase NO está disponible
      const firebaseDisponible = window.firebaseRepos && window.firebaseRepos.logistica;
      if (!firebaseDisponible) {
        console.warn(
          '⚠️ Firebase no disponible, verificando localStorage como respaldo temporal...'
        );
        const logisticaDirecta = JSON.parse(localStorage.getItem('erp_logistica') || '{}');
        if (logisticaDirecta[registroId]) {
          console.warn(
            '⚠️ Datos encontrados en localStorage (Firebase no disponible):',
            logisticaDirecta[registroId]
          );
          allData.logistica = logisticaDirecta[registroId];
        } else {
          console.warn('❌ Tampoco hay datos en localStorage para:', registroId);
        }
      } else {
        console.warn(
          '⚠️ Firebase disponible pero registro no encontrado - NO se usará localStorage'
        );
      }
    }

    // Verificar si allData es null o undefined
    if (!allData) {
      console.error('❌ No se pudieron obtener datos del sistema');
      alert(
        '❌ Error: No se pudieron obtener datos del sistema.\n\nPosibles causas:\n- localStorage está vacío\n- Error en DataPersistence\n\nSolución: Usa "Cargar Datos Ejemplo" para crear registros de prueba.'
      );
      return false;
    }

    if (!allData.logistica && !allData.trafico) {
      // Verificar si el formato del registro es incorrecto
      const formatoAntiguo = /^2025-\d{2}-\d{4}$/;
      const formatoCorrecto = /^25\d{5}$/;

      let mensajeError = `No se encontró el registro ${registroId}.`;

      if (formatoAntiguo.test(registroId)) {
        mensajeError += `\n\n⚠️ Formato antiguo detectado: ${registroId}\nEl sistema ahora usa el formato: 25XXXXX (ejemplo: 2500001)\n\nPor favor, usa el número de registro correcto. El campo se limpiará automáticamente para generar el número correcto.`;

        // Limpiar el campo si tiene formato antiguo
        const numeroRegistroInput = document.getElementById('numeroRegistro');
        if (numeroRegistroInput) {
          numeroRegistroInput.value = '';
          console.log('🔄 Campo numeroRegistro limpiado (formato antiguo detectado)');

          // NO generar número aquí - solo limpiar el campo
          // El número se generará automáticamente si es necesario desde main.js
          console.log(
            '✅ Campo limpiado (formato antiguo), número se generará automáticamente si es necesario'
          );
        }
      } else if (!formatoCorrecto.test(registroId)) {
        mensajeError +=
          '\n\n⚠️ Formato incorrecto. El sistema espera números en formato: 25XXXXX (ejemplo: 2500001)';
      } else {
        mensajeError +=
          '\n\nPosibles causas:\n- El registro no existe\n- Los datos no se guardaron correctamente\n\nSolución: Verifica que el registro exista en Logística o Tráfico.';
      }

      alert(mensajeError);
      return false;
    }

    let camposLlenados = 0;
    let mensaje = `✅ Datos cargados para ${registroId}:\n\n`;

    // Llenar datos de logística
    if (allData.logistica) {
      console.log('📦 Llenando datos de logística...');
      mensaje += '📦 DATOS DE LOGÍSTICA:\n';

      // Obtener el nombre del cliente basado en el RFC
      let nombreCliente = allData.logistica.cliente;
      console.log('🔍 Cliente original:', allData.logistica.cliente);
      console.log('🔍 RFC Cliente:', allData.logistica.rfcCliente);

      // Verificar si hay un RFC válido (no "undefined" string)
      const { rfcCliente } = allData.logistica;
      if (rfcCliente && rfcCliente !== 'undefined' && rfcCliente !== 'null') {
        // Buscar el nombre del cliente en la configuración
        try {
          console.log('🔍 Buscando cliente con RFC:', rfcCliente);

          // PRIORIDAD: Firebase es la fuente de verdad
          if (
            window.configuracionManager &&
            typeof window.configuracionManager.getCliente === 'function'
          ) {
            const clienteData = window.configuracionManager.getCliente(rfcCliente);
            if (clienteData && clienteData.nombre) {
              nombreCliente = clienteData.nombre;
              console.log('✅ Nombre del cliente encontrado desde Firebase:', nombreCliente);
            } else {
              console.warn('⚠️ Cliente no encontrado en Firebase - NO se usará localStorage');
            }
          } else {
            // SOLO usar localStorage si Firebase NO está disponible
            const firebaseDisponible = window.firebaseRepos && window.firebaseRepos.configuracion;
            if (!firebaseDisponible) {
              console.warn('⚠️ Firebase no disponible, usando localStorage como respaldo temporal');
              const clientesData = localStorage.getItem('erp_clientes');
              if (clientesData) {
                const clientes = JSON.parse(clientesData);
                // Si clientes es un array, buscar por RFC
                if (Array.isArray(clientes)) {
                  const clienteData = clientes.find(c => c.rfc === rfcCliente);
                  if (clienteData && clienteData.nombre) {
                    nombreCliente = clienteData.nombre;
                    console.warn(
                      '⚠️ Nombre del cliente encontrado en localStorage (Firebase no disponible):',
                      nombreCliente
                    );
                  }
                } else {
                  // Si clientes es un objeto, buscar por clave
                  const clienteData = clientes[rfcCliente];
                  if (clienteData && clienteData.nombre) {
                    nombreCliente = clienteData.nombre;
                    console.warn(
                      '⚠️ Nombre del cliente encontrado en localStorage (Firebase no disponible):',
                      nombreCliente
                    );
                  }
                }
              }
            } else {
              console.warn(
                '⚠️ Firebase disponible pero configuracionManager no tiene getCliente - NO se usará localStorage'
              );
            }
          }
        } catch (error) {
          console.log('⚠️ Error al obtener el nombre del cliente:', error);
        }
      } else {
        console.log('⚠️ No hay RFC del cliente disponible o es inválido:', rfcCliente);

        // Si el cliente es un RFC válido, intentar buscarlo directamente
        if (
          allData.logistica.cliente &&
          allData.logistica.cliente !== 'undefined' &&
          allData.logistica.cliente !== 'null'
        ) {
          console.log(
            '🔍 Intentando buscar cliente con el valor del campo cliente:',
            allData.logistica.cliente
          );

          try {
            // PRIORIDAD: Firebase es la fuente de verdad
            if (
              window.configuracionManager &&
              typeof window.configuracionManager.getCliente === 'function'
            ) {
              console.log('✅ configuracionManager disponible en facturación');
              const clienteData = window.configuracionManager.getCliente(allData.logistica.cliente);
              console.log('🔍 Resultado de configuracionManager:', clienteData);

              if (clienteData && clienteData.nombre) {
                nombreCliente = clienteData.nombre;
                console.log('✅ Nombre del cliente encontrado desde Firebase:', nombreCliente);
              } else {
                console.warn('⚠️ Cliente no encontrado en Firebase - NO se usará localStorage');
              }
            } else {
              // SOLO usar localStorage si Firebase NO está disponible
              const firebaseDisponible = window.firebaseRepos && window.firebaseRepos.configuracion;
              if (!firebaseDisponible && nombreCliente === allData.logistica.cliente) {
                console.warn(
                  '⚠️ Firebase no disponible, usando localStorage como respaldo temporal'
                );
                const clientesData = localStorage.getItem('erp_clientes');
                if (clientesData) {
                  const clientes = JSON.parse(clientesData);
                  const clienteData = clientes[allData.logistica.cliente];
                  console.log('🔍 Cliente encontrado en localStorage:', clienteData);

                  if (clienteData && clienteData.nombreCliente) {
                    nombreCliente = clienteData.nombreCliente;
                    console.warn(
                      '⚠️ Nombre del cliente encontrado en localStorage (Firebase no disponible):',
                      nombreCliente
                    );
                  } else {
                    console.warn('⚠️ No se encontró nombreCliente en localStorage');
                  }
                } else {
                  console.warn('⚠️ No hay datos de clientes en localStorage');
                }
              } else {
                console.warn(
                  '⚠️ Firebase disponible pero configuracionManager no tiene getCliente - NO se usará localStorage'
                );
              }
            }
          } catch (error) {
            console.log('⚠️ Error al buscar cliente usando campo cliente:', error);
          }
        }
      }

      console.log('✅ Nombre final del cliente:', nombreCliente);

      const camposLogistica = {
        Cliente: nombreCliente,
        ReferenciaCliente: allData.logistica.referenciaCliente,
        TipoServicio: allData.logistica.tipoServicio,
        LugarOrigen: allData.logistica.origen,
        LugarDestino: allData.logistica.destino,
        embalajeEspecial: allData.logistica.embalajeEspecial
      };

      Object.keys(camposLogistica).forEach(selector => {
        const element = document.getElementById(selector);
        if (element && camposLogistica[selector]) {
          element.value = camposLogistica[selector];
          camposLlenados++;
          console.log(`✅ Campo ${selector} llenado:`, camposLogistica[selector]);
          mensaje += `- ${selector}: ${camposLogistica[selector]}\n`;
        }
      });
    }

    // Llenar datos de tráfico
    if (allData.trafico) {
      console.log('🚛 Llenando datos de tráfico...');
      mensaje += '\n🚛 DATOS DE TRÁFICO:\n';

      // Usar SOLO los datos reales de Firebase - NO buscar en configuración/localStorage
      const economicoValue = allData.trafico.economico || allData.trafico.numeroEconomico || '';
      if (
        !economicoValue ||
        economicoValue === '' ||
        economicoValue === 'undefined' ||
        economicoValue === 'null'
      ) {
        console.warn('⚠️ Campo económico vacío en datos de tráfico de Firebase - NO se llenará');
      }

      // Obtener operadores y licencias - buscar en múltiples campos posibles
      const operadorPrincipalValue =
        allData.trafico.operadorprincipal ||
        allData.trafico.operadorPrincipal ||
        allData.trafico.OperadorPrincipal ||
        '';
      const operadorSecundarioValue =
        allData.trafico.operadorsecundario ||
        allData.trafico.operadorSecundario ||
        allData.trafico.OperadorSecundario ||
        '';

      // Buscar licencias en múltiples campos posibles
      let licenciaValue =
        allData.trafico.Licencia ||
        allData.trafico.licencia ||
        allData.trafico.licenciaPrincipal ||
        allData.trafico.licenciaOperadorPrincipal ||
        '';
      let licenciaSecundariaValue =
        allData.trafico.LicenciaSecundaria ||
        allData.trafico.licenciaSecundaria ||
        allData.trafico.licenciaOperadorSecundario ||
        '';

      console.log('🔍 Valores encontrados en tráfico:', {
        operadorPrincipal: operadorPrincipalValue,
        operadorSecundario: operadorSecundarioValue,
        licencia: licenciaValue,
        licenciaSecundaria: licenciaSecundariaValue
      });

      // Si falta la licencia pero hay operador, buscar la licencia del operador SOLO desde Firebase
      if (operadorPrincipalValue && !licenciaValue) {
        console.log(
          '🔍 Licencia principal no encontrada, buscando desde operador en Firebase:',
          operadorPrincipalValue
        );
        try {
          // Buscar SOLO en Firebase - NO usar localStorage
          if (window.configuracionManager) {
            // Intentar obtener operadores desde configuracionManager (Firebase)
            let operadores = [];
            if (typeof window.configuracionManager.getAllOperadores === 'function') {
              operadores = (await window.configuracionManager.getAllOperadores()) || [];
            } else if (typeof window.configuracionManager.getOperadores === 'function') {
              operadores = (await window.configuracionManager.getOperadores()) || [];
            }
            const operadorEncontrado = operadores.find(op => {
              const nombre = (op.nombre || op.nombreOperador || '').toString().trim();
              return (
                nombre === operadorPrincipalValue ||
                nombre.includes(operadorPrincipalValue) ||
                operadorPrincipalValue.includes(nombre)
              );
            });
            if (operadorEncontrado) {
              licenciaValue =
                operadorEncontrado.licencia || operadorEncontrado.licenciaOperador || '';
              console.log('✅ Licencia principal encontrada desde Firebase:', licenciaValue);
            } else {
              console.warn('⚠️ Operador no encontrado en Firebase - licencia NO se llenará');
            }
          } else {
            console.warn('⚠️ configuracionManager no disponible - licencia NO se llenará');
          }
        } catch (error) {
          console.warn('⚠️ Error buscando licencia principal en Firebase:', error);
        }
      }

      // Si falta la licencia secundaria pero hay operador secundario, buscar la licencia SOLO desde Firebase
      if (operadorSecundarioValue && !licenciaSecundariaValue) {
        console.log(
          '🔍 Licencia secundaria no encontrada, buscando desde operador en Firebase:',
          operadorSecundarioValue
        );
        try {
          // Buscar SOLO en Firebase - NO usar localStorage
          if (window.configuracionManager) {
            let operadores = [];
            if (typeof window.configuracionManager.getAllOperadores === 'function') {
              operadores = (await window.configuracionManager.getAllOperadores()) || [];
            } else if (typeof window.configuracionManager.getOperadores === 'function') {
              operadores = (await window.configuracionManager.getOperadores()) || [];
            }
            const operadorEncontrado = operadores.find(op => {
              const nombre = (op.nombre || op.nombreOperador || '').toString().trim();
              return (
                nombre === operadorSecundarioValue ||
                nombre.includes(operadorSecundarioValue) ||
                operadorSecundarioValue.includes(nombre)
              );
            });
            if (operadorEncontrado) {
              licenciaSecundariaValue =
                operadorEncontrado.licencia || operadorEncontrado.licenciaOperador || '';
              console.log(
                '✅ Licencia secundaria encontrada desde Firebase:',
                licenciaSecundariaValue
              );
            } else {
              console.warn(
                '⚠️ Operador secundario no encontrado en Firebase - licencia NO se llenará'
              );
            }
          } else {
            console.warn(
              '⚠️ configuracionManager no disponible - licencia secundaria NO se llenará'
            );
          }
        } catch (error) {
          console.warn('⚠️ Error buscando licencia secundaria en Firebase:', error);
        }
      }

      // NO buscar operadores en configuración - solo usar datos reales de Firebase
      if (
        !operadorPrincipalValue ||
        operadorPrincipalValue === '' ||
        operadorPrincipalValue === 'undefined' ||
        operadorPrincipalValue === 'null'
      ) {
        console.warn('⚠️ Operador principal vacío en datos de tráfico de Firebase - NO se llenará');
      }

      // Usar SOLO los datos reales de Firebase - NO buscar en configuración/localStorage
      const placasValue =
        allData.trafico.Placas || allData.trafico.placas || allData.trafico.placaTracto || '';
      const permisosctValue =
        allData.trafico.permisosct ||
        allData.trafico.permisoSCT ||
        allData.trafico.PermisoSCT ||
        '';

      if (!placasValue || !permisosctValue) {
        console.warn(
          '⚠️ Placas o Permiso SCT vacíos en datos de tráfico de Firebase - NO se llenarán'
        );
      }

      const camposTrafico = {
        economico: economicoValue,
        Placas: placasValue,
        PermisoSCT: permisosctValue,
        OperadorPrincipal: operadorPrincipalValue,
        Licencia: licenciaValue,
        operadorsecundario: operadorSecundarioValue,
        LicenciaSecundaria: licenciaSecundariaValue
      };

      console.log('📋 Valores finales para campos de tráfico:', camposTrafico);

      Object.keys(camposTrafico).forEach(selector => {
        const element = document.getElementById(selector);
        const valor = camposTrafico[selector];

        if (element) {
          // Para licencias, intentar llenar incluso si el valor está vacío pero hay operador
          if (selector === 'Licencia' && !valor && operadorPrincipalValue) {
            console.warn(
              `⚠️ Licencia principal vacía pero hay operador: ${operadorPrincipalValue}. El campo no se llenará.`
            );
          } else if (selector === 'LicenciaSecundaria' && !valor && operadorSecundarioValue) {
            console.warn(
              `⚠️ Licencia secundaria vacía pero hay operador secundario: ${operadorSecundarioValue}. El campo no se llenará.`
            );
          }

          if (valor && valor !== '' && valor !== 'undefined' && valor !== 'null') {
            element.value = valor;
            camposLlenados++;
            console.log(`✅ Campo ${selector} llenado:`, valor);
            mensaje += `- ${selector}: ${valor}\n`;
          } else {
            console.debug(`ℹ️ Campo ${selector} no se llenará (valor vacío o inválido):`, valor);
          }
        } else {
          console.warn(`⚠️ Elemento ${selector} no encontrado en el DOM`);
        }
      });
    } else if (allData.logistica) {
      // Si no hay datos de tráfico pero sí de logística, NO crear datos de ejemplo
      // Solo informar que no hay datos de tráfico disponibles
      console.log('⚠️ No hay datos de tráfico en Firebase para este registro');
      mensaje +=
        '\n⚠️ DATOS DE TRÁFICO: No disponibles (el registro no ha sido procesado en Tráfico)\n';
      console.warn('⚠️ No se llenarán campos de tráfico - no hay datos reales en Firebase');
    }

    if (camposLlenados > 0) {
      mensaje += `\n✅ Total de campos llenados: ${camposLlenados}`;
      console.log('✅ Datos cargados exitosamente:', mensaje);
      // Mostrar notificación sutil si está disponible, sino solo log
      if (typeof window.showNotification === 'function') {
        window.showNotification(`✅ ${camposLlenados} campos llenados automáticamente`, 'success');
      }
      return true;
    }
    console.warn('⚠️ Datos encontrados pero no se pudieron cargar los campos');
    // Solo mostrar notificación si realmente hay un problema
    if (typeof window.showNotification === 'function') {
      window.showNotification('⚠️ No se pudieron cargar algunos campos', 'warning');
    }
    return false;
  };
})();
