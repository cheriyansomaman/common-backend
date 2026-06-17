const { dispatchWorkflow, DEFAULT_REF, ALLOWED_REFS } = require("./lib/dispatch-workflow");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed, use POST" }),
    };
  }

  const expectedSecret = process.env.TRIGGER_SECRET;
  const providedSecret = event.headers?.["x-trigger-secret"];
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  let ref = DEFAULT_REF;
  if (event.body) {
    try {
      const parsed = JSON.parse(event.body);
      if (parsed.ref !== undefined) ref = parsed.ref;
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }
  }

  if (typeof ref !== "string" || !ALLOWED_REFS.includes(ref)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid ref, allowed: " + ALLOWED_REFS.join(", ") }),
    };
  }

  let result;
  try {
    result = await dispatchWorkflow(ref, "manual");
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }

  if (result.ok) {
    return {
      statusCode: 200,
      body: JSON.stringify({ triggered: true, ref }),
    };
  }

  console.error("GitHub dispatch failed", result.status, result.errorText);
  return {
    statusCode: 502,
    body: JSON.stringify({ error: "Failed to trigger workflow" }),
  };
};
