/**
 * Utilidades de Formulario - trafico.html
 * Funciones para limpiar y gestionar formularios
 */

(function () {
  'use strict';

  // Función para limpiar el formulario de tráfico
  window.limpiarFormularioTrafico = function () {
    console.log('🧹 Limpiando formulario de tráfico...');

    try {
      // Obtener el formulario
      const formulario = document.querySelector('form');
      if (!formulario) {
        console.warn('⚠️ No se encontró el formulario');
        return;
      }

      // Limpiar todos los campos de entrada
      const inputs = formulario.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        // Limpiar valor
        if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = false;
        } else {
          input.value = '';
        }

        // Limpiar clases CSS de validación de Bootstrap
        input.classList.remove(
          'is-valid',
          'is-invalid',
          'was-validated',
          'form-control',
          'form-select'
        );

        // Limpiar atributos de validación
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');

        // Limpiar estilos inline que puedan causar color verde
        input.style.borderColor = '';
        input.style.backgroundColor = '';
        input.style.color = '';

        // Restaurar clases base si es necesario
        if (input.tagName === 'INPUT' && input.type !== 'checkbox' && input.type !== 'radio') {
          input.classList.add('form-control');
        } else if (input.tagName === 'SELECT') {
          input.classList.add('form-select');
        }
      });

      // Limpiar clases de validación del formulario
      formulario.classList.remove('was-validated');

      // Limpiar mensajes de validación
      const feedbackElements = formulario.querySelectorAll('.valid-feedback, .invalid-feedback');
      feedbackElements.forEach(element => {
        element.style.display = 'none';
      });

      // Limpiar el número de registro (mantenerlo para continuidad)
      const numeroRegistro = document.getElementById('numeroRegistro');
      if (numeroRegistro) {
        // No limpiar el número de registro, mantenerlo
        console.log('📋 Manteniendo número de registro:', numeroRegistro.value);
      }

      console.log('✅ Formulario de tráfico limpiado correctamente');
    } catch (error) {
      console.error('❌ Error al limpiar formulario:', error);
    }
  };

  // Función wrapper para compatibilidad
  window.clearCurrentForm = function () {
    window.limpiarFormularioTrafico();
  };
})();
