/**
 * Script de Evaluación del Proyecto ERP TitanFleet
 * Genera un reporte completo con porcentajes de completitud
 */

const fs = require('fs');
const path = require('path');

// Configuración
const PROJECT_ROOT = path.join(__dirname, '..');
const PAGES_DIR = path.join(PROJECT_ROOT, 'pages');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'assets', 'scripts');
const STYLES_DIR = path.join(PROJECT_ROOT, 'styles');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const TESTS_DIR = path.join(PROJECT_ROOT, 'tests');

// Módulos principales del sistema
const MODULOS_PRINCIPALES = [
    'menu', 'logistica', 'facturacion', 'trafico', 'operadores',
    'diesel', 'mantenimiento', 'tesoreria', 'CXC', 'CXP',
    'inventario', 'configuracion', 'reportes', 'admin-licencias'
];

// Funcionalidades esperadas por módulo
const FUNCIONALIDADES_ESPERADAS = {
    logistica: ['CRUD', 'Exportación', 'PDF', 'Filtros', 'Búsqueda', 'Clientes'],
    facturacion: ['CRUD', 'Integración CXC', 'Exportación', 'Filtros', 'Búsqueda'],
    trafico: ['CRUD', 'Sincronización', 'Exportación', 'Buzón', 'Filtros'],
    operadores: ['Gestión', 'Asignación', 'CRUD', 'Filtros'],
    diesel: ['Registros', 'Reportes', 'CRUD', 'Filtros'],
    mantenimiento: ['Registros', 'Refacciones', 'CRUD', 'Filtros'],
    tesoreria: ['Movimientos', 'Bancos', 'Exportación', 'CRUD'],
    CXC: ['Gestión', 'Integración', 'CRUD', 'Filtros', 'Búsqueda'],
    CXP: ['Facturas', 'Solicitudes', 'CRUD', 'Filtros', 'Búsqueda'],
    inventario: ['Entradas/Salidas', 'Stock', 'CRUD', 'Filtros'],
    reportes: ['Dashboard', 'Gráficos', 'KPIs', 'Exportación'],
    configuracion: ['Catálogos', 'Bancos', 'Tractocamiones', 'Usuarios', 'Permisos']
};

class EvaluadorProyecto {
    constructor() {
        this.resultados = {
            estructura: {},
            modulos: {},
            codigo: {},
            documentacion: {},
            testing: {},
            firebase: {},
            funcionalidades: {},
            general: {}
        };
    }

    // Evaluar estructura del proyecto
    evaluarEstructura() {
        const estructura = {
            paginasHTML: 0,
            scriptsJS: 0,
            estilosCSS: 0,
            documentacion: 0,
            tests: 0,
            total: 0
        };

        // Contar archivos
        estructura.paginasHTML = this.contarArchivos(PAGES_DIR, '.html');
        estructura.scriptsJS = this.contarArchivos(SCRIPTS_DIR, '.js');
        estructura.estilosCSS = this.contarArchivos(STYLES_DIR, '.css');
        estructura.documentacion = this.contarArchivos(DOCS_DIR, '.md');
        estructura.tests = this.contarArchivos(TESTS_DIR, '.js');

        // Calcular porcentaje
        const esperado = {
            paginasHTML: 16,
            scriptsJS: 200,
            estilosCSS: 15,
            documentacion: 50,
            tests: 10
        };

        estructura.porcentaje = Math.round(
            ((estructura.paginasHTML / esperado.paginasHTML) * 0.3 +
             (Math.min(estructura.scriptsJS / esperado.scriptsJS, 1)) * 0.3 +
             (estructura.estilosCSS / esperado.estilosCSS) * 0.2 +
             (estructura.documentacion / esperado.documentacion) * 0.1 +
             (estructura.tests / esperado.tests) * 0.1) * 100
        );

        this.resultados.estructura = estructura;
        return estructura;
    }

    // Evaluar módulos
    evaluarModulos() {
        const modulos = {};
        let totalPorcentaje = 0;

        for (const modulo of MODULOS_PRINCIPALES) {
            const htmlPath = path.join(PAGES_DIR, `${modulo}.html`);
            const existeHTML = fs.existsSync(htmlPath);
            
            // Buscar scripts relacionados
            const scriptsRelacionados = this.buscarScriptsModulo(modulo);
            
            // Calcular porcentaje
            let porcentaje = 0;
            if (existeHTML) porcentaje += 40;
            if (scriptsRelacionados.length > 0) porcentaje += 40;
            if (scriptsRelacionados.length > 3) porcentaje += 20;

            modulos[modulo] = {
                existeHTML,
                scriptsCount: scriptsRelacionados.length,
                porcentaje: Math.min(porcentaje, 100)
            };

            totalPorcentaje += modulos[modulo].porcentaje;
        }

        modulos.promedio = Math.round(totalPorcentaje / MODULOS_PRINCIPALES.length);
        this.resultados.modulos = modulos;
        return modulos;
    }

