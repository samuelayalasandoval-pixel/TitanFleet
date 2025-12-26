/**
 * Componente Form Reutilizable
 * Maneja la validación, envío y gestión de formularios
 *
 * @example
 * const form = new ERPForm({
 *   formId: 'miFormulario',
 *   onSubmit: async (data) => { ... },
 *   fields: [
 *     { id: 'nombre', required: true, type: 'text' },
 *     { id: 'email', required: true, type: 'email', validation: (val) => val.includes('@') }
 *   ]
 * });
 */
class ERPForm {
  constructor(options = {}) {
    this.options = {
      formId: options.formId || `form-${Date.now()}`,
      onSubmit: options.onSubmit || null,
      onReset: options.onReset || null,
      onFieldChange: options.onFieldChange || null,
      fields: options.fields || [],
      validation: options.validation || 'bootstrap', // 'bootstrap', 'custom', 'none'
      showValidationFeedback: options.showValidationFeedback !== false,
      autoValidate: options.autoValidate !== false,
      resetOnSubmit: options.resetOnSubmit || false,
      ...options
    };

    this.formElement = null;
    this.fieldValidators = new Map();
    this._init();
  }

  _init() {
    this.formElement = document.getElementById(this.options.formId);
    if (!this.formElement) {
      console.warn(`⚠️ No se encontró el formulario con ID: ${this.options.formId}`);
      return;
    }

    // Configurar validación de Bootstrap si está disponible
    if (this.options.validation === 'bootstrap') {
      this.formElement.classList.add('needs-validation');
      this.formElement.setAttribute('novalidate', '');
    }

    // Configurar campos
    this._setupFields();
    this._attachEvents();
  }

  /**
   * Configura los campos del formulario
   */
  _setupFields() {
    this.options.fields.forEach(field => {
      const fieldElement = document.getElementById(field.id);
      if (!fieldElement) {
        return;
      }

      // Agregar validación requerida
      if (field.required) {
        fieldElement.setAttribute('required', '');
      }

      // Agregar validación personalizada
      if (field.validation) {
        this.fieldValidators.set(field.id, field.validation);
      }

      // Configurar tipo de campo
      if (field.type) {
        fieldElement.type = field.type;
      }

      // Configurar placeholder
      if (field.placeholder) {
        fieldElement.placeholder = field.placeholder;
      }
    });
  }

  /**
   * Adjunta eventos al formulario
   */
  _attachEvents() {
    if (!this.formElement) {
      return;
    }

    // Evento de envío
    this.formElement.addEventListener('submit', async e => {
      e.preventDefault();
      e.stopPropagation();

      if (this.options.validation !== 'none') {
        const isValid = this.validate();
        if (!isValid) {
          this.formElement.classList.add('was-validated');
          return;
        }
      }

      // Obtener datos del formulario
      const formData = this.getFormData();

      // Ejecutar callback de envío
      if (this.options.onSubmit) {
        try {
          await this.options.onSubmit(formData, this);

          if (this.options.resetOnSubmit) {
            this.reset();
          }
        } catch (error) {
          console.error('Error al enviar formulario:', error);
          this._showError(error.message || 'Error al enviar el formulario');
        }
      }
    });

    // Eventos de cambio en campos
    if (this.options.autoValidate || this.options.onFieldChange) {
      this.options.fields.forEach(field => {
        const fieldElement = document.getElementById(field.id);
        if (fieldElement) {
          fieldElement.addEventListener('input', () => {
            if (this.options.autoValidate) {
              this.validateField(field.id);
            }
            if (this.options.onFieldChange) {
              this.options.onFieldChange(field.id, fieldElement.value, this);
            }
          });

          fieldElement.addEventListener('blur', () => {
            if (this.options.autoValidate) {
              this.validateField(field.id);
            }
          });
        }
      });
    }
  }

