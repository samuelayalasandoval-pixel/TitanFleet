# 📝 Guía Paso a Paso - Semana 1: Configuración Base

**Duración estimada:** 2 días  
**Dificultad:** ⭐⭐ (Fácil-Medio)

---

## ✅ PASO 1: Verificar Instalaciones Actuales

### 1.1 Abrir Terminal
- Presiona `Ctrl + Shift + '` en VS Code (o abre PowerShell/CMD)
- Asegúrate de estar en la carpeta del proyecto:
  ```bash
  cd "C:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma"
  ```

### 1.2 Verificar que Node.js y npm están instalados
```bash
node --version
npm --version
```
**Resultado esperado:** Deberías ver números de versión (ej: v18.x.x y 9.x.x)

### 1.3 Verificar instalaciones actuales
```bash
npm list eslint prettier --depth=0
```
**Resultado esperado:** Deberías ver que ESLint y Prettier ya están instalados

---

## ✅ PASO 2: Mejorar Configuración de ESLint

### 2.1 Verificar archivo actual
El archivo `.eslintrc.json` ya existe y tiene una buena configuración base. Vamos a mejorarlo.

### 2.2 Abrir el archivo
- Abre `.eslintrc.json` en tu editor
- O ejecuta: `code .eslintrc.json`

### 2.3 Actualizar configuración (OPCIONAL - Solo si quieres reglas más estrictas)

**Opción A: Mantener configuración actual (Recomendado)**
- Tu configuración actual ya es bastante buena
- Solo necesitamos verificar que funciona

**Opción B: Agregar reglas adicionales**
Si quieres hacer la configuración más estricta, puedes agregar estas reglas al objeto `"rules"`:

```json
{
  "rules": {
    // ... tus reglas actuales ...
    
    // Nuevas reglas estrictas (agregar al final)
    "no-debugger": "error",
    "no-alert": "warn",
    "no-duplicate-imports": "error",
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "use-isnan": "error",
    "valid-typeof": "error"
  }
}
```

**Para este tutorial, vamos a mantener tu configuración actual y solo verificar que funciona.**

---

## ✅ PASO 3: Verificar Configuración de Prettier

### 3.1 Verificar archivo
El archivo `.prettierrc.json` ya existe. Vamos a verificar que está bien configurado.

### 3.2 Revisar configuración actual
Tu configuración actual es:
- ✅ `singleQuote: true` - Usa comillas simples
- ✅ `semi: true` - Punto y coma al final
- ✅ `tabWidth: 2` - Indentación de 2 espacios
- ✅ `printWidth: 100` - Líneas de máximo 100 caracteres

**Esto está perfecto, no necesitas cambiar nada.**

---

## ✅ PASO 4: Verificar .editorconfig

### 4.1 Verificar archivo
El archivo `.editorconfig` ya existe y está bien configurado.

**No necesitas hacer cambios aquí.**

---

## ✅ PASO 5: Crear/Verificar .eslintignore

### 5.1 Verificar si existe
Ya existe un archivo `.eslintignore`. Vamos a verificar su contenido.

### 5.2 Abrir y revisar
Abre `.eslintignore` y asegúrate de que tenga al menos esto:

```
node_modules/
dist/
build/
coverage/
*.min.js
firebase.json
package-lock.json
```

Si falta algo, agrégalo.

---

## ✅ PASO 6: Probar que ESLint Funciona

### 6.1 Ejecutar ESLint en modo verificación
```bash
npm run lint
```

**Resultado esperado:**
- Si hay errores, los verás listados
- Si no hay errores, verás un mensaje de éxito o nada

### 6.2 Ejecutar ESLint con auto-fix
```bash
npm run lint:fix
```

**Esto intentará corregir automáticamente los errores que pueda.**

### 6.3 Verificar un archivo específico (opcional)
```bash
npx eslint assets/scripts/main.js
```

---

## ✅ PASO 7: Probar que Prettier Funciona

### 7.1 Verificar formato (sin cambiar archivos)
```bash
npm run format:check
```

**Resultado esperado:** Te dirá si hay archivos que necesitan formateo

### 7.2 Formatear archivos automáticamente
```bash
npm run format
```

**⚠️ ADVERTENCIA:** Esto modificará tus archivos. Si quieres probar primero en un archivo pequeño:

```bash
npx prettier --write assets/scripts/utils/validation.js
```

(Si el archivo no existe, crea uno de prueba primero)

