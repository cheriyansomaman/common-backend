const CLIENT_ID_PATTERN = /^[A-Za-z0-9_]+$/;

/**
 * @param {string} clientId
 * @returns {boolean}
 */
function isValidClientId(clientId) {
  return typeof clientId === "string" && CLIENT_ID_PATTERN.test(clientId);
}

/**
 * @param {string} clientId
 * @returns {{ token?: string, chatId?: string }}
 */
function getClientTelegramConfig(clientId) {
  const prefix = clientId.toUpperCase();
  return {
    token: process.env[`${prefix}_TELEGRAM_TOKEN`],
    chatId: process.env[`${prefix}_TELEGRAM_CHAT_ID`],
  };
}

/**
 * @param {string} clientId
 * @param {string} text
 * @returns {Promise<{ ok: boolean, status: number, errorText?: string }>}
 */
async function sendTelegramMessage(clientId, text) {
  const { token, chatId } = getClientTelegramConfig(clientId);
  if (!token || !chatId) {
    throw new Error(`Telegram config missing for client "${clientId}"`);
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (response.ok) {
    return { ok: true, status: response.status };
  }

  return { ok: false, status: response.status, errorText: await response.text() };
}

module.exports = {
  isValidClientId,
  sendTelegramMessage,
};
