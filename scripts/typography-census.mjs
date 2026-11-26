#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_CANVAS_DIR = '.kombai/canvas';
const MANIFEST = 'typography.manifest.json';
/** Specimen plate and superseded monolith — not product surfaces. */
const NON_PRODUCT = new Set(['type', 'chef-llama']);
const MANIFEST_SCOPE = ['sizes', 'leadings', 'trackings', 'weights', 'faces'];

export const leadingToken = (ratio) => {
  const map = { 1: 'leading-solid', 1.2: 'leading-tight', 1.45: 'leading-ui', 1.55: 'leading-body' };
  return map[ratio] ?? null;
};

export const trackingToken = (em) => {
  const map = { 0: 'zero', '-0.01': 'tracking-tight', '-0.02': 'tracking-display', '0.14': 'tracking-caps' };
  return map[String(em)] ?? null;
};

/** Default product scope: every top-level `*.canvas` except NON_PRODUCT. */
export function listProductCanvasFiles(canvasDir = DEFAULT_CANVAS_DIR, { all = false } = {}) {
  return readdirSync(canvasDir)
    .filter((file) => file.endsWith('.canvas'))
    .filter((file) => {
      const name = file.replace(/\.canvas$/, '');
      return all || !NON_PRODUCT.has(name);
    })
    .map((file) => join(canvasDir, file))
    .sort();
}

export function rowIsViolation(row) {
  const offSize = row.sizeToken === null && row.sizePx !== null;
  const offLeading =
    row.leading === 'unnamed' || (typeof row.leading === 'number' && leadingToken(row.leading) === null);
  const offTracking =
    row.tracking === 'unnamed' || (typeof row.tracking === 'number' && trackingToken(row.tracking) === null);
  const offWeight = row.weight !== null && ![400, 700].includes(row.weight);
  const offFace = row.face.startsWith('literal:') || row.face === 'inherit';
  return offSize || offLeading || offTracking || offWeight || offFace;
}

const stripComments = (raw) =>
  raw
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

const unescapeCss = (text) => text.replace(/\\n/g, '\n');

