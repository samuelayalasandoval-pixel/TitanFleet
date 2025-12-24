# 🔍 Guía: Conectar SonarCloud con GitHub

## 📋 Requisitos Previos

- ✅ Tu proyecto ya está en GitHub
- ✅ Tienes una cuenta en GitHub
- ✅ Tienes acceso al repositorio

---

## 🚀 Paso 1: Crear Cuenta en SonarCloud

1. Ve a **https://sonarcloud.io**
2. Haz clic en **"Log in"** (arriba a la derecha)
3. Selecciona **"Log in with GitHub"**
4. Autoriza la conexión entre SonarCloud y GitHub

---

## 📝 Paso 2: Crear Organización en SonarCloud

1. Una vez dentro de SonarCloud, haz clic en **"+"** (arriba a la derecha)
2. Selecciona **"Create Organization"**
3. Elige el plan:
   - **Free Plan** (recomendado para empezar)
   - Permite análisis de proyectos públicos y privados (con límites)
4. Completa la información:
   - **Organization Key**: Se genera automáticamente (ej: `tu-usuario-github`)
   - **Display Name**: Nombre que quieras mostrar
5. Haz clic en **"Create Organization"**

---

## 🔗 Paso 3: Conectar con GitHub

1. En SonarCloud, ve a **"My Account"** → **"Organizations"**
2. Selecciona tu organización
3. Ve a la pestaña **"Projects"**
4. Haz clic en **"Analyze new project"**
5. Selecciona **"From GitHub"**
6. Autoriza SonarCloud para acceder a tus repositorios de GitHub
7. Selecciona tu repositorio del proyecto ERP

---

## ⚙️ Paso 4: Configurar el Proyecto

### 4.1 Actualizar `sonar-project.properties`

Abre el archivo `sonar-project.properties` que acabamos de crear y actualiza:

```properties
# Cambia esto con tu Organization Key de SonarCloud
sonar.organization=tu-organizacion-sonarcloud

# El Project Key se genera automáticamente, pero puedes personalizarlo
sonar.projectKey=titanfleet-erp
```

**¿Dónde encontrar tu Organization Key?**
- En SonarCloud, ve a **"My Account"** → **"Organizations"**
- El Organization Key aparece debajo del nombre de tu organización

### 4.2 Obtener el Token de SonarCloud

1. En SonarCloud, ve a **"My Account"** → **"Security"**
2. En la sección **"Generate Tokens"**, ingresa un nombre (ej: "GitHub Actions")
3. Haz clic en **"Generate"**
4. **⚠️ IMPORTANTE**: Copia el token inmediatamente (solo se muestra una vez)
5. Guarda el token de forma segura

---

## 🔧 Paso 5: Configurar GitHub Actions (Automático)

### 5.1 Crear el Workflow de GitHub Actions

Crea el archivo `.github/workflows/sonarcloud.yml`:

```yaml
name: SonarCloud Analysis

on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master
  workflow_dispatch:

jobs:
  sonarcloud:
    name: SonarCloud Analysis
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Shallow clones should be disabled for better analysis

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint || true

      - name: Run tests
        run: npm run test || true

      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### 5.2 Agregar Secret en GitHub

1. Ve a tu repositorio en GitHub
2. Ve a **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Haz clic en **"New repository secret"**
4. Nombre: `SONAR_TOKEN`
5. Valor: Pega el token que copiaste en el Paso 4.2
6. Haz clic en **"Add secret"**

---

## 🧪 Paso 6: Probar la Conexión

### Opción A: Ejecutar Manualmente (Primera vez)

1. En SonarCloud, ve a tu proyecto
2. Haz clic en **"Run analysis"** → **"Run analysis on your local machine"**
3. Copia el comando que te muestra (algo como):
   ```bash
   dotnet-sonarscanner begin /k:"titanfleet-erp" /d:sonar.login="TU_TOKEN" /d:sonar.host.url="https://sonarcloud.io"
   ```
4. **PERO** como es un proyecto JavaScript, mejor usa:

```bash
# Instalar SonarScanner (si no lo tienes)
npm install -g sonarqube-scanner

# O usar npx directamente
npx sonarqube-scanner \
  -Dsonar.projectKey=titanfleet-erp \
  -Dsonar.organization=tu-organizacion-sonarcloud \
  -Dsonar.sources=assets/scripts,pages,scripts \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=TU_TOKEN_AQUI
```

### Opción B: Usar GitHub Actions (Recomendado)

1. Haz un commit y push del archivo `.github/workflows/sonarcloud.yml`
2. Ve a la pestaña **"Actions"** en GitHub
3. El workflow se ejecutará automáticamente
4. Una vez completado, ve a SonarCloud para ver los resultados

---

## ✅ Paso 7: Verificar que Funciona

1. Ve a **https://sonarcloud.io**
2. Selecciona tu proyecto
3. Deberías ver:
   - ✅ Análisis completado
   - ✅ Métricas de calidad de código
   - ✅ Issues encontrados
   - ✅ Coverage (si tienes tests)

---

## 🔍 Solución de Problemas Comunes

### ❌ Error: "Organization not found"

**Solución:**
- Verifica que el `sonar.organization` en `sonar-project.properties` coincida exactamente con tu Organization Key
- El Organization Key es case-sensitive

### ❌ Error: "Authentication failed"

**Solución:**
- Verifica que el token `SONAR_TOKEN` esté correctamente configurado en GitHub Secrets
- Asegúrate de que el token no haya expirado (genera uno nuevo si es necesario)

### ❌ Error: "No files to analyze"

**Solución:**
- Verifica que `sonar.sources` en `sonar-project.properties` apunte a las carpetas correctas
- Asegúrate de que los archivos no estén en `sonar.exclusions`

### ❌ Error: "ESLint not found"

**Solución:**
- Asegúrate de que `npm ci` se ejecute antes del análisis
- Verifica que `.eslintrc.json` exista en la raíz del proyecto

---

## 📊 Configuración Avanzada (Opcional)

### Agregar Badge de Calidad

1. En SonarCloud, ve a tu proyecto
2. Ve a **"Project Settings"** → **"Badges"**
3. Copia el código Markdown del badge
4. Agrégalo a tu `README.md`:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=titanfleet-erp&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=titanfleet-erp)
```

### Configurar Quality Gates

1. En SonarCloud, ve a **"Quality Gates"**
2. Puedes usar el gate por defecto o crear uno personalizado
3. Configura los umbrales según tus necesidades

---

## 🎯 Próximos Pasos

1. ✅ **Revisar Issues**: Ve a SonarCloud y revisa los problemas encontrados
2. ✅ **Corregir Problemas**: Prioriza los issues críticos y de alta prioridad
3. ✅ **Configurar Notificaciones**: Recibe alertas cuando se detecten nuevos problemas
4. ✅ **Integrar en CI/CD**: El análisis se ejecutará automáticamente en cada push

---

## 📝 Resumen de Archivos Creados

- ✅ `sonar-project.properties` - Configuración de SonarCloud
- ✅ `.github/workflows/sonarcloud.yml` - Workflow de GitHub Actions (crear manualmente)

---

## 🆘 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los logs en GitHub Actions
2. Verifica la documentación oficial: https://docs.sonarcloud.io
3. Revisa la configuración de `sonar-project.properties`

---

**¡Listo! Tu proyecto ahora está conectado con SonarCloud.** 🎉

