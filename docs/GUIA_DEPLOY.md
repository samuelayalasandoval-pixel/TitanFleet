# 🚀 Guía de Deploy - Sistema ERP TitanFleet

Esta guía te ayudará a desplegar tu aplicación ERP en Firebase Hosting.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener:

1. **Node.js** instalado (versión 16 o superior)
   ```bash
   node --version  # Debe ser >= 16.0.0
   ```

2. **npm** instalado (versión 8 o superior)
   ```bash
   npm --version  # Debe ser >= 8.0.0
   ```

3. **Firebase CLI** instalado globalmente
   ```bash
   npm install -g firebase-tools
   ```

4. **Cuenta de Firebase** configurada y proyecto creado

5. **Autenticación en Firebase CLI**
   ```bash
   firebase login
   ```

## 🔧 Configuración Inicial

### 1. Verificar configuración de Firebase

Asegúrate de que el archivo `.firebaserc` tenga tu proyecto configurado:
```json
{
  "projects": {
    "default": "titanfleet-60931"
  }
}
```

### 2. Instalar dependencias

```bash
npm install
```

## 🏗️ Proceso de Deploy

### Opción 1: Deploy Completo (Recomendado)

Este comando compila los estilos SCSS y despliega tanto el hosting como las reglas de Firestore:

```bash
npm run deploy:all
```

### Opción 2: Deploy Solo Hosting

Si solo quieres actualizar el hosting (sin cambiar reglas de Firestore):

```bash
npm run deploy:hosting
```

O simplemente:

```bash
npm run deploy
```

### Opción 3: Deploy Rápido (Forzar)

Si necesitas forzar el deploy sin confirmaciones:

```bash
npm run deploy:quick
```

### Opción 4: Deploy Solo Reglas de Firestore

Si solo necesitas actualizar las reglas de seguridad:

```bash
npm run deploy:firestore
```

## 📝 Pasos Detallados

### Paso 1: Compilar Estilos

Los estilos SCSS se compilan automáticamente con el comando de deploy, pero puedes compilarlos manualmente:

```bash
npm run build
```

Esto generará `styles/main.css` desde `assets/styles/main.scss`.

### Paso 2: Verificar Archivos

Asegúrate de que los archivos importantes estén presentes:
- ✅ `index.html`
- ✅ `firebase.json`
- ✅ `.firebaserc`
- ✅ `firestore.rules`
- ✅ `styles/main.css` (generado después del build)

### Paso 3: Probar Localmente (Opcional)

Antes de hacer deploy, puedes probar localmente:

```bash
npm run serve
```

Esto iniciará un servidor local en `http://localhost:3000`

### Paso 4: Hacer Deploy

Ejecuta el comando de deploy:

```bash
npm run deploy:all
```

El proceso:
1. Compilará los estilos SCSS
2. Subirá los archivos a Firebase Hosting
3. Desplegará las reglas de Firestore
4. Te mostrará la URL de tu aplicación

### Paso 5: Verificar Deploy

Después del deploy, verás algo como:

```
✔  Deploy complete!

Hosting URL: https://titanfleet-60931.web.app
```

Abre la URL en tu navegador para verificar que todo funciona correctamente.

## 🔍 Solución de Problemas

### Error: "Firebase CLI not found"

```bash
npm install -g firebase-tools
firebase login
```

### Error: "Project not found"

Verifica que el proyecto en `.firebaserc` coincida con tu proyecto de Firebase:

```bash
firebase projects:list
```

Si necesitas cambiar el proyecto:

```bash
firebase use --add
```

### Error: "Sass compilation failed"

Asegúrate de tener las dependencias instaladas:

```bash
npm install
```

### Error: "Permission denied"

Verifica que tengas permisos en el proyecto de Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a Configuración del proyecto > Usuarios y permisos
4. Verifica que tu cuenta tenga el rol "Editor" o "Propietario"

### Error: "Build failed"

Revisa los errores de compilación:

```bash
npm run build
```

Esto te mostrará los errores específicos de SCSS.

## 📦 Estructura de Deploy

Los siguientes archivos/directorios se suben a Firebase Hosting:

- ✅ Todos los archivos `.html`
- ✅ Carpeta `assets/` (scripts, imágenes, etc.)
- ✅ Carpeta `styles/` (CSS compilado)
- ✅ Archivos de configuración necesarios

Los siguientes se **excluyen** del deploy:

- ❌ `node_modules/`
- ❌ Archivos de prueba (`test*.html`, `debug.html`)
- ❌ Archivos de migración (`migrate-*.html`, `fix_*.html`)
- ❌ Documentación (`docs/`, `*.md`)
- ❌ Archivos SCSS fuente (solo se sube el CSS compilado)
- ❌ Archivos de configuración local (`.git`, `.firebaserc`, etc.)

## 🔐 Seguridad

### Reglas de Firestore

Las reglas actuales permiten acceso completo (`allow read, write: if true`). 

⚠️ **IMPORTANTE**: Para producción, deberías actualizar `firestore.rules` para requerir autenticación:

```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

### Variables de Entorno

Si necesitas usar variables de entorno, considera usar Firebase Functions o configurarlas en la consola de Firebase.

## 🚀 Deploy Automático (CI/CD)

### GitHub Actions (Opcional)

Puedes configurar GitHub Actions para deploy automático:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run deploy:all
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Para obtener el token:

```bash
firebase login:ci
```

## 📊 Monitoreo

Después del deploy, puedes monitorear:

1. **Firebase Console**: https://console.firebase.google.com/
   - Hosting: Ver estadísticas de tráfico
   - Firestore: Ver uso de base de datos
   - Analytics: Ver métricas de usuarios

2. **URLs de tu aplicación**:
   - Producción: `https://titanfleet-60931.web.app`
   - Personalizada: (si configuraste un dominio)

## ✅ Checklist Pre-Deploy

Antes de cada deploy, verifica:

- [ ] Código probado localmente
- [ ] Estilos compilados correctamente (`npm run build`)
- [ ] No hay errores en la consola del navegador
- [ ] Variables de Firebase configuradas correctamente
- [ ] Reglas de Firestore revisadas
- [ ] Archivos sensibles no incluidos en el deploy
- [ ] Backup de datos importantes (si aplica)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de Firebase:
   ```bash
   firebase deploy --debug
   ```

2. Verifica la configuración:
   ```bash
   firebase projects:list
   firebase use
   ```

3. Consulta la documentación oficial:
   - [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
   - [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**¡Listo para desplegar!** 🎉

Ejecuta `npm run deploy:all` cuando estés listo.

