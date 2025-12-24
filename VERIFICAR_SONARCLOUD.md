# 🔍 Verificación de Configuración SonarCloud

## ❌ Problemas Comunes y Soluciones

### 1. **Error: "Organization not found" o "Invalid organization"**

**Causa:** El `organization` en `sonar-project.properties` no es correcto.

**Solución:**
1. Ve a **https://sonarcloud.io**
2. Inicia sesión con GitHub
3. Ve a **"My Account"** → **"Organizations"**
4. Verás tu organización con un **Organization Key** (ejemplo: `samuelayalasandoval-pixel`)
5. **NO es un hash largo**, es un nombre corto similar a tu usuario de GitHub

**Actualizar `sonar-project.properties`:**
```properties
sonar.organization=TU_ORGANIZATION_KEY_AQUI
```

**Ejemplo correcto:**
```properties
sonar.organization=samuelayalasandoval-pixel
```

---

### 2. **Error: "Authentication failed" o "Invalid token"**

**Causa:** El `SONAR_TOKEN` no está configurado en GitHub Secrets o es incorrecto.

**Solución:**

#### Paso 1: Generar Token en SonarCloud
1. Ve a **https://sonarcloud.io**
2. Inicia sesión
3. Ve a **"My Account"** → **"Security"**
4. En **"Generate Tokens"**, ingresa un nombre: `GitHub Actions`
5. Haz clic en **"Generate"**
6. **⚠️ COPIA EL TOKEN INMEDIATAMENTE** (solo se muestra una vez)

#### Paso 2: Agregar Token en GitHub
1. Ve a tu repositorio: **https://github.com/samuelayalasandoval-pixel/TitanFleet**
2. Ve a **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Haz clic en **"New repository secret"**
4. **Name:** `SONAR_TOKEN`
5. **Secret:** (pega el token que copiaste)
6. Haz clic en **"Add secret"**

---

### 3. **Error: "Project not found"**

**Causa:** El proyecto no existe en SonarCloud o el `projectKey` no coincide.

**Solución:**

#### Crear Proyecto en SonarCloud:
1. Ve a **https://sonarcloud.io**
2. Ve a **"My Account"** → **"Organizations"**
3. Selecciona tu organización
4. Ve a la pestaña **"Projects"**
5. Haz clic en **"Analyze new project"**
6. Selecciona **"From GitHub"**
7. Autoriza SonarCloud para acceder a tus repositorios
8. Selecciona el repositorio **"TitanFleet"**
9. SonarCloud creará el proyecto automáticamente

**El Project Key será:** `samuelayalasandoval-pixel_TitanFleet` o similar

**Actualizar `sonar-project.properties`:**
```properties
sonar.projectKey=samuelayalasandoval-pixel_TitanFleet
```

---

### 4. **Error: "No files to analyze"**

**Causa:** Las rutas en `sonar.sources` no son correctas o los archivos están excluidos.

**Solución:**
Verifica que `sonar-project.properties` tenga:
```properties
sonar.sources=assets/scripts,pages,scripts
```

Y que los archivos no estén en `sonar.exclusions`.

---

## ✅ Checklist de Verificación

Antes de ejecutar el workflow, verifica:

- [ ] **Organization Key correcto** en `sonar-project.properties`
  - Debe ser un nombre corto (ej: `samuelayalasandoval-pixel`)
  - NO debe ser un hash largo
  
- [ ] **Project Key correcto** en `sonar-project.properties`
  - Debe coincidir con el Project Key en SonarCloud
  
- [ ] **SONAR_TOKEN configurado** en GitHub Secrets
  - Ve a: Settings → Secrets and variables → Actions
  - Debe existir `SONAR_TOKEN`
  
- [ ] **Proyecto creado en SonarCloud**
  - Ve a SonarCloud → Organizations → Projects
  - Debe existir el proyecto "TitanFleet"
  
- [ ] **SonarCloud autorizado en GitHub**
  - Ve a GitHub → Settings → Applications
  - SonarCloud debe estar autorizado

---

## 🔧 Cómo Verificar el Organization Key Correcto

1. Ve a **https://sonarcloud.io**
2. Inicia sesión
3. Haz clic en tu nombre (arriba a la derecha) → **"My Account"**
4. Ve a la pestaña **"Organizations"**
5. Verás tu organización con:
   - **Display Name**: (el nombre que le diste)
   - **Key**: (este es el Organization Key que necesitas)

**Ejemplo:**
```
Display Name: Samuel Ayala
Key: samuelayalasandoval-pixel  ← ESTE es el que necesitas
```

---

## 🧪 Probar la Configuración

### Opción 1: Verificar en GitHub Actions
1. Ve a la pestaña **"Actions"** en GitHub
2. Selecciona el workflow **"SonarCloud Analysis"**
3. Revisa los logs del último run
4. Busca errores específicos

### Opción 2: Probar Localmente (Opcional)
```bash
# Instalar SonarScanner
npm install -g sonarqube-scanner

# Ejecutar análisis (reemplaza TU_TOKEN con tu token real)
npx sonarqube-scanner \
  -Dsonar.projectKey=samuelayalasandoval-pixel \
  -Dsonar.organization=TU_ORGANIZATION_KEY \
  -Dsonar.sources=assets/scripts,pages,scripts \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=TU_TOKEN
```

---

## 📝 Resumen de Valores Correctos

Después de verificar en SonarCloud, tu `sonar-project.properties` debería verse así:

```properties
# Project identification
sonar.projectKey=samuelayalasandoval-pixel_TitanFleet
sonar.organization=samuelayalasandoval-pixel  # ← Nombre corto, NO hash
sonar.projectName=TitanFleet ERP
```

**⚠️ IMPORTANTE:** 
- El `organization` debe ser un **nombre corto** (similar a tu usuario de GitHub)
- El `projectKey` debe coincidir con el que aparece en SonarCloud
- El `SONAR_TOKEN` debe estar en GitHub Secrets

---

## 🆘 Si Sigue Sin Funcionar

1. **Revisa los logs de GitHub Actions** para ver el error específico
2. **Verifica que el proyecto exista en SonarCloud**
3. **Asegúrate de que SonarCloud esté autorizado en GitHub**
4. **Genera un nuevo token** si el anterior expiró

---

**¿Necesitas ayuda?** Comparte el error específico que ves en los logs de GitHub Actions.

