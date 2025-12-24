/**
 * Script para Organizar y Limpiar Documentos .md
 * 
 * Este script:
 * 1. Identifica documentos obsoletos
 * 2. Mueve documentos relevantes a docs/
 * 3. Archiva documentos completados a docs/archive/
 * 4. Elimina documentos completamente obsoletos
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const ARCHIVE_DIR = path.join(DOCS_DIR, 'archive');

// Documentos que deben mantenerse en la raíz (importantes)
const DOCUMENTOS_RAIZ_IMPORTANTES = [
    'README.md', // Si existe
    'LICENSE_SYSTEM_README.md',
    'AVISO_DE_PRIVACIDAD.md',
    'AVISO_PRIVACIDAD_CORTO.md',
    'PAYMENT_SETUP.md'
];

// Documentos que deben moverse a docs/ (relevantes pero no críticos)
const DOCUMENTOS_A_MOVER = [
    'ESTADO_FINAL_PROYECTO.md',
    'EVALUACION_PROYECTO.md',
    'ESTADO_GENERAL_PROYECTO.md',
    'GUIA_DEPLOY.md',
    'GUIA_ESTILO_CODIGO.md',
    'ESTRUCTURA_PROYECTO.md',
    'FUNCIONAMIENTO_REPORTES.md',
    'EXPLICACION_ASTERISCOS_REQUIRED.md',
    'FEEDBACK_COMPLETO_PROYECTO.md',
    'ANALISIS_COMPLETO_PROGRAMA.md',
    'RESUMEN_ANALISIS_PROGRAMA.md',
    'CHECKLIST_DEPLOY.md',
    'COMANDOS_DEPLOY.md',
    'TEMPLATE_ORDEN_CARGA_SCRIPTS.md',
    'INSTRUCCIONES_ACTUALIZAR_RUTAS.md',
    'CODIGO_LEGACY_IDENTIFICADO.md'
];

// Documentos obsoletos que deben archivarse (completados pero históricos)
const DOCUMENTOS_A_ARCHIVAR = [
    'FASE_3_LISTENERS_COMPLETADA.md',
    'FASE_4_DATA_PERSISTENCE_COMPLETADA.md',
    'FASE_5_REPOSITORIOS_COMPLETADA.md',
    'RESUMEN_FASE_2_COMPLETADA.md',
    'RESUMEN_FASE_3_COMPLETADA.md',
    'RESUMEN_FASE_5_COMPLETADA.md',
    'ESTADO_FASES_PROYECTO.md',
    'PROGRESO_SEPARACION_JS_HTML.md', // Hay uno FINAL
    'PROGRESO_SEPARACION_JS_HTML_FINAL.md',
    'ACTUALIZACION_SEPARACION_JS_HTML.md',
    'RESUMEN_ACTUALIZACION_FINAL.md',
    'RESUMEN_REORGANIZACION.md',
    'REORGANIZACION_COMPLETADA.md',
    'ESTANDARIZACION_SCRIPTS_COMPLETA.md',
    'EJECUCION_LINT_FORMAT_COMPLETADA.md',
    'MEJORAS_CONSISTENCIA_COMPLETADAS.md',
    'PROGRESO_CONSISTENCIA_CODIGO.md',
    'RESUMEN_MEJORAS_APLICADAS.md',
    'RESUMEN_CORRECCIONES_FIREBASE.md',
    'REVISION_COMPLETA_MODULOS_FIREBASE.md',
    'CORRECCIONES_CRITICAS_APLICADAS.md',
    'CORRECCIONES_PROBLEMAS_CRITICOS.md',
    'SOLUCION_GENERACION_MULTIPLE.md',
    'SOLUCION_CONTADOR_REGISTRO.md',
    'SOLUCION_USUARIO_MULTIPLE.md',
    'DATA_BINDING_IMPLEMENTADO.md',
    'SISTEMA_SIMPLIFICADO_IMPLEMENTADO.md',
    'ACTUALIZACION_COMPLETA_PROYECTO.md',
    'ESTADO_PROYECTO_ACTUAL.md', // Hay ESTADO_FINAL_PROYECTO.md
    'ESTADO_PROYECTO_CON_PORCENTAJES.md', // Hay EVALUACION_PROYECTO.md
    'EVALUACION_ESTADO_ACTUAL.md', // Hay EVALUACION_PROYECTO.md
    'MEJORAS_LISTENER_CXC.md',
    'SOLUCION_404_ARCHIVOS_JS.md',
    'SOLUCION_FINAL_MIME_TYPE.md',
    'SOLUCION_ERRORES_MIME_TYPE.md',
    'SOLUCION_404_DEPLOY.md',
    'SOLUCION_ERRORES_DEPLOY.md',
    'SOLUCION_DEPLOY_COMPLETA.md'
];

// Documentos que deben eliminarse (completamente obsoletos o duplicados)
const DOCUMENTOS_A_ELIMINAR = [
    // Estos son muy antiguos o completamente reemplazados
];

function organizarDocumentos() {
    console.log('📁 Organizando documentos .md...\n');

    const resultados = {
        movidos: [],
        archivados: [],
        eliminados: [],
        errores: []
    };

    // Asegurar que las carpetas existan
    if (!fs.existsSync(DOCS_DIR)) {
        fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    if (!fs.existsSync(ARCHIVE_DIR)) {
        fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    // 1. Mover documentos relevantes a docs/
    console.log('📦 Moviendo documentos relevantes a docs/...');
    DOCUMENTOS_A_MOVER.forEach(archivo => {
        const origen = path.join(PROJECT_ROOT, archivo);
        const destino = path.join(DOCS_DIR, archivo);
        
        if (fs.existsSync(origen)) {
            try {
                // Verificar si ya existe en destino
                if (fs.existsSync(destino)) {
                    console.log(`  ⚠️ ${archivo} ya existe en docs/, omitiendo...`);
                    return;
                }
                
                fs.renameSync(origen, destino);
                resultados.movidos.push(archivo);
                console.log(`  ✅ Movido: ${archivo} → docs/`);
            } catch (error) {
                resultados.errores.push({ archivo, accion: 'mover', error: error.message });
                console.log(`  ❌ Error moviendo ${archivo}: ${error.message}`);
            }
        } else {
            console.log(`  ℹ️ ${archivo} no existe, omitiendo...`);
        }
    });

    // 2. Archivar documentos completados
    console.log('\n📚 Archivando documentos completados...');
    DOCUMENTOS_A_ARCHIVAR.forEach(archivo => {
        const origen = path.join(PROJECT_ROOT, archivo);
        const destino = path.join(ARCHIVE_DIR, archivo);
        
        if (fs.existsSync(origen)) {
            try {
                // Verificar si ya existe en archive
                if (fs.existsSync(destino)) {
                    console.log(`  ⚠️ ${archivo} ya existe en archive/, eliminando de raíz...`);
                    fs.unlinkSync(origen);
                    resultados.eliminados.push(archivo + ' (duplicado en archive)');
                    return;
                }
                
                fs.renameSync(origen, destino);
                resultados.archivados.push(archivo);
                console.log(`  ✅ Archivado: ${archivo} → docs/archive/`);
            } catch (error) {
                resultados.errores.push({ archivo, accion: 'archivar', error: error.message });
                console.log(`  ❌ Error archivando ${archivo}: ${error.message}`);
            }
        } else {
            console.log(`  ℹ️ ${archivo} no existe, omitiendo...`);
        }
    });

    // 3. Eliminar documentos completamente obsoletos
    console.log('\n🗑️ Eliminando documentos obsoletos...');
    DOCUMENTOS_A_ELIMINAR.forEach(archivo => {
        const ruta = path.join(PROJECT_ROOT, archivo);
        
        if (fs.existsSync(ruta)) {
            try {
                fs.unlinkSync(ruta);
                resultados.eliminados.push(archivo);
                console.log(`  ✅ Eliminado: ${archivo}`);
            } catch (error) {
                resultados.errores.push({ archivo, accion: 'eliminar', error: error.message });
                console.log(`  ❌ Error eliminando ${archivo}: ${error.message}`);
            }
        }
    });

    // 4. Resumen
    console.log('\n📊 Resumen:');
    console.log(`  ✅ Movidos a docs/: ${resultados.movidos.length}`);
    console.log(`  📚 Archivados: ${resultados.archivados.length}`);
    console.log(`  🗑️ Eliminados: ${resultados.eliminados.length}`);
    console.log(`  ❌ Errores: ${resultados.errores.length}`);

    if (resultados.errores.length > 0) {
        console.log('\n⚠️ Errores encontrados:');
        resultados.errores.forEach(err => {
            console.log(`  - ${err.archivo}: ${err.error}`);
        });
    }

    // 5. Listar documentos que quedan en la raíz
    console.log('\n📋 Documentos que permanecen en la raíz:');
    const archivosRaiz = fs.readdirSync(PROJECT_ROOT)
        .filter(f => f.endsWith('.md') && fs.statSync(path.join(PROJECT_ROOT, f)).isFile());
    
    archivosRaiz.forEach(archivo => {
        if (!DOCUMENTOS_RAIZ_IMPORTANTES.includes(archivo)) {
            console.log(`  ⚠️ ${archivo} - Considerar mover o archivar`);
        } else {
            console.log(`  ✅ ${archivo} - Importante, se mantiene`);
        }
    });

    return resultados;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const resultados = organizarDocumentos();
    
    console.log('\n✅ Organización completada!');
    console.log('\n📝 Próximos pasos:');
    console.log('  1. Revisar los documentos movidos a docs/');
    console.log('  2. Verificar que los documentos archivados están en docs/archive/');
    console.log('  3. Revisar los documentos que quedaron en la raíz');
}

module.exports = { organizarDocumentos };

















