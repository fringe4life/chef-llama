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

const CATEGORIES = new Set(doc.categories)
const INTRINSIC = ['meat', 'fish', 'dairy', 'egg', 'animal_derived']
const PARENTS = new Set(['dairy', 'wheat'])
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** animal_derived that also block lacto-ovo vegetarian (not honey). */
const VEGETARIAN_BLOCKING_ANIMAL = new Set([
	'gelatine',
	'lard',
	'dripping',
	'worcestershire',
	'fish-sauce',
	'oyster-sauce',
	'bone-broth',
])

const errors = []

if (doc.version !== 1) errors.push('version must be 1')
if (doc.locale !== 'en-NZ') errors.push('locale must be en-NZ')
if (!Array.isArray(doc.ingredients)) errors.push('ingredients must be an array')

const n = doc.ingredients?.length ?? 0
if (n < 300 || n > 500) errors.push(`ingredient count ${n} outside 300–500`)

if (!Array.isArray(doc.diet_flags) || doc.diet_flags.join() !== 'vegan,vegetarian') {
	errors.push('diet_flags must be vegan|vegetarian (derived only)')
}
if (!Array.isArray(doc.intrinsic_flags) || doc.intrinsic_flags.join() !== INTRINSIC.join()) {
	errors.push(`intrinsic_flags must be ${INTRINSIC.join('|')}`)
}
if (doc.allergen_codes != null) errors.push('allergen_codes must be removed from seed')

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

	if (row.allergens != null || row.allergen_uncertain != null) {
		errors.push(`${where}: curated allergens must not be present`)
	}
	if (row.diet_uncertain != null) {
		errors.push(`${where}: diet_uncertain must not be present`)
	}
	if (row.parent != null && !PARENTS.has(row.parent)) {
		errors.push(`${where}: bad parent ${row.parent}`)
	}

	const intr = row.intrinsic
	if (!intr || typeof intr !== 'object') {
		errors.push(`${where}: intrinsic missing`)
	} else {
		for (const f of INTRINSIC) {
			if (typeof intr[f] !== 'boolean') {
				errors.push(`${where}: intrinsic.${f} must be boolean`)
			}
		}
		if (row.category === 'meat' && !intr.meat) {
			errors.push(`${where}: meat category requires intrinsic.meat`)
		}
		if (row.category === 'seafood' && !intr.fish) {
			errors.push(`${where}: seafood category requires intrinsic.fish`)
		}
		if (row.category === 'dairy' && !intr.dairy) {
			errors.push(`${where}: dairy category requires intrinsic.dairy`)
		}
		if (row.category === 'egg' && !intr.egg) {
			errors.push(`${where}: egg category requires intrinsic.egg`)
		}

		const vegan =
			!intr.meat && !intr.fish && !intr.dairy && !intr.egg && !intr.animal_derived
		const vegetarian =
			!intr.meat &&
			!intr.fish &&
			!(intr.animal_derived && VEGETARIAN_BLOCKING_ANIMAL.has(row.slug))

		if (!row.diets || typeof row.diets !== 'object') {
			errors.push(`${where}: diets missing`)
		} else {
			if (typeof row.diets.vegan !== 'boolean' || typeof row.diets.vegetarian !== 'boolean') {
				errors.push(`${where}: diets.vegan/vegetarian must be boolean`)
			}
			if (row.diets.vegan !== vegan) {
				errors.push(`${where}: diets.vegan inconsistent with intrinsic`)
			}
			if (row.diets.vegetarian !== vegetarian) {
				errors.push(`${where}: diets.vegetarian inconsistent with intrinsic`)
			}
			if (row.diets.vegan && !row.diets.vegetarian) {
				errors.push(`${where}: vegan implies vegetarian`)
			}
			for (const banned of ['gluten_free', 'keto', 'halal', 'paleo']) {
				if (banned in row.diets) {
					errors.push(`${where}: diets.${banned} must not be present`)
				}
			}
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
