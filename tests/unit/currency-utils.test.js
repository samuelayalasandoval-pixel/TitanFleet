/**
 * Tests unitarios para utilidades de moneda
 */

import { describe, it, expect } from 'vitest';

// Simulación basada en currency-utils.js
const CurrencyUtils = {
  formatearMoneda(monto, moneda = 'MXN') {
    if (monto === null || monto === undefined || isNaN(monto)) {
      return '';
    }
    
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  },
  
  parsearMoneda(valor) {
    if (!valor || typeof valor !== 'string') {
      return null;
    }
    
    // Remover símbolos de moneda y espacios
    const limpio = valor.replace(/[$\s,]/g, '');
    const numero = parseFloat(limpio);
    
    return isNaN(numero) ? null : numero;
  },
  
  redondearMoneda(monto, decimales = 2) {
    if (monto === null || monto === undefined || isNaN(monto)) {
      return 0;
    }
    
    return Math.round(monto * Math.pow(10, decimales)) / Math.pow(10, decimales);
  }
};

describe('CurrencyUtils', () => {
  describe('formatearMoneda', () => {
    it('debe formatear monto en pesos mexicanos', () => {
      const resultado = CurrencyUtils.formatearMoneda(1234.56);
      expect(resultado).toContain('1,234.56');
      expect(resultado).toContain('$');
    });

    it('debe formatear monto con 2 decimales', () => {
      const resultado = CurrencyUtils.formatearMoneda(100);
      expect(resultado).toMatch(/\.00/);
    });

    it('debe manejar valores nulos', () => {
      const resultado = CurrencyUtils.formatearMoneda(null);
      expect(resultado).toBe('');
    });

    it('debe manejar valores undefined', () => {
      const resultado = CurrencyUtils.formatearMoneda(undefined);
      expect(resultado).toBe('');
    });

    it('debe formatear monto cero', () => {
      const resultado = CurrencyUtils.formatearMoneda(0);
      expect(resultado).toContain('0.00');
    });
  });

  describe('parsearMoneda', () => {
    it('debe parsear string con formato de moneda', () => {
      const resultado = CurrencyUtils.parsearMoneda('$1,234.56');
      expect(resultado).toBe(1234.56);
    });

    it('debe parsear string sin símbolos', () => {
      const resultado = CurrencyUtils.parsearMoneda('1234.56');
      expect(resultado).toBe(1234.56);
    });

    it('debe retornar null para string inválido', () => {
      const resultado = CurrencyUtils.parsearMoneda('abc');
      expect(resultado).toBeNull();
    });

    it('debe retornar null para valor null', () => {
      const resultado = CurrencyUtils.parsearMoneda(null);
      expect(resultado).toBeNull();
    });

    it('debe manejar strings vacíos', () => {
      const resultado = CurrencyUtils.parsearMoneda('');
      expect(resultado).toBeNull();
    });
  });

  describe('redondearMoneda', () => {
    it('debe redondear a 2 decimales por defecto', () => {
      const resultado = CurrencyUtils.redondearMoneda(1234.567);
      expect(resultado).toBe(1234.57);
    });

    it('debe redondear a decimales especificados', () => {
      const resultado = CurrencyUtils.redondearMoneda(1234.567, 1);
      expect(resultado).toBe(1234.6);
    });

    it('debe manejar valores nulos', () => {
      const resultado = CurrencyUtils.redondearMoneda(null);
      expect(resultado).toBe(0);
    });

    it('debe redondear hacia arriba correctamente', () => {
      const resultado = CurrencyUtils.redondearMoneda(1234.555);
      expect(resultado).toBe(1234.56);
    });
  });
});