    // Evaluar calidad del código
    evaluarCodigo() {
        const codigo = {
            separacionJSHTML: 0,
            consistencia: 0,
            organizacion: 0,
            total: 0
        };

        // Verificar separación JS/HTML (buscar atributos inline)
        const paginasHTML = this.obtenerArchivos(PAGES_DIR, '.html');
        let paginasConInline = 0;
        
        for (const htmlFile of paginasHTML) {
            const contenido = fs.readFileSync(htmlFile, 'utf8');
            // Buscar patrones comunes de código inline
            if (contenido.includes('onclick=') || 
                contenido.includes('onchange=') || 
                contenido.includes('onsubmit=')) {
                paginasConInline++;
            }
        }

        codigo.separacionJSHTML = Math.round(
            ((paginasHTML.length - paginasConInline) / paginasHTML.length) * 100
        );

        // Verificar consistencia (package.json, eslint, prettier)
        const tienePackageJson = fs.existsSync(path.join(PROJECT_ROOT, 'package.json'));
        const tieneESLint = fs.existsSync(path.join(PROJECT_ROOT, '.eslintrc.js')) || 
                          fs.existsSync(path.join(PROJECT_ROOT, '.eslintrc.json'));
        const tienePrettier = fs.existsSync(path.join(PROJECT_ROOT, '.prettierrc')) ||
                             fs.existsSync(path.join(PROJECT_ROOT, 'prettier.config.js'));

        codigo.consistencia = Math.round(
            ((tienePackageJson ? 40 : 0) +
             (tieneESLint ? 30 : 0) +
             (tienePrettier ? 30 : 0))
        );

        // Organización (estructura de carpetas)
        const tieneEstructuraModular = fs.existsSync(path.join(SCRIPTS_DIR, 'logistica')) &&
                                       fs.existsSync(path.join(SCRIPTS_DIR, 'facturacion')) &&
                                       fs.existsSync(path.join(SCRIPTS_DIR, 'trafico'));
        
        codigo.organizacion = tieneEstructuraModular ? 95 : 70;

        codigo.total = Math.round(
            (codigo.separacionJSHTML * 0.4 +
             codigo.consistencia * 0.3 +
             codigo.organizacion * 0.3)
        );

        this.resultados.codigo = codigo;
        return codigo;
    }

    // Evaluar documentación
    evaluarDocumentacion() {
        const docs = {
            cantidad: 0,
            tipos: {},
            total: 0
        };

        const archivosMD = this.obtenerArchivos(DOCS_DIR, '.md');
        docs.cantidad = archivosMD.length;

        // Categorizar documentación
        for (const doc of archivosMD) {
            const nombre = path.basename(doc, '.md');
            if (nombre.includes('GUIA') || nombre.includes('guia')) {
                docs.tipos.guias = (docs.tipos.guias || 0) + 1;
            } else if (nombre.includes('README') || nombre.includes('readme')) {
                docs.tipos.readme = (docs.tipos.readme || 0) + 1;
            } else if (nombre.includes('ESTADO') || nombre.includes('estado')) {
                docs.tipos.estado = (docs.tipos.estado || 0) + 1;
            } else {
                docs.tipos.otros = (docs.tipos.otros || 0) + 1;
            }
        }

        // Calcular porcentaje (esperado: 50+ archivos)
        docs.total = Math.min(Math.round((docs.cantidad / 50) * 100), 100);
        
        this.resultados.documentacion = docs;
        return docs;
    }

    // Evaluar testing
    evaluarTesting() {
        const testing = {
            unitarios: 0,
            integracion: 0,
            e2e: 0,
            configuracion: 0,
            total: 0
        };

        // Verificar configuración
        const tieneVitest = fs.existsSync(path.join(PROJECT_ROOT, 'vitest.config.js'));
        const tienePlaywright = fs.existsSync(path.join(PROJECT_ROOT, 'playwright.config.js'));
        
        testing.configuracion = ((tieneVitest ? 50 : 0) + (tienePlaywright ? 50 : 0));

        // Contar tests
        const archivosTest = this.obtenerArchivos(TESTS_DIR, '.js');
        testing.unitarios = archivosTest.filter(f => 
            f.includes('test') || f.includes('spec')
        ).length;

        // Calcular porcentaje
        testing.total = Math.round(
            (testing.configuracion * 0.4 +
             (Math.min(testing.unitarios / 10, 1) * 100) * 0.3 +
             (tieneVitest && tienePlaywright ? 30 : 0))
        );

        this.resultados.testing = testing;
        return testing;
    }