  /**
   * Valida todo el formulario
   */
  validate() {
    let isValid = true;

    this.options.fields.forEach(field => {
      const fieldValid = this.validateField(field.id);
      if (!fieldValid) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Valida un campo específico
   */
  validateField(fieldId) {
    const fieldElement = document.getElementById(fieldId);
    if (!fieldElement) {
      return true;
    }

    const field = this.options.fields.find(f => f.id === fieldId);
    if (!field) {
      return true;
    }

    const validationResult = this._validateFieldValue(field, fieldElement, fieldId);
    this._applyValidationFeedback(fieldElement, validationResult.isValid, validationResult.errorMessage);

    return validationResult.isValid;
  }

  /**
   * Valida el valor de un campo
   * @private
   */
  _validateFieldValue(field, fieldElement, fieldId) {
    let isValid = true;
    let errorMessage = '';

    // Validación requerida
    if (field.required && !fieldElement.value.trim()) {
      isValid = false;
      errorMessage = field.errorMessage || `${field.label || fieldId} es requerido`;
      return { isValid, errorMessage };
    }

    // Validación de tipo
    if (field.type === 'email' && fieldElement.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fieldElement.value)) {
        isValid = false;
        errorMessage = field.errorMessage || 'Ingrese un email válido';
        return { isValid, errorMessage };
      }
    }

    // Validación personalizada
    if (this.fieldValidators.has(fieldId)) {
      const validator = this.fieldValidators.get(fieldId);
      const validationResult = validator(fieldElement.value, fieldElement);
      if (validationResult !== true) {
        isValid = false;
        errorMessage =
          typeof validationResult === 'string'
            ? validationResult
            : field.errorMessage || 'Valor inválido';
      }
    }

    return { isValid, errorMessage };
  }

  /**
   * Aplica el feedback visual de validación
   * @private
   */
  _applyValidationFeedback(fieldElement, isValid, errorMessage) {
    if (!this.options.showValidationFeedback) {
      return;
    }

    if (isValid) {
      fieldElement.classList.remove('is-invalid');
      fieldElement.classList.add('is-valid');
      this._removeFeedback(fieldElement);
    } else {
      fieldElement.classList.remove('is-valid');
      fieldElement.classList.add('is-invalid');
      this._setFeedback(fieldElement, errorMessage);
    }
  }

  /**
   * Establece el mensaje de feedback
   */
  _setFeedback(fieldElement, message) {
    this._removeFeedback(fieldElement);

    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    fieldElement.parentNode.appendChild(feedback);
  }

  /**
   * Remueve el feedback
   */
  _removeFeedback(fieldElement) {
    const existingFeedback = fieldElement.parentNode.querySelector(
      '.invalid-feedback, .valid-feedback'
    );
    if (existingFeedback) {
      existingFeedback.remove();
    }
  }

  /**
   * Obtiene los datos del formulario
   */
  getFormData() {
    const formData = {};

    // Obtener valores de todos los campos
    this.options.fields.forEach(field => {
      const fieldElement = document.getElementById(field.id);
      if (fieldElement) {
        if (fieldElement.type === 'checkbox') {
          formData[field.id] = fieldElement.checked;
        } else if (fieldElement.type === 'radio') {
          const checked = this.formElement.querySelector(
            `input[name="${fieldElement.name}"]:checked`
          );
          formData[field.id] = checked ? checked.value : null;
        } else {
          formData[field.id] = fieldElement.value;
        }
      }
    });

    return formData;
  }

  /**
   * Establece los datos del formulario
   */
  setFormData(data) {
    Object.entries(data).forEach(([key, value]) => {
      const fieldElement = document.getElementById(key);
      if (fieldElement) {
        if (fieldElement.type === 'checkbox') {
          fieldElement.checked = Boolean(value);
        } else if (fieldElement.type === 'radio') {
          const radio = this.formElement.querySelector(
            `input[name="${fieldElement.name}"][value="${value}"]`
          );
          if (radio) {
            radio.checked = true;
          }
        } else {
          fieldElement.value = value;
        }
      }
    });
  }

  /**
   * Resetea el formulario
   */
  reset() {
    if (this.formElement) {
      this.formElement.reset();
      this.formElement.classList.remove('was-validated');

      // Limpiar clases de validación
      this.options.fields.forEach(field => {
        const fieldElement = document.getElementById(field.id);
        if (fieldElement) {
          fieldElement.classList.remove('is-valid', 'is-invalid');
          this._removeFeedback(fieldElement);
        }
      });

      if (this.options.onReset) {
        this.options.onReset(this);
      }
    }
  }

  /**
   * Limpia la validación del formulario
   */
  clearValidation() {
    if (this.formElement) {
      this.formElement.classList.remove('was-validated');
      this.options.fields.forEach(field => {
        const fieldElement = document.getElementById(field.id);
        if (fieldElement) {
          fieldElement.classList.remove('is-valid', 'is-invalid');
          this._removeFeedback(fieldElement);
        }
      });
    }
  }

  /**
   * Muestra un error
   */
  _showError(message) {
    // Crear o actualizar alerta de error
    let errorAlert = this.formElement.querySelector('.alert-danger');
    if (!errorAlert) {
      errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-danger alert-dismissible fade show';
      errorAlert.innerHTML = `
        <span></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      this.formElement.insertBefore(errorAlert, this.formElement.firstChild);
    }
    errorAlert.querySelector('span').textContent = message;
  }

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message) {
    let successAlert = this.formElement.querySelector('.alert-success');
    if (!successAlert) {
      successAlert = document.createElement('div');
      successAlert.className = 'alert alert-success alert-dismissible fade show';
      successAlert.innerHTML = `
        <span></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      this.formElement.insertBefore(successAlert, this.formElement.firstChild);
    }
    successAlert.querySelector('span').textContent = message;

    // Auto-ocultar después de 3 segundos
    const AUTO_HIDE_DELAY_MS = 3000; // Delay in milliseconds to auto-hide success alert
    setTimeout(() => {
      if (successAlert) {
        const bsAlert = new bootstrap.Alert(successAlert);
        bsAlert.close();
      }
    }, AUTO_HIDE_DELAY_MS);
  }

  /**
   * Obtiene el elemento del formulario
   */
  getElement() {
    return this.formElement;
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ERPForm = ERPForm;
}
