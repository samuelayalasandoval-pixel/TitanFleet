/**
 * Script para ejecutar tests y mostrar resultados
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Ejecutando Tests del Proyecto\n');
console.log('='.repeat(60));

// Verificar que las dependencias estén instaladas
if (!fs.existsSync('node_modules/vitest')) {
  console.log('📦 Instalando dependencias...\n');
  try {
    execSync('npm install', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error instalando dependencias:', error.message);
    process.exit(1);
  }
}

// Ejecutar tests unitarios
console.log('\n📋 Ejecutando Tests Unitarios...\n');
try {
  const output = execSync('npx vitest run --reporter=verbose', {
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(output);
} catch (error) {
  console.log('Salida del comando:', error.stdout || error.stderr);
  if (error.status !== 0) {
    console.error('\n❌ Algunos tests fallaron');
    process.exit(1);
  }
}

console.log('\n✅ Tests completados\n');
