// commands/keyauth.js
import fetch from 'node-fetch';

// ============================================
// CONFIGURACIÓN KEYAUTH
// ============================================
const SELLER_KEY = 'e8865aa548248882c092c1380ab9085e';
const APP_NAME = 'ByPass-TopKoalas';
const BASE_URL = 'https://www.realauthx.com/api';

// ============================================
// FUNCIÓN CORREGIDA - CON LA SOLUCIÓN
// ============================================
async function fetchWithRetry(url, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt} de ${maxRetries}`);
      
      const response = await fetch(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'ByPass-TopKoalas-Bot/1.0',
          'Accept': 'application/json',
          'Accept-Encoding': 'identity', // 🔥 ¡SOLUCIÓN MILAGROSA!
          'Connection': 'keep-alive'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      try {
        return JSON.parse(text);
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
      }
    }
  }
  
  throw lastError || new Error('Todos los intentos fallaron');
}

// ============================================
// COMANDO PRINCIPAL
// ============================================
export default {
  command: ['key', 'auth', 'licencia', 'license'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    if (!args || args.length === 0) {
      return msg.reply(
        `📚 *Sistema de Licencias - ByPass-TopKoalas*\n\n` +
        `🔹 *Crear usuario*\n` +
        `   !key user USUARIO CONTRASEÑA [EMAIL]\n` +
        `   Ej: !key user Danizin MiClave123\n\n` +
        `🔹 *Generar licencia*\n` +
        `   !key gen @usuario [días]\n` +
        `   Ej: !key gen @Danizin 30\n\n` +
        `🔹 *Crear usuario + licencia*\n` +
        `   !key full USUARIO CONTRASEÑA [DÍAS] [EMAIL]\n` +
        `   Ej: !key full Danizin MiClave123 30\n\n` +
        `🔹 *Validar licencia*\n` +
        `   !key check CLAVE\n` +
        `   Ej: !key check 1BKN19-UFBGLG-RCWWSY\n\n` +
        `🔹 *Listar usuarios*\n` +
        `   !key users\n\n` +
        `🔹 *Info de la app*\n` +
        `   !key info\n\n` +
        `📌 *Alias:* !auth, !licencia, !license`
      );
    }

    const subcommand = args[0].toLowerCase();
    const restArgs = args.slice(1);

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Procesando solicitud...*' },
        { quoted: msg }
      );

      let url = '';
      let responseText = '';
      let data = null;

      switch (subcommand) {
        // ============================================
        // GENERAR LICENCIA
        // ============================================
        case 'gen':
        case 'generate':
        case 'crearlic': {
          const usuario = restArgs[0]?.replace('@', '').trim() || '';
          const dias = parseInt(restArgs[1]) || 30;
          
          if (!usuario) {
            await sock.sendMessage(msg.chat, { 
              text: `❌ *Uso correcto:* !key gen @usuario [días]\n\n📌 Ejemplo: !key gen @Danizin 30`,
              edit: key 
            });
            return;
          }

          if (dias < 1 || dias > 365) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ Los días deben ser entre 1 y 365',
              edit: key 
            });
            return;
          }

          await sock.sendMessage(msg.chat, { 
            text: `⏳ *Generando licencia para ${usuario}...*`,
            edit: key 
          });

          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${usuario}&duration=${dias}`;
          data = await fetchWithRetry(url);
          
          if (data.success) {
            const licenseKey = data.key || data.keys?.[0] || 'N/A';
            responseText = 
              `✅ *¡Licencia generada!*\n\n` +
              `👤 *Usuario:* ${usuario}\n` +
              `🔑 *Licencia:* \`${licenseKey}\`\n` +
              `📅 *Duración:* ${dias} días\n` +
              `📱 *App:* ${APP_NAME}\n\n` +
              `💡 *Validar:* !key check ${licenseKey}`;
          } else {
            responseText = `❌ *Error:* ${data.message || 'No se pudo generar'}`;
          }
          break;
        }

        // ============================================
        // CREAR USUARIO
        // ============================================
        case 'user':
        case 'crear':
        case 'new': {
          const username = restArgs[0]?.trim() || '';
          const password = restArgs[1]?.trim() || '';
          const email = restArgs[2]?.trim() || `${username}@temp.com`;
          
          if (!username || !password) {
            await sock.sendMessage(msg.chat, { 
              text: `❌ *Uso correcto:* !key user USUARIO CONTRASEÑA [EMAIL]\n\n📌 Ejemplo: !key user Danizin MiClave123`,
              edit: key 
            });
            return;
          }

          if (username.length < 3) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ El usuario debe tener al menos 3 caracteres',
              edit: key 
            });
            return;
          }
          
          if (password.length < 6) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ La contraseña debe tener al menos 6 caracteres',
              edit: key 
            });
            return;
          }

          await sock.sendMessage(msg.chat, { 
            text: `⏳ *Creando usuario ${username}...*`,
            edit: key 
          });

          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=adduser&appname=${APP_NAME}&user=${username}&pass=${password}&email=${encodeURIComponent(email)}`;
          data = await fetchWithRetry(url);
          
          if (data.success) {
            responseText = 
              `✅ *¡Usuario creado!*\n\n` +
              `👤 *Usuario:* ${username}\n` +
              `🔑 *Contraseña:* \`${password}\`\n` +
              `📧 *Email:* ${email}\n` +
              `💡 *Generar licencia:* !key gen @${username}`;
          } else {
            let errorMsg = data.message || 'No se pudo crear';
            if (errorMsg.includes('already exists')) {
              errorMsg = `El usuario *${username}* ya existe`;
            }
            responseText = `❌ *Error:* ${errorMsg}`;
          }
          break;
        }

        // ============================================
        // CREAR USUARIO + LICENCIA
        // ============================================
        case 'full':
        case 'combo':
        case 'todo': {
          const username = restArgs[0]?.trim() || '';
          const password = restArgs[1]?.trim() || '';
          const dias = parseInt(restArgs[2]) || 30;
          const email = restArgs[3]?.trim() || `${username}@temp.com`;
          
          if (!username || !password) {
            await sock.sendMessage(msg.chat, { 
              text: `❌ *Uso correcto:* !key full USUARIO CONTRASEÑA [DÍAS] [EMAIL]\n\n📌 Ejemplo: !key full Danizin MiClave123 30`,
              edit: key 
            });
            return;
          }

          if (username.length < 3) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ El usuario debe tener al menos 3 caracteres',
              edit: key 
            });
            return;
          }
          
          if (password.length < 6) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ La contraseña debe tener al menos 6 caracteres',
              edit: key 
            });
            return;
          }

          if (dias < 1 || dias > 365) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ Los días deben ser entre 1 y 365',
              edit: key 
            });
            return;
          }

          await sock.sendMessage(msg.chat, { 
            text: `⏳ *Creando usuario y licencia...*`,
            edit: key 
          });

          // PASO 1: Crear usuario
          const userUrl = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=adduser&appname=${APP_NAME}&user=${username}&pass=${password}&email=${encodeURIComponent(email)}`;
          const userData = await fetchWithRetry(userUrl);
          
          if (!userData.success) {
            let errorMsg = userData.message || 'No se pudo crear';
            if (errorMsg.includes('already exists')) {
              errorMsg = `El usuario *${username}* ya existe`;
            }
            await sock.sendMessage(msg.chat, { 
              text: `❌ *Error:* ${errorMsg}`,
              edit: key 
            });
            return;
          }

          // PASO 2: Generar licencia
          const licUrl = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${username}&duration=${dias}`;
          const licData = await fetchWithRetry(licUrl);
          
          if (licData.success) {
            const licenseKey = licData.key || licData.keys?.[0] || 'N/A';
            responseText = 
              `✅ *¡Usuario y licencia creados!*\n\n` +
              `👤 *Usuario:* ${username}\n` +
              `🔑 *Contraseña:* \`${password}\`\n` +
              `🔑 *Licencia:* \`${licenseKey}\`\n` +
              `📅 *Duración:* ${dias} días\n\n` +
              `💡 *Validar:* !key check ${licenseKey}`;
          } else {
            responseText = 
              `⚠️ *Usuario creado pero error al generar licencia*\n\n` +
              `👤 Usuario: ${username}\n` +
              `💡 *Generar manual:* !key gen @${username}`;
          }
          break;
        }

        // ============================================
        // VALIDAR LICENCIA
        // ============================================
        case 'check':
        case 'validar':
        case 'verify': {
          const licenseKey = restArgs[0]?.trim() || '';
          
          if (!licenseKey) {
            await sock.sendMessage(msg.chat, { 
              text: `❌ *Uso correcto:* !key check CLAVE\n\n📌 Ejemplo: !key check 1BKN19-UFBGLG-RCWWSY`,
              edit: key 
            });
            return;
          }

          await sock.sendMessage(msg.chat, { 
            text: `⏳ *Validando licencia...*`,
            edit: key 
          });

          url = `${BASE_URL}/v1/licenses/validate?app_name=${APP_NAME}&license_key=${licenseKey}`;
          data = await fetchWithRetry(url);
          
          if (data.success && data.is_valid) {
            responseText = 
              `✅ *Licencia VÁLIDA*\n\n` +
              `🔑 *Clave:* \`${licenseKey}\`\n` +
              `👤 *Usuario:* ${data.username || 'N/A'}\n` +
              `📅 *Vence:* ${data.expires || 'N/A'}\n` +
              `📊 *Estado:* ${data.status || 'Activa'}`;
          } else {
            responseText = 
              `❌ *Licencia INVÁLIDA*\n\n` +
              `🔑 *Clave:* \`${licenseKey}\`\n` +
              `📌 *Motivo:* ${data.message || 'No encontrada'}`;
          }
          break;
        }

        // ============================================
        // LISTAR USUARIOS
        // ============================================
        case 'users':
        case 'list':
        case 'lista': {
          await sock.sendMessage(msg.chat, { 
            text: `⏳ *Obteniendo usuarios...*`,
            edit: key 
          });

          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=listusers&appname=${APP_NAME}`;
          data = await fetchWithRetry(url);
          
          if (data.success && data.users) {
            const users = JSON.parse(data.users);
            
            if (users.length === 0) {
              responseText = '📋 *No hay usuarios*';
            } else {
              responseText = `👥 *Usuarios* (${users.length})\n\n`;
              users.forEach((u, i) => {
                responseText += `${i+1}. *${u.username}*\n`;
                responseText += `   📧 ${u.email || 'Sin email'}\n`;
              });
            }
          } else {
            responseText = '❌ *Error:* No se pudieron obtener';
          }
          break;
        }

        // ============================================
        // INFO DE LA APP
        // ============================================
        case 'info':
        case 'estado':
        case 'status': {
          await sock.sendMessage(msg.chat, { 
            text: `⏳ *Obteniendo información...*`,
            edit: key 
          });

          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=appinfo&appname=${APP_NAME}`;
          data = await fetchWithRetry(url);
          
          if (data.success) {
            responseText = 
              `📱 *${APP_NAME}*\n\n` +
              `👤 *Dueño:* ${data.owner || 'N/A'}\n` +
              `🔢 *Usuarios:* ${data.total_users || 'N/A'}\n` +
              `🔑 *Licencias:* ${data.total_licenses || 'N/A'}`;
          } else {
            responseText = '❌ *Error:* No se pudo obtener';
          }
          break;
        }

        // ============================================
        // AYUDA
        // ============================================
        case 'help':
        case 'ayuda':
        default: {
          responseText = 
            `📚 *Comandos KeyAuth*\n\n` +
            `🔹 !key gen @usuario [días] - Generar licencia\n` +
            `🔹 !key user USUARIO PASS - Crear usuario\n` +
            `🔹 !key full USUARIO PASS [DÍAS] - Usuario + licencia\n` +
            `🔹 !key check CLAVE - Validar licencia\n` +
            `🔹 !key users - Listar usuarios\n` +
            `🔹 !key info - Info de la app\n\n` +
            `📌 *Alias:* !auth, !licencia, !license`;
          break;
        }
      }

      await sock.sendMessage(msg.chat, { text: responseText, edit: key });

    } catch (error) {
      console.error('❌ Error en KeyAuth:', error);
      
      let errorMessage = '❌ *Error al procesar*\n\n';
      
      if (error.message.includes('Premature close')) {
        errorMessage += '⚠️ La API no respondió a tiempo.\n';
        errorMessage += '💡 El sistema reintentó 3 veces.\n';
        errorMessage += '💡 Espera unos segundos y vuelve a intentar.';
      } else {
        errorMessage += `📌 ${error.message}`;
      }
      
      await msg.reply(errorMessage);
    }
  },
};
