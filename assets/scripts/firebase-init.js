// TitanFleet - Firebase initialization (browser, ESM via CDN)
// Uses Firebase v10 modular SDK from CDN

// Load Firebase modules from CDN
import {
  initializeApp,
  getApps,
  getApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAnalytics,
  isSupported as analyticsIsSupported
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// If later needed, uncomment and import other services:
// import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
// import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
// import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBh_x0zUdauLERfWn-LMC2xnbxftfTXhhg',
  authDomain: 'titanfleet-60931.firebaseapp.com',
  databaseURL: 'https://titanfleet-60931-default-rtdb.firebaseio.com',
  projectId: 'titanfleet-60931',
  storageBucket: 'titanfleet-60931.firebasestorage.app',
  messagingSenderId: '638195392578',
  appId: '1:638195392578:web:4afc3e07bf448dedb60ddb',
  measurementId: 'G-LB745PEHGV'
};

// Initialize Firebase - verificar si ya está inicializado
let app;
try {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    // Si ya hay una app inicializada, usar la existente (generalmente '[DEFAULT]')
    app = getApp();
    console.log('✅ Usando instancia de Firebase existente');
  } else {
    // Si no hay apps, inicializar una nueva
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado correctamente');
  }
} catch (error) {
  // Si hay error al obtener la app existente, intentar inicializar una nueva
  console.warn('⚠️ Error al verificar app existente, inicializando nueva instancia:', error);
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado correctamente (después de error)');
  } catch (initError) {
    console.error('❌ Error al inicializar Firebase:', initError);
    throw initError;
  }
}

export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics if supported (avoids errors in unsupported environments)
try {
  const supported = await analyticsIsSupported();
  if (supported) {
    getAnalytics(app);
  }
} catch (_) {
  // no-op
}

// Expose globally for legacy scripts
window.firebaseConfig = firebaseConfig;
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

// Expose auth functions globally for legacy scripts
window.firebaseAuthFunctions = {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
};

// Asegurar autenticación antes de permitir operaciones
// Si no hay usuario autenticado después de 2 segundos, autenticar anónimamente
setTimeout(async () => {
  if (window.firebaseAuth && !window.firebaseAuth.currentUser) {
    try {
      console.log('🔐 No hay usuario autenticado, intentando autenticación anónima...');
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Autenticación anónima exitosa. UID:', userCredential.user.uid);
      console.log('✅ Usuario anónimo autenticado:', {
        uid: userCredential.user.uid,
        isAnonymous: userCredential.user.isAnonymous,
        tenantId: localStorage.getItem('tenantId') || 'demo'
      });
    } catch (authError) {
      console.error('❌ Error en autenticación anónima:', {
        code: authError.code,
        message: authError.message,
        stack: authError.stack
      });

      // Si la autenticación anónima no está habilitada, informar al usuario
      if (authError.code === 'auth/operation-not-allowed') {
        console.error('❌ AUTENTICACIÓN ANÓNIMA NO HABILITADA en Firebase Console');
        console.error(
          '💡 Para habilitar: Firebase Console > Authentication > Sign-in method > Anonymous > Enable'
        );
      }
    }
  } else if (window.firebaseAuth && window.firebaseAuth.currentUser) {
    console.log('✅ Usuario ya autenticado:', {
      uid: window.firebaseAuth.currentUser.uid,
      email: window.firebaseAuth.currentUser.email || 'anónimo',
      isAnonymous: window.firebaseAuth.currentUser.isAnonymous
    });
  }
}, 2000);

// --- Firestore helpers (expuestos globalmente) ---
window.fs = {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  runTransaction,
  db
};

// Evento global para notificar que Firebase está completamente inicializado
// Esto permite que otros scripts esperen antes de inicializarse
window.firebaseReady = true;
if (typeof CustomEvent !== 'undefined') {
  const firebaseReadyEvent = new CustomEvent('firebaseReady', {
    detail: {
      app,
      auth,
      db,
      config: firebaseConfig
    }
  });
  window.dispatchEvent(firebaseReadyEvent);
  console.log('✅ Evento firebaseReady despachado');
}

