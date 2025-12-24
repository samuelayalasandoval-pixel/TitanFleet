# Líneas Exactas a Eliminar de configuracion.html

## 📋 Lista Completa de Líneas a Eliminar

### **BLOQUE 1: Estilos CSS**
**Eliminar líneas:** 22-121

**Inicio (línea 22):**
```
    /* Estilos personalizados para las pestañas de configuración */
```

**Fin (línea 121):**
```
  -->
```

**Nota:** Este bloque contiene todo el CSS que fue movido a `styles/configuracion.css`. El bloque comienza directamente con el comentario CSS (falta la etiqueta `<style>` de apertura, pero el cierre `</style>` está en la línea 120).

---

### **BLOQUE 2: Script de Sidebar**
**Eliminar líneas:** 123-175

**Inicio (línea 123):**
```
  <!-- NOTA: El script de sidebar ha sido movido a assets/scripts/configuracion-sidebar.js -->
```

**Fin (línea 175):**
```
  -->
```

**Incluye:**
- Comentario de NOTA (línea 123)
- Comentario "BLOQUE A ELIMINAR" (línea 124)
- Apertura de comentario HTML `<!--` (línea 125)
- Todo el script completo (líneas 126-174)
- Cierre de comentario HTML `-->` (línea 175)

---

### **BLOQUE 3: Script de Carga de Módulos**
**Eliminar líneas:** 1852-1949

**Inicio (línea 1852):**
```
  <!-- ===== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) ===== -->
```

**Fin (línea 1949):**
```
  -->
```

**Incluye:**
- Comentario del sistema (línea 1852)
- Comentario de NOTA (línea 1853)
- Apertura de comentario HTML `<!--` (línea 1854)
- Todo el script con MODULES_CONFIG (líneas 1855-1948)
- Cierre de comentario HTML `-->` (línea 1949)

---

### **BLOQUE 4: Script de Verificación**
**Eliminar líneas:** 1951-1968

**Inicio (línea 1951):**
```
  <!-- NOTA: El script de verificación ha sido movido a assets/scripts/configuracion-verificacion.js -->
```

**Fin (línea 1968):**
```
  -->
```

**Incluye:**
- Comentario de NOTA (línea 1951)
- Comentario "BLOQUE A ELIMINAR" (línea 1952)
- Apertura de comentario HTML `<!--` (línea 1953)
- Todo el script de verificación (líneas 1954-1967)
- Cierre de comentario HTML `-->` (línea 1968)

**Nota:** Hay una línea en blanco (1969) que puedes dejar o eliminar según prefieras.

---

### **BLOQUE 5: Script de Verificación de Tractocamiones**
**Eliminar líneas:** 2629-2700

**Inicio (línea 2629):**
```
  <!-- NOTA: El script de verificación de tractocamiones ha sido movido a assets/scripts/configuracion-tractocamiones.js -->
```

**Fin (línea 2700):**
```
  -->
```

**Incluye:**
- Comentario de NOTA (línea 2629)
- Comentario "BLOQUE A ELIMINAR" (línea 2630)
- Apertura de comentario HTML `<!--` (línea 2631)
- Todo el script de verificación de tractocamiones (líneas 2632-2699)
- Cierre de comentario HTML `-->` (línea 2700)

---

### **BLOQUE 6: Script de Limpieza de Datos**
**Eliminar líneas:** 2702-3127

**Inicio (línea 2702):**
```
  <!-- NOTA: El script de limpieza ha sido movido a assets/scripts/configuracion-limpieza.js -->
```

**Fin (línea 3127):**
```
  -->
```

**Incluye:**
- Comentario de NOTA (línea 2702)
- Comentario "BLOQUE A ELIMINAR" (línea 2703)
- Apertura de comentario HTML `<!--` (línea 2704)
- Comentario interno (línea 2705)
- Todo el script de limpieza completo (líneas 2706-3126)
- Cierre de comentario HTML `-->` (línea 3127)

**Nota:** Este es el bloque más grande (425 líneas). Asegúrate de eliminar desde la línea 2702 hasta la 3127 inclusive.

---

### **BLOQUE 7: Script de Bancos**
**Eliminar líneas:** 3128-3141

**Inicio (línea 3128):**
```
  <script>
```

**Fin (línea 3141):**
```
  -->
```

**Incluye:**
- Todo el script de bancos (líneas 3128-3140)
- Cierre de comentario HTML `-->` (línea 3141)

**Nota:** Este bloque parece estar dentro de un comentario HTML que comenzó antes (probablemente en la línea 3127 o antes). El script completo desde `<script>` hasta `</script>` y el cierre `-->` deben eliminarse.

---

## 📊 Resumen por Rangos

| Bloque | Líneas a Eliminar | Descripción |
|--------|-------------------|-------------|
| 1 | 22-121 | Estilos CSS |
| 2 | 123-175 | Script de Sidebar |
| 3 | 1852-1949 | Script de Módulos |
| 4 | 1951-1968 | Script de Verificación |
| 5 | 2629-2700 | Script de Tractocamiones |
| 6 | 2702-3127 | Script de Limpieza |
| 7 | 3128-3141 | Script de Bancos |

**Total de líneas a eliminar:** Aproximadamente 1,000+ líneas

---

## ⚠️ Importante

1. **Eliminar en orden inverso** (de abajo hacia arriba) para que los números de línea no cambien mientras eliminas.

2. **Verificar antes de eliminar:** Asegúrate de que los archivos externos estén creados y los enlaces estén en el HTML.

3. **Backup:** Haz una copia de seguridad antes de eliminar.

4. **Verificación final:** Después de eliminar, verifica que:
   - El HTML sigue siendo válido
   - Los enlaces a archivos externos están presentes
   - La página carga correctamente

---

## 🔍 Cómo Identificar los Bloques

Busca estos marcadores en el archivo:

1. **Bloque 1:** Busca `/* Estilos personalizados para las pestañas de configuración */`
2. **Bloque 2:** Busca `<!-- NOTA: El script de sidebar`
3. **Bloque 3:** Busca `<!-- ===== SISTEMA DE CARGA BAJO DEMANDA`
4. **Bloque 4:** Busca `<!-- NOTA: El script de verificación`
5. **Bloque 5:** Busca `<!-- NOTA: El script de verificación de tractocamiones`
6. **Bloque 6:** Busca `<!-- NOTA: El script de limpieza`
7. **Bloque 7:** Busca `// Cargar datos cuando se muestre la pestaña de Bancos`
