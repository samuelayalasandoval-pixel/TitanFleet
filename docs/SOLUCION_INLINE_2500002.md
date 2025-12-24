# 🔧 Solución Inline: Limpiar Registro 2500002

## 📋 Código para Ejecutar en la Consola (F12)

Copia y pega este código completo en la consola del navegador:

```javascript
// Script inline para diagnosticar y limpiar registro 2500002
(async function() {
    console.log('🔍 Iniciando diagnóstico y limpieza del registro 2500002...\n');

    const ubicaciones = [];
    const errores = [];

    try {
        // 1. Verificar y limpiar de logística
        if (window.firebaseRepos && window.firebaseRepos.logistica) {
            try {
                const repo = window.firebaseRepos.logistica;
                await repo.init();
                
                // Verificar si existe
                const registro = await repo.getRegistro('2500002');
                if (registro) {
                    await repo.delete('2500002');
                    ubicaciones.push('logistica (Firebase)');
                    console.log('✅ Eliminado de logística (Firebase)');
                }
            } catch (e) {
                if (e.code !== 'not-found' && !e.message?.includes('not found')) {
                    errores.push(`logistica: ${e.message}`);
                }
            }
        }

        // 2. Limpiar de otras colecciones
        const colecciones = ['trafico', 'facturacion', 'cxc', 'cxp', 'tesoreria', 'diesel', 'mantenimiento', 'inventario'];
        for (const coleccion of colecciones) {
            if (window.firebaseRepos && window.firebaseRepos[coleccion]) {
                try {
                    const repo = window.firebaseRepos[coleccion];
                    await repo.init();
                    await repo.delete('2500002');
                    ubicaciones.push(`${coleccion} (Firebase)`);
                    console.log(`✅ Eliminado de ${coleccion} (Firebase)`);
                } catch (e) {
                    if (e.code !== 'not-found' && !e.message?.includes('not found')) {
                        errores.push(`${coleccion}: ${e.message}`);
                    }
                }
            }
        }

        // 3. Limpiar de localStorage
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (sharedData.registros && sharedData.registros['2500002']) {
            delete sharedData.registros['2500002'];
            localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
            ubicaciones.push('localStorage');
            console.log('✅ Eliminado de localStorage');
        }

        // 4. Limpiar número activo si es 2500002
        const activeNumber = localStorage.getItem('activeRegistrationNumber');
        if (activeNumber === '2500002') {
            localStorage.removeItem('activeRegistrationNumber');
            console.log('✅ Número activo limpiado');
        }

        // 5. Verificar estado final
        console.log('\n📊 Resumen:');
        console.log(`   - Ubicaciones limpiadas: ${ubicaciones.length > 0 ? ubicaciones.join(', ') : 'Ninguna (no existía)'}`);
        if (errores.length > 0) {
            console.log(`   - Errores: ${errores.join(', ')}`);
        }

        // 6. Verificar qué número generará ahora
        if (window.firebaseRepos && window.firebaseRepos.logistica) {
            const repo = window.firebaseRepos.logistica;
            await repo.init();
            const allRegistros = await repo.getAll();
            const currentYear = new Date().getFullYear();
            const yearPrefix = currentYear.toString().slice(-2);
            
            const registrosDelAño = allRegistros.filter(r => {
                const numReg = r.numeroRegistro || r.id || r.registroId;
                return numReg && 
                       typeof numReg === 'string' && 
                       numReg.startsWith(yearPrefix) && 
                       numReg.length === 7;
            });
            
            const numeros = registrosDelAño.map(r => {
                const numReg = r.numeroRegistro || r.id || r.registroId;
                return parseInt(numReg.slice(2)) || 0;
            });
            
            const maxNumber = numeros.length > 0 ? Math.max(...numeros) : 0;
            const siguienteNumero = maxNumber + 1;
            
            console.log(`\n🔢 Estado del sistema:`);
            console.log(`   - Registros del año ${currentYear}: ${registrosDelAño.length}`);
            console.log(`   - Número máximo: ${maxNumber}`);
            console.log(`   - Siguiente número será: ${yearPrefix}${String(siguienteNumero).padStart(5, '0')}`);
            
            if (siguienteNumero === 1) {
                console.log('   ✅ CORRECTO: El siguiente número será 2500001');
            } else {
                console.log(`   ⚠️ El siguiente número será ${yearPrefix}${String(siguienteNumero).padStart(5, '0')} (puede haber más registros)`);
            }
        }

        console.log('\n✅ Limpieza completada. Recarga la página (F5) y genera un nuevo número.');
        console.log('   El sistema ahora debería generar 2500001');

    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
```

## 🚀 Pasos a Seguir

1. **Abre la consola del navegador** (F12)
2. **Copia y pega** el código completo de arriba
3. **Presiona Enter** para ejecutarlo
4. **Espera** a que termine (verás los mensajes en la consola)
5. **Recarga la página** (F5)
6. **Ve a Logística** y verifica que genere `2500001`

## ✅ Resultado Esperado

Después de ejecutar el script, deberías ver:

```
✅ Eliminado de [ubicaciones donde existía]
📊 Resumen: ...
🔢 Estado del sistema:
   - Registros del año 2025: 0
   - Número máximo: 0
   - Siguiente número será: 2500001
   ✅ CORRECTO: El siguiente número será 2500001
✅ Limpieza completada. Recarga la página (F5) y genera un nuevo número.
```

---

**Última actualización:** 13 de diciembre de 2025

















