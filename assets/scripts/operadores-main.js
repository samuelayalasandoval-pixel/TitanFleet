// Helper para inicializar ERPState (evita duplicación)
function inicializarERPState() {
  if (!window.ERPState) {
    window.ERPState = {
      _cache: {},
      _loading: {},
      _highlightedIndex: {},
      getCache(key) {
        return this._cache[key] || [];
      },
      setCache(key, value) {
        this._cache[key] = value;
      },
      isLoading(key) {
        // Manejar cualquier clave de loading sin warnings
        return this._loading[key] || false;
      },
      setLoading(key, value) {
        // Permitir cualquier clave de loading sin warnings
        this._loading[key] = value;
      },
      getHighlightedIndex(key) {
        return this._highlightedIndex[key] !== undefined ? this._highlightedIndex[key] : -1;
      },
      setHighlightedIndex(key, value) {
        this._highlightedIndex[key] = value;
      },
      clearSubscription(_key) {}
    };
  }
}

// Inicializar ERPState al inicio
inicializarERPState();

// Función para permitir solo números
function soloNumeros(event) {
  const charCode = event.which ? event.which : event.keyCode;
  // Permitir: backspace (8), delete (46), tab (9), escape (27), enter (13), flechas (37-40)
  if (
    charCode === 8 ||
    charCode === 46 ||
    charCode === 9 ||
    charCode === 27 ||
    charCode === 13 ||
    (charCode >= 37 && charCode <= 40)
  ) {
    return true;
  }
  // Solo permitir números (48-57)
  if (charCode >= 48 && charCode <= 57) {
    return true;
  }
  // Bloquear cualquier otro carácter
  event.preventDefault();
  return false;
}

// Función para validar cuando se pega texto
function validarPasteNumeroRegistro(event, input) {
  event.preventDefault();
  const textoPegado = (event.clipboardData || window.clipboardData).getData('text');
  // Filtrar solo números
  const soloNumeros = textoPegado.replace(/\D/g, '');
  // Limitar a 7 caracteres
  const valorLimitado = soloNumeros.substring(0, 7);
  input.value = valorLimitado;
  // Validar el valor pegado
  validarNumeroRegistro(input, input.id);
}

// Función para validar número de registro (cualquier combinación de 7 dígitos numéricos)
function validarNumeroRegistro(input, _fieldId) {
  const valor = input.value.trim();
  const patron = /^[0-9]{7}$/;

  // Asegurar que solo contenga números
  const soloNumeros = valor.replace(/\D/g, '');
  if (valor !== soloNumeros) {
    input.value = soloNumeros;
  }

  // Limitar a 7 caracteres
  if (input.value.length > 7) {
    input.value = input.value.substring(0, 7);
  }

  const valorFinal = input.value;

  // Validar formato - DEBE tener exactamente 7 dígitos numéricos
  if (valorFinal.length === 7) {
    if (patron.test(valorFinal)) {
      input.setCustomValidity('');
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
    } else {
      input.setCustomValidity('El número de registro debe tener exactamente 7 dígitos numéricos');
      input.classList.remove('is-valid');
      input.classList.add('is-invalid');
    }
  } else if (valorFinal.length > 0) {
    input.setCustomValidity('El número de registro debe tener exactamente 7 dígitos');
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
  } else {
    // Campo vacío - requerido, así que es inválido
    input.setCustomValidity(
      'Este campo es obligatorio y debe tener exactamente 7 dígitos numéricos'
    );
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
  }
}

// Exponer funciones globalmente
window.validarNumeroRegistro = validarNumeroRegistro;
window.soloNumeros = soloNumeros;
window.validarPasteNumeroRegistro = validarPasteNumeroRegistro;

// Sidebar toggle con persistencia
// Restaurar estado INMEDIATAMENTE antes de que cualquier otro código se ejecute
let isSidebarCollapsed = false;

// Función para restaurar el estado del sidebar (ejecutar inmediatamente)
function restoreSidebarState() {
  const savedState = localStorage.getItem('sidebarCollapsed');
  const shouldBeCollapsed = savedState === 'true';
  isSidebarCollapsed = shouldBeCollapsed;

  // Aplicar clases inmediatamente si los elementos existen
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');

  if (sidebar && mainContent) {
    if (shouldBeCollapsed) {
      sidebar.classList.add('collapsed');
      mainContent.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      mainContent.classList.remove('sidebar-collapsed');
    }
    return true; // Elementos encontrados y estado aplicado
  }
  return false; // Elementos no encontrados aún
}

// Intentar restaurar inmediatamente (si el DOM ya está listo)
if (document.readyState === 'loading') {
  // Si aún está cargando, esperar al DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    restoreSidebarState();
    // Verificar nuevamente después de pequeños delays para asegurar que se mantenga
    setTimeout(restoreSidebarState, 10);
    setTimeout(restoreSidebarState, 100);
  });
} else {
  // Si ya está listo, restaurar inmediatamente
  restoreSidebarState();
  // Verificar nuevamente después de pequeños delays
  setTimeout(restoreSidebarState, 10);
  setTimeout(restoreSidebarState, 100);
}

// También ejecutar en caso de que los elementos se creen después
setTimeout(restoreSidebarState, 0);

// Función para alternar el sidebar
function toggleSidebar() {
  isSidebarCollapsed = !isSidebarCollapsed;

  if (isSidebarCollapsed) {
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('mainContent').classList.add('sidebar-collapsed');
  } else {
    document.getElementById('sidebar').classList.remove('collapsed');
    document.getElementById('mainContent').classList.remove('sidebar-collapsed');
  }

  // Guardar estado en localStorage
  localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
}

// Función para cerrar el sidebar
function closeSidebar() {
  isSidebarCollapsed = true;
  document.getElementById('sidebar').classList.add('collapsed');
  document.getElementById('mainContent').classList.add('sidebar-collapsed');

  // Guardar estado en localStorage
  localStorage.setItem('sidebarCollapsed', isSidebarCollapsed);
}

