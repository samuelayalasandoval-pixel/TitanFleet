/**
 * Script de diagnóstico para economicos
 * Responde las preguntas:
 * 1. ¿La información se guarda en Firebase?
 * 2. ¿La información se está guardando correctamente?
 * 3. ¿Por qué no aparece en la lista de registros?
 * 4. ¿El localStorage está causando algún conflicto?
 */

(function () {
  'use strict';

  window.diagnosticoEconomicos = async function () {
    console.log('🔍 ===== DIAGNÓSTICO DE ECONÓMICOS =====');
    console.log('');

    const resultados = {
      firebase: {},
      localStorage: {},
      ui: {},
      conflictos: []
    };

    try {
      // ========================================
      // 1. VERIFICAR FIREBASE
      // ========================================
      console.log('📡 1. VERIFICANDO FIREBASE');
      console.log('─'.repeat(50));

      // Verificar si Firebase está inicializado
      if (typeof firebase === 'undefined') {
        console.error('❌ Firebase NO está cargado');
        resultados.firebase.inicializado = false;
      } else {
        console.log('✅ Firebase está cargado');
        resultados.firebase.inicializado = true;

        // Verificar Firestore
        try {
          const db = firebase.firestore();
          console.log('✅ Firestore está disponible');
          resultados.firebase.firestoreDisponible = true;

          // Intentar leer economicos de Firebase
          console.log('📖 Leyendo económicos de Firebase...');
          const snapshot = await db.collection('configuracion').doc('tractocamiones').get();

          if (snapshot.exists) {
            const data = snapshot.data();
            console.log('✅ Documento "tractocamiones" existe en Firebase');
            console.log('📊 Datos completos:', data);
            resultados.firebase.documentoExiste = true;
            resultados.firebase.data = data;

            // Contar económicos
            if (data.economicos && Array.isArray(data.economicos)) {
              const count = data.economicos.length;
              console.log(`📦 Total de económicos en Firebase: ${count}`);
              resultados.firebase.cantidadEconomicos = count;

              // Mostrar cada económico
              data.economicos.forEach((eco, index) => {
                console.log(
                  `  ${index + 1}. ${eco.numero || 'SIN NÚMERO'} - ${eco.placaTracto || 'SIN PLACA'} - ${eco.marca || 'SIN MARCA'}`
                );
              });
            } else {
              console.log('⚠️ No hay array de económicos en Firebase');
              resultados.firebase.cantidadEconomicos = 0;
            }
          } else {
            console.log('❌ Documento "tractocamiones" NO existe en Firebase');
            resultados.firebase.documentoExiste = false;
            resultados.firebase.cantidadEconomicos = 0;
          }
        } catch (error) {
          console.error('❌ Error accediendo a Firestore:', error);
          resultados.firebase.error = error.message;
        }
      }

      console.log('');

      // ========================================
      // 2. VERIFICAR LOCALSTORAGE
      // ========================================
      console.log('💾 2. VERIFICANDO LOCALSTORAGE');
      console.log('─'.repeat(50));

      const keys = [
        'erp_economicos',
        'erp_tractocamiones',
        'tractocamiones',
        'configuracion_tractocamiones'
      ];

      let totalEnLocalStorage = 0;
      keys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              console.log(`✅ localStorage["${key}"]: ${parsed.length} registros`);
              totalEnLocalStorage += parsed.length;
              resultados.localStorage[key] = parsed.length;

              // Mostrar primeros 3
              parsed.slice(0, 3).forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.numero || item.numeroEconomico || 'SIN NÚMERO'}`);
              });
            } else {
              console.log(`⚠️ localStorage["${key}"]: NO es un array`);
              resultados.localStorage[key] = 'no-array';
            }
          } catch (e) {
            console.log(`❌ localStorage["${key}"]: Error parseando JSON`);
            resultados.localStorage[key] = 'error';
          }
        } else {
          console.log(`⚠️ localStorage["${key}"]: No existe`);
          resultados.localStorage[key] = null;
        }
      });

      console.log(`📦 Total en localStorage: ${totalEnLocalStorage} registros`);
      console.log('');

      // ========================================
      // 3. VERIFICAR UI (TABLA)
      // ========================================
      console.log('🖥️ 3. VERIFICANDO INTERFAZ (TABLA)');
      console.log('─'.repeat(50));

      const tableBody = document.getElementById('economicosTableBody');
      if (tableBody) {
        const rows = tableBody.querySelectorAll('tr');
        console.log(`📋 Filas en tabla: ${rows.length}`);
        resultados.ui.filasEnTabla = rows.length;

        // Verificar si está vacía
        const emptyMessage = tableBody.querySelector('td[colspan]');
        if (emptyMessage) {
          console.log('⚠️ Tabla muestra mensaje de vacío');
          console.log(`   Mensaje: "${emptyMessage.textContent.trim()}"`);
          resultados.ui.tablaVacia = true;
        } else {
          console.log('✅ Tabla tiene datos');
          resultados.ui.tablaVacia = false;

          // Mostrar primeros 3 registros
          rows.forEach((row, idx) => {
            if (idx < 3) {
              const cells = row.querySelectorAll('td');
              if (cells.length > 0) {
                console.log(`  ${idx + 1}. ${cells[0]?.textContent.trim() || 'Sin datos'}`);
              }
            }
          });
        }
      } else {
        console.log('❌ Tabla economicosTableBody no encontrada en DOM');
        resultados.ui.tablaExiste = false;
      }

      console.log('');

      // ========================================
      // 4. VERIFICAR FUNCIÓN DE CARGA
      // ========================================
      console.log('⚙️ 4. VERIFICANDO FUNCIÓN loadEconomicosTable()');
      console.log('─'.repeat(50));

      if (typeof window.loadEconomicosTable === 'function') {
        console.log('✅ Función loadEconomicosTable() existe');
        resultados.ui.funcionCargaExiste = true;

        // Ver el código de la función
        const funcStr = window.loadEconomicosTable.toString();
        const usaFirebase = funcStr.includes('firebase') || funcStr.includes('firestore');
        const usaLocalStorage = funcStr.includes('localStorage');

        console.log(`   - ¿Usa Firebase? ${usaFirebase ? '✅ Sí' : '❌ No'}`);
        console.log(`   - ¿Usa localStorage? ${usaLocalStorage ? '✅ Sí' : '❌ No'}`);

        resultados.ui.funcionUsaFirebase = usaFirebase;
        resultados.ui.funcionUsaLocalStorage = usaLocalStorage;
      } else {
        console.log('❌ Función loadEconomicosTable() NO existe');
        resultados.ui.funcionCargaExiste = false;
      }

      console.log('');

      // ========================================
      // 5. DETECTAR CONFLICTOS
      // ========================================
      console.log('⚠️ 5. DETECTANDO POSIBLES CONFLICTOS');
      console.log('─'.repeat(50));

      // Conflicto 1: Datos en localStorage pero no en Firebase
      if (totalEnLocalStorage > 0 && resultados.firebase.cantidadEconomicos === 0) {
        const conflicto = 'Hay datos en localStorage pero NO en Firebase';
        console.log(`❌ CONFLICTO: ${conflicto}`);
        resultados.conflictos.push(conflicto);
      }

      // Conflicto 2: Datos en Firebase pero tabla vacía
      if (resultados.firebase.cantidadEconomicos > 0 && resultados.ui.tablaVacia) {
        const conflicto = 'Hay datos en Firebase pero la tabla está vacía';
        console.log(`❌ CONFLICTO: ${conflicto}`);
        resultados.conflictos.push(conflicto);
      }

      // Conflicto 3: Función no usa Firebase
      if (resultados.firebase.cantidadEconomicos > 0 && !resultados.ui.funcionUsaFirebase) {
        const conflicto = 'Hay datos en Firebase pero la función de carga NO usa Firebase';
        console.log(`❌ CONFLICTO: ${conflicto}`);
        resultados.conflictos.push(conflicto);
      }

      // Conflicto 4: Múltiples keys en localStorage
      const localStorageKeys = Object.keys(resultados.localStorage).filter(
        k => resultados.localStorage[k] > 0
      );
      if (localStorageKeys.length > 1) {
        const conflicto = `Hay ${localStorageKeys.length} keys diferentes en localStorage: ${localStorageKeys.join(', ')}`;
        console.log(`⚠️ POSIBLE CONFLICTO: ${conflicto}`);
        resultados.conflictos.push(conflicto);
      }

      if (resultados.conflictos.length === 0) {
        console.log('✅ No se detectaron conflictos');
      }

      console.log('');

      // ========================================
      // 6. RESUMEN Y RECOMENDACIONES
      // ========================================
      console.log('📝 6. RESUMEN Y RECOMENDACIONES');
      console.log('─'.repeat(50));

      console.log('RESPUESTAS A LAS PREGUNTAS:');
      console.log('');
      console.log('1️⃣ ¿La información se guarda en Firebase?');
      console.log(
        `   ${resultados.firebase.documentoExiste ? '✅ SÍ' : '❌ NO'} - ${resultados.firebase.cantidadEconomicos || 0} económicos guardados`
      );
      console.log('');

      console.log('2️⃣ ¿La información se está guardando correctamente?');
      if (resultados.firebase.documentoExiste && resultados.firebase.cantidadEconomicos > 0) {
        console.log('   ✅ SÍ - Los datos están en Firebase y tienen la estructura correcta');
      } else {
        console.log('   ❌ NO - No hay datos en Firebase o la estructura no es correcta');
      }
      console.log('');

      console.log('3️⃣ ¿Por qué no aparece en la lista de registros?');
      if (resultados.ui.tablaVacia) {
        if (!resultados.ui.funcionUsaFirebase) {
          console.log('   ❌ La función loadEconomicosTable() NO está leyendo de Firebase');
        } else if (!resultados.firebase.documentoExiste) {
          console.log('   ❌ No hay datos en Firebase para mostrar');
        } else {
          console.log('   ❌ Hay un error en la función de carga - revisar código');
        }
      } else {
        console.log('   ✅ La tabla SÍ tiene datos');
      }
      console.log('');

      console.log('4️⃣ ¿El localStorage está causando algún conflicto?');
      if (localStorageKeys.length > 1) {
        console.log(
          `   ⚠️ POSIBLE - Hay ${localStorageKeys.length} keys diferentes en localStorage`
        );
        console.log('   Recomendación: Limpiar localStorage y usar solo Firebase');
      } else if (totalEnLocalStorage > 0 && resultados.firebase.cantidadEconomicos === 0) {
        console.log('   ⚠️ POSIBLE - Hay datos en localStorage pero no en Firebase');
        console.log('   Recomendación: Migrar datos de localStorage a Firebase');
      } else {
        console.log('   ✅ NO - No se detectaron conflictos con localStorage');
      }
      console.log('');

      console.log('🔧 RECOMENDACIONES:');
      if (resultados.conflictos.length > 0) {
        resultados.conflictos.forEach((c, idx) => {
          console.log(`   ${idx + 1}. ${c}`);
        });
      } else {
        console.log('   ✅ Todo parece estar en orden');
      }

      console.log('');
      console.log('🔍 ===== FIN DEL DIAGNÓSTICO =====');

      return resultados;
    } catch (error) {
      console.error('❌ Error durante el diagnóstico:', error);
      return { error: error.message };
    }
  };

  console.log('✅ Diagnóstico cargado. Ejecuta: await diagnosticoEconomicos()');
})();
