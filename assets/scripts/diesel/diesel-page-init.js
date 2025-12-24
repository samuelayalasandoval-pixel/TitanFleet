/**
 * Módulo de Inicialización de Página Diesel
 * Maneja los event listeners y la inicialización de la página
 */

(function () {
  'use strict';

  /**
   * Inicializar calculadora de costo total
   */
  function initCostoTotalCalculator() {
    // Función para obtener los elementos
    const getElements = () => ({
      litrosEl: document.getElementById('Litros'),
      costoEl: document.getElementById('costoporlitro'),
      costoTotalEl: document.getElementById('costototal')
    });

    // Función para calcular el costo total
    function calcularCostoTotal() {
      const { litrosEl, costoEl, costoTotalEl } = getElements();

      if (!litrosEl || !costoEl || !costoTotalEl) {
        console.warn('⚠️ Elementos de cálculo de costo total no encontrados');
        return;
      }

      const litros = parseFloat(litrosEl.value) || 0;
      const costoPorLitro = parseFloat(costoEl.value) || 0;
      const costoTotal = litros * costoPorLitro;

      // Función auxiliar para formatear números con separadores de miles
      const formatearNumeroConComas = (numero, decimales = 2) => {
        const num = parseFloat(numero || 0);
        if (isNaN(num)) {
          return '';
        }

        return num.toLocaleString('en-US', {
          minimumFractionDigits: decimales,
          maximumFractionDigits: decimales
        });
      };

      // Actualizar el campo de costo total con formato
      costoTotalEl.value = costoTotal > 0 ? `$${formatearNumeroConComas(costoTotal)}` : '';

      console.log(
        `💰 Cálculo: ${litros} litros × $${costoPorLitro} = $${formatearNumeroConComas(costoTotal)}`
      );
    }

    // Intentar inicializar inmediatamente
    const { litrosEl, costoEl, costoTotalEl } = getElements();

    if (litrosEl && costoEl && costoTotalEl) {
      // Agregar múltiples event listeners para asegurar que funcione
      ['input', 'change', 'blur', 'keyup'].forEach(eventType => {
        litrosEl.addEventListener(eventType, calcularCostoTotal);
        costoEl.addEventListener(eventType, calcularCostoTotal);
      });

      // Calcular inicialmente si hay valores
      if (litrosEl.value || costoEl.value) {
        calcularCostoTotal();
      }

      console.log('✅ Calculadora de costo total inicializada');
    } else {
      console.warn('⚠️ Elementos de cálculo no encontrados, reintentando...');
      // Reintentar después de un breve delay
      setTimeout(() => {
        initCostoTotalCalculator();
      }, 500);
    }
  }

  /**
   * Inicializar toggle de observaciones
   */
  function initObservacionesToggle() {
    const observacionesRadios = document.querySelectorAll('input[name="Observaciones"]');
    const observacionesDiv = document.getElementById('Observaciones');

    if (!observacionesRadios.length || !observacionesDiv) {
      return;
    }

    observacionesRadios.forEach(radio => {
      radio.addEventListener('change', function () {
        if (this.value === 'si') {
          observacionesDiv.style.display = 'block';
        } else {
          observacionesDiv.style.display = 'none';
        }
      });
    });
  }

  /**
   * Cargar cachés para dropdowns
   */
  async function loadDropdownCaches() {
    try {
      if (typeof window.cargarTractocamionesEnCacheDiesel === 'function') {
        await window.cargarTractocamionesEnCacheDiesel();
      }
      if (typeof window.cargarOperadoresEnCacheDiesel === 'function') {
        await window.cargarOperadoresEnCacheDiesel();
      }
    } catch (error) {
      console.warn('⚠️ Error cargando cachés de dropdowns:', error);
    }
  }

  /**
   * Inicializar página cuando el DOM esté listo
   */
  document.addEventListener('DOMContentLoaded', () => {
    // Inicializar calculadora de costo total inmediatamente
    initCostoTotalCalculator();

    // Esperar un poco para que Firebase y configuracionManager estén listos
    setTimeout(async () => {
      // Cargar cachés para los searchable dropdowns
      await loadDropdownCaches();

      // Re-inicializar calculadora por si acaso los elementos no estaban listos
      initCostoTotalCalculator();
    }, 500);

    // Inicializar toggle de observaciones
    initObservacionesToggle();
  });

  // Función auxiliar para formatear números con separadores de miles
  function formatearNumeroConComas(numero, decimales = 2) {
    const num = parseFloat(numero || 0);
    if (isNaN(num)) {
      return '';
    }

    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  }

  // Exponer función globalmente para que pueda ser llamada desde otros lugares
  window.calcularCostoTotalDiesel = function () {
    const litrosEl = document.getElementById('Litros');
    const costoEl = document.getElementById('costoporlitro');
    const costoTotalEl = document.getElementById('costototal');

    if (!litrosEl || !costoEl || !costoTotalEl) {
      console.warn('⚠️ Elementos de cálculo de costo total no encontrados');
      return;
    }

    const litros = parseFloat(litrosEl.value) || 0;
    const costoPorLitro = parseFloat(costoEl.value) || 0;
    const costoTotal = litros * costoPorLitro;

    costoTotalEl.value = costoTotal > 0 ? `$${formatearNumeroConComas(costoTotal)}` : '';

    console.log(
      `💰 Cálculo: ${litros} litros × $${costoPorLitro} = $${formatearNumeroConComas(costoTotal)}`
    );
  };

  // Función para calcular costo total en el modal de edición
  window.calcularCostoTotalDieselEditar = function () {
    const litrosEl = document.getElementById('editarDiesel_litros');
    const costoEl = document.getElementById('editarDiesel_costoporlitro');
    const costoTotalEl = document.getElementById('editarDiesel_costototal');

    if (!litrosEl || !costoEl || !costoTotalEl) {
      console.warn('⚠️ Elementos de cálculo de costo total (edición) no encontrados');
      return;
    }

    const litros = parseFloat(litrosEl.value) || 0;
    const costoPorLitro = parseFloat(costoEl.value) || 0;
    const costoTotal = litros * costoPorLitro;

    // Función auxiliar para formatear números con separadores de miles
    const formatearNumeroConComas = (numero, decimales = 2) => {
      const num = parseFloat(numero || 0);
      if (isNaN(num)) {
        return '';
      }

      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
      });
    };

    costoTotalEl.value = costoTotal > 0 ? `$${formatearNumeroConComas(costoTotal)}` : '';

    console.log(
      `💰 Cálculo (edición): ${litros} litros × $${costoPorLitro} = $${formatearNumeroConComas(costoTotal)}`
    );
  };

  console.log('✅ Módulo diesel-page-init.js cargado');
})();
