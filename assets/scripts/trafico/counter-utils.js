/**
 * Utilidades de Contador - trafico.html
 * Funciones para gestionar el contador de pendientes
 *
 * @module trafico/counter-utils
 */

(function () {
  'use strict';

  /**
   * Actualiza el contador de pendientes automáticamente
   * Wrapper para la función global actualizarContador
   */
  window.actualizarContadorPendientes = function () {
    if (typeof window.actualizarContador === 'function') {
      return window.actualizarContador();
    }
    return null;
  };

  /**
   * Mantiene el contador fijo con optimización anti-bucle
   * Usa MutationObserver para detectar cambios y actualizar solo cuando es necesario
   */
  window.fijarContadorPendientes = function () {
    const contador = document.getElementById('contadorPendientesTrafico');
    if (!contador) {
      console.warn('⚠️ Contador no encontrado');
      return;
    }

    let ultimoValor = null;
    let actualizando = false;

    // Función para mantener el valor usando la nueva función
    const mantenerValor = () => {
      if (actualizando) {
        return;
      } // Evitar llamadas concurrentes

      actualizando = true;
      const valorActual = window.actualizarContador();

      // Solo actualizar si el valor cambió
      if (valorActual !== ultimoValor) {
        ultimoValor = valorActual;
        console.log(`🔄 Contador actualizado: ${valorActual}`);
      }

      actualizando = false;
    };

    // Actualizar inmediatamente
    mantenerValor();

    // Limpiar observers/intervals anteriores
    if (window._contadorObserver) {
      window._contadorObserver.disconnect();
      window._contadorObserver = null;
    }
    if (window._contadorInterval) {
      clearInterval(window._contadorInterval);
      window._contadorInterval = null;
    }

    // Crear un observer más eficiente (solo si el valor cambia externamente)
    window._contadorObserver = new MutationObserver(mutations => {
      let shouldUpdate = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const nuevoTexto = contador.textContent;
          if (nuevoTexto !== ultimoValor?.toString()) {
            shouldUpdate = true;
          }
        }
      });

      if (shouldUpdate && !actualizando) {
        setTimeout(mantenerValor, 200);
      }
    });

    window._contadorObserver.observe(contador, {
      childList: true,
      characterData: true,
      subtree: true
    });

    // Verificar cada 10 segundos (menos frecuente)
    window._contadorInterval = setInterval(() => {
      if (!actualizando) {
        mantenerValor();
      }
    }, 10000);

    console.log('✅ Contador fijado con optimización anti-bucle');
  };

  /**
   * Detiene el bucle de actualizaciones del contador
   * Limpia observers e intervals
   */
  window.detenerBucleContador = function () {
    console.log('🛑 Deteniendo bucle de contador...');

    // Limpiar observer
    if (window._contadorObserver) {
      window._contadorObserver.disconnect();
      window._contadorObserver = null;
      console.log('✅ Observer desconectado');
    }

    // Limpiar interval
    if (window._contadorInterval) {
      clearInterval(window._contadorInterval);
      window._contadorInterval = null;
      console.log('✅ Interval limpiado');
    }

    console.log('🎉 Bucle detenido completamente');
  };

  /**
   * Reinicia el contador limpiamente
   * Detiene todo y reinicia con sistema optimizado
   */
  window.reiniciarContador = function () {
    console.log('🔄 Reiniciando contador limpiamente...');

    // Primero detener todo
    window.detenerBucleContador();

    // Esperar un momento y reiniciar con sistema optimizado
    setTimeout(() => {
      try {
        // Una sola actualización manual
        if (typeof window.actualizarContador === 'function') {
          const valor = window.actualizarContador();
          console.log(`✅ Contador reiniciado con valor: ${valor}`);
        } else {
          console.warn('⚠️ actualizarContador no está disponible');
        }

        // Configurar sistema optimizado (sin bucles)
        if (typeof window.configurarContadorOptimizado === 'function') {
          window.configurarContadorOptimizado();
        } else {
          console.warn('⚠️ configurarContadorOptimizado no está disponible');
        }
      } catch (error) {
        console.error('❌ Error en reinicio de contador:', error);
      }
    }, 500);
  };

  /**
   * Configura contador optimizado (sin bucles infinitos)
   * Usa un sistema de actualización controlada
   */
  window.configurarContadorOptimizado = function () {
    console.log('⚙️ Configurando contador optimizado...');

    const contador = document.getElementById('contadorPendientesTrafico');
    if (!contador) {
      console.warn('⚠️ Contador no encontrado');
      return;
    }

    let ultimoValorConocido = null;
    let timeoutId = null;

    // Función de actualización controlada
    const actualizarSiEsNecesario = () => {
      if (timeoutId) {
        return;
      } // Ya hay una actualización pendiente

      timeoutId = setTimeout(() => {
        const valorActual = window.actualizarContador();
        if (valorActual !== ultimoValorConocido) {
          ultimoValorConocido = valorActual;
          console.log(`🔄 Contador actualizado (optimizado): ${valorActual}`);
        }
        timeoutId = null;
      }, 1000); // Actualizar cada segundo máximo
    };

    // Observer para detectar cambios externos
    const observer = new MutationObserver(() => {
      actualizarSiEsNecesario();
    });

    observer.observe(contador, {
      childList: true,
      characterData: true,
      subtree: true
    });

    // Actualización inicial
    actualizarSiEsNecesario();

    console.log('✅ Contador optimizado configurado');
  };

  /**
   * Carga el número activo de registro desde Firebase
   * Muestra el número como placeholder en el campo de registro
   * Y actualiza el header del topbar con el número activo (similar a facturación)
   */
  window.cargarNumeroActivoTrafico = async function () {
    console.log('🔄 cargarNumeroActivoTrafico ejecutándose...');
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (!numeroRegistroInput) {
      console.warn('⚠️ Campo numeroRegistro no encontrado');
      return;
    }

    let activeRegistrationNumber = null;
    console.log('🔍 Buscando número activo...');

    try {
      // Obtener número activo desde Firebase primero
      if (window.firebaseDb && window.fs && window.firebaseAuth?.currentUser?.isAnonymous) {
        const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
        const activeRef = window.fs.doc(
          window.firebaseDb,
          'system',
          `${demoTenantId}_active_number`
        );
        const activeDoc = await window.fs.getDoc(activeRef);

        if (activeDoc.exists() && activeDoc.data().number) {
          activeRegistrationNumber = activeDoc.data().number;
          console.log('✅ Número activo restaurado desde Firebase:', activeRegistrationNumber);

          // Actualizar localStorage con el valor de Firebase para mantener sincronización
          localStorage.setItem('activeRegistrationNumber', activeRegistrationNumber);
          console.log(
            '✅ localStorage actualizado con el número de Firebase:',
            activeRegistrationNumber
          );
        } else {
          console.log('📋 No hay número activo en Firebase');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error obteniendo número activo de Firebase:', error);
    }

    // Fallback: verificar localStorage solo si Firebase no tiene número activo
    if (!activeRegistrationNumber) {
      activeRegistrationNumber = localStorage.getItem('activeRegistrationNumber');
      console.log('🔍 Verificando localStorage, valor encontrado:', activeRegistrationNumber);
      if (activeRegistrationNumber && activeRegistrationNumber.trim() !== '') {
        console.log('📋 Número activo restaurado desde localStorage:', activeRegistrationNumber);
      } else {
        console.log('⚠️ No hay número activo en localStorage');
      }
    }

    if (activeRegistrationNumber && activeRegistrationNumber.trim() !== '') {
      // Mostrar como placeholder pero NO llenar el campo (para que el usuario pueda buscar)
      numeroRegistroInput.placeholder = `Ej: ${activeRegistrationNumber}`;
      numeroRegistroInput.value = ''; // Dejar vacío para que el usuario ingrese

      // IMPORTANTE: Actualizar el header del topbar con el número activo (como en facturación)
      console.log('🔄 Actualizando topbar header con número activo:', activeRegistrationNumber);
      const headerElement = document.getElementById('headerRegistrationNumber');
      if (headerElement) {
        const valorAnterior = headerElement.textContent;
        headerElement.textContent = activeRegistrationNumber;
        console.log(
          `✅ TOPBAR HEADER ACTUALIZADO: "${valorAnterior}" -> "${activeRegistrationNumber}"`
        );
      } else {
        console.warn(
          '⚠️ Elemento headerRegistrationNumber no encontrado, intentando con función global...'
        );
        if (typeof window.updateHeaderRegistrationNumber === 'function') {
          window.updateHeaderRegistrationNumber(activeRegistrationNumber);
          console.log(
            '✅ TOPBAR HEADER actualizado usando función global:',
            activeRegistrationNumber
          );
        } else {
          console.error('❌ Función updateHeaderRegistrationNumber no está disponible');
        }
      }

      console.log(
        '✅ Número activo mostrado como placeholder y header actualizado:',
        activeRegistrationNumber
      );
    } else {
      console.log('⚠️ No hay número activo disponible');
      numeroRegistroInput.placeholder = 'Ingresa el número de registro';

      // NO actualizar el topbar aquí prematuramente
      // Esperar a que RegistrationNumberBinding se inicialice completamente
      // El binding actualizará el topbar automáticamente cuando termine de inicializar
      // Si después de un tiempo razonable no hay número, entonces mostrar "-"
      setTimeout(() => {
        // Verificar si el binding ya se inicializó y tiene un número
        if (window.RegistrationNumberBinding && window.RegistrationNumberBinding._isInitialized) {
          const bindingNumber = window.RegistrationNumberBinding.get();
          if (!bindingNumber || bindingNumber === '-') {
            if (typeof window.updateHeaderRegistrationNumber === 'function') {
              window.updateHeaderRegistrationNumber('-');
            }
          }
        } else if (
          window.RegistrationNumberBinding &&
          !window.RegistrationNumberBinding._isInitialized
        ) {
          // Si el binding aún no está inicializado, esperar un poco más
          setTimeout(() => {
            if (
              window.RegistrationNumberBinding &&
              window.RegistrationNumberBinding._isInitialized
            ) {
              const bindingNumber = window.RegistrationNumberBinding.get();
              if (!bindingNumber || bindingNumber === '-') {
                if (typeof window.updateHeaderRegistrationNumber === 'function') {
                  window.updateHeaderRegistrationNumber('-');
                }
              }
            } else {
              // Si después de esperar aún no está inicializado, mostrar "-"
              if (typeof window.updateHeaderRegistrationNumber === 'function') {
                window.updateHeaderRegistrationNumber('-');
              }
            }
          }, 500);
        } else {
          // Si no hay binding disponible, mostrar "-"
          if (typeof window.updateHeaderRegistrationNumber === 'function') {
            window.updateHeaderRegistrationNumber('-');
          }
        }
      }, 300);
    }
  };
})();
