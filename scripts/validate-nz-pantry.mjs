#!/usr/bin/env node
/**
 * Validates data/ingredients/nz-pantry.json against the closed shape
 * documented in docs/data.md (Valibot schemas land with app code later).
 *
 * Usage: node scripts/validate-nz-pantry.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const path = join(root, 'data', 'ingredients', 'nz-pantry.json')
const doc = JSON.parse(readFileSync(path, 'utf8'))

const ALLERGENS = new Set(doc.allergen_codes)
const CATEGORIES = new Set(doc.categories)
const DIETS = ['vegan', 'vegetarian', 'gluten_free', 'keto', 'halal', 'paleo']
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const errors = []

if (doc.version !== 1) errors.push('version must be 1')
if (doc.locale !== 'en-NZ') errors.push('locale must be en-NZ')
if (!Array.isArray(doc.ingredients)) errors.push('ingredients must be an array')

const n = doc.ingredients?.length ?? 0
if (n < 300 || n > 500) errors.push(`ingredient count ${n} outside 300–500`)
if (!Array.isArray(doc.diet_flags) || doc.diet_flags.join() !== DIETS.join()) {
	errors.push('diet_flags must be vegan|vegetarian|gluten_free|keto|halal|paleo')
}

const slugs = new Set()
const labels = new Map()

for (const [idx, row] of (doc.ingredients ?? []).entries()) {
	const where = `ingredients[${idx}] (${row?.slug ?? '?'})`
	if (!row || typeof row !== 'object') {
		errors.push(`${where}: not an object`)
		continue
	}
	if (typeof row.slug !== 'string' || !SLUG_RE.test(row.slug)) {
		errors.push(`${where}: bad slug`)
	}
	if (slugs.has(row.slug)) errors.push(`${where}: duplicate slug`)
	slugs.add(row.slug)

	if (typeof row.name !== 'string' || row.name.length < 1) {
		errors.push(`${where}: bad name`)
	}
	if (!CATEGORIES.has(row.category)) errors.push(`${where}: bad category ${row.category}`)
	if (!Array.isArray(row.aliases)) errors.push(`${where}: aliases must be array`)
	if (!Array.isArray(row.allergens)) errors.push(`${where}: allergens must be array`)
	if (!Array.isArray(row.allergen_uncertain)) {
		errors.push(`${where}: allergen_uncertain must be array`)
	}
	if (!Array.isArray(row.diet_uncertain)) {
		errors.push(`${where}: diet_uncertain must be array`)
	}
	if (!row.diets || typeof row.diets !== 'object') {
		errors.push(`${where}: diets missing`)
	} else {
		for (const d of DIETS) {
			if (typeof row.diets[d] !== 'boolean') {
				errors.push(`${where}: diets.${d} must be boolean`)
			}
		}
		if (row.diets.vegan && !row.diets.vegetarian) {
			errors.push(`${where}: vegan implies vegetarian`)
		}
		if (row.allergens?.includes('gluten') && row.diets.gluten_free) {
			errors.push(`${where}: gluten allergen but gluten_free true`)
		}
		if (
			(row.category === 'meat' || row.category === 'seafood') &&
			(row.diets.vegan || row.diets.vegetarian)
		) {
			errors.push(`${where}: meat/seafood cannot be vegan/vegetarian`)
		}
	}
	for (const a of row.allergens ?? []) {
		if (!ALLERGENS.has(a)) errors.push(`${where}: unknown allergen ${a}`)
	}
	for (const u of row.allergen_uncertain ?? []) {
		if (!u || !ALLERGENS.has(u.code) || typeof u.note !== 'string' || !u.note) {
			errors.push(`${where}: bad allergen_uncertain entry`)
		}
	}
	for (const u of row.diet_uncertain ?? []) {
		if (!u || !DIETS.includes(u.flag) || typeof u.note !== 'string' || !u.note) {
			errors.push(`${where}: bad diet_uncertain entry`)
		}
	}

	const keys = [row.name.toLowerCase(), ...(row.aliases ?? []).map((a) => a.toLowerCase())]
	for (const key of keys) {
		if (!labels.has(key)) labels.set(key, new Set())
		labels.get(key).add(row.slug)
	}
}

for (const [label, set] of labels) {
	if (set.size > 1) {
		const ordered = [...set].sort((a, b) => String(a).localeCompare(String(b)))
		errors.push(`alias clash: '${label}' → ${ordered.join(', ')}`)
	}
}

if (errors.length) {
	console.error(`FAIL ${errors.length} error(s):`)
	for (const e of errors.slice(0, 50)) console.error(`  - ${e}`)
	if (errors.length > 50) console.error(`  … ${errors.length - 50} more`)
	process.exit(1)
}

console.log(`OK ${n} ingredients, ${slugs.size} unique slugs`)
