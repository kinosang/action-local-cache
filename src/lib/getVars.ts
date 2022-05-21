import { join, resolve, parse } from "path";
import { homedir } from "os";

import * as core from "@actions/core";
import { getInputAsArray } from "../util/actionUtils";
import { Inputs } from "../constants";

const { GITHUB_REPOSITORY, RUNNER_TOOL_CACHE } = process.env;
export const workspace = process.env["GITHUB_WORKSPACE"] ?? process.cwd();

interface CacheTarget {
  origPath: string;
  cachePath: string;
  targetPath: string;
  targetDir: string;
  cacheDir: string;
}
interface InputOptions {
  key: string;
  paths: string[];
}
interface Vars {
  rootCacheDir: string;
  options: InputOptions;
  cacheTargets: CacheTarget[];
}

function buildCacheTargets(rootCacheDir: string, paths: string[]): CacheTarget[] {
  return paths.map((path): CacheTarget => {
    const originPath = path.startsWith('~/')?
      join(homedir(), path.slice(2)) :
      path;
    const targetPath = resolve(workspace, originPath);
    const cachePath = join(rootCacheDir, path);
    return {
      origPath: path,
      cachePath: cachePath,
      targetPath: targetPath,
      targetDir: parse(targetPath).dir,
      cacheDir: parse(cachePath).dir,
    };
  });
}

export const getVars = (): Vars => {
  if (!RUNNER_TOOL_CACHE) {
    throw new TypeError("Expected RUNNER_TOOL_CACHE environment variable to be defined.");
  }

  if (!GITHUB_REPOSITORY) {
    throw new TypeError("Expected GITHUB_REPOSITORY environment variable to be defined.");
  }

  const options: InputOptions = {
    key: core.getInput(Inputs.Key) || "no-key",
    paths: getInputAsArray(Inputs.Path, { required: true }),
  };

  const rootCacheDir = join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, options.key);
  const cacheTargets = buildCacheTargets(rootCacheDir, options.paths);

  return {
    rootCacheDir,
    options,
    cacheTargets,
  };
};
