/**
 * Utilidades Comunes Reutilizables
 * Funciones de ayuda para formateo, validación, etc.
 */

const ERPUtils = {
  /**
   * Formatea un número como moneda
   * @param {number} value - Valor a formatear
   * @param {string} currency - Código de moneda (MXN, USD)
   * @returns {string} Valor formateado
   */
  formatCurrency(value, currency = 'MXN') {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }

    const options = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    };

    return new Intl.NumberFormat('es-MX', options).format(value);
  },

  /**
   * Formatea un número con separadores de miles
   * @param {number} value - Valor a formatear
   * @param {number} decimals - Número de decimales
   * @returns {string} Valor formateado
   */
  formatNumber(value, decimals = 0) {
    if (typeof value !== 'number') {
      value = parseFloat(value) || 0;
    }

    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  },

  /**
   * Formatea una fecha
   * @param {Date|string} date - Fecha a formatear
   * @param {string} format - Formato (short, long, datetime)
   * @returns {string} Fecha formateada
   */
  formatDate(date, format = 'short') {
    if (!date) {
      return '';
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const options = {
      short: { year: 'numeric', month: '2-digit', day: '2-digit' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      datetime: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }
    };

    return new Intl.DateTimeFormat('es-MX', options[format] || options.short).format(dateObj);
  },

  /**
   * Valida un email
   * @param {string} email - Email a validar
   * @returns {boolean} true si es válido
   */
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Valida un RFC mexicano
   * @param {string} rfc - RFC a validar
   * @returns {boolean} true si es válido
   */
  isValidRFC(rfc) {
    const regex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    return regex.test(rfc?.toUpperCase());
  },

  /**
   * Valida un CURP mexicano
   * @param {string} curp - CURP a validar
   * @returns {boolean} true si es válido
   */
  isValidCURP(curp) {
    const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
    return regex.test(curp?.toUpperCase());
  },

  /**
   * Sanitiza un string para prevenir XSS
   * @param {string} str - String a sanitizar
   * @returns {string} String sanitizado
   */
  sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Debounce function
   * @param {Function} func - Función a ejecutar
   * @param {number} wait - Tiempo de espera en ms
   * @returns {Function} Función con debounce
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function
   * @param {Function} func - Función a ejecutar
   * @param {number} limit - Límite de tiempo en ms
   * @returns {Function} Función con throttle
   */
  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Copia texto al portapapeles
   * @param {string} text - Texto a copiar
   * @returns {Promise<boolean>} true si se copió exitosamente
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      return false;
    }
  },

  /**
   * Muestra una notificación toast
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo (success, error, warning, info)
   * @param {number} duration - Duración en ms
   */
  showToast(message, type = 'info', duration = 3000) {
    // Crear contenedor de toasts si no existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    // Crear toast
    const toastId = `toast-${Date.now()}`;
    const bgClass =
      {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
      }[type] || 'bg-info';

    const toastHTML = `
      <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header ${bgClass} text-white">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
          <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
    toast.show();

    // Remover después de que se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  },

  /**
   * Confirma una acción con un modal
   * @param {string} message - Mensaje de confirmación
   * @param {string} title - Título del modal
   * @returns {Promise<boolean>} true si se confirmó
   */
  confirm(message, title = 'Confirmar') {
    return new Promise(resolve => {
      const modal = new ERPModal({
        id: 'confirmModal',
        title: title,
        body: `<p>${message}</p>`,
        footer: `
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-primary" id="confirmBtn">Confirmar</button>
        `,
        onShown: () => {
          document.getElementById('confirmBtn').addEventListener('click', () => {
            modal.hide();
            resolve(true);
          });
        },
        onHidden: () => {
          resolve(false);
        }
      });
      modal.show();
    });
  },

  /**
   * Genera un ID único
   * @returns {string} ID único
   */
  generateId() {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Obtiene parámetros de la URL
   * @param {string} name - Nombre del parámetro
   * @returns {string|null} Valor del parámetro
   */
  getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  /**
   * Establece un parámetro en la URL sin recargar
   * @param {string} name - Nombre del parámetro
   * @param {string} value - Valor del parámetro
   */
  setURLParameter(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
  },

  /**
   * Descarga un archivo
   * @param {string} content - Contenido del archivo
   * @param {string} filename - Nombre del archivo
   * @param {string} mimeType - Tipo MIME
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ERPUtils = ERPUtils;
}
