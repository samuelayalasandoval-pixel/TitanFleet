/**
 * Utilidades de Formateo y Cálculo de Moneda - facturacion.html
 * Maneja el formateo de moneda mexicana y cálculos de totales
 */

(function () {
  'use strict';

  /**
   * Formatea un número como moneda mexicana
   * @param {number|string} valor - Valor a formatear
   * @returns {string} Valor formateado como moneda (ej: $1,234.56)
   */
  window.formatearMoneda = function (valor) {
    if (isNaN(valor) || valor === null || valor === undefined) {
      return '$0.00';
    }

    // Convertir a número si es string
    const numero = parseFloat(valor);

    // Formatear con separadores de miles y 2 decimales
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numero);
  };

  /**
   * Limpia el formato de moneda y obtiene el valor numérico
   * @param {string|number} valor - Valor con formato de moneda
   * @returns {number} Valor numérico limpio
   */
  window.limpiarFormatoMoneda = function (valor) {
    if (!valor || valor === '') {
      return 0;
    }

    // Convertir a string y limpiar, preservando el signo negativo
    const valorLimpio = valor
      .toString()
      .replace(/[$,]/g, '') // Remover símbolos de moneda y comas
      .replace(/\s/g, '') // Remover espacios
      .trim();

    // Si está vacío después de limpiar, retornar 0
    if (valorLimpio === '' || valorLimpio === '-') {
      return 0;
    }

    // Convertir a número (preserva el signo negativo si existe)
    const numero = parseFloat(valorLimpio);

    // Si no es un número válido, retornar 0
    if (isNaN(numero)) {
      console.warn(`⚠️ Valor no numérico detectado: "${valor}" → 0`);
      return 0;
    }

    return numero;
  };

  /**
   * Aplica formato de moneda a un campo del formulario
   * @param {string} campoId - ID del campo a formatear
   */
  window.aplicarFormatoMoneda = function (campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) {
      return;
    }

    const valor = campo.value;
    const valorNumerico = window.limpiarFormatoMoneda(valor);

    // Para "Otros Montos", permitir valores negativos y positivos
    if (campoId === 'Otros Montos') {
      if (valorNumerico !== 0 && valor !== '') {
        // Preservar el signo negativo si existe
        const esNegativo = valorNumerico < 0;
        const valorAbsoluto = Math.abs(valorNumerico);
        campo.value = esNegativo
          ? `-${window.formatearMoneda(valorAbsoluto)}`
          : window.formatearMoneda(valorNumerico);
      } else {
        campo.value = '';
      }
    } else {
      // Para otros campos, solo aplicar formato si hay un valor válido positivo
      if (valorNumerico > 0 || valor === '') {
        campo.value = valorNumerico > 0 ? window.formatearMoneda(valorNumerico) : '';
      }
    }
  };

  /**
   * Calcula el total de la factura basado en los campos de montos
   * @returns {number} Total calculado
   */
  window.calcularTotalFactura = function () {
    console.log('🧮 Calculando total de factura...');

    // Obtener valores de los campos (limpiando formato de moneda)
    const subtotal = window.limpiarFormatoMoneda(document.getElementById('Subtotal')?.value) || 0;
    const iva = window.limpiarFormatoMoneda(document.getElementById('iva')?.value) || 0;
    const ivaRetenido =
      window.limpiarFormatoMoneda(document.getElementById('iva retenido')?.value) || 0;
    const isrRetenido =
      window.limpiarFormatoMoneda(document.getElementById('isr retenido')?.value) || 0;
    const otrosMontos =
      window.limpiarFormatoMoneda(document.getElementById('Otros Montos')?.value) || 0;

    console.log('📊 Valores obtenidos:', {
      subtotal,
      iva,
      ivaRetenido,
      isrRetenido,
      otrosMontos
    });

    // Calcular total: Subtotal + IVA - IVA Retenido - ISR Retenido + Otros Montos
    const total = subtotal + iva - ivaRetenido - isrRetenido + otrosMontos;

    console.log('💰 Total calculado:', total);

    // Actualizar el campo de total con formato de moneda
    const campoTotal = document.getElementById('total factura');
    if (campoTotal) {
      campoTotal.value = window.formatearMoneda(total);
      console.log('✅ Total actualizado en el campo:', window.formatearMoneda(total));
    }

    return total;
  };

  /**
   * Agrega event listeners a los campos de montos para cálculo automático
   */
  window.agregarEventListenersCalculo = function () {
    console.log('🔗 Agregando event listeners para cálculo automático...');

    const camposCalculo = ['Subtotal', 'iva', 'iva retenido', 'isr retenido', 'Otros Montos'];

    camposCalculo.forEach(campoId => {
      const campo = document.getElementById(campoId);
      if (campo) {
        // Event listener para input (tiempo real) - sin formato para facilitar escritura
        campo.addEventListener('input', function () {
          console.log(`📝 Campo ${campoId} cambiado:`, this.value);
          window.calcularTotalFactura();
        });

        // Event listener para blur (cuando pierde el foco) - aplicar formato
        campo.addEventListener('blur', function () {
          console.log(`👁️ Campo ${campoId} perdió foco:`, this.value);
          window.aplicarFormatoMoneda(campoId);
          window.calcularTotalFactura();
        });

        // Event listener para keypress - permitir solo números, punto, coma y signo negativo (solo para Otros Montos)
        campo.addEventListener('keypress', function (e) {
          // Permitir: números (0-9), punto (.), coma (,), backspace, delete, tab, enter, escape, arrow keys
          const char = String.fromCharCode(e.which);
          const { keyCode } = e;

          // Permitir teclas de control (backspace, delete, tab, enter, escape, arrows)
          if ([8, 9, 13, 27, 37, 38, 39, 40, 46].includes(keyCode)) {
            return;
          }

          // Para "Otros Montos", permitir también el signo negativo al inicio
          if (campoId === 'Otros Montos') {
            // Permitir números, punto, coma y signo negativo (solo al inicio)
            const valorActual = this.value;
            const cursorPos = this.selectionStart;
            const tieneSignoNegativo = valorActual.includes('-');

            if (char === '-') {
              // Solo permitir el signo negativo si:
              // 1. No hay signo negativo ya
              // 2. El cursor está al inicio
              if (tieneSignoNegativo || cursorPos !== 0) {
                e.preventDefault();
              }
            } else if (!/[0-9.,]/.test(char)) {
              e.preventDefault();
            }
          } else {
            // Para otros campos, solo números, punto y coma
            if (!/[0-9.,]/.test(char)) {
              e.preventDefault();
            }
          }
        });

        // Event listener para paste - limpiar contenido pegado
        campo.addEventListener('paste', function (_e) {
          setTimeout(() => {
            const valor = this.value;
            const valorLimpio = valor.replace(/[^0-9.,]/g, '');
            this.value = valorLimpio;
            window.calcularTotalFactura();
          }, 10);
        });

        console.log(`✅ Event listeners agregados a ${campoId}`);
      } else {
        console.warn(`⚠️ Campo ${campoId} no encontrado`);
      }
    });
  };

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, configurando cálculo automático...');
    window.agregarEventListenersCalculo();
  });

  // También ejecutar después de un pequeño delay para asegurar que todo esté cargado
  setTimeout(() => {
    window.agregarEventListenersCalculo();
  }, 500);

  /**
   * Formatea todos los campos de montos del formulario
   */
  window.formatearTodosLosMontos = function () {
    console.log('💰 Formateando todos los campos de montos...');

    const camposMontos = [
      'Subtotal',
      'iva',
      'iva retenido',
      'isr retenido',
      'Otros Montos',
      'total factura'
    ];

    let camposFormateados = 0;

    camposMontos.forEach(campoId => {
      const campo = document.getElementById(campoId);
      if (campo && campo.value.trim() !== '') {
        const valorOriginal = campo.value;
        const valorNumerico = window.limpiarFormatoMoneda(valorOriginal);

        if (valorNumerico !== 0) {
          campo.value = window.formatearMoneda(valorNumerico);
          camposFormateados++;
          console.log(`✅ ${campoId}: ${valorOriginal} → ${window.formatearMoneda(valorNumerico)}`);
        }
      }
    });

    // Mostrar notificación
    if (typeof window.showNotification === 'function') {
      window.showNotification(`${camposFormateados} campos formateados correctamente`, 'success');
    } else {
      alert(`${camposFormateados} campos formateados correctamente`);
    }

    console.log(`🎉 Formateo completado: ${camposFormateados} campos procesados`);
  };
})();
