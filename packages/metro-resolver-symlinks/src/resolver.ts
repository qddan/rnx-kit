import { isFileModuleRef, parseModuleRef } from "@rnx-kit/tools-node";
import { getAvailablePlatforms } from "@rnx-kit/tools-react-native";
import * as path from "path";
import type { MetroResolver, ModuleResolver } from "./types";

function resolveFrom(moduleName: string, startDir: string): string {
  return require.resolve(moduleName, { paths: [startDir] });
}

/**
 * Get `metro-resolver` from the cli to avoid adding another dependency that
 * needs to be kept in sync.
 */
export function getMetroResolver(fromDir = process.cwd()): MetroResolver {
  try {
    const rnPath = path.dirname(
      resolveFrom("react-native/package.json", fromDir)
    );
    const rncliPath = path.dirname(
      resolveFrom("@react-native-community/cli/package.json", rnPath)
    );
    const metroResolverPath = resolveFrom("metro-resolver", rncliPath);
    return require(metroResolverPath).resolve;
  } catch (_) {
    throw new Error(
      "Cannot find module 'metro-resolver'. This probably means that '@rnx-kit/metro-resolver-symlinks' is not compatible with the version of 'metro' that you are currently using. Please update to the latest version and try again. If the issue still persists after the update, please file a bug at https://github.com/microsoft/rnx-kit/issues."
    );
  }
}

export const remapReactNativeModule: ModuleResolver = (
  _context,
  moduleName,
  platform
) => {
  const platformImpl = getAvailablePlatforms()[platform];
  if (platformImpl) {
    if (moduleName === "react-native") {
      return platformImpl;
    } else if (moduleName.startsWith("react-native/")) {
      return `${platformImpl}/${moduleName.slice("react-native/".length)}`;
    }
  }
  return moduleName;
};

export const resolveModulePath: ModuleResolver = (
  { originModulePath },
  moduleName,
  _platform
) => {
  // Performance: Assume relative links are not going to hit symlinks
  const ref = parseModuleRef(moduleName);
  if (isFileModuleRef(ref)) {
    return moduleName;
  }

  const pkgName = ref.scope ? `${ref.scope}/${ref.name}` : ref.name;
  const pkgRoot = path.dirname(
    resolveFrom(`${pkgName}/package.json`, originModulePath)
  );
  const replaced = moduleName.replace(pkgName, pkgRoot);
  const relativePath = path.relative(path.dirname(originModulePath), replaced);
  return relativePath.startsWith(".")
    ? relativePath
    : `.${path.sep}${relativePath}`;
};
