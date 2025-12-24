/**
 * Sistema Centralizado de Manejo de Errores Mejorado
 *
 * Proporciona:
 * - Categorización de errores (críticos, advertencias, informativos)
 * - Notificaciones visuales al usuario para errores críticos
 * - Logging estructurado en formato JSON para análisis
 * - Mensajes de error amigables para usuarios
 * - Historial de errores para análisis
 * - Integración opcional con Firebase para logging remoto
 */

// Tipos de errores
const ErrorType = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
};

// Códigos de error comunes y sus mensajes amigables
const ERROR_MESSAGES = {
  // Errores de Firebase
  'permission-denied': 'No tienes permisos para realizar esta acción. Contacta al administrador.',
  unavailable: 'El servicio no está disponible temporalmente. Por favor, intenta más tarde.',
  unauthenticated: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  'network-error': 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.',
  'quota-exceeded': 'Se ha excedido el límite de almacenamiento. Contacta al administrador.',

  // Errores de validación
  'validation-error': 'Los datos ingresados no son válidos. Por favor, revisa el formulario.',
  'required-field': 'Este campo es obligatorio. Por favor, complétalo.',
  'invalid-format': 'El formato ingresado no es válido. Por favor, verifica el dato.',

  // Errores de operación
  'save-error': 'No se pudo guardar la información. Por favor, intenta nuevamente.',
  'load-error': 'No se pudieron cargar los datos. Por favor, recarga la página.',
  'delete-error': 'No se pudo eliminar el registro. Por favor, intenta nuevamente.',
  'update-error': 'No se pudo actualizar la información. Por favor, intenta nuevamente.',

  // Errores genéricos
  'unknown-error':
    'Ocurrió un error inesperado. Si el problema persiste, contacta al soporte técnico.',
  'timeout-error': 'La operación tardó demasiado tiempo. Por favor, intenta nuevamente.',
  'not-found': 'No se encontró la información solicitada.',

  // Errores de autenticación
  'auth-error': 'Error de autenticación. Por favor, inicia sesión nuevamente.',
  'session-expired': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',

  // Errores de exportación
  'export-error': 'No se pudo exportar el archivo. Por favor, intenta nuevamente.',
  'pdf-error': 'No se pudo generar el PDF. Por favor, intenta nuevamente.',
  'excel-error': 'No se pudo generar el archivo Excel. Por favor, intenta nuevamente.'
};

// Configuración por defecto
const DEFAULT_CONFIG = {
  showNotifications: true,
  showCriticalNotifications: true,
  showWarningNotifications: true,
  showInfoNotifications: false,
  logToConsole: true,
  structuredLogging: true, // Logging estructurado en formato JSON
  logToFirebase: false, // Logging remoto a Firebase (opcional)
  firebaseCollection: 'error_logs', // Colección de Firebase para logs
  maxHistorySize: 100,
  notificationDuration: {
    critical: 0, // Sin auto-cierre para errores críticos
    warning: 5000, // 5 segundos
    info: 3000, // 3 segundos
    success: 3000 // 3 segundos
  },
  // Nuevas funcionalidades
  groupSimilarErrors: true, // Agrupar errores similares
  groupTimeWindow: 60000, // Ventana de tiempo para agrupar (60 segundos)
  rateLimitEnabled: true, // Habilitar rate limiting
  rateLimitMax: 5, // Máximo de notificaciones
  rateLimitWindow: 60000, // Ventana de tiempo (60 segundos)
  persistHistory: true, // Persistir historial en localStorage
  persistKey: 'erp_error_history', // Clave para localStorage
  persistCriticalOnly: false, // Solo persistir errores críticos
  silentMode: false, // Modo silencioso (no mostrar notificaciones)
  maxPersistedHistory: 50, // Máximo de errores persistidos
  friendlyMessages: true, // Mostrar mensajes amigables para usuarios
  logLevel: 'info' // Nivel mínimo de logging: 'debug', 'info', 'warning', 'error'
};

