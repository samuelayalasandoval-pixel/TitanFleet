/**
 * Utilidades de Validación - trafico.html
 * Funciones para validar datos del formulario de tráfico
 *
 * @module trafico/validation-utils
 */

(function () {
  'use strict';

  /**
   * Valida que el número de registro exista en Logística antes de procesarlo en Tráfico
   * Agrega validación visual y previene el envío del formulario si el registro no existe
   */
  function validateRegistrationNumber() {
    const numeroRegistroInput = document.getElementById('numeroRegistro');
    if (!numeroRegistroInput) {
      console.warn('⚠️ Campo numeroRegistro no encontrado');
      return;
    }

    // Limpiar estado inicial
    numeroRegistroInput.classList.remove('is-invalid', 'is-valid');
    const existingError = document.getElementById('numeroRegistro-error');
    if (existingError) {
      existingError.remove();
    }

    numeroRegistroInput.addEventListener('blur', function () {
      const inputValue = this.value.trim();

      // Limpiar estado previo
      this.classList.remove('is-invalid', 'is-valid');
      const errorDiv = document.getElementById('numeroRegistro-error');
      if (errorDiv) {
        errorDiv.remove();
      }

      // Si el campo está vacío, actualizar header a "-" y no validar
      if (!inputValue) {
        if (typeof window.updateHeaderRegistrationNumber === 'function') {
          window.updateHeaderRegistrationNumber('-');
        }
        return;
      }

      // Verificar si el número ya existe en el historial
      const history = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
      console.log('🔍 Validando número:', inputValue);
      console.log('📋 Historial:', history);

      const existingNumber = history.find(item => item.number === inputValue);
      console.log('🔍 Número encontrado:', existingNumber);

      // Verificar si el registro existe en Logística
      const logisticaData = JSON.parse(localStorage.getItem('erp_logistica') || '{}');
      const registroEnLogistica = logisticaData[inputValue];

      if (registroEnLogistica) {
        console.log('✅ Registro encontrado en Logística');

        // Mostrar mensaje verde de éxito
        this.classList.add('is-valid');
        this.classList.remove('is-invalid');

        // Actualizar el número de registro en el header
        if (typeof window.updateHeaderRegistrationNumber === 'function') {
          window.updateHeaderRegistrationNumber(inputValue);
        }

        // Crear mensaje informativo
        const infoDiv = document.createElement('div');
        infoDiv.id = 'numeroRegistro-info';
        infoDiv.className = 'valid-feedback';
        infoDiv.textContent = '✅ Número encontrado en Logística. Continuando con Tráfico...';

        // Limpiar mensajes anteriores
        const existingInfo = document.getElementById('numeroRegistro-info');
        const existingError = document.getElementById('numeroRegistro-error');
        if (existingInfo) {
          existingInfo.remove();
        }
        if (existingError) {
          existingError.remove();
        }

        this.parentNode.appendChild(infoDiv);

        return true;
      } else {
        // Registro no existe en Logística - mostrar error
        console.log('❌ Registro no existe en Logística');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');

        // Crear mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.id = 'numeroRegistro-error';
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = `❌ El número ${inputValue} no existe en Logística. Debe crearse primero en el módulo de Logística.`;

        // Limpiar mensajes anteriores
        const existingInfo = document.getElementById('numeroRegistro-info');
        const existingError = document.getElementById('numeroRegistro-error');
        if (existingInfo) {
          existingInfo.remove();
        }
        if (existingError) {
          existingError.remove();
        }

        this.parentNode.appendChild(errorDiv);

        return false;
      }
    });

    // También validar al hacer submit del formulario
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', e => {
        const numeroRegistroInput = document.getElementById('numeroRegistro');
        if (numeroRegistroInput && numeroRegistroInput.classList.contains('is-invalid')) {
          e.preventDefault();
          numeroRegistroInput.focus();
          return false;
        }
      });
    }
  }

  // Exponer función globalmente
  window.validateRegistrationNumber = validateRegistrationNumber;

  // Ejecutar validación cuando el módulo se carga
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateRegistrationNumber);
  } else {
    validateRegistrationNumber();
  }
})();
