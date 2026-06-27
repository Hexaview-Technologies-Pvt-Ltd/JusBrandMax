/**
 * jusBrandMax engine — public entry point.
 *
 * Everything in this package is MIT-licensed and computes Brand Visibility on
 * Claude from auditable, inspectable code. Scorers live in `./scorers`, the
 * Claude provider in `./provider`, persistence in `./history`, and report
 * rendering in `./report`. These land in later milestones (M1–M3).
 */

export const VERSION = "0.1.0";

export * from "./config.js";
export * from "./provider.js";
export * from "./mentions.js";
export * from "./scorers.js";
export * from "./judge.js";
