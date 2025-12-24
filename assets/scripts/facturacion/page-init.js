/**
 * Inicialización de la Página - facturacion.html
 * Maneja la inicialización completa cuando el DOM está listo
 */

(function () {
  'use strict';

  // Función para inicializar campo fechaCreacion
  function inicializarFechaCreacion() {
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
  }

  // Función para inicializar validación de números de registro
  function _inicializarValidacionRegistro() {
    if (typeof window.validateRegistrationNumber === 'function') {
      window.validateRegistrationNumber();
    }
  }

  // Función para configurar botón del buzón de pendientes
  function configurarBuzonPendientes() {
    const btnBuzonPendientes = document.getElementById('btnBuzonPendientesFacturacion');
    if (btnBuzonPendientes) {
      btnBuzonPendientes.addEventListener('click', async () => {
        // Esperar a que la función esté disponible con reintentos
        let intentos = 0;
        const maxIntentos = 10;

        while (
          intentos < maxIntentos &&
          typeof window.mostrarBuzonPendientesFacturacion !== 'function'
        ) {
          await new Promise(resolve => setTimeout(resolve, 100));
          intentos++;
        }

        if (typeof window.mostrarBuzonPendientesFacturacion === 'function') {
          try {
            window.mostrarBuzonPendientesFacturacion();
          } catch (error) {
            console.error('❌ Error al mostrar buzón de pendientes:', error);
            alert('Error al abrir el buzón de pendientes. Por favor, intenta nuevamente.');
          }
        } else {
          // Si la función no existe después de esperar, intentar usar función genérica
          console.debug(
            'ℹ️ mostrarBuzonPendientesFacturacion no está disponible, intentando función genérica...'
          );

          // Intentar usar función genérica si existe
          if (typeof window.mostrarBuzonPendientes === 'function') {
            window.mostrarBuzonPendientes('facturacion');
          } else {
            // Solo mostrar alert si realmente no hay alternativa
            console.warn('⚠️ Ninguna función de buzón de pendientes disponible');
            alert(
              'La función del buzón de pendientes no está disponible. Por favor, recarga la página.'
            );
          }
        }
      });
      console.log('✅ Event listener configurado para botón del buzón de pendientes');
    } else {
      console.debug(
        'ℹ️ Botón btnBuzonPendientesFacturacion no encontrado (puede no estar en esta página)'
      );
    }
  }

  // Función para actualizar contador de pendientes
  async function actualizarContadorPendientes() {
    const esperarYActualizar = async () => {
      let intentos = 0;
      const maxIntentos = 30; // Aumentar intentos para dar más tiempo

      const intervalo = setInterval(async () => {
        intentos++;

        // Verificar que la función esté disponible y que Firebase esté listo
        // Usar la nueva API modular (window.fs) en lugar de firebase.firestore
        const firebaseReady =
          (window.fs && window.firebaseDb) ||
          (window.firebaseRepos?.trafico?.db && window.firebaseRepos?.facturacion?.db);

        if (typeof window.actualizarContadorPendientesFacturacion === 'function' && firebaseReady) {
          clearInterval(intervalo);
          try {
            await window.actualizarContadorPendientesFacturacion();
            console.log('✅ Contador de pendientes Facturación actualizado desde Firebase');
          } catch (error) {
            console.warn('⚠️ Error actualizando contador:', error);
          }
        } else if (intentos >= maxIntentos) {
          clearInterval(intervalo);
          // Solo mostrar warning si realmente no se pudo cargar después de todos los intentos
          if (typeof window.actualizarContadorPendientesFacturacion !== 'function') {
            console.warn('⚠️ Timeout esperando función actualizarContadorPendientesFacturacion');
          } else if (!firebaseReady) {
            console.debug(
              'ℹ️ Firebase aún no está listo, pero la función está disponible. Se actualizará cuando Firebase esté listo.'
            );
          }
        }
      }, 200);
    };

    esperarYActualizar();

    // Actualizar contador cada 10 segundos (fallback)
    setInterval(async () => {
      if (typeof window.actualizarContadorPendientesFacturacion === 'function') {
        try {
          await window.actualizarContadorPendientesFacturacion();
        } catch (error) {
          console.debug('ℹ️ Error en actualización periódica del contador:', error);
        }
      }
    }, 10000);
  }

  // Función para configurar listeners en tiempo real
  async function _configurarListenersTiempoReal() {
    setTimeout(async () => {
      try {
        if (window.firebaseRepos?.trafico && window.firebaseRepos?.facturacion) {
          console.log(
            '📡 Configurando listeners en tiempo real para actualizar contador de pendientes en Facturación...'
          );

          // Inicializar repositorios si es necesario
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.trafico.db || !window.firebaseRepos.trafico.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            if (typeof window.firebaseRepos.trafico.init === 'function') {
              await window.firebaseRepos.trafico.init();
            }
          }

          attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.facturacion.db || !window.firebaseRepos.facturacion.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            if (typeof window.firebaseRepos.facturacion.init === 'function') {
              await window.firebaseRepos.facturacion.init();
            }
          }

          const actualizarContadorPendientes = async () => {
            try {
              if (typeof window.actualizarContadorPendientesFacturacion === 'function') {
                await window.actualizarContadorPendientesFacturacion();
              }
            } catch (error) {
              console.error('❌ Error actualizando contador desde listener:', error);
            }
          };

          // Listener para Tráfico
          if (window.firebaseRepos.trafico.db && window.firebaseRepos.trafico.tenantId) {
            if (window.__traficoUnsubFacturacion) {
              window.__traficoUnsubFacturacion();
            }
            window.__traficoUnsubFacturacion = await window.firebaseRepos.trafico.subscribe(
              async items => {
                console.log(
                  '📡 Cambio detectado en Tráfico (desde Facturación):',
                  items.length,
                  'registros'
                );
                await actualizarContadorPendientes();
              }
            );
            console.log('✅ Listener de Tráfico configurado en Facturación');
          }

          // Listener para Facturación
          if (window.firebaseRepos.facturacion.db && window.firebaseRepos.facturacion.tenantId) {
            if (window.__facturacionUnsub) {
              window.__facturacionUnsub();
            }
            window.__facturacionUnsub = await window.firebaseRepos.facturacion.subscribe(
              async items => {
                console.log('📡 Cambio detectado en Facturación:', items.length, 'registros');
                await actualizarContadorPendientes();
              }
            );
            console.log('✅ Listener de Facturación configurado');
          }

          console.log('✅ Listeners en tiempo real configurados correctamente en Facturación');
        } else {
          console.warn('⚠️ Repositorios de Firebase no disponibles para listeners en Facturación');
        }
      } catch (error) {
        console.error('❌ Error configurando listeners en tiempo real en Facturación:', error);
      }
    }, 2000);
  }

  // Función para corregir facturas existentes
  function corregirFacturasExistentes() {
    setTimeout(() => {
      if (typeof window.corregirFacturasExistentes === 'function') {
        const facturasCorregidas = window.corregirFacturasExistentes();
        if (facturasCorregidas > 0) {
          console.log(`🔧 ${facturasCorregidas} facturas corregidas automáticamente`);
        }
      }
    }, 500);
  }

  // Función para cargar registros al iniciar
  async function cargarRegistrosInicial() {
    setTimeout(async () => {
      console.log('🔄 Intentando cargar registros de facturación...');
      if (typeof window.cargarRegistrosFacturacionConFiltro === 'function') {
        console.log('✅ Usando cargarRegistrosFacturacionConFiltro');
        await window.cargarRegistrosFacturacionConFiltro();
      } else if (typeof window.cargarRegistrosFacturacion === 'function') {
        console.log('✅ Usando cargarRegistrosFacturacion');
        await window.cargarRegistrosFacturacion();
      } else {
        console.warn('⚠️ Ninguna función de carga disponible aún');
      }
    }, 1000);
  }

  // Función para validar y corregir formato de número de registro
  function validarYCorregirNumeroRegistro() {
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (!numeroRegistroInput) {
      return;
    }

    const valorActual = numeroRegistroInput.value?.trim() || '';

    // Detectar formato antiguo (2025-09-0002, 2025-XX-XXXX, etc.)
    const formatoAntiguo = /^2025-\d{2}-\d{4}$/;

    if (valorActual && formatoAntiguo.test(valorActual)) {
      console.warn('⚠️ Formato antiguo detectado en numeroRegistro:', valorActual);
      console.log('🔄 Limpiando campo para generar número correcto...');

      // Limpiar el campo para que se genere el número correcto
      numeroRegistroInput.value = '';

      // NO volver a inicializar - solo limpiar el campo
      // El sistema ya se inicializa desde main.js
      console.log(
        '✅ Campo limpiado (formato antiguo), el sistema de numeración ya está inicializado'
      );
    } else if (valorActual && !/^25\d{5}$/.test(valorActual)) {
      // Si tiene un valor pero no es el formato correcto (25XXXXX), limpiarlo
      console.warn('⚠️ Formato incorrecto detectado en numeroRegistro:', valorActual);
      console.log('🔄 Limpiando campo para generar número correcto...');
      numeroRegistroInput.value = '';

      // NO volver a inicializar - solo limpiar el campo
      console.log(
        '✅ Campo limpiado (formato incorrecto), el sistema de numeración ya está inicializado'
      );
    }
  }

  // Función para configurar el submit del formulario
  function configurarSubmitFormulario() {
    const formulario = document.getElementById('facturacionForm');
    if (!formulario) {
      console.warn('⚠️ Formulario facturacionForm no encontrado');
      return;
    }

    formulario.addEventListener('submit', async e => {
      e.preventDefault();
      e.stopPropagation();

      console.log('📝 Enviando formulario de facturación...');

      // Validar formulario
      if (!formulario.checkValidity()) {
        formulario.classList.add('was-validated');
        console.warn('⚠️ Formulario no válido');
        return;
      }

      // Validar tipo de cambio si es USD
      if (typeof window.validarTipoCambio === 'function' && !window.validarTipoCambio()) {
        console.error('❌ Validación de tipo de cambio falló');
        return;
      }

      // Deshabilitar botón de submit para evitar doble envío
      const submitButton = formulario.querySelector('button[type="submit"]');
      const originalText = submitButton?.innerHTML;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
      }

      try {
        // Llamar a la función de guardado
        if (typeof window.saveFacturacionData === 'function') {
          const resultado = await window.saveFacturacionData();

          if (resultado) {
            console.log('✅ Factura guardada exitosamente');

            // Mostrar notificación de éxito
            if (typeof window.showNotification === 'function') {
              window.showNotification('✅ Factura registrada exitosamente', 'success');
            } else {
              alert('✅ Factura registrada exitosamente');
            }

            // Recargar la página completamente después de guardar
            setTimeout(() => {
              location.reload();
            }, 1000);
          } else {
            console.error('❌ Error al guardar factura');
            if (typeof window.showNotification === 'function') {
              window.showNotification(
                '❌ Error al guardar la factura. Por favor, intenta nuevamente.',
                'error'
              );
            } else {
              alert('❌ Error al guardar la factura. Por favor, intenta nuevamente.');
            }
          }
        } else {
          console.error('❌ saveFacturacionData no está disponible');
          alert('❌ Error: Función de guardado no disponible. Por favor, recarga la página.');
        }
      } catch (error) {
        console.error('❌ Error al procesar formulario:', error);
        if (typeof window.showNotification === 'function') {
          window.showNotification(`❌ Error al guardar: ${error.message}`, 'error');
        } else {
          alert(`❌ Error al guardar: ${error.message}`);
        }
      } finally {
        // Rehabilitar botón de submit
        if (submitButton) {
          submitButton.disabled = false;
          if (originalText) {
            submitButton.innerHTML = originalText;
          }
        }
      }
    });

    console.log('✅ Handler de submit del formulario configurado');
  }

  // Función para verificar y asegurar autenticación en Firebase
  async function verificarYAutenticarFirebase() {
    // Verificar si el usuario está autenticado en Firebase Auth
    if (window.firebaseAuth && !window.firebaseAuth.currentUser) {
      console.log('🔐 Usuario no autenticado en Firebase, intentando autenticar...');

      // Verificar si hay sesión local
      const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
      const session = JSON.parse(localStorage.getItem('erpSession') || 'null');

      // Si hay sesión local pero no en Firebase, intentar autenticar
      if (currentUser && session) {
        try {
          // Intentar autenticar con las credenciales de la sesión local
          if (typeof window.firebaseSignIn === 'function' && currentUser.email) {
            // Intentar autenticar con las credenciales de la sesión local
            await window.firebaseSignIn(
              currentUser.email,
              'demo123',
              currentUser.tenantId || window.DEMO_CONFIG?.tenantId || 'demo_tenant'
            );
            console.log('✅ Usuario autenticado en Firebase después de verificación');
          }
        } catch (authError) {
          console.debug(
            'ℹ️ No se pudo autenticar automáticamente (continuando con localStorage):',
            authError.message
          );
        }
      }
    } else if (window.firebaseAuth && window.firebaseAuth.currentUser) {
      console.log('✅ Usuario ya autenticado en Firebase:', window.firebaseAuth.currentUser.email);
    }
  }

  // Inicialización cuando el DOM está listo
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM cargado, inicializando facturación...');

    // Verificar y autenticar en Firebase PRIMERO
    await verificarYAutenticarFirebase();

    // Configurar submit del formulario PRIMERO
    configurarSubmitFormulario();

    // Validar y corregir formato de número de registro PRIMERO
    validarYCorregirNumeroRegistro();

    // Inicializar validación de números de registro
    if (typeof window.validateRegistrationNumber === 'function') {
      window.validateRegistrationNumber();
    }

    // Inicializar campo fechaCreacion
    inicializarFechaCreacion();

    // Configurar botón del buzón de pendientes
    configurarBuzonPendientes();

    // Actualizar contador de pendientes
    actualizarContadorPendientes();

    // Configurar listeners en tiempo real (con sincronización de erp_shared_data)
    setTimeout(async () => {
      try {
        if (window.firebaseRepos?.trafico && window.firebaseRepos?.facturacion) {
          console.log(
            '📡 Configurando listeners en tiempo real para actualizar contador de pendientes en Facturación...'
          );

          // Inicializar repositorios si es necesario
          let attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.trafico.db || !window.firebaseRepos.trafico.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            if (typeof window.firebaseRepos.trafico.init === 'function') {
              await window.firebaseRepos.trafico.init();
            }
          }

          attempts = 0;
          while (
            attempts < 10 &&
            (!window.firebaseRepos.facturacion.db || !window.firebaseRepos.facturacion.tenantId)
          ) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 200));
            if (typeof window.firebaseRepos.facturacion.init === 'function') {
              await window.firebaseRepos.facturacion.init();
            }
          }

          // Función para actualizar el contador
          const actualizarContadorPendientes = async () => {
            try {
              if (typeof window.actualizarContadorPendientesFacturacion === 'function') {
                await window.actualizarContadorPendientesFacturacion();
                console.log(
                  '✅ Contador de pendientes Facturación actualizado automáticamente desde listener'
                );
              }
            } catch (error) {
              console.error('❌ Error actualizando contador desde listener:', error);
            }
          };

          // Listener para Tráfico
          if (window.firebaseRepos.trafico.db && window.firebaseRepos.trafico.tenantId) {
            if (window.__traficoUnsubFacturacion) {
              window.__traficoUnsubFacturacion();
            }
            window.__traficoUnsubFacturacion = await window.firebaseRepos.trafico.subscribe(
              async items => {
                console.log(
                  '📡 Cambio detectado en Tráfico (desde Facturación):',
                  items.length,
                  'registros'
                );
                await actualizarContadorPendientes();
              }
            );
            console.log('✅ Listener de Tráfico configurado en Facturación');
          }

          // Listener para Facturación (con sincronización de erp_shared_data)
          if (window.firebaseRepos.facturacion.db && window.firebaseRepos.facturacion.tenantId) {
            if (window.__facturacionUnsub) {
              window.__facturacionUnsub();
            }
            window.__facturacionUnsub = await window.firebaseRepos.facturacion.subscribe(
              async items => {
                console.log('📡 Cambio detectado en Facturación:', items.length, 'registros');

                // Sincronizar erp_shared_data cuando Firebase está vacío
                if (items.length === 0) {
                  try {
                    const repoFacturacion = window.firebaseRepos.facturacion;
                    if (repoFacturacion && repoFacturacion.db && repoFacturacion.tenantId) {
                      // Usar consulta optimizada
                      const firebaseData = await repoFacturacion.getAll({
                        limit: 100,
                        useCache: true
                      });
                      if (firebaseData && firebaseData.length === 0) {
                        console.log(
                          '✅ Firebase confirmado vacío para facturación. Sincronizando erp_shared_data.'
                        );
                        const sharedData = JSON.parse(
                          localStorage.getItem('erp_shared_data') || '{}'
                        );
                        sharedData.facturas = {};
                        sharedData.facturacion = {};
                        localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
                        console.log(
                          '🗑️ erp_shared_data.facturas/facturacion limpiado (Firebase vacío).'
                        );
                      }
                    }
                  } catch (error) {
                    console.warn('⚠️ Error verificando Firebase para facturación:', error);
                  }
                } else {
                  // Sincronizar erp_shared_data con los datos de Firebase
                  const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
                  sharedData.facturas = {};
                  sharedData.facturacion = {};
                  items.forEach(item => {
                    const facturaId =
                      item.numeroFactura || item.facturaId || item.id || item.numeroRegistro;
                    if (facturaId) {
                      sharedData.facturas[facturaId] = item;
                      sharedData.facturacion[facturaId] = item;
                    }
                  });
                  localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
                }

                await actualizarContadorPendientes();
              }
            );
            console.log('✅ Listener de Facturación configurado');
          }

          console.log('✅ Listeners en tiempo real configurados correctamente en Facturación');
        } else {
          console.warn('⚠️ Repositorios de Firebase no disponibles para listeners en Facturación');
        }
      } catch (error) {
        console.error('❌ Error configurando listeners en tiempo real en Facturación:', error);
      }
    }, 2000);

    // Corregir facturas existentes
    corregirFacturasExistentes();

    // Cargar registros
    cargarRegistrosInicial();

    // NO inicializar aquí - main.js ya lo hace
    // Solo verificar que el campo tenga un valor válido si es necesario
    setTimeout(() => {
      const numeroRegistroInput = document.getElementById('numeroRegistro');
      if (
        numeroRegistroInput &&
        numeroRegistroInput.value &&
        /^25\d{5}$/.test(numeroRegistroInput.value.trim())
      ) {
        console.log(
          '✅ Número de registro válido en facturación:',
          numeroRegistroInput.value.trim()
        );
      } else {
        console.log(
          'ℹ️ Campo de número de registro vacío o inválido en facturación (normal si es búsqueda)'
        );
      }
    }, 500);
  });

  console.log('✅ Módulo page-init.js cargado');
})();
