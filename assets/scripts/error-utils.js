/**
 * Utilidades para Manejo Centralizado de Errores
 *
 * Este archivo proporciona funciones helper para centralizar
 * el manejo de errores en toda la aplicación.
 */

/**
 * Wrapper para try-catch que maneja errores automáticamente
 * @param {Function} fn - Función a ejecutar
 * @param {Object} options - Opciones de manejo de errores
 * @returns {Promise|any} - Resultado de la función o undefined si hay error
 */
window.safeExecute = async function (fn, options = {}) {
  const {
    errorType = window.ErrorType?.WARNING || 'warning',
    userMessage = null,
    context = {},
    silent = false,
    onError = null
  } = options;

  try {
    const result = await fn();
    return result;
  } catch (error) {
    if (!silent && window.errorHandler) {
      window.errorHandler.handleError(error, errorType, {
        userMessage,
        context: {
          ...context,
          functionName: fn.name || 'anonymous'
        }
      });
    }

    if (onError && typeof onError === 'function') {
      onError(error);
    }

    return undefined;
  }
};

/**
 * Wrapper para operaciones de Firebase que maneja errores comunes
 * @param {Function} firebaseOperation - Operación de Firebase a ejecutar
 * @param {Object} options - Opciones de manejo de errores
 * @returns {Promise} - Resultado de la operación
 */
window.safeFirebaseOperation = async function (firebaseOperation, options = {}) {
  const { userMessage = null, context = {}, silent = false } = options;

  try {
    return firebaseOperation();
  } catch (error) {
    // Mapear errores comunes de Firebase a mensajes amigables
    let friendlyMessage = userMessage;

    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          friendlyMessage = friendlyMessage || 'No tienes permisos para realizar esta acción.';
          break;
        case 'unavailable':
          friendlyMessage = friendlyMessage || 'El servicio no está disponible temporalmente.';
          break;
        case 'unauthenticated':
          friendlyMessage =
            friendlyMessage || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          break;
        case 'network-error':
        case 'failed-precondition':
          friendlyMessage =
            friendlyMessage || 'Error de conexión. Verifica tu conexión a internet.';
          break;
        default:
          friendlyMessage = friendlyMessage || 'Ocurrió un error al procesar la solicitud.';
      }
    }

    if (!silent && window.errorHandler) {
      window.errorHandler.handleError(error, window.ErrorType?.WARNING || 'warning', {
        userMessage: friendlyMessage,
        context: {
          ...context,
          firebaseErrorCode: error.code,
          firebaseError: error.message
        }
      });
    }

    throw error; // Re-lanzar para que el llamador pueda manejarlo si es necesario
  }
};

/**
 * Wrapper para validación de formularios
 * @param {HTMLElement} form - Elemento del formulario
 * @param {Object} validationRules - Reglas de validación
 * @returns {Object} - { valid: boolean, errors: Array }
 */
