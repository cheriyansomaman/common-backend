const OWNER = "cheriyansomaman";
const REPO = "fifa-2026-prediction";
const WORKFLOW_FILE = "live-sync.yml";
const DEFAULT_REF = "main";
const ALLOWED_REFS = ["main"];

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

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "GITHUB_TOKEN env var not set" }),
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

  const githubResponse = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "netlify-function",
      },
      body: JSON.stringify({ ref }),
    }
  );

  if (githubResponse.status === 204) {
    return {
      statusCode: 200,
      body: JSON.stringify({ triggered: true, ref }),
    };
  }

  const errorText = await githubResponse.text();
  console.error("GitHub dispatch failed", githubResponse.status, errorText);
  return {
    statusCode: 502,
    body: JSON.stringify({ error: "Failed to trigger workflow" }),
  };
};
