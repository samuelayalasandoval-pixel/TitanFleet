# 🚀 Deploy de Cambios - Plan de Prueba y Webhook

**Necesitas hacer push de los cambios y deploy del frontend.**

---

## 📋 Paso 1: Hacer Commit y Push (5 min)

### 1.1 Verificar Cambios

```bash
git status
```

Deberías ver archivos modificados como:
- `assets/scripts/demo/demo-utils.js`
- `assets/scripts/plan-limits-manager.js`
- `pages/pago.html`
- `pages/pago-success.html`
- `pages/pago-prueba.html` (nuevo)
- `assets/scripts/stripe-config.js`
- `assets/scripts/license-ui.html`

### 1.2 Agregar Cambios

```bash
git add .
```

O si prefieres agregar archivos específicos:

```bash
git add assets/scripts/demo/demo-utils.js
git add assets/scripts/plan-limits-manager.js
git add pages/pago.html
git add pages/pago-success.html
git add pages/pago-prueba.html
git add assets/scripts/stripe-config.js
git add assets/scripts/license-ui.html
```

### 1.3 Hacer Commit

```bash
git commit -m "Agregar plan de prueba ($10 MXN) y configurar modo LIVE para Stripe"
```

### 1.4 Hacer Push

```bash
git push
```

---

## 📋 Paso 2: Deploy del Frontend (5 min)

### 2.1 Compilar

```bash
npm run build
```

Esto compilará los estilos SCSS a CSS.

### 2.2 Deploy a Firebase

```bash
firebase deploy --only hosting
```

O si prefieres el comando completo:

```bash
npm run deploy
```

### 2.3 Verificar

Después del deploy, Firebase te dará una URL. Abre esa URL y verifica que:
- La página `pago-prueba.html` esté accesible
- Los cambios estén aplicados

---

## ✅ Checklist

- [ ] Cambios agregados a Git (`git add .`)
- [ ] Commit hecho (`git commit -m "..."`)
- [ ] Push hecho (`git push`)
- [ ] Frontend compilado (`npm run build`)
- [ ] Frontend desplegado (`firebase deploy --only hosting`)
- [ ] Verificar que `pago-prueba.html` esté accesible

---

## 🎯 Después del Deploy

Una vez desplegado, podrás:

1. **Acceder al plan de prueba:**
   ```
   https://tu-dominio.firebaseapp.com/pages/pago-prueba.html
   ```

2. **Probar el webhook:**
   - Hacer un pago de $10 MXN
   - Verificar evento en Stripe Dashboard
   - Verificar evento en Railway Logs

---

## 📝 Resumen de Cambios

**Archivos modificados:**
- ✅ Plan de prueba agregado en varios archivos
- ✅ Página `pago-prueba.html` creada
- ✅ Modo LIVE configurado en `stripe-config.js`
- ✅ Precios actualizados para incluir plan de prueba

**Archivos nuevos:**
- ✅ `pages/pago-prueba.html` - Página para acceder al plan de prueba

---

**¿Listo para hacer el deploy?** Ejecuta los comandos de arriba. 🚀

