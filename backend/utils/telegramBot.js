// backend/utils/telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const { query } = require('../config/database');

let bot = null;

// Inicializar bot
const initBot = () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('⚠️  TELEGRAM_BOT_TOKEN no configurado. Bot de Telegram deshabilitado.');
    return null;
  }

  try {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    console.log('✅ Telegram Bot inicializado correctamente');
    
    setupCommands();
    return bot;
  } catch (error) {
    console.error('❌ Error inicializando Telegram Bot:', error.message);
    return null;
  }
};

// Configurar comandos del bot
const setupCommands = () => {
  if (!bot) return;

  // Comando /start
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🐣 *¡Bienvenido a SmartEgg Bot!*

Soy tu asistente de incubación inteligente.

*Comandos disponibles:*
/vincular - Vincular este chat con tu cuenta
/estado - Ver estado de tu incubadora
/alertas - Ver alertas recientes
/ayuda - Ver todos los comandos
/info - Información del sistema

¡Empecemos! Usa /vincular para conectar tu cuenta.
    `;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  });

  // Comando /vincular
  bot.onText(/\/vincular/, async (msg) => {
    const chatId = msg.chat.id;
    const message = `
🔗 *Vincular cuenta*

Para vincular tu cuenta de SmartEgg:

1. Ve a tu perfil en la aplicación web
2. En "Chat ID de Telegram" ingresa: \`${chatId}\`
3. Guarda los cambios

Una vez vinculado, recibirás todas las notificaciones aquí.
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  });

  // Comando /estado
  bot.onText(/\/estado/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      // Buscar usuario por chat_id
      const userResult = await query(
        'SELECT id FROM users WHERE telegram_chat_id = $1',
        [chatId.toString()]
      );

      if (userResult.rows.length === 0) {
        bot.sendMessage(chatId, '❌ No estás vinculado. Usa /vincular para conectar tu cuenta.');
        return;
      }

      const userId = userResult.rows[0].id;

      // Obtener incubaciones activas
      const incubationsResult = await query(
        "SELECT * FROM incubations WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
        [userId]
      );

      if (incubationsResult.rows.length === 0) {
        bot.sendMessage(chatId, '📭 No tienes incubaciones activas.');
        return;
      }

      const incubation = incubationsResult.rows[0];

      // Obtener última lectura de sensores
      const sensorResult = await query(
        'SELECT * FROM sensor_data WHERE incubation_id = $1 ORDER BY timestamp DESC LIMIT 1',
        [incubation.id]
      );

      const sensor = sensorResult.rows[0];

      // Obtener estado de actuadores
      const actuatorResult = await query(
        'SELECT * FROM actuators WHERE incubation_id = $1 LIMIT 1',
        [incubation.id]
      );

      const actuator = actuatorResult.rows[0];

      const stageEmojis = ['🥚', '🐣', '🥚', '🐥'];
      const stageNames = ['Calentamiento', 'Desarrollo', 'Maduración', 'Eclosión'];

      const statusMessage = `
📊 *Estado de ${incubation.name}*

*Progreso:*
📅 Día: ${incubation.days_elapsed}/21
${stageEmojis[incubation.current_stage - 1]} Etapa: ${stageNames[incubation.current_stage - 1]}
🥚 Huevos: ${incubation.number_of_eggs}

*Sensores:*
🌡 Temperatura: ${sensor?.temperature || '--'}°C
💧 Humedad: ${sensor?.humidity || '--'}%
💨 Gas: ${sensor?.gas_level || '--'} ppm
💦 Agua: ${sensor?.water_level || '--'}

*Actuadores:*
${actuator?.heater_active ? '🔥' : '❄️'} Calefactor: ${actuator?.heater_active ? 'ON' : 'OFF'}
${actuator?.ventilation_active ? '💨' : '🔇'} Ventilación: ${actuator?.ventilation_active ? 'ON' : 'OFF'}
🔄 Volteos: ${actuator?.egg_turn_count || 0}

_Última actualización: ${sensor ? new Date(sensor.timestamp).toLocaleString('es-ES') : 'N/A'}_
      `;

      bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error en comando /estado:', error);
      bot.sendMessage(chatId, '❌ Error al obtener el estado. Intenta de nuevo.');
    }
  });

  // Comando /alertas
  bot.onText(/\/alertas/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const userResult = await query(
        'SELECT id FROM users WHERE telegram_chat_id = $1',
        [chatId.toString()]
      );

      if (userResult.rows.length === 0) {
        bot.sendMessage(chatId, '❌ No estás vinculado. Usa /vincular para conectar tu cuenta.');
        return;
      }

      const userId = userResult.rows[0].id;

      // Obtener últimas 5 alertas
      const alertsResult = await query(
        `SELECT * FROM alerts 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [userId]
      );

      if (alertsResult.rows.length === 0) {
        bot.sendMessage(chatId, '✅ No hay alertas recientes. ¡Todo está bien!');
        return;
      }

      const severityEmojis = {
        critical: '🔴',
        warning: '🟡',
        info: '🔵'
      };

      let message = '🔔 *Últimas Alertas:*\n\n';

      alertsResult.rows.forEach((alert, idx) => {
        const emoji = severityEmojis[alert.severity] || '⚪';
        const date = new Date(alert.created_at).toLocaleString('es-ES', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        message += `${emoji} *${alert.title}*\n`;
        message += `   ${alert.message}\n`;
        message += `   _${date}_\n\n`;
      });

      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
      console.error('Error en comando /alertas:', error);
      bot.sendMessage(chatId, '❌ Error al obtener alertas. Intenta de nuevo.');
    }
  });

  // Comando /ayuda
  bot.onText(/\/ayuda/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 *Comandos Disponibles:*

/start - Iniciar el bot
/vincular - Obtener instrucciones para vincular tu cuenta
/estado - Ver estado actual de tu incubadora
/alertas - Ver últimas alertas
/info - Información del sistema
/ayuda - Ver esta ayuda

*Notificaciones automáticas:*
• Recibirás alertas cuando la temperatura esté fuera de rango
• Notificación cuando el nivel de agua esté bajo
• Avisos de cambio de etapa
• Confirmación de volteo de huevos

🔗 ¿Problemas? Asegúrate de estar vinculado con /vincular
    `;
    
    bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  });

  // Comando /info
  bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    const infoMessage = `
ℹ️ *SmartEgg Bot - Información*

*Sistema:* Incubadora Inteligente IoT
*Versión:* 1.0.0
*Desarrollado por:* Tu nombre

*Características:*
• Monitoreo en tiempo real
• Control automático de temperatura
• Alertas inteligentes
• Giro automático de huevos
• 21 días de incubación

🌐 *Acceso Web:*
http://localhost:5173

🤖 *Bot desarrollado con:*
Node.js + Telegram Bot API
    `;
    
    bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
  });

  console.log('✅ Comandos del bot configurados');
};

// Enviar mensaje a un chat específico
const sendMessage = async (chatId, message, options = {}) => {
  if (!bot) {
    console.log('⚠️  Bot no inicializado');
    return false;
  }

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...options });
    return true;
  } catch (error) {
    console.error('❌ Error enviando mensaje Telegram:', error.message);
    return false;
  }
};

// Enviar alerta formateada
const sendAlert = async (userId, alert) => {
  try {
    // Obtener chat_id del usuario
    const result = await query(
      'SELECT telegram_chat_id, notification_telegram FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].telegram_chat_id) {
      return false;
    }

    const user = result.rows[0];

    if (!user.notification_telegram) {
      return false; // Usuario tiene notificaciones de Telegram deshabilitadas
    }

    const severityEmojis = {
      critical: '🔴',
      warning: '🟡',
      info: '🔵'
    };

    const emoji = severityEmojis[alert.severity] || '⚪';

    const message = `
${emoji} *${alert.title}*

${alert.message}

${alert.value ? `Valor: ${alert.value}` : ''}

_${new Date().toLocaleString('es-ES')}_
    `;

    return await sendMessage(user.telegram_chat_id, message);

  } catch (error) {
    console.error('Error enviando alerta a Telegram:', error.message);
    return false;
  }
};

// Enviar notificación de volteo de huevos
const sendEggTurnNotification = async (userId, incubationName, count) => {
  try {
    const result = await query(
      'SELECT telegram_chat_id, notification_telegram FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].telegram_chat_id || !result.rows[0].notification_telegram) {
      return false;
    }

    const message = `
🔄 *Huevos Volteados*

Incubación: ${incubationName}
Volteo #${count} completado exitosamente

_${new Date().toLocaleString('es-ES')}_
    `;

    return await sendMessage(result.rows[0].telegram_chat_id, message);

  } catch (error) {
    console.error('Error enviando notificación de volteo:', error.message);
    return false;
  }
};

module.exports = {
  initBot,
  sendMessage,
  sendAlert,
  sendEggTurnNotification
};