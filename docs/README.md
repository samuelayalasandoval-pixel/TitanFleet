# 🎨 Sistema de Diseño ERP Rankiao

## 📋 Descripción General

Sistema de diseño profesional y escalable para el ERP Rankiao, construido con Sass/SCSS y siguiendo las mejores prácticas de arquitectura frontend.

## 🏗️ Arquitectura del Proyecto

```
📁 Proyecto ERP Rankiao/
├── 📁 assets/
│   ├── 📁 styles/           # Sistema de diseño Sass/SCSS
│   │   ├── 📁 base/         # Variables, mixins, funciones
│   │   ├── 📁 components/   # Componentes reutilizables
│   │   ├── 📁 layouts/      # Layouts y templates
│   │   ├── 📁 pages/        # Estilos específicos de páginas
│   │   └── 📁 utilities/    # Clases utilitarias
│   ├── 📁 scripts/          # JavaScript del sistema
│   └── 📁 icons/            # Iconografía del sistema
├── 📁 components/            # Componentes HTML reutilizables
├── 📁 layouts/               # Layouts y templates
├── 📁 pages/                 # Páginas principales
├── 📁 docs/                  # Documentación del sistema
└── 📁 styles/                # CSS compilado (generado)
```

## 🎨 Sistema de Colores

### Colores Principales
- **Primary**: `#2ea3ab` - Azul principal de Rankiao
- **Secondary**: `#424242` - Gris corporativo
- **Accent**: `#3498db` - Azul de acento

### Colores Semánticos
- **Success**: `#27ae60` - Verde de éxito
- **Warning**: `#f39c12` - Amarillo de advertencia
- **Danger**: `#e74c3c` - Rojo de error
- **Info**: `#17a2b8` - Azul informativo

### Escala de Grises
- **Gray-50**: `#f8f9fa` - Fondo más claro
- **Gray-900**: `#000000` - Texto más oscuro

## 🔤 Tipografía

### Familias de Fuentes
- **Primary**: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- **Secondary**: `'Georgia', 'Times New Roman', serif`
- **Mono**: `'Consolas', 'Monaco', 'Courier New', monospace`

### Tamaños de Fuente
- **Base**: `16px`
- **XS**: `12px` (0.75rem)
- **SM**: `14px` (0.875rem)
- **MD**: `16px` (1rem)
- **LG**: `18px` (1.125rem)
- **XL**: `20px` (1.25rem)
- **2XL**: `24px` (1.5rem)
- **3XL**: `30px` (1.875rem)
- **4XL**: `36px` (2.25rem)
- **5XL**: `48px` (3rem)

## 📏 Sistema de Espaciado

Basado en múltiplos de 8px:
- **XS**: `4px`
- **SM**: `8px`
- **MD**: `16px`
- **LG**: `24px`
- **XL**: `32px`
- **2XL**: `40px`
- **3XL**: `48px`
- **4XL**: `64px`
- **5XL**: `80px`

## 📱 Breakpoints Responsive

- **XS**: `0px` - Móviles pequeños
- **SM**: `480px` - Móviles
- **MD**: `768px` - Tablets
- **LG**: `1024px` - Laptops
- **XL**: `1200px` - Desktops
- **2XL**: `1400px` - Pantallas grandes

## 🧩 Componentes del Sistema

### Botones
```scss
// Botón primario
<button class="btn btn--primary">Acción Principal</button>

// Botón secundario outline
<button class="btn btn--secondary btn--outline">Acción Secundaria</button>

// Botón de carga
<button class="btn btn--primary btn--loading">Procesando...</button>

// Botón flotante
<button class="btn-float">+</button>
```

### Formularios
```scss
// Input base
<input type="text" class="form-input" placeholder="Ingresa texto">

// Input con icono
<div class="input-wrapper">
  <span class="input-icon">👤</span>
  <input type="text" class="form-input" placeholder="Usuario">
</div>
```

### Cards
```scss
// Card base
<div class="card">
  <h3 class="card__title">Título de la Card</h3>
  <p class="card__content">Contenido de la card...</p>
</div>
```

## 🚀 Uso del Sistema

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Desarrollo
```bash
npm run start
```
Esto ejecuta:
- Compilación de Sass en modo watch
- Servidor de desarrollo en puerto 3000

### 3. Construcción para Producción
```bash
npm run build
```

### 4. Construcción para Desarrollo
```bash
npm run build:dev
```

## 📖 Mixins Principales

### Responsive Design
```scss
@include respond-to('md') {
  // Estilos para tablets y superiores
}

@include respond-below('lg') {
  // Estilos para pantallas menores a 1024px
}
```

### Layout
```scss
@include flex-center;      // Flexbox centrado
@include flex-between;     // Flexbox con espacio entre
@include absolute-center;  // Posicionamiento absoluto centrado
```

### Componentes
```scss
@include button-base;      // Estilos base de botón
@include button-variant($bg, $text, $hover); // Variante de botón
@include card-base;        // Estilos base de card
@include input-base;       // Estilos base de input
```

### Animaciones
```scss
@include fade-in;          // Fade in
@include slide-in('up');   // Slide in hacia arriba
@include hover-lift;       // Efecto hover de elevación
@include scale-on-hover;   // Escala en hover
```

## 🎯 Convenciones de Nomenclatura

### BEM (Block Element Modifier)
```scss
.block {
  &__element {
    &--modifier {
      // Estilos del modificador
    }
  }
}
```

### Ejemplo Práctico
```scss
.card {
  &__title {
    font-size: $font-size-2xl;
    
    &--large {
      font-size: $font-size-3xl;
    }
  }
  
  &__content {
    color: $text-secondary;
  }
}
```

## 🔧 Configuración de Herramientas

### Sass Compiler
- **Input**: `assets/styles/main.scss`
- **Output**: `styles/main.css`
- **Watch Mode**: Automático en desarrollo

### Linting y Formateo
- **Stylelint**: Para validación de SCSS
- **Prettier**: Para formateo automático

## 📚 Recursos Adicionales

### Documentación Técnica
- **[Documentación Técnica Completa](./DOCUMENTACION_TECNICA.md)** - Orden de carga, estructura de repositorios, flujo de datos y patrones de código
- **[Sistema de Testing y Validación](./SISTEMA_TESTING.md)** - Tests unitarios, tests de integración y validaciones de formularios
- [Guía de Diagnóstico](./GUIA_DIAGNOSTICO.md)
- [Solución de Orden de Scripts](./SOLUCION_ORDEN_SCRIPTS.md)
- [Sistema de Manejo de Errores](./SISTEMA_MANEJO_ERRORES.md)

### Guías de Diseño
- [Guía de Componentes](./components.md)
- [Guía de Utilidades](./utilities.md)
- [Guía de Animaciones](./animations.md)
- [Guía de Responsive](./responsive.md)

## 🤝 Contribución

1. Sigue las convenciones de nomenclatura
2. Usa los mixins del sistema
3. Documenta nuevos componentes
4. Mantén la consistencia visual

## 📞 Soporte

Para dudas o sugerencias sobre el sistema de diseño, contacta al equipo de desarrollo.

---

**ERP Rankiao** - Sistema de Diseño v1.0.0















