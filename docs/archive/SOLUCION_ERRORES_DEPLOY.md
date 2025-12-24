# 🔧 Solución de Errores de Deploy

**Fecha:** $(Get-Date -Format "yyyy-MM-dd HH:mm")

---

## ❌ ERRORES ENCONTRADOS Y SOLUCIONADOS

### Error 1: "eslint" no se reconoce como comando ✅ SOLUCIONADO
```
"eslint" no se reconoce como un comando interno o externo
```

**Causa:** ESLint no está instalado en `node_modules` o no está en el PATH.

**Solución:**
```bash
# Instalar todas las dependencias
npm install

# O instalar ESLint específicamente
npm install --save-dev eslint
```

### Error 2: "run" no se reconoce como comando ✅ SOLUCIONADO
```
"run" no se reconoce como un comando interno o externo
```

**Causa:** Falta el prefijo `npm` antes del comando.

**Solución:**
```bash
# ❌ Incorrecto
run format

# ✅ Correcto
npm run format
```

---

## ✅ SOLUCIÓN APLICADA

1. **Instalación de dependencias:**
   ```bash
   npm install
   ```
   Esto instalará todas las dependencias incluyendo ESLint y Prettier.

2. **Verificación:**
   ```bash
   npx eslint --version
   npx prettier --version
   ```

---

## 📋 COMANDOS CORRECTOS

### Verificación Pre-Deploy:
```bash
# 1. Verificar y corregir código
npm run lint:fix
npm run format

# 2. Compilar proyecto
npm run build
```

### Deploy:
```bash
# Deploy completo
npm run deploy:all

# O solo hosting
npm run deploy:hosting
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Siempre usa `npm run`** antes de los comandos de scripts
2. **Si ESLint no funciona**, ejecuta `npm install` primero
3. **Usa `npx`** para ejecutar comandos de paquetes instalados localmente:
   - `npx eslint` en lugar de `eslint`
   - `npx prettier` en lugar de `prettier`

---

## 🔍 VERIFICACIÓN

Después de instalar, verifica que todo funcione:

```bash
# Verificar ESLint
npx eslint --version

# Verificar Prettier
npx prettier --version

# Probar lint
npm run lint

# Probar format
npm run format:check
```

---

---

## ✅ ERROR 3: ESLint - Environment key "vitest" is unknown ✅ SOLUCIONADO

### Error:
```
Error: .eslintrc.json#overrides[0]:
        Environment key "vitest" is unknown
```

**Causa:** ESLint no reconoce "vitest" como un entorno válido sin el plugin correspondiente.

**Solución aplicada:**
- Removida la referencia a `"vitest": true` del `env` en los overrides
- Agregados los globals necesarios para tests (`describe`, `it`, `test`, `expect`, `vi`, etc.)
- Configuración simplificada para evitar dependencias adicionales

**Archivo corregido:** `.eslintrc.json`

---

---

## ✅ ERROR 4: Executable files forbidden on Spark plan ✅ SOLUCIONADO

### Error:
```
Error: Executable files are forbidden on the Spark billing plan.
For more details, see https://firebase.google.com/support/faq#hosting-exe-restrictions
```

**Causa:** Firebase Hosting en el plan Spark (gratuito) no permite archivos ejecutables (.exe, .bat, .cmd, .ps1, .sh, .py, etc.).

**Archivos problemáticos encontrados:**
- `actualizar-rutas.bat`
- `scripts/*.bat`, `scripts/*.ps1`, `scripts/*.py`
- Archivos de configuración de testing

**Solución aplicada:**
- Agregados patrones de exclusión en `firebase.json`:
  - `**/*.exe`
  - `**/*.bat`
  - `**/*.cmd`
  - `**/*.ps1`
  - `**/*.sh`
  - `**/*.py`
  - `**/scripts/**` (excluir toda la carpeta de scripts)
  - `**/tests/**` (excluir carpeta de tests)
  - `**/*.test.js`, `**/*.spec.js`
  - `**/playwright.config.js`, `**/vitest.config.js`

**Archivo corregido:** `firebase.json`

**Nota:** Los archivos ejecutables son scripts de desarrollo y no son necesarios en producción.

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
