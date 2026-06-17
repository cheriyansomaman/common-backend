const OWNER = "cheriyansomaman";
const REPO = "fifa-2026-prediction";
const WORKFLOW_FILE = "live-sync.yml";

/**
 * @param {string} ref
 * @returns {Promise<{ ok: boolean, status: number, errorText?: string }>}
 */
async function dispatchWorkflow(ref) {
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

  if (githubResponse.status === 204) {
    return { ok: true, status: 204 };
  }

  const errorText = await githubResponse.text();
  return { ok: false, status: githubResponse.status, errorText };
}

module.exports = { dispatchWorkflow, DEFAULT_REF: "main", ALLOWED_REFS: ["main"] };
