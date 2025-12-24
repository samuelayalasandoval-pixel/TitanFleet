/**
 * Inicialización de Página - trafico.html
 * Funciones para inicializar la página y configurar event listeners
 *
 * @module trafico/page-init
 */

(function () {
  'use strict';

  /**
   * Formatea una fecha para usarla en un input type="date"
   * @param {string|Date} fechaStr - Fecha en cualquier formato
   * @returns {string} Fecha en formato YYYY-MM-DD o cadena vacía si es inválida
   */
  window.formatearFechaParaInputDate = function (fechaStr) {
    if (!fechaStr) {
      return '';
    }
    try {
      // Si ya está en formato YYYY-MM-DD, retornarlo
      if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
        return fechaStr.split('T')[0];
      }
      // Si está en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}/.test(fechaStr)) {
        const [dia, mes, año] = fechaStr.split('/');
        return `${año}-${mes}-${dia}`;
      }
      // Si está en formato ISO, extraer solo la fecha
      if (fechaStr.includes('T')) {
        return fechaStr.split('T')[0];
      }
      // Intentar parsear como Date
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return '';
      }
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    } catch (error) {
      console.warn('⚠️ Error formateando fecha para input date:', fechaStr, error);
      return '';
    }
  };

  /**
   * Inicializa la página de tráfico
   * Configura event listeners, carga datos iniciales y configura sistemas de actualización
   */
  async function initializeTraficoPage() {
    // Marcar que la página se está inicializando
    window._inicializandoPagina = true;
    window._inicioInicializacion = Date.now();

    // Configurar event listener para el botón del buzón de pendientes
    // Esperar a que la función esté disponible antes de configurar el listener
    const btnBuzon = document.getElementById('btnBuzonPendientesTrafico');
    console.log('🔍 Buscando botón del buzón:', btnBuzon);
    console.log(
      '🔍 Verificación inicial: typeof window.mostrarBuzonPendientesTrafico =',
      typeof window.mostrarBuzonPendientesTrafico
    );

    // Escuchar evento cuando la función esté disponible
    document.addEventListener('mostrarBuzonPendientesTraficoReady', () => {
      console.log(
        '✅ Evento mostrarBuzonPendientesTraficoReady recibido, reconfigurando listener...'
      );
      const btnBuzonActual = document.getElementById('btnBuzonPendientesTrafico');
      if (btnBuzonActual && typeof window.mostrarBuzonPendientesTrafico === 'function') {
        // Verificar si ya tiene un listener configurado
        if (btnBuzonActual.getAttribute('data-listener-configurado') === 'true') {
          console.log('ℹ️ Listener ya configurado, omitiendo');
          return;
        }

        // Remover listeners anteriores si el botón tiene un padre
        if (btnBuzonActual.parentNode) {
          try {
            const nuevoBoton = btnBuzonActual.cloneNode(true);
            btnBuzonActual.parentNode.replaceChild(nuevoBoton, btnBuzonActual);

            nuevoBoton.addEventListener('click', async e => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔔 Click en botón del buzón de pendientes');

              if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
                try {
                  await window.mostrarBuzonPendientesTrafico();
                } catch (error) {
                  console.error('❌ Error al mostrar buzón:', error);
                  if (!window._inicializandoPagina) {
                    alert(`Error al abrir el buzón de pendientes: ${error.message}`);
                  }
                }
              }
            });
            nuevoBoton.setAttribute('data-listener-configurado', 'true');
            console.log('✅ Listener del buzón configurado después de recibir evento');
          } catch (error) {
            console.warn(
              '⚠️ Error reemplazando botón en evento, agregando listener directamente:',
              error
            );
            // Fallback: agregar listener directamente
            btnBuzonActual.addEventListener('click', async e => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
                try {
                  await window.mostrarBuzonPendientesTrafico();
                } catch (err) {
                  console.error('❌ Error al mostrar buzón:', err);
                  if (!window._inicializandoPagina) {
                    alert(`Error al abrir el buzón de pendientes: ${err.message}`);
                  }
                }
              }
            });
            btnBuzonActual.setAttribute('data-listener-configurado', 'true');
          }
        } else {
          // Si no tiene padre, agregar listener directamente
          btnBuzonActual.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
              try {
                await window.mostrarBuzonPendientesTrafico();
              } catch (err) {
                console.error('❌ Error al mostrar buzón:', err);
                if (!window._inicializandoPagina) {
                  alert(`Error al abrir el buzón de pendientes: ${err.message}`);
                }
              }
            }
          });
          btnBuzonActual.setAttribute('data-listener-configurado', 'true');
          console.log(
            '✅ Listener del buzón configurado después de recibir evento (sin reemplazo)'
          );
        }
      }
    });

    if (btnBuzon) {
      // Función para configurar el event listener cuando la función esté disponible
      const configurarBuzonListener = () => {
        if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
          // Obtener el botón actual (puede haber cambiado)
          const btnBuzonActual = document.getElementById('btnBuzonPendientesTrafico');
          if (!btnBuzonActual) {
            console.warn('⚠️ Botón del buzón no encontrado en el DOM');
            return false;
          }

          // Verificar si ya tiene un listener configurado
          if (btnBuzonActual.getAttribute('data-listener-configurado') === 'true') {
            return true; // Ya está configurado
          }

          // Remover listeners anteriores si el botón tiene un padre
          if (btnBuzonActual.parentNode) {
            try {
              const nuevoBoton = btnBuzonActual.cloneNode(true);
              btnBuzonActual.parentNode.replaceChild(nuevoBoton, btnBuzonActual);

              nuevoBoton.addEventListener('click', async e => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔔 Click en botón del buzón de pendientes');

                if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
                  try {
                    await window.mostrarBuzonPendientesTrafico();
                  } catch (error) {
                    console.error('❌ Error al mostrar buzón:', error);
                    if (!window._inicializandoPagina) {
                      alert(`Error al abrir el buzón de pendientes: ${error.message}`);
                    }
                  }
                } else if (!window._inicializandoPagina) {
                  alert(
                    'La función del buzón de pendientes no está disponible. Por favor, recarga la página.'
                  );
                }
              });
              nuevoBoton.setAttribute('data-listener-configurado', 'true');
              console.log('✅ Event listener configurado para botón del buzón de pendientes');
              return true;
            } catch (error) {
              console.warn('⚠️ Error reemplazando botón, agregando listener directamente:', error);
              // Fallback: agregar listener directamente
              btnBuzonActual.addEventListener('click', async e => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
                  try {
                    await window.mostrarBuzonPendientesTrafico();
                  } catch (err) {
                    console.error('❌ Error al mostrar buzón:', err);
                    if (!window._inicializandoPagina) {
                      alert(`Error al abrir el buzón de pendientes: ${err.message}`);
                    }
                  }
                }
              });
              btnBuzonActual.setAttribute('data-listener-configurado', 'true');
              return true;
            }
          } else {
            // Si no tiene padre, agregar listener directamente
            console.warn('⚠️ Botón del buzón no tiene padre, agregando listener directamente');
            btnBuzonActual.addEventListener('click', async e => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
                try {
                  await window.mostrarBuzonPendientesTrafico();
                } catch (err) {
                  console.error('❌ Error al mostrar buzón:', err);
                  if (!window._inicializandoPagina) {
                    alert(`Error al abrir el buzón de pendientes: ${err.message}`);
                  }
                }
              }
            });
            btnBuzonActual.setAttribute('data-listener-configurado', 'true');
            return true;
          }
        }
        return false;
      };

      // Configurar listener que siempre verifica si la función está disponible
      // Esto funciona incluso si el script se carga después
      const configurarListenerUniversal = () => {
        const btnBuzonActual = document.getElementById('btnBuzonPendientesTrafico');
        if (!btnBuzonActual) {
          return false;
        }

        // Verificar si ya tiene un listener configurado
        if (btnBuzonActual.getAttribute('data-listener-configurado') === 'true') {
          return true;
        }

        // Remover listeners anteriores solo si el botón tiene un padre
        let botonParaUsar = btnBuzonActual;
        if (btnBuzonActual.parentNode) {
          try {
            const nuevoBoton = btnBuzonActual.cloneNode(true);
            btnBuzonActual.parentNode.replaceChild(nuevoBoton, btnBuzonActual);
            botonParaUsar = nuevoBoton;
          } catch (error) {
            console.warn(
              '⚠️ Error reemplazando botón en listener universal, usando botón original:',
              error
            );
            // Continuar con el botón original
          }
        }

        botonParaUsar.addEventListener('click', async e => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔔 Click en botón del buzón de pendientes');
          console.log(
            '🔍 Verificación: typeof window.mostrarBuzonPendientesTrafico =',
            typeof window.mostrarBuzonPendientesTrafico
          );

          // Verificar si la función está disponible
          if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
            try {
              await window.mostrarBuzonPendientesTrafico();
            } catch (error) {
              console.error('❌ Error al mostrar buzón:', error);
              if (!window._inicializandoPagina) {
                alert(`Error al abrir el buzón de pendientes: ${error.message}`);
              }
            }
          } else {
            // Si no está disponible, intentar esperar un poco y reintentar
            console.warn('⚠️ mostrarBuzonPendientesTrafico no está disponible, esperando...');
            let intentosEspera = 0;
            const intervaloEspera = setInterval(async () => {
              intentosEspera++;
              if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
                clearInterval(intervaloEspera);
                try {
                  await window.mostrarBuzonPendientesTrafico();
                } catch (error) {
                  console.error('❌ Error al mostrar buzón después de esperar:', error);
                  if (!window._inicializandoPagina) {
                    alert(`Error al abrir el buzón de pendientes: ${error.message}`);
                  }
                }
              } else if (intentosEspera >= 25) {
                clearInterval(intervaloEspera);
                if (!window._inicializandoPagina) {
                  alert(
                    'La función del buzón de pendientes no está disponible. Por favor, recarga la página.'
                  );
                }
              }
            }, 200);
          }
        });
        botonParaUsar.setAttribute('data-listener-configurado', 'true');
        console.log('✅ Listener universal configurado para botón del buzón');
        return true;
      };

      // Configurar el listener universal inmediatamente
      configurarListenerUniversal();

      // También intentar configurar con la función original si está disponible
      if (configurarBuzonListener()) {
        console.log('✅ Listener configurado con función original');
      } else {
        // Si no está disponible, esperar un poco y reintentar
        console.log('⏳ Esperando a que mostrarBuzonPendientesTrafico esté disponible...');
        let intentos = 0;
        const maxIntentos = 50; // 50 intentos (10 segundos)
        const intervalo = setInterval(() => {
          intentos++;
          if (configurarBuzonListener()) {
            clearInterval(intervalo);
            console.log('✅ mostrarBuzonPendientesTrafico ahora disponible, listener configurado');
          } else if (intentos >= maxIntentos) {
            clearInterval(intervalo);
            console.warn(
              '⚠️ mostrarBuzonPendientesTrafico no está disponible después de varios intentos'
            );
            console.log(
              'ℹ️ El listener universal seguirá funcionando cuando la función esté disponible'
            );
          }
        }, 200);
      }
    } else {
      console.error('❌ No se encontró el botón btnBuzonPendientesTrafico');
    }

    // Esperar a que Firebase esté listo
    if (window.__firebaseReposReady) {
      await window.__firebaseReposReady;
    }

    // NO inicializar aquí - main.js ya lo hace
    // Solo verificar que el campo tenga un valor válido si es necesario
    setTimeout(() => {
      const numeroRegistroInput = document.getElementById('numeroRegistro');
      if (
        numeroRegistroInput &&
        numeroRegistroInput.value &&
        /^25\d{5}$/.test(numeroRegistroInput.value.trim())
      ) {
        console.log('✅ Número de registro válido en tráfico:', numeroRegistroInput.value.trim());
      } else {
        console.log(
          'ℹ️ Campo de número de registro vacío o inválido en tráfico (normal si es búsqueda)'
        );
      }
    }, 500);

    // Configurar campo de observaciones para mostrar/ocultar
    const observacionesRadios = document.querySelectorAll('input[name="observaciones"]');
    const descripcionObservaciones = document.getElementById('descripcionObservaciones');

    if (descripcionObservaciones && observacionesRadios.length > 0) {
      // Asegurar que esté oculto por defecto
      descripcionObservaciones.classList.add('descripcion-observaciones-hidden');
      descripcionObservaciones.style.display = 'none';

      // Agregar listeners a los radio buttons
      observacionesRadios.forEach(radio => {
        radio.addEventListener('change', function () {
          if (this.value === 'si') {
            // Mostrar el campo
            descripcionObservaciones.classList.remove('descripcion-observaciones-hidden');
            descripcionObservaciones.style.display = 'block';
            const textarea = descripcionObservaciones.querySelector('textarea');
            if (textarea) {
              textarea.required = true;
            }
            console.log('✅ Campo de observaciones mostrado');
          } else {
            // Ocultar el campo
            descripcionObservaciones.classList.add('descripcion-observaciones-hidden');
            descripcionObservaciones.style.display = 'none';
            const textarea = descripcionObservaciones.querySelector('textarea');
            if (textarea) {
              textarea.required = false;
            }
            console.log('✅ Campo de observaciones ocultado');
          }
        });
      });

      console.log('✅ Listeners de observaciones configurados en tráfico');
    }

    // Cargar número activo (no genera uno nuevo)
    console.log('🔄 Intentando cargar número activo de tráfico...');
    if (typeof window.cargarNumeroActivoTrafico === 'function') {
      console.log('✅ Función cargarNumeroActivoTrafico disponible, ejecutando...');
      try {
        await window.cargarNumeroActivoTrafico();
        console.log('✅ cargarNumeroActivoTrafico ejecutado');
      } catch (error) {
        console.error('❌ Error ejecutando cargarNumeroActivoTrafico:', error);
      }
    } else {
      // Función opcional - no es crítica, solo loguear en debug
      console.debug(
        'ℹ️ Función cargarNumeroActivoTrafico no está disponible aún (opcional, puede no estar cargada)'
      );
      // Reintentar después de un delay (máximo 5 intentos = 5 segundos)
      let reintentosCargarNumero = 0;
      const maxReintentosCargarNumero = 5;
      const checkCargarNumero = setInterval(async () => {
        reintentosCargarNumero++;
        if (typeof window.cargarNumeroActivoTrafico === 'function') {
          clearInterval(checkCargarNumero);
          console.log('✅ Función cargarNumeroActivoTrafico disponible (reintento), ejecutando...');
          try {
            await window.cargarNumeroActivoTrafico();
            console.log('✅ cargarNumeroActivoTrafico ejecutado');
          } catch (error) {
            console.error('❌ Error ejecutando cargarNumeroActivoTrafico (reintento):', error);
          }
        } else if (reintentosCargarNumero >= maxReintentosCargarNumero) {
          clearInterval(checkCargarNumero);
          console.debug(
            'ℹ️ cargarNumeroActivoTrafico no disponible después de 5 segundos (función opcional)'
          );
        }
      }, 1000);
    }

    // Verificar si hay un número de registro en el campo y actualizar el header
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (numeroRegistroInput && numeroRegistroInput.value && numeroRegistroInput.value.trim()) {
      const registroId = numeroRegistroInput.value.trim();
      if (typeof window.updateHeaderRegistrationNumber === 'function') {
        window.updateHeaderRegistrationNumber(registroId);
        console.log('✅ Header actualizado con número de registro existente:', registroId);
      }
    } else {
      // Si no hay registro, asegurar que el header muestre "-"
      if (typeof window.updateHeaderRegistrationNumber === 'function') {
        window.updateHeaderRegistrationNumber('-');
      }
    }

    // Agregar listeners para actualizar header cuando cambie el campo
    if (numeroRegistroInput) {
      let ultimoValor = numeroRegistroInput.value.trim() || '-';

      const actualizarHeader = function () {
        const valor = this.value.trim();
        if (valor !== ultimoValor) {
          ultimoValor = valor;
          if (typeof window.updateHeaderRegistrationNumber === 'function') {
            if (valor) {
              window.updateHeaderRegistrationNumber(valor);
              console.log('✅ Header actualizado desde listener con:', valor);
            } else {
              window.updateHeaderRegistrationNumber('-');
            }
          }
        }
      };

      // Listener para cuando el usuario escribe
      numeroRegistroInput.addEventListener('input', actualizarHeader);

      // Listener para cuando el campo cambia (incluye cambios programáticos)
      numeroRegistroInput.addEventListener('change', actualizarHeader);

      // También usar MutationObserver para detectar cambios programáticos
      const observer = new MutationObserver(() => {
        const valor = numeroRegistroInput.value.trim();
        if (valor && valor !== ultimoValor) {
          ultimoValor = valor;
          if (typeof window.updateHeaderRegistrationNumber === 'function') {
            window.updateHeaderRegistrationNumber(valor);
            console.log('✅ Header actualizado desde MutationObserver con:', valor);
          }
        }
      });

      observer.observe(numeroRegistroInput, {
        attributes: true,
        attributeFilter: ['value'],
        childList: false,
        subtree: false
      });

      // Verificar periódicamente el valor del campo (cada 500ms durante los primeros 5 segundos)
      let verificaciones = 0;
      const maxVerificaciones = 10;
      const intervaloVerificacion = setInterval(() => {
        verificaciones++;
        const valorActual = numeroRegistroInput.value.trim();
        if (valorActual && valorActual !== ultimoValor) {
          ultimoValor = valorActual;
          if (typeof window.updateHeaderRegistrationNumber === 'function') {
            window.updateHeaderRegistrationNumber(valorActual);
            console.log('✅ Header actualizado desde verificación periódica con:', valorActual);
          }
        }
        if (verificaciones >= maxVerificaciones) {
          clearInterval(intervaloVerificacion);
        }
      }, 500);
    }

    // Inicializar campo fechaCreacion con fecha de hoy en formato YYYY-MM-DD
    const fechaCreacionInput = document.getElementById('fechaCreacion');
    if (fechaCreacionInput && !fechaCreacionInput.value) {
      const hoy = new Date();
      const año = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      fechaCreacionInput.value = `${año}-${mes}-${dia}`;
      console.log(
        '✅ Campo fechaCreacion inicializado con fecha de hoy:',
        fechaCreacionInput.value
      );
    }

    // Configurar interceptores de alertas y notificaciones durante inicialización
    setupAlertInterceptors();

    // Marcar fin de inicialización después de 5 segundos
    setTimeout(() => {
      window._inicializandoPagina = false;
      console.log('✅ Inicialización completada, alertas y notificaciones ahora activas');

      // Reintentar configurar el listener del buzón si aún no está configurado
      const btnBuzonReintento = document.getElementById('btnBuzonPendientesTrafico');
      if (btnBuzonReintento && typeof window.mostrarBuzonPendientesTrafico === 'function') {
        // Verificar si ya tiene un listener configurado
        const tieneListener =
          btnBuzonReintento.getAttribute('data-listener-configurado') === 'true';
        if (!tieneListener) {
          console.log('🔄 Reintentando configurar listener del buzón después de inicialización...');
          // Remover listeners anteriores
          const nuevoBoton = btnBuzonReintento.cloneNode(true);
          btnBuzonReintento.parentNode.replaceChild(nuevoBoton, btnBuzonReintento);
          nuevoBoton.addEventListener('click', async e => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔔 Click en botón del buzón de pendientes');

            if (typeof window.mostrarBuzonPendientesTrafico === 'function') {
              try {
                await window.mostrarBuzonPendientesTrafico();
              } catch (error) {
                console.error('❌ Error al mostrar buzón:', error);
                alert(`Error al abrir el buzón de pendientes: ${error.message}`);
              }
            } else {
              alert(
                'La función del buzón de pendientes no está disponible. Por favor, recarga la página.'
              );
            }
          });
          nuevoBoton.setAttribute('data-listener-configurado', 'true');
          console.log('✅ Listener del buzón configurado después de inicialización');
        }
      }
    }, 5000);

    // Actualizar contador con nueva lógica Firebase
    setTimeout(async () => {
      if (typeof window.actualizarContadorPendientes === 'function') {
        await window.actualizarContadorPendientes();
        console.log('✅ Contador de pendientes actualizado desde Firebase');
      }
    }, 1000);

    // Actualizar contador cada 5 segundos desde Firebase (solo si el usuario está autenticado)
    let _contadorIntervalId = null;
    const contadorInterval = setInterval(async () => {
      // Verificar autenticación antes de actualizar
      if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        if (typeof window.actualizarContadorPendientes === 'function') {
          await window.actualizarContadorPendientes();
        }
      } else {
        // Si el usuario no está autenticado después de varios intentos, detener el intervalo
        // (el contador se actualizará cuando el usuario se autentique)
      }
    }, 5000);

    // Guardar el ID del intervalo para poder limpiarlo si es necesario
    _contadorIntervalId = contadorInterval;

    // También actualizar cuando cambie el foco de la ventana
    window.addEventListener('focus', async () => {
      console.log('👁️ Ventana enfocada, actualizando contador...');
      if (typeof window.actualizarContadorPendientes === 'function') {
        await window.actualizarContadorPendientes();
      }
    });

    // Cargar lista de registros de Tráfico con filtros
    setTimeout(async () => {
      console.log('🔄 Intentando cargar registros de Tráfico...');
      if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
        console.log('📊 Usando cargarRegistrosTraficoConFiltro');
        await window.cargarRegistrosTraficoConFiltro();
      } else if (typeof window.cargarRegistrosTrafico === 'function') {
        console.log('📊 Usando cargarRegistrosTrafico');
        await window.cargarRegistrosTrafico();
      } else {
        console.error('❌ cargarRegistrosTrafico no está disponible');
      }
    }, 1000);

    // Suscribirse a económicos de Firestore para mantener listas actualizadas
    setTimeout(() => {
      // Verificar que el usuario esté autenticado antes de crear suscripciones
      if (window.firebaseAuth && window.firebaseAuth.currentUser && window.economicosRepo) {
        try {
          if (window.__economicosUnsub) {
            window.__economicosUnsub();
          }
          window.__economicosUnsub = window.economicosRepo.subscribe(list => {
            window.__economicosCache = list;
            console.log(
              '📦 Cache de económicos actualizado desde Firestore (tráfico):',
              list.length
            );
            // Actualizar listas si existe el gestor
            if (window.traficoListasManager && window.traficoListasManager.loadEconomicosList) {
              window.traficoListasManager.loadEconomicosList();
            }
          });
        } catch (e) {
          console.warn('⚠️ No se pudo suscribir a economicosRepo en tráfico:', e);
        }
      }
    }, 1000);

    // Suscribirse a cambios en tiempo real de Logística y Tráfico para actualizar el contador
    setTimeout(async () => {
      try {
        await setupRealtimeListeners();
      } catch (error) {
        console.error('❌ Error configurando listeners en tiempo real:', error);
      }
    }, 2000);

    // Cargar módulo de gastos para que los motivos de pago se carguen
    setTimeout(async () => {
      // Cargar el módulo de gastos si no está cargado
      if (window.MODULES_CONFIG && !window.MODULES_CONFIG.gastos.loaded) {
        console.log('📦 Cargando módulo de gastos para inicializar motivos de pago...');
        try {
          await window.loadModule('gastos');
          console.log('✅ Módulo de gastos cargado');
        } catch (error) {
          console.warn('⚠️ Error cargando módulo de gastos:', error);
        }
      }

      // Asegurar que los motivos de pago se carguen
      if (typeof window.asegurarMotivosPagoCargados === 'function') {
        window.asegurarMotivosPagoCargados();
      } else if (typeof window.cargarMotivosPagoEnSelect === 'function') {
        window.cargarMotivosPagoEnSelect(1);
        console.log('✅ Motivos de pago cargados desde page-init');
      } else {
        console.debug('ℹ️ Funciones de motivos de pago no disponibles aún, reintentando...');
        // Reintentar después de un delay
        setTimeout(() => {
          if (typeof window.cargarMotivosPagoEnSelect === 'function') {
            window.cargarMotivosPagoEnSelect(1);
            console.log('✅ Motivos de pago cargados en reintento');
          }
        }, 1000);
      }
    }, 500);

    // Asegurar que el listener del formulario esté configurado
    const form = document.querySelector('form.needs-validation');
    const btnRegistrar = document.getElementById('btnRegistrarEnvio');

    if (form && btnRegistrar) {
      console.log('🔧 Configurando listener de respaldo para el botón de registro...');

      // Listener directo en el botón como respaldo
      btnRegistrar.addEventListener('click', async e => {
        console.log('🚨🚨🚨 CLICK EN BOTÓN REGISTRAR ENVÍO DETECTADO 🚨🚨🚨');

        // Prevenir el comportamiento por defecto
        e.preventDefault();
        e.stopPropagation();

        // Si el formulario tiene un listener de submit, dispararlo manualmente
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(submitEvent);

        // También llamar directamente a manejarEnvioFormulario si está disponible
        // Esperar un momento para que el script se cargue si aún no está disponible
        if (typeof window.manejarEnvioFormulario === 'function') {
          console.log('✅ Llamando directamente a manejarEnvioFormulario...');
          await window.manejarEnvioFormulario(submitEvent);
        } else {
          console.warn('⚠️ manejarEnvioFormulario no está disponible, esperando...');
          // Esperar hasta 5 segundos a que la función esté disponible
          let intentos = 0;
          const maxIntentos = 50;
          const checkInterval = setInterval(async () => {
            intentos++;
            if (typeof window.manejarEnvioFormulario === 'function') {
              clearInterval(checkInterval);
              console.log('✅ manejarEnvioFormulario ahora disponible, ejecutando...');
              try {
                await window.manejarEnvioFormulario(submitEvent);
              } catch (error) {
                console.error('❌ Error ejecutando manejarEnvioFormulario:', error);
                if (typeof window.showNotification === 'function') {
                  window.showNotification(
                    `Error al procesar el formulario: ${error.message}`,
                    'error'
                  );
                }
              }
            } else if (intentos >= maxIntentos) {
              clearInterval(checkInterval);
              console.error('❌ manejarEnvioFormulario no está disponible después de esperar');
              if (typeof window.showNotification === 'function') {
                window.showNotification(
                  'Error: No se pudo procesar el formulario. Por favor, recarga la página.',
                  'error'
                );
              } else {
                alert('Error: No se pudo procesar el formulario. Por favor, recarga la página.');
              }
            }
          }, 100);
        }
      });

      console.log('✅ Listener de respaldo configurado en el botón');
    }

    console.log('✅ Página de tráfico inicializada');
  }

  /**
   * Configura interceptores para suprimir alertas y notificaciones durante la inicialización
   */
  function setupAlertInterceptors() {
    // Guardar funciones originales para restaurar después
    window._originalAlert = window.alert;
    window._originalShowNotification = window.showNotification;

    // Interceptar todas las llamadas a alert() para controlarlas
    const originalAlert = window.alert;
    window.alert = function (message) {
      // Si estamos inicializando, suprimir alertas
      if (window._inicializandoPagina) {
        console.log(`🔇 Alert suprimido durante inicialización: ${message}`);
        return;
      }

      // Si el mensaje es muy común durante inicialización, suprimir
      const mensajesComunes = [
        'Prueba de integración exitosa',
        'Error: No se pudieron llenar los campos',
        'No se encontraron datos de logística',
        'Error al guardar datos de logística',
        'Datos de tráfico guardados correctamente',
        'Botón restaurado, puedes intentar de nuevo',
        'Envío registrado correctamente',
        'Error: No se encontró número de registro',
        'Error al guardar datos de tráfico',
        'Datos de logística guardados correctamente',
        'Formulario enviado correctamente',
        'Registro cargado automáticamente'
      ];

      const esMensajeComun = mensajesComunes.some(comun => message.includes(comun));
      if (esMensajeComun && Date.now() - (window._inicioInicializacion || 0) < 15000) {
        console.log(`🔇 Alert suprimido (mensaje común): ${message}`);
        return;
      }

      // Para otros casos, usar la función original
      originalAlert.call(window, message);
    };

    // Interceptar también las notificaciones del sistema
    const originalShowNotification = window.showNotification;
    window.showNotification = function (message, type = 'info') {
      // Si estamos inicializando, suprimir notificaciones
      if (window._inicializandoPagina) {
        console.log(`🔇 Notificación suprimida durante inicialización: ${message}`);
        return;
      }

      // Si el mensaje es muy común durante inicialización, suprimir
      const mensajesComunesNotificaciones = [
        'Datos de logística guardados correctamente',
        'Datos de tráfico guardados correctamente',
        'Formulario enviado correctamente',
        'Registro cargado automáticamente',
        'Lista de económicos actualizada',
        'Lista de operadores actualizada',
        'Datos del económico',
        'Datos del operador',
        'Campos del operador secundario limpiados'
      ];

      const esMensajeComunNotificacion = mensajesComunesNotificaciones.some(comun =>
        message.includes(comun)
      );
      if (esMensajeComunNotificacion && Date.now() - (window._inicioInicializacion || 0) < 15000) {
        console.log(`🔇 Notificación suprimida (mensaje común): ${message}`);
        return;
      }

      // Para otros casos, usar la función original
      if (originalShowNotification) {
        originalShowNotification.call(window, message, type);
      } else {
        // Fallback si no existe la función original
        console.log(`📢 Notificación: ${message}`);
      }
    };
  }

  /**
   * Configura listeners en tiempo real para actualizar el contador automáticamente
   */
  async function setupRealtimeListeners() {
    // Asegurar que los repositorios estén inicializados
    if (!window.firebaseRepos?.logistica || !window.firebaseRepos?.trafico) {
      console.debug(
        'ℹ️ Repositorios de Firebase no están disponibles aún (normal durante carga inicial)'
      );
      return;
    }

    console.log(
      '📡 Configurando listeners en tiempo real para actualizar contador de pendientes...'
    );

    // Inicializar repositorios si es necesario
    let attempts = 0;
    while (
      attempts < 10 &&
      (!window.firebaseRepos.logistica.db || !window.firebaseRepos.logistica.tenantId)
    ) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 200));
      await window.firebaseRepos.logistica.init();
    }

    attempts = 0;
    while (
      attempts < 10 &&
      (!window.firebaseRepos.trafico.db || !window.firebaseRepos.trafico.tenantId)
    ) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 200));
      await window.firebaseRepos.trafico.init();
    }

    // Función para actualizar el contador
    const actualizarContadorPendientes = async () => {
      try {
        if (typeof window.actualizarContadorPendientes === 'function') {
          await window.actualizarContadorPendientes();
          console.log('✅ Contador de pendientes actualizado automáticamente desde listener');
        }
      } catch (error) {
        console.error('❌ Error actualizando contador desde listener:', error);
      }
    };

    // Función para configurar suscripciones (solo si el usuario está autenticado)
    let suscripcionesIntentos = 0;
    const MAX_SUSCRIPCIONES_INTENTOS = 15; // 30 segundos máximo (15 * 2s)

    const configurarSuscripciones = async () => {
      // Verificar que el usuario esté autenticado
      if (!window.firebaseAuth || !window.firebaseAuth.currentUser) {
        suscripcionesIntentos++;

        // Solo mostrar warning cada 5 intentos para reducir ruido
        if (suscripcionesIntentos === 1 || suscripcionesIntentos % 5 === 0) {
          console.warn(
            `⚠️ Usuario no autenticado, esperando autenticación... (intento ${suscripcionesIntentos}/${MAX_SUSCRIPCIONES_INTENTOS})`
          );
        }

        // Si excedemos el límite, usar onAuthStateChanged como fallback
        if (suscripcionesIntentos >= MAX_SUSCRIPCIONES_INTENTOS) {
          console.warn('⚠️ Límite de intentos alcanzado, usando listener de autenticación...');
          if (window.firebaseAuth && window.firebaseAuth.onAuthStateChanged) {
            // Usar el listener global si está disponible
            const unsubscribe = window.firebaseAuth.onAuthStateChanged(user => {
              if (user) {
                console.log('✅ Usuario autenticado detectado, configurando suscripciones...');
                suscripcionesIntentos = 0; // Resetear contador
                configurarSuscripciones();
                unsubscribe(); // Dejar de escuchar después del primer éxito
              }
            });
          }
          return;
        }

        // Reintentar después de un delay
        setTimeout(() => configurarSuscripciones(), 2000);
        return;
      }

      // Resetear contador si el usuario está autenticado
      suscripcionesIntentos = 0;

      // Listener para Logística
      if (window.firebaseRepos.logistica.db && window.firebaseRepos.logistica.tenantId) {
        if (window.__logisticaUnsub) {
          window.__logisticaUnsub();
        }
        window.__logisticaUnsub = await window.firebaseRepos.logistica.subscribe(async items => {
          console.log('📡 Cambio detectado en Logística:', items.length, 'registros');

          // Sincronizar erp_shared_data cuando Firebase está vacío
          if (items.length === 0) {
            try {
              const repoLogistica = window.firebaseRepos.logistica;
              if (repoLogistica && repoLogistica.db && repoLogistica.tenantId) {
                const firebaseData = await repoLogistica.getAll();
                if (firebaseData && firebaseData.length === 0) {
                  console.log(
                    '✅ Firebase confirmado vacío para logística. Sincronizando erp_shared_data.'
                  );
                  const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
                  sharedData.registros = {};
                  localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
                  console.log('🗑️ erp_shared_data.registros limpiado (Firebase vacío).');
                }
              }
            } catch (error) {
              console.warn('⚠️ Error verificando Firebase para logística:', error);
            }
          } else {
            // Sincronizar erp_shared_data con los datos de Firebase
            const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
            sharedData.registros = {};
            items.forEach(item => {
              const registroId = item.numeroRegistro || item.registroId || item.id;
              if (registroId) {
                sharedData.registros[registroId] = item;
              }
            });
            localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
          }

          await actualizarContadorPendientes();
        });
        console.log('✅ Listener de Logística configurado');
      }

      // Listener para Tráfico
      if (window.firebaseRepos.trafico.db && window.firebaseRepos.trafico.tenantId) {
        if (window.__traficoUnsub) {
          window.__traficoUnsub();
        }
        window.__traficoUnsub = await window.firebaseRepos.trafico.subscribe(async items => {
          console.log('📡 Cambio detectado en Tráfico:', items.length, 'registros');
          await actualizarContadorPendientes();
        });
        console.log('✅ Listener de Tráfico configurado');
      }
    };

    // Intentar configurar suscripciones
    await configurarSuscripciones();
  }

  // Ejecutar inicialización cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTraficoPage);
  } else {
    initializeTraficoPage();
  }
})();
