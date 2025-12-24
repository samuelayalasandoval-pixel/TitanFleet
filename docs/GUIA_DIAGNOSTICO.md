# 🔧 Guía de Diagnóstico - Problemas con el Sistema

## 🚨 Problemas Reportados
- El botón "Cargar Datos Ejemplo" no funciona
- No se puede registrar información en logística.html

## 🔍 Pasos de Diagnóstico

### Paso 1: Verificar Consola del Navegador
1. Abre cualquier página del ERP
2. Presiona **F12** para abrir las herramientas de desarrollador
3. Ve a la pestaña **"Console"**
4. Busca errores en rojo (errores de JavaScript)

### Paso 2: Probar Funcionalidad Básica
1. Ve a **Logística** o **Facturación**
2. Haz clic en el botón **"Prueba Básica"**
3. Verifica en la consola si aparecen mensajes como:
   - ✅ DataPersistence funciona: true
   - ✅ Guardar logística funciona: true
   - ✅ Recuperar logística funciona: Sí

### Paso 3: Probar Cargar Datos Ejemplo
1. Haz clic en **"Cargar Datos Ejemplo"**
2. Verifica en la consola si aparecen mensajes como:
   - 🔄 Inicializando datos de ejemplo...
   - ✅ Logística guardada para 2025-09-0007
   - ✅ Tráfico guardado para 2025-09-0007

### Paso 4: Verificar Datos Guardados
1. Haz clic en **"Debug Datos"**
2. Verifica en la consola si aparecen:
   - 📦 Registros de Logística: ['2025-09-0007', '2025-09-0008']
   - 🚛 Registros de Tráfico: ['2025-09-0007']

## 🛠️ Soluciones Comunes

### Si "Prueba Básica" falla:
- **Problema**: Los scripts no se están cargando correctamente
- **Solución**: Verifica que todos los archivos .js estén en la carpeta correcta

### Si "Cargar Datos Ejemplo" falla:
- **Problema**: Error en la función de guardado
- **Solución**: Revisa la consola para ver el error específico

### Si no aparecen notificaciones:
- **Problema**: Bootstrap no está cargado
- **Solución**: Verifica que Bootstrap esté incluido en el HTML

### Si localStorage no funciona:
- **Problema**: Navegador bloquea localStorage
- **Solución**: Verifica configuración de privacidad del navegador

## 📋 Checklist de Verificación

- [ ] Consola del navegador abierta (F12)
- [ ] Botón "Prueba Básica" ejecutado
- [ ] Botón "Cargar Datos Ejemplo" ejecutado
- [ ] Botón "Debug Datos" ejecutado
- [ ] Notificaciones aparecen en pantalla
- [ ] Datos aparecen en consola

## 🆘 Si Nada Funciona

### Verificación de Archivos:
1. Verifica que existan estos archivos:
   - `assets/scripts/data-persistence.js`
   - `assets/scripts/integration.js`
   - `assets/scripts/main.js`

### Verificación de HTML:
1. Verifica que en el HTML aparezcan estas líneas:
   ```html
   <script src="assets/scripts/data-persistence.js"></script>
   <script src="assets/scripts/integration.js"></script>
   <script src="assets/scripts/main.js"></script>
   ```

### Verificación de Navegador:
1. Prueba en un navegador diferente
2. Verifica que JavaScript esté habilitado
3. Verifica que localStorage esté habilitado

## 📞 Información para Reportar

Si sigues teniendo problemas, proporciona:
1. **Navegador usado** (Chrome, Firefox, Edge, etc.)
2. **Errores en consola** (copia y pega los mensajes en rojo)
3. **Resultado de "Prueba Básica"** (qué aparece en consola)
4. **Resultado de "Debug Datos"** (qué aparece en consola)
