# Guía de Tests E2E con Playwright

## Instalación

### 1. Instalar navegadores de Playwright

Antes de ejecutar los tests E2E, necesitas instalar los navegadores de Playwright:

```bash
npm run test:e2e:install
```

O directamente:

```bash
npx playwright install --with-deps
```

El flag `--with-deps` instala también las dependencias del sistema necesarias para los navegadores.

### 2. Verificar instalación

Para verificar que los navegadores están instalados correctamente:

```bash
npx playwright --version
```

## Ejecución de Tests

### Ejecutar todos los tests E2E

```bash
npm run test:e2e
```

### Ejecutar tests en modo UI (interactivo)

```bash
npm run test:e2e:ui
```

### Ejecutar tests con navegador visible (headed mode)

```bash
npm run test:e2e:headed
```

### Ejecutar un test específico

```bash
npx playwright test tests/e2e/login.spec.js
```

### Ejecutar tests en un navegador específico

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Configuración

La configuración de Playwright se encuentra en `playwright.config.js`:

- **Base URL**: `http://localhost:3000` (configurable con variable de entorno `BASE_URL`)
- **Timeout**: 60 segundos por test (aumentado para SPAs)
- **Navegadores**: Chromium, Firefox, WebKit
- **Servidor**: Se inicia automáticamente con `npm run serve` en el puerto 3000

## Helper de Autenticación

Se ha creado un helper de autenticación (`tests/e2e/helpers/auth.helper.js`) que permite hacer login automáticamente antes de los tests.

### Uso Básico

```javascript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth.helper.js';

test.describe('Módulo Ejemplo', () => {
  test.beforeEach(async ({ page }) => {
    // Hacer login antes de acceder a páginas protegidas
    await login(page);
    
    // Navegar a la página protegida
    await page.goto('/pages/ejemplo.html');
  });
});
```

### Funciones Disponibles

- **`login(page, options)`**: Hace login automáticamente
- **`isAuthenticated(page)`**: Verifica si hay sesión activa
- **`logout(page)`**: Cierra la sesión
- **`setMockSession(page, userData)`**: Establece una sesión mock sin hacer login completo

Ver `tests/e2e/README.md` para más detalles.

## Notas Importantes sobre la Aplicación

Esta aplicación es una **SPA (Single Page Application)** que:

1. **Sistema de autenticación**: Redirige a `index.html` si no hay sesión válida
2. **Conexiones persistentes**: Usa Firebase y otras conexiones que pueden mantener `networkidle` indefinidamente
3. **Routing del lado del cliente**: Las rutas pueden cambiar dinámicamente

Por lo tanto, los tests:
- Usan `domcontentloaded` en lugar de `networkidle` para evitar timeouts
- Incluyen esperas adicionales para scripts de inicialización
- Hacen login automáticamente antes de acceder a páginas protegidas usando el helper

## Troubleshooting

### Error: "Executable doesn't exist"

Este error indica que los navegadores de Playwright no están instalados. Solución:

```bash
npm run test:e2e:install
```

### Error: "Port 3000 is already in use"

El puerto 3000 ya está en uso. Soluciones:

1. Cerrar el proceso que usa el puerto 3000
2. Cambiar el puerto en `playwright.config.js` y en `package.json` (script `serve`)
3. Usar `reuseExistingServer: true` en la configuración (ya está configurado)

### Tests fallan por timeout

Los tests están configurados con un timeout de 60 segundos. Si aún fallan:

1. Verificar que el servidor se está iniciando correctamente
2. Verificar que las páginas no están redirigiendo indefinidamente
3. Revisar los videos y screenshots en `test-results/` para ver qué está pasando

### Tests fallan porque la aplicación redirige a index.html

Esto es normal si no hay una sesión válida. Los tests están diseñados para:
- Tolerar estas redirecciones
- Verificar que la página carga correctamente (incluso si es index.html)
- No fallar si no hay sesión activa

Para tests que requieren autenticación, necesitarás:
1. Configurar credenciales de prueba
2. Hacer login antes de los tests
3. Guardar el estado de autenticación

### Elementos no están visibles

Si los elementos no están visibles:
1. Verificar los selectores en los tests
2. Esperar explícitamente a que los elementos aparezcan:
   ```js
   await element.waitFor({ state: 'visible', timeout: 10000 });
   ```
3. Revisar si hay overlays, modales o animaciones bloqueando los elementos

## CI/CD

En GitHub Actions, los navegadores se instalan automáticamente con:

```yaml
- name: Instalar dependencias de Playwright
  run: npx playwright install --with-deps
```

## Reportes

Los reportes de los tests se generan en:

- **HTML**: `playwright-report/index.html`
- **JSON**: `test-results/results.json`
- **JUnit**: `test-results/junit.xml`

Para ver el reporte HTML:

```bash
npx playwright show-report
```

## Mejoras Futuras

1. **Configurar autenticación para tests**: Crear un helper que haga login antes de los tests
2. **Mock de Firebase**: Para tests más rápidos y confiables
3. **Test fixtures**: Para reutilizar código de setup común
4. **Data attributes**: Agregar `data-testid` a elementos importantes para selectores más robustos
