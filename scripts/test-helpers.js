/**
 * Scripts de ayuda para testing
 * Ejecutar con: node scripts/test-helpers.js [comando]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const comandos = {
  'check': () => {
    console.log('🔍 Verificando configuración de testing...\n');
    
    // Verificar dependencias
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requeridas = [
      'vitest',
      '@playwright/test',
      '@vitest/coverage-v8'
    ];
    
    console.log('📦 Dependencias:');
    requeridas.forEach(dep => {
      const existe = deps[dep];
      console.log(`  ${existe ? '✅' : '❌'} ${dep}`);
    });
    
    // Verificar archivos de configuración
    console.log('\n📄 Archivos de configuración:');
    const configs = [
      'vitest.config.js',
      'playwright.config.js',
      'tests/setup.js'
    ];
    
    configs.forEach(config => {
      const existe = fs.existsSync(config);
      console.log(`  ${existe ? '✅' : '❌'} ${config}`);
    });
    
    // Verificar estructura de tests
    console.log('\n🧪 Estructura de tests:');
    const testDirs = [
      'tests/unit',
      'tests/integration',
      'tests/e2e'
    ];
    
    testDirs.forEach(dir => {
      const existe = fs.existsSync(dir);
      const archivos = existe ? fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.spec.js')) : [];
      console.log(`  ${existe ? '✅' : '❌'} ${dir} (${archivos.length} archivos)`);
    });
    
    // Verificar CI/CD
    console.log('\n🚀 CI/CD:');
    const ciExiste = fs.existsSync('.github/workflows/ci.yml');
    console.log(`  ${ciExiste ? '✅' : '❌'} GitHub Actions configurado`);
    
    console.log('\n✨ Verificación completada!\n');
  },
  
  'stats': () => {
    console.log('📊 Estadísticas de tests...\n');
    
    const contarTests = (dir) => {
      if (!fs.existsSync(dir)) return 0;
      const archivos = fs.readdirSync(dir, { recursive: true });
      return archivos.filter(f => f.endsWith('.test.js') || f.endsWith('.spec.js')).length;
    };
    
    const unitarios = contarTests('tests/unit');
    const integracion = contarTests('tests/integration');
    const e2e = contarTests('tests/e2e');
    const total = unitarios + integracion + e2e;
    
    console.log(`Tests Unitarios:     ${unitarios}`);
    console.log(`Tests Integración:   ${integracion}`);
    console.log(`Tests E2E:           ${e2e}`);
    console.log(`─────────────────────────`);
    console.log(`Total:               ${total}\n`);
  },
  
  'help': () => {
    console.log(`
🧪 Scripts de Ayuda para Testing

Comandos disponibles:
  node scripts/test-helpers.js check    Verificar configuración
  node scripts/test-helpers.js stats    Mostrar estadísticas
  node scripts/test-helpers.js help     Mostrar esta ayuda

Comandos npm:
  npm run test              Ejecutar tests unitarios
  npm run test:watch        Modo watch
  npm run test:coverage     Con cobertura
  npm run test:e2e          Tests E2E
  npm run test:all          Todos los tests
    `);
  }
};

const comando = process.argv[2] || 'help';

if (comandos[comando]) {
  comandos[comando]();
} else {
  console.log(`❌ Comando desconocido: ${comando}`);
  comandos.help();
}
