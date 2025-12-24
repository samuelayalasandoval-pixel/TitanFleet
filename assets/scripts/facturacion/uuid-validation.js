/**
 * Validación y Formato de UUID (Folio Fiscal)
 * Formato: 8-4-4-4-12 (32 dígitos hexadecimales + 4 guiones)
 * Ejemplo: 550e8400-e29b-41d4-a716-446655440000
 */

(function () {
  'use strict';

  /**
   * Formatea un string como UUID mientras el usuario escribe
   * @param {string} value - Valor a formatear
   * @returns {string} - Valor formateado como UUID
   */
  function formatUUID(value) {
    // Remover todos los caracteres que no sean hexadecimales
    let cleaned = value.replace(/[^0-9a-fA-F]/g, '');

    // Limitar a 32 caracteres (máximo para UUID)
    cleaned = cleaned.substring(0, 32);

    // Agregar guiones en las posiciones correctas: 8-4-4-4-12
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i === 8 || i === 12 || i === 16 || i === 20) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }

    return formatted;
  }

  /**
   * Valida si un string tiene el formato correcto de UUID
   * @param {string} value - Valor a validar
   * @returns {boolean} - true si es válido, false si no
   */
  function isValidUUID(value) {
    // Patrón UUID: 8-4-4-4-12
    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidPattern.test(value);
  }

  /**
   * Inicializa la validación y formato del campo UUID
   */
  function initUUIDValidation() {
    const uuidInput = document.getElementById('Folio Fiscal');

    if (!uuidInput) {
      console.warn('⚠️ Campo "Folio Fiscal" no encontrado');
      return;
    }

    // Agregar atributo maxlength para limitar a 36 caracteres (32 dígitos + 4 guiones)
    uuidInput.setAttribute('maxlength', '36');
    uuidInput.setAttribute(
      'pattern',
      '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
    );
    uuidInput.setAttribute('title', 'Ingresa el UUID o Folio Fiscal');

    // Formatear mientras el usuario escribe
    uuidInput.addEventListener('input', e => {
      const cursorPosition = e.target.selectionStart;
      const oldValue = e.target.value;
      const newValue = formatUUID(oldValue);

      // Solo actualizar si el valor cambió
      if (oldValue !== newValue) {
        e.target.value = newValue;

        // Ajustar posición del cursor
        // Calcular nueva posición considerando los guiones agregados
        let newCursorPosition = cursorPosition;
        const beforeCursor = oldValue.substring(0, cursorPosition);
        const cleanedBefore = beforeCursor.replace(/[^0-9a-fA-F]/g, '');
        const formattedBefore = formatUUID(cleanedBefore);
        newCursorPosition = formattedBefore.length;

        // Asegurar que el cursor no esté en una posición de guión
        if (newValue[newCursorPosition] === '-') {
          newCursorPosition++;
        }

        e.target.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    });

    // Validar al perder el foco
    uuidInput.addEventListener('blur', e => {
      const value = e.target.value.trim();

      if (value && !isValidUUID(value)) {
        // Si tiene valor pero no es válido, intentar formatearlo
        const formatted = formatUUID(value);
        if (formatted.length >= 36 && isValidUUID(formatted)) {
          e.target.value = formatted;
          e.target.classList.remove('is-invalid');
          e.target.classList.add('is-valid');
        } else {
          e.target.classList.remove('is-valid');
          e.target.classList.add('is-invalid');
        }
      } else if (value && isValidUUID(value)) {
        e.target.classList.remove('is-invalid');
        e.target.classList.add('is-valid');
      } else if (!value) {
        e.target.classList.remove('is-valid', 'is-invalid');
      }
    });

    // Validar al enviar el formulario
    const form = uuidInput.closest('form');
    if (form) {
      form.addEventListener('submit', e => {
        const value = uuidInput.value.trim();

        if (value && !isValidUUID(value)) {
          e.preventDefault();
          uuidInput.focus();
          uuidInput.classList.add('is-invalid');
          alert('Por favor ingrese un UUID válido');
          return false;
        }
      });
    }

    // Prevenir pegar texto no válido
    uuidInput.addEventListener('paste', e => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const formatted = formatUUID(pastedText);

      // Si el texto pegado puede formar un UUID válido, usarlo
      if (formatted.length === 36 && isValidUUID(formatted)) {
        uuidInput.value = formatted;
        uuidInput.classList.remove('is-invalid');
        uuidInput.classList.add('is-valid');
      } else {
        // Si no es válido, solo pegar los caracteres hexadecimales
        const cleaned = pastedText.replace(/[^0-9a-fA-F]/g, '').substring(0, 32);
        if (cleaned.length > 0) {
          uuidInput.value = formatUUID(cleaned);
        }
      }

      // Disparar evento input para activar validación
      uuidInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    console.log('✅ Validación de UUID inicializada para campo "Folio Fiscal"');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUUIDValidation);
  } else {
    initUUIDValidation();
  }

  // Exponer funciones globalmente para uso externo
  window.formatUUID = formatUUID;
  window.isValidUUID = isValidUUID;
})();
