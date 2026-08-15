// commands/keyauth.js
import fetch from 'node-fetch';

// ============================================
// CONFIGURACIÓN KEYAUTH
// ============================================
const SELLER_KEY = 'e8865aa548248882c092c1380ab9085e';
const APP_NAME = 'ByPass-TopKoalas';
const BASE_URL = 'https://www.realauthx.com/api';

// ============================================
// FUNCIÓN DE FETCH CON REINTENTOS
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
          'Accept-Encoding': 'identity',
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
// COMANDO PRINCIPAL - SOLO LICENCIAS
// ============================================
export default {
  command: ['key', 'auth', 'licencia', 'license', 'gen', 'generar'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    // Obtener días del argumento (opcional)
    const dias = parseInt(args[0]) || 30; // Por defecto 30 días
    
    // Validar días
    if (dias < 1 || dias > 365) {
      return msg.reply(
        `❌ *Los días deben ser entre 1 y 365*\n\n` +
        `📌 *Uso correcto:*\n` +
        `!key [días]  - Genera una licencia\n` +
        `!key 30      - Genera licencia de 30 días\n` +
        `!key 7       - Genera licencia de 7 días\n\n` +
        `💡 *Sin argumentos genera 30 días por defecto*`
      );
    }

    try {
      // Mostrar mensaje de espera
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Generando licencia...*' },
        { quoted: msg }
      );

      // Generar nombre de usuario automático (basado en timestamp)
      const autoUser = `user_${Date.now().toString(36)}`;
      
      // Construir URL para crear licencia
      const url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${autoUser}&duration=${dias}`;
      
      const data = await fetchWithRetry(url);
      
      if (data.success) {
        const licenseKey = data.key || data.keys?.[0] || 'N/A';
        
        const responseText = 
          `✅ *¡Licencia generada exitosamente!*\n\n` +
          `🔑 *Licencia:* \`${licenseKey}\`\n` +
          `📅 *Duración:* ${dias} días\n` +
          `📱 *App:* ${APP_NAME}\n` +
          `📊 *Estado:* Activa\n\n` +
          `💡 *Para validar:* !validar ${licenseKey}\n` +
          `💡 *Para usar en tu app:* Ingresa esta clave en el campo de licencia`;

        await sock.sendMessage(msg.chat, { text: responseText, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: `❌ *Error:* ${data.message || 'No se pudo generar la licencia'}`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error('❌ Error en KeyAuth:', error);
      
      let errorMessage = '❌ *Error al generar licencia*\n\n';
      
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

// ============================================
// COMANDO: VALIDAR LICENCIA
// ============================================
export const validate = {
  command: ['validar', 'check', 'verify'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const licenseKey = args[0]?.trim() || '';
    
    if (!licenseKey) {
      return msg.reply(
        `❌ *Uso correcto:* !validar CLAVE_LICENCIA\n\n` +
        `📌 *Ejemplo:* !validar 1BKN19-UFBGLG-RCWWSY`
      );
    }

    try {
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: '⏳ *Validando licencia...*' },
        { quoted: msg }
      );

      const url = `${BASE_URL}/v1/licenses/validate?app_name=${APP_NAME}&license_key=${licenseKey}`;
      
      const data = await fetchWithRetry(url);
      
      if (data.success && data.is_valid) {
        const responseText = 
          `✅ *Licencia VÁLIDA*\n\n` +
          `🔑 *Clave:* \`${licenseKey}\`\n` +
          `👤 *Usuario:* ${data.username || 'N/A'}\n` +
          `📅 *Vence:* ${data.expires || 'N/A'}\n` +
          `📊 *Estado:* ${data.status || 'Activa'}\n` +
          `📱 *App:* ${APP_NAME}`;

        await sock.sendMessage(msg.chat, { text: responseText, edit: key });
      } else {
        await sock.sendMessage(msg.chat, { 
          text: 
            `❌ *Licencia INVÁLIDA*\n\n` +
            `🔑 *Clave:* \`${licenseKey}\`\n` +
            `📌 *Motivo:* ${data.message || 'Licencia no encontrada o expirada'}\n\n` +
            `💡 *Solución:* Genera una nueva con !key`,
          edit: key 
        });
      }
      
    } catch (error) {
      console.error('❌ Error en validación:', error);
      await msg.reply(`❌ *Error:* ${error.message}`);
    }
  },
};

// ============================================
// COMANDO: AYUDA
// ============================================
export const help = {
  command: ['keyhelp', 'ayudakey', 'helpkey'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    const responseText = 
      `📚 *Sistema de Licencias - ByPass-TopKoalas*\n\n` +
      `🔹 *Generar licencia*\n` +
      `   !key [días]\n` +
      `   Ej: !key 30  (genera 30 días)\n` +
      `   Ej: !key     (genera 30 días por defecto)\n\n` +
      `🔹 *Validar licencia*\n` +
      `   !validar CLAVE\n` +
      `   Ej: !validar 1BKN19-UFBGLG-RCWWSY\n\n` +
      `🔹 *Alias disponibles:*\n` +
      `   !gen, !generar, !licencia, !auth, !license\n\n` +
      `📌 *Tu aplicación solo usa la clave, sin necesidad de usuario*`;

    await msg.reply(responseText);
  },
};