// Event listeners - esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar estado una vez más por si acaso
  restoreSidebarState();

  // Verificar periódicamente que el estado se mantenga (solo por un tiempo limitado)
  let checkCount = 0;
  const maxChecks = 10;
  const checkInterval = setInterval(() => {
    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      return;
    }
    const savedState = localStorage.getItem('sidebarCollapsed');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');

    if (sidebar && mainContent && savedState === 'true') {
      // Si debería estar contraído pero no lo está, corregirlo
      if (!sidebar.classList.contains('collapsed')) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
      }
    }
    checkCount++;
  }, 50);

  // Configurar event listeners
  const toggleBtn = document.getElementById('toggleSidebar');
  const closeBtn = document.getElementById('closeSidebar');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        // En móviles, solo mostrar/ocultar
        document.getElementById('sidebar').classList.toggle('show');
      } else {
        // En desktop, alternar collapsed
        toggleSidebar();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('fechaGasto').value = today;
  document.getElementById('fechaIncidencia').value = today;

  // Load initial data
  // Esperar un poco para que configuracionManager esté listo
  setTimeout(() => {
    if (typeof window.cargarOperadores === 'function') {
      window.cargarOperadores();
    } else {
      console.warn('⚠️ Función cargarOperadores no está disponible');
    }
  }, 500);
  // Esperar un poco para que configuracionManager esté listo
  setTimeout(() => {
    if (typeof window.cargarTractocamiones === 'function') {
      window.cargarTractocamiones();
    } else {
      console.warn('⚠️ Función cargarTractocamiones no está disponible');
    }
  }, 500);
  // Nota: La carga automática de gastos e incidencias se ejecuta fuera del DOMContentLoaded
  // (ver código después de este bloque)

  // Suscribirse a cambios en tiempo real de incidencias (después de que los repositorios estén listos)
  (async () => {
    // Esperar a que los repositorios estén listos
    let attempts = 0;
    while (attempts < 20 && (!window.firebaseRepos || !window.firebaseRepos.operadores)) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (window.firebaseRepos && window.firebaseRepos.operadores) {
      try {
        console.log('📡 Suscribiéndose a cambios en tiempo real de incidencias...');
        const unsubscribe = window.firebaseRepos.operadores.subscribe(async items => {
          // Filtrar solo incidencias
          const incidencias = items.filter(item => item.tipo === 'incidencia');

          // Si Firebase está completamente vacío, verificar y sincronizar localStorage
          // NO restaurar desde localStorage si se limpiaron los datos operativos
          const datosLimpios = localStorage.getItem('datos_operativos_limpiados');
          if (items.length === 0) {
            console.log('📡 Firebase está vacío para operadores. Verificando sincronización...');

            // Verificar si Firebase está realmente vacío
            try {
              const firebaseData = await window.firebaseRepos.operadores.getAll();
              const incidenciasFirebaseVerificadas = firebaseData.filter(
                item => item.tipo === 'incidencia'
              );

              if (incidenciasFirebaseVerificadas.length === 0) {
                console.log(
                  '✅ Firebase confirmado vacío. Sincronizando localStorage con Firebase (vacío).'
                );
                localStorage.setItem('erp_operadores_incidencias', JSON.stringify([]));
                console.log('🗑️ Firebase está vacío para operadores. localStorage limpiado.');

                // Recargar la tabla
                if (typeof window.cargarIncidencias === 'function') {
                  window.cargarIncidencias();
                }
                return;
              }
              console.log(
                '⚠️ Firebase no está vacío, hay',
                incidenciasFirebaseVerificadas.length,
                'incidencias. Continuando con actualización normal.'
              );
              // Continuar con el flujo normal usando los datos verificados
              console.log(
                '📡 Actualización en tiempo real: incidencias recibidas:',
                incidenciasFirebaseVerificadas.length
              );
              localStorage.setItem(
                'erp_operadores_incidencias',
                JSON.stringify(incidenciasFirebaseVerificadas)
              );
              if (typeof window.cargarIncidencias === 'function') {
                window.cargarIncidencias();
              }
              return;
            } catch (error) {
              console.warn('⚠️ Error verificando Firebase:', error);
              // Continuar con el flujo normal
            }
          }

          // Verificar flag antes de actualizar
          if (datosLimpios === 'true') {
            console.log(
              '⚠️ Datos operativos fueron limpiados. Usando solo Firebase (no se restaurará desde localStorage).'
            );
          }

          if (incidencias.length > 0 || items.length === 0) {
            console.log(
              '📡 Actualización en tiempo real: incidencias recibidas:',
              incidencias.length
            );

            // Sincronizar con localStorage
            localStorage.setItem('erp_operadores_incidencias', JSON.stringify(incidencias));

            // Recargar la tabla
            if (typeof window.cargarIncidencias === 'function') {
              window.cargarIncidencias();
            }
          }
        });

        // Guardar función de desuscripción
        window.__operadoresIncidenciasUnsubscribe = unsubscribe;
        console.log('✅ Suscripción a cambios en tiempo real de incidencias configurada');
      } catch (error) {
        console.warn('⚠️ Error configurando suscripción en tiempo real de incidencias:', error);
      }
    }
  })();

  // Add form event listeners
  const gastosForm = document.getElementById('gastosForm');
  console.log(
    '🔍 [GASTOS] Buscando formulario gastosForm:',
    gastosForm ? '✅ Encontrado' : '❌ No encontrado'
  );

  if (gastosForm) {
    // Prevenir submit del formulario
    gastosForm.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🛑 Submit del formulario de gastos prevenido');
      return false;
    });

    // Usar delegación de eventos para el botón (más robusto)
    gastosForm.addEventListener('click', e => {
      const { target } = e;
      // Verificar si el click fue en el botón o dentro de él
      const guardarGastoBtn = target.closest('button[data-action="guardarGasto"]');

      if (guardarGastoBtn) {
        e.preventDefault();
        e.stopPropagation();
        console.log('💾 [GASTOS] Click en botón guardar gasto detectado (delegación de eventos)');

        // Validar número de registro antes de guardar
        const numeroRegistroInput = document.getElementById('numeroRegistroGasto');
        if (numeroRegistroInput) {
          console.log('🔍 [GASTOS] Validando número de registro:', numeroRegistroInput.value);
          validarNumeroRegistro(numeroRegistroInput, 'numeroRegistroGasto');
          if (!numeroRegistroInput.checkValidity()) {
            console.warn('⚠️ [GASTOS] Número de registro inválido');
            numeroRegistroInput.reportValidity();
            return false;
          }
        }

        // Validar formulario completo
        console.log('🔍 [GASTOS] Validando formulario completo...');
        if (!gastosForm.checkValidity()) {
          console.warn('⚠️ [GASTOS] Formulario inválido');
          gastosForm.classList.add('was-validated');
          gastosForm.reportValidity();
          return false;
        }

        console.log('✅ [GASTOS] Formulario válido, llamando window.guardarGasto()');

        // Llamar a la función de guardar
        if (typeof window.guardarGasto === 'function') {
          console.log('✅ [GASTOS] window.guardarGasto es una función, ejecutando...');
          window.guardarGasto().catch(error => {
            console.error('❌ [GASTOS] Error al ejecutar guardarGasto:', error);
          });
        } else {
          console.error(
            '❌ [GASTOS] window.guardarGasto no está disponible. Tipo:',
            typeof window.guardarGasto
          );
          if (typeof showNotification === 'function') {
            showNotification('Error: función de guardar no disponible', 'error');
          }
        }

        return false;
      }
    });

    // Verificar que el botón existe (para logs de depuración)
    const guardarGastoBtn = gastosForm.querySelector('button[data-action="guardarGasto"]');
    console.log('🔍 [GASTOS] Botón guardarGasto encontrado:', guardarGastoBtn ? '✅ Sí' : '❌ No');

    if (!guardarGastoBtn) {
      console.warn(
        '⚠️ [GASTOS] Botón con data-action="guardarGasto" no encontrado en el formulario'
      );
      // Intentar buscar el botón de otra manera
      const allButtons = gastosForm.querySelectorAll('button');
      console.log('🔍 [GASTOS] Botones encontrados en el formulario:', allButtons.length);
      allButtons.forEach((btn, idx) => {
        console.log(
          `  Botón ${idx}: type="${btn.type}", data-action="${btn.getAttribute('data-action')}", text="${btn.textContent.trim()}"`
        );
      });
    }
  } else {
    console.error('❌ [GASTOS] Formulario gastosForm no encontrado');
  }

  const incidenciasForm = document.getElementById('incidenciasForm');
  console.log(
    '🔍 [INCIDENCIAS] Buscando formulario incidenciasForm:',
    incidenciasForm ? '✅ Encontrado' : '❌ No encontrado'
  );

  if (incidenciasForm) {
    // Prevenir submit del formulario
    incidenciasForm.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🛑 Submit del formulario de incidencias prevenido');
      return false;
    });

    // Usar delegación de eventos para el botón (más robusto)
    incidenciasForm.addEventListener('click', e => {
      const { target } = e;
      // Verificar si el click fue en el botón o dentro de él
      const guardarIncidenciaBtn = target.closest('button[data-action="guardarIncidencia"]');

      if (guardarIncidenciaBtn) {
        e.preventDefault();
        e.stopPropagation();
        console.log(
          '💾 [INCIDENCIAS] Click en botón guardar incidencia detectado (delegación de eventos)'
        );

        // Validar número de registro antes de guardar
        const numeroRegistroInput = document.getElementById('numeroRegistroIncidencia');
        if (numeroRegistroInput) {
          console.log('🔍 [INCIDENCIAS] Validando número de registro:', numeroRegistroInput.value);
          if (typeof validarNumeroRegistro === 'function') {
            validarNumeroRegistro(numeroRegistroInput, 'numeroRegistroIncidencia');
          }
          if (!numeroRegistroInput.checkValidity()) {
            console.warn('⚠️ [INCIDENCIAS] Número de registro inválido');
            numeroRegistroInput.reportValidity();
            return false;
          }
        }

        // Validar formulario completo
        console.log('🔍 [INCIDENCIAS] Validando formulario completo...');
        if (!incidenciasForm.checkValidity()) {
          console.warn('⚠️ [INCIDENCIAS] Formulario inválido');
          incidenciasForm.classList.add('was-validated');
          incidenciasForm.reportValidity();
          return false;
        }

        console.log('✅ [INCIDENCIAS] Formulario válido, llamando window.guardarIncidencia()');

        // Llamar a la función de guardar
        if (typeof window.guardarIncidencia === 'function') {
          console.log('✅ [INCIDENCIAS] window.guardarIncidencia es una función, ejecutando...');
          window.guardarIncidencia().catch(error => {
            console.error('❌ [INCIDENCIAS] Error al ejecutar guardarIncidencia:', error);
          });
        } else {
          console.error(
            '❌ [INCIDENCIAS] window.guardarIncidencia no está disponible. Tipo:',
            typeof window.guardarIncidencia
          );
          if (typeof showNotification === 'function') {
            showNotification('Error: función de guardar incidencia no disponible', 'error');
          }
        }

        return false;
      }
    });

    // Verificar que el botón existe (para logs de depuración)
    const guardarIncidenciaBtn = incidenciasForm.querySelector(
      'button[data-action="guardarIncidencia"]'
    );
    console.log(
      '🔍 [INCIDENCIAS] Botón guardarIncidencia encontrado:',
      guardarIncidenciaBtn ? '✅ Sí' : '❌ No'
    );

    if (!guardarIncidenciaBtn) {
      console.warn(
        '⚠️ [INCIDENCIAS] Botón con data-action="guardarIncidencia" no encontrado en el formulario'
      );
      // Intentar buscar el botón de otra manera
      const allButtons = incidenciasForm.querySelectorAll('button');
      console.log('🔍 [INCIDENCIAS] Botones encontrados en el formulario:', allButtons.length);
      allButtons.forEach((btn, idx) => {
        console.log(
          `  Botón ${idx}: type="${btn.type}", data-action="${btn.getAttribute('data-action')}", text="${btn.textContent.trim()}"`
        );
      });
    }
  } else {
    console.error('❌ [INCIDENCIAS] Formulario incidenciasForm no encontrado');
  }
});

