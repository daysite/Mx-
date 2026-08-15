// commands/keyauth.js
import fetch from 'node-fetch';
import { isAdmin, addAdmin, removeAdmin, listAdmins } from '../utils/adminManager.js';

// ============================================
// CONFIGURACIÓN KEYAUTH
// ============================================
const SELLER_KEY = 'e8865aa548248882c092c1380ab9085e';
const APP_NAME = 'ByPass-TopKoalas';
const BASE_URL = 'https://www.realauthx.com/api';
const OWNER_NUMBER = '51924537931'; // 🔥 CAMBIA ESTO POR TU NÚMERO

// ============================================
// FUNCIÓN DE FETCH CON REINTENTOS
// ============================================
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt} de ${maxRetries} para:`, url.substring(0, 100) + '...');
      
      const response = await fetch(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'ByPass-TopKoalas-Bot/1.0',
          'Accept': 'application/json',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      try {
        const data = JSON.parse(text);
        console.log('📦 Respuesta:', JSON.stringify(data).substring(0, 200));
        return data;
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', text.substring(0, 100));
        throw new Error('Respuesta inválida del servidor');
      }
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Intento ${attempt} falló:`, error.message);
      
      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`⏳ Esperando ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}

// ============================================
// COMANDO PRINCIPAL UNIFICADO
// ============================================
export default {
  command: ['key', 'auth', 'licencia', 'license', 'gen', 'generar'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const userNumber = msg.sender.replace('@s.whatsapp.net', '');
    
    // ============================================
    // SI NO HAY ARGUMENTOS, MOSTRAR AYUDA
    // ============================================
    if (!args || args.length === 0) {
      const isUserAdmin = isAdmin(userNumber);
      const isUserOwner = userNumber === OWNER_NUMBER;
      
      let helpText = 
        `📚 *Sistema de Licencias - ByPass-TopKoalas*\n\n` +
        `🔹 *Generar licencia*\n` +
        `   !key gen [días]\n` +
        `   Ej: !key gen 30\n\n` +
        `🔹 *Validar licencia*\n` +
        `   !key validar CLAVE\n` +
        `   Ej: !key validar 1BKN19-UFBGLG-RCWWSY\n\n`;
      
      if (isUserOwner) {
        helpText += 
          `🔹 *Administración (Solo Owner)*\n` +
          `   !key addadmin [número] - Agregar administrador\n` +
          `   !key deladmin [número] - Eliminar administrador\n` +
          `   !key listadmins - Listar administradores\n\n`;
      }
      
      helpText += 
        `📌 *Estado:* ${isUserAdmin ? '✅ Autorizado' : '⛔ No autorizado'}\n` +
        `📌 *Alias:* !gen, !generar, !licencia, !auth, !license`;
      
      return msg.reply(helpText);
    }
    
    const subcommand = args[0].toLowerCase();
    const restArgs = args.slice(1);
    
    // ============================================
    // SUBCOMANDO: GENERAR LICENCIA (gen)
    // ============================================
    if (subcommand === 'gen' || subcommand === 'generate' || subcommand === 'crear') {
      
      if (!isAdmin(userNumber)) {
        return msg.reply(
          `⛔ *Acceso Denegado*\n\n` +
          `No tienes permiso para usar este comando.\n` +
          `Solo los administradores autorizados pueden generar licencias.`
        );
      }
      
      const dias = parseInt(restArgs[0]);
      
      if (!restArgs[0] || isNaN(dias) || dias <= 0) {
        return msg.reply(
          `❌ *Uso correcto:* !key gen [días]\n\n` +
          `📌 *Ejemplos:*\n` +
          `!key gen 1   - Licencia de 1 día\n` +
          `!key gen 7   - Licencia de 7 días\n` +
          `!key gen 30  - Licencia de 30 días\n` +
          `!key gen 365 - Licencia de 1 año`
        );
      }
      
      if (dias < 1 || dias > 365) {
        return msg.reply(`❌ *Los días deben ser entre 1 y 365*`);
      }

      try {
        const { key } = await sock.sendMessage(
          msg.chat,
          { text: `⏳ *Generando licencia de ${dias} día${dias > 1 ? 's' : ''}...*` },
          { quoted: msg }
        );

        const autoUser = `user_${Date.now().toString(36)}`;
        const url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${autoUser}&duration=${dias}`;
        
        const data = await fetchWithRetry(url);
        
        if (data.success) {
          const licenseKey = data.key || data.keys?.[0] || 'N/A';
          
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + dias);
          const formattedDate = expiryDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          const responseText = 
            `✅ *¡Licencia generada exitosamente!*\n\n` +
            `🔑 *Licencia:* \`${licenseKey}\`\n` +
            `📅 *Duración:* ${dias} día${dias > 1 ? 's' : ''}\n` +
            `📆 *Vence:* ${formattedDate}\n` +
            `📱 *App:* ${APP_NAME}\n` +
            `📊 *Estado:* Activa\n\n` +
            `💡 *Para validar:* !key validar ${licenseKey}`;

          await sock.sendMessage(msg.chat, { text: responseText, edit: key });
        } else {
          await sock.sendMessage(msg.chat, { 
            text: `❌ *Error:* ${data.message || 'No se pudo generar la licencia'}`,
            edit: key 
          });
        }
        
      } catch (error) {
        console.error('❌ Error en KeyAuth:', error);
        await msg.reply(`❌ *Error:* ${error.message}`);
      }
    }
    
    // ============================================
    // SUBCOMANDO: VALIDAR LICENCIA (validar) - CORREGIDO V2
    // ============================================
    else if (subcommand === 'validar' || subcommand === 'check' || subcommand === 'verify') {
      
      const licenseKey = restArgs[0]?.trim() || '';
      
      if (!licenseKey) {
        return msg.reply(
          `❌ *Uso correcto:* !key validar CLAVE_LICENCIA\n\n` +
          `📌 *Ejemplo:* !key validar 1BKN19-UFBGLG-RCWWSY`
        );
      }

      try {
        const { key } = await sock.sendMessage(
          msg.chat,
          { text: '⏳ *Validando licencia...*' },
          { quoted: msg }
        );

        // 🔥 PRIMER INTENTO: Usar la API con type=check
        let url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=check&appname=${APP_NAME}&key=${licenseKey}`;
        console.log('🔍 Intentando URL 1:', url);
        
        try {
          const data = await fetchWithRetry(url);
          
          if (data && data.success) {
            const isValid = data.is_valid || data.status === 'active' || data.status === 'Activa';
            
            if (isValid) {
              const responseText = 
                `✅ *Licencia VÁLIDA*\n\n` +
                `🔑 *Clave:* \`${licenseKey}\`\n` +
                `👤 *Usuario:* ${data.username || 'N/A'}\n` +
                `📅 *Vence:* ${data.expires || data.expiry || 'N/A'}\n` +
                `📊 *Estado:* ${data.status || 'Activa'}\n` +
                `📱 *App:* ${data.app_name || APP_NAME}`;

              await sock.sendMessage(msg.chat, { text: responseText, edit: key });
              return;
            } else {
              // La licencia no es válida según la respuesta
              await sock.sendMessage(msg.chat, { 
                text: 
                  `❌ *Licencia INVÁLIDA*\n\n` +
                  `🔑 *Clave:* \`${licenseKey}\`\n` +
                  `📌 *Motivo:* ${data.message || 'Licencia no encontrada o expirada'}`,
                edit: key 
              });
              return;
            }
          }
        } catch (error) {
          console.log('⚠️ Primer intento falló, probando alternativa...');
        }
        
        // 🔥 SEGUNDO INTENTO: Usar la API pública (v1)
        const url2 = `https://www.realauthx.com/api/v1/licenses/validate?app_name=${APP_NAME}&license_key=${licenseKey}`;
        console.log('🔍 Intentando URL 2:', url2);
        
        try {
          const data2 = await fetchWithRetry(url2);
          
          if (data2 && data2.success && data2.is_valid) {
            const responseText = 
              `✅ *Licencia VÁLIDA*\n\n` +
              `🔑 *Clave:* \`${licenseKey}\`\n` +
              `👤 *Usuario:* ${data2.username || 'N/A'}\n` +
              `📅 *Vence:* ${data2.expires || 'N/A'}\n` +
              `📊 *Estado:* ${data2.status || 'Activa'}\n` +
              `📱 *App:* ${data2.app_name || APP_NAME}`;

            await sock.sendMessage(msg.chat, { text: responseText, edit: key });
            return;
          } else {
            await sock.sendMessage(msg.chat, { 
              text: 
                `❌ *Licencia INVÁLIDA*\n\n` +
                `🔑 *Clave:* \`${licenseKey}\`\n` +
                `📌 *Motivo:* ${data2?.message || 'Licencia no encontrada o expirada'}`,
              edit: key 
            });
            return;
          }
        } catch (error) {
          console.log('⚠️ Segundo intento falló');
        }
        
        // Si ambos intentos fallaron
        await sock.sendMessage(msg.chat, { 
          text: 
            `❌ *Licencia INVÁLIDA*\n\n` +
            `🔑 *Clave:* \`${licenseKey}\`\n` +
            `📌 *Motivo:* No se pudo verificar la licencia. Intenta nuevamente.`,
          edit: key 
        });
        
      } catch (error) {
        console.error('❌ Error en validación:', error);
        await msg.reply(`❌ *Error:* ${error.message}`);
      }
    }
    
    // ============================================
    // SUBCOMANDO: AGREGAR ADMIN (addadmin) - SOLO OWNER
    // ============================================
    else if (subcommand === 'addadmin' || subcommand === 'adduser') {
      
      if (userNumber !== OWNER_NUMBER) {
        return msg.reply(`⛔ *Acceso Denegado*\n\nEste comando solo puede ser usado por el owner del bot.`);
      }
      
      const newAdmin = restArgs[0]?.replace(/[^0-9]/g, '') || '';
      
      if (!newAdmin) {
        return msg.reply(`❌ *Uso correcto:* !key addadmin [número]\n\n📌 *Ejemplo:* !key addadmin 591712345678`);
      }
      
      if (addAdmin(newAdmin)) {
        await msg.reply(
          `✅ *Administrador agregado exitosamente*\n\n` +
          `📌 *Número:* ${newAdmin}\n` +
          `💡 *Ahora este usuario puede generar licencias con !key gen [días]*`
        );
      } else {
        await msg.reply(`ℹ️ *El número ${newAdmin} ya es administrador*`);
      }
    }
    
    // ============================================
    // SUBCOMANDO: ELIMINAR ADMIN (deladmin) - SOLO OWNER
    // ============================================
    else if (subcommand === 'deladmin' || subcommand === 'deluser' || subcommand === 'removeadmin') {
      
      if (userNumber !== OWNER_NUMBER) {
        return msg.reply(`⛔ *Acceso Denegado*\n\nEste comando solo puede ser usado por el owner del bot.`);
      }
      
      const adminToRemove = restArgs[0]?.replace(/[^0-9]/g, '') || '';
      
      if (!adminToRemove) {
        return msg.reply(`❌ *Uso correcto:* !key deladmin [número]\n\n📌 *Ejemplo:* !key deladmin 591712345678`);
      }
      
      if (removeAdmin(adminToRemove)) {
        await msg.reply(
          `✅ *Administrador eliminado exitosamente*\n\n` +
          `📌 *Número:* ${adminToRemove}\n` +
          `💡 *Este usuario ya no puede generar licencias*`
        );
      } else {
        await msg.reply(`ℹ️ *El número ${adminToRemove} no es administrador*`);
      }
    }
    
    // ============================================
    // SUBCOMANDO: LISTAR ADMINS (listadmins) - SOLO OWNER
    // ============================================
    else if (subcommand === 'listadmins' || subcommand === 'admins' || subcommand === 'listusers') {
      
      if (userNumber !== OWNER_NUMBER) {
        return msg.reply(`⛔ *Acceso Denegado*\n\nEste comando solo puede ser usado por el owner del bot.`);
      }
      
      const admins = listAdmins();
      
      if (admins.length === 0) {
        return msg.reply(`📋 *No hay administradores registrados*\n\n💡 *Agrega uno con:* !key addadmin [número]`);
      }
      
      let responseText = `👥 *Administradores Autorizados*\n\n`;
      admins.forEach((admin, index) => {
        responseText += `${index + 1}. ${admin}\n`;
      });
      responseText += `\n📌 *Total:* ${admins.length} administradores`;
      
      await msg.reply(responseText);
    }
    
    // ============================================
    // SUBCOMANDO: AYUDA (help)
    // ============================================
    else if (subcommand === 'help' || subcommand === 'ayuda') {
      
      const isUserAdmin = isAdmin(userNumber);
      const isUserOwner = userNumber === OWNER_NUMBER;
      
      let helpText = 
        `📚 *Sistema de Licencias - ByPass-TopKoalas*\n\n` +
        `🔹 *Generar licencia*\n` +
        `   !key gen [días]\n` +
        `   Ej: !key gen 30\n\n` +
        `🔹 *Validar licencia*\n` +
        `   !key validar CLAVE\n` +
        `   Ej: !key validar 1BKN19-UFBGLG-RCWWSY\n\n`;
      
      if (isUserOwner) {
        helpText += 
          `🔹 *Administración (Solo Owner)*\n` +
          `   !key addadmin [número] - Agregar administrador\n` +
          `   !key deladmin [número] - Eliminar administrador\n` +
          `   !key listadmins - Listar administradores\n\n`;
      }
      
      helpText += 
        `📌 *Estado:* ${isUserAdmin ? '✅ Autorizado' : '⛔ No autorizado'}\n` +
        `📌 *Alias:* !gen, !generar, !licencia, !auth, !license`;
      
      await msg.reply(helpText);
    }
    
    // ============================================
    // SUBCOMANDO DESCONOCIDO
    // ============================================
    else {
      await msg.reply(
        `❌ *Subcomando desconocido:* ${subcommand}\n\n` +
        `📌 *Usa:* !key help para ver los comandos disponibles`
      );
    }
  },
};
