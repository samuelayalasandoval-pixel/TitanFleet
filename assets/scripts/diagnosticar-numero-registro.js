/**
 * Script de Diagnóstico y Corrección del Número de Registro
 *
 * Este script ayuda a diagnosticar por qué el sistema generó 2500002 en lugar de 2500001
 * y proporciona herramientas para corregirlo.
 */

(function () {
  'use strict';

  window.diagnosticarNumeroRegistro = {
    /**
     * Diagnosticar el problema del número de registro
     */
    async diagnosticar() {
      console.log('🔍 Iniciando diagnóstico del número de registro...\n');

      const resultados = {
        registrosEncontrados: [],
        maxNumber: 0,
        siguienteNumero: null,
        problemaDetectado: null,
        recomendacion: null,
        registro2500002Encontrado: false,
        ubicacion2500002: []
      };

      try {
        // 1. Verificar Firebase - Logística
        if (!window.firebaseRepos || !window.firebaseRepos.logistica) {
          console.error('❌ Repositorio de logística no disponible');
          resultados.problemaDetectado = 'Repositorio no disponible';
          resultados.recomendacion = 'Espera a que Firebase se inicialice completamente';
          return resultados;
        }

        const repo = window.firebaseRepos.logistica;
        await repo.init();

        // 2. Obtener todos los registros del año actual
        const currentYear = new Date().getFullYear();
        const yearPrefix = currentYear.toString().slice(-2);
        console.log(`📅 Buscando registros del año ${currentYear} (prefijo: ${yearPrefix})`);

        const allRegistros = await repo.getAll();
        console.log(`📊 Total de registros encontrados en logística: ${allRegistros.length}`);

        // 3. Buscar específicamente 2500002 en logística
        const registro2500002Logistica = await repo.getRegistro('2500002');
        if (registro2500002Logistica) {
          resultados.registro2500002Encontrado = true;
          resultados.ubicacion2500002.push('logistica');
          console.log('🔍 Registro 2500002 encontrado en LOGÍSTICA');
        }

        // 4. Buscar en otras colecciones
        const colecciones = [
          'trafico',
          'facturacion',
          'cxc',
          'cxp',
          'tesoreria',
          'diesel',
          'mantenimiento',
          'inventario'
        ];
        for (const coleccion of colecciones) {
          if (window.firebaseRepos && window.firebaseRepos[coleccion]) {
            try {
              const repoColeccion = window.firebaseRepos[coleccion];
              await repoColeccion.init();
              const registro = await repoColeccion.getRegistro('2500002');
              if (registro) {
                resultados.registro2500002Encontrado = true;
                resultados.ubicacion2500002.push(coleccion);
                console.log(`🔍 Registro 2500002 encontrado en ${coleccion.toUpperCase()}`);
              }
            } catch (e) {
              // Ignorar errores de colecciones que no tienen el método
            }
          }
        }

        // 5. Buscar en localStorage
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        const registrosLocalStorage = sharedData.registros || {};
        if (registrosLocalStorage['2500002']) {
          resultados.registro2500002Encontrado = true;
          resultados.ubicacion2500002.push('localStorage');
          console.log('🔍 Registro 2500002 encontrado en localStorage');
        }

        // 6. Filtrar registros del año actual en logística
        const registrosDelAño = allRegistros.filter(r => {
          const numReg = r.numeroRegistro || r.id || r.registroId;
          return (
            numReg &&
            typeof numReg === 'string' &&
            numReg.startsWith(yearPrefix) &&
            numReg.length === 7
          );
        });

        console.log(`📅 Registros del año ${currentYear} en logística: ${registrosDelAño.length}`);

        // 7. Extraer números y encontrar máximo
        const numeros = [];
        registrosDelAño.forEach(r => {
          const numReg = r.numeroRegistro || r.id || r.registroId;
          const numberPart = numReg.slice(2); // Obtener últimos 5 dígitos
          const num = parseInt(numberPart, 10) || 0;
          numeros.push(num);

          resultados.registrosEncontrados.push({
            numeroCompleto: numReg,
            numero: num,
            datos: r
          });
        });

        if (numeros.length > 0) {
          resultados.maxNumber = Math.max(...numeros);
          resultados.siguienteNumero = resultados.maxNumber + 1;
        } else {
          resultados.maxNumber = 0;
          resultados.siguienteNumero = 1;
        }

        // 8. Detectar problemas
        console.log('\n📊 Análisis:');
        console.log(`   - Registros encontrados en logística: ${registrosDelAño.length}`);
        console.log(`   - Números: [${numeros.join(', ')}]`);
        console.log(`   - Número máximo: ${resultados.maxNumber}`);
        console.log(
          `   - Siguiente número: ${resultados.siguienteNumero} (${yearPrefix}${String(resultados.siguienteNumero).padStart(5, '0')})`
        );
        console.log(`   - ¿Existe 2500002? ${resultados.registro2500002Encontrado ? 'SÍ' : 'NO'}`);
        if (resultados.ubicacion2500002.length > 0) {
          console.log(`   - Ubicación de 2500002: ${resultados.ubicacion2500002.join(', ')}`);
        }

        // Verificar si falta el 2500001
        const tiene2500001 = numeros.includes(1);
        const tiene2500002 = numeros.includes(2);

        if (!tiene2500001 && tiene2500002) {
          resultados.problemaDetectado =
            'Falta el registro 2500001 pero existe 2500002 en logística';
          resultados.recomendacion =
            'El registro 2500001 fue eliminado o nunca se creó. Se recomienda eliminar 2500002 y regenerar, o renombrar 2500002 a 2500001.';
          console.log('\n⚠️ PROBLEMA DETECTADO:');
          console.log('   - ❌ No existe registro 2500001 en logística');
          console.log('   - ✅ Existe registro 2500002 en logística');
          console.log(
            '   - 🔧 Solución: Eliminar 2500002 y regenerar, o renombrar 2500002 a 2500001'
          );
        } else if (resultados.registro2500002Encontrado && !tiene2500002) {
          resultados.problemaDetectado = 'Registro 2500002 existe pero no en logística';
          resultados.recomendacion = `El registro 2500002 existe en: ${resultados.ubicacion2500002.join(', ')}. Esto puede estar causando confusión. Se recomienda limpiar estos registros.`;
          console.log('\n⚠️ PROBLEMA DETECTADO:');
          console.log(
            `   - ✅ Existe registro 2500002 en: ${resultados.ubicacion2500002.join(', ')}`
          );
          console.log('   - ❌ Pero NO existe en logística');
          console.log('   - 🔧 Solución: Limpiar registros 2500002 de todas las ubicaciones');
        } else if (tiene2500001 && tiene2500002) {
          resultados.problemaDetectado = 'Ambos registros existen';
          resultados.recomendacion = `Todo está correcto. El siguiente número debería ser ${resultados.maxNumber + 1}`;
          console.log('\n✅ Estado: Ambos registros existen, todo está correcto');
        } else if (!tiene2500001 && !tiene2500002 && !resultados.registro2500002Encontrado) {
          resultados.problemaDetectado = 'No hay registros del año actual';
          resultados.recomendacion = 'El siguiente número debería ser 2500001';
          console.log('\n✅ Estado: No hay registros, el siguiente será 2500001');
        } else {
          resultados.problemaDetectado = 'Estado inesperado';
          resultados.recomendacion = 'Revisar manualmente los registros';
          console.log('\n⚠️ Estado inesperado detectado');
        }

        return resultados;
      } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
        resultados.problemaDetectado = `Error: ${error.message}`;
        return resultados;
      }
    },

    /**
     * Limpiar registro 2500002 de todas las ubicaciones
     */
    async limpiar2500002Completo() {
      console.log('🔧 Limpiando registro 2500002 de todas las ubicaciones...\n');

      const ubicaciones = [];
      const errores = [];

      try {
        // 1. Limpiar de logística
        if (window.firebaseRepos && window.firebaseRepos.logistica) {
          try {
            const repo = window.firebaseRepos.logistica;
            await repo.init();
            await repo.delete('2500002');
            ubicaciones.push('logistica (Firebase)');
            console.log('✅ Eliminado de logística (Firebase)');
          } catch (e) {
            if (e.code !== 'not-found' && !e.message?.includes('not found')) {
              errores.push(`logistica: ${e.message}`);
            }
          }
        }

        // 2. Limpiar de otras colecciones
        const colecciones = [
          'trafico',
          'facturacion',
          'cxc',
          'cxp',
          'tesoreria',
          'diesel',
          'mantenimiento',
          'inventario'
        ];
        for (const coleccion of colecciones) {
          if (window.firebaseRepos && window.firebaseRepos[coleccion]) {
            try {
              const repo = window.firebaseRepos[coleccion];
              await repo.init();
              await repo.delete('2500002');
              ubicaciones.push(`${coleccion} (Firebase)`);
              console.log(`✅ Eliminado de ${coleccion} (Firebase)`);
            } catch (e) {
              if (e.code !== 'not-found' && !e.message?.includes('not found')) {
                errores.push(`${coleccion}: ${e.message}`);
              }
            }
          }
        }

        // 3. Limpiar de localStorage
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (sharedData.registros && sharedData.registros['2500002']) {
          delete sharedData.registros['2500002'];
          localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
          ubicaciones.push('localStorage');
          console.log('✅ Eliminado de localStorage');
        }

        // 4. Limpiar número activo si es 2500002
        const activeNumber = localStorage.getItem('activeRegistrationNumber');
        if (activeNumber === '2500002') {
          localStorage.removeItem('activeRegistrationNumber');
          console.log('✅ Número activo limpiado');
        }

        console.log('\n📊 Resumen:');
        console.log(
          `   - Ubicaciones limpiadas: ${ubicaciones.length > 0 ? ubicaciones.join(', ') : 'Ninguna (no existía)'}`
        );
        if (errores.length > 0) {
          console.log(`   - Errores: ${errores.join(', ')}`);
        }
        console.log('\n✅ Limpieza completada. Recarga la página y genera un nuevo número.');
        console.log('   El sistema ahora debería generar 2500001');

        return { exito: true, ubicaciones, errores };
      } catch (error) {
        console.error('❌ Error limpiando:', error);
        return { exito: false, error: error.message };
      }
    },

    /**
     * Corregir el problema eliminando 2500002 y regenerando
     */
    async corregirEliminando2500002() {
      return this.limpiar2500002Completo();
    },

    /**
     * Corregir renombrando 2500002 a 2500001
     */
    async corregirRenombrando() {
      console.log('🔧 Corrigiendo: Renombrando 2500002 a 2500001...\n');

      try {
        if (!window.firebaseRepos || !window.firebaseRepos.logistica) {
          throw new Error('Repositorio de logística no disponible');
        }

        const repo = window.firebaseRepos.logistica;
        await repo.init();

        // 1. Obtener datos del registro 2500002
        const registro2500002 = await repo.getRegistro('2500002');
        if (!registro2500002) {
          throw new Error('El registro 2500002 no existe en logística');
        }

        console.log('📋 Datos del registro 2500002:', registro2500002);

        // 2. Crear nuevo registro con ID 2500001
        registro2500002.numeroRegistro = '2500001';
        await repo.saveRegistro('2500001', registro2500002);
        console.log('✅ Registro creado como 2500001');

        // 3. Eliminar el registro 2500002 de todas las ubicaciones
        await this.limpiar2500002Completo();

        // 4. Actualizar localStorage
        const sharedData = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        if (!sharedData.registros) {
          sharedData.registros = {};
        }
        sharedData.registros['2500001'] = registro2500002;
        localStorage.setItem('erp_shared_data', JSON.stringify(sharedData));
        console.log('✅ localStorage actualizado');

        // 5. Actualizar número activo
        localStorage.setItem('activeRegistrationNumber', '2500001');
        console.log('✅ Número activo actualizado a 2500001');

        console.log('\n✅ Renombrado completado. Recarga la página.');
        return true;
      } catch (error) {
        console.error('❌ Error renombrando:', error);
        return false;
      }
    }
  };

  console.log('✅ Script de diagnóstico cargado. Usa:');
  console.log('   - window.diagnosticarNumeroRegistro.diagnosticar() - Diagnosticar el problema');
  console.log(
    '   - window.diagnosticarNumeroRegistro.limpiar2500002Completo() - Limpiar 2500002 de todas las ubicaciones'
  );
  console.log(
    '   - window.diagnosticarNumeroRegistro.corregirRenombrando() - Renombrar 2500002 a 2500001'
  );
})();

