# Tests E2E - Guía de Uso

## Helper de Autenticación

Se ha creado un helper de autenticación para facilitar los tests E2E. El helper permite hacer login automáticamente antes de ejecutar tests en páginas protegidas.

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
  
  test('mi test', async ({ page }) => {
    // Tu test aquí
  });
});
```

### Opciones de Login

```javascript
// Login con credenciales personalizadas
await login(page, {
  email: 'usuario@ejemplo.com',
  password: 'contraseña123',
  tenantId: 'mi_tenant'
});

// Login con credenciales por defecto (demo)
await login(page); // Usa demo@titanfleet.com / demo123
```

### Funciones Disponibles

#### `login(page, options)`
Hace login en la aplicación. Intenta primero login programático (más rápido) y si falla, usa el formulario del modal.

#### `isAuthenticated(page)`
Verifica si el usuario está autenticado revisando localStorage.

#### `logout(page)`
Hace logout limpiando la sesión y localStorage.

#### `setMockSession(page, userData)`
Establece una sesión mock directamente en localStorage sin hacer login completo. Útil para tests rápidos.

### Variables de Entorno

Puedes configurar credenciales por defecto usando variables de entorno:

```bash
TEST_USER_EMAIL=usuario@ejemplo.com
TEST_USER_PASSWORD=contraseña
TEST_TENANT_ID=tenant_id
```

### Ejemplo Completo

```javascript
import { test, expect } from '@playwright/test';
import { login, isAuthenticated, logout } from './helpers/auth.helper.js';

test.describe('Tests con Autenticación', () => {
  test('test con login automático', async ({ page }) => {
    // Hacer login
    await login(page);
    
    // Verificar que estamos autenticados
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
    
    // Navegar a página protegida
    await page.goto('/pages/mi-pagina.html');
    
    // Tu test aquí
    // ...
    
    // Logout opcional (se hace automáticamente si usas fixtures)
    await logout(page);
  });
});
```

## Credenciales de Prueba

Por defecto, el helper usa:
- **Email**: `demo@titanfleet.com`
- **Password**: `demo123`
- **Tenant ID**: `demo`

Asegúrate de que estas credenciales existan en tu base de datos de Firebase o ajusta las credenciales en los tests según sea necesario.


