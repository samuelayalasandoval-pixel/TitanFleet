// Sistema de Monitoreo de Conexión a Internet
// Detecta cuando no hay internet y muestra notificaciones

(function () {
  'use strict';

  let isOnline = navigator.onLine;
  let notificationElement = null;

  // Función para mostrar notificación de sin conexión
  function showOfflineNotification() {
    // Si ya existe la notificación, no crear otra
    if (notificationElement && document.body.contains(notificationElement)) {
      return;
    }

    notificationElement = document.createElement('div');
    notificationElement.id = 'offlineNotification';
    notificationElement.className =
      'alert alert-warning alert-dismissible fade show position-fixed';
    notificationElement.style.cssText =
      'top: 20px; right: 20px; z-index: 10000; min-width: 350px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    notificationElement.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-wifi-slash fa-2x me-3 text-warning"></i>
                <div class="flex-grow-1">
                    <strong><i class="fas fa-exclamation-triangle"></i> Sin Conexión a Internet</strong>
                    <p class="mb-0 mt-1 small">No hay conexión a internet. Puede haber fallas en el sistema.</p>
                    <p class="mb-0 small"><strong>Recomendación:</strong> Espere a que haya conexión antes de registrar información.</p>
                </div>
                <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Cerrar" onclick="window.connectionMonitor.hideNotification()"></button>
            </div>
        `;

    document.body.appendChild(notificationElement);
    console.warn('⚠️ Notificación de sin conexión mostrada');
  }

  // Función para ocultar notificación
  function hideOfflineNotification() {
    if (notificationElement && document.body.contains(notificationElement)) {
      notificationElement.remove();
      notificationElement = null;
      console.log('✅ Notificación de sin conexión ocultada');
    }
  }

  // Función para verificar conexión
  // Usa navigator.onLine como indicador principal, Firebase solo como verificación opcional
  async function checkConnection() {
    // Usar navigator.onLine como indicador principal y confiable
    // Si el navegador dice que está online, confiar en eso
    if (!navigator.onLine) {
      return false;
    }

    // Si navigator.onLine es true, asumir que hay conexión
    // Firebase puede fallar por permisos, pero eso no significa que no hay internet
    const hasInternet = navigator.onLine;

    // Opcional: Intentar verificar con Firebase (pero no bloquear si falla)
    // Solo como verificación adicional, no como criterio principal
    if (hasInternet && window.firebaseDb && window.fs) {
      try {
        // Intentar leer un documento pequeño de Firebase con timeout corto
        const testRef = window.fs.doc(window.firebaseDb, 'system', 'connection_test');
        await Promise.race([
          window.fs.getDoc(testRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
        ]);
        // Si Firebase responde, confirmamos conexión
        return true;
      } catch (error) {
        // Si Firebase falla, NO asumir que no hay internet
        // Puede ser por permisos, timeout, o problemas de Firebase
        // Pero si navigator.onLine dice que hay conexión, confiar en eso
        const isPermissionError =
          error?.code === 'permission-denied' ||
          error?.message?.includes('Missing or insufficient permissions') ||
          error?.message === 'Timeout' ||
          error?.code === 'unavailable';

        if (!isPermissionError) {
          // Solo loggear errores inesperados, pero no cambiar el estado
          console.debug(
            '⚠️ Error verificando conexión con Firebase (pero navigator.onLine indica conexión):',
            error.message
          );
        }
        // Retornar el estado de navigator.onLine, no false
        return hasInternet;
      }
    }

    // Si no hay Firebase disponible, confiar en navigator.onLine
    return hasInternet;
  }

  // Función para actualizar estado de conexión
  async function updateConnectionStatus() {
    const wasOnline = isOnline;
    const newOnlineStatus = await checkConnection();

    // Solo actualizar si realmente cambió el estado
    // Esto evita notificaciones innecesarias cuando Firebase falla pero hay internet
    if (newOnlineStatus !== isOnline) {
      isOnline = newOnlineStatus;

      if (!wasOnline && isOnline) {
        // Conexión restaurada
        console.log('✅ Conexión a internet restaurada');
        hideOfflineNotification();
        if (typeof window.showNotification === 'function') {
          window.showNotification('Conexión a internet restaurada', 'success');
        }
      } else if (wasOnline && !isOnline) {
        // Solo mostrar notificación si navigator.onLine también indica offline
        // Esto evita falsos positivos cuando Firebase falla por otros motivos
        if (!navigator.onLine) {
          console.warn('⚠️ Conexión a internet perdida');
          showOfflineNotification();
        } else {
          // Si navigator.onLine dice que hay conexión, no mostrar notificación
          // Puede ser un problema temporal de Firebase
          console.debug('⚠️ Firebase no responde, pero navigator.onLine indica conexión activa');
          isOnline = true; // Mantener estado online si navigator.onLine lo confirma
        }
      }
    }

    // Actualizar estado global
    window.isOnline = isOnline;
    window.connectionStatus = isOnline ? 'online' : 'offline';

    return isOnline;
  }

  // Inicializar monitoreo
  function init() {
    console.log('🔌 Inicializando monitoreo de conexión...');

    // Verificar estado inicial
    updateConnectionStatus();

    // Escuchar eventos de conexión del navegador
    window.addEventListener('online', () => {
      console.log('📡 Evento "online" detectado');
      updateConnectionStatus();
    });

    window.addEventListener('offline', () => {
      console.log('📡 Evento "offline" detectado');
      updateConnectionStatus();
    });

    // Verificar conexión periódicamente (cada 10 segundos)
    setInterval(() => {
      updateConnectionStatus();
    }, 10000);

    console.log('✅ Monitoreo de conexión inicializado');
  }

  // Exponer API pública
  window.connectionMonitor = {
    isOnline: () => isOnline,
    checkConnection: checkConnection,
    updateStatus: updateConnectionStatus,
    showNotification: showOfflineNotification,
    hideNotification: hideOfflineNotification,
    init: init
  };

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
