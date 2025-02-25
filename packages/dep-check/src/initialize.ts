import { readPackage } from "@rnx-kit/tools-node/package";
import { capabilitiesFor } from "./capabilities";
import { modifyManifest } from "./helpers";
import type { CapabilitiesOptions } from "./types";

export function initializeConfig(
  packageManifest: string,
  options: CapabilitiesOptions
): void {
  const manifest = readPackage(packageManifest);
  if (manifest["rnx-kit"]?.["capabilities"]) {
    return;
  }

  const capabilities = capabilitiesFor(manifest, options);
  if (!capabilities?.capabilities?.length) {
    return;
  }

  const updatedManifest = {
    ...manifest,
    "rnx-kit": {
      ...manifest["rnx-kit"],
      ...capabilities,
    },
  };
  modifyManifest(packageManifest, updatedManifest);
}
