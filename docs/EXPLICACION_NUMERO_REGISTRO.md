# 📋 Explicación: Cómo se Determina el Número de Registro

## 🎯 Formato del Número de Registro

El número de registro sigue el formato: **`YYXXXXX`**

Donde:
- **`YY`** = Últimos 2 dígitos del año (ej: `25` para 2025, `26` para 2026)
- **`XXXXX`** = Número secuencial de 5 dígitos (00001, 00002, 00003...)

### Ejemplos:
- **2025:** `2500001`, `2500002`, `2500003`...
- **2026:** `2600001`, `2600002`, `2600003`...

---

## 🔢 ¿Por qué NO se usa `2500000`?

**El sistema NO usa `2500000` como primer número.** El primer número siempre es `2500001` porque:

1. El sistema busca el **número máximo** de registros existentes del año actual
2. Si no hay registros, el máximo es `0`
3. El siguiente número se calcula como: **máximo + 1**
4. Si máximo = 0, entonces: **0 + 1 = 1** → Resultado: `2500001`

**Razón:** El sistema usa números secuenciales que empiezan desde `1`, no desde `0`.

---

## 🔄 Proceso de Generación del Número

### Paso 1: Obtener Año Actual
```javascript
const currentYear = new Date().getFullYear(); // 2025
const yearPrefix = currentYear.toString().slice(-2); // "25"
```

### Paso 2: Buscar Registros del Año Actual
El sistema busca en Firebase todos los registros de logística que:
- Empiecen con el prefijo del año (ej: `25`)
- Tengan formato de 7 dígitos (`25XXXXX`)

**Query de ejemplo:**
```javascript
// Buscar registros entre 2500000 y 2599999
where('numeroRegistro', '>=', '2500000')
where('numeroRegistro', '<=', '2599999')
```

### Paso 3: Encontrar el Número Máximo
El sistema recorre todos los registros encontrados y extrae la parte numérica:

```javascript
// Ejemplo: registro "2500042"
const numberPart = numReg.slice(2); // "00042"
const num = parseInt(numberPart);    // 42
if (num > maxNumber) {
    maxNumber = num; // Guarda el máximo encontrado
}
```

### Paso 4: Calcular Siguiente Número
```javascript
const nextNumber = maxNumber + 1;
// Si maxNumber = 0 (no hay registros) → nextNumber = 1
// Si maxNumber = 42 → nextNumber = 43
```

### Paso 5: Formatear el Número Final
```javascript
const uniqueNumber = `${yearPrefix}${String(nextNumber).padStart(5, '0')}`;
// Ejemplo: "25" + "00001" = "2500001"
// Ejemplo: "25" + "00043" = "2500043"
```

---

## 📊 Ejemplos Prácticos

### Escenario 1: Primer Registro del Año
- **Registros existentes:** Ninguno
- **Número máximo encontrado:** `0`
- **Siguiente número:** `0 + 1 = 1`
- **Número generado:** `2500001` ✅

### Escenario 2: Ya Hay Registros
- **Registros existentes:** `2500001`, `2500002`, `2500005`
- **Número máximo encontrado:** `5`
- **Siguiente número:** `5 + 1 = 6`
- **Número generado:** `2500006` ✅

### Escenario 3: Cambio de Año
- **Año anterior:** 2024 (registros: `2400001`, `2400002`...)
- **Año nuevo:** 2025
- **Número máximo del 2025:** `0` (no hay registros del 2025 aún)
- **Siguiente número:** `0 + 1 = 1`
- **Número generado:** `2500001` ✅ (reinicio automático)

---

## 🔍 Dónde se Encuentra el Código

### Función Principal
**Archivo:** `assets/scripts/main.js`  
**Función:** `getAndIncrementRegistrationCounter()` (línea ~1383)

```javascript
async function getAndIncrementRegistrationCounter() {
    // 1. Obtener año actual
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);
    
    // 2. Buscar registros del año actual
    const q = window.fs.query(
        collectionRef,
        window.fs.where('numeroRegistro', '>=', `${yearPrefix}00000`),
        window.fs.where('numeroRegistro', '<=', `${yearPrefix}99999`)
    );
    
    // 3. Encontrar número máximo
    let maxNumber = 0;
    snapshot.docs.forEach(doc => {
        const numReg = data.numeroRegistro;
        if (numReg && numReg.startsWith(yearPrefix)) {
            const num = parseInt(numReg.slice(2)) || 0;
            if (num > maxNumber) maxNumber = num;
        }
    });
    
    // 4. Siguiente número = máximo + 1
    const nextNumber = maxNumber + 1;
    return nextNumber;
}
```

### Función que Genera el Número Completo
**Archivo:** `assets/scripts/main.js`  
**Función:** `generateUniqueNumber()` (línea ~1755)

```javascript
window.generateUniqueNumber = async function() {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);
    
    // Obtener siguiente número
    const nextNumber = await getAndIncrementRegistrationCounter();
    
    // Formatear: "25" + "00001" = "2500001"
    const uniqueNumber = `${yearPrefix}${String(nextNumber).padStart(5, '0')}`;
    return uniqueNumber;
}
```

---

## ⚙️ Características del Sistema

### ✅ Reinicio Anual Automático
- Cada año, el contador se reinicia automáticamente
- 2025: `2500001`, `2500002`...
- 2026: `2600001`, `2600002`...
- No hay conflicto entre años

### ✅ Búsqueda Optimizada
- Usa queries de Firebase con rangos (`>=` y `<=`)
- Solo busca registros del año actual
- No necesita recorrer todos los registros históricos

### ✅ Prevención de Duplicados
- El sistema siempre busca el máximo existente
- Garantiza que no se generen números duplicados
- Funciona incluso si hay "huecos" en la secuencia

### ✅ Sincronización Multi-Usuario
- Usa Firebase como fuente de verdad
- Múltiples usuarios pueden generar números sin conflictos
- El último número se guarda en Firebase

---

## 🛠️ Si Necesitas Cambiar el Número Inicial

### Opción 1: Reiniciar el Contador (Recomendado)
Si quieres que el sistema empiece desde `2500001` nuevamente:

1. Ve a **Configuración** → **Limpiar Datos Operativos**
2. Esto eliminará todos los registros y reiniciará el contador a `2500001`

### Opción 2: Modificar el Código (No Recomendado)
Si realmente necesitas que empiece desde `2500000`:

**Archivo:** `assets/scripts/main.js`  
**Línea ~1451:**

```javascript
// ANTES:
const nextNumber = maxNumber + 1;

// DESPUÉS (para empezar desde 0):
const nextNumber = maxNumber === 0 ? 0 : maxNumber + 1;
```

**⚠️ ADVERTENCIA:** Esto puede causar problemas porque:
- El formato esperado es `25XXXXX` donde XXXX debe ser >= 00001
- Algunas validaciones pueden rechazar `2500000`
- No es la práctica estándar (los números suelen empezar desde 1)

---

## 📝 Resumen

| Aspecto | Detalle |
|---------|---------|
| **Formato** | `YYXXXXX` (7 dígitos) |
| **Primer número** | `2500001` (NO `2500000`) |
| **Incremento** | Secuencial (+1) |
| **Reinicio** | Automático cada año |
| **Fuente de verdad** | Firebase (colección `logistica`) |
| **Búsqueda** | Solo registros del año actual |

---

**Última actualización:** 13 de diciembre de 2025

















