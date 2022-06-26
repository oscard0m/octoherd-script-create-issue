// @ts-check
import { hasNodeVersionToRemove } from "./utils/yaml-parser.js";

const PATH = ".github/workflows/test.yml";
const NODE_VERSION_TO_REMOVE = 10;

/**
 * Check if a filename is a YAML file
 *
 * @param {string} fileName FileName to be tested
 *
 * @return {boolean}
 */
const isYamlFile = (fileName) => /\.ya?ml$/.test(fileName);

/**
 * Creates an issue on each repo when a certain condition or group of conditions are accomplished
 *
 * @param {import('@octoherd/cli').Octokit} octokit
 * @param {import('@octoherd/cli').Repository} repository
 */
export async function script(octokit, repository) {
  if (repository.archived) {
    octokit.log.info(`${repository.html_url} is archived, ignoring.`);
    return;
  }

  // Global variables used throughout the code
  const owner = repository.owner.login;
  const repo = repository.name;
  let file;

  // Get all files from .github/workflows folder
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path: PATH,
      }
    );

    file = data;

    if (Array.isArray(file)) {
      throw new Error(
        `"${PATH}" is should not be a folder in ${repository.full_name}`
      );
    }
  } catch (e) {
    if (e.status === 404) {
      octokit.log.warn(`"${PATH}" path not found in ${repository.full_name}`);
      return;
    } else {
      throw e;
    }
  }

  if (file) {
    octokit.log.info("Checking '%s' in '%s' repo", file.name, repo);

    if (
      file.content &&
      hasNodeVersionToRemove(file.content, NODE_VERSION_TO_REMOVE)
    ) {
      octokit.log.warn(
        "The repository '%s' HAS a node_version %s to be removed in its GitHub Actions.\n %s",
        repo,
        `${NODE_VERSION_TO_REMOVE}`,
        repository.html_url
      );

      const { data } = await octokit.request(
        "POST /repos/{owner}/{repo}/issues",
        {
          owner,
          repo,
          title: `Remove Node version ${NODE_VERSION_TO_REMOVE} from ${PATH}`,
          body: `# Description\nNode v${NODE_VERSION_TO_REMOVE} has been deprecated so there is no need to keep giving support to it in our CI.\n# Context\nYou can find more details [here](https://github.com/orgs/octokit/teams/js-community/discussions/6)`,
          labels: ["maintenance"],
          assignee: "oscard0m",
        }
      );

      octokit.log.info("Issue created for '%s': %s", repo, data.html_url);
    } else {
      octokit.log.info(
        "The repository '%s' does not have any usage of node_version %s to be removed in its GitHub Actions",
        repo,
        `${NODE_VERSION_TO_REMOVE}`
      );
    }
  } else {
    octokit.log.info("There is no file %s in repository %s", PATH, repo);
  }
}
