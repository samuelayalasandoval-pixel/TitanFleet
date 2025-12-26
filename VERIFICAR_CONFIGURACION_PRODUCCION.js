/**
 * Script para Verificar Configuración de Producción
 * 
 * Este script verifica que todo esté configurado correctamente para producción
 * 
 * Uso: node VERIFICAR_CONFIGURACION_PRODUCCION.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de producción...\n');

let errores = [];
let advertencias = [];
let exitoso = [];

// 1. Verificar stripe-config.js
console.log('📝 Verificando stripe-config.js...');
const stripeConfigPath = path.join(__dirname, 'assets', 'scripts', 'stripe-config.js');

if (fs.existsSync(stripeConfigPath)) {
  const contenido = fs.readFileSync(stripeConfigPath, 'utf8');
  
  // Verificar publishableKey
  if (contenido.includes('pk_live_')) {
    exitoso.push('✅ Publishable Key está en modo LIVE');
  } else if (contenido.includes('pk_test_')) {
    advertencias.push('⚠️ Publishable Key está en modo TEST - Cambia a LIVE para producción');
  } else {
    errores.push('❌ Publishable Key no encontrada o formato inválido');
  }
  
  // Verificar backendUrl
  if (contenido.includes('localhost:3000')) {
    advertencias.push('⚠️ backendUrl apunta a localhost - Debe apuntar a tu servidor de producción');
  } else if (contenido.includes('https://')) {
    exitoso.push('✅ backendUrl apunta a HTTPS (producción)');
  } else {
    errores.push('❌ backendUrl no está configurada correctamente');
  }
  
  // Verificar mode
  if (contenido.includes("mode: 'live'")) {
    exitoso.push('✅ Modo configurado como LIVE');
  } else if (contenido.includes("mode: 'test'")) {
    advertencias.push('⚠️ Modo está en TEST - Cambia a LIVE para producción');
  } else {
    advertencias.push('⚠️ Modo no encontrado o no está configurado');
  }
} else {
  errores.push('❌ No se encontró stripe-config.js');
}

// 2. Verificar backend-example
console.log('\n📦 Verificando backend-example...');
const backendPath = path.join(__dirname, 'backend-example');

if (fs.existsSync(backendPath)) {
  exitoso.push('✅ Directorio backend-example existe');
  
  // Verificar server.js
  const serverPath = path.join(backendPath, 'server.js');
  if (fs.existsSync(serverPath)) {
    exitoso.push('✅ server.js existe');
  } else {
    errores.push('❌ server.js no encontrado en backend-example');
  }
  
  // Verificar package.json
  const packagePath = path.join(backendPath, 'package.json');
  if (fs.existsSync(packagePath)) {
    exitoso.push('✅ package.json existe');
    
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageContent.scripts && packageContent.scripts.start) {
      exitoso.push('✅ Script "start" configurado en package.json');
    } else {
      errores.push('❌ Script "start" no encontrado en package.json');
    }
  } else {
    errores.push('❌ package.json no encontrado en backend-example');
  }
  
  // Verificar .env.example
  const envExamplePath = path.join(backendPath, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    exitoso.push('✅ .env.example existe');
  } else {
    advertencias.push('⚠️ .env.example no encontrado (opcional pero recomendado)');
  }
  
  // Verificar .gitignore
  const gitignorePath = path.join(backendPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignoreContent.includes('.env')) {
      exitoso.push('✅ .env está en .gitignore (seguro)');
    } else {
      advertencias.push('⚠️ .env no está en .gitignore - Agrégalo para seguridad');
    }
  }
} else {
  errores.push('❌ Directorio backend-example no encontrado');
}

// 3. Verificar documentación
console.log('\n📚 Verificando documentación...');
const guias = [
  'GUIA_DEPLOY_BACKEND_RAILWAY.md',
  'GUIA_DEPLOY_BACKEND_HEROKU.md',
  'RESUMEN_DEPLOY_BACKEND.md'
];

guias.forEach(guia => {
  const guiaPath = path.join(__dirname, guia);
  if (fs.existsSync(guiaPath)) {
    exitoso.push(`✅ ${guia} existe`);
  } else {
    advertencias.push(`⚠️ ${guia} no encontrado`);
  }
});

// 4. Verificar aviso de privacidad
console.log('\n🔒 Verificando aviso de privacidad...');
const avisoPath = path.join(__dirname, 'AVISO_DE_PRIVACIDAD.md');
if (fs.existsSync(avisoPath)) {
  exitoso.push('✅ AVISO_DE_PRIVACIDAD.md existe');
} else {
  advertencias.push('⚠️ AVISO_DE_PRIVACIDAD.md no encontrado');
}

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE VERIFICACIÓN');
console.log('='.repeat(50));

if (exitoso.length > 0) {
  console.log('\n✅ ÉXITOS:');
  exitoso.forEach(item => console.log(`   ${item}`));
}

if (advertencias.length > 0) {
  console.log('\n⚠️ ADVERTENCIAS:');
  advertencias.forEach(item => console.log(`   ${item}`));
}

if (errores.length > 0) {
  console.log('\n❌ ERRORES:');
  errores.forEach(item => console.log(`   ${item}`));
}

console.log('\n' + '='.repeat(50));

// Resultado final
if (errores.length === 0 && advertencias.length === 0) {
  console.log('🎉 ¡Todo está configurado correctamente para producción!');
  process.exit(0);
} else if (errores.length === 0) {
  console.log('⚠️ Hay algunas advertencias, pero puedes proceder.');
  console.log('   Revisa las advertencias antes de hacer deploy a producción.');
  process.exit(0);
} else {
  console.log('❌ Hay errores que deben corregirse antes de producción.');
  console.log('   Por favor, corrige los errores antes de continuar.');
  process.exit(1);
}

