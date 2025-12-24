/**
 * Script para forzar la inicialización del repositorio de logística
 * Ejecutar en la consola del navegador
 */

(async function() {
    console.log('🔄 === FORZANDO INICIALIZACIÓN DEL REPOSITORIO ===');
    
    // 1. Verificar Firebase básico
    console.log('📊 Verificando Firebase básico...');
    console.log('  - firebaseDb:', !!window.firebaseDb);
    console.log('  - fs:', !!window.fs);
    console.log('  - firebaseAuth:', !!window.firebaseAuth);
    console.log('  - currentUser:', window.firebaseAuth?.currentUser?.email);
    
    if (!window.firebaseDb || !window.fs) {
        console.error('❌ Firebase básico no está disponible');
        return;
    }
    
    // 2. Verificar usuario y tenantId
    const user = window.firebaseAuth?.currentUser;
    if (!user) {
        console.error('❌ Usuario no autenticado');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
    const tenantId = currentUser?.tenantId || localStorage.getItem('tenantId') || 'demo_tenant';
    
    console.log('📊 Información del usuario:');
    console.log('  - Email:', user.email);
    console.log('  - UID:', user.uid);
    console.log('  - TenantId (localStorage):', tenantId);
    
    // 3. Esperar a que los repositorios estén disponibles
    console.log('⏳ Esperando repositorios...');
    let intentos = 0;
    while (!window.firebaseRepos && intentos < 50) {
        await new Promise(resolve => setTimeout(resolve, 200));
        intentos++;
        if (intentos % 10 === 0) {
            console.log(`  - Intento ${intentos}/50...`);
        }
    }
    
    if (!window.firebaseRepos) {
        console.error('❌ Repositorios no disponibles después de esperar');
        console.log('💡 Intentando cargar firebase-repos.js manualmente...');
        
        // Cargar firebase-repo-base.js primero si no está disponible
        if (!window.FirebaseRepoBase) {
            console.log('📦 Cargando firebase-repo-base.js...');
            const scriptBase = document.createElement('script');
            scriptBase.src = '../assets/scripts/firebase-repo-base.js';
            await new Promise((resolve, reject) => {
                scriptBase.onload = () => setTimeout(resolve, 1000);
                scriptBase.onerror = reject;
                document.head.appendChild(scriptBase);
            });
        }
        
        // Cargar firebase-repos.js
        const script = document.createElement('script');
        script.src = '../assets/scripts/firebase-repos.js';
        await new Promise((resolve, reject) => {
            script.onload = () => setTimeout(resolve, 2000);
            script.onerror = reject;
            document.head.appendChild(script);
        });
        
        // Esperar un poco más
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 4. Verificar repositorio de logística
    const repo = window.firebaseRepos?.logistica;
    if (!repo) {
        console.error('❌ Repositorio de logística no disponible');
        console.log('📊 Repositorios disponibles:', Object.keys(window.firebaseRepos || {}));
        return;
    }
    
    console.log('✅ Repositorio encontrado');
    console.log('📊 Estado inicial del repositorio:');
    console.log('  - db:', !!repo.db);
    console.log('  - tenantId:', repo.tenantId);
    console.log('  - userId:', repo.userId);
    console.log('  - _initialized:', repo._initialized);
    
    // 5. Forzar inicialización manual
    console.log('🔄 Forzando inicialización manual...');
    
    // Asignar db directamente
    repo.db = window.firebaseDb;
    console.log('  ✅ db asignado:', !!repo.db);
    
    // Asignar funciones de Firebase
    if (window.fs) {
        repo.doc = window.fs.doc;
        repo.setDoc = window.fs.setDoc;
        repo.getDoc = window.fs.getDoc;
        repo.collection = window.fs.collection;
        repo.getDocs = window.fs.getDocs;
        repo.query = window.fs.query;
        repo.where = window.fs.where;
        repo.onSnapshot = window.fs.onSnapshot;
        console.log('  ✅ Funciones de Firebase asignadas');
    }
    
    // Asignar userId y tenantId
    repo.userId = user.uid;
    repo.tenantId = tenantId;
    console.log('  ✅ userId asignado:', repo.userId);
    console.log('  ✅ tenantId asignado:', repo.tenantId);
    
    // Resetear estado de inicialización
    repo._initialized = false;
    repo._initPromise = null;
    
    // 6. Intentar inicialización completa
    if (typeof repo.init === 'function') {
        console.log('🔄 Llamando a repo.init()...');
        try {
            await repo.init();
            console.log('✅ repo.init() completado');
        } catch (error) {
            console.error('❌ Error en repo.init():', error);
            console.error('Stack:', error.stack);
        }
    }
    
    // 7. Verificar estado final
    console.log('📊 Estado final del repositorio:');
    console.log('  - db:', !!repo.db);
    console.log('  - tenantId:', repo.tenantId);
    console.log('  - userId:', repo.userId);
    console.log('  - _initialized:', repo._initialized);
    
    // 8. Intentar cargar registros
    if (repo.db && repo.tenantId) {
        console.log('📋 Intentando cargar registros...');
        try {
            const registros = await repo.getAllRegistros();
            console.log(`✅ ${registros.length} registros encontrados`);
            
            if (registros.length > 0) {
                console.log('📋 Registros:');
                registros.forEach(reg => {
                    console.log(`  - ${reg.numeroRegistro || reg.id}: tenantId=${reg.tenantId || 'N/A'}`);
                });
                
                // Llamar a la función de carga
                if (typeof window.cargarRegistrosLogistica === 'function') {
                    console.log('🔄 Llamando a cargarRegistrosLogistica...');
                    await window.cargarRegistrosLogistica();
                    console.log('✅ Registros cargados en la tabla');
                } else {
                    console.warn('⚠️ Función cargarRegistrosLogistica no disponible');
                }
            } else {
                console.log('⚠️ No hay registros en Firebase');
            }
        } catch (error) {
            console.error('❌ Error cargando registros:', error);
            console.error('Stack:', error.stack);
        }
    } else {
        console.error('❌ Repositorio no está completamente inicializado');
        console.log('  - db:', !!repo.db);
        console.log('  - tenantId:', repo.tenantId);
    }
    
    console.log('✅ === PROCESO COMPLETADO ===');
})();

