# 🚀 Comandos de  - TitanFleet ERP

**Fecha:** $(Get-Date -Format "yyyy-MM-dd HH:mm")

---

## 📋 COMANDOS DISPONIBLES

### 1. **Build del Proyecto**

```bash
# Compilar SCSS a CSS (producción - comprimido)
npm run build

# Compilar SCSS a CSS (desarrollo - expandido)
npm run build:dev

# Compilar y observar cambios (desarrollo)
npm run dev
```

### 2. ** a Firebase**

```bash
#  completo (hosting + firestore rules)
npm run :all

#  solo hosting
npm run :hosting

#  solo firestore rules
npm run :firestore

#  rápido (forzado, solo hosting)
npm run :quick
```

### 3. **Verificación Pre-**

```bash
# Verificar errores de ESLint
npm run lint

# Corregir errores automáticamente
npm run lint:fix

# Verificar formato de código
npm run format:check

# Formatear código
npm run format

# Formatear todo (JS + CSS)
npm run format:all
```

---

## 🔄 PROCESO RECOMENDADO

### Paso 1: Verificación

```bash
# 1. Verificar código
npm run lint:fix
npm run format

# 2. Build
npm run build

# 3. Probar localmente
npm run serve
```

### Paso 2: 

```bash
# Opción recomendada:  completo
npm run :all

# O solo hosting si no cambiaste reglas
npm run :hosting
```

### Paso 3: Verificación Post-

1. Abrir la aplicación en el navegador
2. Verificar consola (F12) - no debe haber errores
3. Probar login
4. Probar funcionalidades principales

---

## ⚠️ NOTAS IMPORTANTES

### Antes de :

1. **Verificar configuración de Firebase:**
   - `firebase.json` está correcto
   - Reglas de Firestore están actualizadas
   - Variables de entorno están configuradas

2. **Verificar build:**
   - `npm run build` debe ejecutarse sin errores
   - Los archivos CSS deben generarse correctamente

3. **Verificar código:**
   - No debe haber `console.log` de debug
   - No debe haber código comentado innecesario
   - ESLint no debe reportar errores críticos

### Después de :

1. **Verificar carga:**
   - La aplicación debe cargar sin errores
   - Todos los assets deben cargarse
   - No debe haber errores 404

2. **Verificar funcionalidad:**
   - Autenticación funciona
   - Módulos principales funcionan
   - Firebase integration funciona

3. **Verificar consola:**
   - No debe haber errores en la consola
   - No debe haber warnings críticos

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Build failed"
```bash
# Verificar errores de compilación
npm run build

# Verificar que Sass esté instalado
npm list sass
```

### Error: "Firebase  failed"
```bash
# Verificar que estés autenticado
firebase login

# Verificar proyecto
firebase projects:list

# Verificar configuración
firebase use
```

### Error: "Permission denied"
- Verificar reglas de Firestore
- Verificar permisos del usuario en Firebase
- Verificar configuración de autenticación

---

## 📝 LOG DE 

### Fecha: _______________
### Versión: _______________
### Comando usado: _______________
### Resultado: _______________

### Problemas encontrados:
- _______________

### Soluciones aplicadas:
- _______________

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
