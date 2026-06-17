const { getLastRunStatus } = require("./lib/dispatch-workflow");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed, use GET" }),
    };
  }

  const lastRun = await getLastRunStatus();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lastRun }),
  };
};
