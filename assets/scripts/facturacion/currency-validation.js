/**
 * Validación de Moneda y Tipo de Cambio - facturacion.html
 * Maneja la validación y cambio de tipo de moneda
 */

(function () {
  'use strict';

  /**
   * Maneja el cambio de tipo de moneda
   */
  window.manejarCambioMoneda = function () {
    const tipoMoneda = document.getElementById('tipoMoneda');
    const tipoCambio = document.getElementById('tipoCambio');

    if (tipoMoneda && tipoCambio) {
      tipoMoneda.addEventListener('change', function () {
        console.log('💱 Tipo de moneda cambiado a:', this.value);

        if (this.value === 'USD') {
          // Si es USD, hacer el tipo de cambio requerido
          tipoCambio.required = true;
          tipoCambio.setAttribute('required', 'required');
          const formText = tipoCambio.parentElement.querySelector('.form-text');
          if (formText) {
            formText.textContent = 'Requerido para USD (ejemplo: 17.5000)';
            formText.className = 'form-text text-danger';
          }
          // Remover clase de error si estaba presente
          tipoCambio.classList.remove('is-invalid');
        } else {
          // Si es MXN, no es requerido
          tipoCambio.required = false;
          tipoCambio.removeAttribute('required');
          tipoCambio.value = '0';
          const formText = tipoCambio.parentElement.querySelector('.form-text');
          if (formText) {
            formText.textContent = 'Solo requerido si la moneda es USD';
            formText.className = 'form-text text-muted';
          }
          // Remover clase de error si estaba presente
          tipoCambio.classList.remove('is-invalid');
        }
      });
    }
  };

  /**
   * Valida el tipo de cambio según el tipo de moneda seleccionado
   * @returns {boolean} true si es válido, false si no
   */
  window.validarTipoCambio = function () {
    const tipoMoneda = document.getElementById('tipoMoneda')?.value;
    const tipoCambioInput = document.getElementById('tipoCambio');
    const tipoCambio = tipoCambioInput?.value?.trim();

    console.log('🔍 Validando tipo de cambio:', {
      tipoMoneda,
      tipoCambio,
      tipoCambioParseado: tipoCambio ? parseFloat(tipoCambio) : null
    });

    if (tipoMoneda === 'USD') {
      // Si es USD, el tipo de cambio es obligatorio y debe ser mayor a 0
      if (
        !tipoCambio ||
        tipoCambio === '' ||
        isNaN(parseFloat(tipoCambio)) ||
        parseFloat(tipoCambio) <= 0
      ) {
        alert(
          '⚠️ Por favor ingrese un tipo de cambio válido para USD.\n\nEl tipo de cambio debe ser un número mayor a 0 (ejemplo: 17.5000)'
        );
        if (tipoCambioInput) {
          tipoCambioInput.focus();
          tipoCambioInput.classList.add('is-invalid');
        }
        return false;
      }

      // Validar que el tipo de cambio sea razonable (entre 0.01 y 1000)
      const tipoCambioNum = parseFloat(tipoCambio);
      if (tipoCambioNum < 0.01 || tipoCambioNum > 1000) {
        const confirmar = confirm(
          `⚠️ El tipo de cambio ingresado (${tipoCambioNum}) parece fuera del rango normal.\n\n¿Desea continuar de todas formas?`
        );
        if (!confirmar) {
          if (tipoCambioInput) {
            tipoCambioInput.focus();
          }
          return false;
        }
      }

      // Remover clase de error si estaba presente
      if (tipoCambioInput) {
        tipoCambioInput.classList.remove('is-invalid');
      }
    } else {
      // Si es MXN, el tipo de cambio puede ser 0 o vacío
      if (tipoCambioInput) {
        tipoCambioInput.classList.remove('is-invalid');
        // Si está vacío, establecer a 0 para MXN
        if (!tipoCambio || tipoCambio === '') {
          tipoCambioInput.value = '0';
        }
      }
    }

    return true;
  };

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    window.manejarCambioMoneda();
  });

  // También ejecutar después de un pequeño delay
  setTimeout(() => {
    window.manejarCambioMoneda();
  }, 500);

  /**
   * Actualiza automáticamente el tipo de cambio cuando se selecciona MXN en el modal
   */
  window.actualizarTipoCambioMXN = function () {
    const tipoMonedaSelect = document.getElementById('modal_tipo_moneda');
    const tipoCambioInput = document.getElementById('modal_tipo_cambio');

    if (tipoMonedaSelect && tipoCambioInput) {
      if (tipoMonedaSelect.value === 'MXN') {
        tipoCambioInput.value = '0';
        tipoCambioInput.setAttribute('readonly', 'readonly');
        tipoCambioInput.style.backgroundColor = '#f8f9fa';
      } else {
        tipoCambioInput.removeAttribute('readonly');
        tipoCambioInput.style.backgroundColor = '';
      }
    }
  };
})();
