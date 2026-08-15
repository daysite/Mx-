// commands/keyauth.js
import fetch from 'node-fetch';

const SELLER_KEY = 'e8865aa548248882c092c1380ab9085e';
const APP_NAME = 'External-TopKoalas';

export default {
  command: ['keyauth', 'key'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    // Si no hay argumentos, mostrar ayuda
    if (args.length === 0) {
      return msg.reply(
        '📚 *Comandos KeyAuth:*\n\n' +
        '!key crear @usuario [días] - Crear licencia\n' +
        '!key validar KEY - Validar licencia\n' +
        '!key listusers - Listar usuarios\n' +
        '!key listlic - Listar licencias\n' +
        '!key del KEY - Desactivar licencia\n' +
        '!key info - Info de la app'
      );
    }

    const subcommand = args[0].toLowerCase();
    const restArgs = args.slice(1);

    try {
      // Mostrar mensaje de espera
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ Procesando...' },
        { quoted: msg }
      );

      let url = '';
      let responseText = '';

      switch (subcommand) {
        case 'crear':
        case 'gen': {
          const usuario = restArgs[0]?.replace('@', '') || '';
          const dias = parseInt(restArgs[1]) || 30;
          
          if (!usuario) {
            return msg.reply('❌ Uso: !key crear @usuario [días]');
          }

          url = `https://www.realauthx.com/api/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${usuario}&duration=${dias}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.success) {
            responseText = `✅ *Licencia creada*\n\n👤 ${usuario}\n🔑 ${data.key}\n📅 ${dias} días`;
          } else {
            responseText = `❌ Error: ${data.message || 'No se pudo crear'}`;
          }
          break;
        }

        case 'validar':
        case 'check': {
          const licenseKey = restArgs[0] || '';
          
          if (!licenseKey) {
            return msg.reply('❌ Uso: !key validar CLAVE');
          }

          url = `https://www.realauthx.com/api/v1/licenses/validate?app_name=${APP_NAME}&license_key=${licenseKey}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.success && data.is_valid) {
            responseText = `✅ *Licencia VÁLIDA*\n\n🔑 ${licenseKey}\n👤 ${data.username || 'N/A'}\n📅 ${data.expires || 'N/A'}`;
          } else {
            responseText = `❌ Licencia inválida: ${licenseKey}`;
          }
          break;
        }

        case 'listusers': {
          url = `https://www.realauthx.com/api/seller/?sellerkey=${SELLER_KEY}&type=listusers&appname=${APP_NAME}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.success && data.users) {
            const users = JSON.parse(data.users);
            responseText = '👥 *Usuarios:*\n\n';
            users.forEach((u, i) => {
              responseText += `${i+1}. ${u.username}\n`;
            });
          } else {
            responseText = '❌ No hay usuarios';
          }
          break;
        }

        case 'listlic': {
          url = `https://www.realauthx.com/api/seller/?sellerkey=${SELLER_KEY}&type=listlicenses&appname=${APP_NAME}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.success && data.licenses) {
            const licenses = JSON.parse(data.licenses);
            responseText = '🔑 *Licencias:*\n\n';
            licenses.forEach((l, i) => {
              responseText += `${i+1}. ${l.key}\n`;
            });
          } else {
            responseText = '❌ No hay licencias';
          }
          break;
        }

        case 'del':
        case 'delete': {
          const licenseKey = restArgs[0] || '';
          
          if (!licenseKey) {
            return msg.reply('❌ Uso: !key del CLAVE');
          }

          url = `https://www.realauthx.com/api/seller/?sellerkey=${SELLER_KEY}&type=del&appname=${APP_NAME}&key=${licenseKey}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.success) {
            responseText = `✅ Licencia desactivada: ${licenseKey}`;
          } else {
            responseText = `❌ Error: ${data.message || 'No se pudo desactivar'}`;
          }
          break;
        }

        case 'info': {
          url = `https://www.realauthx.com/api/seller/?sellerkey=${SELLER_KEY}&type=appinfo&appname=${APP_NAME}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.success) {
            responseText = 
              `📱 *App: ${APP_NAME}*\n\n` +
              `👤 Dueño: ${data.owner || 'N/A'}\n` +
              `🔢 Usuarios: ${data.total_users || 'N/A'}\n` +
              `🔑 Licencias: ${data.total_licenses || 'N/A'}`;
          } else {
            responseText = '❌ Error al obtener info';
          }
          break;
        }

        default:
          return msg.reply('❌ Subcomando no reconocido. Usa !key sin argumentos para ver la ayuda');
      }

      // Enviar respuesta
      await sock.sendMessage(msg.chat, { text: responseText, edit: key });

    } catch (error) {
      console.error('Error en KeyAuth:', error);
      await msg.reply(`❌ Error: ${error.message}`);
    }
  }
};
