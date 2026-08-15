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
// COMANDO PRINCIPAL - GENERAR LICENCIA CON DÍAS OBLIGATORIOS
// ============================================
export default {
  command: ['key', 'auth', 'licencia', 'license', 'gen', 'generar'],
  category: 'admin',
  run: async ({ msg, sock, args, command }) => {
    
    // ============================================
    // VALIDACIÓN: SI NO HAY ARGUMENTOS, MOSTRAR ERROR
    // ============================================
    if (!args || args.length === 0) {
      return msg.reply(
        `❌ *Falta especificar los días*\n\n` +
        `📌 *Uso correcto:*\n` +
        `!key [días]\n\n` +
        `📌 *Ejemplos:*\n` +
        `!key 1   - Licencia de 1 día\n` +
        `!key 7   - Licencia de 7 días\n` +
        `!key 30  - Licencia de 30 días\n` +
        `!key 365 - Licencia de 1 año\n\n` +
        `💡 *Recuerda:* Debes especificar cuántos días quieres que dure la licencia.`
      );
    }
    
    // Obtener los días del argumento
    const dias = parseInt(args[0]);
    
    // Validar que sea un número válido
    if (isNaN(dias) || dias <= 0) {
      return msg.reply(
        `❌ *El valor debe ser un número válido*\n\n` +
        `📌 *Ejemplos:*\n` +
        `!key 1   - Licencia de 1 día\n` +
        `!key 7   - Licencia de 7 días\n` +
        `!key 30  - Licencia de 30 días\n` +
        `!key 365 - Licencia de 1 año`
      );
    }
    
    // Validar rango (mínimo 1, máximo 365)
    if (dias < 1 || dias > 365) {
      return msg.reply(
        `❌ *Los días deben ser entre 1 y 365*\n\n` +
        `📌 *Ejemplos:*\n` +
        `!key 1   - 1 día\n` +
        `!key 7   - 7 días\n` +
        `!key 30  - 30 días\n` +
        `!key 365 - 1 año`
      );
    }

    try {
      // Mostrar mensaje de espera
      const { key } = await sock.sendMessage(
        msg.chat,
        { text: `⏳ *Generando licencia de ${dias} día${dias > 1 ? 's' : ''}...*` },
        { quoted: msg }
      );

      // Generar nombre de usuario automático (solo para KeyAuth, no lo usa el usuario)
      const autoUser = `user_${Date.now().toString(36)}`;
      
      // Construir URL para crear licencia
      const url = `${BASE_URL}/seller/?sellerkey=${SELLER_KEY}&type=add&appname=${APP_NAME}&username=${autoUser}&duration=${dias}`;
      
      const data = await fetchWithRetry(url);
      
      if (data.success) {
        const licenseKey = data.key || data.keys?.[0] || 'N/A';
        
        // Calcular fecha de expiración
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
            `💡 *Solución:* Genera una nueva con !key [días]`,
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
      `   Ej: !key 1   (1 día)\n` +
      `   Ej: !key 7   (7 días)\n` +
      `   Ej: !key 30  (30 días)\n` +
      `   Ej: !key 365 (1 año)\n\n` +
      `🔹 *Validar licencia*\n` +
      `   !validar CLAVE\n` +
      `   Ej: !validar 1BKN19-UFBGLG-RCWWSY\n\n` +
      `🔹 *Alias disponibles:*\n` +
      `   !gen, !generar, !licencia, !auth, !license\n\n` +
      `📌 *Importante:* Debes especificar los días, no se acepta solo !key\n` +
      `📌 *Rango permitido:* 1 a 365 días`;

    await msg.reply(responseText);
  },
};
