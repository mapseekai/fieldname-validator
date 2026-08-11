import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { subset, validRange } from "semver";

const packageDirectory = fileURLToPath(new URL("..", import.meta.url));
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const packageLock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);

const supportedNodeRange = packageJson.engines?.node;
if (
  typeof supportedNodeRange !== "string" ||
  validRange(supportedNodeRange) === null
) {
  throw new Error("package.json must declare a valid engines.node range");
}

if (packageLock.packages?.[""]?.engines?.node !== supportedNodeRange) {
  throw new Error("package-lock.json root engines.node must match package.json");
}

const incompatiblePackages = [];
let checkedPackages = 0;

for (const [packagePath, packageMetadata] of Object.entries(
  packageLock.packages ?? {},
)) {
  if (packagePath === "" || packageMetadata.optional === true) {
    continue;
  }

  checkedPackages += 1;
  const dependencyNodeRange = packageMetadata.engines?.node;
  if (dependencyNodeRange === undefined) {
    continue;
  }
  if (
    typeof dependencyNodeRange !== "string" ||
    validRange(dependencyNodeRange) === null ||
    !subset(supportedNodeRange, dependencyNodeRange)
  ) {
    incompatiblePackages.push(
      `${packagePath} (${packageMetadata.version ?? "unknown"}) requires Node ${String(dependencyNodeRange)}`,
    );
  }
}

if (incompatiblePackages.length !== 0) {
  throw new Error(
    `Non-optional lockfile packages do not support ${supportedNodeRange}:\n${incompatiblePackages.join("\n")}`,
  );
}

console.log(
  `Verified ${checkedPackages} non-optional lockfile packages support Node ${supportedNodeRange} (${packageDirectory}).`,
);
