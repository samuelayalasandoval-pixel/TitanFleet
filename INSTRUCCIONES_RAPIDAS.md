# ⚡ Instrucciones Rápidas - Semana 1

## 🎯 Objetivo: Verificar y mejorar ESLint y Prettier

---

## 📋 PASOS A SEGUIR (Copia y pega en tu terminal)

### 1️⃣ Abrir Terminal en VS Code
```
Presiona: Ctrl + ` (backtick)
O: Terminal → New Terminal
```

### 2️⃣ Verificar que estás en la carpeta correcta
```bash
cd "C:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma"
pwd
```

### 3️⃣ Verificar Node.js y npm
```bash
node --version
npm --version
```
**✅ Deberías ver números de versión**

### 4️⃣ Verificar que ESLint y Prettier están instalados
```bash
npm list eslint prettier
```
**✅ Deberías ver que están instalados**

### 5️⃣ Probar ESLint (ver errores)
```bash
npm run lint
```
**📝 Anota cuántos errores hay (si los hay)**

### 6️⃣ Corregir errores automáticamente con ESLint
```bash
npm run lint:fix
```
**✅ Esto corregirá automáticamente los errores que pueda**

### 7️⃣ Verificar formato con Prettier (sin cambiar archivos)
```bash
npm run format:check
```
**📝 Te dirá si hay archivos que necesitan formateo**

### 8️⃣ Formatear archivos con Prettier (OPCIONAL - cambiará archivos)
```bash
npm run format
```
**⚠️ ADVERTENCIA: Esto modificará tus archivos**

### 9️⃣ Verificar que todo funciona
```bash
npm run lint
npm run format:check
```
**✅ Si no hay errores, estás listo**

---

## ✅ CHECKLIST RÁPIDO

Marca cuando completes cada paso:

- [ ] Terminal abierto
- [ ] En la carpeta correcta del proyecto
- [ ] Node.js funciona (`node --version`)
- [ ] npm funciona (`npm --version`)
- [ ] ESLint instalado (`npm list eslint`)
- [ ] Prettier instalado (`npm list prettier`)
- [ ] `npm run lint` ejecutado
- [ ] `npm run lint:fix` ejecutado
- [ ] `npm run format:check` ejecutado
- [ ] Todo funciona correctamente

---

## 🎉 ¡LISTO!

Si todos los comandos funcionaron sin errores críticos, **¡has completado la Semana 1, Día 1-2!**

---

## ❓ ¿Tienes problemas?

### Error: "npm: command not found"
→ Instala Node.js desde https://nodejs.org/

### Error: "No se encuentra el módulo"
→ Ejecuta: `npm install`

### Muchos errores de ESLint
→ Ejecuta: `npm run lint:fix` (corrige automáticamente)

### Prettier cambia mucho código
→ Es normal la primera vez. Revisa los cambios antes de hacer commit.

---

## 📚 Documentación Completa

Para más detalles, consulta: `GUIA_PASO_A_PASO_SEMANA1.md`

