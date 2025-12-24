# 🔧 Comandos para CMD (Command Prompt)

## ⚠️ Nota
Estos comandos funcionan en **CMD** (Command Prompt), no en PowerShell.

---

## 📋 Paso 1: Ver Estado Actual (Opcional)

**Comando:**
```cmd
npm run lint | findstr "problems"
```

**O simplemente:**
```cmd
npm run lint
```
Y busca la línea que dice "problems" en la salida.

---

## 📋 Paso 2: Ejecutar Auto-fix (PRINCIPAL)

**Comando:**
```cmd
npm run lint:fix
```

**Qué esperar:**
- El proceso puede tardar varios minutos
- Verás mensajes como: `Fixed X problems`
- Al final verás un resumen

**⚠️ Importante:**
- Este comando **modifica archivos automáticamente**
- Es seguro, solo arregla problemas de formato y estilo
- No cambia la lógica del código

---

## 📋 Paso 3: Verificar Resultados

**Comando:**
```cmd
npm run lint | findstr "problems"
```

**O simplemente:**
```cmd
npm run lint
```
Y busca la línea que dice "problems" en la salida.

---

## 🔄 Alternativa: Usar PowerShell

Si prefieres usar PowerShell (tiene comandos más potentes):

1. **Abre PowerShell:**
   - Presiona `Win + X`
   - Selecciona "Windows PowerShell" o "Terminal"
   - O busca "PowerShell" en el menú de inicio

2. **Navega a tu proyecto:**
   ```powershell
   cd "C:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma"
   ```

3. **Ejecuta los comandos de `PASO_A_PASO_ESLINT.md`**

---

## 💡 Recomendación

**Para este proceso, te recomiendo usar CMD con estos comandos simples:**

1. **Ver estado actual:**
   ```cmd
   npm run lint
   ```
   (Busca la línea con "problems" en la salida)

2. **Ejecutar auto-fix:**
   ```cmd
   npm run lint:fix
   ```

3. **Ver resultados:**
   ```cmd
   npm run lint
   ```
   (Busca la línea con "problems" en la salida y compara)

---

**¡Ejecuta el Paso 2 ahora! 🚀**

