# 🧪 Guía de Testing - TitanFleet ERP

Esta guía explica cómo ejecutar y escribir tests para el proyecto.

## 📋 Estructura de Tests

```
tests/
├── unit/              # Tests unitarios
│   ├── data-persistence.test.js
│   └── form-validations.test.js
├── integration/       # Tests de integración
│   └── firebase-repo.test.js
├── e2e/               # Tests end-to-end
│   ├── login.spec.js
│   ├── navegacion.spec.js
│   └── facturacion.spec.js
└── setup.js           # Configuración global
```

## 🚀 Comandos Disponibles

### Tests Unitarios

```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar en modo watch (desarrollo)
npm run test:watch

# Ejecutar con UI interactiva
npm run test:ui

# Ejecutar con reporte de cobertura
npm run test:coverage
```

### Tests E2E

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con UI interactiva
npm run test:e2e:ui

# Ejecutar en modo headed (ver el navegador)
npm run test:e2e:headed

# Ejecutar solo en Chrome
npx playwright test --project=chromium
```

### Ejecutar Todos los Tests

```bash
npm run test:all
```

## ✍️ Escribir Nuevos Tests

### Tests Unitarios

Crea un archivo en `tests/unit/` con el patrón `*.test.js`:

```javascript
import { describe, it, expect } from 'vitest';

describe('MiFuncion', () => {
  it('debe hacer algo correctamente', () => {
    expect(true).toBe(true);
  });
});
```

### Tests E2E

Crea un archivo en `tests/e2e/` con el patrón `*.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test('debe hacer algo en el navegador', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TitanFleet/);
});
```

## 📊 Cobertura de Código

El objetivo es mantener al menos:
- **60%** de líneas cubiertas
- **60%** de funciones cubiertas
- **50%** de ramas cubiertas

Ver el reporte:
```bash
npm run test:coverage
# Abre coverage/index.html en el navegador
```

## 🔧 Configuración

### Vitest (Tests Unitarios)

Configuración en `vitest.config.js`:
- Entorno: `jsdom` (simula DOM del navegador)
- Setup: `tests/setup.js`
- Cobertura: `v8`

### Playwright (Tests E2E)

Configuración en `playwright.config.js`:
- Navegadores: Chromium, Firefox, WebKit
- Timeout: 30 segundos por test
- Retries: 2 en CI, 0 en local

## 🎯 Mejores Prácticas

1. **Tests Unitarios:**
   - Prueba una función a la vez
   - Usa mocks para dependencias externas
   - Mantén tests rápidos (< 1 segundo)

2. **Tests E2E:**
   - Prueba flujos completos de usuario
   - Usa selectores estables (data-testid)
   - Espera explícitamente por elementos

3. **Nomenclatura:**
   - Tests unitarios: `*.test.js`
   - Tests E2E: `*.spec.js`
   - Describe claramente qué prueba cada test

## 🐛 Debugging

### Debug Tests Unitarios

```bash
# Con breakpoints en VS Code
npm run test:watch
# Luego usa "Debug Test" en VS Code
```

### Debug Tests E2E

```bash
# Modo headed con inspector
npm run test:e2e:ui

# O con Playwright Inspector
PWDEBUG=1 npm run test:e2e
```

## 📈 CI/CD

Los tests se ejecutan automáticamente en:
- Push a `main` o `develop`
- Pull Requests

Ver resultados en la pestaña "Actions" de GitHub.

## 🔗 Recursos

- [Documentación de Vitest](https://vitest.dev/)
- [Documentación de Playwright](https://playwright.dev/)
- [Guía de Testing del Proyecto](../docs/SISTEMA_TESTING.md)