    // Evaluar Firebase
    evaluarFirebase() {
        const firebase = {
            inicializacion: 0,
            repositorios: 0,
            autenticacion: 0,
            total: 0
        };

        // Verificar archivos Firebase
        const tieneFirebaseInit = fs.existsSync(path.join(SCRIPTS_DIR, 'firebase-init.js'));
        const tieneFirebaseRepos = fs.existsSync(path.join(SCRIPTS_DIR, 'firebase-repos.js'));
        const tieneFirebaseRepoBase = fs.existsSync(path.join(SCRIPTS_DIR, 'firebase-repo-base.js'));
        const tieneAuth = fs.existsSync(path.join(SCRIPTS_DIR, 'auth.js'));

        firebase.inicializacion = tieneFirebaseInit ? 100 : 0;
        firebase.repositorios = (tieneFirebaseRepos && tieneFirebaseRepoBase) ? 100 : 50;
        firebase.autenticacion = tieneAuth ? 100 : 0;

        firebase.total = Math.round(
            (firebase.inicializacion * 0.3 +
             firebase.repositorios * 0.4 +
             firebase.autenticacion * 0.3)
        );

        this.resultados.firebase = firebase;
        return firebase;
    }

    // Evaluar funcionalidades por módulo
    evaluarFuncionalidades() {
        const funcionalidades = {};
        let totalPorcentaje = 0;

        for (const [modulo, esperadas] of Object.entries(FUNCIONALIDADES_ESPERADAS)) {
            const scripts = this.buscarScriptsModulo(modulo);
            const contenidoScripts = scripts.map(s => {
                try {
                    return fs.readFileSync(s, 'utf8');
                } catch {
                    return '';
                }
            }).join(' ');

            let encontradas = 0;
            for (const func of esperadas) {
                // Buscar indicadores de funcionalidad
                const patrones = this.obtenerPatronesFuncionalidad(func);
                const encontrado = patrones.some(patron => 
                    contenidoScripts.toLowerCase().includes(patron.toLowerCase())
                );
                if (encontrado) encontradas++;
            }

            const porcentaje = Math.round((encontradas / esperadas.length) * 100);
            funcionalidades[modulo] = {
                esperadas: esperadas.length,
                encontradas,
                porcentaje
            };

            totalPorcentaje += porcentaje;
        }

        funcionalidades.promedio = Math.round(totalPorcentaje / Object.keys(FUNCIONALIDADES_ESPERADAS).length);
        this.resultados.funcionalidades = funcionalidades;
        return funcionalidades;
    }

    // Calcular evaluación general
    calcularGeneral() {
        const general = {
            estructura: this.resultados.estructura.porcentaje || 0,
            modulos: this.resultados.modulos.promedio || 0,
            codigo: this.resultados.codigo.total || 0,
            documentacion: this.resultados.documentacion.total || 0,
            testing: this.resultados.testing.total || 0,
            firebase: this.resultados.firebase.total || 0,
            funcionalidades: this.resultados.funcionalidades.promedio || 0
        };

        // Cálculo ponderado
        general.total = Math.round(
            general.estructura * 0.10 +
            general.modulos * 0.25 +
            general.codigo * 0.20 +
            general.documentacion * 0.10 +
            general.testing * 0.10 +
            general.firebase * 0.15 +
            general.funcionalidades * 0.10
        );

        this.resultados.general = general;
        return general;
    }

    // Métodos auxiliares
    contarArchivos(directorio, extension) {
        if (!fs.existsSync(directorio)) return 0;
        return this.obtenerArchivos(directorio, extension).length;
    }

    obtenerArchivos(directorio, extension) {
        if (!fs.existsSync(directorio)) return [];
        
        const archivos = [];
        const items = fs.readdirSync(directorio, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(directorio, item.name);
            if (item.isDirectory()) {
                archivos.push(...this.obtenerArchivos(fullPath, extension));
            } else if (item.isFile() && item.name.endsWith(extension)) {
                archivos.push(fullPath);
            }
        }

        return archivos;
    }