// Simple sign-in helper used by index.html modal
window.firebaseSignIn = async function (email, password, tenantId = 'demo') {
  // IMPORTANTE: Limpiar datos de sesión anterior ANTES de iniciar sesión con nuevo usuario
  // Esto previene que los permisos del usuario anterior interfieran
  console.log('🧹 Limpiando sesión anterior antes de iniciar sesión...');
  localStorage.removeItem('erpSession');
  localStorage.removeItem('erpCurrentUser');
  try {
    sessionStorage.removeItem('erpSession');
    sessionStorage.removeItem('erpCurrentUser');
            } catch (_) {
              // Ignorar error intencionalmente
            }

  // También resetear variables de estado de permisos
  if (window._permissionsApplied !== undefined) {
    window._permissionsApplied = false;
  }
  if (window._permissionsCheckCount !== undefined) {
    window._permissionsCheckCount = 0;
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const { user } = cred;
  const _ALL_MODULES = [
    'Logística',
    'Facturación',
    'Tráfico',
    'Diesel',
    'Mantenimiento',
    'Tesoreria',
    'Cuentas x Cobrar',
    'Cuentas x Pagar',
    'Inventario',
    'Configuración',
    'Reportes'
  ];

  // Leer permisos desde configuracion/usuarios (donde se guardan los permisos reales)
  let profilePermisos = { ver: [], editar: [] };
  try {
    // Primero intentar leer desde configuracion/usuarios
    const configRef = doc(db, 'configuracion', 'usuarios');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists() && configSnap.data().usuarios) {
      const { usuarios } = configSnap.data();
      const usuarioConfig = usuarios.find(u => u.email === user.email);

      if (usuarioConfig) {
        // Usuario encontrado en configuracion/usuarios
        console.log(
          '✅ Usuario encontrado en configuracion/usuarios:',
          usuarioConfig.email || usuarioConfig.nombre
        );
        if (
          usuarioConfig.permisos &&
          usuarioConfig.permisos.ver &&
          Array.isArray(usuarioConfig.permisos.ver) &&
          usuarioConfig.permisos.ver.length > 0
        ) {
          console.log('✅ Permisos encontrados en configuracion/usuarios:', usuarioConfig.permisos);
          // Los permisos se guardan tal cual (con acentos), mantenerlos así para compatibilidad
          profilePermisos = {
            ver: usuarioConfig.permisos.ver || [],
            editar: [],
            puedeAprobarSolicitudes: usuarioConfig.permisos.puedeAprobarSolicitudes || false
          };
          console.log('📋 Permisos asignados al usuario:', profilePermisos.ver);
          console.log('📊 Total de módulos permitidos:', profilePermisos.ver.length);
        } else {
          // Usuario existe pero no tiene permisos configurados
          // Asignar permisos básicos para permitir acceso al menú y configuración
          console.log(
            '⚠️ Usuario encontrado en configuracion/usuarios pero sin permisos configurados'
          );
          console.log('ℹ️ Asignando permisos mínimos para permitir acceso al sistema');
          profilePermisos = {
            ver: ['Dashboard', 'Configuración'], // Permitir acceso a Dashboard (menú) y Configuración
            editar: [],
            puedeAprobarSolicitudes: false
          };
        }
      } else {
        console.log(
          '⚠️ Usuario no encontrado en configuracion/usuarios, usando permisos de users/'
        );
        // Fallback: leer de users/uid
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() || {};
          const ver = Array.isArray(data?.permisos?.ver) ? data.permisos.ver : [];
          profilePermisos = { ver, editar: [] };

          // Si no tiene permisos, NO dar todos los módulos automáticamente
          if (ver.length === 0) {
            console.log('⚠️ Usuario sin permisos en users/ - acceso restringido');
            profilePermisos = { ver: [], editar: [] };
          }
        } else {
          // Usuario nuevo sin configuración - Dar acceso básico al menú y configuración
          console.log('⚠️ Usuario nuevo sin configuración - asignando permisos mínimos');
          profilePermisos = {
            ver: ['Dashboard', 'Configuración'], // Acceso básico al menú y configuración
            editar: []
          };
        }
      }
    } else {
      console.log('⚠️ No existe configuracion/usuarios, usando permisos de users/');
      // Fallback: leer de users/uid
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        // Si es un usuario nuevo sin configuración, darle acceso básico
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || '',
          tenantId,
          nombre: user.displayName || (user.email ? user.email.split('@')[0] : ''),
          permisos: { ver: ['Dashboard', 'Configuración'], editar: [] }, // Acceso básico al menú y configuración
          createdAt: new Date().toISOString()
        });
        profilePermisos = { ver: ['Dashboard', 'Configuración'], editar: [] }; // Acceso básico
      } else {
        const data = snap.data() || {};
        const ver = Array.isArray(data?.permisos?.ver) ? data.permisos.ver : [];
        profilePermisos = { ver, editar: [] };
        // NO actualizar automáticamente a ALL_MODULES si está vacío
        if (ver.length === 0) {
          console.log('⚠️ Usuario sin permisos en users/ - acceso restringido');
        }
      }
    }
  } catch (err) {
    console.error('⚠️ Error leyendo permisos:', err);
    // Si falla Firestore, NO dar acceso automático - restringir acceso
    console.log('⚠️ Error al leer permisos - acceso restringido por seguridad');
    profilePermisos = { ver: [], editar: [] };
  }

  const current = {
    nombre: user.displayName || (user.email ? user.email.split('@')[0] : ''),
    email: user.email || '',
    tenantId,
    permisos: profilePermisos
  };
  const session = {
    user: current,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  };

  // Guardar nueva sesión (sobrescribiendo cualquier sesión anterior)
  localStorage.setItem('erpSession', JSON.stringify(session));
  localStorage.setItem('erpCurrentUser', JSON.stringify(current));

  console.log(
    '👤 Usuario autenticado:',
    current.nombre,
    '| Email:',
    current.email,
    '| Permisos:',
    current.permisos.ver
  );
  console.log('📋 Total de permisos:', current.permisos.ver.length);

  // Forzar actualización de la UI inmediatamente
  if (typeof window.erpAuth !== 'undefined') {
    // Actualizar el objeto erpAuth
    window.erpAuth.isAuthenticated = true;
    window.erpAuth.currentUser = current;

    // Actualizar navegación después de cargar permisos
    if (typeof window.erpAuth.updateUserUI === 'function') {
      // Ejecutar inmediatamente y también después de delays para asegurar que se aplique
      window.erpAuth.updateUserUI();
      setTimeout(() => {
        window.erpAuth.updateUserUI();
        console.log('✅ Navegación actualizada con permisos del usuario (1er intento)');
      }, 500);
      setTimeout(() => {
        window.erpAuth.updateUserUI();
        console.log('✅ Navegación actualizada con permisos del usuario (2do intento)');
      }, 2000);
    }
  }

  return current;
};

