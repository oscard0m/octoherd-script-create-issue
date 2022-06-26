import YAML from "yaml";

const { parseDocument } = YAML;

/**
 * @param {string} content
 * @param {string} nodeVersion
 *
 * @return {boolean}
 */

export function hasNodeVersionToRemove(content, nodeVersionToRemove) {
  const yamlDocument = parseDocument(
    Buffer.from(content, "base64").toString("utf-8")
  );

  const jobs = yamlDocument.get("jobs");

  for (const { value: job } of jobs.items) {
    const nodeVersions = job
      .get("strategy")
      ?.get("matrix")
      ?.get("node_version");

    if (nodeVersions) {
      for (const { value: nodeVersion } of nodeVersions.items) {
        if (nodeVersion === nodeVersionToRemove) {
          return true;
        }
      }
    }
  }

  return false;
}
