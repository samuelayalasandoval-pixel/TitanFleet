/**
 * Event Handlers Específicos para Tesorería
 * Maneja todos los eventos de la página tesoreria.html
 */

(function () {
  'use strict';

  // Verificar que estamos en la página de tesorería
  const isTesoreriaPage = window.location.pathname.includes('tesoreria.html');
  if (!isTesoreriaPage) {
    return; // No ejecutar si no estamos en tesorería
  }

  /**
   * Mapa de acciones específicas de tesorería
   */
  const tesoreriaActions = {
    // Estado de cuenta
    cargarEstadoCuenta: async function (event) {
      console.log('🖱️ Botón cargarEstadoCuenta clickeado');
      if (event) {
        event.preventDefault();
      }

      // Esperar a que la función esté disponible
      let attempts = 0;
      const maxAttempts = 30;
      while (attempts < maxAttempts && typeof window.cargarEstadoCuenta !== 'function') {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (typeof window.cargarEstadoCuenta === 'function') {
        try {
          console.log('✅ Ejecutando cargarEstadoCuenta...');
          await window.cargarEstadoCuenta();
        } catch (error) {
          console.error('❌ Error ejecutando cargarEstadoCuenta:', error);
          if (typeof window.showNotification === 'function') {
            window.showNotification(
              `Error al cargar el estado de cuenta: ${error.message || 'Error desconocido'}`,
              'error'
            );
          } else {
            alert(`Error al cargar el estado de cuenta: ${error.message || 'Error desconocido'}`);
          }
        }
      } else {
        console.error('❌ cargarEstadoCuenta no está disponible después de esperar');
        if (typeof window.showNotification === 'function') {
          window.showNotification(
            'Error: El sistema de estado de cuenta no está listo. Por favor, espera unos segundos y vuelve a intentar.',
            'error'
          );
        } else {
          alert(
            'Error: El sistema de estado de cuenta no está listo. Por favor, espera unos segundos y vuelve a intentar.'
          );
        }
      }
    },

    exportarEstadoCuentaExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarEstadoCuentaExcel === 'function') {
        window.exportarEstadoCuentaExcel();
      } else {
        console.error('exportarEstadoCuentaExcel no está disponible');
      }
    },

    exportarEstadoCuentaPDF: function (event) {
      event.preventDefault();
      if (typeof window.exportarEstadoCuentaPDF === 'function') {
        window.exportarEstadoCuentaPDF();
      } else {
        console.error('exportarEstadoCuentaPDF no está disponible');
      }
    },

    limpiarFiltrosEstadoCuenta: function (event) {
      if (event) {
        event.preventDefault();
      }
      if (typeof window.limpiarFiltrosEstadoCuenta === 'function') {
        window.limpiarFiltrosEstadoCuenta();
      } else {
        console.error('limpiarFiltrosEstadoCuenta no está disponible');
      }
    },

    // Movimientos
    clearCurrentForm: async function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (
        !confirm(
          '¿Estás seguro de que deseas limpiar el formulario? Se perderán todos los datos no guardados.'
        )
      ) {
        return;
      }

      // Función para limpiar manualmente el formulario
      function limpiarFormularioManual() {
        const form = document.querySelector('.needs-validation');
        if (form) {
          form.reset();
          form.classList.remove('was-validated');
        }

        // Limpiar campos específicos
        const montoInput = document.getElementById('montoapagar');
        if (montoInput) {
          montoInput.value = '';
        }

        // Ocultar tipo de cambio
        const tipoCambioDiv = document.getElementById('grupoTipoCambioTesorería');
        if (tipoCambioDiv) {
          tipoCambioDiv.style.display = 'none';
        }

        // Ocultar observaciones
        const observacionesDiv = document.getElementById('descripcionObservaciones');
        if (observacionesDiv) {
          observacionesDiv.style.display = 'none';
          const textarea = observacionesDiv.querySelector('textarea');
          if (textarea) {
            textarea.value = '';
          }
        }

        // Resetear radio buttons de observaciones
        const observacionesNo = document.getElementById('observacionesNo');
        if (observacionesNo) {
          observacionesNo.checked = true;
        }
        const observacionesSi = document.getElementById('observacionesSi');
        if (observacionesSi) {
          observacionesSi.checked = false;
        }

        console.log('✅ Formulario limpiado manualmente');
      }

      // Intentar usar tesoreriaMovimientosUI si está disponible
      if (
        window.tesoreriaMovimientosUI &&
        typeof window.tesoreriaMovimientosUI.clearForm === 'function'
      ) {
        try {
          window.tesoreriaMovimientosUI.clearForm();
          console.log('✅ Formulario limpiado usando tesoreriaMovimientosUI');
        } catch (error) {
          console.error('Error al limpiar formulario con tesoreriaMovimientosUI:', error);
          limpiarFormularioManual();
        }
      } else {
        // Esperar un poco más por si acaso se está cargando
        let attempts = 0;
        const maxAttempts = 10;
        while (
          attempts < maxAttempts &&
          (!window.tesoreriaMovimientosUI ||
            typeof window.tesoreriaMovimientosUI.clearForm !== 'function')
        ) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (
          window.tesoreriaMovimientosUI &&
          typeof window.tesoreriaMovimientosUI.clearForm === 'function'
        ) {
          try {
            window.tesoreriaMovimientosUI.clearForm();
            console.log(
              '✅ Formulario limpiado usando tesoreriaMovimientosUI (después de esperar)'
            );
          } catch (error) {
            console.error('Error al limpiar formulario:', error);
            limpiarFormularioManual();
          }
        } else {
          console.log('ℹ️ tesoreriaMovimientosUI no disponible, limpiando manualmente...');
          limpiarFormularioManual();
        }
      }
    },

    guardarMovimiento: async function (event) {
      event.preventDefault();
      event.stopPropagation();

      // Esperar a que tesoreriaMovimientosUI esté disponible (aumentar tiempo de espera)
      let attempts = 0;
      const maxAttempts = 60; // Aumentado a 60 intentos (6 segundos)
      while (
        attempts < maxAttempts &&
        (!window.tesoreriaMovimientosUI ||
          typeof window.tesoreriaMovimientosUI.guardarMovimiento !== 'function')
      ) {
        attempts++;
        if (attempts % 10 === 0) {
          console.log(`⏳ Esperando tesoreriaMovimientosUI... (${attempts}/${maxAttempts})`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (
        window.tesoreriaMovimientosUI &&
        typeof window.tesoreriaMovimientosUI.guardarMovimiento === 'function'
      ) {
        try {
          await window.tesoreriaMovimientosUI.guardarMovimiento();
        } catch (error) {
          console.error('Error al guardar movimiento:', error);
          if (typeof window.showNotification === 'function') {
            window.showNotification(
              `Error al guardar el movimiento: ${error.message || 'Error desconocido'}`,
              'error'
            );
          } else {
            alert(`Error al guardar el movimiento: ${error.message || 'Error desconocido'}`);
          }
        }
      } else {
        console.error(
          'tesoreriaMovimientosUI.guardarMovimiento no está disponible después de esperar'
        );
        console.log('Estado de tesoreriaMovimientosUI:', {
          existe: Boolean(window.tesoreriaMovimientosUI),
          tieneGuardarMovimiento: Boolean(
            window.tesoreriaMovimientosUI &&
              typeof window.tesoreriaMovimientosUI.guardarMovimiento === 'function'
          )
        });
        if (typeof window.showNotification === 'function') {
          window.showNotification(
            'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.',
            'error'
          );
        } else {
          alert(
            'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.'
          );
        }
      }
    },

    limpiarFiltrosTesoreria: function (event) {
      event.preventDefault();
      if (
        window.tesoreriaMovimientosUI &&
        typeof window.tesoreriaMovimientosUI.limpiarFiltros === 'function'
      ) {
        window.tesoreriaMovimientosUI.limpiarFiltros();
      } else {
        console.error('tesoreriaMovimientosUI.limpiarFiltros no está disponible');
      }
    },

    limpiarFiltrosSolicitudesTesoreria: function (event) {
      if (event) {
        event.preventDefault();
      }
      if (
        window.tesoreriaUI &&
        typeof window.tesoreriaUI.limpiarFiltrosSolicitudes === 'function'
      ) {
        window.tesoreriaUI.limpiarFiltrosSolicitudes();
      } else {
        console.error('tesoreriaUI.limpiarFiltrosSolicitudes no está disponible');
      }
    },

    aplicarFiltrosTesoreria: function (event) {
      if (event) {
        event.preventDefault();
      }
      if (window.tesoreriaUI && typeof window.tesoreriaUI.aplicarFiltros === 'function') {
        window.tesoreriaUI.aplicarFiltros();
      } else {
        console.error('tesoreriaUI.aplicarFiltros no está disponible');
      }
    },

    // Exportación
    exportarTesoreriaExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarTesoreriaExcel === 'function') {
        window.exportarTesoreriaExcel();
      } else {
        console.error('exportarTesoreriaExcel no está disponible');
      }
    },

    exportarSolicitudesTesoreriaExcel: function (event) {
      event.preventDefault();
      if (typeof window.exportarSolicitudesTesoreriaExcel === 'function') {
        window.exportarSolicitudesTesoreriaExcel();
      } else {
        console.error('exportarSolicitudesTesoreriaExcel no está disponible');
      }
    },

    // Solicitudes
    registrarPagoSolicitud: async function (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      console.log('🖱️ Botón de registrar pago clickeado');

      // Verificar si ya hay un proceso en curso
      if (window._tesoreriaRegistrandoPago) {
        console.log('⚠️ Ya hay un proceso de registro de pago en curso, ignorando clic duplicado');
        return false;
      }

      // Esperar a que la función esté disponible
      let attempts = 0;
      const maxAttempts = 30; // 3 segundos
      while (attempts < maxAttempts && typeof window.registrarPagoSolicitud !== 'function') {
        attempts++;
        if (attempts % 10 === 0) {
          console.log(`⏳ Esperando registrarPagoSolicitud... (${attempts}/${maxAttempts})`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (typeof window.registrarPagoSolicitud === 'function') {
        try {
          console.log('✅ Función registrarPagoSolicitud encontrada, ejecutando...');
          await window.registrarPagoSolicitud();
        } catch (error) {
          console.error('❌ Error al registrar pago:', error);
          // Asegurar que el flag se restablezca en caso de error
          window._tesoreriaRegistrandoPago = false;

          // Restaurar botón manualmente si es necesario
          const btnRegistrar = document.querySelector(
            '#modalRegistrarPagoSolicitud button[data-action="registrarPagoSolicitud"]'
          );
          if (btnRegistrar && btnRegistrar.disabled) {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = '<i class="fas fa-check"></i> Registrar Pago';
            btnRegistrar.style.opacity = '';
            btnRegistrar.style.cursor = '';
          }

          if (typeof window.showNotification === 'function') {
            window.showNotification(
              `Error al registrar el pago: ${error.message || 'Error desconocido'}`,
              'error'
            );
          } else {
            alert(`Error al registrar el pago: ${error.message || 'Error desconocido'}`);
          }
        }
      } else {
        console.error('❌ registrarPagoSolicitud no está disponible después de esperar');
        if (typeof window.showNotification === 'function') {
          window.showNotification(
            'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.',
            'error'
          );
        } else {
          alert(
            'Error: El sistema de tesorería no está listo. Por favor, espera unos segundos y vuelve a intentar.'
          );
        }
      }
    },

    // Actualización de cuentas bancarias
    actualizarCuentasBancariasEstadoCuenta: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarCuentasBancariasEstadoCuenta === 'function') {
        window.actualizarCuentasBancariasEstadoCuenta();
      } else {
        console.error('actualizarCuentasBancariasEstadoCuenta no está disponible');
      }
    },

    actualizarEtiquetasBancarias: async function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      console.log('🔄 actualizarEtiquetasBancarias llamada');
      if (typeof window.actualizarEtiquetasBancarias === 'function') {
        try {
          await window.actualizarEtiquetasBancarias();
          console.log('✅ Etiquetas bancarias actualizadas');

          // Después de actualizar, verificar si hay un select de banco origen y reconectar el handler
          const selectBancoOrigen = document.getElementById('bancoorigen');
          if (selectBancoOrigen && selectBancoOrigen.tagName === 'SELECT') {
            // Verificar si ya tiene el handler
            if (!selectBancoOrigen.hasAttribute('data-handler-attached')) {
              selectBancoOrigen.setAttribute('data-action', 'actualizarCuentasOrigen');
              selectBancoOrigen.addEventListener('change', async () => {
                console.log(
                  '🔄 Banco origen cambiado desde event handler, actualizando cuentas...'
                );
                if (typeof window.actualizarCuentasOrigen === 'function') {
                  await window.actualizarCuentasOrigen();
                }
              });
              selectBancoOrigen.setAttribute('data-handler-attached', 'true');
              console.log('✅ Handler de banco origen reconectado');
            }
          }
        } catch (error) {
          console.error('❌ Error actualizando etiquetas bancarias:', error);
        }
      } else {
        console.error('❌ actualizarEtiquetasBancarias no está disponible');
      }
    },

    toggleTipoCambioTesorería: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.toggleTipoCambioTesorería === 'function') {
        window.toggleTipoCambioTesorería();
      } else {
        console.error('toggleTipoCambioTesorería no está disponible');
      }
    },

    actualizarCuentasOrigen: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarCuentasOrigen === 'function') {
        window.actualizarCuentasOrigen();
      } else {
        console.error('actualizarCuentasOrigen no está disponible');
      }
    },

    actualizarCuentasOrigenFiltro: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarCuentasOrigenFiltro === 'function') {
        window.actualizarCuentasOrigenFiltro();
      } else {
        console.error('actualizarCuentasOrigenFiltro no está disponible');
      }
      // También aplicar filtros después de actualizar cuentas
      if (
        window.tesoreriaMovimientosUI &&
        typeof window.tesoreriaMovimientosUI.aplicarFiltros === 'function'
      ) {
        window.tesoreriaMovimientosUI.aplicarFiltros();
      }
    },

    actualizarCuentasOrigenSolicitud: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.actualizarCuentasOrigenSolicitud === 'function') {
        window.actualizarCuentasOrigenSolicitud();
      } else {
        console.error('actualizarCuentasOrigenSolicitud no está disponible');
      }
    },

    previewComprobantesSolicitud: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (typeof window.previewComprobantesSolicitud === 'function') {
        window.previewComprobantesSolicitud();
      } else {
        console.error('previewComprobantesSolicitud no está disponible');
      }
    },

    // Handler para aplicar filtros de movimientos (puede ser llamado desde múltiples lugares)
    aplicarFiltrosMovimientos: function (event) {
      // Permitir que funcione tanto para click como para change
      if (event) {
        event.preventDefault();
      }
      if (
        window.tesoreriaMovimientosUI &&
        typeof window.tesoreriaMovimientosUI.aplicarFiltros === 'function'
      ) {
        window.tesoreriaMovimientosUI.aplicarFiltros();
      } else {
        console.error('tesoreriaMovimientosUI.aplicarFiltros no está disponible');
      }
    }
  };

  /**
   * Inicializar event handlers de tesorería
   */
  function initTesoreriaEventHandlers() {
    console.log('🔧 Inicializando event handlers de tesorería...');

    // Registrar todas las acciones en el sistema global (si no se registraron ya)
    Object.keys(tesoreriaActions).forEach(action => {
      if (typeof window.registerGlobalAction === 'function') {
        // Verificar si la acción ya está registrada
        const accionesRegistradas = window.getRegisteredActions
          ? window.getRegisteredActions()
          : [];
        if (!accionesRegistradas.includes(action)) {
          window.registerGlobalAction(action, tesoreriaActions[action]);
          console.log(`✅ Acción de tesorería registrada: ${action}`);
        }
      }
    });

    // Agregar listeners a elementos con data-action
    const elementosConDataAction = document.querySelectorAll('[data-action]');
    console.log(`🔍 Encontrados ${elementosConDataAction.length} elementos con data-action`);

    elementosConDataAction.forEach(element => {
      const action = element.getAttribute('data-action');
      console.log(
        `🔍 Elemento encontrado con data-action="${action}":`,
        element.tagName,
        element.className
      );

      if (tesoreriaActions[action]) {
        // Evitar duplicados
        if (!element.hasAttribute('data-handler-attached')) {
          // Determinar el tipo de evento según el tipo de elemento
          const tagName = element.tagName.toLowerCase();
          const inputType = element.type ? element.type.toLowerCase() : '';

          // Para inputs, selects y textareas usar 'change', para botones usar 'click'
          // Para inputs de tipo text usar 'input' con debounce para filtros automáticos
          if (tagName === 'input' && inputType === 'text' && action === 'aplicarFiltrosTesoreria') {
            // Para el campo de filtro de texto, usar debounce para evitar ejecuciones excesivas
            let debounceTimer;
            element.addEventListener('input', () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(() => {
                tesoreriaActions[action](null);
              }, 500); // Esperar 500ms después de que el usuario deje de escribir
            });
          } else if (tagName === 'input' && inputType === 'text') {
            // Para otros inputs de texto, usar keyup
            element.addEventListener('keyup', tesoreriaActions[action]);
          } else if (tagName === 'input' || tagName === 'select' || tagName === 'textarea') {
            element.addEventListener('change', tesoreriaActions[action]);
          } else {
            element.addEventListener('click', tesoreriaActions[action]);
            console.log(`✅ Listener 'click' agregado a botón con data-action="${action}"`);
          }

          element.setAttribute('data-handler-attached', 'true');
          const eventType =
            tagName === 'input' && inputType === 'text' && action === 'aplicarFiltrosTesoreria'
              ? 'input (debounced)'
              : tagName === 'input' && inputType === 'text'
                ? 'keyup'
                : tagName === 'input' || tagName === 'select' || tagName === 'textarea'
                  ? 'change'
                  : 'click';
          console.log(
            `✅ Handler de tesorería registrado: ${action} (${eventType}) en elemento:`,
            element
          );
        } else {
          console.log(`ℹ️ Elemento con data-action="${action}" ya tiene handler registrado`);
        }
      } else {
        console.warn(`⚠️ No se encontró handler para acción: ${action}`);
      }
    });

    // Verificar específicamente el botón de guardarMovimiento y agregar listener directo como respaldo
    const botonGuardarMovimiento = document.querySelector('[data-action="guardarMovimiento"]');
    if (botonGuardarMovimiento) {
      console.log('✅ Botón guardarMovimiento encontrado:', botonGuardarMovimiento);
      console.log(
        '   - Tiene handler attached:',
        botonGuardarMovimiento.hasAttribute('data-handler-attached')
      );
      console.log('   - Tipo:', botonGuardarMovimiento.tagName);
      console.log('   - Clases:', botonGuardarMovimiento.className);

      // Agregar listener directo como respaldo si no tiene handler
      if (!botonGuardarMovimiento.hasAttribute('data-handler-attached')) {
        console.log('⚠️ Botón no tiene handler, agregando listener directo...');
        botonGuardarMovimiento.addEventListener('click', tesoreriaActions.guardarMovimiento);
        botonGuardarMovimiento.setAttribute('data-handler-attached', 'true');
        console.log('✅ Listener directo agregado al botón guardarMovimiento');
      }
    } else {
      console.warn('⚠️ Botón guardarMovimiento NO encontrado en el DOM');
    }

    // También usar MutationObserver para detectar cuando se agrega el botón dinámicamente
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Element node
            // Verificar si el nodo agregado es el botón o lo contiene
            const boton =
              node.matches && node.matches('[data-action="guardarMovimiento"]')
                ? node
                : node.querySelector && node.querySelector('[data-action="guardarMovimiento"]');

            if (boton && !boton.hasAttribute('data-handler-attached')) {
              console.log(
                '🔄 Botón guardarMovimiento detectado dinámicamente, agregando handler...'
              );
              boton.addEventListener('click', tesoreriaActions.guardarMovimiento);
              boton.setAttribute('data-handler-attached', 'true');
              console.log('✅ Handler agregado a botón dinámico');
            }
          }
        });
      });
    });

    // Observar cambios en el body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('✅ MutationObserver configurado para botón guardarMovimiento');

    // Agregar listener específico para el botón de registrar pago en el modal (cuando se abre)
    const modalRegistrarPago = document.getElementById('modalRegistrarPagoSolicitud');
    if (modalRegistrarPago) {
      modalRegistrarPago.addEventListener('shown.bs.modal', () => {
        console.log('📋 Modal de registrar pago abierto, verificando event handler...');
        const btnRegistrar = modalRegistrarPago.querySelector(
          'button[data-action="registrarPagoSolicitud"]'
        );
        if (btnRegistrar) {
          // Si no tiene handler, agregarlo
          if (!btnRegistrar.hasAttribute('data-handler-attached')) {
            console.log('⚠️ Botón no tiene handler, agregándolo desde event-handlers...');
            btnRegistrar.addEventListener('click', tesoreriaActions.registrarPagoSolicitud);
            btnRegistrar.setAttribute('data-handler-attached', 'true');
            console.log('✅ Handler agregado al botón desde event-handlers');
          } else {
            console.log('✅ Botón ya tiene handler registrado');
          }
        } else {
          console.warn('⚠️ Botón de registrar pago no encontrado en el modal');
        }
      });
    }

    // Inicializar toggle de observaciones
    initObservacionesToggle();

    // Inicializar formateo de monto
    initFormatoMonto();

    // Inicializar remoción de estado de focus
    initRemoverFocus();

    // Configurar listeners cuando se muestra la pestaña de solicitudes
    configurarListenersPestanaSolicitudes();

    console.log('✅ Event handlers de tesorería inicializados');
  }

  /**
   * Configurar listeners para la pestaña de solicitudes
   */
  function configurarListenersPestanaSolicitudes() {
    // Función para configurar los listeners de filtros
    function configurarFiltrosSolicitudes() {
      const filtros = [
        { id: 'tesoFiltroProveedor', tipo: 'text' },
        { id: 'tesoFiltroEstado', tipo: 'text' },
        { id: 'tesoFiltroDesde', tipo: 'date' },
        { id: 'tesoFiltroHasta', tipo: 'date' },
        { id: 'tesoFiltroPrioridad', tipo: 'select' }
      ];

      let configurados = 0;
      filtros.forEach(filtro => {
        const elemento = document.getElementById(filtro.id);
        if (elemento) {
          // Solo agregar listener si no tiene uno ya configurado
          if (!elemento.hasAttribute('data-handler-attached')) {
            if (filtro.tipo === 'text') {
              // Para campos de texto, usar debounce
              let debounceTimer;
              const handler = function () {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                  console.log(`🔍 Filtro automático ejecutado desde: ${filtro.id}`);
                  if (
                    window.tesoreriaUI &&
                    typeof window.tesoreriaUI.aplicarFiltros === 'function'
                  ) {
                    window.tesoreriaUI.aplicarFiltros();
                  } else {
                    console.warn('⚠️ tesoreriaUI.aplicarFiltros no está disponible');
                  }
                }, 500);
              };
              elemento.addEventListener('input', handler);
              elemento._filterHandler = handler; // Guardar referencia para poder removerlo después si es necesario
            } else {
              // Para selects y dates, usar change
              const handler = function () {
                console.log(`🔍 Filtro automático ejecutado desde: ${filtro.id}`);
                if (window.tesoreriaUI && typeof window.tesoreriaUI.aplicarFiltros === 'function') {
                  window.tesoreriaUI.aplicarFiltros();
                } else {
                  console.warn('⚠️ tesoreriaUI.aplicarFiltros no está disponible');
                }
              };
              elemento.addEventListener('change', handler);
              elemento._filterHandler = handler; // Guardar referencia
            }
            elemento.setAttribute('data-handler-attached', 'true');
            configurados++;
            console.log(`✅ Listener configurado para filtro: ${filtro.id}`);
          } else {
            console.log(`ℹ️ Listener ya configurado para filtro: ${filtro.id}`);
          }
        } else {
          console.warn(`⚠️ Elemento de filtro no encontrado: ${filtro.id}`);
        }
      });

      if (configurados > 0) {
        console.log(`✅ ${configurados} filtro(s) configurado(s) para la pestaña de solicitudes`);
      }
    }

    // Configurar inmediatamente si la pestaña ya está activa
    const tabSolicitudes = document.getElementById('solicitudes-tab');
    const tabSolicitudesContent = document.getElementById('solicitudes');
    if (tabSolicitudes && tabSolicitudesContent) {
      const isActive =
        tabSolicitudes.classList.contains('active') ||
        tabSolicitudesContent.classList.contains('active') ||
        tabSolicitudesContent.classList.contains('show');

      if (isActive) {
        // Esperar un poco para que el DOM esté completamente renderizado
        setTimeout(() => {
          configurarFiltrosSolicitudes();
        }, 200);
      }
    }

    // Configurar cuando se muestra la pestaña de solicitudes
    if (tabSolicitudes) {
      tabSolicitudes.addEventListener('shown.bs.tab', () => {
        console.log('📋 Pestaña de solicitudes mostrada, configurando filtros...');
        setTimeout(() => {
          configurarFiltrosSolicitudes();
        }, 200);
      });
    }

    // También usar MutationObserver para detectar cuando se muestra la pestaña
    if (tabSolicitudesContent) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const isVisible =
              tabSolicitudesContent.classList.contains('active') ||
              tabSolicitudesContent.classList.contains('show');
            if (isVisible) {
              console.log(
                '📋 Pestaña de solicitudes detectada como visible, configurando filtros...'
              );
              setTimeout(() => {
                configurarFiltrosSolicitudes();
              }, 200);
            }
          }
        });
      });

      observer.observe(tabSolicitudesContent, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // Configurar también después de delays para asegurar que todo esté listo
    setTimeout(() => {
      configurarFiltrosSolicitudes();
    }, 1000);

    setTimeout(() => {
      configurarFiltrosSolicitudes();
    }, 2000);
  }

  /**
   * Remover estado de focus de los campos después de perder el foco
   */
  function initRemoverFocus() {
    // Función para remover focus de un campo
    function removerFocus(campo) {
      if (!campo) {
        return;
      }

      // Forzar remoción de focus
      campo.blur();
      campo.classList.remove('focus', 'is-focused');
      campo.classList.add('no-focus');

      // Forzar estilos inline para sobrescribir cualquier CSS
      campo.style.setProperty('background-color', '#fff', 'important');
      campo.style.setProperty('border-color', '#ced4da', 'important');
      campo.style.setProperty('box-shadow', 'none', 'important');
      campo.style.setProperty('outline', 'none', 'important');
      campo.style.setProperty('outline-offset', '0', 'important');

      // También remover pseudo-clases de focus
      if (campo.matches(':focus')) {
        campo.blur();
      }
    }

    // Obtener el formulario una vez para usar en los listeners
    const form = document.querySelector('.needs-validation');

    // Campos específicos que necesitan remover el estado de focus
    const camposIds = [
      'Proveedor',
      'numeroFactura',
      'montoapagar',
      'bancodestino',
      'cuentadestino',
      'referenciabancaria'
    ];

    camposIds.forEach(campoId => {
      const campo = document.getElementById(campoId);
      if (campo) {
        // Variable para rastrear si se usó autocompletado
        let usadoAutocompletado = false;

        // Detectar cuando se abre el autocompletado (cuando el usuario empieza a escribir)
        campo.addEventListener(
          'input',
          function () {
            // Si el campo tiene valor y está enfocado, podría ser autocompletado
            if (this.value && document.activeElement === this) {
              // Marcar que podría haber autocompletado
              usadoAutocompletado = true;
            }
          },
          { passive: true }
        );

        // Detectar cuando se selecciona una opción del autocompletado
        campo.addEventListener(
          'change',
          function () {
            // Si el valor cambió y el campo está enfocado, probablemente fue autocompletado
            if (document.activeElement === this) {
              usadoAutocompletado = true;
              // Preparar para remover focus cuando se presione Tab
              const handleTabAfterAutocomplete = e => {
                if (e.key === 'Tab' || e.keyCode === 9) {
                  e.preventDefault();
                  setTimeout(() => {
                    removerFocus(campo);
                    // Mover al siguiente campo
                    const campos = Array.from(form.querySelectorAll('input, select, textarea'));
                    const indiceActual = campos.indexOf(campo);
                    if (indiceActual < campos.length - 1) {
                      campos[indiceActual + 1].focus();
                    }
                  }, 100);
                  campo.removeEventListener('keydown', handleTabAfterAutocomplete);
                }
              };
              campo.addEventListener('keydown', handleTabAfterAutocomplete, { once: true });
            }
          },
          { passive: true }
        );

        // Remover estado de focus después de perder el foco
        campo.addEventListener(
          'blur',
          function () {
            setTimeout(
              () => {
                removerFocus(this);
                usadoAutocompletado = false;
              },
              usadoAutocompletado ? 100 : 10
            );
          },
          { passive: true }
        );

        // Manejar cuando se presiona Tab - especialmente después de autocompletado
        campo.addEventListener(
          'keydown',
          function (e) {
            if (e.key === 'Tab' || e.keyCode === 9) {
              // Si se usó autocompletado, dar más tiempo para procesar
              if (usadoAutocompletado) {
                e.preventDefault();
                setTimeout(() => {
                  removerFocus(this);
                  // Mover al siguiente campo manualmente
                  const formElement = this.closest('form') || form;
                  if (formElement) {
                    const campos = Array.from(
                      formElement.querySelectorAll('input:not([type="hidden"]), select, textarea')
                    );
                    const indiceActual = campos.indexOf(this);
                    if (indiceActual < campos.length - 1) {
                      campos[indiceActual + 1].focus();
                    } else {
                      this.blur();
                    }
                  } else {
                    this.blur();
                  }
                  usadoAutocompletado = false;
                }, 100);
              } else {
                // Si no es autocompletado, remover focus normalmente
                setTimeout(() => {
                  removerFocus(this);
                }, 10);
              }
            }
          },
          { passive: false }
        ); // No pasivo para poder prevenir el comportamiento por defecto

        // También remover cuando se hace clic fuera (usar capture para asegurar que se ejecute)
        document.addEventListener(
          'click',
          e => {
            if (document.activeElement === campo && !campo.contains(e.target)) {
              setTimeout(() => {
                removerFocus(campo);
                usadoAutocompletado = false;
              }, 10);
            }
          },
          { capture: true, passive: true }
        );
      }
    });

    // También aplicar a todos los campos del formulario
    if (form) {
      const todosLosCampos = form.querySelectorAll(
        'input.form-control, select.form-select, textarea.form-control'
      );
      todosLosCampos.forEach(campo => {
        // Solo agregar si no está en la lista de campos específicos (ya tienen handlers)
        if (!camposIds.includes(campo.id)) {
          campo.addEventListener(
            'blur',
            function () {
              setTimeout(() => {
                removerFocus(this);
              }, 10);
            },
            { passive: true }
          );
        }
      });
    }

    // Listener global para remover focus cuando se hace clic en cualquier parte
    document.addEventListener(
      'click',
      e => {
        const elementoActivo = document.activeElement;
        if (
          elementoActivo &&
          elementoActivo.tagName &&
          (elementoActivo.tagName === 'INPUT' ||
            elementoActivo.tagName === 'SELECT' ||
            elementoActivo.tagName === 'TEXTAREA')
        ) {
          // Si el click no es en el campo activo, remover focus
          if (!elementoActivo.contains(e.target) && e.target !== elementoActivo) {
            setTimeout(() => {
              removerFocus(elementoActivo);
            }, 10);
          }
        }
      },
      { capture: true, passive: true }
    );

    console.log('✅ Remoción de focus inicializada');
  }

  /**
   * Inicializar formateo automático del campo de monto
   */
  function initFormatoMonto() {
    const montoInput = document.getElementById('montoapagar');
    if (!montoInput) {
      console.warn('⚠️ Campo montoapagar no encontrado');
      return;
    }

    // Función para limpiar formato y obtener valor numérico
    function limpiarFormatoMoneda(valor) {
      if (!valor || valor === '') {
        return '';
      }
      return valor
        .toString()
        .replace(/[$,]/g, '') // Remover símbolos de moneda y comas
        .replace(/\s/g, '') // Remover espacios
        .trim();
    }

    // Función para formatear como moneda mexicana
    function formatearMoneda(valor) {
      const valorLimpio = limpiarFormatoMoneda(valor);
      if (!valorLimpio || valorLimpio === '') {
        return '';
      }

      const numero = parseFloat(valorLimpio);
      if (isNaN(numero) || numero <= 0) {
        return valor;
      } // Si no es un número válido, devolver el valor original

      // Formatear con separadores de miles y 2 decimales
      return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(numero);
    }

    // Validar que el valor sea un número válido
    function validarMonto(valor) {
      const valorLimpio = limpiarFormatoMoneda(valor);
      if (!valorLimpio || valorLimpio === '') {
        return false;
      }
      const numero = parseFloat(valorLimpio);
      return !isNaN(numero) && numero > 0;
    }

    // Al perder el foco, formatear el monto
    montoInput.addEventListener('blur', function () {
      const valor = this.value;
      if (valor && valor.trim() !== '') {
        // Validar antes de formatear
        if (validarMonto(valor)) {
          const valorFormateado = formatearMoneda(valor);
          this.value = valorFormateado;
          // Remover clase de error si existe
          this.classList.remove('is-invalid');
          this.setCustomValidity('');
        } else {
          // Si no es válido, mantener el valor pero marcar como inválido
          this.classList.add('is-invalid');
          this.setCustomValidity('Por favor ingrese un monto válido');
        }
      }
    });

    // Al obtener el foco, limpiar el formato para facilitar la edición
    montoInput.addEventListener('focus', function () {
      const valor = this.value;
      if (valor && valor.trim() !== '') {
        const valorLimpio = limpiarFormatoMoneda(valor);
        if (valorLimpio !== valor) {
          this.value = valorLimpio;
        }
      }
      // Remover validación visual al enfocar
      this.classList.remove('is-invalid');
      this.setCustomValidity('');
    });

    // Permitir solo números, punto y coma al escribir
    montoInput.addEventListener('keypress', e => {
      const char = String.fromCharCode(e.which);
      const { keyCode } = e;

      // Permitir teclas de control (backspace, delete, tab, enter, escape, arrows)
      if ([8, 9, 13, 27, 37, 38, 39, 40, 46].includes(keyCode)) {
        return;
      }

      // Solo permitir números, punto y coma
      if (!/[0-9.,]/.test(char)) {
        e.preventDefault();
      }
    });

    // Limpiar formato al pegar
    montoInput.addEventListener('paste', function (_e) {
      setTimeout(() => {
        const valor = this.value;
        const valorLimpio = valor.replace(/[^0-9.,]/g, '');
        this.value = valorLimpio;
      }, 10);
    });

    // Validación personalizada para el formulario
    montoInput.addEventListener('input', function () {
      const valor = this.value;
      if (valor && valor.trim() !== '') {
        if (validarMonto(valor)) {
          this.setCustomValidity('');
          this.classList.remove('is-invalid');
        } else {
          this.setCustomValidity('Por favor ingrese un monto válido');
        }
      } else {
        this.setCustomValidity('');
      }
    });

    console.log('✅ Formateo de monto inicializado');
  }

  /**
   * Inicializar el toggle de observaciones
   */
  function initObservacionesToggle() {
    const observacionesRadios = document.querySelectorAll('input[name="observaciones"]');
    const descripcionObservaciones = document.getElementById('descripcionObservaciones');

    if (!observacionesRadios.length || !descripcionObservaciones) {
      console.warn('⚠️ No se encontraron elementos de observaciones');
      return;
    }

    // Función para manejar el cambio
    function handleObservacionesChange(event) {
      const radio = event.target;
      if (radio.value === 'si') {
        // Mostrar el campo de observaciones
        descripcionObservaciones.style.display = 'block';
        descripcionObservaciones.classList.remove('descripcion-observaciones-hidden');
        const textarea = descripcionObservaciones.querySelector('textarea');
        if (textarea) {
          textarea.required = true;
        }
        console.log('✅ Campo de observaciones mostrado');
      } else {
        // Ocultar el campo de observaciones
        descripcionObservaciones.style.display = 'none';
        descripcionObservaciones.classList.add('descripcion-observaciones-hidden');
        const textarea = descripcionObservaciones.querySelector('textarea');
        if (textarea) {
          textarea.required = false;
          textarea.value = '';
        }
        console.log('✅ Campo de observaciones ocultado');
      }
    }

    // Agregar listeners a cada radio button
    observacionesRadios.forEach(radio => {
      // Verificar si ya tiene un listener para evitar duplicados
      if (!radio.hasAttribute('data-observaciones-handler')) {
        radio.addEventListener('change', handleObservacionesChange);
        radio.setAttribute('data-observaciones-handler', 'true');
      }
    });

    // Verificar el estado inicial
    const radioSeleccionado = document.querySelector('input[name="observaciones"]:checked');
    if (radioSeleccionado && radioSeleccionado.value === 'si') {
      descripcionObservaciones.style.display = 'block';
      descripcionObservaciones.classList.remove('descripcion-observaciones-hidden');
      const textarea = descripcionObservaciones.querySelector('textarea');
      if (textarea) {
        textarea.required = true;
      }
    }

    console.log('✅ Toggle de observaciones inicializado');
  }

  // Registrar acciones inmediatamente (antes de que el sistema global las busque)
  // Esto asegura que las acciones estén disponibles cuando el sistema global se ejecute
  Object.keys(tesoreriaActions).forEach(action => {
    if (typeof window.registerGlobalAction === 'function') {
      window.registerGlobalAction(action, tesoreriaActions[action]);
      console.log(`✅ Acción de tesorería registrada globalmente: ${action}`);
    } else {
      // Si registerGlobalAction no está disponible aún, esperar y reintentar
      const intentarRegistrar = () => {
        if (typeof window.registerGlobalAction === 'function') {
          window.registerGlobalAction(action, tesoreriaActions[action]);
          console.log(`✅ Acción de tesorería registrada globalmente (retardada): ${action}`);
        } else {
          setTimeout(intentarRegistrar, 100);
        }
      };
      setTimeout(intentarRegistrar, 50);
    }
  });

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTesoreriaEventHandlers);
  } else {
    initTesoreriaEventHandlers();
  }

  // También inicializar después de un delay para asegurar que otros scripts se hayan cargado
  setTimeout(initTesoreriaEventHandlers, 200);

  // Inicializar observaciones después de un delay adicional para asegurar que el DOM esté completamente cargado
  setTimeout(() => {
    initObservacionesToggle();
  }, 500);

  // Verificar periódicamente que tesoreriaMovimientosUI esté disponible
  let verificacionIntentos = 0;
  const maxVerificaciones = 100; // 10 segundos
  const intervaloVerificacion = setInterval(() => {
    verificacionIntentos++;
    if (
      window.tesoreriaMovimientosUI &&
      typeof window.tesoreriaMovimientosUI.guardarMovimiento === 'function'
    ) {
      console.log('✅ tesoreriaMovimientosUI está disponible');
      clearInterval(intervaloVerificacion);
    } else if (verificacionIntentos >= maxVerificaciones) {
      console.warn('⚠️ tesoreriaMovimientosUI no está disponible después de 10 segundos');
      clearInterval(intervaloVerificacion);
    }
  }, 100);

  console.log('✅ Módulo de event handlers de tesorería cargado');
})();