window.firebaseSignOut = async function () {
  // PRIMERO: Marcar que se cerró sesión explícitamente (ANTES de limpiar)
  sessionStorage.setItem('explicitLogout', 'true');
  localStorage.setItem('sessionClosedExplicitly', 'true');
  console.log('🚫 Logout explícito marcado en firebaseSignOut - NO se hará auto-login');

  await signOut(auth);
  localStorage.removeItem('erpSession');
  localStorage.removeItem('erpCurrentUser');
};

// Mantener sincronizada la sesión local con Firebase Auth (evita null tras recarga)
onAuthStateChanged(auth, user => {
  try {
    if (user) {
      // SIEMPRE verificar y crear documento users/{uid} si no existe
      (async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            // Crear documento users/{uid} si no existe
            console.log('⚠️ [onAuthStateChanged] Documento users/{uid} NO existe, creándolo...');

            // Obtener tenantId usando la misma lógica que obtenerTenantIdActual()
            let tenantIdParaUsuario = null;
            try {
              // PRIORIDAD 1: Verificar si es un usuario recién creado (marcado en index-activation-flow.js)
              const newUserCreated = localStorage.getItem('newUserCreated');
              const newUserTenantId = localStorage.getItem('newUserTenantId');
              if (newUserCreated === 'true' && newUserTenantId) {
                tenantIdParaUsuario = newUserTenantId;
                console.log(
                  '✅ [onAuthStateChanged] Usando tenantId de usuario recién creado:',
                  tenantIdParaUsuario
                );
              }
              // PRIORIDAD 2: Licencia activa
              else if (window.licenseManager && window.licenseManager.isLicenseActive()) {
                const licenseTenantId = window.licenseManager.getTenantId();
                if (licenseTenantId) {
                  tenantIdParaUsuario = licenseTenantId;
                  console.log(
                    '✅ [onAuthStateChanged] Usando tenantId de licencia:',
                    tenantIdParaUsuario
                  );
                }
              }
              // PRIORIDAD 3: localStorage
              if (!tenantIdParaUsuario) {
                const savedTenantId = localStorage.getItem('tenantId');
                if (savedTenantId) {
                  tenantIdParaUsuario = savedTenantId;
                  console.log(
                    '✅ [onAuthStateChanged] Usando tenantId de localStorage:',
                    tenantIdParaUsuario
                  );
                }
              }
            } catch (e) {
              console.warn('⚠️ Error obteniendo tenantId:', e);
            }

            // Si no se encontró tenantId, usar DEMO_CONFIG.tenantId si está disponible, sino null
            if (!tenantIdParaUsuario) {
              if (window.DEMO_CONFIG && window.DEMO_CONFIG.tenantId) {
                tenantIdParaUsuario = window.DEMO_CONFIG.tenantId;
                console.warn(
                  '⚠️ [onAuthStateChanged] No se encontró tenantId válido, usando DEMO_CONFIG.tenantId como fallback'
                );
              } else {
                console.warn(
                  '⚠️ [onAuthStateChanged] No se encontró tenantId válido y DEMO_CONFIG no está disponible'
                );
                // No asignar ningún tenantId en este caso - el sistema debería manejar esto apropiadamente
              }
            }

            await setDoc(userRef, {
              uid: user.uid,
              email: user.email || '',
              tenantId: tenantIdParaUsuario,
              nombre: user.displayName || (user.email ? user.email.split('@')[0] : ''),
              permisos: { ver: [], editar: [] }, // Sin permisos por defecto
              createdAt: new Date().toISOString(),
              isAnonymous: user.isAnonymous || false
            });
            console.log(
              `✅ [onAuthStateChanged] Documento users/{uid} creado con tenantId: ${tenantIdParaUsuario}`
            );
          } else {
            console.log('✅ [onAuthStateChanged] Documento users/{uid} ya existe');
          }
        } catch (error) {
          console.error(
            '❌ [onAuthStateChanged] Error verificando/creando documento users/{uid}:',
            error
          );
        }
      })();

      // Re-sincronizar permisos desde Firestore si faltan en local
      (async () => {
        const existing = JSON.parse(localStorage.getItem('erpCurrentUser') || 'null');
        // Si tiene permisos válidos (array no vacío), NO sobrescribir - respetar los permisos ya cargados
        const hasValidPermissions =
          existing &&
          existing.permisos &&
          Array.isArray(existing.permisos.ver) &&
          existing.permisos.ver.length > 0;

        // Solo sincronizar si realmente falta información Y no tiene permisos válidos
        // Esto evita sobrescribir permisos correctos que ya se cargaron
        const needSync =
          (!existing ||
            !existing.email ||
            !existing.permisos ||
            !Array.isArray(existing.permisos.ver)) &&
          !hasValidPermissions;

        if (needSync) {
          console.log('🔄 [onAuthStateChanged] Sincronizando permisos desde Firebase...');
          try {
            const _ALL_MODULES = [
              'Logística',
              'Facturación',
              'Tráfico',
              'Diesel',
              'Mantenimiento',
              'Tesoreria',
              'Cuentas x Cobrar',
              'Cuentas x Pagar',
              'Inventario',
              'Configuración',
              'Reportes'
            ];
            let permisos = { ver: [], editar: [] };

            // Primero intentar leer desde configuracion/usuarios
            try {
              const configRef = doc(db, 'configuracion', 'usuarios');
              const configSnap = await getDoc(configRef);

              if (configSnap.exists() && configSnap.data().usuarios) {
                const { usuarios } = configSnap.data();
                const usuarioConfig = usuarios.find(u => u.email === user.email);

                if (usuarioConfig && usuarioConfig.permisos) {
                  console.log('✅ [onAuthStateChanged] Permisos de configuracion/usuarios');
                  permisos = {
                    ver: usuarioConfig.permisos.ver || [],
                    editar: [],
                    puedeAprobarSolicitudes: usuarioConfig.permisos.puedeAprobarSolicitudes || false
                  };
                }
              }
            } catch (_) {
              // Ignorar error intencionalmente
            }

            // Si no hay permisos en configuracion/usuarios, leer de users/uid
            if (permisos.ver.length === 0) {
              const userRef = doc(db, 'users', user.uid);
              const snap = await getDoc(userRef);
              if (snap.exists()) {
                const data = snap.data() || {};
                if (Array.isArray(data?.permisos?.ver) && data.permisos.ver.length > 0) {
                  permisos = { ver: data.permisos.ver, editar: [] };
                } else {
                  // NO dar todos los módulos automáticamente - acceso restringido
                  console.log(
                    '⚠️ [onAuthStateChanged] Usuario sin permisos en users/ - acceso restringido'
                  );
                  permisos = { ver: [], editar: [] };
                }
              } else {
                // Usuario nuevo sin configuración - NO dar acceso automático
                console.log(
                  '⚠️ [onAuthStateChanged] Usuario nuevo sin configuración - acceso restringido'
                );
                permisos = { ver: [], editar: [] };
              }
            }

            // Obtener tenantId con prioridad: usuario recién creado > localStorage > documento users/{uid} > licencia > demo
            let tenantIdParaSesion = null;

            // PRIORIDAD 1: Verificar si es un usuario recién creado
            const newUserCreated = localStorage.getItem('newUserCreated');
            const newUserTenantId = localStorage.getItem('newUserTenantId');
            if (newUserCreated === 'true' && newUserTenantId) {
              tenantIdParaSesion = newUserTenantId;
              console.log(
                '✅ [onAuthStateChanged] PRIORIDAD 1: Usando tenantId de usuario recién creado:',
                tenantIdParaSesion
              );
            }

            // PRIORIDAD 2: Verificar localStorage directo
            if (!tenantIdParaSesion) {
              const savedTenantId = localStorage.getItem('tenantId');
              if (savedTenantId) {
                tenantIdParaSesion = savedTenantId;
                console.log(
                  '✅ [onAuthStateChanged] PRIORIDAD 2: Usando tenantId de localStorage:',
                  tenantIdParaSesion
                );
              }
            }

            // PRIORIDAD 3: Verificar documento users/{uid}
            if (!tenantIdParaSesion) {
              try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  if (userData.tenantId) {
                    tenantIdParaSesion = userData.tenantId;
                    console.log(
                      '✅ [onAuthStateChanged] PRIORIDAD 3: Usando tenantId del documento users/{uid}:',
                      tenantIdParaSesion
                    );
                  }
                }
              } catch (e) {
                console.warn('⚠️ [onAuthStateChanged] Error leyendo documento users/{uid}:', e);
              }
            }

            // PRIORIDAD 4: Verificar licencia activa
            if (
              !tenantIdParaSesion &&
              window.licenseManager &&
              window.licenseManager.isLicenseActive()
            ) {
              const licenseTenantId = window.licenseManager.getTenantId();
              if (licenseTenantId) {
                tenantIdParaSesion = licenseTenantId;
                console.log(
                  '✅ [onAuthStateChanged] PRIORIDAD 4: Usando tenantId de licencia:',
                  tenantIdParaSesion
                );
              }
            }

            // ÚLTIMO RECURSO: usar DEMO_CONFIG.tenantId si está disponible
            if (!tenantIdParaSesion) {
              if (window.DEMO_CONFIG && window.DEMO_CONFIG.tenantId) {
                tenantIdParaSesion = window.DEMO_CONFIG.tenantId;
                console.warn(
                  '⚠️ [onAuthStateChanged] Usando DEMO_CONFIG.tenantId como último recurso - NO se encontró tenantId válido'
                );
              } else {
                console.warn(
                  '⚠️ [onAuthStateChanged] NO se encontró tenantId válido y DEMO_CONFIG no está disponible'
                );
                // No asignar ningún tenantId en este caso
              }
            }

            const current = {
              nombre: user.displayName || (user.email ? user.email.split('@')[0] : ''),
              email: user.email || '',
              tenantId: tenantIdParaSesion,
              permisos
            };
            const session = {
              user: current,
              loginTime: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            };
            localStorage.setItem('erpSession', JSON.stringify(session));
            localStorage.setItem('erpCurrentUser', JSON.stringify(current));
            try {
              console.debug('[firebase-init] Session hydrated | Permisos:', current.permisos.ver);
            } catch (_) {
              // Ignorar error intencionalmente
            }

            // Actualizar navegación después de sincronizar permisos
            // SOLO si aún no se ha actualizado el nombre de usuario
            if (
              typeof window.erpAuth !== 'undefined' &&
              typeof window.erpAuth.updateUserUI === 'function'
            ) {
              setTimeout(() => {
                window.erpAuth.updateUserUI();
                console.log('✅ [onAuthStateChanged] Permisos aplicados (nombre ya actualizado)');
              }, 500);
            }

            // También actualizar el menú si está en menu.html
            // Solo llamar loadModules() sin parámetros si estamos en menu.html
            const pathname = window.location.pathname || '';
            const filename = pathname.split('/').pop() || pathname.split('\\').pop() || '';
            const isMenuPage =
              filename === 'menu.html' ||
              filename === '' ||
              filename === 'index.html' ||
              pathname.includes('menu.html');

            // Verificar que loadModules existe y que es la función del menú (no requiere parámetros)
            if (isMenuPage && typeof window.loadModules === 'function') {
              // Verificar si es la función del menú (que no requiere parámetros)
              // La función del menú no tiene validación de parámetros
              const functionString = window.loadModules.toString();
              const isMenuFunction =
                !functionString.includes('moduleNames') ||
                functionString.includes('moduleNames === undefined');

              if (isMenuFunction) {
                setTimeout(() => {
                  try {
                    window.loadModules();
                    console.log('✅ [onAuthStateChanged] Módulos recargados en el menú');
                  } catch (error) {
                    // Si hay un error, probablemente no es la función del menú
                    console.debug(
                      'ℹ️ [onAuthStateChanged] loadModules no disponible o requiere parámetros:',
                      error.message
                    );
                  }
                }, 500);
              } else {
                console.debug(
                  'ℹ️ [onAuthStateChanged] loadModules requiere parámetros, no es la función del menú'
                );
              }
            }
          } catch (error) {
            console.error('❌ [onAuthStateChanged] Error sincronizando permisos:', error);
          }
        } else if (hasValidPermissions) {
          console.log(
            '✅ [onAuthStateChanged] Usuario ya tiene permisos válidos, no sobrescribiendo'
          );
          // Aún así, actualizar el menú para asegurar que los módulos se muestren correctamente
          // Solo llamar loadModules() sin parámetros si estamos en menu.html
          const pathname = window.location.pathname || '';
          const filename = pathname.split('/').pop() || pathname.split('\\').pop() || '';
          const isMenuPage =
            filename === 'menu.html' ||
            filename === '' ||
            filename === 'index.html' ||
            pathname.includes('menu.html');

          // Verificar que loadModules existe y que es la función del menú (no requiere parámetros)
          if (isMenuPage && typeof window.loadModules === 'function') {
            // Verificar si es la función del menú (que no requiere parámetros)
            // La función del menú no tiene validación de parámetros
            const functionString = window.loadModules.toString();
            const isMenuFunction =
              !functionString.includes('moduleNames') ||
              functionString.includes('moduleNames === undefined');

            if (isMenuFunction) {
              setTimeout(() => {
                try {
                  window.loadModules();
                  console.log('✅ [onAuthStateChanged] Módulos recargados (permisos ya válidos)');
                } catch (error) {
                  // Si hay un error, probablemente no es la función del menú
                  console.debug(
                    'ℹ️ [onAuthStateChanged] loadModules no disponible o requiere parámetros:',
                    error.message
                  );
                }
              }, 500);
            } else {
              console.debug(
                'ℹ️ [onAuthStateChanged] loadModules requiere parámetros, no es la función del menú'
              );
            }
          }
        } else {
          console.log(
            'ℹ️ [onAuthStateChanged] No se necesita sincronización, usuario ya tiene datos'
          );
        }
      })();
    } else {
      // Usuario desautenticado en Firebase; no limpiar localStorage automáticamente para no expulsar en caliente
      // Se limpiará solo si el usuario pulsa "Cerrar Sesión" (firebaseSignOut)
    }
  } catch (e) {
    try {
      console.warn('[firebase-init] onAuthStateChanged error', e);
            } catch (_) {
              // Ignorar error intencionalmente
            }
  }
});

