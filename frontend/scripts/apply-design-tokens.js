#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "src");
const writeChanges = process.argv.includes("--write");
const reportOnly = process.argv.includes("--report");
const designPath = path.resolve(root, "..", "DESIGN.md");

const tokenMap = new Map([
  ["focus:ring-2", "focus-visible:ring-2"],
  ["focus:ring-offset-2", "focus-visible:ring-offset-2"],
  ["focus:ring-primary-500", "focus-visible:ring-primary-900"],
  ["focus:ring-primary-600", "focus-visible:ring-primary-900"],
  ["focus:ring-green-500", "focus-visible:ring-success-600"],
  ["focus:ring-red-500", "focus-visible:ring-danger-600"],
  ["shadow-md", "shadow-card"],
  ["shadow-lg", "shadow-card-hover"],
  ["shadow-2xl", "shadow-modal"],
  ["text-gray-900", "text-ink"],
  ["text-gray-800", "text-secondary-800"],
  ["text-gray-700", "text-secondary-700"],
  ["text-gray-600", "text-secondary-600"],
  ["text-gray-500", "text-secondary-500"],
  ["text-gray-400", "text-secondary-400"],
  ["text-gray-300", "text-secondary-300"],
  ["bg-gray-50", "bg-surface"],
  ["bg-gray-100", "bg-surface"],
  ["bg-gray-200", "bg-hairline-soft"],
  ["bg-gray-600", "bg-primary-900"],
  ["border-gray-100", "border-hairline-soft"],
  ["border-gray-200", "border-hairline"],
  ["border-gray-300", "border-hairline"],
  ["text-blue-900", "text-primary-900"],
  ["text-blue-800", "text-primary-900"],
  ["text-blue-700", "text-primary-900"],
  ["text-blue-600", "text-primary-900"],
  ["text-blue-500", "text-primary-900"],
  ["bg-blue-50", "bg-primary-50"],
  ["bg-blue-100", "bg-primary-100"],
  ["bg-blue-500", "bg-primary-900"],
  ["bg-blue-600", "bg-primary-900"],
  ["bg-blue-700", "bg-primary-800"],
  ["hover:bg-blue-600", "hover:bg-primary-800"],
  ["hover:bg-blue-700", "hover:bg-primary-800"],
  ["hover:text-blue-600", "hover:text-primary-900"],
  ["hover:text-blue-200", "hover:text-primary-100"],
  ["border-blue-200", "border-primary-200"],
  ["border-blue-500", "border-primary-900"],
  ["text-green-900", "text-success-900"],
  ["text-green-800", "text-success-700"],
  ["text-green-700", "text-success-700"],
  ["text-green-600", "text-success-700"],
  ["text-green-500", "text-success-600"],
  ["text-green-400", "text-success-600"],
  ["bg-green-50", "bg-success-50"],
  ["bg-green-100", "bg-success-50"],
  ["bg-green-300", "bg-success-100"],
  ["bg-green-500", "bg-success-600"],
  ["bg-green-600", "bg-success-600"],
  ["bg-green-700", "bg-success-700"],
  ["hover:bg-green-600", "hover:bg-success-700"],
  ["hover:bg-green-700", "hover:bg-success-700"],
  ["hover:text-green-200", "hover:text-success-200"],
  ["border-green-200", "border-success-200"],
  ["text-red-900", "text-danger-900"],
  ["text-red-800", "text-danger-700"],
  ["text-red-700", "text-danger-700"],
  ["text-red-600", "text-danger-700"],
  ["text-red-500", "text-danger-600"],
  ["text-red-400", "text-danger-600"],
  ["bg-red-50", "bg-danger-50"],
  ["bg-red-100", "bg-danger-50"],
  ["bg-red-500", "bg-danger-600"],
  ["bg-red-600", "bg-danger-700"],
  ["bg-red-700", "bg-danger-800"],
  ["hover:bg-red-600", "hover:bg-danger-700"],
  ["hover:bg-red-700", "hover:bg-danger-800"],
  ["border-red-200", "border-danger-200"],
  ["text-yellow-900", "text-warning-900"],
  ["text-yellow-800", "text-warning-700"],
  ["text-yellow-700", "text-warning-700"],
  ["text-yellow-600", "text-warning-700"],
  ["text-yellow-500", "text-warning-500"],
  ["text-yellow-400", "text-warning-400"],
  ["bg-yellow-50", "bg-warning-50"],
  ["bg-yellow-100", "bg-warning-50"],
  ["bg-yellow-500", "bg-warning-500"],
  ["bg-yellow-600", "bg-warning-600"],
  ["border-yellow-200", "border-warning-200"],
  ["hover:text-yellow-200", "hover:text-warning-200"],
  ["text-purple-900", "text-primary-900"],
  ["text-purple-800", "text-primary-900"],
  ["text-purple-700", "text-primary-900"],
  ["text-purple-600", "text-primary-900"],
  ["bg-purple-50", "bg-primary-50"],
  ["bg-purple-100", "bg-primary-100"],
  ["bg-purple-500", "bg-brand-purple"],
  ["bg-purple-600", "bg-brand-purple"],
  ["bg-purple-700", "bg-brand-purple"],
  ["border-purple-200", "border-primary-200"],
]);

