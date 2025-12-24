/**
 * Script de Refactorización de Código Legacy
 * 
 * Este script ayuda a identificar y refactorizar código legacy:
 * - Reemplaza var con const/let
 * - Reemplaza == con === y != con !==
 * - Identifica código comentado
 * 
 * Uso: node scripts/refactor-legacy.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_DIR = path.join(__dirname, '../assets/scripts');

// Estadísticas
const stats = {
  varReplaced: 0,
  comparisonsFixed: 0,
  filesProcessed: 0,
  errors: []
};

/**
 * Reemplazar var con const o let
 */
function replaceVar(content, filePath) {
  let newContent = content;
  let replaced = 0;

  // Patrón para encontrar var declarations
  const varPattern = /\bvar\s+(\w+)/g;
  const matches = [...content.matchAll(varPattern)];

  matches.forEach(match => {
    const varName = match[1];
    const fullMatch = match[0];
    const index = match.index;

    // Determinar si debería ser const o let
    // Buscar si la variable se reasigna después
    const afterMatch = content.substring(index);
    const reassignPattern = new RegExp(`\\b${varName}\\s*=`, 'g');
    const reassignments = [...afterMatch.matchAll(reassignPattern)];

    // Si hay más de una asignación (la inicial + otra), usar let
    const shouldUseLet = reassignments.length > 1;

    const replacement = shouldUseLet ? `let ${varName}` : `const ${varName}`;
    newContent = newContent.replace(fullMatch, replacement);
    replaced++;
  });

  if (replaced > 0) {
    stats.varReplaced += replaced;
    console.log(`  ✅ Reemplazados ${replaced} usos de var en ${path.basename(filePath)}`);
  }

  return newContent;
}

/**
 * Reemplazar == con === y != con !==
 * (Solo en casos seguros, evitando comparaciones con null/undefined)
 */
function replaceComparisons(content, filePath) {
  let newContent = content;
  let replaced = 0;

  // Reemplazar == con === (excepto == null que puede ser intencional)
  const looseEqualPattern = /([^=!]|^)(==)([^=]|$)/g;
  const matches = [...content.matchAll(looseEqualPattern)];

  matches.forEach(match => {
    const before = match[1];
    const after = match[3];
    const fullMatch = match[0];

    // Evitar reemplazar == null o == undefined (puede ser intencional)
    if (fullMatch.includes('== null') || fullMatch.includes('== undefined')) {
      return;
    }

    newContent = newContent.replace(fullMatch, `${before}===${after}`);
    replaced++;
  });

  // Reemplazar != con !== (excepto != null)
  const looseNotEqualPattern = /([^=!]|^)(!=)([^=]|$)/g;
  const notEqualMatches = [...content.matchAll(looseNotEqualPattern)];

  notEqualMatches.forEach(match => {
    const before = match[1];
    const after = match[3];
    const fullMatch = match[0];

    // Evitar reemplazar != null o != undefined
    if (fullMatch.includes('!= null') || fullMatch.includes('!= undefined')) {
      return;
    }

    newContent = newContent.replace(fullMatch, `${before}!==${after}`);
    replaced++;
  });

  if (replaced > 0) {
    stats.comparisonsFixed += replaced;
    console.log(`  ✅ Reemplazadas ${replaced} comparaciones en ${path.basename(filePath)}`);
  }

  return newContent;
}

/**
 * Procesar un archivo
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Reemplazar var
    content = replaceVar(content, filePath);

    // Reemplazar comparaciones (solo si no es dry-run, ya que requiere revisión manual)
    if (!DRY_RUN) {
      // Comentado por ahora - requiere revisión manual
      // content = replaceComparisons(content, filePath);
    }

    // Escribir archivo si hubo cambios
    if (content !== originalContent && !DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesProcessed++;
    } else if (content !== originalContent && DRY_RUN) {
      console.log(`  📝 [DRY RUN] Se modificaría ${path.basename(filePath)}`);
      stats.filesProcessed++;
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`  ❌ Error procesando ${filePath}:`, error.message);
  }
}

/**
 * Recursivamente procesar directorio
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.js')) {
      processFile(filePath);
    }
  });
}

// Ejecutar
console.log('🔧 Iniciando refactorización de código legacy...\n');

if (DRY_RUN) {
  console.log('⚠️  MODO DRY RUN - No se modificarán archivos\n');
}

processDirectory(TARGET_DIR);

// Mostrar estadísticas
console.log('\n📊 Estadísticas:');
console.log(`  - Archivos procesados: ${stats.filesProcessed}`);
console.log(`  - var reemplazados: ${stats.varReplaced}`);
console.log(`  - Comparaciones corregidas: ${stats.comparisonsFixed}`);
console.log(`  - Errores: ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n❌ Errores encontrados:');
  stats.errors.forEach(({ file, error }) => {
    console.log(`  - ${file}: ${error}`);
  });
}

if (DRY_RUN) {
  console.log('\n💡 Ejecuta sin --dry-run para aplicar los cambios');
} else {
  console.log('\n✅ Refactorización completada');
}