// Exponer función manual de sincronización de perfil
window.syncUserProfileFromFirestore = async function () {
  try {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return false;
    }
    const data = snap.data() || {};
    const permisos =
      Array.isArray(data?.permisos?.ver) && data.permisos.ver.length > 0
        ? { ver: data.permisos.ver, editar: [] }
        : { ver: [], editar: [] };
    // Obtener tenantId con prioridad: documento users/{uid} > localStorage > DEMO_CONFIG
    let tenantIdParaSesion = window.DEMO_CONFIG?.tenantId || 'demo';
    const demoTenantId = window.DEMO_CONFIG?.tenantId || 'demo_tenant';
    if (data.tenantId && data.tenantId !== demoTenantId) {
      tenantIdParaSesion = data.tenantId;
    } else {
      // Verificar si es un usuario recién creado
      const newUserTenantId = localStorage.getItem('newUserTenantId');
      if (newUserTenantId && newUserTenantId !== demoTenantId) {
        tenantIdParaSesion = newUserTenantId;
      } else {
        const savedTenantId = localStorage.getItem('tenantId');
        if (savedTenantId && savedTenantId !== demoTenantId) {
          tenantIdParaSesion = savedTenantId;
        }
      }
    }

    const current = {
      nombre: data.nombre || user.displayName || (user.email ? user.email.split('@')[0] : ''),
      email: user.email || '',
      tenantId: tenantIdParaSesion,
      permisos
    };
    const session = {
      user: current,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('erpSession', JSON.stringify(session));
    localStorage.setItem('erpCurrentUser', JSON.stringify(current));
    return true;
  } catch (_) {
    return false;
  }
};

