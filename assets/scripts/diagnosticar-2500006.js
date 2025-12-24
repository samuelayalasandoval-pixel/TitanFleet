/**
 * Script de diagnóstico y auto-corrección para números de registro
 *
 * Este script detecta y corrige automáticamente discrepancias entre
 * los registros reales en Firebase y los números almacenados en localStorage/RegistrationNumberBinding
 */

window.diagnosticar2500006 = {
  /**
   * Diagnóstico completo del problema
   * IMPORTANTE: Siempre consulta Firebase directamente (fuente de verdad)
   */
  async diagnosticar() {
    console.log('🔍 Iniciando diagnóstico del problema de numeración...\n');
    console.log('📌 Firebase es la fuente de verdad - consultando directamente...\n');

    const resultados = {
      registrosEncontrados: [],
      numerosEncontrados: [],
      maxNumber: 0,
      siguienteNumeroEsperado: null,
      siguienteNumeroActual: null,
      problemaDetectado: null,
      recomendacion: null
    };

    try {
      // 1. Verificar si Firebase está disponible (REQUERIDO - es la fuente de verdad)
      if (!window.firebaseDb || !window.fs) {
        console.error(
          '❌ Firebase no está disponible - no se puede diagnosticar sin la fuente de verdad'
        );
        resultados.problemaDetectado = 'Firebase no está disponible';
        resultados.recomendacion =
          'Esperar a que Firebase se inicialice completamente. Firebase es la fuente de verdad.';
        return resultados;
      }

      console.log('✅ Firebase está disponible (fuente de verdad)\n');

      // 2. Obtener todos los registros de logística desde Firebase (fuente de verdad)
      console.log('📊 Obteniendo registros de logística desde Firebase (fuente de verdad)...');
      const collectionRef = window.fs.collection(window.firebaseDb, 'logistica');
      const snapshot = await window.fs.getDocs(collectionRef);

      console.log(`📋 Total de documentos en logística: ${snapshot.docs.length}\n`);

      // 3. Analizar cada registro
      const currentYear = new Date().getFullYear();
      const yearPrefix = currentYear.toString().slice(-2); // "25" para 2025

      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const docId = doc.id;

        // Intentar obtener el número de registro de múltiples campos
        const numReg = data.numeroRegistro || data.registroId || data.id || docId;

        console.log(`📄 Registro ${index + 1}:`);
        console.log(`   - ID del documento: ${docId}`);
        console.log(`   - numeroRegistro: ${data.numeroRegistro || '(no encontrado)'}`);
        console.log(`   - registroId: ${data.registroId || '(no encontrado)'}`);
        console.log(`   - id: ${data.id || '(no encontrado)'}`);
        console.log(`   - Número extraído: ${numReg}`);

        // Solo analizar registros del año actual
        if (
          numReg &&
          typeof numReg === 'string' &&
          numReg.startsWith(yearPrefix) &&
          numReg.length === 7
        ) {
          const numberPart = numReg.slice(2); // Últimos 5 dígitos
          const num = parseInt(numberPart, 10) || 0;

          resultados.registrosEncontrados.push({
            docId: docId,
            numeroRegistro: numReg,
            numero: num,
            data: data
          });

          resultados.numerosEncontrados.push(num);

          if (num > resultados.maxNumber) {
            resultados.maxNumber = num;
          }

          console.log(`   ✅ Registro válido del año ${currentYear}: ${numReg} (número: ${num})`);
        } else {
          console.log(`   ⚠️ Registro no válido para el año ${currentYear} o formato incorrecto`);
        }
        console.log('');
      });

      // 4. Calcular siguiente número esperado
      resultados.siguienteNumeroEsperado = resultados.maxNumber + 1;
      const siguienteNumeroFormato = `${yearPrefix}${String(resultados.siguienteNumeroEsperado).padStart(5, '0')}`;

      console.log('📊 RESUMEN:');
      console.log(
        `   - Total de registros del año ${currentYear}: ${resultados.registrosEncontrados.length}`
      );
      console.log(
        `   - Números encontrados: [${resultados.numerosEncontrados.sort((a, b) => a - b).join(', ')}]`
      );
      console.log(`   - Número máximo encontrado: ${resultados.maxNumber}`);
      console.log(
        `   - Siguiente número esperado: ${siguienteNumeroFormato} (${resultados.siguienteNumeroEsperado})`
      );

      // 5. Verificar qué número está generando actualmente el sistema
      try {
        const nextNumber = await window.getAndIncrementRegistrationCounter();
        resultados.siguienteNumeroActual = nextNumber;
        const siguienteNumeroActualFormato = `${yearPrefix}${String(nextNumber).padStart(5, '0')}`;
        console.log(
          `   - Siguiente número que genera el sistema: ${siguienteNumeroActualFormato} (${nextNumber})`
        );

        if (nextNumber !== resultados.siguienteNumeroEsperado) {
          resultados.problemaDetectado = `El sistema genera ${siguienteNumeroActualFormato} pero debería generar ${siguienteNumeroFormato}`;
          resultados.recomendacion =
            'Hay una discrepancia entre los registros encontrados y el número generado. Revisar si hay registros ocultos o eliminados que aún se están contando.';
        } else {
          console.log('   ✅ El sistema genera el número correcto');
        }
      } catch (error) {
        console.warn('⚠️ Error al obtener siguiente número del sistema:', error);
      }

      // 6. Verificar si hay registros eliminados o con flags especiales
      console.log('\n🔍 Verificando registros eliminados o con flags especiales...');
      let registrosEliminados = 0;
      let _registrosConFlags = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.eliminado === true || data.deleted === true || data.isDeleted === true) {
          registrosEliminados++;
          const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;
          console.log(`   ⚠️ Registro eliminado encontrado: ${numReg} (docId: ${doc.id})`);
        }
        if (data.flag || data.status || data.estado) {
          _registrosConFlags++;
        }
      });

      if (registrosEliminados > 0) {
        console.log(
          `\n⚠️ Se encontraron ${registrosEliminados} registros marcados como eliminados`
        );
        resultados.problemaDetectado = `Hay ${registrosEliminados} registros eliminados que pueden estar afectando el conteo`;
        resultados.recomendacion =
          'Los registros eliminados no deberían contarse. Verificar la lógica de filtrado en getAndIncrementRegistrationCounter().';
      }

      // 7. Verificar localStorage
      console.log('\n🔍 Verificando localStorage...');
      const activeNumber = localStorage.getItem('activeRegistrationNumber');
      if (activeNumber) {
        console.log(`   - activeRegistrationNumber en localStorage: ${activeNumber}`);
      }

      const registrationNumbers = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');
      if (registrationNumbers.length > 0) {
        console.log(
          `   - Historial en registrationNumbers: ${registrationNumbers.length} entradas`
        );
        const currentYearNumbers = registrationNumbers.filter(item => {
          if (!item.number) {
            return false;
          }
          return item.number.startsWith(yearPrefix);
        });
        console.log(
          `   - Números del año ${currentYear} en historial: ${currentYearNumbers.length}`
        );
        if (currentYearNumbers.length > 0) {
          const maxHistorial = Math.max(
            ...currentYearNumbers.map(item => {
              const num = parseInt(item.number.slice(2), 10) || 0;
              return num;
            })
          );
          console.log(`   - Número máximo en historial: ${maxHistorial}`);
        }
      }

      // 8. Verificar RegistrationNumberBinding
      console.log('\n🔍 Verificando RegistrationNumberBinding...');
      if (window.RegistrationNumberBinding) {
        const bindingNumber = window.RegistrationNumberBinding.get();
        console.log(`   - Número en RegistrationNumberBinding: ${bindingNumber || '(vacío)'}`);
      } else {
        console.log('   - RegistrationNumberBinding no está disponible');
      }
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      resultados.problemaDetectado = `Error durante el diagnóstico: ${error.message}`;
      resultados.recomendacion = 'Revisar la consola para más detalles del error';
    }

    console.log('\n✅ Diagnóstico completado\n');
    return resultados;
  },

  /**
   * Mostrar resumen del diagnóstico
   */
  async mostrarResumen() {
    const resultados = await this.diagnosticar();

    console.log(`\n${'='.repeat(60)}`);
    console.log('📋 RESUMEN DEL DIAGNÓSTICO');
    console.log('='.repeat(60));
    console.log(`Registros encontrados del año actual: ${resultados.registrosEncontrados.length}`);
    console.log(
      `Números encontrados: [${resultados.numerosEncontrados.sort((a, b) => a - b).join(', ')}]`
    );
    console.log(`Número máximo: ${resultados.maxNumber}`);
    console.log(
      `Siguiente número esperado: ${resultados.siguienteNumeroEsperado ? `25${String(resultados.siguienteNumeroEsperado).padStart(5, '0')}` : 'N/A'}`
    );
    if (resultados.siguienteNumeroActual) {
      console.log(
        `Siguiente número que genera el sistema: 25${String(resultados.siguienteNumeroActual).padStart(5, '0')}`
      );
    }
    if (resultados.problemaDetectado) {
      console.log(`\n⚠️ PROBLEMA DETECTADO: ${resultados.problemaDetectado}`);
      console.log(`💡 RECOMENDACIÓN: ${resultados.recomendacion}`);
    } else {
      console.log('\n✅ No se detectaron problemas obvios');
    }
    console.log(`${'='.repeat(60)}\n`);

    return resultados;
  },

  /**
   * Listar todos los registros encontrados
   */
  async listarRegistros() {
    const resultados = await this.diagnosticar();

    console.log('\n📋 LISTA DE REGISTROS ENCONTRADOS:');
    console.log('-'.repeat(60));

    if (resultados.registrosEncontrados.length === 0) {
      console.log('No se encontraron registros del año actual');
    } else {
      resultados.registrosEncontrados
        .sort((a, b) => a.numero - b.numero)
        .forEach((reg, index) => {
          console.log(`${index + 1}. ${reg.numeroRegistro} (docId: ${reg.docId})`);
        });
    }

    console.log(`${'-'.repeat(60)}\n`);

    return resultados.registrosEncontrados;
  },

  /**
   * Limpiar datos antiguos que están causando el problema
   */
  async limpiarDatosAntiguos() {
    console.log('🧹 Limpiando datos antiguos que causan discrepancias en números de registro...\n');

    try {
      // IMPORTANTE: Firebase es la fuente de verdad
      // Obtener el número máximo real y el siguiente esperado DESDE FIREBASE
      const currentYear = new Date().getFullYear();
      const yearPrefix = currentYear.toString().slice(-2);
      let maxReal = 0;

      if (!window.firebaseDb || !window.fs) {
        console.warn(
          '⚠️ Firebase no disponible. No se puede limpiar datos antiguos sin la fuente de verdad.'
        );
        return {
          success: false,
          error: 'Firebase no disponible - no se puede validar contra la fuente de verdad'
        };
      }

      // SIEMPRE consultar Firebase directamente (fuente de verdad)
      try {
        const collectionRef = window.fs.collection(window.firebaseDb, 'logistica');

        // Intentar query optimizada con filtros
        try {
          const q = window.fs.query(
            collectionRef,
            window.fs.where('numeroRegistro', '>=', `${yearPrefix}00000`),
            window.fs.where('numeroRegistro', '<=', `${yearPrefix}99999`),
            window.fs.where('deleted', '==', false)
          );
          const snapshot = await window.fs.getDocs(q);

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Verificación adicional (doble verificación)
            if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
              return;
            }
            const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;
            if (
              numReg &&
              typeof numReg === 'string' &&
              numReg.startsWith(yearPrefix) &&
              numReg.length === 7
            ) {
              const numberPart = numReg.slice(2);
              const num = parseInt(numberPart, 10) || 0;
              if (num > maxReal) {
                maxReal = num;
              }
            }
          });
        } catch (queryError) {
          // Fallback: obtener todos y filtrar manualmente
          console.warn('⚠️ Error en query optimizada, usando método alternativo:', queryError);
          const snapshot = await window.fs.getDocs(collectionRef);

          snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Verificación adicional (doble verificación)
            if (data.deleted === true || data.eliminado === true || data.isDeleted === true) {
              return;
            }
            const numReg = data.numeroRegistro || data.registroId || data.id || doc.id;
            if (
              numReg &&
              typeof numReg === 'string' &&
              numReg.startsWith(yearPrefix) &&
              numReg.length === 7
            ) {
              const numberPart = numReg.slice(2);
              const num = parseInt(numberPart, 10) || 0;
              if (num > maxReal) {
                maxReal = num;
              }
            }
          });
        }
      } catch (error) {
        console.error('❌ Error obteniendo máximo real desde Firebase (fuente de verdad):', error);
        return {
          success: false,
          error: `Error consultando Firebase: ${error.message}`
        };
      }

      const siguienteEsperado = maxReal + 1;
      const siguienteEsperadoFormato = `${yearPrefix}${String(siguienteEsperado).padStart(5, '0')}`;

      // 1. Limpiar activeRegistrationNumber de localStorage si es mayor al esperado
      const activeNumber = localStorage.getItem('activeRegistrationNumber');
      if (activeNumber) {
        const activeNum = parseInt(activeNumber.slice(2), 10) || 0;
        if (activeNum > siguienteEsperado) {
          console.log(
            `🗑️ Eliminando activeRegistrationNumber: ${activeNumber} (esperado: ${siguienteEsperadoFormato})`
          );
          localStorage.removeItem('activeRegistrationNumber');
          console.log('✅ activeRegistrationNumber eliminado');
        } else {
          console.log(`ℹ️ activeRegistrationNumber está correcto: ${activeNumber}`);
        }
      } else {
        console.log('ℹ️ activeRegistrationNumber no existe en localStorage');
      }

      // 2. Limpiar historial de registrationNumbers (solo números del año actual que sean mayores al máximo real)
      const registrationNumbers = JSON.parse(localStorage.getItem('registrationNumbers') || '[]');

      // Filtrar el historial para mantener solo números válidos (hasta siguienteEsperado)
      const maxPermitido = siguienteEsperado;
      const historialLimpio = registrationNumbers.filter(item => {
        if (!item.number || !item.number.startsWith(yearPrefix)) {
          return true; // Mantener números de otros años
        }
        const num = parseInt(item.number.slice(2), 10) || 0;
        return num <= maxPermitido; // Solo mantener números hasta el máximo permitido
      });

      if (historialLimpio.length < registrationNumbers.length) {
        const eliminados = registrationNumbers.length - historialLimpio.length;
        console.log(
          `🗑️ Limpiando ${eliminados} entradas del historial que exceden el máximo real (${maxReal})`
        );
        localStorage.setItem('registrationNumbers', JSON.stringify(historialLimpio));
        console.log('✅ Historial limpiado');
      } else {
        console.log('ℹ️ Historial ya está limpio');
      }

      // 3. Limpiar RegistrationNumberBinding
      if (window.RegistrationNumberBinding) {
        const bindingNumber = window.RegistrationNumberBinding.get();
        if (bindingNumber) {
          const bindingNum = parseInt(bindingNumber.slice(2), 10) || 0;
          if (bindingNum > siguienteEsperado) {
            console.log(
              `🗑️ Limpiando RegistrationNumberBinding: ${bindingNumber} (esperado: ${siguienteEsperadoFormato})`
            );
            if (typeof window.RegistrationNumberBinding.clear === 'function') {
              await window.RegistrationNumberBinding.clear();
              console.log('✅ RegistrationNumberBinding limpiado');
            } else {
              console.warn('⚠️ RegistrationNumberBinding.clear() no está disponible');
            }
          } else {
            console.log(`ℹ️ RegistrationNumberBinding está correcto: ${bindingNumber}`);
          }
        } else {
          console.log('ℹ️ RegistrationNumberBinding está vacío');
        }
      }

      // 4. Limpiar el campo del formulario si tiene un valor incorrecto
      const numeroRegistroInput = document.getElementById('numeroRegistro');
      if (numeroRegistroInput) {
        const currentValue = numeroRegistroInput.value.trim();
        if (currentValue && currentValue.startsWith(yearPrefix)) {
          const num = parseInt(currentValue.slice(2), 10) || 0;
          if (num > siguienteEsperado) {
            console.log(
              `🗑️ Limpiando campo del formulario: ${currentValue} (esperado: ${siguienteEsperadoFormato})`
            );
            numeroRegistroInput.value = '';
            numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
            numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Campo del formulario limpiado');
          } else {
            console.log(`ℹ️ Campo del formulario está correcto: ${currentValue}`);
          }
        }
      }

      // 5. Limpiar flag de generación para forzar regeneración
      if (window.__numeroRegistroGenerado) {
        console.log('🔄 Limpiando flag __numeroRegistroGenerado para permitir regeneración');
        window.__numeroRegistroGenerado = false;
      }

      console.log(
        `\n✅ Limpieza completada. Siguiente número esperado: ${siguienteEsperadoFormato}`
      );
      console.log('💡 El número se regenerará automáticamente al interactuar con el formulario.');

      return {
        success: true,
        maxReal: maxReal,
        siguienteNumero: siguienteEsperado,
        siguienteNumeroFormato: siguienteEsperadoFormato
      };
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Solución completa: limpiar y regenerar
   */
  async solucionarCompleto() {
    console.log('🔧 Iniciando solución completa del problema 2500006...\n');

    // 1. Mostrar diagnóstico
    const diagnostico = await this.mostrarResumen();

    // 2. Limpiar datos antiguos
    console.log(`\n${'='.repeat(60)}`);
    const limpieza = await this.limpiarDatosAntiguos();

    // 3. Regenerar número si es necesario
    if (limpieza.success) {
      console.log(`\n${'='.repeat(60)}`);
      console.log('🔄 Regenerando número de registro...');

      try {
        // Limpiar el campo primero
        const numeroRegistroInput = document.getElementById('numeroRegistro');
        if (numeroRegistroInput) {
          numeroRegistroInput.value = '';
        }

        // Regenerar
        if (typeof window.generateUniqueNumber === 'function') {
          await window.generateUniqueNumber();
          console.log('✅ Número regenerado correctamente');
        } else {
          console.warn('⚠️ window.generateUniqueNumber no está disponible');
        }
      } catch (error) {
        console.error('❌ Error regenerando número:', error);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ Solución completa finalizada');
    console.log(`${'='.repeat(60)}\n`);

    return {
      diagnostico,
      limpieza
    };
  },

  /**
   * Auto-corrección automática al cargar la página
   * Se ejecuta automáticamente después de que Firebase esté listo
   */
  async autoCorregir() {
    // Solo ejecutar en la página de logística
    if (!window.location.pathname.includes('logistica.html')) {
      return;
    }

    // Esperar a que Firebase esté disponible
    let intentos = 0;
    while ((!window.firebaseDb || !window.fs) && intentos < 30) {
      await new Promise(resolve => setTimeout(resolve, 200));
      intentos++;
    }

    if (!window.firebaseDb || !window.fs) {
      console.debug('ℹ️ Firebase no disponible, omitiendo auto-corrección');
      return;
    }

    // Esperar un poco más para que los repositorios estén listos
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      console.log('🔍 Ejecutando auto-diagnóstico y corrección de números de registro...');
      console.log('📌 Firebase es la fuente de verdad - validando contra registros reales...');

      // Ejecutar diagnóstico (siempre consulta Firebase directamente)
      const resultados = await this.diagnosticar();

      // Verificar si hay discrepancia
      const hayDiscrepancia =
        resultados.siguienteNumeroActual !== resultados.siguienteNumeroEsperado;
      const numeroEnLocalStorage = localStorage.getItem('activeRegistrationNumber');
      const numeroEnBinding = window.RegistrationNumberBinding?.get();

      // Verificar si el número en localStorage/binding es mayor al esperado
      const currentYear = new Date().getFullYear();
      const yearPrefix = currentYear.toString().slice(-2);
      let numeroLocalStorageNum = 0;
      let numeroBindingNum = 0;

      if (numeroEnLocalStorage && numeroEnLocalStorage.startsWith(yearPrefix)) {
        numeroLocalStorageNum = parseInt(numeroEnLocalStorage.slice(2), 10) || 0;
      }
      if (numeroEnBinding && numeroEnBinding.startsWith(yearPrefix)) {
        numeroBindingNum = parseInt(numeroEnBinding.slice(2), 10) || 0;
      }

      const siguienteEsperado = resultados.siguienteNumeroEsperado || 1;
      const hayProblema =
        numeroLocalStorageNum > siguienteEsperado ||
        numeroBindingNum > siguienteEsperado ||
        hayDiscrepancia;

      if (hayProblema) {
        console.log('⚠️ Discrepancia detectada, corrigiendo automáticamente...');
        console.log(`   - Registros activos: ${resultados.registrosEncontrados.length}`);
        console.log(`   - Número máximo real: ${resultados.maxNumber}`);
        console.log(`   - Siguiente número esperado: ${siguienteEsperado}`);
        console.log(`   - Número en localStorage: ${numeroEnLocalStorage || '(vacío)'}`);
        console.log(`   - Número en Binding: ${numeroEnBinding || '(vacío)'}`);

        // Ejecutar limpieza y corrección
        await this.limpiarDatosAntiguos();

        // Si el campo del formulario tiene un número incorrecto, limpiarlo
        const numeroRegistroInput = document.getElementById('numeroRegistro');
        let campoLimpio = false;
        if (numeroRegistroInput) {
          const valorActual = numeroRegistroInput.value.trim();
          if (valorActual) {
            const valorNum = parseInt(valorActual.slice(2), 10) || 0;
            if (valorNum > siguienteEsperado) {
              console.log(`🧹 Limpiando campo del formulario: ${valorActual} → (vacío)`);
              numeroRegistroInput.value = '';
              numeroRegistroInput.dispatchEvent(new Event('input', { bubbles: true }));
              numeroRegistroInput.dispatchEvent(new Event('change', { bubbles: true }));
              campoLimpio = true;
            }
          }
        }

        // Limpiar flag para permitir regeneración
        if (window.__numeroRegistroGenerado) {
          window.__numeroRegistroGenerado = false;
        }

        // Si limpiamos el campo o no hay número, regenerar desde Firebase (fuente de verdad)
        if (campoLimpio || !numeroRegistroInput?.value?.trim()) {
          console.log('🔄 Regenerando número desde Firebase (fuente de verdad)...');
          try {
            if (typeof window.generateUniqueNumber === 'function') {
              // Esperar un momento para que la limpieza se complete
              await new Promise(resolve => setTimeout(resolve, 200));
              await window.generateUniqueNumber();
              console.log('✅ Número regenerado correctamente desde Firebase');
            } else {
              console.warn('⚠️ window.generateUniqueNumber no está disponible para regenerar');
            }
          } catch (error) {
            console.warn('⚠️ Error regenerando número:', error);
          }
        } else {
          console.log(
            '✅ Auto-corrección completada. El número se regenerará correctamente al interactuar con el formulario.'
          );
        }
      } else {
        console.debug('✅ No se detectaron discrepancias en los números de registro');
      }
    } catch (error) {
      console.warn('⚠️ Error en auto-corrección:', error);
      // No lanzar error para no interrumpir el flujo normal
    }
  }
};

