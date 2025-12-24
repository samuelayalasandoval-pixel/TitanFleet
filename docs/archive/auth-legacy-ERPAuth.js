/**
 * CÓDIGO LEGACY - Sistema de Autenticación ERP Rankiao
 * 
 * Este código fue desactivado y reemplazado por el sistema de autenticación
 * basado en Firebase. Se mantiene aquí como referencia histórica.
 * 
 * Fecha de desactivación: $(Get-Date -Format "yyyy-MM-dd")
 * Reemplazado por: Sistema de autenticación Firebase en firebase-init.js
 * 
 * NOTA: Este código NO se usa en producción. Se mantiene solo como referencia.
 */

// Sistema de Autenticación ERP Rankiao - TEMPORALMENTE DESACTIVADO
/*
class ERPAuth {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutos
        this.init();
    }

    // Inicializar el sistema
    init() {
        this.checkSession();
        this.setupEventListeners();
    }

    // Cargar usuarios desde localStorage o crear usuarios por defecto
    loadUsers() {
        let users = localStorage.getItem('erpUsers');
        
        if (!users) {
            // Crear usuarios por defecto
            users = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    fullName: 'Administrador del Sistema',
                    email: 'admin@rankiao.com',
                    role: 'admin',
                    department: 'Sistema',
                    permissions: ['all'],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                },
                {
                    id: 2,
                    username: 'logistica',
                    password: 'log123',
                    fullName: 'Empleado Logística',
                    email: 'logistica@rankiao.com',
                    role: 'employee',
                    department: 'Logística',
                    permissions: ['logistics', 'view_reports'],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                },
                {
                    id: 3,
                    username: 'facturacion',
                    password: 'fac123',
                    fullName: 'Empleado Facturación',
                    email: 'facturacion@rankiao.com',
                    role: 'employee',
                    department: 'Facturación',
                    permissions: ['billing', 'view_reports'],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                },
                {
                    id: 4,
                    username: 'trafico',
                    password: 'tra123',
                    fullName: 'Empleado Tráfico',
                    email: 'trafico@rankiao.com',
                    role: 'employee',
                    department: 'Tráfico',
                    permissions: ['traffic', 'view_reports'],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                },
                {
                    id: 5,
                    username: 'contabilidad',
                    password: 'con123',
                    fullName: 'Empleado Contabilidad',
                    email: 'contabilidad@rankiao.com',
                    role: 'employee',
                    department: 'Contabilidad',
                    permissions: ['accounting', 'view_reports'],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                }
            ];
            
            localStorage.setItem('erpUsers', JSON.stringify(users));
        }
        
        return JSON.parse(users);
    }

    // Autenticar usuario
    authenticate(username, password) {
        const user = this.users.find(u => 
            u.username === username && 
            u.password === password && 
            u.isActive
        );

        if (user) {
            this.currentUser = user;
            this.isAuthenticated = true;
            this.createSession(user);
            this.logLogin(user);
            return { success: true, user: user };
        } else {
            return { success: false, message: 'Usuario o contraseña incorrectos' };
        }
    }

    // Crear sesión
    createSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            role: user.role,
            department: user.department,
            permissions: user.permissions,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString()
        };

        localStorage.setItem('erpSession', JSON.stringify(session));
        sessionStorage.setItem('erpCurrentUser', JSON.stringify(user));
    }

    // Verificar sesión
    checkSession() {
        const session = localStorage.getItem('erpSession');
        
        if (session) {
            const sessionData = JSON.parse(session);
            const now = new Date();
            const expiresAt = new Date(sessionData.expiresAt);

            if (now < expiresAt) {
                // Sesión válida
                const user = this.users.find(u => u.id === sessionData.userId);
                if (user && user.isActive) {
                    this.currentUser = user;
                    this.isAuthenticated = true;
                    this.extendSession();
                    return true;
                }
            }
        }

        // Sesión inválida o expirada
        this.logout();
        return false;
    }

    // Extender sesión
    extendSession() {
        const session = JSON.parse(localStorage.getItem('erpSession'));
        session.expiresAt = new Date(Date.now() + this.sessionTimeout).toISOString();
        localStorage.setItem('erpSession', JSON.stringify(session));
    }

    // Cerrar sesión
    async logout() {
        // PRIMERO: Marcar que el usuario cerró sesión explícitamente (ANTES de limpiar)
        sessionStorage.setItem('explicitLogout', 'true');
        localStorage.setItem('sessionClosedExplicitly', 'true');
        console.log('🚫 Logout explícito marcado - NO se hará auto-login');
        
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('erpSession');
        sessionStorage.removeItem('erpCurrentUser');
        
        // Cerrar sesión en Firebase si está disponible
        if (window.firebaseSignOut) {
            try {
                await window.firebaseSignOut();
            } catch (error) {
                console.warn('Error cerrando sesión en Firebase:', error);
            }
        }
        
        // Redirigir al index
        window.location.href = 'index.html';
    }

    // Verificar permisos
    hasPermission(permission) {
        if (!this.isAuthenticated || !this.currentUser) return false;
        
        if (this.currentUser.role === 'admin') return true;
        
        return this.currentUser.permissions.includes(permission);
    }

    // Verificar si puede acceder a un departamento
    canAccessDepartment(department) {
        if (!this.isAuthenticated || !this.currentUser) return false;
        
        if (this.currentUser.role === 'admin') return true;
        
        return this.currentUser.department === department || 
               this.currentUser.permissions.includes('all');
    }

    // Log de login
    logLogin(user) {
        const loginLog = {
            userId: user.id,
            username: user.username,
            timestamp: new Date().toISOString(),
            ip: 'localhost',
            userAgent: navigator.userAgent
        };

        let logs = JSON.parse(localStorage.getItem('erpLoginLogs') || '[]');
        logs.push(loginLog);
        
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }
        
        localStorage.setItem('erpLoginLogs', JSON.stringify(logs));
        
        user.lastLogin = new Date().toISOString();
        this.updateUser(user);
    }

    // Actualizar usuario
    updateUser(updatedUser) {
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            this.users[index] = updatedUser;
            localStorage.setItem('erpUsers', JSON.stringify(this.users));
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Solo configurar en la página de inicio
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
            const loginForm = document.getElementById('loginForm');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
        }

        // Verificar sesión cada minuto
        setInterval(() => {
            if (this.isAuthenticated) {
                this.checkSession();
            }
        }, 60000);
    }

    // Manejar login
    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            alert('Por favor completa todos los campos');
            return;
        }

        const result = this.authenticate(username, password);
        
        if (result.success) {
            alert(`¡Bienvenido ${result.user.fullName}!`);
            
            // Redirigir según el rol
            setTimeout(() => {
                this.redirectAfterLogin(result.user);
            }, 1000);
        } else {
            alert(result.message);
        }
    }

    // Redirigir después del login
    redirectAfterLogin(user) {
        // Siempre redirigir al menú principal
        window.location.href = 'menu.html';
    }

    // Verificar acceso a página protegida
    checkPageAccess() {
        // Solo verificar en páginas que no sean la de inicio
        if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
            return true;
        }

        if (!this.isAuthenticated) {
            alert('Debes iniciar sesión para acceder a esta página');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    }
}

// Función para mostrar modal de contraseña olvidada
function showForgotPassword() {
    const email = prompt('Ingrese su correo electrónico para restablecer la contraseña:');
    if (email) {
        alert('Se ha enviado un enlace de restablecimiento a su correo electrónico.\n\nNota: Esta es una demo. En producción se enviaría un email real.');
    }
}

// Inicializar sistema de autenticación
let erpAuth;

document.addEventListener('DOMContentLoaded', function() {
    erpAuth = new ERPAuth();
    window.erpAuth = erpAuth;
    
    // Verificar acceso a páginas protegidas
    if (erpAuth) {
        erpAuth.checkPageAccess();
    }
});
*/