    buscarScriptsModulo(modulo) {
        const scripts = [];
        const moduloLower = modulo.toLowerCase();
        
        // Buscar en scripts principales
        const scriptPrincipal = path.join(SCRIPTS_DIR, `${moduloLower}.js`);
        if (fs.existsSync(scriptPrincipal)) {
            scripts.push(scriptPrincipal);
        }

        // Buscar en carpetas de módulos
        const moduloDir = path.join(SCRIPTS_DIR, moduloLower);
        if (fs.existsSync(moduloDir)) {
            scripts.push(...this.obtenerArchivos(moduloDir, '.js'));
        }

        return scripts;
    }

    obtenerPatronesFuncionalidad(funcionalidad) {
        const patrones = {
            'CRUD': ['create', 'read', 'update', 'delete', 'guardar', 'eliminar', 'editar'],
            'Exportación': ['export', 'exportar', 'excel', 'csv', 'pdf'],
            'PDF': ['pdf', 'generar', 'imprimir'],
            'Filtros': ['filter', 'filtro', 'filtrar', 'buscar'],
            'Búsqueda': ['search', 'buscar', 'find'],
            'Integración': ['integracion', 'integration', 'sincronizar'],
            'Sincronización': ['sync', 'sincronizar', 'sincronizacion'],
            'Dashboard': ['dashboard', 'panel', 'resumen'],
            'Gráficos': ['chart', 'grafico', 'graph'],
            'KPIs': ['kpi', 'indicador', 'metric']
        };

        return patrones[funcionalidad] || [funcionalidad.toLowerCase()];
    }

    // Generar reporte
    generarReporte() {
        const fecha = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let reporte = `# 📊 Evaluación del Proyecto ERP TitanFleet\n\n`;
        reporte += `**Fecha de Evaluación:** ${fecha}\n`;
        reporte += `**Versión:** 1.0.0\n\n`;
        reporte += `---\n\n`;

        // Resumen Ejecutivo
        reporte += `## 🎯 RESUMEN EJECUTIVO\n\n`;
        reporte += `### Puntuación General: **${this.resultados.general.total}%** `;
        
        if (this.resultados.general.total >= 90) {
            reporte += `✅ **EXCELENTE**\n\n`;
        } else if (this.resultados.general.total >= 80) {
            reporte += `✅ **MUY BUENO**\n\n`;
        } else if (this.resultados.general.total >= 70) {
            reporte += `⚠️ **BUENO**\n\n`;
        } else {
            reporte += `🔴 **MEJORABLE**\n\n`;
        }

        // Detalles por categoría
        reporte += `## 📈 EVALUACIÓN POR CATEGORÍA\n\n`;

        // Estructura
        reporte += `### 🏗️ Estructura del Proyecto: **${this.resultados.estructura.porcentaje}%**\n\n`;
        reporte += `| Componente | Cantidad | Estado |\n`;
        reporte += `|------------|----------|--------|\n`;
        reporte += `| Páginas HTML | ${this.resultados.estructura.paginasHTML} | ✅ |\n`;
        reporte += `| Scripts JavaScript | ${this.resultados.estructura.scriptsJS} | ✅ |\n`;
        reporte += `| Estilos CSS | ${this.resultados.estructura.estilosCSS} | ✅ |\n`;
        reporte += `| Documentación | ${this.resultados.estructura.documentacion} | ✅ |\n`;
        reporte += `| Tests | ${this.resultados.estructura.tests} | ✅ |\n\n`;

        // Módulos
        reporte += `### 📦 Módulos Principales: **${this.resultados.modulos.promedio}%**\n\n`;
        reporte += `| Módulo | HTML | Scripts | Porcentaje |\n`;
        reporte += `|--------|------|---------|------------|\n`;
        for (const [modulo, datos] of Object.entries(this.resultados.modulos)) {
            if (modulo !== 'promedio') {
                reporte += `| ${modulo} | ${datos.existeHTML ? '✅' : '❌'} | ${datos.scriptsCount} | ${datos.porcentaje}% |\n`;
            }
        }
        reporte += `\n`;

        // Código
        reporte += `### 💻 Calidad del Código: **${this.resultados.codigo.total}%**\n\n`;
        reporte += `| Aspecto | Porcentaje |\n`;
        reporte += `|---------|------------|\n`;
        reporte += `| Separación JS/HTML | ${this.resultados.codigo.separacionJSHTML}% |\n`;
        reporte += `| Consistencia | ${this.resultados.codigo.consistencia}% |\n`;
        reporte += `| Organización | ${this.resultados.codigo.organizacion}% |\n\n`;

        // Documentación
        reporte += `### 📚 Documentación: **${this.resultados.documentacion.total}%**\n\n`;
        reporte += `- Total de archivos: ${this.resultados.documentacion.cantidad}\n`;
        reporte += `- Guías: ${this.resultados.documentacion.tipos.guias || 0}\n`;
        reporte += `- Estados: ${this.resultados.documentacion.tipos.estado || 0}\n`;
        reporte += `- Otros: ${this.resultados.documentacion.tipos.otros || 0}\n\n`;

        // Testing
        reporte += `### 🧪 Testing: **${this.resultados.testing.total}%**\n\n`;
        reporte += `- Configuración: ${this.resultados.testing.configuracion}%\n`;
        reporte += `- Tests unitarios: ${this.resultados.testing.unitarios}\n\n`;

        // Firebase
        reporte += `### 🔥 Firebase: **${this.resultados.firebase.total}%**\n\n`;
        reporte += `- Inicialización: ${this.resultados.firebase.inicializacion}%\n`;
        reporte += `- Repositorios: ${this.resultados.firebase.repositorios}%\n`;
        reporte += `- Autenticación: ${this.resultados.firebase.autenticacion}%\n\n`;

        // Funcionalidades
        reporte += `### ⚙️ Funcionalidades: **${this.resultados.funcionalidades.promedio}%**\n\n`;
        reporte += `| Módulo | Esperadas | Encontradas | Porcentaje |\n`;
        reporte += `|--------|-----------|-------------|------------|\n`;
        for (const [modulo, datos] of Object.entries(this.resultados.funcionalidades)) {
            if (modulo !== 'promedio') {
                reporte += `| ${modulo} | ${datos.esperadas} | ${datos.encontradas} | ${datos.porcentaje}% |\n`;
            }
        }
        reporte += `\n`;

        // Resumen final
        reporte += `## 📊 RESUMEN FINAL\n\n`;
        reporte += `| Categoría | Porcentaje | Estado |\n`;
        reporte += `|-----------|------------|--------|\n`;
        reporte += `| Estructura | ${this.resultados.general.estructura}% | ${this.resultados.general.estructura >= 80 ? '✅' : '⚠️'} |\n`;
        reporte += `| Módulos | ${this.resultados.general.modulos}% | ${this.resultados.general.modulos >= 80 ? '✅' : '⚠️'} |\n`;
        reporte += `| Código | ${this.resultados.general.codigo}% | ${this.resultados.general.codigo >= 80 ? '✅' : '⚠️'} |\n`;
        reporte += `| Documentación | ${this.resultados.general.documentacion}% | ${this.resultados.general.documentacion >= 80 ? '✅' : '⚠️'} |\n`;
        reporte += `| Testing | ${this.resultados.general.testing}% | ${this.resultados.general.testing >= 80 ? '✅' : '⚠️'} |\n`;
        reporte += `| Firebase | ${this.resultados.general.firebase}% | ${this.resultados.general.firebase >= 80 ? '✅' : '⚠️'} |\n`;
        reporte += `| Funcionalidades | ${this.resultados.general.funcionalidades}% | ${this.resultados.general.funcionalidades >= 80 ? '✅' : '⚠️'} |\n`;
        reporte += `| **TOTAL** | **${this.resultados.general.total}%** | ${this.resultados.general.total >= 80 ? '✅' : '⚠️'} |\n\n`;

        reporte += `---\n\n`;
        reporte += `**Generado por:** Script de Evaluación Automatizado\n`;
        reporte += `**Última actualización:** ${fecha}\n`;

        return reporte;
    }

