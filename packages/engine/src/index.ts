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
export * from "./provider-openai.js";
export * from "./provider-factory.js";
export * from "./mentions.js";
export * from "./scorers.js";
export * from "./judge.js";
export * from "./report.js";
export * from "./history.js";
export * from "./packs.js";
export * from "./evidence.js";
export * from "./insights.js";
export * from "./badge.js";
export * from "./diff.js";
export * from "./onboarding.js";
export * from "./fixit.js";