// Conceder todos los módulos y guardar en Firestore + localStorage
window.grantAllModulesAndSync = async function () {
  const ALL_MODULES = [
    'Logística',
    'Facturación',
    'Tráfico',
    'Diesel',
    'Mantenimiento',
    'Tesoreria',
    'Cuentas x Cobrar',
    'Cuentas x Pagar',
    'Inventario',
    'Configuración',
    'Reportes'
  ];
  const user = auth.currentUser;
  if (!user) {
    return false;
  }
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        tenantId: localStorage.getItem('tenantId') || 'demo',
        nombre: user.displayName || (user.email ? user.email.split('@')[0] : ''),
        permisos: { ver: ALL_MODULES, editar: [] },
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    const current = {
      nombre: user.displayName || (user.email ? user.email.split('@')[0] : ''),
      email: user.email || '',
      tenantId: localStorage.getItem('tenantId') || 'demo',
      permisos: { ver: ALL_MODULES, editar: [] }
    };
    const session = {
      user: current,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('erpCurrentUser', JSON.stringify(current));
    localStorage.setItem('erpSession', JSON.stringify(session));
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Función auxiliar para obtener el tenantId actual
 * Sigue la misma lógica que firebase-repo-base.js
 */
async function obtenerTenantIdActual() {
  try {
    // PRIORIDAD 1: Verificar si hay una licencia activa
    if (window.licenseManager && window.licenseManager.isLicenseActive()) {
      const licenseTenantId = window.licenseManager.getTenantId();
      if (licenseTenantId) {
        console.log(`✅ Usando tenantId de licencia: ${licenseTenantId}`);
        return licenseTenantId;
      }
    }

    // PRIORIDAD 2: Verificar tenantId guardado en localStorage
    const savedTenantId = localStorage.getItem('tenantId');
    if (savedTenantId && savedTenantId !== 'demo_tenant') {
      console.log(`✅ Usando tenantId guardado: ${savedTenantId}`);
      return savedTenantId;
    }

    // PRIORIDAD 3: Obtener tenantId del usuario actual que está creando el nuevo usuario
    const { currentUser } = auth;
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userTenantId = userDoc.data().tenantId;
          if (userTenantId) {
            console.log(`✅ Usando tenantId del usuario actual: ${userTenantId}`);
            return userTenantId;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo tenantId del usuario actual:', error);
      }
    }

    // PRIORIDAD 4: Fallback a DEMO_CONFIG.tenantId si está disponible
    if (window.DEMO_CONFIG && window.DEMO_CONFIG.tenantId) {
      console.log(`✅ Usando tenantId de DEMO_CONFIG: ${window.DEMO_CONFIG.tenantId}`);
      return window.DEMO_CONFIG.tenantId;
    }

    console.warn('⚠️ No se encontró tenantId válido y DEMO_CONFIG no está disponible');
    return null; // Retornar null en lugar de un valor hardcodeado
  } catch (error) {
    console.error('❌ Error obteniendo tenantId:', error);
    // En caso de error, intentar usar DEMO_CONFIG.tenantId si está disponible
    if (window.DEMO_CONFIG && window.DEMO_CONFIG.tenantId) {
      return window.DEMO_CONFIG.tenantId;
    }
    return null;
  }
}

/**
 * Función de verificación para probar que los usuarios tienen tenantId correcto
 * Ejecutar desde la consola: window.verificarTenantIdUsuarios()
 * Disponible en todas las páginas ya que firebase-init.js se carga globalmente
 */
window.verificarTenantIdUsuarios = async function () {
  try {
    console.log('🔍 === VERIFICACIÓN DE tenantId EN USUARIOS ===\n');

    if (!window.fs || !window.firebaseDb) {
      console.error('❌ Firebase no está inicializado');
      return;
    }

    // 1. Verificar usuario actual
    const { currentUser } = auth;
    if (currentUser) {
      console.log('👤 Usuario actual:', currentUser.email);
      console.log('   UID:', currentUser.uid);

      const currentUserDocRef = doc(db, 'users', currentUser.uid);
      const currentUserDoc = await getDoc(currentUserDocRef);

      if (currentUserDoc.exists()) {
        const data = currentUserDoc.data();
        console.log('   ✅ Documento users/{uid} existe');
        console.log('   tenantId:', data.tenantId || '❌ NO TIENE tenantId');
        console.log('   Email:', data.email || 'N/A');
        console.log('   Nombre:', data.nombre || 'N/A');
        console.log('   Creado:', data.createdAt || 'N/A');
      } else {
        console.log('   ❌ Documento users/{uid} NO EXISTE');
        console.log('   ⚠️ Este usuario necesita el documento users/{uid} con tenantId');
      }
    } else {
      console.log('⚠️ No hay usuario autenticado');
    }

    console.log('\n');

    // 2. Verificar usuarios en configuracion/usuarios
    console.log('📋 Verificando usuarios en configuracion/usuarios...');
    const usuariosDocRef = doc(db, 'configuracion', 'usuarios');
    const usuariosDoc = await getDoc(usuariosDocRef);

    if (usuariosDoc.exists()) {
      const usuarios = usuariosDoc.data().usuarios || [];
      console.log(`   Total de usuarios en configuracion: ${usuarios.length}\n`);

      // Obtener tenantId esperado
      const tenantIdEsperado = await obtenerTenantIdActual();
      console.log(`   tenantId esperado (del usuario actual): ${tenantIdEsperado}\n`);

      for (const usuario of usuarios) {
        console.log(`   📧 ${usuario.email || 'Sin email'}`);
        console.log(`      Nombre: ${usuario.nombre || 'N/A'}`);
        console.log(`      Permisos: ${(usuario.permisos?.ver || []).length} módulos`);

        // Nota: Para verificar completamente, necesitaríamos el UID del usuario
        // que solo se puede obtener cuando el usuario inicia sesión
      }

      console.log('\n   💡 Para verificar completamente, cada usuario debe iniciar sesión');
      console.log('   y luego ejecutar esta función para verificar su documento users/{uid}');
    } else {
      console.log('   ⚠️ No hay usuarios en configuracion/usuarios');
    }

    console.log('\n');

    // 3. Verificar tenantId actual del sistema
    console.log('🔑 Verificando tenantId del sistema...');
    const tenantIdActual = await obtenerTenantIdActual();
    console.log(`   tenantId actual: ${tenantIdActual}`);

    // Verificar de dónde viene
    if (window.licenseManager && window.licenseManager.isLicenseActive()) {
      console.log('   Fuente: Licencia activa');
    } else if (localStorage.getItem('tenantId')) {
      console.log('   Fuente: localStorage');
    } else if (currentUser) {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().tenantId) {
        console.log('   Fuente: Documento users/{uid} del usuario actual');
      } else {
        console.log('   Fuente: Fallback (demo_tenant)');
      }
    } else {
      console.log('   Fuente: Fallback (demo_tenant)');
    }

    console.log('\n✅ === VERIFICACIÓN COMPLETA ===\n');
    console.log('📝 INSTRUCCIONES PARA PROBAR:');
    console.log('1. Crea un nuevo usuario desde Configuración');
    console.log('2. Cierra sesión e inicia sesión con el nuevo usuario');
    console.log('3. Ejecuta esta función nuevamente para verificar que tiene tenantId correcto');
    console.log('4. Verifica en Firebase Console que el documento users/{uid} existe con tenantId');
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
};
