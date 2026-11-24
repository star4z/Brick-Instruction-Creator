import { describe, expect, it } from 'vitest';
import { parseLDrawSource } from '../ldrawParser';
import { getStudioOriginOffset, isStudioAuthoredSource } from '../studioPartOrigins';

// Bag placement taken from a real BrickLink Studio export (Muni Metro LRV4 "Passenger with pink vibes").
const BAG_LINE =
  '1 26 -10.646580 -25.487350 -31.964040 -0.001157 0.536476 0.843915 -0.962047 0.229693 -0.147335 -0.272883 -0.812056 0.515849 93091.dat';

describe('BrickLink Studio part origin corrections', () => {
  it('detects Studio-authored sources from Studio meta lines', () => {
    expect(isStudioAuthoredSource('0 FILE a.ldr\n0 FlexibleBrickControlPointUnitLength -1\n')).toBe(true);
    expect(isStudioAuthoredSource('0 NumOfBricks:  6\n')).toBe(true);
    expect(isStudioAuthoredSource('0 Name: a.ldr\n0 Author: someone\n1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat\n')).toBe(false);
    expect(getStudioOriginOffset('93091')).toEqual([0, -28.5, 0]);
    expect(getStudioOriginOffset('3001')).toBeNull();
  });

  it('moves the 93091 handbag handle into the hand grip for Studio exports only', () => {
    const studio = `0 FILE fig.ldr\n0 FlexibleBrickControlPointUnitLength -1\n${BAG_LINE}\n`;
    const plain = `0 FILE fig.ldr\n0 Author: someone\n${BAG_LINE}\n`;
    const studioBag = parseLDrawSource(studio, 'fig.ldr', 'ldr').parts[0];
    const plainBag = parseLDrawSource(plain, 'fig.ldr', 'ldr').parts[0];

    // Plain LDraw sources are untouched (Y-up flips y/z of the LDraw coordinates)
    expect(plainBag.position[0]).toBeCloseTo(-10.6466, 3);
    expect(plainBag.position[1]).toBeCloseTo(25.4874, 3);
    expect(plainBag.position[2]).toBeCloseTo(31.964, 3);

    // Studio: the LDraw origin (handle bar center) moves 28.5 LDU up the bag's local axis so the
    // handle bar runs straight through the right hand's grip center
    // (≈ LDraw [-25.95, -41.33, -11.12]), which sits 9.6 LDU along the bar from its center.
    expect(studioBag.position[0]).toBeCloseTo(-25.936, 2);
    expect(studioBag.position[1]).toBeCloseTo(32.033, 2);
    expect(studioBag.position[2]).toBeCloseTo(8.82, 2);
    const grip = [-25.946, 41.334, 11.117];
    const barDir = [-0.001157, 0.962047, 0.272883]; // bag local X (handle axis) in Y-up
    const d = grip.map((g, i) => g - studioBag.position[i]);
    const along = d[0] * barDir[0] + d[1] * barDir[1] + d[2] * barDir[2];
    const perp = Math.hypot(...d.map((v, i) => v - along * barDir[i]));
    expect(perp).toBeLessThan(1);
    expect(Math.abs(along)).toBeLessThan(11.75); // within the handle bar length
  });

  it('does not offset parts whose Studio geometry is embedded in the file', () => {
    const src = `0 FILE fig.ldr\n0 FlexibleBrickControlPointUnitLength -1\n${BAG_LINE}\n`;
    const bag = parseLDrawSource(src, 'fig.ldr', 'io', { '93091': '0 embedded\n3 16 0 0 0 1 0 0 0 1 0' }).parts[0];
    expect(bag.position[1]).toBeCloseTo(25.4874, 3);
  });
});
