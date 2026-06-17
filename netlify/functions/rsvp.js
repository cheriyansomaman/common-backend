const { isValidClientId, sendTelegramMessage } = require("./lib/telegram");

const RSVP_VALUES = ["Comming", "Not comming"];

/**
 * @param {unknown} body
 * @returns {{ error: string } | { name: string, message: string, numberOfPeople?: number }}
 */
function parseRsvpBody(body) {
  if (typeof body?.name !== "string" || body.name.trim() === "") {
    return { error: "name is required" };
  }
  if (typeof body?.message !== "string" || !RSVP_VALUES.includes(body.message)) {
    return { error: `message is required, allowed: ${RSVP_VALUES.join(", ")}` };
  }
  if (body.numberOfPeople !== undefined) {
    if (typeof body.numberOfPeople !== "number" || !Number.isInteger(body.numberOfPeople) || body.numberOfPeople < 1) {
      return { error: "numberOfPeople must be a positive integer" };
    }
  }
  return {
    name: body.name.trim(),
    message: body.message,
    numberOfPeople: body.numberOfPeople,
  };
}

/**
 * @param {{ name: string, message: string, numberOfPeople?: number }} rsvp
 * @returns {string}
 */
function buildTelegramText(rsvp) {
  const lines = [`RSVP from ${rsvp.name}`, `Status: ${rsvp.message}`];
  if (rsvp.numberOfPeople !== undefined) {
    lines.push(`Number of people: ${rsvp.numberOfPeople}`);
  }
  return lines.join("\n");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed, use POST" }),
    };
  }

  const clientId = event.queryStringParameters?.clientId;
  if (!isValidClientId(clientId)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid or missing client id" }),
    };
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const rsvp = parseRsvpBody(parsedBody);
  if ("error" in rsvp) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: rsvp.error }),
    };
  }

  let result;
  try {
    result = await sendTelegramMessage(clientId, buildTelegramText(rsvp));
  } catch (err) {
    console.error("Telegram config error", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }

  if (result.ok) {
    return {
      statusCode: 200,
      body: JSON.stringify({ sent: true }),
    };
  }

  console.error("Telegram send failed", result.status, result.errorText);
  return {
    statusCode: 502,
    body: JSON.stringify({ error: "Failed to send telegram message" }),
  };
};
