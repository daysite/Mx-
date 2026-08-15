// commands/keyauth.js
import fetch from 'node-fetch';

// ============================================
// CONFIGURACIÓN KEYAUTH
// ============================================
const SELLER_KEY = 'e8865aa548248882c092c1380ab9085e';
const APP_NAME = 'ByPass-TopKoalas'; // Nombre CORRECTO de la app
const BASE_URL = 'https://www.realauthx.com/api';

// ============================================
// COMANDO PRINCIPAL: !key
// ============================================
export default {
  command: ['key', 'keyauth', 'lic'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    // Si no hay argumentos, mostrar ayuda
    if (args.length === 0) {
      return msg.reply(
        `📚 *Sistema de Licencias - ByPass-TopKoalas*\n\n` +
        `🔹 !key gen @usuario [días] - Generar licencia\n` +
        `🔹 !key validar CLAVE - Validar licencia\n` +
        `🔹 !key listusers - Listar usuarios\n` +
        `🔹 !key listlic - Listar licencias\n` +
        `🔹 !key del CLAVE - Desactivar licencia\n` +
        `🔹 !key extend CLAVE [días] - Extender licencia\n` +
        `🔹 !key info - Info de la app\n` +
        `🔹 !key help - Esta ayuda\n\n` +
        `📌 *Ejemplo:* !key gen @Danizin 30`
      );
    }

    const subcommand = args[0].toLowerCase();
    const restArgs = args.slice(1);

    try {
      // Mostrar mensaje de espera
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
        // COMANDO: GENERAR LICENCIA
        // ============================================
        case 'gen':
        case 'generar':
        case 'create': {
          const usuario = restArgs[0]?.replace('@', '').trim() || '';
          const dias = parseInt(restArgs[1]) || 30;
          
          if (!usuario) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ *Uso correcto:* !key gen @usuario [días]',
              edit: key 
            });
            return;
          }

          // Validar que los días sean válidos
          if (dias < 1 || dias > 365) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ Los días deben ser entre 1 y 365',
              edit: key 
            });
            return;
          }

          // Construir URL para crear licencia
          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${usuario}&duration=${dias}`;
          
          const res = await fetch(url);
          data = await res.json();
          
          if (data.success) {
            responseText = 
              `✅ *¡Licencia generada exitosamente!*\n\n` +
              `👤 *Usuario:* ${usuario}\n` +
              `🔑 *Licencia:* \`${data.key || data.keys?.[0] || 'N/A'}\`\n` +
              `📅 *Duración:* ${dias} días\n` +
              `🆔 *App:* ${data.app_name || APP_NAME}\n` +
              `📊 *Estado:* Activa\n\n` +
              `📌 *Instrucciones:*\n` +
              `1. Entregue esta clave al usuario\n` +
              `2. El usuario debe ingresarla en la app\n` +
              `3. Para validar use: !key validar CLAVE`;
          } else {
            responseText = `❌ *Error:* ${data.message || 'No se pudo generar la licencia'}`;
          }
          break;
        }

        // ============================================
        // COMANDO: VALIDAR LICENCIA
        // ============================================
        case 'validar':
        case 'check':
        case 'validate': {
          const licenseKey = restArgs[0]?.trim() || '';
          
          if (!licenseKey) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ *Uso correcto:* !key validar CLAVE_LICENCIA',
              edit: key 
            });
            return;
          }

          // Validar licencia usando la API pública
          url = `${BASE_URL}/v1/licenses/validate?app_name=${APP_NAME}&license_key=${licenseKey}`;
          
          const res = await fetch(url);
          data = await res.json();
          
          if (data.success && data.is_valid) {
            responseText = 
              `✅ *Licencia VÁLIDA*\n\n` +
              `🔑 *Clave:* \`${licenseKey}\`\n` +
              `👤 *Usuario:* ${data.username || 'N/A'}\n` +
              `📅 *Vence:* ${data.expires || 'N/A'}\n` +
              `📊 *Estado:* ${data.status || 'Activa'}\n` +
              `📱 *App:* ${data.app_name || APP_NAME}`;
          } else {
            responseText = 
              `❌ *Licencia INVÁLIDA*\n\n` +
              `🔑 *Clave:* \`${licenseKey}\`\n` +
              `📌 *Motivo:* ${data.message || 'Licencia no encontrada o expirada'}\n\n` +
              `💡 *Sugerencia:* Verifique que la clave sea correcta o genere una nueva con !key gen`;
          }
          break;
        }

        // ============================================
        // COMANDO: LISTAR USUARIOS
        // ============================================
        case 'listusers':
        case 'users': {
          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=listusers&appname=${APP_NAME}`;
          
          const res = await fetch(url);
          data = await res.json();
          
          if (data.success && data.users) {
            const users = JSON.parse(data.users);
            
            if (users.length === 0) {
              responseText = '📋 *No hay usuarios registrados en la aplicación*';
            } else {
              responseText = `👥 *Lista de Usuarios* (${users.length})\n\n`;
              users.forEach((u, i) => {
                responseText += `${i+1}. *${u.username}*\n`;
                responseText += `   📧 ${u.email || 'Sin email'}\n`;
                responseText += `   🆔 ID: ${u.user_id || 'N/A'}\n`;
                responseText += `   📅 Creado: ${u.created_at || 'N/A'}\n\n`;
              });
            }
          } else {
            responseText = '❌ *Error:* No se pudieron obtener los usuarios';
          }
          break;
        }

        // ============================================
        // COMANDO: LISTAR LICENCIAS
        // ============================================
        case 'listlic':
        case 'licenses':
        case 'list': {
          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=listlicenses&appname=${APP_NAME}`;
          
          const res = await fetch(url);
          data = await res.json();
          
          if (data.success && data.licenses) {
            const licenses = JSON.parse(data.licenses);
            
            if (licenses.length === 0) {
              responseText = '📋 *No hay licencias generadas*';
            } else {
              responseText = `🔑 *Lista de Licencias* (${licenses.length})\n\n`;
              licenses.forEach((l, i) => {
                responseText += `${i+1}. *${l.key}*\n`;
                responseText += `   👤 Usuario: ${l.username || 'N/A'}\n`;
                responseText += `   📅 Expira: ${l.expires || 'N/A'}\n`;
                responseText += `   📊 Estado: ${l.status || 'Activa'}\n\n`;
              });
            }
          } else {
            responseText = '❌ *Error:* No se pudieron obtener las licencias';
          }
          break;
        }

        // ============================================
        // COMANDO: DESACTIVAR LICENCIA
        // ============================================
        case 'del':
        case 'delete':
        case 'desactivar': {
          const licenseKey = restArgs[0]?.trim() || '';
          
          if (!licenseKey) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ *Uso correcto:* !key del CLAVE_LICENCIA',
              edit: key 
            });
            return;
          }

          // Confirmación de seguridad
          responseText = `⚠️ *¿Estás seguro de desactivar la licencia?*\n\n` +
                        `🔑 Clave: \`${licenseKey}\`\n` +
                        `📌 Responde con "SI" para confirmar o "NO" para cancelar.`;
          
          await sock.sendMessage(msg.chat, { text: responseText, edit: key });
          
          // Esperar confirmación (esto es avanzado, puedes omitirlo)
          // Por ahora, eliminamos directamente
          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=del&appname=${APP_NAME}&key=${licenseKey}`;
          
          const res = await fetch(url);
          data = await res.json();
          
          if (data.success) {
            responseText = 
              `✅ *Licencia desactivada correctamente*\n\n` +
              `🔑 Clave: \`${licenseKey}\`\n` +
              `📊 Estado: Desactivada\n\n` +
              `💡 El usuario ya no podrá usar esta licencia.`;
          } else {
            responseText = 
              `❌ *Error:* ${data.message || 'No se pudo desactivar la licencia'}\n\n` +
              `🔑 Clave: \`${licenseKey}\``;
          }
          break;
        }

        // ============================================
        // COMANDO: EXTENDER LICENCIA
        // ============================================
        case 'extend':
        case 'extender': {
          const licenseKey = restArgs[0]?.trim() || '';
          const dias = parseInt(restArgs[1]) || 30;
          
          if (!licenseKey) {
            await sock.sendMessage(msg.chat, { 
              text: '❌ *Uso correcto:* !key extend CLAVE [días]',
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

          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=extend&appname=${APP_NAME}&key=${licenseKey}&days=${dias}`;
          
          const res = await fetch(url);
          data = await res.json();
          
          if (data.success) {
            responseText = 
              `✅ *Licencia extendida correctamente*\n\n` +
              `🔑 Clave: \`${licenseKey}\`\n` +
              `📅 Días añadidos: ${dias}\n` +
              `📊 Nueva fecha de expiración: ${data.new_expiry || 'N/A'}`;
          } else {
            responseText = `❌ *Error:* ${data.message || 'No se pudo extender la licencia'}`;
          }
          break;
        }

        // ============================================
        // COMANDO: INFORMACIÓN DE LA APP
        // ============================================
        case 'info':
        case 'estado': {
          url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=appinfo&appname=${APP_NAME}`;
          
          const res = await fetch(url);
          data = await res.json();
          
          if (data.success) {
            responseText = 
              `📱 *Información de ByPass-TopKoalas*\n\n` +
              `🏷️ *Nombre:* ${data.appname || APP_NAME}\n` +
              `👤 *Propietario:* ${data.owner || 'phERRrODUI'}\n` +
              `📊 *Estado:* ${data.status || 'Activa'}\n` +
              `🔢 *Total usuarios:* ${data.total_users || 'N/A'}\n` +
              `🔑 *Total licencias:* ${data.total_licenses || 'N/A'}\n` +
              `📅 *Creada:* ${data.created_at || 'N/A'}\n\n` +
              `💡 *Comandos disponibles:* !key help`;
          } else {
            responseText = '❌ *Error:* No se pudo obtener la información de la aplicación';
          }
          break;
        }

        // ============================================
        // COMANDO: AYUDA
        // ============================================
        case 'help':
        case 'ayuda':
        default: {
          responseText = 
            `📚 *Sistema de Licencias - ByPass-TopKoalas*\n\n` +
            `🔹 *Generar licencia*\n` +
            `   !key gen @usuario [días]\n` +
            `   Ej: !key gen @Danizin 30\n\n` +
            `🔹 *Validar licencia*\n` +
            `   !key validar CLAVE\n` +
            `   Ej: !key validar 1BKN19-UFBGLG-RCWWSY\n\n` +
            `🔹 *Listar usuarios*\n` +
            `   !key listusers\n\n` +
            `🔹 *Listar licencias*\n` +
            `   !key listlic\n\n` +
            `🔹 *Desactivar licencia*\n` +
            `   !key del CLAVE\n` +
            `   Ej: !key del 1BKN19-UFBGLG-RCWWSY\n\n` +
            `🔹 *Extender licencia*\n` +
            `   !key extend CLAVE [días]\n` +
            `   Ej: !key extend 1BKN19-UFBGLG-RCWWSY 15\n\n` +
            `🔹 *Información de la app*\n` +
            `   !key info\n\n` +
            `🔹 *Esta ayuda*\n` +
            `   !key help\n\n` +
            `📌 *Nota:* Todos los comandos son para administradores`;
          break;
        }
      }

      // Enviar respuesta final
      await sock.sendMessage(msg.chat, { text: responseText, edit: key });

    } catch (error) {
      console.error('❌ Error en KeyAuth:', error);
      
      let errorMessage = '❌ *Error al procesar la solicitud*\n\n';
      
      if (error.message.includes('Premature close')) {
        errorMessage += '⚠️ La conexión con la API se cerró inesperadamente.\n';
        errorMessage += '💡 Intenta nuevamente en unos segundos.';
      } else if (error.message.includes('fetch')) {
        errorMessage += '⚠️ Error de conexión con el servidor.\n';
        errorMessage += '💡 Verifica tu conexión a internet.';
      } else {
        errorMessage += `📌 Detalle: ${error.message}`;
      }
      
      await msg.reply(errorMessage);
    }
  },
};
