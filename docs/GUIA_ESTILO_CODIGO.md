# 📝 Guía de Estilo de Código - TitanFleet ERP

**Versión:** 1.0.0  
**Última actualización:** $(Get-Date -Format "yyyy-MM-dd")

---

## 🎯 Objetivo

Esta guía establece los estándares de código para mantener consistencia, legibilidad y mantenibilidad en todo el proyecto TitanFleet ERP.

---

## 📋 Tabla de Contenidos

1. [JavaScript](#javascript)
2. [HTML](#html)
3. [CSS/SCSS](#cssscss)
4. [Nomenclatura](#nomenclatura)
5. [Estructura de Archivos](#estructura-de-archivos)
6. [Comentarios](#comentarios)
7. [Manejo de Errores](#manejo-de-errores)
8. [Herramientas](#herramientas)

---

## 🔷 JavaScript

### Indentación y Espaciado

```javascript
// ✅ CORRECTO: 2 espacios
function ejemplo() {
  const variable = 'valor';
  if (condicion) {
    return true;
  }
}

// ❌ INCORRECTO: Tabs o 4 espacios
function ejemplo() {
    const variable = 'valor';
}
```

### Comillas

```javascript
// ✅ CORRECTO: Comillas simples para strings
const mensaje = 'Hola mundo';
const template = `Template con ${variable}`;

// ❌ INCORRECTO: Comillas dobles
const mensaje = "Hola mundo";
```

### Punto y Coma

```javascript
// ✅ CORRECTO: Siempre usar punto y coma
const variable = 'valor';
function ejemplo() {
  return true;
}

// ❌ INCORRECTO: Sin punto y coma
const variable = 'valor'
function ejemplo() {
  return true
}
```

### Declaración de Variables

```javascript
// ✅ CORRECTO: const por defecto, let solo si cambia
const nombre = 'TitanFleet';
let contador = 0;
contador++;

// ❌ INCORRECTO: var o const innecesario
var nombre = 'TitanFleet';
const contador = 0;
contador++; // Error: no se puede modificar const
```

### Funciones

```javascript
// ✅ CORRECTO: Arrow functions para callbacks, function para métodos
const procesarDatos = (datos) => {
  return datos.map(item => item.nombre);
};

function ClaseEjemplo() {
  this.metodo = function() {
    // ...
  };
}

// ✅ CORRECTO: Function declarations para funciones principales
function inicializarSistema() {
  // ...
}

// ❌ INCORRECTO: Mezclar estilos inconsistentemente
const procesarDatos = function(datos) {
  // ...
};
```

### Objetos y Arrays

```javascript
// ✅ CORRECTO: Espacios en objetos, sin espacios en arrays
const objeto = { nombre: 'valor', id: 1 };
const array = [1, 2, 3];

// ❌ INCORRECTO
const objeto = {nombre: 'valor', id: 1};
const array = [ 1, 2, 3 ];
```

### Comparaciones

```javascript
// ✅ CORRECTO: === y !== siempre
if (valor === 10) {
  // ...
}

// ❌ INCORRECTO: == y !=
if (valor == 10) {
  // ...
}
```

### Manejo de Errores

```javascript
// ✅ CORRECTO: Try-catch con manejo apropiado
try {
  const resultado = await operacion();
  return resultado;
} catch (error) {
  console.error('Error en operacion:', error);
  throw error;
}

// ❌ INCORRECTO: Try-catch vacío o sin manejo
try {
  operacion();
} catch (e) {
  // Ignorar
}
```

---

## 🔷 HTML

### Estructura

```html
<!-- ✅ CORRECTO: Indentación consistente, atributos en líneas separadas si son muchos -->
<div class="container">
  <div class="row">
    <div class="col-md-6">
      <button class="btn btn-primary" data-action="guardar">
        Guardar
      </button>
    </div>
  </div>
</div>

<!-- ❌ INCORRECTO: Sin indentación o atributos inline largos -->
<div class="container"><div class="row"><div class="col-md-6"><button onclick="guardar()">Guardar</button></div></div></div>
```

### Atributos

```html
<!-- ✅ CORRECTO: data-action en lugar de onclick -->
<button data-action="guardar">Guardar</button>

<!-- ❌ INCORRECTO: Atributos inline -->
<button onclick="guardar()">Guardar</button>
```

### Comentarios

```html
<!-- ✅ CORRECTO: Comentarios descriptivos -->
<!-- Sidebar Navigation -->
<nav class="sidebar">
  <!-- ... -->
</nav>

<!-- ❌ INCORRECTO: Comentarios innecesarios o sin sentido -->
<!-- div -->
<div>
  <!-- ... -->
</div>
```

---

## 🔷 CSS/SCSS

### Indentación

```scss
// ✅ CORRECTO: 2 espacios
.selector {
  color: #000;
  font-size: 16px;
  
  &:hover {
    color: #333;
  }
}

// ❌ INCORRECTO: Tabs o sin indentación
.selector {
color: #000;
}
```

### Nomenclatura

```scss
// ✅ CORRECTO: kebab-case para clases
.btn-primary {
  // ...
}

.sidebar-nav {
  // ...
}

// ❌ INCORRECTO: camelCase o snake_case
.btnPrimary {
  // ...
}

.sidebar_nav {
  // ...
}
```

---

## 📝 Nomenclatura

### Variables y Funciones

```javascript
// ✅ CORRECTO: camelCase
const nombreUsuario = 'Juan';
function obtenerDatos() {
  // ...
}

// ❌ INCORRECTO: snake_case o PascalCase para funciones
const nombre_usuario = 'Juan';
function ObtenerDatos() {
  // ...
}
```

### Clases

```javascript
// ✅ CORRECTO: PascalCase
class FirebaseRepo {
  // ...
}

// ❌ INCORRECTO: camelCase o snake_case
class firebaseRepo {
  // ...
}
```

### Constantes

```javascript
// ✅ CORRECTO: UPPER_SNAKE_CASE
const MAX_INTENTOS = 3;
const API_BASE_URL = 'https://api.example.com';

// ❌ INCORRECTO: camelCase
const maxIntentos = 3;
```

### Archivos

```
// ✅ CORRECTO: kebab-case
event-handlers.js
firebase-init.js
registros-loader.js

// ❌ INCORRECTO: camelCase o snake_case
eventHandlers.js
firebase_init.js
```

---

## 📁 Estructura de Archivos

### Organización

```
assets/
  scripts/
    [modulo]/
      event-handlers.js
      registros-loader.js
      registros-save.js
      ...
  styles/
    [modulo].css
    ...
pages/
  [modulo].html
```

### Nombres de Archivos

- **JavaScript:** `kebab-case.js`
- **HTML:** `kebab-case.html`
- **CSS:** `kebab-case.css`
- **Tests:** `[nombre].test.js` o `[nombre].spec.js`

---

## 💬 Comentarios

### Comentarios de Función

```javascript
/**
 * Obtiene los datos de un registro desde Firebase
 * @param {string} registroId - ID del registro a buscar
 * @returns {Promise<Object>} Datos del registro
 */
async function obtenerRegistro(registroId) {
  // ...
}
```

### Comentarios Inline

```javascript
// ✅ CORRECTO: Comentarios útiles y descriptivos
// Cargar datos desde Firebase si no están en cache
if (!datosCache) {
  datosCache = await cargarDesdeFirebase();
}

// ❌ INCORRECTO: Comentarios obvios o innecesarios
// Incrementar contador
contador++;
```

### Comentarios de Sección

```javascript
// ✅ CORRECTO: Comentarios de sección claros
// ===== INICIALIZACIÓN =====
function inicializar() {
  // ...
}

// ===== EVENT HANDLERS =====
function setupEventHandlers() {
  // ...
}
```

---

## ⚠️ Manejo de Errores

### Try-Catch

```javascript
// ✅ CORRECTO: Manejo apropiado de errores
try {
  const resultado = await operacion();
  return resultado;
} catch (error) {
  console.error('Error en operacion:', error);
  if (window.errorHandler) {
    window.errorHandler.handleError(error);
  }
  throw error;
}

// ❌ INCORRECTO: Ignorar errores
try {
  operacion();
} catch (e) {
  // Silenciar
}
```

### Validaciones

```javascript
// ✅ CORRECTO: Validaciones tempranas
function procesarDatos(datos) {
  if (!datos || !Array.isArray(datos)) {
    throw new Error('Datos inválidos');
  }
  // ...
}

// ❌ INCORRECTO: Sin validaciones
function procesarDatos(datos) {
  return datos.map(item => item.nombre);
}
```

---

## 🛠️ Herramientas

### ESLint

```bash
# Verificar errores
npm run lint

# Corregir automáticamente
npm run lint:fix
```

### Prettier

```bash
# Formatear código
npm run format

# Verificar formato
npm run format:check
```

### EditorConfig

Configuración automática para editores compatibles (VS Code, WebStorm, etc.)

---

## ✅ Checklist de Código

Antes de hacer commit, verifica:

- [ ] Código formateado con Prettier
- [ ] Sin errores de ESLint
- [ ] Nomenclatura consistente (camelCase, PascalCase, kebab-case)
- [ ] Sin código comentado innecesario
- [ ] Comentarios útiles donde sea necesario
- [ ] Manejo apropiado de errores
- [ ] Sin `console.log` de debug en producción
- [ ] Variables declaradas con `const` o `let` (nunca `var`)
- [ ] Comparaciones con `===` y `!==`
- [ ] Sin atributos inline en HTML (`onclick`, `onchange`, etc.)

---

## 📚 Recursos

- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [EditorConfig](https://editorconfig.org/)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