// Función para cargar datos de operadores (fuera de DOMContentLoaded para que se ejecute)
const cargarDatosOperadoresAutomatico = async () => {
  console.log('🔄 [OPERADORES] Inicializando carga automática de gastos e incidencias...');

  // Verificar que el DOM esté listo
  const tbodyGastos = document.getElementById('gastosTableBody');
  if (!tbodyGastos) {
    console.warn('⚠️ [OPERADORES] tbody de gastos no encontrado, reintentando en 500ms...');
    setTimeout(cargarDatosOperadoresAutomatico, 500);
    return;
  }

  if (typeof window.cargarGastos === 'function') {
    console.log('✅ [OPERADORES] Función cargarGastos disponible, ejecutando...');
    try {
      await window.cargarGastos();
      console.log('✅ [OPERADORES] cargarGastos() completado');
    } catch (error) {
      console.error('❌ [OPERADORES] Error ejecutando cargarGastos():', error);
    }
  } else {
    console.warn(
      '⚠️ [OPERADORES] Función cargarGastos no disponible aún, reintentando en 500ms...'
    );
    setTimeout(cargarDatosOperadoresAutomatico, 500);
    return;
  }

  if (typeof window.cargarIncidencias === 'function') {
    console.log('✅ [OPERADORES] Función cargarIncidencias disponible, ejecutando...');
    try {
      await window.cargarIncidencias();
      console.log('✅ [OPERADORES] cargarIncidencias() completado');
    } catch (error) {
      console.error('❌ [OPERADORES] Error ejecutando cargarIncidencias():', error);
    }
  } else {
    console.warn('⚠️ [OPERADORES] Función cargarIncidencias no disponible aún');
  }
};

