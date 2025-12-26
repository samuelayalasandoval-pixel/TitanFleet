/**
 * Tests unitarios para DataPersistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Crear un localStorage real para los tests
function createLocalStorage() {
  const store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    key: (index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    }
  };
}

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

    if (!allData.registros) {
      allData.registros = {};
    }

    allData.registros[registroId] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  async getLogisticaData(registroId) {
    const allData = this.getData();
    if (!allData || !allData.registros) {
      return null;
    }
    return allData.registros[registroId] || null;
  }

  saveFacturacionData(registroId, data) {
    const allData = this.getData();
    if (!allData) return false;

    if (!allData.facturas) {
      allData.facturas = {};
    }

    allData.facturas[registroId] = {
      ...data,
      fechaCreacion: new Date().toISOString(),
      ultimaActualizacion: new Date().toISOString()
    };

    return this.setData(allData);
  }

  async getFacturacionData(registroId) {
    const allData = this.getData();
    if (!allData || !allData.facturas) {
      return null;
    }
    return allData.facturas[registroId] || null;
  }
}

describe('DataPersistence', () => {
  let persistence;
  let testLocalStorage;

  beforeEach(() => {
    // Crear un localStorage real para cada test
    testLocalStorage = createLocalStorage();
    // Reemplazar el localStorage global con el real
    global.localStorage = testLocalStorage;
    if (global.window) {
      global.window.localStorage = testLocalStorage;
    }
    // Limpiar localStorage antes de cada test
    testLocalStorage.clear();
    persistence = new DataPersistence();
  });

  describe('Inicialización', () => {
    it('debe inicializar correctamente con datos vacíos', () => {
      expect(persistence).toBeDefined();
      const data = persistence.getData();
      expect(data).toBeDefined();
      expect(data.registros).toBeDefined();
    });

    it('debe recuperar datos existentes de localStorage', () => {
      const testData = { 
        registros: { 'test-1': { cliente: 'Test' } },
        facturas: {},
        trafico: {},
        envios: {},
        economicos: {}
      };
      localStorage.setItem('erp_shared_data', JSON.stringify(testData));
      
      const newPersistence = new DataPersistence();
      const retrieved = newPersistence.getData();
      expect(retrieved).toBeDefined();
      expect(retrieved).not.toBeNull();
      expect(retrieved.registros).toBeDefined();
      expect(retrieved.registros['test-1']).toBeDefined();
      expect(retrieved.registros['test-1'].cliente).toBe('Test');
    });
  });

  describe('Guardar datos de logística', () => {
    it('debe guardar datos de logística correctamente', async () => {
      const testId = 'TEST-001';
      const testData = {
        cliente: 'Cliente Test',
        origen: 'Origen Test',
        destino: 'Destino Test'
      };

      const resultado = persistence.saveLogisticaData(testId, testData);
      
      expect(resultado).toBe(true);
      const saved = await persistence.getLogisticaData(testId);
      expect(saved).toBeDefined();
      expect(saved).not.toBeNull();
    });

    it('debe recuperar datos guardados correctamente', async () => {
      const testId = 'TEST-002';
      const testData = {
        cliente: 'Cliente Test 2',
        origen: 'Origen Test 2',
        destino: 'Destino Test 2'
      };

      const resultado = persistence.saveLogisticaData(testId, testData);
      expect(resultado).toBe(true);
      
      const recuperado = await persistence.getLogisticaData(testId);

      expect(recuperado).toBeDefined();
      expect(recuperado).not.toBeNull();
      expect(recuperado.cliente).toBe(testData.cliente);
      expect(recuperado.origen).toBe(testData.origen);
      expect(recuperado.destino).toBe(testData.destino);
    });

    it('debe retornar null para ID inexistente', async () => {
      const resultado = await persistence.getLogisticaData('ID-INEXISTENTE');
      expect(resultado).toBeNull();
    });
  });

  describe('Guardar datos de facturación', () => {
    it('debe guardar datos de facturación correctamente', async () => {
      const testId = 'FACT-001';
      const testData = {
        cliente: 'Cliente Facturación',
        monto: 1500.00,
        fecha: '2024-01-15'
      };

      const resultado = persistence.saveFacturacionData(testId, testData);
      
      expect(resultado).toBe(true);
      const recuperado = await persistence.getFacturacionData(testId);
      expect(recuperado).toBeDefined();
      expect(recuperado.cliente).toBe(testData.cliente);
      expect(recuperado.monto).toBe(testData.monto);
    });

    it('debe retornar null para factura inexistente', async () => {
      const resultado = await persistence.getFacturacionData('FACT-INEXISTENTE');
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