    // Ejecutar evaluación completa
    ejecutar() {
        console.log('🔍 Iniciando evaluación del proyecto...\n');

        this.evaluarEstructura();
        console.log('✅ Estructura evaluada');

        this.evaluarModulos();
        console.log('✅ Módulos evaluados');

        this.evaluarCodigo();
        console.log('✅ Código evaluado');

        this.evaluarDocumentacion();
        console.log('✅ Documentación evaluada');

        this.evaluarTesting();
        console.log('✅ Testing evaluado');

        this.evaluarFirebase();
        console.log('✅ Firebase evaluado');

        this.evaluarFuncionalidades();
        console.log('✅ Funcionalidades evaluadas');

        this.calcularGeneral();
        console.log('✅ Evaluación general calculada\n');

        const reporte = this.generarReporte();
        
        // Guardar reporte
        const reportePath = path.join(PROJECT_ROOT, 'EVALUACION_PROYECTO.md');
        fs.writeFileSync(reportePath, reporte, 'utf8');
        
        console.log(`📄 Reporte generado: ${reportePath}`);
        console.log(`\n🎯 Puntuación General: ${this.resultados.general.total}%\n`);

        return reporte;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const evaluador = new EvaluadorProyecto();
    evaluador.ejecutar();
}

module.exports = EvaluadorProyecto;

















