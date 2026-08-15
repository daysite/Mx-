// commands/keyauth.js
import fetch from 'node-fetch';

// ============================================
// CONFIGURACIÓN KEYAUTH
// ============================================
const SELLER_KEY = 'e8865aa548248882c092c1380ab9085e';
const APP_NAME = 'ByPass-TopKoalas';
const BASE_URL = 'https://www.realauthx.com/api';

// ============================================
// COMANDO 1: GENERAR LICENCIA
// ============================================
export const genLicense = {
  command: ['genlic', 'generarlicencia', 'gl'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const usuario = args[0]?.replace('@', '').trim() || '';
    const dias = parseInt(args[1]) || 30;
    
    if (!usuario) {
      return msg.reply(
        `❌ *Uso correcto:*\n` +
        `!genlic @usuario [días]\n\n` +
        `📌 *Ejemplos:*\n` +
        `!genlic @Danizin 30\n` +
        `!genlic @Juan 7`
      );
    }

    // Validar días
    if (dias < 1 || dias > 365) {
      return msg.reply('❌ Los días deben ser entre 1 y 365');
    }

    try {
      // Mostrar mensaje de espera
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Generando licencia...*' },
        { quoted: msg }
      );

      // Construir URL para crear licencia
      const url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${usuario}&duration=${dias}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        const responseText = 
          `✅ *¡Licencia generada exitosamente!*\n\n` +
          `👤 *Usuario:* ${usuario}\n` +
          `🔑 *Licencia:* \`${data.key || data.keys?.[0] || 'N/A'}\`\n` +
          `📅 *Duración:* ${dias} días\n` +
          `📱 *App:* ${data.app_name || APP_NAME}\n` +
          `📊 *Estado:* Activa\n\n` +
          `💡 *Para validar:* !validarlic ${data.key || data.keys?.[0]}`;

        await sock.sendMessage(msg.chat, { text: responseText, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ *Error:* ${data.message || 'No se pudo generar la licencia'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error('Error en genLicense:', error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO 2: CREAR USUARIO
// ============================================
export const createUser = {
  command: ['crearuser', 'newuser', 'cu'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const username = args[0]?.trim() || '';
    const password = args[1]?.trim() || '';
    const email = args[2]?.trim() || `${username}@temp.com`;
    
    if (!username || !password) {
      return msg.reply(
        `❌ *Uso correcto:*\n` +
        `!crearuser USUARIO CONTRASEÑA [EMAIL]\n\n` +
        `📌 *Ejemplos:*\n` +
        `!crearuser Danizin MiClave123\n` +
        `!crearuser Juan Pass456 juan@email.com\n\n` +
        `📌 *Requisitos:*\n` +
        `• Usuario: mínimo 3 caracteres\n` +
        `• Contraseña: mínimo 6 caracteres`
      );
    }

    // Validar longitud
    if (username.length < 3) {
      return msg.reply('❌ El usuario debe tener al menos 3 caracteres');
    }
    
    if (password.length < 6) {
      return msg.reply('❌ La contraseña debe tener al menos 6 caracteres');
    }

    try {
      // Mostrar mensaje de espera
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Creando usuario...*' },
        { quoted: msg }
      );

      // Construir URL para crear usuario
      const url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=adduser&appname=${APP_NAME}&user=${username}&pass=${password}&email=${encodeURIComponent(email)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        const responseText = 
          `✅ *¡Usuario creado exitosamente!*\n\n` +
          `👤 *Usuario:* ${username}\n` +
          `🔑 *Contraseña:* \`${password}\`\n` +
          `📧 *Email:* ${email}\n` +
          `📱 *App:* ${data.app_name || APP_NAME}\n` +
          `📊 *Estado:* Activo\n\n` +
          `💡 *Para generar licencia:* !genlic @${username} 30`;

        await sock.sendMessage(msg.chat, { text: responseText, edit: key });
      } else {
        let errorMsg = data.message || 'No se pudo crear el usuario';
        
        // Mensajes de error más amigables
        if (errorMsg.includes('already exists')) {
          errorMsg = `El usuario *${username}* ya existe. Prueba con otro nombre.`;
        } else if (errorMsg.includes('invalid')) {
          errorMsg = 'Datos inválidos. Verifica el usuario y contraseña.';
        }
        
        await sock.sendMessage(msg.chat, { 
          text: `❌ *Error:* ${errorMsg}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error('Error en createUser:', error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO 3: CREAR USUARIO CON LICENCIA (COMBO)
// ============================================
export const createUserWithLicense = {
  command: ['crearfull', 'newfull', 'cf'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const username = args[0]?.trim() || '';
    const password = args[1]?.trim() || '';
    const dias = parseInt(args[2]) || 30;
    const email = args[3]?.trim() || `${username}@temp.com`;
    
    if (!username || !password) {
      return msg.reply(
        `❌ *Uso correcto:*\n` +
        `!crearfull USUARIO CONTRASEÑA [DÍAS] [EMAIL]\n\n` +
        `📌 *Ejemplos:*\n` +
        `!crearfull Danizin MiClave123 30\n` +
        `!crearfull Juan Pass456 7 juan@email.com\n\n` +
        `💡 *Este comando crea usuario Y genera licencia automáticamente*`
      );
    }

    if (username.length < 3) {
      return msg.reply('❌ El usuario debe tener al menos 3 caracteres');
    }
    
    if (password.length < 6) {
      return msg.reply('❌ La contraseña debe tener al menos 6 caracteres');
    }

    if (dias < 1 || dias > 365) {
      return msg.reply('❌ Los días deben ser entre 1 y 365');
    }

    try {
      // Mostrar mensaje de espera
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Creando usuario y generando licencia...*' },
        { quoted: msg }
      );

      // PASO 1: Crear usuario
      const userUrl = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=adduser&appname=${APP_NAME}&user=${username}&pass=${password}&email=${encodeURIComponent(email)}`;
      
      const userRes = await fetch(userUrl);
      const userData = await userRes.json();
      
      if (!userData.success) {
        let errorMsg = userData.message || 'No se pudo crear el usuario';
        if (errorMsg.includes('already exists')) {
          errorMsg = `El usuario *${username}* ya existe. Prueba con otro nombre.`;
        }
        await sock.sendMessage(msg.chat, { 
          text: `❌ *Error al crear usuario:* ${errorMsg}`,
          edit: key 
        });
        return;
      }

      // PASO 2: Generar licencia para el usuario
      const licUrl = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${username}&duration=${dias}`;
      
      const licRes = await fetch(licUrl);
      const licData = await licRes.json();
      
      if (licData.success) {
        const responseText = 
          `✅ *¡Usuario y licencia creados exitosamente!*\n\n` +
          `👤 *Usuario:* ${username}\n` +
          `🔑 *Contraseña:* \`${password}\`\n` +
          `📧 *Email:* ${email}\n` +
          `🔑 *Licencia:* \`${licData.key || licData.keys?.[0] || 'N/A'}\`\n` +
          `📅 *Duración:* ${dias} días\n` +
          `📱 *App:* ${licData.app_name || APP_NAME}\n\n` +
          `💡 *Para validar:* !validarlic ${licData.key || licData.keys?.[0]}\n` +
          `💡 *Para generar otra licencia:* !genlic @${username} 30`;

        await sock.sendMessage(msg.chat, { text: responseText, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `⚠️ *Usuario creado pero error al generar licencia*\n\n` +
                `👤 Usuario: ${username}\n` +
                `❌ Error: ${licData.message || 'No se pudo generar la licencia'}\n\n` +
                `💡 Puedes generar licencia manualmente con: !genlic @${username}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error('Error en createUserWithLicense:', error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO 4: VALIDAR LICENCIA
// ============================================
export const validateLicense = {
  command: ['validarlic', 'checklic', 'vl'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const licenseKey = args[0]?.trim() || '';
    
    if (!licenseKey) {
      return msg.reply(
        `❌ *Uso correcto:*\n` +
        `!validarlic CLAVE_LICENCIA\n\n` +
        `📌 *Ejemplo:* !validarlic 1BKN19-UFBGLG-RCWWSY`
      );
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Validando licencia...*' },
        { quoted: msg }
      );

      const url = `${BASE_URL}/v1/licenses/validate?app_name=${APP_NAME}&license_key=${licenseKey}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.is_valid) {
        const responseText = 
          `✅ *Licencia VÁLIDA*\n\n` +
          `🔑 *Clave:* \`${licenseKey}\`\n` +
          `👤 *Usuario:* ${data.username || 'N/A'}\n` +
          `📅 *Vence:* ${data.expires || 'N/A'}\n` +
          `📊 *Estado:* ${data.status || 'Activa'}\n` +
          `📱 *App:* ${data.app_name || APP_NAME}`;

        await sock.sendMessage(msg.chat, { text: responseText, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ *Licencia INVÁLIDA*\n\n` +
                `🔑 *Clave:* \`${licenseKey}\`\n` +
                `📌 *Motivo:* ${data.message || 'Licencia no encontrada o expirada'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error('Error en validateLicense:', error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO 5: LISTAR USUARIOS
// ============================================
export const listUsers = {
  command: ['listusers', 'lu'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Obteniendo lista de usuarios...*' },
        { quoted: msg }
      );

      const url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=listusers&appname=${APP_NAME}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success && data.users) {
        const users = JSON.parse(data.users);
        
        if (users.length === 0) {
          await sock.sendMessage(msg.chat, { 
            text: '📋 *No hay usuarios registrados*',
            edit: key 
          });
          return;
        }

        let responseText = `👥 *Lista de Usuarios* (${users.length})\n\n`;
        users.forEach((u, i) => {
          responseText += `${i+1}. *${u.username}*\n`;
          responseText += `   📧 ${u.email || 'Sin email'}\n`;
          responseText += `   🆔 ID: ${u.user_id || 'N/A'}\n`;
          responseText += `   📅 Creado: ${u.created_at || 'N/A'}\n\n`;
        });

        await sock.sendMessage(msg.chat, { text: responseText, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: '❌ No se pudieron obtener los usuarios',
          edit: key 
        });
      }
      
    } catch (error) {
      console.error('Error en listUsers:', error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO 6: AYUDA
// ============================================
export const help = {
  command: ['keyhelp', 'kh'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const responseText = 
      `📚 *Comandos KeyAuth - ByPass-TopKoalas*\n\n` +
      `🔹 *Generar licencia*\n` +
      `   !genlic @usuario [días]\n` +
      `   Ej: !genlic @Danizin 30\n\n` +
      `🔹 *Crear usuario*\n` +
      `   !crearuser USUARIO CONTRASEÑA [EMAIL]\n` +
      `   Ej: !crearuser Danizin MiClave123\n\n` +
      `🔹 *Crear usuario + licencia (combo)*\n` +
      `   !crearfull USUARIO CONTRASEÑA [DÍAS] [EMAIL]\n` +
      `   Ej: !crearfull Danizin MiClave123 30\n\n` +
      `🔹 *Validar licencia*\n` +
      `   !validarlic CLAVE\n` +
      `   Ej: !validarlic 1BKN19-UFBGLG-RCWWSY\n\n` +
      `🔹 *Listar usuarios*\n` +
      `   !listusers\n\n` +
      `🔹 *Esta ayuda*\n` +
      `   !keyhelp\n\n` +
      `📌 *Alias:*\n` +
      `• genlic = gl = generarlicencia\n` +
      `• crearuser = cu = newuser\n` +
      `• crearfull = cf = newfull\n` +
      `• validarlic = vl = checklic\n` +
      `• listusers = lu`;

    await msg.reply(responseText);
  },
};