class ErrorHandler {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errorHistory = [];
    this.notificationContainer = null;
    this.errorGroups = new Map(); // Para agrupar errores similares
    this.rateLimitCounter = []; // Para rate limiting
    this.loadUserPreferences(); // Cargar preferencias del usuario
    this.init();
  }

  /**
   * Inicializar el sistema
   */
  init() {
    this.createNotificationContainer();
    this.setupGlobalErrorHandlers();
    this.loadPersistedHistory();
    this.setupPeriodicCleanup();
    this.logStructured('info', 'Sistema de manejo de errores inicializado', {
      component: 'ErrorHandler'
    });
  }

  /**
   * Cargar preferencias del usuario desde localStorage
   */
  loadUserPreferences() {
    try {
      const prefs = localStorage.getItem('erp_error_handler_prefs');
      if (prefs) {
        const parsed = JSON.parse(prefs);
        this.config = { ...this.config, ...parsed };
      }
    } catch (e) {
      console.warn('Error cargando preferencias de errores:', e);
    }
  }

  /**
   * Guardar preferencias del usuario
   */
  saveUserPreferences() {
    try {
      const prefsToSave = {
        showNotifications: this.config.showNotifications,
        showCriticalNotifications: this.config.showCriticalNotifications,
        showWarningNotifications: this.config.showWarningNotifications,
        showInfoNotifications: this.config.showInfoNotifications,
        silentMode: this.config.silentMode
      };
      localStorage.setItem('erp_error_handler_prefs', JSON.stringify(prefsToSave));
    } catch (e) {
      console.warn('Error guardando preferencias de errores:', e);
    }
  }

  /**
   * Cargar historial persistido
   */
  loadPersistedHistory() {
    if (!this.config.persistHistory) {
      return;
    }

    try {
      const persisted = localStorage.getItem(this.config.persistKey);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        // Agregar errores persistidos al historial
        this.errorHistory = parsed.concat(this.errorHistory);
        // Limitar tamaño
        if (this.errorHistory.length > this.config.maxHistorySize) {
          this.errorHistory = this.errorHistory.slice(-this.config.maxHistorySize);
        }
      }
    } catch (e) {
      console.warn('Error cargando historial persistido:', e);
    }
  }

  /**
   * Persistir historial
   */
  persistHistory() {
    if (!this.config.persistHistory) {
      return;
    }

    try {
      let toPersist = this.errorHistory;
      if (this.config.persistCriticalOnly) {
        toPersist = this.errorHistory.filter(e => e.type === ErrorType.CRITICAL);
      }

      // Limitar cantidad
      if (toPersist.length > this.config.maxPersistedHistory) {
        toPersist = toPersist.slice(-this.config.maxPersistedHistory);
      }

      localStorage.setItem(this.config.persistKey, JSON.stringify(toPersist));
    } catch (e) {
      console.warn('Error persistiendo historial:', e);
    }
  }

  /**
   * Configurar limpieza periódica
   */
  setupPeriodicCleanup() {
    // Limpiar grupos de errores antiguos cada 5 minutos
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, group] of this.errorGroups.entries()) {
          if (now - group.lastOccurrence > this.config.groupTimeWindow * 2) {
            this.errorGroups.delete(key);
          }
        }

        // Limpiar rate limit counter
        const windowStart = now - this.config.rateLimitWindow;
        this.rateLimitCounter = this.rateLimitCounter.filter(t => t > windowStart);
      },
      5 * 60 * 1000
    );
  }

  /**
   * Crear contenedor para notificaciones
   */
  createNotificationContainer() {
    // Verificar si ya existe
    if (document.getElementById('error-handler-container')) {
      this.notificationContainer = document.getElementById('error-handler-container');
      return;
    }

    // Crear contenedor
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'error-handler-container';
    this.notificationContainer.className = 'error-handler-container';
    this.notificationContainer.setAttribute('aria-live', 'polite');
    this.notificationContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.notificationContainer);
  }

  /**
   * Configurar manejadores globales de errores
   */
  setupGlobalErrorHandlers() {
    // Capturar errores no manejados
    window.addEventListener('error', event => {
      this.handleError(
        {
          message: event.message,
          source: event.filename,
          line: event.lineno,
          column: event.colno,
          error: event.error
        },
        ErrorType.CRITICAL,
        {
          context: {
            eventType: 'unhandled-error',
            filename: event.filename,
            line: event.lineno,
            column: event.colno
          }
        }
      );
    });

    // Capturar promesas rechazadas sin catch
    window.addEventListener('unhandledrejection', event => {
      this.handleError(
        {
          message: event.reason?.message || 'Promise rechazada',
          error: event.reason
        },
        ErrorType.CRITICAL,
        {
          context: {
            eventType: 'unhandled-rejection',
            reason: event.reason
          }
        }
      );
    });
  }

  /**
   * Obtener mensaje amigable para el usuario
   */
  getFriendlyMessage(error, originalMessage) {
    if (!this.config.friendlyMessages) {
      return originalMessage;
    }

    // Intentar extraer código de error de Firebase
    if (error && typeof error === 'object') {
      const code = error.code || error.error?.code;
      if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
      }
    }

    // Buscar patrones en el mensaje
    const messageLower = originalMessage.toLowerCase();
    for (const [key, friendlyMsg] of Object.entries(ERROR_MESSAGES)) {
      if (messageLower.includes(key.replace('-', ' '))) {
        return friendlyMsg;
      }
    }

    // Si el mensaje contiene información técnica, simplificarlo
    if (messageLower.includes('firebase') || messageLower.includes('permission')) {
      return ERROR_MESSAGES['permission-denied'];
    }
    if (messageLower.includes('network') || messageLower.includes('fetch')) {
      return ERROR_MESSAGES['network-error'];
    }
    if (messageLower.includes('timeout')) {
      return ERROR_MESSAGES['timeout-error'];
    }
    if (messageLower.includes('not found') || messageLower.includes('404')) {
      return ERROR_MESSAGES['not-found'];
    }

    // Si no hay coincidencia, usar mensaje genérico si es muy técnico
    if (originalMessage.includes('Error:') || originalMessage.includes('Exception:')) {
      return ERROR_MESSAGES['unknown-error'];
    }

    return originalMessage;
  }

  /**
   * Logging estructurado en formato JSON
   */
  logStructured(level, message, data = {}) {
    if (!this.config.structuredLogging) {
      return;
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      ...data,
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId()
      }
    };

    // Log a consola en formato estructurado
    if (this.config.logToConsole) {
      const logMethod = this.getLogMethod(level);
      logMethod(JSON.stringify(logEntry, null, 2));
    }

    // Log a Firebase si está habilitado
    if (this.config.logToFirebase && this.shouldLogToFirebase(level)) {
      this.logToFirebase(logEntry).catch(err => {
        console.warn('Error enviando log a Firebase:', err);
      });
    }

    return logEntry;
  }

  /**
   * Determinar método de log según nivel
   */
  getLogMethod(level) {
    switch (level) {
      case 'error':
      case 'critical':
        return console.error.bind(console);
      case 'warning':
        return console.warn.bind(console);
      case 'debug':
        return console.debug.bind(console);
      default:
        return console.log.bind(console);
    }
  }

  /**
   * Determinar si se debe loguear a Firebase según nivel
   */
  shouldLogToFirebase(level) {
    const levels = ['debug', 'info', 'warning', 'error', 'critical'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const currentLevel = levels.indexOf(level);
    return currentLevel >= configLevel;
  }

  /**
   * Log a Firebase (opcional)
   */
  async logToFirebase(logEntry) {
    if (!this.config.logToFirebase) {
      return;
    }

    try {
      // Verificar si Firebase está disponible
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        return;
      }

      const db = firebase.firestore();
      if (!db) {
        return;
      }

      // Agregar log a Firebase
      await db.collection(this.config.firebaseCollection).add({
        ...logEntry,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      // No loguear errores de logging para evitar loops infinitos
      console.warn('Error enviando log a Firebase:', error);
    }
  }

  /**
   * Obtener ID de sesión
   */
  getSessionId() {
    try {
      let sessionId = sessionStorage.getItem('erp_session_id');
      if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('erp_session_id', sessionId);
      }
      return sessionId;
    } catch (e) {
      return 'unknown-session';
    }
  }

  /**
   * Manejar un error
   * @param {Object|string|Error} error - El error a manejar
   * @param {string} type - Tipo de error (ErrorType)
   * @param {Object} options - Opciones adicionales
   */
  handleError(error, type = ErrorType.WARNING, options = {}) {
    const errorData = this.normalizeError(error, type, options);

    // Obtener mensaje amigable para el usuario
    const friendlyMessage = this.getFriendlyMessage(error, errorData.message);
    errorData.friendlyMessage = friendlyMessage;
    errorData.userMessage = options.userMessage || friendlyMessage;

    // Logging estructurado
    this.logStructured(type === ErrorType.CRITICAL ? 'error' : type, errorData.message, {
      errorId: errorData.id,
      type: errorData.type,
      source: errorData.source,
      stack: errorData.stack,
      context: errorData.context,
      friendlyMessage: friendlyMessage
    });

    // Verificar modo silencioso
    if (this.config.silentMode && type !== ErrorType.CRITICAL) {
      // Solo agregar al historial y log, no mostrar notificación
      this.addToHistory(errorData);
      return errorData;
    }

    // Agrupar errores similares si está habilitado
    if (this.config.groupSimilarErrors && this.shouldShowNotification(type)) {
      const grouped = this.groupError(errorData);
      if (grouped) {
        // Error agrupado, actualizar notificación existente
        return grouped;
      }
    }

    // Verificar rate limiting
    if (this.config.rateLimitEnabled && this.shouldShowNotification(type)) {
      if (!this.checkRateLimit()) {
        // Rate limit excedido, solo agregar al historial y log
        this.addToHistory(errorData);
        // Mostrar una notificación de rate limit solo una vez
        if (!this.rateLimitNotified) {
          this.rateLimitNotified = true;
          setTimeout(() => {
            this.rateLimitNotified = false;
          }, this.config.rateLimitWindow);

          const rateLimitError = this.normalizeError(
            'Demasiadas notificaciones. Los errores se están registrando en el historial.',
            ErrorType.WARNING,
            { context: { rateLimited: true } }
          );
          this.showNotification(rateLimitError);
        }
        return errorData;
      }
    }

    // Agregar al historial
    this.addToHistory(errorData);

    // Persistir historial
    this.persistHistory();

    // Mostrar notificación si corresponde
    if (this.shouldShowNotification(type)) {
      // Obtener count del grupo si existe
      const groupKey = `${errorData.type}:${errorData.message}:${errorData.source || 'unknown'}`;
      const group = this.errorGroups.get(groupKey);
      const count = group ? group.count : null;
      this.showNotification(errorData, count);
    }

    return errorData;
  }

  /**
   * Agrupar errores similares
   */
  groupError(errorData) {
    const groupKey = `${errorData.type}:${errorData.message}:${errorData.source || 'unknown'}`;
    const now = Date.now();

    if (this.errorGroups.has(groupKey)) {
      const group = this.errorGroups.get(groupKey);
      const timeSinceLastOccurrence = now - group.lastOccurrence;

      // Si ocurrió dentro de la ventana de tiempo, agrupar
      if (timeSinceLastOccurrence < this.config.groupTimeWindow) {
        group.count++;
        group.lastOccurrence = now;
        group.errors.push(errorData);

        // Actualizar notificación existente
        this.updateGroupedNotification(group);

        return errorData;
      }
    }

    // Crear nuevo grupo
    this.errorGroups.set(groupKey, {
      key: groupKey,
      count: 1,
      firstOccurrence: now,
      lastOccurrence: now,
      errors: [errorData],
      toastElement: null
    });

    return null;
  }

  /**
   * Actualizar notificación agrupada
   */
  updateGroupedNotification(group) {
    if (!group.toastElement || !group.toastElement.isConnected) {
      // Notificación ya fue removida, crear nueva
      return;
    }

    const countBadge = group.toastElement.querySelector('.error-group-count');
    if (countBadge) {
      countBadge.textContent = group.count > 1 ? ` (${group.count}x)` : '';
    }

    // Actualizar timestamp
    const timeElement = group.toastElement.querySelector('.toast-time');
    if (timeElement) {
      timeElement.textContent = new Date(group.lastOccurrence).toLocaleTimeString();
    }
  }

  /**
   * Verificar rate limiting
   */
  checkRateLimit() {
    if (!this.config.rateLimitEnabled) {
      return true;
    }

    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;

    // Limpiar timestamps fuera de la ventana
    this.rateLimitCounter = this.rateLimitCounter.filter(t => t > windowStart);

    // Verificar si se excedió el límite
    if (this.rateLimitCounter.length >= this.config.rateLimitMax) {
      return false;
    }

    // Agregar timestamp actual
    this.rateLimitCounter.push(now);
    return true;
  }

  /**
   * Normalizar el error a un formato estándar
   */
  normalizeError(error, type, options) {
    let message = '';
    let stack = null;
    let source = null;
    let errorCode = null;
    const timestamp = new Date().toISOString();

    // Manejar diferentes formatos de error
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else if (error && typeof error === 'object') {
      message = error.message || error.error?.message || 'Error desconocido';
      stack = error.stack || error.error?.stack;
      source = error.source || error.filename;
      errorCode = error.code || error.error?.code;
    } else {
      message = 'Error desconocido';
    }

    // Incluir mensaje personalizado de options si existe
    if (options.userMessage) {
      message = options.userMessage;
    }

    return {
      id: this.generateId(),
      type,
      message,
      errorCode,
      stack,
      source,
      timestamp,
      context: options.context || {},
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        ...options.metadata
      }
    };
  }

  /**
   * Generar ID único para el error
   */
  generateId() {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Agregar error al historial
   */
  addToHistory(errorData) {
    this.errorHistory.push(errorData);

    // Limitar tamaño del historial
    if (this.errorHistory.length > this.config.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * Determinar si se debe mostrar notificación
   */
  shouldShowNotification(type) {
    if (!this.config.showNotifications) {
      return false;
    }

    switch (type) {
      case ErrorType.CRITICAL:
        return this.config.showCriticalNotifications;
      case ErrorType.WARNING:
        return this.config.showWarningNotifications;
      case ErrorType.INFO:
        return this.config.showInfoNotifications;
      default:
        return false;
    }
  }

  /**
   * Log a consola con formato según tipo (mantener compatibilidad)
   */
  logToConsole(errorData) {
    if (!this.config.logToConsole) {
      return;
    }

    const prefix = this.getConsolePrefix(errorData.type);
    const timestamp = new Date(errorData.timestamp).toLocaleTimeString();

    console.group(`${prefix} [${timestamp}] ${errorData.userMessage || errorData.message}`);

    if (errorData.source) {
      console.log('📍 Fuente:', errorData.source);
    }

    if (errorData.errorCode) {
      console.log('🔑 Código de error:', errorData.errorCode);
    }

    if (errorData.context && Object.keys(errorData.context).length > 0) {
      console.log('📋 Contexto:', errorData.context);
    }

    if (errorData.stack) {
      console.error('📚 Stack trace:', errorData.stack);
    }

    if (errorData.metadata && Object.keys(errorData.metadata).length > 0) {
      console.log('🔍 Metadata:', errorData.metadata);
    }

    console.groupEnd();
  }

  /**
   * Obtener prefijo de consola según tipo
   */
  getConsolePrefix(type) {
    switch (type) {
      case ErrorType.CRITICAL:
        return '❌ ERROR CRÍTICO';
      case ErrorType.WARNING:
        return '⚠️ ADVERTENCIA';
      case ErrorType.INFO:
        return 'ℹ️ INFORMACIÓN';
      case ErrorType.SUCCESS:
        return '✅ ÉXITO';
      default:
        return '📌 NOTA';
    }
  }

  /**
   * Mostrar notificación visual
   */
  showNotification(errorData, groupCount = null) {
    // Si es un error agrupado, intentar actualizar la notificación existente
    if (groupCount && groupCount > 1) {
      const groupKey = `${errorData.type}:${errorData.message}:${errorData.source || 'unknown'}`;
      const group = this.errorGroups.get(groupKey);
      if (group && group.toastElement && group.toastElement.isConnected) {
        this.updateGroupedNotification(group);
        return;
      }
    }

    const toast = this.createToastElement(errorData, groupCount);
    this.notificationContainer.appendChild(toast);

    // Verificar que Bootstrap esté disponible
    if (typeof bootstrap === 'undefined' || !bootstrap.Toast) {
      // Fallback: usar alert si Bootstrap no está disponible
      console.warn('Bootstrap no está disponible, usando alert como fallback');
      setTimeout(() => {
        const message =
          groupCount && groupCount > 1
            ? `${errorData.userMessage || errorData.message} (${groupCount} veces)`
            : errorData.userMessage || errorData.message;
        alert(`${this.getTitleForType(errorData.type)}: ${message}`);
        toast.remove();
      }, 100);
      return;
    }

    // Inicializar toast de Bootstrap
    try {
      const bootstrapToast = new bootstrap.Toast(toast, {
        autohide: errorData.type !== ErrorType.CRITICAL,
        delay: this.config.notificationDuration[errorData.type] || 5000
      });

      // Agregar listener para limpiar el elemento después de cerrar
      toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
        // Limpiar referencia del grupo
        if (groupCount && groupCount > 1) {
          const groupKey = `${errorData.type}:${errorData.message}:${errorData.source || 'unknown'}`;
          const group = this.errorGroups.get(groupKey);
          if (group) {
            group.toastElement = null;
          }
        }
      });

      // Mostrar toast
      bootstrapToast.show();
    } catch (e) {
      // Fallback si hay error al crear el toast
      console.error('Error mostrando notificación:', e);
      setTimeout(() => {
        toast.remove();
      }, this.config.notificationDuration[errorData.type] || 5000);
    }
  }

  /**
   * Crear elemento de toast de Bootstrap
   */
  createToastElement(errorData, groupCount = null) {
    const toast = document.createElement('div');
    toast.className = 'toast error-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.dataset.errorId = errorData.id;
    toast.dataset.errorType = errorData.type;

    const icon = this.getIconForType(errorData.type);
    const bgClass = this.getBgClassForType(errorData.type);
    const headerClass = this.getHeaderClassForType(errorData.type);
    const countBadge =
      groupCount && groupCount > 1
        ? `<span class="badge bg-light text-dark error-group-count">${groupCount}x</span>`
        : '';
    const displayMessage = errorData.userMessage || errorData.friendlyMessage || errorData.message;

    toast.innerHTML = `
            <div class="toast-header ${headerClass}">
                <i class="${icon} me-2"></i>
                <strong class="me-auto">${this.getTitleForType(errorData.type)}${countBadge}</strong>
                <small class="text-muted toast-time">${new Date(errorData.timestamp).toLocaleTimeString()}</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>
            <div class="toast-body ${bgClass}">
                ${this.escapeHtml(displayMessage)}
                ${
  errorData.context &&
                  Object.keys(errorData.context).length > 0 &&
                  !errorData.context.rateLimited
    ? `<div class="mt-2"><small class="text-muted">Contexto: ${JSON.stringify(errorData.context)}</small></div>`
    : ''
}
            </div>
        `;

    // Si es un error agrupado, guardar referencia en el grupo
    if (groupCount && groupCount > 1) {
      const groupKey = `${errorData.type}:${errorData.message}:${errorData.source || 'unknown'}`;
      const group = this.errorGroups.get(groupKey);
      if (group) {
        group.toastElement = toast;
      }
    }

    return toast;
  }

  /**
   * Obtener icono según tipo
   */
  getIconForType(type) {
    switch (type) {
      case ErrorType.CRITICAL:
        return 'fas fa-exclamation-circle';
      case ErrorType.WARNING:
        return 'fas fa-exclamation-triangle';
      case ErrorType.INFO:
        return 'fas fa-info-circle';
      case ErrorType.SUCCESS:
        return 'fas fa-check-circle';
      default:
        return 'fas fa-bell';
    }
  }

  /**
   * Obtener clase de fondo según tipo
   */
  getBgClassForType(type) {
    switch (type) {
      case ErrorType.CRITICAL:
        return 'bg-danger text-white';
      case ErrorType.WARNING:
        return 'bg-warning text-dark';
      case ErrorType.INFO:
        return 'bg-info text-white';
      case ErrorType.SUCCESS:
        return 'bg-success text-white';
      default:
        return '';
    }
  }

  /**
   * Obtener clase de header según tipo
   */
  getHeaderClassForType(type) {
    switch (type) {
      case ErrorType.CRITICAL:
        return 'bg-danger text-white';
      case ErrorType.WARNING:
        return 'bg-warning text-dark';
      case ErrorType.INFO:
        return 'bg-info text-white';
      case ErrorType.SUCCESS:
        return 'bg-success text-white';
      default:
        return '';
    }
  }

  /**
   * Obtener título según tipo
   */
  getTitleForType(type) {
    switch (type) {
      case ErrorType.CRITICAL:
        return 'Error Crítico';
      case ErrorType.WARNING:
        return 'Advertencia';
      case ErrorType.INFO:
        return 'Información';
      case ErrorType.SUCCESS:
        return 'Éxito';
      default:
        return 'Notificación';
    }
  }

  /**
   * Escapar HTML para prevenir XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Obtener ID de usuario actual
   */
  getCurrentUserId() {
    try {
      return (
        window.firebaseAuth?.currentUser?.uid ||
        window.erpAuth?.currentUser?.id ||
        sessionStorage.getItem('userId') ||
        'unknown'
      );
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * Métodos de conveniencia para diferentes tipos de errores
   */
  critical(error, options = {}) {
    return this.handleError(error, ErrorType.CRITICAL, options);
  }

  warning(error, options = {}) {
    return this.handleError(error, ErrorType.WARNING, options);
  }

  info(error, options = {}) {
    return this.handleError(error, ErrorType.INFO, options);
  }

  success(message, options = {}) {
    return this.handleError(message, ErrorType.SUCCESS, options);
  }

  /**
   * Obtener historial de errores
   */
  getHistory(filter = {}) {
    if (!filter || Object.keys(filter).length === 0) {
      return [...this.errorHistory];
    }

    return this.errorHistory.filter(error => {
      if (filter.type && error.type !== filter.type) {
        return false;
      }
      if (filter.fromDate && new Date(error.timestamp) < new Date(filter.fromDate)) {
        return false;
      }
      if (filter.toDate && new Date(error.timestamp) > new Date(filter.toDate)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Limpiar historial
   */
  clearHistory() {
    this.errorHistory = [];
    this.logStructured('info', 'Historial de errores limpiado', { component: 'ErrorHandler' });
  }

  /**
   * Exportar historial para análisis
   */
  exportHistory(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.errorHistory, null, 2);
    } else if (format === 'csv') {
      const headers = [
        'Timestamp',
        'Tipo',
        'Mensaje',
        'Mensaje Amigable',
        'Fuente',
        'Usuario',
        'Código de Error'
      ];
      const rows = this.errorHistory.map(e => [
        e.timestamp,
        e.type,
        e.message,
        e.friendlyMessage || e.userMessage || '',
        e.source || '',
        e.metadata?.userId || '',
        e.errorCode || ''
      ]);
      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
    return this.errorHistory;
  }

  /**
   * Configurar opciones
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
    // Guardar preferencias si es configuración de usuario
    if (
      newConfig.silentMode !== undefined ||
      newConfig.showNotifications !== undefined ||
      newConfig.showCriticalNotifications !== undefined ||
      newConfig.showWarningNotifications !== undefined ||
      newConfig.showInfoNotifications !== undefined
    ) {
      this.saveUserPreferences();
    }
  }

  /**
   * Activar/desactivar modo silencioso
   */
  setSilentMode(enabled) {
    this.config.silentMode = enabled;
    this.saveUserPreferences();
  }

  /**
   * Obtener estadísticas de errores
   */
  getStatistics() {
    const stats = {
      total: this.errorHistory.length,
      byType: {
        critical: 0,
        warning: 0,
        info: 0,
        success: 0
      },
      groups: this.errorGroups.size,
      rateLimitActive: this.rateLimitCounter.length >= this.config.rateLimitMax
    };

    this.errorHistory.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Obtener errores agrupados
   */
  getGroupedErrors() {
    const grouped = [];
    for (const [key, group] of this.errorGroups.entries()) {
      grouped.push({
        key,
        message: group.errors[0].message,
        type: group.errors[0].type,
        count: group.count,
        firstOccurrence: group.firstOccurrence,
        lastOccurrence: group.lastOccurrence,
        errors: group.errors
      });
    }
    return grouped.sort((a, b) => b.count - a.count);
  }
}

// Crear instancia global
window.ErrorHandler = ErrorHandler;
window.ErrorType = ErrorType;
window.ERROR_MESSAGES = ERROR_MESSAGES; // Exponer para uso externo

// Crear instancia por defecto
window.errorHandler = new ErrorHandler();

// Exponer funciones de conveniencia globales
window.handleError = (error, type, options) =>
  window.errorHandler.handleError(error, type, options);
window.handleCritical = (error, options) => window.errorHandler.critical(error, options);
window.handleWarning = (error, options) => window.errorHandler.warning(error, options);
window.handleInfo = (error, options) => window.errorHandler.info(error, options);
window.handleSuccess = (message, options) => window.errorHandler.success(message, options);

// Wrapper para reemplazar console.error
window.logError = (error, context = {}) => {
  if (error instanceof Error) {
    window.errorHandler.critical(error, { context });
  } else {
    window.errorHandler.critical(error, { context });
  }
};

// Wrapper para reemplazar alert() con mensajes de error
window.showErrorAlert = (message, type = 'error') => {
  const errorType =
    type === 'error'
      ? ErrorType.CRITICAL
      : type === 'warning'
        ? ErrorType.WARNING
        : type === 'success'
          ? ErrorType.SUCCESS
          : ErrorType.INFO;
  window.errorHandler.handleError(message, errorType, {});
};

// Compatibilidad con showNotification existente
window.showNotification = (message, type = 'info') => {
  const errorType =
    type === 'error'
      ? ErrorType.CRITICAL
      : type === 'warning'
        ? ErrorType.WARNING
        : type === 'success'
          ? ErrorType.SUCCESS
          : ErrorType.INFO;
  window.errorHandler.handleError(message, errorType, {});
};

console.log('✅ Sistema de manejo de errores mejorado cargado');
