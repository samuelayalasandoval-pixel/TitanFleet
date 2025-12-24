// Actualiza los labels de "Período" con el mes y año actuales (es-MX)
// En páginas de logística, tráfico y facturación muestra el número de registro actual
(function () {
  function getMesAnioActual() {
    const fecha = new Date();
    const formato = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' });
    // Capitalizar primera letra del mes
    let texto = formato.format(fecha); // ej: "octubre de 2025"
    texto = texto.replace(' de ', ' '); // "octubre 2025"
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function actualizarPeriodos() {
    // Verificar si estamos en una página que debe mostrar el número de registro
    const isLogisticaPage = window.location.pathname.includes('logistica.html');
    const isTraficoPage = window.location.pathname.includes('trafico.html');
    const isFacturacionPage = window.location.pathname.includes('facturacion.html');

    if (isLogisticaPage || isTraficoPage || isFacturacionPage) {
      // En estas páginas, mostrar el número de registro actual
      actualizarNumeroRegistro();
    } else {
      // En otras páginas, mostrar el período normal
      const periodo = getMesAnioActual();
      // Por id
      const el = document.getElementById('currentPeriod');
      if (el) {
        el.textContent = periodo;
      }
      // Por clase (por si hay varios)
      document.querySelectorAll('.period-info').forEach(n => (n.textContent = periodo));
    }
  }

  function actualizarNumeroRegistro() {
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    const currentPeriodEl = document.getElementById('currentPeriod');

    if (!currentPeriodEl) {
      console.warn('⚠️ currentPeriod element no encontrado');
      return;
    }

    if (!numeroRegistroInput) {
      console.warn('⚠️ numeroRegistro input no encontrado');
      currentPeriodEl.textContent = '-';
      return;
    }

    let lastValue = '';

    // Función para validar si el formato del registro es válido (formato nuevo: 25XXXXX)
    function _esFormatoValido(valor) {
      if (!valor || valor.trim() === '') {
        return false;
      }
      // Formato nuevo: 25 seguido de 5 dígitos (ejemplo: 2500001)
      const formatoCorrecto = /^25\d{5}$/;
      return formatoCorrecto.test(valor.trim());
    }

    // Función para detectar formato antiguo (2025-09-0002, etc.)
    function esFormatoAntiguo(valor) {
      if (!valor || valor.trim() === '') {
        return false;
      }
      // Formato antiguo: 2025-XX-XXXX
      const formatoAntiguo = /^2025-\d{2}-\d{4}$/;
      return formatoAntiguo.test(valor.trim());
    }

    function updateDisplay() {
      if (!numeroRegistroInput) {
        currentPeriodEl.textContent = '-';
        return;
      }

      const currentValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';

      // Actualizar siempre, no solo si cambió (para asegurar que se muestre al cargar)
      // Si el campo está vacío, mostrar "-"
      if (!currentValue || currentValue === '') {
        currentPeriodEl.textContent = '-';
        lastValue = '';
      }
      // Si es formato antiguo, mostrar "-" (no mostrar formatos antiguos)
      else if (esFormatoAntiguo(currentValue)) {
        currentPeriodEl.textContent = '-';
        lastValue = '';
      }
      // Si hay cualquier valor, mostrarlo (sin importar el formato)
      // Esto permite que el usuario vea qué número de registro está usando
      else {
        currentPeriodEl.textContent = currentValue;
        lastValue = currentValue;
      }

      // Reducir logs de updateDisplay - solo loggear si hay cambios significativos o en modo debug
      if (window.DEBUG_PERIODO || currentValue !== lastValue) {
        console.log(
          '📋 updateDisplay ejecutado - Valor mostrado:',
          currentPeriodEl.textContent,
          'Valor del campo:',
          currentValue || '(vacío)'
        );
      }
    }

    // Actualizar inmediatamente
    // Limpiar valor si es formato antiguo al cargar
    const initialValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
    console.log('📋 Valor inicial del campo numeroRegistro:', initialValue || '(vacío)');

    if (esFormatoAntiguo(initialValue)) {
      console.log('⚠️ Formato antiguo detectado en numeroRegistro, limpiando campo:', initialValue);
      numeroRegistroInput.value = '';
      lastValue = '';
      // Disparar evento para notificar a otros scripts
      numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // No establecer lastValue aquí, dejar que updateDisplay lo haga
      // Esto asegura que se actualice el display
    }
    // Forzar actualización del display
    lastValue = ''; // Resetear para forzar actualización
    updateDisplay();

    // También verificar después de delays para asegurar que se ejecute después de otros scripts
    // Verificar después de 1 segundo (cuando se cargan los scripts básicos)
    setTimeout(() => {
      const delayedValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
      console.log('📋 Valor después de 1s del campo numeroRegistro:', delayedValue || '(vacío)');
      if (esFormatoAntiguo(delayedValue)) {
        console.log(
          '⚠️ Formato antiguo detectado después de delay, limpiando campo:',
          delayedValue
        );
        numeroRegistroInput.value = '';
        lastValue = '';
        updateDisplay();
      } else if (delayedValue && delayedValue !== lastValue) {
        lastValue = delayedValue;
        updateDisplay();
      }
    }, 1000);

    // Verificar después de 2 segundos (cuando se inicializa el sistema de registro)
    setTimeout(() => {
      const delayedValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
      console.log('📋 Valor después de 2s del campo numeroRegistro:', delayedValue || '(vacío)');
      if (delayedValue && delayedValue !== lastValue) {
        lastValue = delayedValue;
        updateDisplay();
      }
    }, 2000);

    // Verificar después de 3 segundos (por si acaso)
    setTimeout(() => {
      const delayedValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
      console.log('📋 Valor después de 3s del campo numeroRegistro:', delayedValue || '(vacío)');
      if (delayedValue && delayedValue !== lastValue) {
        lastValue = delayedValue;
        updateDisplay();
      }
    }, 3000);

    // Escuchar cambios en el campo de número de registro
    // Eventos para detectar cambios del usuario
    numeroRegistroInput.addEventListener('input', updateDisplay);
    numeroRegistroInput.addEventListener('change', updateDisplay);
    numeroRegistroInput.addEventListener('keyup', updateDisplay);
    numeroRegistroInput.addEventListener('paste', () => setTimeout(updateDisplay, 10));

    // Usar un intervalo para detectar cambios programáticos (cuando otros scripts cambian el valor)
    // Usar un intervalo más frecuente inicialmente para detectar cambios rápidamente
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      const currentValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
      // Si cambió el valor, actualizar
      if (currentValue !== lastValue) {
        console.log(
          `📋 Cambio detectado en intervalo (check ${checkCount}):`,
          currentValue || '(vacío)'
        );
        // Si es formato antiguo, limpiarlo
        if (esFormatoAntiguo(currentValue)) {
          numeroRegistroInput.value = '';
          lastValue = '';
        } else {
          lastValue = currentValue;
        }
        updateDisplay();
      }
      // Después de 10 segundos, reducir la frecuencia del intervalo
      if (checkCount === 33) {
        // 33 * 300ms = ~10 segundos
        clearInterval(checkInterval);
        // Continuar con intervalo menos frecuente
        const slowInterval = setInterval(() => {
          const currentValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
          if (currentValue !== lastValue) {
            if (esFormatoAntiguo(currentValue)) {
              numeroRegistroInput.value = '';
              lastValue = '';
            } else {
              lastValue = currentValue;
            }
            updateDisplay();
          }
        }, 1000); // Verificar cada 1 segundo después de los primeros 10 segundos
        window.addEventListener('beforeunload', () => {
          clearInterval(slowInterval);
        });
      }
    }, 300); // Verificar cada 300ms inicialmente

    // Limpiar intervalo cuando se desmonte la página
    window.addEventListener('beforeunload', () => {
      clearInterval(checkInterval);
    });

    // Escuchar eventos personalizados que puedan actualizar el campo
    document.addEventListener('numeroRegistroActualizado', updateDisplay);

    // Escuchar evento de RegistrationNumberBinding (data binding)
    document.addEventListener('numeroRegistroBinding', e => {
      console.log('📡 Evento numeroRegistroBinding recibido:', e.detail);
      updateDisplay();
    });

    // También escuchar cuando se busca o carga un registro
    document.addEventListener('registroCargado', e => {
      if (e.detail && e.detail.numeroRegistro) {
        updateDisplay();
      }
    });

    // Escuchar cuando se inicializa el sistema de registro (desde main.js)
    // Usar un observer para detectar cuando el campo cambia después de la inicialización
    const observer = new MutationObserver(() => {
      const currentValue = numeroRegistroInput.value ? numeroRegistroInput.value.trim() : '';
      if (currentValue && currentValue !== lastValue) {
        console.log('📋 Cambio detectado por MutationObserver:', currentValue);
        lastValue = currentValue;
        updateDisplay();
      }
    });

    // Observar cambios en el atributo value del campo
    observer.observe(numeroRegistroInput, {
      attributes: true,
      attributeFilter: ['value'],
      childList: false,
      subtree: false
    });

    // También observar cambios en el contenido del campo (para inputs)
    if (numeroRegistroInput.type === 'text' || numeroRegistroInput.type === 'number') {
      // Ya tenemos los event listeners arriba, pero también podemos observar el objeto directamente
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', actualizarPeriodos);
  } else {
    actualizarPeriodos();
  }

  // Re-ejecutar después de un pequeño delay para asegurar que los campos estén disponibles
  setTimeout(actualizarPeriodos, 500);
})();