window.validateForm = function (form, validationRules = {}) {
  const errors = [];
  const formData = new FormData(form);

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const field =
      form.querySelector(`[name="${fieldName}"]`) || form.querySelector(`#${fieldName}`);
    const value = formData.get(fieldName) || (field ? field.value : '');

    // Validar campo requerido
    if (rules.required && !value) {
      errors.push({
        field: fieldName,
        message: rules.requiredMessage || `${fieldName} es requerido`
      });
      continue;
    }

    // Validar formato
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors.push({
        field: fieldName,
        message: rules.formatMessage || `${fieldName} tiene un formato inválido`
      });
    }

    // Validar longitud
    if (value && rules.minLength && value.length < rules.minLength) {
      errors.push({
        field: fieldName,
        message:
          rules.minLengthMessage || `${fieldName} debe tener al menos ${rules.minLength} caracteres`
      });
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors.push({
        field: fieldName,
        message:
          rules.maxLengthMessage ||
          `${fieldName} no puede tener más de ${rules.maxLength} caracteres`
      });
    }
  }

  if (errors.length > 0 && window.errorHandler) {
    window.errorHandler.handleError(
      `Errores de validación en el formulario: ${errors.map(e => e.message).join(', ')}`,
      window.ErrorType?.WARNING || 'warning',
      {
        userMessage: 'Por favor, corrige los errores en el formulario.',
        context: {
          formId: form.id || 'unknown',
          errors: errors
        }
      }
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Helper para manejar errores de operaciones asíncronas
 * @param {Promise} promise - Promesa a manejar
 * @param {Object} options - Opciones de manejo
 * @returns {Promise} - Promesa con manejo de errores
 */
window.handleAsyncError = function (promise, options = {}) {
  const {
    errorType = window.ErrorType?.WARNING || 'warning',
    userMessage = null,
    context = {},
    silent = false
  } = options;

  return promise.catch(error => {
    if (!silent && window.errorHandler) {
      window.errorHandler.handleError(error, errorType, {
        userMessage,
        context
      });
    }
    throw error;
  });
};

/**
 * Helper para reemplazar console.error con manejo centralizado
 */
window.consoleError = function (...args) {
  // Mantener el comportamiento original de console.error
  console.error(...args);

  // También registrar en el sistema centralizado
  if (window.errorHandler && args.length > 0) {
    const error = args[0];
    const context = args.slice(1);

    window.errorHandler.warning(error, {
      context: {
        consoleArgs: context,
        source: 'console.error'
      }
    });
  }
};

/**
 * Helper para reemplazar alert() con notificaciones del sistema
 */
window.showAlert = function (message, type = 'info') {
  if (window.errorHandler) {
    const errorType =
      type === 'error'
        ? window.ErrorType?.CRITICAL
        : type === 'warning'
          ? window.ErrorType?.WARNING
          : type === 'success'
            ? window.ErrorType?.SUCCESS
            : window.ErrorType?.INFO;
    window.errorHandler.handleError(message, errorType, {});
  } else {
    // Fallback a alert nativo si el sistema no está disponible
    alert(message);
  }
};

/**
 * Helper para operaciones de guardado con manejo de errores
 */
window.safeSave = async function (saveFunction, options = {}) {
  const {
    successMessage = 'Datos guardados correctamente',
    errorMessage = 'Error al guardar los datos',
    context = {}
  } = options;

  try {
    const result = await saveFunction();

    if (window.errorHandler) {
      window.errorHandler.success(successMessage, {
        context: {
          ...context,
          operation: 'save'
        }
      });
    }

    return result;
  } catch (error) {
    if (window.errorHandler) {
      window.errorHandler.critical(error, {
        userMessage: errorMessage,
        context: {
          ...context,
          operation: 'save'
        }
      });
    }
    throw error;
  }
};

/**
 * Helper para operaciones de carga con manejo de errores
 */
window.safeLoad = async function (loadFunction, options = {}) {
  const { errorMessage = 'Error al cargar los datos', context = {} } = options;

  try {
    return loadFunction();
  } catch (error) {
    if (window.errorHandler) {
      window.errorHandler.warning(error, {
        userMessage: errorMessage,
        context: {
          ...context,
          operation: 'load'
        }
      });
    }
    throw error;
  }
};

/**
 * Helper para operaciones de eliminación con manejo de errores
 */
window.safeDelete = async function (deleteFunction, options = {}) {
  const {
    successMessage = 'Registro eliminado correctamente',
    errorMessage = 'Error al eliminar el registro',
    context = {}
  } = options;

  try {
    const result = await deleteFunction();

    if (window.errorHandler) {
      window.errorHandler.success(successMessage, {
        context: {
          ...context,
          operation: 'delete'
        }
      });
    }

    return result;
  } catch (error) {
    if (window.errorHandler) {
      window.errorHandler.critical(error, {
        userMessage: errorMessage,
        context: {
          ...context,
          operation: 'delete'
        }
      });
    }
    throw error;
  }
};

console.log('✅ Utilidades de manejo de errores cargadas');