### 7.3 Formatear solo un archivo específico (prueba)
```bash
npx prettier --write CHECKLIST_INICIO_RAPIDO.md
```

---

## ✅ PASO 8: Configurar Pre-commit Hooks (OPCIONAL - Avanzado)

### 8.1 Instalar Husky (para hooks de Git)
```bash
npm install --save-dev husky
```

### 8.2 Inicializar Husky
```bash
npx husky init
```

### 8.3 Crear hook pre-commit
Crea el archivo `.husky/pre-commit` con este contenido:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint:fix
npm run format
```

### 8.4 Hacer el archivo ejecutable (en Windows, esto puede no ser necesario)
```bash
# En Windows, esto generalmente no es necesario
# Pero si usas Git Bash, puedes ejecutar:
chmod +x .husky/pre-commit
```

**Nota:** Si no usas Git o no quieres configurar esto ahora, puedes saltarlo.

---

## ✅ PASO 9: Verificar que Todo Funciona Juntos

### 9.1 Ejecutar todos los checks
```bash
npm run lint
npm run format:check
```

### 9.2 Si todo está bien, deberías ver:
- ✅ ESLint: Sin errores críticos (puede haber warnings, eso está bien)
- ✅ Prettier: Todos los archivos están formateados correctamente

---

## ✅ PASO 10: Crear Script de Verificación Rápida

### 10.1 Agregar script a package.json
Abre `package.json` y agrega este script en la sección `"scripts"`:

```json
"scripts": {
  // ... tus scripts existentes ...
  "check": "npm run lint && npm run format:check",
  "fix": "npm run lint:fix && npm run format"
}
```

### 10.2 Probar el nuevo script
```bash
npm run check
```

Esto ejecutará ambos checks a la vez.

---

## 📋 Checklist de Verificación Final

Marca cada item cuando lo completes:

- [ ] ✅ Node.js y npm están instalados y funcionando
- [ ] ✅ ESLint está instalado (`npm list eslint`)
- [ ] ✅ Prettier está instalado (`npm list prettier`)
- [ ] ✅ `.eslintrc.json` existe y está configurado
- [ ] ✅ `.prettierrc.json` existe y está configurado
- [ ] ✅ `.editorconfig` existe y está configurado
- [ ] ✅ `.eslintignore` existe
- [ ] ✅ `npm run lint` funciona sin errores críticos
- [ ] ✅ `npm run lint:fix` funciona
- [ ] ✅ `npm run format` funciona
- [ ] ✅ `npm run format:check` funciona
- [ ] ✅ Scripts `check` y `fix` agregados a package.json (opcional)

---

## 🎯 Resultado Esperado

Al final de estos pasos, deberías tener:

1. ✅ ESLint configurado y funcionando
2. ✅ Prettier configurado y funcionando
3. ✅ Scripts de npm listos para usar
4. ✅ Herramientas verificadas y probadas

---

## 🐛 Solución de Problemas

### Problema: "npm: command not found"
**Solución:** Instala Node.js desde https://nodejs.org/

### Problema: "ESLint no encuentra archivos"
**Solución:** Verifica que estás en la carpeta correcta del proyecto

### Problema: "Muchos errores de ESLint"
**Solución:** 
1. Ejecuta `npm run lint:fix` para corregir automáticamente
2. Los errores que no se puedan corregir automáticamente, corrígelos manualmente
3. Si hay demasiados errores, puedes empezar con reglas menos estrictas

### Problema: "Prettier cambia demasiado código"
**Solución:** 
1. Esto es normal la primera vez
2. Revisa los cambios con `git diff` antes de hacer commit
3. Si no te gusta algún formato, ajusta `.prettierrc.json`

---

## 📝 Notas Importantes

1. **No te preocupes por corregir todos los errores ahora** - Lo importante es que las herramientas funcionen
2. **Puedes formatear código gradualmente** - No necesitas formatear todo el proyecto de una vez
3. **Los warnings son normales** - Solo los errores críticos necesitan atención inmediata
4. **Guarda tu trabajo** - Haz commit de tus cambios antes de ejecutar `npm run format` por primera vez

---

## 🚀 Siguiente Paso

Una vez completados estos pasos, puedes:
1. Continuar con la **Semana 2** del checklist
2. O empezar a usar las herramientas en tu código diario

---

**¿Listo para empezar?** Ejecuta el **PASO 1** y sigue en orden. Si tienes dudas en algún paso, detente y pregunta.

