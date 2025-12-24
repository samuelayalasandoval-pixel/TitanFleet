/**
 * Script para crear los repositorios manualmente si no se están creando automáticamente
 * Ejecutar en la consola del navegador
 */

(async function() {
    console.log('🔄 === CREANDO REPOSITORIOS MANUALMENTE ===');
    
    // 1. Verificar FirebaseRepoBase
    if (!window.FirebaseRepoBase) {
        console.error('❌ FirebaseRepoBase no está disponible');
        console.log('💡 Cargando firebase-repo-base.js...');
        
        const script = document.createElement('script');
        script.src = '../assets/scripts/firebase-repo-base.js';
        await new Promise((resolve, reject) => {
            script.onload = () => setTimeout(resolve, 2000);
            script.onerror = reject;
            document.head.appendChild(script);
        });
        
        if (!window.FirebaseRepoBase) {
            console.error('❌ FirebaseRepoBase no se cargó correctamente');
            return;
        }
    }
    
    console.log('✅ FirebaseRepoBase disponible');
    
    // 2. Verificar Firebase básico
    if (!window.firebaseDb || !window.fs) {
        console.error('❌ Firebase básico no está disponible');
        return;
    }
    
    console.log('✅ Firebase básico disponible');
    
    // 3. Crear repositorios manualmente
    console.log('🔄 Creando repositorios...');
    
    const FirebaseRepoBase = window.FirebaseRepoBase;
    
    // Repositorio para Logística
    class LogisticaRepo extends FirebaseRepoBase {
        constructor() {
            super('logistica');
        }

        async saveRegistro(registroId, data) {
            return await this.save(registroId, {
                ...data,
                tipo: 'registro',
                fechaCreacion: data.fechaCreacion || new Date().toISOString()
            });
        }

        async getRegistro(registroId) {
            try {
                if (!this.db || !this.tenantId) {
                    await this.init();
                }
                if (this.doc && this.getDoc && this.db) {
                    const docRef = this.doc(this.db, this.collectionName, registroId);
                    const docSnap = await this.getDoc(docRef);
                    if (docSnap.exists()) {
                        return docSnap.data();
                    }
                }
                return null;
            } catch (error) {
                console.warn('⚠️ Error obteniendo registro:', error);
                return null;
            }
        }

        async getAllRegistros() {
            const all = await this.getAll();
            return all.filter(item => item.tipo === 'registro');
        }
    }
    
    // Crear objeto de repositorios
    if (!window.firebaseRepos) {
        window.firebaseRepos = {};
    }
    
    // Crear repositorio de logística
    if (!window.firebaseRepos.logistica) {
        window.firebaseRepos.logistica = new LogisticaRepo();
        console.log('✅ Repositorio de logística creado');
    } else {
        console.log('ℹ️ Repositorio de logística ya existe');
    }
    
    // 4. Obtener información del usuario
    const user = window.firebaseAuth?.currentUser;
    const currentUser = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
    const tenantId = currentUser?.tenantId || localStorage.getItem('tenantId') || 'demo_tenant';
    
    console.log('📊 Información del usuario:');
    console.log('  - Email:', user?.email);
    console.log('  - TenantId:', tenantId);
    
    // 5. Inicializar repositorio
    const repo = window.firebaseRepos.logistica;
    console.log('🔄 Inicializando repositorio...');
    
    // Asignar valores directamente
    repo.db = window.firebaseDb;
    repo.userId = user?.uid;
    repo.tenantId = tenantId;
    
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
    }
    
    // Resetear estado
    repo._initialized = false;
    repo._initPromise = null;
    
    // Llamar a init
    if (typeof repo.init === 'function') {
        try {
            await repo.init();
            console.log('✅ Repositorio inicializado');
        } catch (error) {
            console.error('❌ Error inicializando:', error);
        }
    }
    
    // 6. Verificar estado final
    console.log('📊 Estado final del repositorio:');
    console.log('  - db:', !!repo.db);
    console.log('  - tenantId:', repo.tenantId);
    console.log('  - userId:', repo.userId);
    console.log('  - _initialized:', repo._initialized);
    
    // 7. Intentar cargar registros
    if (repo.db && repo.tenantId) {
        console.log('📋 Cargando registros...');
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
    }
    
    console.log('✅ === PROCESO COMPLETADO ===');
})();

