/**
 * Manejo de EnvÃ­o de Formulario - trafico.html
 * Funciones para manejar el envÃ­o del formulario de trÃ¡fico y gestiÃ³n del botÃ³n
 *
 * @module trafico/form-submit-handler
 */

(function () {
  'use strict';
  window.manejarEnvioFormulario = async function (event) {
    console.log('ðŸ“ Manejando envÃ­o del formulario de trÃ¡fico...');

    // Prevenir envÃ­o por defecto
    event.preventDefault();

    // Obtener el botÃ³n de envÃ­o
    const btnEnvio = document.getElementById('btnRegistrarEnvio');
    if (!btnEnvio) {
      console.error('âŒ No se encontrÃ³ el botÃ³n de envÃ­o');
      return;
    }

    // SIEMPRE restaurar el botÃ³n antes de procesar
    console.log('ðŸ”§ Restaurando botÃ³n antes de procesar...');
    btnEnvio.disabled = false;
    btnEnvio.innerHTML = '<i class="fas fa-check"></i> Registrar EnvÃ­o';

    // Limpiar cualquier timeout pendiente
    for (let i = 1; i < 10000; i++) {
      clearTimeout(i);
    }

    // Verificar si ya estÃ¡ procesando (despuÃ©s de restaurar)
    if (btnEnvio.disabled && btnEnvio.innerHTML.includes('Procesando')) {
      console.warn(
        'âš ï¸ BotÃ³n sigue procesando despuÃ©s de restaurar, forzando restauraciÃ³n...'
      );
      btnEnvio.disabled = false;
      btnEnvio.innerHTML = '<i class="fas fa-check"></i> Registrar EnvÃ­o';

      // Mostrar mensaje informativo
      if (typeof window.showNotification === 'function') {
        window.showNotification('BotÃ³n restaurado, puedes intentar de nuevo', 'info');
      } else {
        alert('BotÃ³n restaurado, puedes intentar de nuevo');
      }

      // Salir de la funciÃ³n para permitir que el usuario haga clic nuevamente
      return;
    }

    let timeoutId = null;
    let procesando = false;

    // FunciÃ³n para restaurar el botÃ³n
    const _restaurarBoton = () => {
      console.log('ðŸ”§ Iniciando restauraciÃ³n del botÃ³n...');

      try {
        // Limpiar timeout si existe
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
          console.log('â° Timeout limpiado');
        }

        // Restaurar estado del botÃ³n
        btnEnvio.disabled = false;
        btnEnvio.innerHTML = iconoOriginal;
        procesando = false;

        // Verificar que se restaurÃ³ correctamente
        const estadoRestaurado = {
          disabled: btnEnvio.disabled,
          innerHTML: btnEnvio.innerHTML,
          procesando: procesando
        };

        console.log('ðŸ“Š Estado despuÃ©s de restauraciÃ³n:', estadoRestaurado);
        console.log('âœ… BotÃ³n restaurado correctamente');
      } catch (error) {
        console.error('âŒ Error al restaurar botÃ³n:', error);

        // Forzar restauraciÃ³n en caso de error
        try {
          btnEnvio.disabled = false;
          btnEnvio.innerHTML = '<i class="fas fa-check"></i> Registrar EnvÃ­o';
          console.log('ðŸ”„ RestauraciÃ³n forzada completada');
        } catch (forceError) {
          console.error('âŒ Error crÃ­tico en restauraciÃ³n forzada:', forceError);
        }
      }
    };

    // Validar datos bÃ¡sicos
    const registroId = document.getElementById('numeroRegistro')?.value;
    console.log('ðŸ“‹ NÃºmero de registro:', registroId);
    if (!registroId) {
      console.error('âŒ No se encontrÃ³ nÃºmero de registro');
      if (typeof window.showNotification === 'function') {
        window.showNotification('Error: No se encontrÃ³ nÃºmero de registro', 'error');
      } else {
        alert('Error: No se encontrÃ³ nÃºmero de registro');
      }
      return;
    }

    // Mostrar indicador de carga SIN deshabilitar el botÃ³n
    const iconoOriginal = btnEnvio.innerHTML;
    btnEnvio.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    console.log('ðŸ”„ BotÃ³n configurado en modo procesando (sin deshabilitar)');

    // Ejecutar guardado inmediatamente
    try {
      console.log('ðŸ’¾ Ejecutando guardado de datos...');

      // Verificar que Firebase estÃ© disponible antes de intentar guardar
      if (!window.firebaseRepos?.trafico) {
        console.warn('âš ï¸ Firebase no estÃ¡ disponible aÃºn. Esperando inicializaciÃ³n...');
        // Esperar hasta 3 segundos para que Firebase se inicialice
        let intentos = 0;
        const maxIntentos = 20; // 20 intentos de 500ms = 10 segundos

        while (!window.firebaseRepos?.trafico && intentos < maxIntentos) {
          await new Promise(resolve => setTimeout(resolve, 500));
          intentos++;
          console.log(`â³ Esperando Firebase... (intento ${intentos}/${maxIntentos})`);
        }

        // Intentar inicializar el repositorio si está disponible pero no inicializado
        if (
          !window.firebaseRepos?.trafico &&
          window.firebaseRepos &&
          typeof window.firebaseRepos.trafico?.init === 'function'
        ) {
          try {
            console.log('🔄 Intentando inicializar repositorio de tráfico...');
            await window.firebaseRepos.trafico.init();
            if (window.firebaseRepos.trafico.db && window.firebaseRepos.trafico.tenantId) {
              console.log('✅ Repositorio de tráfico inicializado exitosamente');
            }
          } catch (error) {
            console.error('❌ Error inicializando repositorio de tráfico:', error);
          }
        }

        // Si aún no está disponible después de todos los intentos, usar fallback a DataPersistence
        if (
          !window.firebaseRepos?.trafico ||
          !window.firebaseRepos.trafico.db ||
          !window.firebaseRepos.trafico.tenantId
        ) {
          console.warn(
            '⚠️ Firebase no está disponible después de esperar. Usando fallback a DataPersistence.'
          );
          console.warn(
            '⚠️ Los datos se guardarán localmente y se sincronizarán cuando Firebase esté disponible.'
          );
          // No lanzar error, permitir que continue con el fallback en saveTraficoData
        }
      }

      // Asegurar que saveTraficoData esté disponible
      if (typeof window.saveTraficoData !== 'function') {
        console.error('❌ saveTraficoData no está disponible');
        throw new Error('saveTraficoData no está disponible. Por favor recarga la página.');
      }

      const guardadoExitoso = await window.saveTraficoData();
      console.log('ðŸ“Š Resultado del guardado:', guardadoExitoso);

      if (guardadoExitoso) {
        console.log('✅ Datos guardados exitosamente');

        // Marcar módulo de tráfico como completado en sincronización
        const registroId = document.getElementById('numeroRegistro')?.value;
        if (registroId && typeof window.sincronizacionUtils !== 'undefined') {
          const sincronizacionResultado = window.sincronizacionUtils.marcarCompletado(
            registroId,
            'trafico'
          );
          console.log('🔄 Sincronización de tráfico:', sincronizacionResultado);

          // Actualizar contadores del buzón
          setTimeout(() => {
            window.sincronizacionUtils.actualizarContadoresBuzon();
          }, 500);
        } else {
          console.warn(
            '⚠️ No se pudo marcar tráfico como completado - registroId:',
            registroId,
            'sincronizacionUtils:',
            typeof window.sincronizacionUtils
          );
        }

        // Recargar la lista de registros después de un breve delay para asegurar que Firebase haya guardado
        console.log('🔄 Esperando confirmación de guardado antes de recargar lista...');
        setTimeout(async () => {
          // Esperar un poco más para asegurar que Firebase haya completado el guardado
          await new Promise(resolve => setTimeout(resolve, 1000));

          console.log('🔄 Recargando lista de registros...');
          if (typeof window.cargarRegistrosTraficoConFiltro === 'function') {
            console.log('📊 Recargando registros con filtro...');
            try {
              await window.cargarRegistrosTraficoConFiltro();
              console.log('✅ Lista de registros recargada');
            } catch (error) {
              console.error('❌ Error recargando registros:', error);
              // Si falla, recargar la página completa
              console.log('🔄 Recargando página completa como fallback...');
              location.reload();
            }
          } else if (typeof window.cargarRegistrosTrafico === 'function') {
            console.log('📊 Recargando registros...');
            try {
              await window.cargarRegistrosTrafico();
              console.log('✅ Lista de registros recargada');
            } catch (error) {
              console.error('❌ Error recargando registros:', error);
              // Si falla, recargar la página completa
              console.log('🔄 Recargando página completa como fallback...');
              location.reload();
            }
          } else {
            console.warn(
              '⚠️ No se encontró función para recargar registros, recargando página completa...'
            );
            location.reload();
          }
        }, 1500);

        // Mostrar mensaje de éxito
        if (typeof window.showNotification === 'function') {
          window.showNotification('Envío registrado correctamente', 'success');
        } else {
          alert('Envío registrado correctamente');
        }

        // Limpiar formulario después del guardado exitoso
        if (typeof limpiarFormularioTrafico === 'function') {
          limpiarFormularioTrafico();
        }

        // Mostrar mensaje visible en pantalla
        const mensajeExito = document.createElement('div');
        mensajeExito.className =
          'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
        mensajeExito.style.zIndex = '9999';
        mensajeExito.style.maxWidth = '600px';
        mensajeExito.innerHTML =
          '<strong>✅ Envío registrado correctamente</strong><button type="button" class="btn-close" data-bs-dismiss="alert"></button><div class="mt-2"><small>La lista se actualizará automáticamente.</small></div>';
        document.body.appendChild(mensajeExito);
        setTimeout(() => {
          if (mensajeExito.parentNode) {
            mensajeExito.remove();
          }
        }, 5000);

        // Esperar a que Firebase estÃ© completamente inicializado antes de recargar
        console.log('â³ Esperando a que Firebase termine de guardar antes de recargar...');

        // Esperar a que el repositorio estÃ© completamente listo
        if (window.__firebaseReposReady) {
          try {
            await window.__firebaseReposReady;
            console.log('âœ… Firebase estÃ¡ completamente inicializado');
          } catch (e) {
            console.warn('âš ï¸ Error esperando __firebaseReposReady:', e);
          }
        }

        // Esperar un poco mÃ¡s para asegurar que el guardado se complete completamente
        console.log('⏳ Esperando confirmación final de guardado...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verificar que el repositorio estÃ© completamente inicializado
        const repo = window.firebaseRepos?.trafico;
        if (repo) {
          let intentosVerificacion = 0;
          while ((!repo.db || !repo.tenantId) && intentosVerificacion < 5) {
            await new Promise(resolve => setTimeout(resolve, 200));
            intentosVerificacion++;
            console.log(`â³ Verificando repositorio... (${intentosVerificacion}/5)`);
          }
        }

        console.log('âœ… Todo listo, recargando pÃ¡gina...');

        // Recargar la pÃ¡gina automÃ¡ticamente como F5
        setTimeout(() => {
          try {
            // Intentar una recarga suave primero
            if (typeof window.initializeInventory === 'function') {
              // Si hay inicializadores de mÃ³dulo, puedes llamarlos antes
              console.log('â™»ï¸ Reinicializando mÃ³dulos antes de recargar...');
            }
          } catch (e) {
            // Ignorar error intencionalmente
          }
          // Recargar la página DESPUÉS de que todo esté guardado
          console.log('🔄 Recargando página ahora que todo está guardado...');
          location.reload();
        }, 1500);
      } else {
        throw new Error('Error al guardar los datos');
      }
    } catch (error) {
      console.error('âŒ Error en el guardado:', error);

      // Mostrar mensaje de error visible
      const mensajeError = document.createElement('div');
      mensajeError.className =
        'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
      mensajeError.style.zIndex = '9999';
      mensajeError.style.maxWidth = '600px';
      mensajeError.innerHTML = `<strong>❌ Error al guardar</strong><button type="button" class="btn-close" data-bs-dismiss="alert"></button><div class="mt-2"><p>${error.message}</p><small>Revisa la consola (F12) para más detalles.</small></div>`;
      document.body.appendChild(mensajeError);
      setTimeout(() => {
        if (mensajeError.parentNode) {
          mensajeError.remove();
        }
      }, 20000);

      // También mostrar notificación
      if (typeof window.showNotification === 'function') {
        window.showNotification(`Error: ${error.message}`, 'error');
      } else {
        alert(`Error: ${error.message}\n\nRevisa la consola (F12) para más detalles.`);
      }
    } finally {
      // Restaurar botÃ³n inmediatamente
      console.log('ðŸ”„ Restaurando botÃ³n...');
      btnEnvio.innerHTML = iconoOriginal;
      btnEnvio.disabled = false;
      console.log('✅ Botón restaurado correctamente');
    }
  };

  // FunciÃ³n para monitorear el estado del botÃ³n
  window.monitorearBoton = function () {
    console.log('ðŸ‘ï¸ Iniciando monitoreo del botÃ³n...');

    const btnEnvio = document.getElementById('btnRegistrarEnvio');
    if (!btnEnvio) {
      console.error('âŒ No se encontrÃ³ el botÃ³n de envÃ­o');
      return;
    }

    // Monitorear cambios en el botÃ³n
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
          console.log('ðŸ”„ BotÃ³n disabled cambiÃ³:', btnEnvio.disabled);
        }
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          console.log('ðŸ”„ Contenido del botÃ³n cambiÃ³:', btnEnvio.innerHTML);
        }
      });
    });

    // Observar cambios en el botÃ³n
    observer.observe(btnEnvio, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });

    console.log('âœ… Monitoreo iniciado. Revisa la consola para cambios.');

    // Detener monitoreo despuÃ©s de 30 segundos
    setTimeout(() => {
      observer.disconnect();
      console.log('â° Monitoreo detenido despuÃ©s de 30 segundos');
    }, 30000);
  };

  // FunciÃ³n para verificar el estado del botÃ³n
  window.verificarEstadoBoton = function () {
    console.log('ðŸ” Verificando estado del botÃ³n...');

    const btnEnvio = document.getElementById('btnRegistrarEnvio');
    if (!btnEnvio) {
      console.error('âŒ No se encontrÃ³ el botÃ³n de envÃ­o');
      return;
    }

    const estado = {
      disabled: btnEnvio.disabled,
      innerHTML: btnEnvio.innerHTML,
      incluyeProcesando: btnEnvio.innerHTML.includes('Procesando'),
      incluyeSpinner: btnEnvio.innerHTML.includes('fa-spinner'),
      clases: Array.from(btnEnvio.classList),
      estilos: {
        display: btnEnvio.style.display,
        opacity: btnEnvio.style.opacity,
        pointerEvents: btnEnvio.style.pointerEvents
      }
    };

    console.log('ðŸ“Š Estado del botÃ³n:', estado);

    // Verificar timeouts pendientes
    const timeoutsPendientes = 0;
    for (let i = 1; i < 10000; i++) {
      if (window.setTimeout.toString().includes('native code')) {
        // No podemos verificar timeouts pendientes de esta manera
        break;
      }
    }

    console.log('â° Timeouts pendientes:', timeoutsPendientes);

    // Mostrar resumen
    const mensaje = `Estado del BotÃ³n:
- Deshabilitado: ${estado.disabled ? 'SÃ­' : 'No'}
- Contenido: ${estado.innerHTML}
- Procesando: ${estado.incluyeProcesando ? 'SÃ­' : 'No'}
- Spinner: ${estado.incluyeSpinner ? 'SÃ­' : 'No'}
- Clases: ${estado.clases.join(', ')}`;

    console.log('ðŸ“‹ Resumen:', mensaje);
    alert(mensaje);

    return estado;
  };

  // FunciÃ³n para limpiar el formulario de trÃ¡fico (alias para compatibilidad)
  // ===========================================
  // FUNCIONES MOVIDAS A: assets/scripts/trafico/form-utils.js
  // ===========================================
  // Las funciones clearCurrentForm y limpiarFormularioTrafico ahora estÃ¡n en el archivo externo
  /*
    window.clearCurrentForm = function() {
        window.limpiarFormularioTrafico();
    };

    window.limpiarFormularioTrafico = function() {
        console.log('ðŸ§¹ Limpiando formulario de trÃ¡fico...');

        try {
            // Obtener el formulario
            const formulario = document.querySelector('form');
            if (!formulario) {
                console.warn('âš ï¸ No se encontrÃ³ el formulario');
                return;
            }

            // Limpiar todos los campos de entrada
            const inputs = formulario.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                // Limpiar valor
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }

                // Limpiar clases CSS de validaciÃ³n de Bootstrap
                input.classList.remove('is-valid', 'is-invalid', 'was-validated', 'form-control', 'form-select');

                // Limpiar atributos de validaciÃ³n
                input.removeAttribute('aria-invalid');
                input.removeAttribute('aria-describedby');

                // Limpiar estilos inline que puedan causar color verde
                input.style.borderColor = '';
                input.style.backgroundColor = '';
                input.style.color = '';

                // Restaurar clases base si es necesario
                if (input.tagName === 'INPUT' && input.type !== 'checkbox' && input.type !== 'radio') {
                    input.classList.add('form-control');
                } else if (input.tagName === 'SELECT') {
                    input.classList.add('form-select');
                }
            });

            // Limpiar clases de validaciÃ³n del formulario
            formulario.classList.remove('was-validated');

            // Limpiar mensajes de validaciÃ³n
            const feedbackElements = formulario.querySelectorAll('.valid-feedback, .invalid-feedback');
            feedbackElements.forEach(element => {
                element.style.display = 'none';
            });

            // Limpiar el nÃºmero de registro (mantenerlo para continuidad)
            const numeroRegistro = document.getElementById('numeroRegistro');
            if (numeroRegistro) {
                // No limpiar el nÃºmero de registro, mantenerlo
                console.log('ðŸ“‹ Manteniendo nÃºmero de registro:', numeroRegistro.value);
            }

            console.log('âœ… Formulario de trÃ¡fico limpiado correctamente');

        } catch (error) {
            console.error('âŒ Error al limpiar formulario:', error);
        }
    };
    */

  // FunciÃ³n para forzar restauraciÃ³n del botÃ³n
  window.forzarRestauracionBoton = function () {
    console.log('ðŸ”§ Forzando restauraciÃ³n del botÃ³n...');

    const btnEnvio = document.getElementById('btnRegistrarEnvio');
    if (!btnEnvio) {
      console.error('âŒ No se encontrÃ³ el botÃ³n de envÃ­o');
      alert('Error: No se encontrÃ³ el botÃ³n de envÃ­o');
      return;
    }

    // Restaurar botÃ³n
    btnEnvio.disabled = false;
    btnEnvio.innerHTML = '<i class="fas fa-check"></i> Registrar EnvÃ­o';

    // Limpiar timeouts
    for (let i = 1; i < 10000; i++) {
      clearTimeout(i);
    }

    console.log('âœ… BotÃ³n restaurado y timeouts limpiados');
    alert('âœ… BotÃ³n restaurado correctamente');
  };

  // FunciÃ³n para diagnosticar el botÃ³n de trÃ¡fico
  window.diagnosticarBotonTrafico = function () {
    console.log('ðŸ” Diagnosticando botÃ³n de trÃ¡fico...');

    const btnEnvio = document.getElementById('btnRegistrarEnvio');
    if (!btnEnvio) {
      console.error('âŒ No se encontrÃ³ el botÃ³n de envÃ­o');
      alert('Error: No se encontrÃ³ el botÃ³n de envÃ­o');
      return;
    }

    console.log('ðŸ“Š Estado del botÃ³n:', {
      disabled: btnEnvio.disabled,
      innerHTML: btnEnvio.innerHTML,
      type: btnEnvio.type,
      id: btnEnvio.id
    });

    // Verificar event listeners
    const formulario = document.querySelector('form');
    if (formulario) {
      console.log('ðŸ“‹ Formulario encontrado:', formulario);
    } else {
      console.error('âŒ No se encontrÃ³ el formulario');
    }

    // Verificar funciÃ³n saveTraficoData
    if (typeof window.saveTraficoData === 'function') {
      console.log('âœ… saveTraficoData estÃ¡ disponible');
    } else {
      console.error('âŒ saveTraficoData no estÃ¡ disponible');
    }

    // Verificar funciÃ³n manejarEnvioFormulario
    if (typeof window.manejarEnvioFormulario === 'function') {
      console.log('âœ… manejarEnvioFormulario estÃ¡ disponible');
    } else {
      console.error('âŒ manejarEnvioFormulario no estÃ¡ disponible');
    }

    // Forzar restauraciÃ³n del botÃ³n
    btnEnvio.disabled = false;
    btnEnvio.innerHTML = '<i class="fas fa-check"></i> Registrar EnvÃ­o';
    console.log('âœ… BotÃ³n restaurado manualmente');

    // Limpiar cualquier timeout pendiente
    const _timeouts = [];
    for (let i = 1; i < 10000; i++) {
      clearTimeout(i);
    }
    console.log('âœ… Timeouts limpiados');

    alert('DiagnÃ³stico completado. Revisa la consola para mÃ¡s detalles.');
  };

  // FunciÃ³n para limpiar todos los datos del sistema
  window.limpiarTodosLosDatos = async function () {
    console.log('ðŸ—‘ï¸ Limpiando datos operativos del sistema...');

    // Confirmar la acciÃ³n
    const confirmacion = confirm(
      'âš ï¸ ADVERTENCIA: Esta acciÃ³n eliminarÃ¡ TODOS los datos operativos del sistema ERP.\n\nSe eliminarÃ¡:\nâ€¢ Registros de LogÃ­stica\nâ€¢ Facturas\nâ€¢ TrÃ¡fico\nâ€¢ EnvÃ­os\nâ€¢ Cuentas por Pagar\nâ€¢ Cuentas por Cobrar\nâ€¢ TesorerÃ­a\nâ€¢ Diesel\nâ€¢ Mantenimiento\nâ€¢ Inventario\nâ€¢ Datos de ejemplo\n\nSe PRESERVARÃ:\nâ€¢ EconÃ³micos (tractocamiones)\nâ€¢ Operadores\nâ€¢ Clientes\nâ€¢ Proveedores\nâ€¢ Estancias\nâ€¢ Almacenes\nâ€¢ Usuarios\nâ€¢ ConfiguraciÃ³n del sistema\n\nAdemÃ¡s, reiniciarÃ¡ completamente el sistema de numeraciÃ³n a "2500001".\n\nÂ¿EstÃ¡s seguro de que quieres continuar?'
    );

    if (!confirmacion) {
      console.log('âŒ OperaciÃ³n cancelada por el usuario');
      return false;
    }

    try {
      // Lista de claves a ELIMINAR (solo datos operativos)
      const erpKeysToDelete = [
        // LogÃ­stica
        'erp_logistica_registros',
        'erp_logistica_contador',
        'erp_shared_data',
        'erp_logistica',

        // FacturaciÃ³n
        'erp_facturacion_registros',
        'erp_facturacion_contador',

        // TrÃ¡fico
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

        // TesorerÃ­a
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

        // Estados de sincronizaciÃ³n
        'erp_sincronizacion_states',

        // Sistema de numeraciÃ³n
        'registrationNumbers',
        'activeRegistrationNumber'
      ];

      // Lista de claves a PRESERVAR (datos de configuraciÃ³n)
      const erpKeysToPreserve = [
        'erp_economicos', // Tractocamiones
        'erp_operadores', // Operadores
        'erp_operadores_lista', // Lista de operadores
        'erp_clientes', // Clientes
        'erp_proveedores', // Proveedores
        'erp_estancias', // Estancias
        'erp_almacenes', // Almacenes
        'erp_usuarios', // Usuarios
        'erp_config_economicos', // ConfiguraciÃ³n econÃ³micos
        'erp_config_operadores', // ConfiguraciÃ³n operadores
        'erp_config_proveedores', // ConfiguraciÃ³n proveedores
        'erp_config_clientes', // ConfiguraciÃ³n clientes
        'erp_config_estancias', // ConfiguraciÃ³n estancias
        'erp_config_almacenes', // ConfiguraciÃ³n almacenes
        'erp_config_usuarios', // ConfiguraciÃ³n usuarios
        'erp_config_contador', // ConfiguraciÃ³n contador
        'sidebarCollapsed', // Preferencias de interfaz
        'erp_user_preferences', // Preferencias de usuario
        'erpCurrentUser', // Usuario actual
        'erpSession', // SesiÃ³n actual
        'cxp_initialized' // Estado de inicializaciÃ³n
      ];

      // Eliminar solo las claves operativas
      let eliminados = 0;
      erpKeysToDelete.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          eliminados++;
          console.log(`ðŸ—‘ï¸ Eliminado: ${key}`);
        }
      });

      // Limpiar cualquier otra clave que contenga 'erp_' pero no estÃ© en la lista de preservar
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (
          key.startsWith('erp_') &&
          !erpKeysToPreserve.includes(key) &&
          !erpKeysToDelete.includes(key)
        ) {
          localStorage.removeItem(key);
          eliminados++;
          console.log(`ðŸ—‘ï¸ Eliminado adicional: ${key}`);
        }
      });

      // Limpiar historial de nÃºmeros de registro completamente
      console.log('ðŸ”„ Limpiando historial de nÃºmeros de registro...');
      localStorage.removeItem('registrationNumbers');
      localStorage.removeItem('activeRegistrationNumber');
      console.log('âœ… Historial de nÃºmeros de registro limpiado');

      // Limpiar todos los contadores operativos (no restaurar)
      console.log('ðŸ”„ Limpiando contadores operativos...');
      localStorage.removeItem('erp_logistica_contador');
      localStorage.removeItem('erp_facturacion_contador');
      localStorage.removeItem('erp_trafico_contador');
      localStorage.removeItem('erp_cxp_contador');
      localStorage.removeItem('erp_cxc_contador');
      localStorage.removeItem('erp_tesoreria_contador');
      localStorage.removeItem('erp_diesel_contador');
      localStorage.removeItem('erp_mantenimiento_contador');
      localStorage.removeItem('erp_inv_contador');
      console.log('âœ… Contadores operativos limpiados completamente');

      // LIMPIAR DATOS DE FIREBASE
      console.log('ðŸ”¥ Limpiando datos de Firebase...');
      let firebaseDeleted = 0;

      // MÃ©todo 1: Usar repositorios de Firebase si estÃ¡n disponibles
      if (window.firebaseRepos) {
        const reposToClean = [
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

        for (const repoName of reposToClean) {
          if (window.firebaseRepos[repoName]) {
            try {
              console.log(`ðŸ—‘ï¸ Limpiando repositorio ${repoName}...`);
              const repo = window.firebaseRepos[repoName];

              // Asegurar que el repositorio estÃ© inicializado
              let attempts = 0;
              while (attempts < 10 && (!repo.db || !repo.tenantId)) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 200));
                await repo.init();
              }

              if (!repo.db || !repo.tenantId) {
                console.warn(`âš ï¸ No se pudo inicializar el repositorio ${repoName}`);
                continue;
              }

              // Obtener TODOS los documentos directamente desde Firebase (sin filtrar por deleted)
              let allItems = [];
              try {
                if (window.firebaseDb && window.fs && repo.db && repo.tenantId) {
                  // Obtener directamente desde Firebase sin filtro de deleted
                  const collectionRef = window.fs.collection(window.firebaseDb, repoName);
                  const q = window.fs.query(
                    collectionRef,
                    window.fs.where('tenantId', '==', repo.tenantId)
                    // NO filtrar por deleted para obtener TODOS los documentos
                  );
                  const snapshot = await window.fs.getDocs(q);
                  allItems = [];
                  snapshot.forEach(doc => {
                    allItems.push({ id: doc.id, ...doc.data() });
                  });
                  console.log(
                    `  ðŸ“Š Obtenidos ${allItems.length} documentos (incluyendo eliminados) de ${repoName}`
                  );
                } else {
                  // Fallback a mÃ©todos del repositorio
                  if (repo.getAllRegistros) {
                    allItems = await repo.getAllRegistros();
                  } else if (repo.getAll) {
                    allItems = await repo.getAll();
                  } else if (repo.getAllMovimientos) {
                    allItems = await repo.getAllMovimientos();
                  }
                }
              } catch (error) {
                console.warn(`âš ï¸ Error obteniendo registros de ${repoName}:`, error);
                continue;
              }

              console.log(`  ðŸ“Š Encontrados ${allItems.length} documento(s) en ${repoName}`);

              // Eliminar cada registro fÃ­sicamente usando Firebase directo
              for (const item of allItems) {
                try {
                  const itemId = item.id;
                  if (
                    itemId &&
                    window.firebaseDb &&
                    window.fs &&
                    window.fs.deleteDoc &&
                    window.fs.doc
                  ) {
                    // Eliminar fÃ­sicamente el documento usando su ID real
                    const docRef = window.fs.doc(window.firebaseDb, repoName, itemId);
                    await window.fs.deleteDoc(docRef);
                    firebaseDeleted++;
                    console.log(`  ðŸ—‘ï¸ Eliminado fÃ­sicamente: ${repoName}/${itemId}`);
                  } else if (itemId) {
                    // Fallback: intentar con el mÃ©todo delete del repositorio
                    try {
                      await repo.delete(itemId);
                      firebaseDeleted++;
                    } catch (error) {
                      console.warn('âš ï¸ Error con mÃ©todo delete del repositorio:', error);
                    }
                  }
                } catch (error) {
                  console.warn(`âš ï¸ Error eliminando item de ${repoName}:`, error);
                }
              }

              console.log(
                `âœ… Repositorio ${repoName} limpiado: ${allItems.length} documento(s) eliminado(s)`
              );
            } catch (error) {
              console.error(`âŒ Error limpiando repositorio ${repoName}:`, error);
            }
          }
        }

        if (firebaseDeleted > 0) {
          console.log(`âœ… ${firebaseDeleted} documentos eliminados de Firebase`);
          eliminados += firebaseDeleted;
        } else {
          console.log('â„¹ï¸ No se encontraron datos en Firebase para eliminar');
        }
      } else {
        console.warn('âš ï¸ Repositorios de Firebase no disponibles');

        // MÃ©todo 2: Fallback a Firebase directo si los repositorios no estÃ¡n disponibles
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

            for (const collectionName of collections) {
              try {
                console.log(`ðŸ—‘ï¸ Limpiando colecciÃ³n ${collectionName} (mÃ©todo directo)...`);
                const collectionRef = window.fs.collection(window.firebaseDb, collectionName);
                const snapshot = await window.fs.getDocs(collectionRef);

                if (!snapshot || snapshot.empty) {
                  console.log(`  â„¹ï¸ ColecciÃ³n ${collectionName} estÃ¡ vacÃ­a`);
                  continue;
                }

                console.log(
                  `  ðŸ“Š Encontrados ${snapshot.docs.length} documento(s) en ${collectionName}`
                );

                const deletePromises = [];
                snapshot.docs.forEach(doc => {
                  const docRef = window.fs.doc(window.firebaseDb, collectionName, doc.id);
                  deletePromises.push(window.fs.deleteDoc(docRef));
                });

                await Promise.all(deletePromises);
                firebaseDeleted += snapshot.docs.length;
                console.log(
                  `âœ… ColecciÃ³n ${collectionName} limpiada: ${snapshot.docs.length} documento(s) eliminado(s)`
                );
              } catch (collectionError) {
                console.error(`âŒ Error limpiando colecciÃ³n ${collectionName}:`, collectionError);
              }
            }

            if (firebaseDeleted > 0) {
              console.log(
                `âœ… ${firebaseDeleted} documentos eliminados de Firebase (mÃ©todo directo)`
              );
              eliminados += firebaseDeleted;
            }
          } catch (firebaseError) {
            console.error('âŒ Error limpiando Firebase (mÃ©todo directo):', firebaseError);
          }
        }
      }

      // Mostrar resumen de lo que se preservÃ³
      console.log('ðŸ“‹ Datos de configuraciÃ³n preservados:');
      erpKeysToPreserve.forEach(key => {
        if (localStorage.getItem(key)) {
          console.log(`âœ… Preservado: ${key}`);
        }
      });

      // Limpiar formularios actuales
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        form.reset();
      });

      // Limpiar campos especÃ­ficos
      const campos = [
        'numeroRegistro',
        'fechaCreacion',
        'cliente',
        'origen',
        'destino',
        'referencia cliente',
        'tiposervicio',
        'embalajeEspecial',
        'plataforma',
        'mercancia',
        'peso',
        'largo',
        'ancho',
        'fechaEnvio',
        'observacionesLogistica',
        'economico',
        'Placas',
        'permisosct',
        'operadorprincipal',
        'Licencia',
        'operadorsecundario',
        'LugarOrigen',
        'LugarDestino'
      ];

      let camposLimpios = 0;
      campos.forEach(campoId => {
        const elemento = document.getElementById(campoId);
        if (elemento) {
          elemento.value = '';
          camposLimpios++;
        }
      });

      // Actualizar el nÃºmero de registro en el header
      const headerRegistro = document.getElementById('headerRegistrationNumber');
      if (headerRegistro) {
        headerRegistro.textContent = '-';
      }

      // Mostrar resumen
      const mensaje = `âœ… DATOS OPERATIVOS LIMPIADOS EXITOSAMENTE!\n\nðŸ“Š Resumen de la limpieza:\n- Elementos operativos eliminados: ${eliminados}\n- Campos de formulario limpiados: ${camposLimpios}\n\nâœ… Datos de configuraciÃ³n preservados:\nâ€¢ EconÃ³micos (tractocamiones)\nâ€¢ Operadores\nâ€¢ Clientes\nâ€¢ Proveedores\nâ€¢ Estancias\nâ€¢ Almacenes\nâ€¢ Usuarios\n\nðŸŽ¯ El sistema estÃ¡ listo para una prueba de principio a fin.\n\nðŸ“ PrÃ³ximos pasos:\n1. Ve a LogÃ­stica y crea un nuevo registro\n2. Ve a TrÃ¡fico y busca el registro\n3. Ve a FacturaciÃ³n y busca el registro\n4. Verifica que los datos se compartan correctamente`;

      console.log('ðŸ“Š Resumen de limpieza:', {
        eliminados,
        camposLimpios,
        totalKeys: Object.keys(localStorage).length
      });

      alert(mensaje);

      return {
        success: true,
        erpCleared,
        keysRemoved,
        camposLimpios
      };
    } catch (error) {
      console.error('âŒ Error durante la limpieza:', error);
      alert(
        `âŒ Error durante la limpieza: ${error.message}\n\nIntenta refrescar la pÃ¡gina (Ctrl+F5) y vuelve a intentar.`
      );
      return false;
    }
  };

  // FunciÃ³n para verificaciÃ³n periÃ³dica del botÃ³n
  window.iniciarVerificacionPeriodica = function () {
    console.log('â° Iniciando verificaciÃ³n periÃ³dica del botÃ³n...');

    const verificarBoton = () => {
      const btnEnvio = document.getElementById('btnRegistrarEnvio');
      if (!btnEnvio) {
        return;
      }

      // Verificar si estÃ¡ en estado inconsistente
      if (btnEnvio.disabled && btnEnvio.innerHTML.includes('Procesando')) {
        console.warn('âš ï¸ BotÃ³n atascado en procesando, restaurando...');
        btnEnvio.disabled = false;
        btnEnvio.innerHTML = '<i class="fas fa-check"></i> Registrar EnvÃ­o';

        // Limpiar timeouts
        for (let i = 1; i < 10000; i++) {
          clearTimeout(i);
        }
      }
    };

    // Verificar cada 5 segundos
    const intervalId = setInterval(verificarBoton, 5000);

    // Detener despuÃ©s de 5 minutos
    setTimeout(() => {
      clearInterval(intervalId);
      console.log('â° VerificaciÃ³n periÃ³dica detenida');
    }, 300000);

    console.log('âœ… VerificaciÃ³n periÃ³dica iniciada');
  };

  // FunciÃ³n para limpiar el estado del botÃ³n al cargar la pÃ¡gina
  window.limpiarEstadoBoton = function () {
    console.log('ðŸ§¹ Limpiando estado del botÃ³n al cargar...');

    const btnEnvio = document.getElementById('btnRegistrarEnvio');
    if (!btnEnvio) {
      console.warn('âš ï¸ No se encontrÃ³ el botÃ³n de envÃ­o');
      return;
    }

    // Limpiar cualquier timeout pendiente
    for (let i = 1; i < 10000; i++) {
      clearTimeout(i);
    }
  };
})();
