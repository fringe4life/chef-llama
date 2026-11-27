/**
 * Shared NZ pantry seed constants + helpers for generate/validate.
 * Keep this module free of I/O so both scripts can import it.
 */

export const CATEGORIES = [
	'staple',
	'vegetable',
	'fruit',
	'meat',
	'seafood',
	'dairy',
	'egg',
	'grain',
	'legume',
	'nut_seed',
	'herb_spice',
	'condiment',
	'oil_fat',
	'bakery',
	'beverage',
	'other',
]

/** Intrinsic composition flags (seed). vegan / vegetarian are derived. */
export const INTRINSIC_FLAGS = ['meat', 'fish', 'dairy', 'egg', 'animal_derived']

/** Selectable avoid-list parent group ids (not ingredient slugs). */
export const PARENT_GROUPS = ['dairy', 'wheat']

/**
 * Parent links — expand avoid-list group chips (dairy / wheat).
 * @type {Record<string, 'dairy' | 'wheat'>}
 */
export const PARENT_BY_SLUG = {
	'blue-cheese': 'dairy',
	brie: 'dairy',
	butter: 'dairy',
	buttermilk: 'dairy',
	cheese: 'dairy',
	'condensed-milk': 'dairy',
	'cottage-cheese': 'dairy',
	cream: 'dairy',
	'cream-cheese': 'dairy',
	custard: 'dairy',
	'evaporated-milk': 'dairy',
	feta: 'dairy',
	ghee: 'dairy',
	halloumi: 'dairy',
	'ice-cream': 'dairy',
	mascarpone: 'dairy',
	milk: 'dairy',
	'milk-chocolate': 'dairy',
	mozzarella: 'dairy',
	parmesan: 'dairy',
	pesto: 'dairy',
	ricotta: 'dairy',
	'sour-cream': 'dairy',
	'white-chocolate': 'dairy',
	yoghurt: 'dairy',
	bagel: 'wheat',
	biscuit: 'wheat',
	bread: 'wheat',
	breadcrumbs: 'wheat',
	bulgur: 'wheat',
	couscous: 'wheat',
	cracker: 'wheat',
	croissant: 'wheat',
	'egg-noodles': 'wheat',
	filo: 'wheat',
	flour: 'wheat',
	'flour-tortilla': 'wheat',
	'lasagna-sheet': 'wheat',
	muffin: 'wheat',
	noodles: 'wheat',
	pasta: 'wheat',
	'pizza-base': 'wheat',
	'puff-pastry': 'wheat',
	'ramen-noodles': 'wheat',
	'self-raising-flour': 'wheat',
	semolina: 'wheat',
	shortcrust: 'wheat',
	soba: 'wheat',
	sourdough: 'wheat',
	spelt: 'wheat',
	udon: 'wheat',
	'weet-bix': 'wheat',
	'wonton-wrapper': 'wheat',
	wrap: 'wheat',
}

/** Animal-derived beyond meat/fish/dairy/egg (blocks vegan). */
export const ANIMAL_DERIVED = new Set([
	'honey',
	'gelatine',
	'lard',
	'dripping',
	'worcestershire',
	'fish-sauce',
	'oyster-sauce',
	'bone-broth',
])

/** animal_derived that also block lacto-ovo vegetarian (not honey). */
export const VEGETARIAN_BLOCKING_ANIMAL = new Set([
	'gelatine',
	'lard',
	'dripping',
	'worcestershire',
	'fish-sauce',
	'oyster-sauce',
	'bone-broth',
])

/**
 * Name/alias phrases that look dairy but are not (validator heuristics).
 * Matched as whole phrases against lowercased name + aliases.
 */
export const DAIRY_HEURISTIC_ALLOWLIST = new Set([
	'coconut milk',
	'coconut cream',
	'peanut butter',
	'cocoa butter',
	'cream of tartar',
	'butter bean',
	'butter beans',
	'lima bean',
	'butternut',
	'butternut squash',
	'butternut pumpkin',
	'buttercup pumpkin',
])

/**
 * @param {{ meat: boolean, fish: boolean, dairy: boolean, egg: boolean, animal_derived: boolean }} intrinsic
 * @param {string} slug
 */
export function deriveDiets(intrinsic, slug) {
	const vegan =
		!intrinsic.meat &&
		!intrinsic.fish &&
		!intrinsic.dairy &&
		!intrinsic.egg &&
		!intrinsic.animal_derived
	const vegetarian =
		!intrinsic.meat &&
		!intrinsic.fish &&
		!(intrinsic.animal_derived && VEGETARIAN_BLOCKING_ANIMAL.has(slug))
	return { vegan, vegetarian }
}

/**
 * Independent name/alias heuristics for the validator (not used by the generator).
 * @param {string} slug
 * @param {string} name
 * @param {string[]} aliases
 * @returns {{ meat?: true, egg?: true, dairy?: true }}
 */
export function heuristicIntrinsicHints(slug, name, aliases) {
	const phrases = [name, ...aliases].map((s) => String(s).toLowerCase())
	const blob = `${slug.replaceAll('-', ' ')} ${phrases.join(' ')}`.toLowerCase()
	/** @type {{ meat?: true, egg?: true, dairy?: true }} */
	const hints = {}

	if (/\b(chicken|beef|pork|lamb|bacon|ham|prosciutto|venison|duck|turkey|meat)\b/.test(blob)) {
		hints.meat = true
	}
	// oxo / bouillon stock powder fail-closed as meat unless vegetable*
	if (
		(/\b(stock|broth|bouillon|oxo)\b/.test(blob) || slug === 'stock-powder') &&
		!/\bvegetable\b/.test(blob) &&
		!/\bfish\b/.test(blob)
	) {
		hints.meat = true
	}

	if (/\b(mayonnaise|mayo|aioli|egg noodles|egg white|egg yolk|eggs?\b)/.test(blob)) {
		hints.egg = true
	}

	const allowDairy = phrases.some((p) => DAIRY_HEURISTIC_ALLOWLIST.has(p)) || DAIRY_HEURISTIC_ALLOWLIST.has(name.toLowerCase())
	if (
		!allowDairy &&
		/\b(milk|cream|cheese|butter|yoghurt|yogurt|ghee|buttermilk|mascarpone|ricotta|mozzarella|parmesan|feta)\b/.test(
			blob,
		)
	) {
		// peanut butter / coconut milk caught by allowlist phrases
		if (!/\bpeanut butter\b/.test(blob) && !/\bcoconut (milk|cream)\b/.test(blob) && !/\bcocoa butter\b/.test(blob)) {
			hints.dairy = true
		}
	}

	return hints
}
