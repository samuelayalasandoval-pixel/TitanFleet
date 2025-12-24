# ✅ Checklist de Deploy - TitanFleet ERP

**Fecha:** $(Get-Date -Format "yyyy-MM-dd HH:mm")  
**Objetivo:** Verificar que todo funcione correctamente antes y después del deploy

---

## 🔍 VERIFICACIONES PRE-DEPLOY

### 1. **Código y Calidad** ✅

- [ ] Ejecutar `npm run lint` - Verificar que no haya errores críticos
- [ ] Ejecutar `npm run lint:fix` - Corregir errores automáticamente
- [ ] Ejecutar `npm run format:check` - Verificar formato de código
- [ ] Ejecutar `npm run format` - Formatear código si es necesario
- [ ] Verificar que no haya `console.log` de debug en producción
- [ ] Verificar que no haya código comentado innecesario

### 2. **Build y Compilación** ✅

- [ ] Ejecutar `npm run build` - Verificar que compile sin errores
- [ ] Verificar que los archivos CSS se generen correctamente
- [ ] Verificar que no haya errores en la consola del navegador
- [ ] Verificar que todos los assets se carguen correctamente

### 3. **Funcionalidad Local** ✅

- [ ] Probar autenticación (login/logout)
- [ ] Verificar que todos los módulos carguen correctamente
- [ ] Probar navegación entre páginas
- [ ] Verificar que los formularios funcionen
- [ ] Probar guardado de datos en Firebase
- [ ] Verificar sincronización de datos
- [ ] Probar exportación de datos (Excel, PDF)
- [ ] Verificar filtros y búsquedas

### 4. **Firebase Configuration** ✅

- [ ] Verificar configuración de Firebase (`firebase.json`)
- [ ] Verificar reglas de Firestore
- [ ] Verificar configuración de hosting
- [ ] Verificar que las variables de entorno estén configuradas
- [ ] Verificar que las credenciales de Firebase estén correctas

### 5. **Event Handlers y Separación JS/HTML** ✅

- [ ] Verificar que todos los `data-action` funcionen correctamente
- [ ] Probar que no haya atributos inline (`onclick`, `onchange`, etc.)
- [ ] Verificar que los event handlers se carguen correctamente
- [ ] Probar interacciones de usuario (clicks, cambios, etc.)

### 6. **Consistencia de Código** ✅

- [ ] Verificar que ESLint no reporte errores críticos
- [ ] Verificar que Prettier haya formateado el código
- [ ] Verificar que no haya uso de `var` (solo `const`/`let`)

---

## 🚀 PROCESO DE DEPLOY

### Paso 1: Preparación

```bash
# 1. Verificar estado de Git
git status

# 2. Hacer commit de cambios pendientes (si es necesario)
git add .
git commit -m "Pre-deploy: Verificaciones y mejoras aplicadas"

# 3. Verificar que estés en la rama correcta
git branch
```

### Paso 2: Build

```bash
# Compilar proyecto
npm run build

# Verificar que no haya errores
```

### Paso 3: Deploy

```bash
# Opción 1: Deploy completo (hosting + firestore rules)
npm run deploy:all

# Opción 2: Solo hosting
npm run deploy:hosting

# Opción 3: Solo firestore rules
npm run deploy:firestore

# Opción 4: Deploy rápido (forzado)
npm run deploy:quick
```

---

## ✅ VERIFICACIONES POST-DEPLOY

### 1. **Acceso y Carga** ✅

- [ ] Verificar que la aplicación cargue correctamente
- [ ] Verificar que no haya errores 404
- [ ] Verificar que todos los assets se carguen (CSS, JS, imágenes)
- [ ] Verificar tiempo de carga inicial
- [ ] Verificar que no haya errores en la consola del navegador

### 2. **Autenticación** ✅

- [ ] Probar login con credenciales válidas
- [ ] Verificar que la sesión se mantenga
- [ ] Probar logout
- [ ] Verificar redirección después de login/logout
- [ ] Verificar permisos de usuario

