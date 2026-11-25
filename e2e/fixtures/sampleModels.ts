/**
 * Synthetic offline LDraw (.ldr) fixtures using built-in procedural parts so the
 * UI & feature E2E suite runs deterministically with zero external network calls.
 */

export const CLEAN_MULTI_STEP_LDR = [
  '0 Title: Test Tower',
  '0 Name: test-tower.ldr',
  '0 Author: UI Audit Suite',
  // Layer 1: Base plates (2x4 plates side by side)
  '1 72 -40 0 0 1 0 0 0 1 0 0 0 1 3020.dat',
  '1 72 40 0 0 1 0 0 0 1 0 0 0 1 3020.dat',
  '0 STEP',
  // Layer 2: Red 2x4 bricks bridging base
  '1 4 -40 -24 0 1 0 0 0 1 0 0 0 1 3001.dat',
  '1 4 40 -24 0 1 0 0 0 1 0 0 0 1 3001.dat',
  '0 STEP',
  // Layer 3: Blue 2x2 bricks on top
  '1 1 -20 -48 0 1 0 0 0 1 0 0 0 1 3003.dat',
  '1 1 20 -48 0 1 0 0 0 1 0 0 0 1 3003.dat',
  '0 STEP',
  // Layer 4: Yellow 1x2 plates capping the structure
  '1 14 -20 -56 0 1 0 0 0 1 0 0 0 1 3023.dat',
  '1 14 20 -56 0 1 0 0 0 1 0 0 0 1 3023.dat',
  '0 STEP',
].join('\n');

export const MISSING_PART_LDR = [
  '0 Title: Missing Part Check',
  '0 Name: missing-part-check.ldr',
  '0 Author: UI Audit Suite',
  '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat',
  '1 1 0 -24 0 1 0 0 0 1 0 0 0 1 999999nonexistent.dat',
  '0 STEP',
].join('\n');
