#!/usr/bin/env node
// @ts-check

const fs = require("fs");
const markdownTable = require("markdown-table");
const { defaultProfiles } = require("../lib/profiles");

const README = "README.md";
const TOKEN_START = "<!-- @rnx-kit/dep-check/capabilities start -->";
const TOKEN_END = "<!-- @rnx-kit/dep-check/capabilities end -->";

/**
 * Returns whether specified capability is a core capability.
 * @param capability {string}
 * @returns {boolean}
 */
function isCoreCapability(capability) {
  return capability === "core" || capability.startsWith("core-");
}

/**
 * Compare function that places core capabilities first.
 * @param lhs {string}
 * @param rhs {string}
 * @returns {number}
 */
function sortCoreFirst(lhs, rhs) {
  if (isCoreCapability(lhs)) {
    if (!isCoreCapability(rhs)) {
      return -1;
    }
  } else if (isCoreCapability(rhs)) {
    return 1;
  }

  if (lhs === rhs) {
    return 0;
  }

  return lhs < rhs ? -1 : 1;
}

const allVersions = /** @type {import("../src/types").ProfileVersion[]} */ (
  Object.keys(defaultProfiles).reverse()
);
const allCapabilities = /** @type {import("@rnx-kit/config").Capability[]} */ (
  Object.keys(defaultProfiles[allVersions[0]]).sort(sortCoreFirst)
);

const table = markdownTable([
  ["Capability", ...allVersions],
  ...allCapabilities.map((capability) => {
    return [
      capability,
      ...allVersions.map((profileVersion) => {
        const pkg = defaultProfiles[profileVersion][capability];
        if ("version" in pkg) {
          const { name, version } = pkg;
          return `${name}@${version}`;
        } else {
          return `Meta package for installing ${pkg.capabilities
            .map((name) => `\`${name}\``)
            .join(", ")}`;
        }
      }),
    ];
  }),
]);

const readme = fs.readFileSync(README, { encoding: "utf-8" });
const updatedReadme = readme.replace(
  new RegExp(`${TOKEN_START}([^]+)${TOKEN_END}`),
  `${TOKEN_START}\n\n${table}\n\n${TOKEN_END}`
);

if (updatedReadme !== readme) {
  fs.writeFileSync(README, updatedReadme);
}
