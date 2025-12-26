# 🔄 Guía Rápida: Cambiar Visibilidad del Repositorio

## 🎯 Objetivo

Hacer el repositorio público temporalmente para analizar TODO el código en SonarCloud, y luego volver a hacerlo privado.

---

## ⏱️ Tiempo Estimado: 1-2 horas

---

## 📋 Pasos Rápidos

### 1️⃣ Hacer Público (5 min)

1. Ve a: **https://github.com/samuelayalasandoval-pixel/TitanFleet/settings**
2. Scroll hasta **"Danger Zone"** (abajo)
3. Haz clic en **"Change visibility"**
4. Selecciona **"Make public"**
5. Escribe: `samuelayalasandoval-pixel/TitanFleet`
6. Haz clic en **"I understand, change repository visibility"**

### 2️⃣ Actualizar SonarCloud (2 min)

```bash
# Copiar configuración para repositorio público
cp sonar-project.properties sonar-project.properties.privado.backup
cp sonar-project.properties.publico sonar-project.properties

# Hacer commit y push
git add sonar-project.properties
git commit -m "Actualizar SonarCloud para repositorio público (análisis completo)"
git push
```

### 3️⃣ Esperar Análisis (10-30 min)

1. Ve a **https://sonarcloud.io**
2. Ve a tu proyecto **TitanFleet**
3. Espera a que el análisis se complete
4. Verifica que no haya errores de límite de líneas

### 4️⃣ Volver a Privado (5 min)

1. Ve a: **https://github.com/samuelayalasandoval-pixel/TitanFleet/settings**
2. Scroll hasta **"Danger Zone"**
3. Haz clic en **"Change visibility"**
4. Selecciona **"Make private"**
5. Confirma el cambio

### 5️⃣ (Opcional) Restaurar Configuración Privada

```bash
# Restaurar configuración para repositorio privado
cp sonar-project.properties.privado.backup sonar-project.properties
git add sonar-project.properties
git commit -m "Restaurar configuración SonarCloud para repositorio privado"
git push
```

---

## ⚠️ Importante

- ⏰ **Hazlo en horario de baja actividad** (menos probabilidad de forks)
- 👀 **Monitorea si alguien hace fork** durante la exposición
- 🔒 **Vuelve a hacerlo privado inmediatamente** después del análisis
- ✅ **SonarCloud mantendrá el análisis** incluso después de hacerlo privado

---

## ✅ Checklist

- [ ] Hacer repositorio público
- [ ] Actualizar `sonar-project.properties`
- [ ] Hacer commit y push
- [ ] Esperar análisis completo en SonarCloud
- [ ] Verificar resultados
- [ ] Volver a hacer repositorio privado
- [ ] (Opcional) Restaurar configuración privada

---

**Tiempo total de exposición:** ~1-2 horas máximo

