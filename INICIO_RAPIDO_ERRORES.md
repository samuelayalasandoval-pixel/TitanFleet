# ⚡ Inicio Rápido: Resolver Errores

## 🎯 Comandos Esenciales (Ejecutar en este orden)

### 1️⃣ Verificar errores de sintaxis
```powershell
npm run format:check
```

### 2️⃣ Arreglar errores de sintaxis manualmente
Abre estos archivos y corrige los errores reportados:
- `assets/scripts/trafico/autocomplete-manager.js` (línea ~1781)
- `assets/scripts/trafico/init-utils.js` (línea ~289)
- `pages/CXP.html`
- `pages/inventario.html`
- `pages/mantenimiento.html`

### 3️⃣ Auto-arreglar lo que ESLint pueda
```powershell
npm run lint:fix
```

### 4️⃣ Verificar progreso
```powershell
npm run lint
```

### 5️⃣ Formatear código
```powershell
npm run format
```

---

## 📊 Ver Resumen de Errores

```powershell
# Ver solo el número total
npm run lint 2>&1 | Select-String "problems"

# Ver errores más comunes
npm run lint 2>&1 | Select-String "error" | Group-Object | Sort-Object Count -Descending | Select-Object -First 5
```

---

## ⚠️ Si algo falla

1. **Prettier no puede formatear**: Hay un error de sintaxis → Arréglalo manualmente
2. **ESLint tiene muchos errores**: Es normal → Arréglalos gradualmente
3. **Comando no funciona**: Verifica que estés en la carpeta correcta del proyecto

---

**💡 Tip**: Empieza con `npm run lint:fix` - arreglará automáticamente ~30-40% de los problemas.