// Auto-ejecutar cuando el script se carga (si Firebase ya está listo)
// También se puede llamar manualmente desde page-init.js
(function () {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Esperar un poco para que otros scripts se carguen
      setTimeout(() => {
        if (window.diagnosticar2500006) {
          window.diagnosticar2500006.autoCorregir().catch(err => {
            console.debug('Auto-corrección diferida (Firebase aún no listo):', err.message);
          });
        }
      }, 1000);
    });
  } else {
    // DOM ya está listo
    setTimeout(() => {
      if (window.diagnosticar2500006) {
        window.diagnosticar2500006.autoCorregir().catch(err => {
          console.debug('Auto-corrección diferida (Firebase aún no listo):', err.message);
        });
      }
    }, 1000);
  }
})();

console.log('✅ Script de diagnóstico y auto-corrección cargado');
console.log('📝 Usa window.diagnosticar2500006.mostrarResumen() para ver el diagnóstico completo');
console.log('📝 Usa window.diagnosticar2500006.listarRegistros() para ver la lista de registros');
console.log('📝 Usa window.diagnosticar2500006.limpiarDatosAntiguos() para limpiar datos antiguos');
console.log(
  '📝 Usa window.diagnosticar2500006.solucionarCompleto() para solucionar todo automáticamente'
);
console.log(
  '📝 Usa window.diagnosticar2500006.autoCorregir() para ejecutar auto-corrección manualmente'
);
