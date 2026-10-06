// Reads coverage/coverage-summary.json and writes a shields-style SVG badge.
import { readFileSync, writeFileSync } from "node:fs";

const [, , summaryPath = "coverage/coverage-summary.json", outPath = "coverage/badge.svg"] = process.argv;

const pct = Math.round(JSON.parse(readFileSync(summaryPath, "utf8")).total.statements.pct * 10) / 10;
const color = pct >= 90 ? "#4c1" : pct >= 80 ? "#a3c51c" : pct >= 70 ? "#dfb317" : pct >= 50 ? "#fe7d37" : "#e05d44";
const label = "coverage";
const value = `${pct}%`;
const labelW = 62;
const valueW = 8 + value.length * 7;
const width = labelW + valueW;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <clipPath id="r"><rect width="${width}" height="20" rx="3"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + valueW / 2}" y="14">${value}</text>
  </g>
</svg>
`;

writeFileSync(outPath, svg);
console.log(`Wrote ${outPath} (${value})`);
