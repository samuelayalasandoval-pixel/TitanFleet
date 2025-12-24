/**
 * Tests unitarios para DataPersistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simulación de DataPersistence basada en la estructura real
class DataPersistence {
  constructor() {
    this.storageKey = 'erp_shared_data';
    this.initializeData();
  }

  initializeData() {
    if (!this.getData()) {
      this.setData({
        registros: {},
        facturas: {},
        trafico: {},
        envios: {},
        economicos: {}
      });
    }
  }

  getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  setData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  saveLogisticaData(registroId, data) {
    const allData = this.getData();
    if (!allData) return false;

    allData.registros[registroId] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  getLogisticaData(registroId) {
    const allData = this.getData();
    return allData ? allData.registros[registroId] : null;
  }

  saveFacturacionData(registroId, data) {
    const allData = this.getData();
    if (!allData) return false;

    allData.facturas[registroId] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  getFacturacionData(registroId) {
    const allData = this.getData();
    return allData ? allData.facturas[registroId] : null;
  }
}

describe('DataPersistence', () => {
  let persistence;

  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
    persistence = new DataPersistence();
  });

  describe('Inicialización', () => {
    it('debe inicializar correctamente con datos vacíos', () => {
      expect(persistence).toBeDefined();
      expect(persistence.data).toBeDefined();
      expect(persistence.data.registros).toBeDefined();
    });

    it('debe recuperar datos existentes de localStorage', () => {
      const testData = { registros: { 'test-1': { cliente: 'Test' } } };
      localStorage.setItem('erp_data', JSON.stringify(testData));
      
      const newPersistence = new DataPersistence();
      expect(newPersistence.getData()).toEqual(testData);
    });
  });

  describe('Guardar datos de logística', () => {
    it('debe guardar datos de logística correctamente', () => {
      const testId = 'TEST-001';
      const testData = {
        cliente: 'Cliente Test',
        origen: 'Origen Test',
        destino: 'Destino Test'
      };

      const resultado = persistence.saveLogisticaData(testId, testData);
      
      expect(resultado).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('debe recuperar datos guardados correctamente', () => {
      const testId = 'TEST-002';
      const testData = {
        cliente: 'Cliente Test 2',
        origen: 'Origen Test 2',
        destino: 'Destino Test 2'
      };

      persistence.saveLogisticaData(testId, testData);
      const recuperado = persistence.getLogisticaData(testId);

      expect(recuperado).toBeDefined();
      expect(recuperado.cliente).toBe(testData.cliente);
      expect(recuperado.origen).toBe(testData.origen);
      expect(recuperado.destino).toBe(testData.destino);
      expect(recuperado.tipo).toBe('logistica');
    });

    it('debe retornar null para ID inexistente', () => {
      const resultado = persistence.getLogisticaData('ID-INEXISTENTE');
      expect(resultado).toBeNull();
    });
  });

  describe('Guardar datos de facturación', () => {
    it('debe guardar datos de facturación correctamente', () => {
      const testId = 'FACT-001';
      const testData = {
        cliente: 'Cliente Facturación',
        monto: 1500.00,
        fecha: '2024-01-15'
      };

      const resultado = persistence.saveFacturacionData(testId, testData);
      
      expect(resultado).toBe(true);
      const recuperado = persistence.getFacturacionData(testId);
      expect(recuperado.cliente).toBe(testData.cliente);
      expect(recuperado.monto).toBe(testData.monto);
    });

    it('debe retornar null para factura inexistente', () => {
      const resultado = persistence.getFacturacionData('FACT-INEXISTENTE');
      expect(resultado).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar localStorage corrupto', () => {
      localStorage.setItem('erp_shared_data', 'invalid-json');
      
      // Debe crear nueva instancia sin fallar
      expect(() => {
        const newPersistence = new DataPersistence();
      }).not.toThrow();
    });

    it('debe manejar localStorage lleno', () => {
      // Simular localStorage lleno
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const resultado = persistence.setData({ test: 'data' });
      expect(resultado).toBe(false);

      localStorage.setItem = originalSetItem;
    });
  });
});
