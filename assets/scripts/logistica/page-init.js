/**
 * Inicialización de la Página - logistica.html
 * Maneja la inicialización completa cuando el DOM está listo
 */

(function () {
  'use strict';

  // Cargar lista de clientes y registros cuando el DOM esté listo
  // Usar función inmediata si el DOM ya está listo
  const inicializarPagina = async function () {
    // Marcar como inicializada para evitar ejecuciones múltiples
    if (window.__logisticaInicializada) {
      console.debug('ℹ️ Página ya inicializada, omitiendo...');
      return;
    }
    window.__logisticaInicializada = true;

    // console.log('📄 Inicializando página de logística...');

    // Esperar a que Firebase Auth esté listo
    if (window.__onAuthReady) {
      console.log('⏳ Esperando Firebase Auth...');
      try {
        await window.__onAuthReady;
        console.log('✅ Firebase Auth listo');
      } catch (error) {
        console.warn('⚠️ Error esperando Firebase Auth:', error);
      }
    }

    // Esperar a que los repositorios estén listos
    if (window.__firebaseReposReady) {
      console.log('⏳ Esperando repositorios Firebase...');
      const ready = await window.__firebaseReposReady;
      if (ready) {
        console.log('✅ Repositorios listos');
      } else {
        console.warn('⚠️ Timeout repositorios, usando localStorage');
      }
    } else {
      // __firebaseReposReady puede no estar disponible si los scripts aún se están cargando
      // Esto es normal y no es un error, solo esperamos manualmente
      let intentos = 0;
      while (!window.firebaseRepos?.logistica?.db && intentos < 30) {
        await new Promise(resolve => setTimeout(resolve, 200));
        intentos++;
      }
      if (window.firebaseRepos?.logistica?.db) {
        // console.log('✅ Repositorios listos (carga manual)');
      }
    }

    // CRÍTICO: Esperar a que RegistrationNumberBinding se inicialice antes de actualizar el topbar
    if (
      window.RegistrationNumberBinding &&
      typeof window.RegistrationNumberBinding.init === 'function'
    ) {
      if (!window.RegistrationNumberBinding._isInitialized) {
        console.log('⏳ Esperando inicialización de RegistrationNumberBinding...');
        let bindingAttempts = 0;
        while (!window.RegistrationNumberBinding._isInitialized && bindingAttempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          bindingAttempts++;
          // Intentar inicializar si aún no se ha hecho
          if (!window.RegistrationNumberBinding._isInitialized && bindingAttempts === 1) {
            try {
              await window.RegistrationNumberBinding.init();
            } catch (error) {
              console.warn('⚠️ Error inicializando RegistrationNumberBinding:', error);
            }
          }
        }
        if (window.RegistrationNumberBinding._isInitialized) {
          console.log('✅ RegistrationNumberBinding inicializado');
          // El binding actualizará el topbar automáticamente cuando se inicialice
        } else {
          console.warn('⚠️ RegistrationNumberBinding no se inicializó después de esperar');
        }
      } else {
        console.log('✅ RegistrationNumberBinding ya estaba inicializado');
        // Actualizar el topbar con el número actual del binding
        const currentNumber = window.RegistrationNumberBinding.get();
        if (currentNumber && currentNumber !== '-') {
          if (window.updateHeaderRegistrationNumber) {
            window.updateHeaderRegistrationNumber(currentNumber);
          }
        }
      }
    }

    // console.log('📊 Cargando datos...');

    // Función para cargar clientes con reintentos
    const cargarClientesConReintentos = async () => {
      let intentos = 0;
      const maxIntentos = 20; // Aumentar intentos ya que ahora está en críticos

      while (intentos < maxIntentos) {
        try {
          // Verificar que la función esté disponible
          if (typeof window.loadClientesList !== 'function') {
            if (intentos % 3 === 0) {
              // Log cada 3 intentos para no saturar
              console.log(
                `⏳ Esperando loadClientesList... (intento ${intentos + 1}/${maxIntentos})`
              );
            }
            await new Promise(resolve => setTimeout(resolve, 150));
            intentos++;
            continue;
          }

          // Verificar que Firebase esté listo (opcional, pero preferible)
          const firebaseReady = window.firebaseDb && window.fs;
          if (!firebaseReady && intentos < 10) {
            if (intentos % 3 === 0) {
              console.log(`⏳ Esperando Firebase... (intento ${intentos + 1}/10)`);
            }
            await new Promise(resolve => setTimeout(resolve, 150));
            intentos++;
            continue;
          }

          // Intentar cargar clientes
          console.log('👥 Cargando lista de clientes...');
          await window.loadClientesList();
          console.log('✅ Clientes cargados en el select principal');

          // Cargar clientes en el filtro
          if (typeof window.cargarClientesEnFiltro === 'function') {
            await window.cargarClientesEnFiltro();
            console.log('✅ Clientes cargados en el filtro');
          }

          return; // Éxito, salir del loop
        } catch (error) {
          console.warn(
            `⚠️ Error cargando clientes (intento ${intentos + 1}/${maxIntentos}):`,
            error
          );
          intentos++;
          if (intentos < maxIntentos) {
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            console.error('❌ No se pudieron cargar los clientes después de todos los intentos');
          }
        }
      }
    };

    // Ejecutar carga de clientes
    await cargarClientesConReintentos();

    // Fallback adicional: Verificar después de que todos los módulos secundarios se hayan cargado
    // Esto asegura que se carguen incluso si hubo problemas iniciales
    setTimeout(async () => {
      const campoCliente = document.getElementById('cliente');
      if (!campoCliente) {
        return;
      }

      // Verificar si es select (sistema antiguo) o input (nuevo componente)
      const esSelect = campoCliente.tagName === 'SELECT';
      const esInput = campoCliente.tagName === 'INPUT';

      // Solo verificar si es un select (sistema antiguo)
      // Si es input, el componente searchable-select maneja su propia carga
      if (esSelect && campoCliente.options && campoCliente.options.length <= 1) {
        // Solo tiene la opción por defecto, intentar cargar de nuevo
        console.log('🔄 Reintentando cargar clientes (fallback después de módulos secundarios)...');
        if (typeof window.loadClientesList === 'function') {
          try {
            await window.loadClientesList();
            if (typeof window.cargarClientesEnFiltro === 'function') {
              await window.cargarClientesEnFiltro();
            }
            console.log('✅ Clientes cargados (fallback exitoso)');
          } catch (error) {
            console.warn('⚠️ Error en carga de fallback:', error);
          }
        }
      } else if (esInput) {
        // Para el nuevo componente, solo verificar que haya datos en caché
        if (!window.__clientesCache || Object.keys(window.__clientesCache).length === 0) {
          console.log('🔄 Reintentando cargar clientes para componente searchable-select...');
          if (typeof window.loadClientesList === 'function') {
            try {
              await window.loadClientesList();
              // El componente searchable-select se actualizará automáticamente
              console.log('✅ Clientes cargados en caché (fallback exitoso)');
            } catch (error) {
              console.warn('⚠️ Error en carga de fallback:', error);
            }
          }
        }
      }
    }, 3000); // Esperar 3 segundos para que los módulos secundarios se carguen

    try {
      console.log('🔄 Llamando a cargarRegistrosLogistica...');
      if (typeof window.cargarRegistrosLogistica === 'function') {
        await window.cargarRegistrosLogistica();
        console.log('✅ cargarRegistrosLogistica completado');

        // NO generar un nuevo número aquí - solo verificar que el número activo sea válido
        // El número se generará/actualizará en initializeRegistrationSystem si es necesario
        console.log(
          'ℹ️ Registros cargados. El número de registro se gestionará en initializeRegistrationSystem'
        );

        // Ejecutar auto-corrección de números de registro si está disponible
        if (
          window.diagnosticar2500006 &&
          typeof window.diagnosticar2500006.autoCorregir === 'function'
        ) {
          // Ejecutar en segundo plano sin bloquear
          window.diagnosticar2500006.autoCorregir().catch(err => {
            console.debug('Auto-corrección de números de registro:', err.message);
          });
        }
      } else {
        console.error('❌ window.cargarRegistrosLogistica no es una función');
      }
    } catch (error) {
      console.error('❌ Error cargando registros de logística:', error);
      console.error('❌ Stack:', error.stack);
    }

    // Configurar listener en tiempo real para actualizaciones automáticas
    async function configurarListenerLogistica() {
      try {
        // Esperar a que el repositorio esté inicializado
        let attempts = 0;
        while (
          attempts < 20 &&
          (!window.firebaseRepos ||
            !window.firebaseRepos.logistica ||
            !window.firebaseRepos.logistica.db ||
            !window.firebaseRepos.logistica.tenantId)
        ) {
          attempts++;
          if (attempts % 5 === 0) {
            console.log(`⏳ Esperando repositorio de logística para listener... (${attempts}/20)`);
          }
          await new Promise(resolve => setTimeout(resolve, 500));

          // Intentar inicializar si no está inicializado
          if (
            window.firebaseRepos?.logistica &&
            typeof window.firebaseRepos.logistica.init === 'function' &&
            !window.firebaseRepos.logistica.db
          ) {
            try {
              await window.firebaseRepos.logistica.init();
            } catch (initError) {
              // Continuar esperando
            }
          }
        }

        if (
          window.firebaseRepos &&
          window.firebaseRepos.logistica &&
          window.firebaseRepos.logistica.db &&
          window.firebaseRepos.logistica.tenantId
        ) {
          console.log('📡 Configurando listener en tiempo real para Logística...');

          // Limpiar listener anterior si existe
          if (
            window.__logisticaUnsubscribe &&
            typeof window.__logisticaUnsubscribe === 'function'
          ) {
            window.__logisticaUnsubscribe();
          }

          // Configurar nuevo listener
          window.__logisticaUnsubscribe = await window.firebaseRepos.logistica.subscribe(
            async items => {
              console.log(
                `📡 Actualización en tiempo real de Logística: ${items.length} registros recibidos`
              );

              // Filtrar solo registros (tipo === 'registro' o sin tipo)
              const registros = items.filter(item => item.tipo === 'registro' || !item.tipo);

              console.log(`📋 Registros de logística filtrados: ${registros.length}`);

              // Recargar registros usando la función existente
              if (typeof window.cargarRegistrosLogistica === 'function') {
                // Actualizar datos globales
                window._registrosLogisticaCompletos = registros;

                // Recargar la tabla
                await window.cargarRegistrosLogistica();

                console.log(
                  `✅ Tabla de Logística actualizada automáticamente: ${registros.length} registros`
                );
              } else {
                console.warn('⚠️ window.cargarRegistrosLogistica no está disponible');
              }
            }
          );

          console.log('✅ Listener de Logística configurado correctamente');
        } else {
          console.warn('⚠️ Repositorio de Logística no disponible para listener');
        }
      } catch (error) {
        console.error('❌ Error configurando listener de Logística:', error);
        // Reintentar después de un tiempo
        setTimeout(() => configurarListenerLogistica(), 5000);
      }
    }

    // Configurar listener después de un breve delay para asegurar que todo esté listo
    setTimeout(() => {
      configurarListenerLogistica();
    }, 3000);

    // NO inicializar aquí - main.js ya lo hace en DOMContentLoaded
    // Solo verificar estado
    const numeroRegistroInputCheck = document.getElementById('numeroRegistro');
    if (numeroRegistroInputCheck) {
      const currentValue = numeroRegistroInputCheck.value
        ? numeroRegistroInputCheck.value.trim()
        : '';
      if (currentValue && /^25\d{5}$/.test(currentValue)) {
        console.log(`✅ Campo ya tiene número válido en logística: ${currentValue}`);
      } else {
        console.log(
          'ℹ️ Campo de número de registro vacío en logística (se generará desde main.js)'
        );
      }
    }

    // Manejar el submit del formulario de logística
    const form = document.querySelector('form.needs-validation');
    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        e.stopPropagation();

        // Obtener el botón de submit
        const submitBtn = form.querySelector('button[type="submit"]');
        let isProcessing = false;

        // Verificar si ya se está procesando para evitar doble clic
        if (submitBtn && submitBtn.disabled) {
          console.log('⚠️ El formulario ya se está procesando, ignorando clic adicional');
          return;
        }

        // Validar formulario con Bootstrap
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        // Deshabilitar botón y mostrar estado de procesamiento
        let originalBtnContent = '';
        if (submitBtn) {
          originalBtnContent = submitBtn.innerHTML;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
          submitBtn.disabled = true;
          isProcessing = true;
        }

        // Guardar datos
        console.log('💾 Guardando datos de logística...');
        try {
          const saved = await window.saveLogisticaData();
          if (saved) {
            console.log('✅ Datos guardados exitosamente');

            // Limpiar formulario
            if (typeof window.clearCurrentForm === 'function') {
              window.clearCurrentForm();
              console.log('✅ Formulario limpiado');
            } else {
              // Fallback: limpiar manualmente
              form.reset();
              form.classList.remove('was-validated');
              console.log('✅ Formulario limpiado (fallback)');
            }

            // Esperar un momento para que se complete el proceso de limpieza
            await new Promise(resolve => setTimeout(resolve, 500));

            // Recargar la página normalmente (F5) - más rápido y eficiente
            // Los datos ya están guardados en localStorage y Firebase, no necesitamos forzar recarga sin caché
            console.log('🔄 Recargando página (F5)...');
            window.location.reload();
          } else {
            console.error('❌ Error al guardar datos');
            // Restaurar botón en caso de error
            if (submitBtn && isProcessing) {
              submitBtn.innerHTML = originalBtnContent;
              submitBtn.disabled = false;
              isProcessing = false;
            }
            alert('Error al guardar los datos. Por favor, intente nuevamente.');
          }
        } catch (error) {
          console.error('❌ Error en el proceso de guardado:', error);
          // Restaurar botón en caso de error
          if (submitBtn && isProcessing) {
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
            isProcessing = false;
          }
          alert(`Error al guardar los datos: ${error.message || 'Error desconocido'}`);
        }
      });
    } else {
      console.warn('⚠️ Formulario no encontrado');
    }
  };

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarPagina);
  } else {
    // DOM ya está listo, ejecutar después de un pequeño delay
    // para asegurar que otros scripts se hayan cargado
    setTimeout(() => {
      inicializarPagina();
    }, 100);
  }

  // También intentar ejecutar después de que los módulos críticos se hayan cargado
  // Esto es un fallback adicional
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Verificar si ya se ejecutó
      if (!window.__logisticaInicializada) {
        console.log('🔄 Ejecutando inicialización desde evento load (fallback)...');
        window.__logisticaInicializada = true;
        inicializarPagina();
      }
    }, 500);
  });
})();