const excludedFiles = new Set(["AuthDebug.jsx"]);
const tokenPattern = new RegExp(
  `(?:${Array.from(tokenMap.keys())
    .sort((left, right) => right.length - left.length)
    .map((token) => token.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"))
    .join("|")})`,
  "g",
);

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(entryPath);
    return entry.name.endsWith(".jsx") ? [entryPath] : [];
  });
}

function migrate(content) {
  return content.replace(tokenPattern, (token) => tokenMap.get(token));
}

function readDesignColors() {
  if (!fs.existsSync(designPath)) return new Map();
  const design = fs.readFileSync(designPath, "utf8");
  const colorsSection = design.split("## Typography")[0];
  const colors = new Map();
  const colorPattern = /^ {2}([\w-]+):\s*["']?(#[0-9a-fA-F]{6})["']?$/gm;
  for (const match of colorsSection.matchAll(colorPattern))
    colors.set(match[1], match[2]);
  return colors;
}

function printDesignContract() {
  const colors = readDesignColors();
  const required = [
    "primary",
    "canvas",
    "surface",
    "hairline",
    "ink",
    "brand-coral",
    "brand-blue",
    "success-bg",
  ];
  const missing = required.filter((name) => !colors.has(name));
  console.log(`DESIGN.md: ${colors.size} color tokens loaded`);
  if (missing.length > 0)
    console.log(`Missing required DESIGN.md tokens: ${missing.join(", ")}`);
}

function printResidualReport(files) {
  const residualPattern =
    /(?:bg-gray-|text-gray-|border-gray-|bg-blue-|text-blue-|bg-green-|text-green-|bg-red-|text-red-|bg-yellow-|text-yellow-|bg-purple-|text-purple-)/g;
  const residuals = [];
  for (const filePath of files) {
    const matches =
      fs.readFileSync(filePath, "utf8").match(residualPattern) || [];
    if (matches.length > 0)
      residuals.push(`${path.relative(root, filePath)} (${matches.length})`);
  }
  console.log(
    `Residual legacy JSX color classes: ${residuals.length === 0 ? "none" : residuals.join(", ")}`,
  );
}

const files = collectFiles(sourceDir).filter(
  (filePath) => !excludedFiles.has(path.basename(filePath)),
);
printDesignContract();
if (reportOnly) {
  printResidualReport(files);
  process.exit(0);
}
let changedFiles = 0;
let replacements = 0;

for (const filePath of files) {
  const before = fs.readFileSync(filePath, "utf8");
  const matches = before.match(tokenPattern) || [];
  if (matches.length === 0) continue;

  const after = migrate(before);
  changedFiles += 1;
  replacements += matches.length;

  if (writeChanges) fs.writeFileSync(filePath, after);
  console.log(
    `${writeChanges ? "updated" : "would update"} ${path.relative(root, filePath)} (${matches.length} token${matches.length === 1 ? "" : "s"})`,
  );
}

console.log(
  `\n${writeChanges ? "Applied" : "Planned"} ${replacements} replacements across ${changedFiles} files.`,
);
if (writeChanges) printResidualReport(files);
if (!writeChanges && replacements > 0) {
  console.log("Run with --write to apply the exact token-only migration.");
}
