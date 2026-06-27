/**
 * jusBrandMax CLI — Claude Code plugin entry point.
 *
 * Slash commands (`/brand-init`, `/brand-report`, `/brand-watch`) and the
 * headless `jusbrandmax` binary are wired up in M4. For now this re-exports the
 * engine version so the package has a real, buildable surface.
 */

export { VERSION } from "@jusbrandmax/engine";