### 3. **Módulos Principales** ✅

#### Logística
- [ ] Crear nuevo registro
- [ ] Editar registro existente
- [ ] Eliminar registro
- [ ] Exportar datos
- [ ] Aplicar filtros

#### Facturación
- [ ] Crear nueva factura
- [ ] Editar factura
- [ ] Integración con CXC
- [ ] Exportar facturas
- [ ] Aplicar filtros

#### Tráfico
- [ ] Crear nuevo registro
- [ ] Sincronización con Firebase
- [ ] Exportar datos
- [ ] Aplicar filtros

#### Otros Módulos
- [ ] Probar al menos una funcionalidad de cada módulo
- [ ] Verificar que los datos se guarden en Firebase
- [ ] Verificar que los datos se sincronicen correctamente

### 4. **Firebase Integration** ✅

- [ ] Verificar que los datos se guarden en Firestore
- [ ] Verificar que los datos se lean correctamente
- [ ] Verificar sincronización en tiempo real
- [ ] Verificar separación multi-tenant (si aplica)
- [ ] Verificar que las reglas de Firestore funcionen

### 5. **Event Handlers** ✅

- [ ] Probar todos los botones principales
- [ ] Probar todos los formularios
- [ ] Probar todos los filtros
- [ ] Verificar que los `data-action` funcionen
- [ ] Verificar que no haya errores en consola al interactuar

### 6. **Exportación y Reportes** ✅

- [ ] Probar exportación a Excel
- [ ] Probar exportación a PDF (si aplica)
- [ ] Verificar que los reportes se generen correctamente
- [ ] Verificar que los gráficos se muestren (si aplica)

### 7. **Responsive Design** ✅

- [ ] Probar en desktop
- [ ] Probar en tablet
- [ ] Probar en móvil
- [ ] Verificar que el sidebar funcione correctamente
- [ ] Verificar que los formularios sean usables en móvil

### 8. **Performance** ✅

- [ ] Verificar tiempo de carga inicial
- [ ] Verificar tiempo de carga de módulos
- [ ] Verificar que no haya recursos bloqueantes
- [ ] Verificar uso de cache
- [ ] Verificar optimizaciones de Firebase

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Error: "Firebase not initialized"
- **Solución:** Verificar que `firebase-init.js` se cargue antes que otros scripts

### Error: "DataPersistence no está disponible"
- **Solución:** Verificar orden de carga de scripts en HTML

### Error: "Event handler not found"
- **Solución:** Verificar que los `data-action` coincidan con los handlers en `event-handlers.js`

### Error: "Module not found"
- **Solución:** Verificar rutas de importación y que los archivos existan

### Error: "Firestore permission denied"
- **Solución:** Verificar reglas de Firestore y permisos del usuario

---

## 📝 NOTAS POST-DEPLOY

### Fecha de Deploy: _______________
### Versión Desplegada: _______________
### Ambiente: _______________ (producción/staging)

### Problemas Encontrados:
- [ ] Problema 1: _______________
- [ ] Problema 2: _______________
- [ ] Problema 3: _______________

### Soluciones Aplicadas:
- [ ] Solución 1: _______________
- [ ] Solución 2: _______________
- [ ] Solución 3: _______________

### Observaciones:
- _______________
- _______________
- _______________

---

## 🎯 CHECKLIST RÁPIDO

### Antes del Deploy:
- [ ] `npm run lint` sin errores críticos
- [ ] `npm run build` exitoso
- [ ] Pruebas locales pasadas
- [ ] Git commit realizado (si es necesario)

### Después del Deploy:
- [ ] Aplicación carga correctamente
- [ ] Autenticación funciona
- [ ] Módulos principales funcionan
- [ ] Firebase integration funciona
- [ ] No hay errores en consola

---

## ✅ CONCLUSIÓN

**Estado del Deploy:** _______________

**Fecha de Verificación:** _______________

**Verificado por:** _______________

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
