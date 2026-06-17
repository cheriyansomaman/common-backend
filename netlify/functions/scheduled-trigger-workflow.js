const { dispatchWorkflow, DEFAULT_REF } = require("./lib/dispatch-workflow");

exports.handler = async () => {
  try {
    const result = await dispatchWorkflow(DEFAULT_REF, "scheduled");
    if (!result.ok) {
      console.error("Scheduled dispatch failed", result.status, result.errorText);
    }
  } catch (err) {
    console.error("Scheduled dispatch error", err.message);
  }

  return { statusCode: 200 };
};