// Esperar a que los repositorios de Firebase estén listos y cargar datos (ejecutar directamente)
(async () => {
  try {
    console.log('🚀 [OPERADORES] Iniciando función async de carga de datos...');

    let attempts = 0;
    const maxAttempts = 20;
    while (attempts < maxAttempts && (!window.firebaseRepos || !window.firebaseRepos.operadores)) {
      attempts++;
      console.log(
        `⏳ [OPERADORES] Esperando repositorios de Firebase... (${attempts}/${maxAttempts})`
      );
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(
      '✅ [OPERADORES] Repositorios de Firebase verificados, preparando carga de datos...'
    );

    // Ejecutar después de un delay inicial para asegurar que el DOM esté listo
    console.log('⏰ [OPERADORES] Programando carga de datos en 1 segundo...');
    setTimeout(() => {
      console.log('⏰ [OPERADORES] Ejecutando carga de datos ahora...');
      cargarDatosOperadoresAutomatico();
    }, 1000);
  } catch (error) {
    console.error('❌ [OPERADORES] Error en función async de carga de datos:', error);
  }
})();

// Sistema de logs de debug
// Cargar logs guardados desde localStorage (desde tráfico u otras páginas)
window.debugLogs = JSON.parse(localStorage.getItem('erp_debug_logs') || '[]');
const maxLogs = 100;

// Interceptar console.log para capturar logs importantes
// Guardar referencias originales ANTES de cualquier modificación
const originalConsoleLog = console.log.bind(console);
const originalConsoleWarn = console.warn.bind(console);
const originalConsoleError = console.error.bind(console);

function addDebugLog(message, type = 'log') {
  const timestamp = new Date().toLocaleTimeString('es-MX');
  const logEntry = {
    time: timestamp,
    message: message,
    type: type
  };

  window.debugLogs.push(logEntry);
  if (window.debugLogs.length > maxLogs) {
    window.debugLogs.shift();
  }

  // Mostrar en el panel si está visible
  updateDebugLogPanel();

  // También mostrar en consola original
  if (type === 'warn') {
    originalConsoleWarn(message);
  } else if (type === 'error') {
    originalConsoleError(message);
  } else {
    originalConsoleLog(message);
  }
}

// Interceptar logs relacionados con gastos
console.log = function (...args) {
  const message = args.join(' ');
  if (
    message.includes('gasto') ||
    message.includes('Gasto') ||
    message.includes('operador') ||
    message.includes('Operador') ||
    message.includes('duplicado') ||
    message.includes('Duplicado') ||
    message.includes('Firebase') ||
    message.includes('guardar') ||
    message.includes('Guardar') ||
    message.includes('Iniciando') ||
    message.includes('preparado') ||
    message.includes('omitido')
  ) {
    addDebugLog(message, 'log');
  } else {
    originalConsoleLog.apply(console, args);
  }
};

console.warn = function (...args) {
  const message = args.join(' ');
  if (
    message.includes('gasto') ||
    message.includes('Gasto') ||
    message.includes('operador') ||
    message.includes('Operador') ||
    message.includes('duplicado') ||
    message.includes('Duplicado') ||
    message.includes('Firebase') ||
    message.includes('guardar')
  ) {
    addDebugLog(message, 'warn');
  } else {
    originalConsoleWarn.apply(console, args);
  }
};

console.error = function (...args) {
  const message = args.join(' ');
  if (
    message.includes('gasto') ||
    message.includes('Gasto') ||
    message.includes('operador') ||
    message.includes('Operador') ||
    message.includes('Firebase') ||
    message.includes('guardar')
  ) {
    addDebugLog(message, 'error');
  } else {
    originalConsoleError.apply(console, args);
  }
};

function updateDebugLogPanel() {
  const panel = document.getElementById('debugLogs');
  if (!panel) {
    return;
  }

  // Sincronizar con localStorage para obtener logs de otras páginas
  const logsGuardados = JSON.parse(localStorage.getItem('erp_debug_logs') || '[]');
  if (logsGuardados.length > window.debugLogs.length) {
    window.debugLogs = logsGuardados;
  }

  const logs = window.debugLogs.slice(-50); // Mostrar últimos 50
  panel.innerHTML = logs
    .map(log => {
      let color = '#d4d4d4';
      let icon = '📋';
      if (log.type === 'warn') {
        color = '#ffc107';
        icon = '⚠️';
      } else if (log.type === 'error') {
        color = '#dc3545';
        icon = '❌';
      } else if (log.message.includes('✅')) {
        color = '#28a745';
        icon = '✅';
      } else if (log.message.includes('🔍') || log.message.includes('💾')) {
        color = '#17a2b8';
        icon = '💾';
      }

      return `<div style="color: ${color}; margin-bottom: 4px;">
            <span style="color: #858585;">[${log.time}]</span> ${icon} ${log.message}
        </div>`;
    })
    .join('');

  // Auto-scroll al final
  panel.scrollTop = panel.scrollHeight;
}

window.toggleDebugLogs = function () {
  const panel = document.getElementById('debugLogPanel');
  const btn = document.getElementById('showDebugBtn');
  const toggleBtn = document.getElementById('toggleDebugBtn');

  if (panel && panel.style.display === 'none') {
    panel.style.display = 'block';
    if (btn) {
      btn.style.display = 'none';
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar';
    }
    updateDebugLogPanel();
  } else if (panel) {
    panel.style.display = 'none';
    if (btn) {
      btn.style.display = 'block';
    }
    if (toggleBtn) {
      toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Mostrar';
    }
  }
};

window.limpiarDebugLogs = function () {
  window.debugLogs = [];
  updateDebugLogPanel();
};

// Función helper para actualizar el tenantId del documento de configuración
// Se expone globalmente para poder usarla desde la consola
window.actualizarTenantIdConfiguracion = async function (
  documento = 'operadores',
  nuevoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant'
) {
  try {
    if (!window.firebaseDb || !window.fs) {
      console.error('❌ Firebase no está disponible. Espera a que Firebase se inicialice.');
      return false;
    }

    console.log(
      `🔄 Actualizando tenantId del documento configuracion/${documento} a "${nuevoTenantId}"...`
    );

    const docRef = window.fs.doc(window.firebaseDb, 'configuracion', documento);
    const doc = await window.fs.getDoc(docRef);

    if (!doc.exists()) {
      console.error(`❌ El documento configuracion/${documento} no existe`);
      return false;
    }

    const data = doc.data();
    const tenantIdActual = data.tenantId;

    console.log(`📋 TenantId actual: ${tenantIdActual || '(no definido)'}`);
    console.log(`📋 Nuevo tenantId: ${nuevoTenantId}`);

    if (tenantIdActual === nuevoTenantId) {
      console.log('✅ El documento ya tiene el tenantId correcto');
      return true;
    }

    // Actualizar el documento usando setDoc con merge: true (más confiable que updateDoc)
    // Esto preserva todos los demás campos del documento
    await window.fs.setDoc(
      docRef,
      {
        tenantId: nuevoTenantId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    console.log(`✅ Documento configuracion/${documento} actualizado correctamente`);
    console.log(
      `✅ TenantId cambiado de "${tenantIdActual || '(no definido)'}" a "${nuevoTenantId}"`
    );

    return true;
  } catch (error) {
    console.error('❌ Error actualizando tenantId:', error);
    console.error('❌ Detalles del error:', error.message);
    return false;
  }
};

console.log(
  '💡 Función helper disponible: window.actualizarTenantIdConfiguracion(documento, tenantId)'
);
console.log(
  `💡 Ejemplo: await window.actualizarTenantIdConfiguracion("operadores", "${window.DEMO_CONFIG?.tenantId || 'demo_tenant'}")`
);

// Función para actualizar TODOS los documentos de configuracion a demo_tenant
window.actualizarTodosLosTenantIdConfiguracion = async function (
  nuevoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant'
) {
  try {
    if (!window.firebaseDb || !window.fs) {
      console.error('❌ Firebase no está disponible. Espera a que Firebase se inicialice.');
      return false;
    }

    console.log('🔄 === ACTUALIZANDO TODOS LOS DOCUMENTOS DE CONFIGURACIÓN ===');
    console.log(`📋 Nuevo tenantId: ${nuevoTenantId}`);
    console.log('');

    // Obtener todos los documentos de la colección configuracion
    const configuracionRef = window.fs.collection(window.firebaseDb, 'configuracion');
    const snapshot = await window.fs.getDocs(configuracionRef);

    if (snapshot.empty) {
      console.warn('⚠️ No se encontraron documentos en la colección configuracion');
      return false;
    }

    console.log(`📊 Se encontraron ${snapshot.docs.length} documento(s) en configuracion`);
    console.log('');

    const resultados = {
      actualizados: [],
      yaCorrectos: [],
      errores: []
    };

    // Procesar cada documento
    for (const docSnap of snapshot.docs) {
      const docId = docSnap.id;
      const data = docSnap.data();
      const tenantIdActual = data.tenantId;

      try {
        if (tenantIdActual === nuevoTenantId) {
          console.log(`✅ ${docId}: Ya tiene el tenantId correcto (${nuevoTenantId})`);
          resultados.yaCorrectos.push(docId);
          continue;
        }

        console.log(
          `🔄 ${docId}: Actualizando de "${tenantIdActual || '(no definido)'}" a "${nuevoTenantId}"...`
        );

        const docRef = window.fs.doc(window.firebaseDb, 'configuracion', docId);
        await window.fs.setDoc(
          docRef,
          {
            tenantId: nuevoTenantId,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );

        console.log(`✅ ${docId}: Actualizado correctamente`);
        resultados.actualizados.push({
          documento: docId,
          anterior: tenantIdActual || '(no definido)',
          nuevo: nuevoTenantId
        });
      } catch (error) {
        console.error(`❌ ${docId}: Error al actualizar - ${error.message}`);
        resultados.errores.push({
          documento: docId,
          error: error.message
        });
      }
    }

    // Resumen
    console.log('');
    console.log('📊 === RESUMEN ===');
    console.log(`✅ Actualizados: ${resultados.actualizados.length}`);
    console.log(`✓ Ya correctos: ${resultados.yaCorrectos.length}`);
    console.log(`❌ Errores: ${resultados.errores.length}`);
    console.log('');

    if (resultados.actualizados.length > 0) {
      console.log('📋 Documentos actualizados:');
      resultados.actualizados.forEach(r => {
        console.log(`   - ${r.documento}: "${r.anterior}" → "${r.nuevo}"`);
      });
      console.log('');
    }

    if (resultados.yaCorrectos.length > 0) {
      console.log('✓ Documentos que ya tenían el tenantId correcto:');
      resultados.yaCorrectos.forEach(docId => {
        console.log(`   - ${docId}`);
      });
      console.log('');
    }

    if (resultados.errores.length > 0) {
      console.log('❌ Documentos con errores:');
      resultados.errores.forEach(r => {
        console.log(`   - ${r.documento}: ${r.error}`);
      });
      console.log('');
    }

    console.log('✅ === PROCESO COMPLETADO ===');

    return {
      exito: resultados.errores.length === 0,
      actualizados: resultados.actualizados.length,
      yaCorrectos: resultados.yaCorrectos.length,
      errores: resultados.errores.length,
      detalles: resultados
    };
  } catch (error) {
    console.error('❌ Error general actualizando tenantIds:', error);
    console.error('❌ Detalles del error:', error.message);
    return false;
  }
};

console.log('💡 Función disponible: window.actualizarTodosLosTenantIdConfiguracion(tenantId)');
console.log(
  `💡 Ejemplo: await window.actualizarTodosLosTenantIdConfiguracion("${window.DEMO_CONFIG?.tenantId || 'demo_tenant'}")`
);

// Suscribirse a económicos de Firestore para mantener listas actualizadas
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.economicosRepo) {
      try {
        window.ERPState.clearSubscription('economicos');
        window.economicosRepo.subscribe(list => {
          window.ERPState.setCache('economicosAlt', list);
          // Actualizar también el caché de dropdowns
          console.log(
            '📦 Cache de económicos actualizado desde Firestore (operadores):',
            list.length
          );
          // NO llamar a cargarTractocamiones() aquí para evitar bucles infinitos
          // El caché ya está actualizado, los dropdowns lo usarán automáticamente
        });
      } catch (e) {
        console.warn('⚠️ No se pudo suscribir a economicosRepo en operadores:', e);
      }
    }
  }, 1000);
});

