import db from "#db";
import fetch from 'node-fetch';

// Configuración de KeyAuth
const KEYAUTH_SELLER_KEY = 'e8865aa548248882c092c1380ab9085e';
const KEYAUTH_BASE_URL = 'https://www.realauthx.com/api/seller';
const APP_NAME = 'External-TopKoalas';

// ============================================
// COMANDO: CREAR LICENCIA
// ============================================
export const createLicense = {
  command: ['crearlicencia', 'genlic'],
  category: 'admin',
  admin: true, // Solo admins pueden usarlo
  run: async ({ msg, sock, args, command }) => {
    
    const usuario = args[0]?.replace('@', '') || '';
    const dias = parseInt(args[1]) || 30;
    
    if (!usuario) {
      return msg.reply(
        `❌ *Uso correcto:*\n` +
        `!crearlicencia @usuario [días]\n\n` +
        `📌 Ejemplo: !crearlicencia @juan 30`
      );
    }

    try {
      // Mostrar mensaje de espera
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Generando licencia...*' },
        { quoted: msg }
      );

      // Construir URL para crear licencia
      const url = `${KEYAUTH_BASE_URL}/?sellerkey=${KEYAUTH_SELLER_KEY}&type=add&appname=${APP_NAME}&username=${usuario}&duration=${dias}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        const response = 
          `✅ *¡Licencia creada exitosamente!*\n\n` +
          `👤 Usuario: ${usuario}\n` +
          `🔑 Licencia: *${data.key || 'N/A'}*\n` +
          `📅 Duración: ${dias} días\n` +
          `🆔 ID: ${data.license_id || 'N/A'}\n\n` +
          `📌 El usuario puede validar con: !validarlicencia ${data.key}`;

        await sock.sendMessage(msg.chat, { text: response, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ Error: ${data.message || 'No se pudo crear la licencia'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: VALIDAR LICENCIA
// ============================================
export const validateLicense = {
  command: ['validarlicencia', 'checklic'],
  category: 'ai',
  run: async ({ msg, sock, args, command }) => {
    
    const licenseKey = args[0] || '';
    
    if (!licenseKey) {
      return msg.reply(`❌ Uso: !validarlicencia CLAVE_LICENCIA`);
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Verificando licencia...*' },
        { quoted: msg }
      );

      // Para validar usamos la API normal, no la seller
      const url = `https://www.realauthx.com/api/v1/licenses/validate?app_name=${APP_NAME}&license_key=${licenseKey}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.is_valid) {
        const response = 
          `✅ *Licencia VÁLIDA*\n\n` +
          `🔑 Clave: ${licenseKey}\n` +
          `👤 Usuario: ${data.username || 'N/A'}\n` +
          `📅 Vence: ${data.expires || 'N/A'}\n` +
          `📊 Estado: ${data.status || 'Activa'}`;

        await sock.sendMessage(msg.chat, { text: response, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ *Licencia INVÁLIDA*\n\n🔑 Clave: ${licenseKey}\n📌 Motivo: ${data.message || 'Licencia no encontrada o expirada'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: LISTAR USUARIOS
// ============================================
export const listUsers = {
  command: ['listarusuarios', 'users'],
  category: 'admin',
  admin: true,
  run: async ({ msg, sock, args, command }) => {
    
    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Obteniendo lista de usuarios...*' },
        { quoted: msg }
      );

      const url = `${KEYAUTH_BASE_URL}/?sellerkey=${KEYAUTH_SELLER_KEY}&type=listusers&appname=${APP_NAME}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.users) {
        const users = JSON.parse(data.users);
        
        if (users.length === 0) {
          return sock.sendMessage(msg.chat, { 
            text: '📋 *No hay usuarios registrados*',
            edit: key 
          });
        }

        let response = '👥 *Lista de Usuarios*\n\n';
        users.forEach((user, index) => {
          response += `${index + 1}. *${user.username}*\n`;
          response += `   📧 ${user.email || 'Sin email'}\n`;
          response += `   🆔 ID: ${user.user_id || 'N/A'}\n`;
          response += `   📅 Creado: ${user.created_at || 'N/A'}\n\n`;
        });
        
        await sock.sendMessage(msg.chat, { text: response, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: '❌ No se pudieron obtener los usuarios',
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: LISTAR LICENCIAS
// ============================================
export const listLicenses = {
  command: ['listarlicencias', 'licenses'],
  category: 'admin',
  admin: true,
  run: async ({ msg, sock, args, command }) => {
    
    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Obteniendo lista de licencias...*' },
        { quoted: msg }
      );

      const url = `${KEYAUTH_BASE_URL}/?sellerkey=${KEYAUTH_SELLER_KEY}&type=listlicenses&appname=${APP_NAME}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.licenses) {
        const licenses = JSON.parse(data.licenses);
        
        if (licenses.length === 0) {
          return sock.sendMessage(msg.chat, { 
            text: '📋 *No hay licencias registradas*',
            edit: key 
          });
        }

        let response = '🔑 *Lista de Licencias*\n\n';
        licenses.forEach((license, index) => {
          response += `${index + 1}. *${license.key}*\n`;
          response += `   👤 Usuario: ${license.username || 'N/A'}\n`;
          response += `   📅 Expira: ${license.expires || 'N/A'}\n`;
          response += `   📊 Estado: ${license.status || 'Activa'}\n\n`;
        });
        
        await sock.sendMessage(msg.chat, { text: response, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: '❌ No se pudieron obtener las licencias',
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: DESACTIVAR LICENCIA
// ============================================
export const deactivateLicense = {
  command: ['desactivarlicencia', 'dellic'],
  category: 'admin',
  admin: true,
  run: async ({ msg, sock, args, command }) => {
    
    const licenseKey = args[0] || '';
    
    if (!licenseKey) {
      return msg.reply(`❌ Uso: !desactivarlicencia CLAVE_LICENCIA`);
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Desactivando licencia...*' },
        { quoted: msg }
      );

      const url = `${KEYAUTH_BASE_URL}/?sellerkey=${KEYAUTH_SELLER_KEY}&type=del&appname=${APP_NAME}&key=${licenseKey}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        await sock.sendMessage(msg.chat, { 
          text: `✅ *Licencia desactivada correctamente*\n\n🔑 Clave: ${licenseKey}`,
          edit: key 
        });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ Error: ${data.message || 'No se pudo desactivar la licencia'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: INFORMACIÓN DE LA APP
// ============================================
export const appInfo = {
  command: ['infobot', 'infoapp'],
  category: 'ai',
  run: async ({ msg, sock, args, command }) => {
    
    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Obteniendo información...*' },
        { quoted: msg }
      );

      const url = `${KEYAUTH_BASE_URL}/?sellerkey=${KEYAUTH_SELLER_KEY}&type=appinfo&appname=${APP_NAME}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        const response = 
          `📱 *Información de la App*\n\n` +
          `🏷️ Nombre: ${data.appname || APP_NAME}\n` +
          `👤 Propietario: ${data.owner || 'phERRrODUI'}\n` +
          `📊 Estado: ${data.status || 'Activa'}\n` +
          `🔢 Total usuarios: ${data.total_users || 'N/A'}\n` +
          `🔑 Total licencias: ${data.total_licenses || 'N/A'}\n` +
          `📅 Creada: ${data.created_at || 'N/A'}`;

        await sock.sendMessage(msg.chat, { text: response, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: '❌ Error al obtener información',
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: AYUDA
// ============================================
export const help = {
  command: ['keyhelp', 'ayudakey'],
  category: 'ai',
  run: async ({ msg, sock, args, command }) => {
    
    const response = 
      `📚 *Comandos de KeyAuth disponibles:*\n\n` +
      `🔹 !crearlicencia @usuario [días]\n` +
      `   Crea una nueva licencia (Admin)\n\n` +
      `🔹 !validarlicencia KEY\n` +
      `   Verifica estado de licencia\n\n` +
      `🔹 !listarusuarios\n` +
      `   Muestra todos los usuarios (Admin)\n\n` +
      `🔹 !listarlicencias\n` +
      `   Muestra todas las licencias (Admin)\n\n` +
      `🔹 !desactivarlicencia KEY\n` +
      `   Desactiva una licencia (Admin)\n\n` +
      `🔹 !infobot\n` +
      `   Información de la app\n\n` +
      `🔹 !ayuda\n` +
      `   Muestra los comandos del bot\n\n` +
      `*Nota:* Los comandos con (Admin) solo pueden usarlos administradores`;

    await msg.reply(response);
  },
};

// ============================================
// COMANDO: EXTENDER LICENCIA
// ============================================
export const extendLicense = {
  command: ['extenderlicencia', 'extendlic'],
  category: 'admin',
  admin: true,
  run: async ({ msg, sock, args, command }) => {
    
    const licenseKey = args[0] || '';
    const daysToAdd = parseInt(args[1]) || 30;
    
    if (!licenseKey) {
      return msg.reply(`❌ Uso: !extenderlicencia CLAVE [días]`);
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Extendiendo licencia...*' },
        { quoted: msg }
      );

      const url = `${KEYAUTH_BASE_URL}/?sellerkey=${KEYAUTH_SELLER_KEY}&type=extend&appname=${APP_NAME}&key=${licenseKey}&days=${daysToAdd}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        await sock.sendMessage(msg.chat, { 
          text: `✅ *Licencia extendida correctamente*\n\n🔑 Clave: ${licenseKey}\n📅 Días añadidos: ${daysToAdd}`,
          edit: key 
        });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ Error: ${data.message || 'No se pudo extender la licencia'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: ELIMINAR USUARIO
// ============================================
export const deleteUser = {
  command: ['eliminarusuario', 'deluser'],
  category: 'admin',
  admin: true,
  run: async ({ msg, sock, args, command }) => {
    
    const username = args[0]?.replace('@', '') || '';
    
    if (!username) {
      return msg.reply(`❌ Uso: !eliminarusuario @usuario`);
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Eliminando usuario...*' },
        { quoted: msg }
      );

      const url = `${KEYAUTH_BASE_URL}/?sellerkey=${KEYAUTH_SELLER_KEY}&type=deluser&appname=${APP_NAME}&user=${username}`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        await sock.sendMessage(msg.chat, { 
          text: `✅ *Usuario eliminado correctamente*\n\n👤 Usuario: ${username}`,
          edit: key 
        });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ Error: ${data.message || 'No se pudo eliminar el usuario'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error(error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  },
};
