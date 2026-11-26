import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  listProductCanvasFiles,
  rowIsViolation,
  runCensus,
} from '../scripts/typography-census.mjs';

const scratch = [];

afterEach(() => {
  while (scratch.length) rmSync(scratch.pop(), { recursive: true, force: true });
});

function fixtureCanvas(html) {
  const root = mkdtempSync(join(tmpdir(), 'typo-census-'));
  scratch.push(root);
  writeFileSync(
    join(root, 'fixture.canvas'),
    JSON.stringify({
      nodes: {
        var_fixture: { type: 'variant', label: 'fixture', html },
      },
    }),
  );
  return root;
}

const tokenRoot = `
:root {
  --font-base: 1rem;
  --font-sans: system-ui, sans-serif;
  --text-sm: calc(var(--font-base) * 0.875);
  --leading-ui: 1.45;
  --tracking-tight: -0.01em;
}
`;

describe('typography census product scope', () => {
  it('includes pantry in the default census scope', () => {
    const files = listProductCanvasFiles('.kombai/canvas');
    const names = files.map((file) => file.split('/').pop().replace('.canvas', ''));
    expect(names).toContain('pantry');
    expect(names).toContain('recipe');
    expect(names).toContain('saved');
    expect(names).not.toContain('type');
    expect(names).not.toContain('chef-llama');

    const { report } = runCensus({ canvasDir: '.kombai/canvas', quiet: true });
    expect(report.scope).toContain('pantry');
  });
});

describe('typography census --strict off-token leading/tracking', () => {
  it('fails --strict when leading is an off-token numeric value', () => {
    const dir = fixtureCanvas(`<style>${tokenRoot}
.p { font-family: var(--font-sans); font-size: var(--text-sm); line-height: 1.3; }
</style><p class="p">x</p>`);
    const { report, exitCode } = runCensus({ canvasDir: dir, quiet: true, strict: true });
    expect(report.violations.length).toBeGreaterThan(0);
    expect(report.violations.some((v) => v.leading === 1.3)).toBe(true);
    expect(exitCode).toBe(1);
    expect(rowIsViolation({ sizeToken: 'sm', sizePx: 14, leading: 1.3, tracking: 'absent', weight: null, face: 'sans' })).toBe(true);
  });

  it('fails --strict when tracking is an off-token numeric value', () => {
    const dir = fixtureCanvas(`<style>${tokenRoot}
.p { font-family: var(--font-sans); font-size: var(--text-sm); letter-spacing: -0.015em; }
</style><p class="p">x</p>`);
    const { report, exitCode } = runCensus({ canvasDir: dir, quiet: true, strict: true });
    expect(report.violations.length).toBeGreaterThan(0);
    expect(report.violations.some((v) => v.tracking === -0.015)).toBe(true);
    expect(exitCode).toBe(1);
    expect(rowIsViolation({ sizeToken: 'sm', sizePx: 14, leading: 'absent', tracking: -0.015, weight: null, face: 'sans' })).toBe(true);
  });
});