// Función para sincronizar gastos de localStorage a Firebase
window.sincronizarGastosAFirebase = async function () {
  try {
    // Verificar si se limpiaron los datos operativos (flag local)
    const datosLimpios = localStorage.getItem('datos_operativos_limpiados');

    // Verificar que el repositorio esté disponible
    if (!window.firebaseRepos?.operadores) {
      console.error('❌ Repositorio de Firebase no disponible');
      return { sincronizados: 0, errores: 0 };
    }

    // Verificar si Firebase está vacío y hay conexión
    const hayConexion = navigator.onLine;
    let firebaseVacio = false;
    try {
      const gastosFirebase = await window.firebaseRepos.operadores.getAll();
      const gastosFiltrados = gastosFirebase.filter(item => item.tipo === 'gasto');
      firebaseVacio = !gastosFiltrados || gastosFiltrados.length === 0;
    } catch (error) {
      console.warn('⚠️ Error verificando Firebase:', error);
    }

    if (datosLimpios === 'true' || (firebaseVacio && hayConexion)) {
      const razon =
        datosLimpios === 'true'
          ? 'Datos operativos fueron limpiados (flag local)'
          : 'Firebase está vacío y hay conexión (datos eliminados intencionalmente)';
      console.log(`⚠️ ${razon}. No se sincronizará desde localStorage a Firebase para Operadores.`);
      return { sincronizados: 0, errores: 0 };
    }

    console.log('🔄 Sincronizando gastos de localStorage a Firebase...');

    // Obtener gastos de localStorage
    const gastosLocal = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    console.log(`📋 Gastos en localStorage: ${gastosLocal.length}`);

    if (gastosLocal.length === 0) {
      console.log('✅ No hay gastos para sincronizar');
      return { sincronizados: 0, errores: 0 };
    }

    // Verificar que el repositorio esté disponible
    if (!window.firebaseRepos?.operadores) {
      console.error('❌ Repositorio de Firebase no disponible');
      return { sincronizados: 0, errores: gastosLocal.length };
    }

    // Esperar a que el repositorio esté inicializado
    let attempts = 0;
    while (
      attempts < 10 &&
      (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId)
    ) {
      attempts++;
      console.log(`⏳ Esperando inicialización del repositorio... (${attempts}/10)`);
      await new Promise(resolve => setTimeout(resolve, 500));
      await window.firebaseRepos.operadores.init();
    }

    if (!window.firebaseRepos.operadores.db || !window.firebaseRepos.operadores.tenantId) {
      throw new Error('Repositorio no inicializado después de 5 segundos');
    }

    let sincronizados = 0;
    let errores = 0;

    // Sincronizar cada gasto
    for (const gasto of gastosLocal) {
      try {
        const gastoId = gasto.id
          ? `gasto_${gasto.id}`
          : `gasto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Asegurar que tenga el tipo correcto
        const gastoData = {
          ...gasto,
          tipo: 'gasto',
          fechaCreacion: gasto.fechaCreacion || new Date().toISOString()
        };

        console.log(`💾 Sincronizando gasto ${gastoId}...`);
        const resultado = await window.firebaseRepos.operadores.saveGasto(gastoId, gastoData);

        if (resultado) {
          sincronizados++;
          console.log(`✅ Gasto ${gastoId} sincronizado`);
        } else {
          errores++;
          console.warn(`⚠️ Gasto ${gastoId} no se pudo sincronizar`);
        }
      } catch (error) {
        errores++;
        console.error('❌ Error sincronizando gasto:', error);
      }
    }

    console.log(`✅ Sincronización completada: ${sincronizados} sincronizados, ${errores} errores`);

    // Recargar la tabla de gastos
    if (typeof window.cargarGastos === 'function') {
      console.log('🔄 Recargando tabla de gastos...');
      await window.cargarGastos();
      console.log('✅ Tabla de gastos recargada');
    } else {
      console.warn('⚠️ Función cargarGastos no disponible');
    }

    return { sincronizados, errores };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    const gastosLocal = JSON.parse(localStorage.getItem('erp_operadores_gastos') || '[]');
    return { sincronizados: 0, errores: gastosLocal.length };
  }
};

// Constantes
const _EXPECTED_TENANT_ID = window.DEMO_CONFIG?.tenantId || 'demo_tenant';

// ===== HELPERS PARA NORMALIZACIÓN Y FILTRADO =====
// Verificar si un objeto es un operador (no gasto/incidencia)
function esOperadorValido(op) {
  // EXCLUIR si tiene campos de gasto/incidencia
  if (
    op.tipoGasto ||
    op.monto ||
    op.numeroRegistro ||
    op.tipoIncidencia ||
    op.concepto ||
    op.fechaGasto ||
    op.fechaIncidencia ||
    op.evidencia
  ) {
    return false;
  }
  // EXCLUIR si el ID parece ser de gasto/incidencia
  if (
    op.id &&
    (op.id.toString().startsWith('gasto_') ||
      op.id.toString().startsWith('incidencia_') ||
      /^\d{13,}$/.test(op.id.toString()))
  ) {
    return false;
  }
  // INCLUIR si tiene campos que indican que es un operador
  return Boolean(
    op.nombre || op.nombreOperador || op.nombreCompleto || op.licencia || op.numeroLicencia
  );
}

// Normalizar un operador (unificar campos)
function normalizarOperador(op) {
  return {
    ...op,
    nombre:
      op.nombre ||
      op.nombreOperador ||
      op.nombreCompleto ||
      op.Nombre ||
      op.NombreCompleto ||
      op.name ||
      'N/A',
    licencia:
      op.licencia || op.numeroLicencia || op.Licencia || op.NumeroLicencia || op.license || ''
  };
}

// Convertir objeto a array y filtrar operadores
function convertirYFiltrarOperadores(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (!data || typeof data !== 'object') {
    return [];
  }

  return Object.keys(data)
    .map(nombre => normalizarOperador({ ...data[nombre], nombre: data[nombre].nombre || nombre }))
    .filter(esOperadorValido);
}

// Cargar operadores desde Firebase
async function cargarOperadoresDesdeFirebase() {
  if (!window.firebaseDb || !window.fs) {
    return [];
  }

  try {
    const docRef = window.fs.doc(window.firebaseDb, 'configuracion', 'operadores');
    const doc = await window.fs.getDoc(docRef);
    if (!doc.exists()) {
      return [];
    }

    const data = doc.data();

    if (data.operadores && Array.isArray(data.operadores)) {
      const todosLosOperadores = data.operadores.filter(o => o.deleted !== true);

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

      // CRÍTICO: Filtrar por tenantId
      const operadoresFiltrados = todosLosOperadores.filter(operador => {
        const operadorTenantId = operador.tenantId;
        return operadorTenantId === tenantId;
      });

      console.log(
        `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadoresFiltrados.length} de ${todosLosOperadores.length} totales`
      );

      return operadoresFiltrados;
    }

    return [];
  } catch (e) {
    console.warn('⚠️ Error cargando operadores desde Firebase:', e);
    return [];
  }
}

// Función para cargar operadores en caché
async function cargarOperadoresEnCache() {
  inicializarERPState();

  // Verificar si ya hay datos en caché
  const cache = window.ERPState.getCache('operadores');
  if (cache && cache.length > 0) {
    return cache;
  }

  // Verificar si ya se está cargando (usar clave simple para evitar warnings)
  const loadingKey = 'operadores';
  if (window.ERPState.isLoading && window.ERPState.isLoading(loadingKey)) {
    // Esperar un poco y retornar caché si está disponible
    await new Promise(resolve => setTimeout(resolve, 500));
    return window.ERPState.getCache('operadores') || [];
  }

  if (window.ERPState.setLoading) {
    window.ERPState.setLoading(loadingKey, true);
  }

  try {
    // PRIORIDAD 1: Firebase (más confiable)
    let operadores = await cargarOperadoresDesdeFirebase();

    // PRIORIDAD 2: configuracionManager (fallback)
    if (operadores.length === 0 && window.configuracionManager?.getOperadores) {
      const temp = window.configuracionManager.getOperadores();
      operadores = convertirYFiltrarOperadores(temp);
    }

    // CRÍTICO: Filtrar por tenantId ANTES de normalizar
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

    const totalAntesFiltro = operadores.length;
    operadores = operadores.filter(operador => {
      const operadorTenantId = operador.tenantId;
      return operadorTenantId === tenantId;
    });

    if (totalAntesFiltro !== operadores.length) {
      console.log(
        `🔒 Operadores filtrados por tenantId (${tenantId}): ${operadores.length} de ${totalAntesFiltro} totales`
      );
    }

    // Normalizar y filtrar
    const operadoresNormalizados = operadores.filter(esOperadorValido).map(normalizarOperador);

    window.ERPState.setCache('operadores', operadoresNormalizados);
    return operadoresNormalizados;
  } catch (error) {
    console.error('❌ Error cargando operadores en caché:', error);
    window.ERPState.setCache('operadores', []);
    return [];
  } finally {
    // Liberar la bandera usando el sistema centralizado
    if (window.ERPState && window.ERPState.setLoading) {
      window.ERPState.setLoading('operadores', false);
    }
  }
}

// Exponer la función inmediatamente después de definirla
window.cargarOperadoresEnCache = cargarOperadoresEnCache;

// ===== INICIALIZACIÓN DE DROPDOWNS CON MÓDULO GENÉRICO =====
// Helper para cargar tractocamiones desde Firebase
async function cargarTractocamionesDesdeFirebase() {
  try {
    if (!window.firebaseDb || !window.fs || !window.firebaseAuth?.currentUser) {
      console.warn('⚠️ Firebase no disponible para cargar tractocamiones');
      return [];
    }

    let tractocamiones = [];

    // PRIORIDAD 1: Intentar desde configuracion/tractocamiones (documento con array)
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
          const todosLosEconomicos = data.economicos;

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

          // CRÍTICO: Filtrar por tenantId
          tractocamiones = todosLosEconomicos.filter(economico => {
            const economicoTenantId = economico.tenantId;
            return economicoTenantId === tenantId;
          });

          console.log(
            `🔒 Tractocamiones filtrados por tenantId (${tenantId}): ${tractocamiones.length} de ${todosLosEconomicos.length} totales`
          );
        }
      }
    } catch (error) {
      console.warn('⚠️ Error cargando desde configuracion/tractocamiones:', error);
    }

    // PRIORIDAD 2: Si no hay datos, intentar desde configuracionManager
    if (
      tractocamiones.length === 0 &&
      window.configuracionManager &&
      typeof window.configuracionManager.getEconomicos === 'function'
    ) {
      const data = window.configuracionManager.getEconomicos();
      if (Array.isArray(data)) {
        // Filtrar por tipo solo si el campo existe
        tractocamiones = data.filter(
          e => !e.tipo || e.tipo === 'tractocamion' || e.tipo === 'Tractocamion'
        );
      } else if (data && typeof data === 'object') {
        tractocamiones = Object.values(data).filter(
          e => !e.tipo || e.tipo === 'tractocamion' || e.tipo === 'Tractocamion'
        );
      }
    }

    // Filtrar solo activos (similar a window.cargarTractocamiones)
    tractocamiones = tractocamiones.filter(
      tracto =>
        tracto &&
        tracto.numero &&
        tracto.estadoVehiculo !== 'inactivo' &&
        tracto.estadoVehiculo !== 'retirado'
    );

    return tractocamiones;
  } catch (error) {
    console.warn('⚠️ Error cargando tractocamiones desde Firebase:', error);
    return [];
  }
}

// Helper para cargar tractocamiones
async function cargarTractocamionesEnCache() {
  inicializarERPState();

  // Verificar si ya hay datos en caché
  const cache = window.ERPState.getCache('economicos');
  if (cache && cache.length > 0) {
    return cache;
  }

  // Verificar si ya se está cargando (usar clave simple para evitar warnings)
  const loadingKey = 'economicos';
  if (window.ERPState.isLoading && window.ERPState.isLoading(loadingKey)) {
    // Esperar un poco y retornar caché si está disponible
    await new Promise(resolve => setTimeout(resolve, 500));
    return window.ERPState.getCache('economicos') || [];
  }

  if (window.ERPState.setLoading) {
    window.ERPState.setLoading(loadingKey, true);
  }

  try {
    let tractocamiones = [];

    // PRIORIDAD 1: Firebase (más confiable)
    tractocamiones = await cargarTractocamionesDesdeFirebase();

    // PRIORIDAD 2: configuracionManager (fallback)
    if (
      tractocamiones.length === 0 &&
      window.configuracionManager &&
      typeof window.configuracionManager.getEconomicos === 'function'
    ) {
      const data = window.configuracionManager.getEconomicos();
      let tractocamionesTemp = [];
      if (Array.isArray(data)) {
        // Filtrar por tipo solo si el campo existe
        tractocamionesTemp = data.filter(
          e => !e.tipo || e.tipo === 'tractocamion' || e.tipo === 'Tractocamion'
        );
      } else if (data && typeof data === 'object') {
        tractocamionesTemp = Object.values(data).filter(
          e => !e.tipo || e.tipo === 'tractocamion' || e.tipo === 'Tractocamion'
        );
      }

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

      // CRÍTICO: Filtrar por tenantId
      tractocamionesTemp = tractocamionesTemp.filter(economico => {
        const economicoTenantId = economico.tenantId;
        return economicoTenantId === tenantId;
      });

      // Filtrar solo activos
      tractocamiones = tractocamionesTemp.filter(
        tracto =>
          tracto &&
          tracto.numero &&
          tracto.estadoVehiculo !== 'inactivo' &&
          tracto.estadoVehiculo !== 'retirado'
      );
    }

    // Normalizar datos - usar 'numero' como campo principal (como en operadores.js)
    const tractocamionesNormalizados = tractocamiones.map(t => {
      const numero = t.numero || t.economico || t.id || 'N/A';
      const placa = t.placaTracto || t.placa || '';
      const marca = t.marca || '';
      const modelo = t.modelo || '';

      // Crear nombre formateado similar a como se muestra en los selects tradicionales
      let nombre = numero;
      if (placa) {
        nombre += ` - ${placa}`;
      }
      if (marca || modelo) {
        nombre += ` (${marca} ${modelo})`.trim();
      }

      return {
        ...t,
        nombre: nombre,
        numero: numero,
        numeroEconomico: numero,
        economico: numero
      };
    });

    window.ERPState.setCache('economicos', tractocamionesNormalizados);
    console.log(`✅ ${tractocamionesNormalizados.length} tractocamiones guardados en caché`);
    console.log('📋 Ejemplo de tractocamión normalizado:', tractocamionesNormalizados[0]);
    return tractocamionesNormalizados;
  } catch (error) {
    console.error('❌ Error cargando tractocamiones:', error);
    window.ERPState.setCache('economicos', []);
    return [];
  } finally {
    if (window.ERPState && window.ERPState.setLoading) {
      window.ERPState.setLoading('economicos', false);
    }
  }
}

// ===== CONFIGURACIÓN DE DROPDOWNS =====
const _DROPDOWNS_CONFIG = [
  {
    inputId: 'operador',
    dropdownId: 'operador_dropdown',
    hiddenInputId: 'operador_value',
    cacheKey: 'operadores',
    context: 'operadores',
    dataLoader: cargarOperadoresEnCache,
    formatItem: item => ({
      text: item.nombre || 'N/A',
      subtext: item.licencia ? `Licencia: ${item.licencia}` : null
    }),
    formatDisplay: item => {
      const nombre = item.nombre || '';
      const licencia = item.licencia || '';
      return licencia ? `${nombre} - ${licencia}` : nombre;
    }
  },
  {
    inputId: 'tractocamion',
    dropdownId: 'tractocamion_dropdown',
    hiddenInputId: 'tractocamion_value',
    cacheKey: 'economicos',
    context: 'operadores',
    dataLoader: cargarTractocamionesEnCache,
    formatItem: item => ({
      text: item.nombre || item.numero || item.economico || item.numeroEconomico || 'N/A',
      subtext: null
    }),
    formatDisplay: item =>
      item.nombre || item.numero || item.economico || item.numeroEconomico || ''
  },
  {
    inputId: 'operadorIncidencia',
    dropdownId: 'operadorIncidencia_dropdown',
    hiddenInputId: 'operadorIncidencia_value',
    cacheKey: 'operadores',
    context: 'incidencias',
    dataLoader: cargarOperadoresEnCache,
    formatItem: item => ({
      text: item.nombre || 'N/A',
      subtext: item.licencia ? `Licencia: ${item.licencia}` : null
    }),
    formatDisplay: item => {
      const nombre = item.nombre || '';
      const licencia = item.licencia || '';
      return licencia ? `${nombre} - ${licencia}` : nombre;
    }
  },
  {
    inputId: 'tractocamionIncidencia',
    dropdownId: 'tractocamionIncidencia_dropdown',
    hiddenInputId: 'tractocamionIncidencia_value',
    cacheKey: 'economicos',
    context: 'incidencias',
    dataLoader: cargarTractocamionesEnCache,
    formatItem: item => ({
      text: item.nombre || item.numero || item.economico || item.numeroEconomico || 'N/A',
      subtext: null
    }),
    formatDisplay: item =>
      item.nombre || item.numero || item.economico || item.numeroEconomico || ''
  }
];

// Inicializar dropdowns usando el módulo genérico
// NOTA: Este código se ha deshabilitado porque ahora usamos el nuevo componente searchable-select
// que se inicializa mediante los scripts searchable-select-operadores.js y searchable-select-tractocamiones.js
function _inicializarDropdownsOperadores() {
  // Comentado porque ahora usamos el nuevo componente searchable-select
  console.log(
    'ℹ️ Los dropdowns se inicializan automáticamente mediante searchable-select-operadores.js y searchable-select-tractocamiones.js'
  );
  return;

  /*
    if (!window.SearchableSelectFactory) {
        console.warn('⚠️ SearchableSelectFactory no está disponible, reintentando en 500ms...');
        setTimeout(inicializarDropdownsOperadores, 500);
        return;
    }

    console.log('🔄 Inicializando dropdowns de operadores y tractocamiones...');

    try {
        DROPDOWNS_CONFIG.forEach(config => {
            try {
                const instance = window.SearchableSelectFactory.create(config);
                console.log(`✅ Dropdown inicializado: ${config.inputId} (${config.context})`);

                // Verificar que los elementos existan
                const input = document.getElementById(config.inputId);
                const dropdown = document.getElementById(config.dropdownId);
                if (!input) {
                    console.warn(`⚠️ Input ${config.inputId} no encontrado en el DOM`);
                }
                if (!dropdown) {
                    console.warn(`⚠️ Dropdown ${config.dropdownId} no encontrado en el DOM`);
                }
            } catch (error) {
                console.error(`❌ Error inicializando dropdown ${config.inputId}:`, error);
            }
        });
        console.log('✅ Todos los dropdowns inicializados correctamente');
    } catch (error) {
        console.error('❌ Error inicializando dropdowns:', error);
    }
    */
}

// ===== GENERADOR DE FUNCIONES WRAPPER =====
// Mapeo de inputId/context a nombres de función del HTML
const _WRAPPER_MAPPING = {
  'operador-operadores': {
    filtrar: 'filtrarOperadoresOperadores',
    mostrar: 'mostrarDropdownOperadoresOperadores',
    ocultar: 'ocultarDropdownOperadoresOperadores',
    desplegar: 'desplegarListaOperadoresOperadores',
    seleccionar: 'seleccionarOperadorOperadores',
    manejarTeclado: 'manejarTecladoOperadoresOperadores'
  },
  'tractocamion-operadores': {
    filtrar: 'filtrarTractocamionesOperadores',
    mostrar: 'mostrarDropdownTractocamionesOperadores',
    ocultar: 'ocultarDropdownTractocamionesOperadores',
    desplegar: 'desplegarListaTractocamionesOperadores',
    seleccionar: 'seleccionarTractocamionOperadores',
    manejarTeclado: 'manejarTecladoTractocamionesOperadores'
  },
  'operadorIncidencia-incidencias': {
    filtrar: 'filtrarOperadoresIncidencia',
    mostrar: 'mostrarDropdownOperadoresIncidencia',
    ocultar: 'ocultarDropdownOperadoresIncidencia',
    desplegar: 'desplegarListaOperadoresIncidencia',
    seleccionar: 'seleccionarOperadorIncidencia',
    manejarTeclado: 'manejarTecladoOperadoresIncidencia'
  },
  'tractocamionIncidencia-incidencias': {
    filtrar: 'filtrarTractocamionesIncidencia',
    mostrar: 'mostrarDropdownTractocamionesIncidencia',
    ocultar: 'ocultarDropdownTractocamionesIncidencia',
    desplegar: 'desplegarListaTractocamionesIncidencia',
    seleccionar: 'seleccionarTractocamionIncidencia',
    manejarTeclado: 'manejarTecladoTractocamionesIncidencia'
  }
};

// Crear wrappers para todos los dropdowns
// NOTA: Este código se ha deshabilitado porque ahora usamos el nuevo componente searchable-select
/*
Object.entries(WRAPPER_MAPPING).forEach(([key, names]) => {
    const [inputId, context] = key.split('-');
    const select = () => window.SearchableSelectFactory.get(inputId, context);

    window[names.filtrar] = (busqueda) => { const s = select(); if (s) s.filter(busqueda); };
    window[names.mostrar] = () => { const s = select(); if (s) s.show(); };
    window[names.ocultar] = (immediate = false) => { const s = select(); if (s) s.hide(immediate); };
    window[names.desplegar] = () => { const s = select(); if (s) s.show(); };
    window[names.seleccionar] = (item) => { const s = select(); if (s) s.select(item); };
    window[names.manejarTeclado] = (event) => { const s = select(); if (s) s.handleKeyboard(event); };
});
*/

// Inicializar cuando el DOM esté listo y después de cargar los datos
// NOTA: Esta función se ha deshabilitado porque ahora usamos el nuevo componente searchable-select
const _inicializarDropdownsConRetry = (_intentos = 0) => {
  // Los dropdowns se inicializan automáticamente mediante searchable-select-operadores.js y searchable-select-tractocamiones.js
  console.log(
    'ℹ️ Los dropdowns se inicializan automáticamente mediante los scripts searchable-select-operadores.js y searchable-select-tractocamiones.js'
  );
  return;
};

// Inicializar cuando el DOM esté listo
// NOTA: Este código se ha deshabilitado porque ahora usamos el nuevo componente searchable-select
// que se inicializa mediante los scripts searchable-select-operadores.js y searchable-select-tractocamiones.js
/*
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOM listo, programando inicialización de dropdowns...');
        setTimeout(() => inicializarDropdownsConRetry(0), 1500); // Esperar 1.5 segundos para que todo esté cargado
    });
} else {
    console.log('📋 DOM ya está listo, programando inicialización de dropdowns...');
    setTimeout(() => inicializarDropdownsConRetry(0), 1500);
}
*/
console.log(
  'ℹ️ Los dropdowns se inicializan mediante searchable-select-operadores.js y searchable-select-tractocamiones.js'
);
