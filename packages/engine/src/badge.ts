/**
 * Shareable visibility badge — a self-contained SVG ("brand visibility on Claude: 56/100")
 * a brand can embed on its site. Zero-dependency string template.
 */
import type { BrandReport } from "./report.js";

export function renderBadge(r: BrandReport): string {
  const label = `brand visibility on ${r.engine}`;
  const value = `${r.overall}/100`;
  const color = r.overall >= 70 ? "#1a7f37" : r.overall >= 40 ? "#9a6700" : "#cf222e";
  const lw = 6.2 * label.length + 12;
  const vw = 6.2 * value.length + 12;
  const w = Math.round(lw + vw);
  const lwR = Math.round(lw);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">
<rect width="${lwR}" height="20" fill="#555"/>
<rect x="${lwR}" width="${w - lwR}" height="20" fill="${color}"/>
<g fill="#fff" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${Math.round(lwR / 2)}" y="14" text-anchor="middle">${label}</text>
<text x="${Math.round(lwR + (w - lwR) / 2)}" y="14" text-anchor="middle">${value}</text>
</g></svg>`;
}
