/**
 * Validación y Formato de UUID (Folio Fiscal) para CXP
 * Formato: 8-4-4-4-12 (32 dígitos hexadecimales + 4 guiones)
 * Ejemplo: 550e8400-e29b-41d4-a716-446655440000
 *
 * Reutiliza la misma lógica que facturación para mantener consistencia
 */

(function () {
  'use strict';

  /**
   * Formatea un string como UUID mientras el usuario escribe
   * @param {string} value - Valor a formatear
   * @returns {string} - Valor formateado como UUID
   */
  function formatUUID(value) {
    if (!value) {
      return '';
    }

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
    if (!value) {
      return false;
    }

    // Patrón UUID: 8-4-4-4-12
    const uuidPattern =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidPattern.test(value);
  }

  /**
   * Inicializa la validación y formato del campo UUID
   */
  function initUUIDValidation() {
    const uuidInput = document.getElementById('folioFiscalFactura');

    if (!uuidInput) {
      console.warn('⚠️ Campo "folioFiscalFactura" no encontrado');
      // Intentar de nuevo después de un delay para campos dinámicos
      setTimeout(initUUIDValidation, 500);
      return;
    }

    // Agregar atributo maxlength para limitar a 36 caracteres (32 dígitos + 4 guiones)
    uuidInput.setAttribute('maxlength', '36');
    uuidInput.setAttribute(
      'pattern',
      '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
    );
    uuidInput.setAttribute(
      'title',
      'Formato: 32 dígitos hexadecimales separados por guiones (8-4-4-4-12)'
    );

    // Agregar texto de ayuda si no existe
    if (
      !uuidInput.nextElementSibling ||
      !uuidInput.nextElementSibling.classList.contains('form-text')
    ) {
      const helpText = document.createElement('small');
      helpText.className = 'form-text text-muted';
      helpText.textContent = 'Formato: 32 dígitos hexadecimales separados por guiones (8-4-4-4-12)';
      uuidInput.parentNode.insertBefore(helpText, uuidInput.nextSibling);
    }

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
        if (formatted.length === 36 && isValidUUID(formatted)) {
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

        // Si el campo tiene valor, debe ser válido
        if (value && !isValidUUID(value)) {
          e.preventDefault();
          uuidInput.focus();
          uuidInput.classList.add('is-invalid');
          alert('Por favor ingrese un UUID válido en formato: 8-4-4-4-12');
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

    console.log('✅ Validación de UUID inicializada para campo "folioFiscalFactura"');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUUIDValidation);
  } else {
    initUUIDValidation();
  }

  // También inicializar después de delays para campos dinámicos en modales
  setTimeout(initUUIDValidation, 500);
  setTimeout(initUUIDValidation, 1000);

  // Escuchar cuando se abra el modal de nueva factura
  const modalNuevaFactura = document.getElementById('modalNuevaFactura');
  if (modalNuevaFactura) {
    modalNuevaFactura.addEventListener('shown.bs.modal', () => {
      setTimeout(initUUIDValidation, 100);
    });
  }

  // Exponer funciones globalmente para uso externo (si no existen ya)
  if (typeof window.formatUUID === 'undefined') {
    window.formatUUID = formatUUID;
  }
  if (typeof window.isValidUUID === 'undefined') {
    window.isValidUUID = isValidUUID;
  }

  console.log('✅ Módulo de validación de UUID para CXP cargado');
})();

