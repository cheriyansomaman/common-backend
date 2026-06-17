const { getStore } = require("@netlify/blobs");

const OWNER = "cheriyansomaman";
const REPO = "fifa-2026-prediction";
const WORKFLOW_FILE = "live-sync.yml";
const STATUS_STORE = "trigger-status";
const STATUS_KEY = "last-run";

function statusStore() {
  return getStore({
    name: STATUS_STORE,
    consistency: "strong",
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  });
}

/**
 * @param {string} ref
 * @param {"manual"|"scheduled"} source
 * @returns {Promise<{ ok: boolean, status: number, errorText?: string }>}
 */
async function dispatchWorkflow(ref, source) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN env var not set");
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

  const result =
    githubResponse.status === 204
      ? { ok: true, status: 204 }
      : { ok: false, status: githubResponse.status, errorText: await githubResponse.text() };

  await statusStore().setJSON(STATUS_KEY, {
    ref,
    source,
    ok: result.ok,
    status: result.status,
    errorText: result.errorText,
    timestamp: new Date().toISOString(),
  });

  return result;
}

/**
 * @returns {Promise<object|null>}
 */
async function getLastRunStatus() {
  return statusStore().get(STATUS_KEY, { type: "json" });
}

module.exports = {
  dispatchWorkflow,
  getLastRunStatus,
  DEFAULT_REF: "main",
  ALLOWED_REFS: ["main"],
};