function parseRules(css) {
  const rules = [];
  const stack = [];
  let buffer = '';
  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === '{') {
      stack.push(buffer.trim());
      buffer = '';
    } else if (char === '}') {
      const prelude = stack.pop();
      if (prelude !== undefined && !prelude.startsWith('@')) {
        rules.push({
          selector: prelude,
          body: buffer,
          conditions: stack.filter((entry) => entry.startsWith('@')),
        });
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

function declarationsOf(body) {
  const out = [];
  for (const chunk of body.split(';')) {
    const at = chunk.indexOf(':');
    if (at === -1) continue;
    out.push({ property: chunk.slice(0, at).trim().toLowerCase(), value: chunk.slice(at + 1).trim() });
  }
  return out;
}

function rootTokens(css) {
  const tokens = new Map();
  for (const rule of parseRules(css)) {
    if (rule.selector !== ':root') continue;
    for (const decl of declarationsOf(rule.body)) {
      if (decl.property.startsWith('--')) tokens.set(decl.property, decl.value);
    }
  }
  return tokens;
}

function resolveVars(value, tokens, depth = 0) {
  if (depth > 8) return value;
  let changed = false;
  const next = value.replace(/var\(\s*(--[\w-]+)\s*\)/g, (whole, name) => {
    if (!tokens.has(name)) return whole;
    changed = true;
    return tokens.get(name);
  });
  return changed ? resolveVars(next, tokens, depth + 1) : next;
}

function lengthInPx(value, tokens) {
  const resolved = resolveVars(value, tokens).replace(/\s+/g, '');
  const plain = /^(-?[\d.]+)(rem|px)$/.exec(resolved);
  if (plain) {
    const n = Number(plain[1]);
    return plain[2] === 'rem' ? n * 16 : n;
  }
  const calc = /^calc\((-?[\d.]+)(rem|px)\*(-?[\d.]+)([a-z%]*)\)$/.exec(resolved);
  if (calc) {
    const n = Number(calc[1]) * Number(calc[3]);
    const unit = calc[2];
    return unit === 'rem' ? n * 16 : n;
  }
  const em = /^(-?[\d.]+)em$/.exec(resolved);
  if (em) return { em: Number(em[1]) };
  return null;
}

function unitless(value, tokens) {
  const resolved = resolveVars(value, tokens).replace(/\s+/g, '');
  const n = Number(resolved);
  return Number.isFinite(n) ? n : null;
}

function faceOf(value, tokens) {
  const resolved = resolveVars(value, tokens).trim();
  if (resolved === 'var(--font-sans)' || value.includes('--font-sans')) return 'sans';
  if (resolved === 'var(--font-mono)' || value.includes('--font-mono')) return 'mono';
  if (resolved === 'var(--font-display)' || value.includes('--font-display')) return 'display';
  if (resolved === 'inherit') return 'inherit';
  return `literal:${resolved.split(',')[0].trim()}`;
}

export function collectCanvas(file) {
  const raw = readFileSync(file, 'utf8');
  const data = JSON.parse(stripComments(raw));
  const name = file.split('/').pop().replace('.canvas', '');
  const nodes = [];
  for (const [id, node] of Object.entries(data.nodes || {})) {
    if (!node.html) continue;
    nodes.push({ id, label: node.label || id, html: unescapeCss(node.html) });
  }
  return { name, nodes };
}

export function rowsFor(canvas) {
  const rows = [];
  for (const node of canvas.nodes) {
    const css = [...node.html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    const tokens = rootTokens(css);
    const fontBase = unitless(tokens.get('--font-base') || '1rem', tokens) ?? 16;
    const ladder = new Map();
    for (const [name, value] of tokens) {
      if (!name.startsWith('--text-')) continue;
      const px = lengthInPx(value, tokens);
      if (typeof px === 'number') ladder.set(px.toFixed(2), name.replace('--text-', ''));
    }
    const push = (selector, decls, conditions) => {
      const byProperty = new Map(decls.map((d) => [d.property, d.value]));
      if (![...byProperty.keys()].some((p) => ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing'].includes(p))) return;
      const sizeValue = byProperty.get('font-size');
      let sizePx = sizeValue ? lengthInPx(sizeValue, tokens) : null;
      if (typeof sizePx === 'object' && sizePx?.em) sizePx = sizePx.em * fontBase;
      const sizeToken = typeof sizePx === 'number' ? ladder.get(Number(sizePx).toFixed(2)) ?? null : null;

      const leadingValue = byProperty.get('line-height');
      let leading = 'absent';
      if (leadingValue !== undefined) {
        if (/^normal$/i.test(leadingValue.trim())) leading = 'unnamed';
        else {
          const asNumber = unitless(leadingValue, tokens);
          if (asNumber !== null) leading = Number(asNumber.toFixed(3));
          else {
            const px = lengthInPx(leadingValue, tokens);
            leading = typeof px === 'number' && sizePx ? Number((px / sizePx).toFixed(3)) : 'unnamed';
          }
        }
      }

      const trackingValue = byProperty.get('letter-spacing');
      let tracking = 'absent';
      if (trackingValue !== undefined) {
        const resolved = resolveVars(trackingValue, tokens).replace(/\s+/g, '');
        const em = /^(-?[\d.]+)em$/.exec(resolved);
        const px = /^(-?[\d.]+)px$/.exec(resolved);
        if (em) tracking = Number(em[1]);
        else if (px && sizePx) tracking = Number((Number(px[1]) / sizePx).toFixed(4));
        else if (Number(resolved) === 0 || resolved === '0') tracking = 0;
        else tracking = 'unnamed';
      }

      rows.push({
        canvas: canvas.name,
        node: node.id,
        label: node.label,
        selector: selector.replace(/\s+/g, ' ').trim().slice(0, 90),
        conditions,
        face: byProperty.has('font-family') ? faceOf(byProperty.get('font-family'), tokens) : 'absent',
        sizePx: typeof sizePx === 'number' ? Number(sizePx.toFixed(2)) : null,
        sizeToken,
        weight: byProperty.has('font-weight') ? Number(byProperty.get('font-weight')) : null,
        leading,
        tracking,
      });
    };
    for (const rule of parseRules(css)) push(rule.selector, declarationsOf(rule.body), rule.conditions);
    for (const match of node.html.matchAll(/style="([^"]*)"/g)) {
      const decls = declarationsOf(match[1]);
      if (decls.length) push('inline style', decls, []);
    }
  }
  return rows;
}

function tally(collection, pick, label) {
  const seen = new Map();
  for (const row of collection) {
    const value = pick(row);
    if (value === 'absent') continue;
    seen.set(value, (seen.get(value) ?? 0) + 1);
  }
  const entries = [...seen.entries()].sort((a, b) => b[1] - a[1]);
  return { label, distinct: entries.length, total: entries.reduce((n, [, c]) => n + c, 0), entries };
}

export function buildReport(rows, scope) {
  const sizes = tally(rows, (row) => {
    if (row.sizeToken === null && row.sizePx === null) return 'absent';
    return row.sizeToken ?? `off-token ${row.sizePx}`;
  }, 'size');
  const weights = tally(rows, (row) => (row.weight === null ? 'absent' : `weight ${row.weight}`), 'weight');
  const faces = tally(rows, (row) => row.face, 'face');

  const leadings = tally(rows, (row) => {
    if (row.leading === 'absent') return 'absent';
    if (row.leading === 'unnamed') return 'unnamed';
    return leadingToken(row.leading) ?? `off-token ${row.leading}`;
  }, 'leading');

  const trackings = tally(rows, (row) => {
    if (row.tracking === 'absent') return 'absent';
    if (row.tracking === 'unnamed') return 'unnamed';
    return trackingToken(row.tracking) ?? `off-token ${row.tracking}`;
  }, 'tracking');

  const coverage = () => {
    const namedKeys = {
      sizes: (key) => !key.startsWith('off-token'),
      leadings: (key) => key.startsWith('leading-'),
      trackings: (key) => key === 'zero' || key.startsWith('tracking-'),
      weights: (key) => key === 'weight 400' || key === 'weight 700',
      faces: (key) => ['sans', 'mono', 'display'].includes(key),
    };
    const build = (bucket, accepts) => {
      const named = bucket.entries.filter(([key]) => accepts(key)).reduce((n, [, count]) => n + count, 0);
      return {
        distinct: bucket.distinct,
        declarations: bucket.total,
        named,
        percent: bucket.total ? Number(((named / bucket.total) * 100).toFixed(1)) : 100,
      };
    };
    const byAxis = {
      sizes: build(sizes, namedKeys.sizes),
      leadings: build(leadings, namedKeys.leadings),
      trackings: build(trackings, namedKeys.trackings),
      weights: build(weights, namedKeys.weights),
      faces: build(faces, namedKeys.faces),
    };
    byAxis.violations = Object.fromEntries(Object.entries(byAxis).map(([axis, bucket]) => [axis, bucket.declarations - bucket.named]));
    return byAxis;
  };

  const comboKey = (row) =>
    [row.face, row.sizeToken ?? `off:${row.sizePx}`, row.weight ?? '-', leadingToken(row.leading) ?? row.leading, trackingToken(row.tracking) ?? row.tracking].join(' | ');

  const combos = new Map();
  for (const row of rows) {
    if (row.sizeToken === null) continue;
    const key = comboKey(row);
    const entry = combos.get(key) ?? { key, count: 0, nodes: new Set(), samples: [] };
    entry.count += 1;
    entry.nodes.add(`${row.canvas}/${row.node}`);
    if (entry.samples.length < 2) entry.samples.push(`${row.selector} (${row.canvas})`);
    combos.set(key, entry);
  }

  const violations = rows.filter(rowIsViolation).map((row) => ({
    where: `${row.canvas}/${row.node}`,
    selector: row.selector,
    size: row.sizeToken ?? row.sizePx,
    weight: row.weight,
    leading: typeof row.leading === 'number' ? (leadingToken(row.leading) ?? row.leading) : row.leading,
    tracking: typeof row.tracking === 'number' ? (trackingToken(row.tracking) ?? row.tracking) : row.tracking,
    face: row.face,
  }));

  return {
    measuredAt: new Date().toISOString(),
    scope: [...scope].sort(),
    declarations: rows.length,
    coverage: coverage(),
    values: {
      sizes: sizes.entries.map(([key, count]) => ({ key, count })),
      leadings: leadings.entries.map(([key, count]) => ({ key, count })),
      trackings: trackings.entries.map(([key, count]) => ({ key, count })),
      weights: weights.entries.map(([key, count]) => ({ key, count })),
      faces: faces.entries.map(([key, count]) => ({ key, count })),
    },
    combos: [...combos.values()].map((entry) => ({ key: entry.key, count: entry.count, nodes: entry.nodes.size, samples: entry.samples })).sort((a, b) => b.nodes - a.nodes || b.count - a.count),
    violations,
    buckets: { sizes, leadings, trackings, weights, faces },
  };
}

export function runCensus({
  canvasDir = DEFAULT_CANVAS_DIR,
  all = false,
  quiet = false,
  jsonPath = null,
  writeManifest = false,
  strict = false,
} = {}) {
  const files = listProductCanvasFiles(canvasDir, { all });
  const canvases = files.map(collectCanvas);
  const rows = canvases.flatMap(rowsFor);
  const report = buildReport(rows, canvases.map((c) => c.name));
  const { sizes, leadings, trackings, weights, faces } = report.buckets;

  const line = (label, bucket) => `${label.padEnd(9)} ${String(bucket.distinct).padStart(3)} distinct  ${String(bucket.total).padStart(4)} decls  ${bucket.entries.slice(0, 6).map(([k, c]) => `${k} x${c}`).join(', ')}`;

  if (!quiet) {
    console.log(`typography census  scope: ${report.scope.join(', ')}`);
    console.log(`${report.declarations} typography declarations\n`);
    console.log(line('sizes', sizes));
    console.log(line('leadings', leadings));
    console.log(line('trackings', trackings));
    console.log(line('weights', weights));
    console.log(line('faces', faces));
    console.log('\ncoverage', JSON.stringify(report.coverage));
    console.log(`combinations ${report.combos.length}, violations ${report.violations.length}`);
    for (const violation of report.violations.slice(0, 25)) console.log('  !', JSON.stringify(violation));
    if (report.violations.length > 25) console.log(`  ... ${report.violations.length - 25} more`);
  }

  if (jsonPath) writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  if (writeManifest && existsSync(MANIFEST)) {
    const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    manifest.census = {
      measuredAt: report.measuredAt,
      scope: report.scope,
      declarations: report.declarations,
      coverage: report.coverage,
      values: report.values,
      combinations: report.combos.length,
      violations: report.violations.length,
    };
    writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
    if (!quiet) console.log(`\n${MANIFEST} census block updated`);
  }

  return { report, exitCode: strict && report.violations.length > 0 ? 1 : 0 };
}

function main(argv = process.argv.slice(2)) {
  const has = (name) => argv.includes(name);
  const valueOf = (name, fallback) => {
    const at = argv.indexOf(name);
    return at === -1 ? fallback : argv[at + 1];
  };

  void MANIFEST_SCOPE;
  const { exitCode } = runCensus({
    canvasDir: valueOf('--dir', DEFAULT_CANVAS_DIR),
    all: has('--all'),
    quiet: has('--quiet'),
    jsonPath: has('--json') ? valueOf('--json', 'typography.census.json') : null,
    writeManifest: has('--write'),
    strict: has('--strict'),
  });
  if (exitCode !== 0) process.exitCode = exitCode;
}

const isMain =
  process.argv[1] !== undefined && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);

if (isMain) main();
