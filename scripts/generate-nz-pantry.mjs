#!/usr/bin/env node
/**
 * Regenerates data/ingredients/nz-pantry.json and MANUAL_REVIEW.json.
 *
 * Curated everyday NZ pantry seed (not a dump of OFF/USDA). Names, synonyms,
 * and allergen links are informed by Open Food Facts taxonomies (ODbL), with
 * USDA FoodData Central / FoodOn used only to fill naming gaps. Do not pull
 * NZ Food Composition Database rows (no-modify licence — see SOURCES.md).
 *
 * Usage: node scripts/generate-nz-pantry.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'data', 'ingredients')

const ALLERGENS = [
	'gluten',
	'crustaceans',
	'eggs',
	'fish',
	'peanuts',
	'soybeans',
	'milk',
	'nuts',
	'celery',
	'mustard',
	'sesame',
	'sulphites',
	'lupin',
	'molluscs',
]

const CATEGORIES = [
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

/** @typedef {{ code: string, note: string }} Uncertain */
/** @typedef {{
 *   slug: string,
 *   name: string,
 *   aliases?: string[],
 *   category: string,
 *   allergens?: string[],
 *   allergen_uncertain?: Uncertain[],
 *   vegan?: boolean,
 *   vegetarian?: boolean,
 *   gluten_free?: boolean,
 *   sources?: string[],
 * }} Spec */

/**
 * @param {Spec} spec
 */
function item(spec) {
	const {
		slug,
		name,
		aliases = [],
		category,
		allergens = [],
		allergen_uncertain = [],
		sources = ['off', 'curated'],
	} = spec

	let { vegan, vegetarian, gluten_free } = spec

	if (category === 'meat' || category === 'seafood') {
		vegan = false
		vegetarian = false
	} else if (category === 'dairy' || category === 'egg') {
		vegan = false
		if (vegetarian === undefined) vegetarian = true
	}

	if (vegan === undefined) vegan = true
	if (vegetarian === undefined) vegetarian = true
	if (vegan) vegetarian = true

	if (gluten_free === undefined) {
		gluten_free = !allergens.includes('gluten')
	}
	if (allergens.includes('gluten')) gluten_free = false

	return {
		slug,
		name,
		aliases: [...new Set(aliases.filter((a) => a && a.toLowerCase() !== name.toLowerCase()))].sort(),
		category,
		allergens: [...allergens].sort(),
		allergen_uncertain,
		diets: { vegan, vegetarian, gluten_free },
		sources: [...sources].sort(),
	}
}

/** @type {Spec[]} */
const specs = [
	// Staples (product closed defaults)
	{ slug: 'water', name: 'water', aliases: ['tap water'], category: 'staple', sources: ['curated'] },
	{ slug: 'salt', name: 'salt', aliases: ['table salt', 'sea salt'], category: 'staple' },
	{ slug: 'pepper', name: 'pepper', aliases: ['black pepper', 'peppercorns'], category: 'staple' },
	{ slug: 'oil', name: 'oil', aliases: ['cooking oil'], category: 'staple' },
	{
		slug: 'butter',
		name: 'butter',
		aliases: ['salted butter', 'unsalted butter'],
		category: 'staple',
		allergens: ['milk'],
		vegan: false,
		vegetarian: true,
	},

	// Vegetables — NZ names preferred
	{
		slug: 'capsicum',
		name: 'capsicum',
		aliases: ['bell pepper', 'sweet pepper', 'red capsicum', 'green capsicum', 'yellow capsicum'],
		category: 'vegetable',
		sources: ['off', 'usda', 'curated'],
	},
	{
		slug: 'kumara',
		name: 'kumara',
		aliases: ['sweet potato', 'kūmara'],
		category: 'vegetable',
		sources: ['off', 'usda', 'curated'],
	},
	{
		slug: 'courgette',
		name: 'courgette',
		aliases: ['zucchini', 'baby marrow'],
		category: 'vegetable',
		sources: ['off', 'usda', 'curated'],
	},
	{
		slug: 'aubergine',
		name: 'aubergine',
		aliases: ['eggplant', 'brinjal'],
		category: 'vegetable',
		sources: ['off', 'usda', 'curated'],
	},
	{ slug: 'tomato', name: 'tomato', aliases: ['tomatoes', 'cherry tomato', 'roma tomato'], category: 'vegetable' },
	{ slug: 'onion', name: 'onion', aliases: ['brown onion', 'white onion', 'yellow onion'], category: 'vegetable' },
	{ slug: 'red-onion', name: 'red onion', aliases: ['purple onion'], category: 'vegetable' },
	{
		slug: 'spring-onion',
		name: 'spring onion',
		aliases: ['scallion', 'green onion', 'salad onion'],
		category: 'vegetable',
		sources: ['off', 'usda', 'curated'],
	},
	{ slug: 'shallot', name: 'shallot', aliases: ['eschalot'], category: 'vegetable' },
	{ slug: 'garlic', name: 'garlic', aliases: ['garlic clove', 'fresh garlic'], category: 'vegetable' },
	{ slug: 'ginger', name: 'ginger', aliases: ['fresh ginger', 'ginger root'], category: 'vegetable' },
	{ slug: 'potato', name: 'potato', aliases: ['potatoes', 'agria', 'jersey benne'], category: 'vegetable' },
	{ slug: 'carrot', name: 'carrot', aliases: ['carrots'], category: 'vegetable' },
	{
		slug: 'celery',
		name: 'celery',
		aliases: ['celery stalk', 'celery sticks'],
		category: 'vegetable',
		allergens: ['celery'],
	},
	{ slug: 'broccoli', name: 'broccoli', aliases: ['broccoli florets'], category: 'vegetable' },
	{ slug: 'cauliflower', name: 'cauliflower', category: 'vegetable' },
	{ slug: 'cabbage', name: 'cabbage', aliases: ['green cabbage', 'white cabbage'], category: 'vegetable' },
	{ slug: 'red-cabbage', name: 'red cabbage', aliases: ['purple cabbage'], category: 'vegetable' },
	{
		slug: 'silverbeet',
		name: 'silverbeet',
		aliases: ['swiss chard', 'chard', 'rainbow chard'],
		category: 'vegetable',
		sources: ['off', 'usda', 'curated'],
	},
	{ slug: 'spinach', name: 'spinach', aliases: ['baby spinach', 'english spinach'], category: 'vegetable' },
	{ slug: 'lettuce', name: 'lettuce', aliases: ['garden lettuce'], category: 'vegetable' },
	{ slug: 'cos-lettuce', name: 'cos lettuce', aliases: ['romaine lettuce'], category: 'vegetable' },
	{ slug: 'iceberg', name: 'iceberg lettuce', category: 'vegetable' },
	{ slug: 'mesclun', name: 'mesclun', aliases: ['salad mix', 'mixed leaves'], category: 'vegetable' },
	{ slug: 'rocket', name: 'rocket', aliases: ['arugula', 'roquette'], category: 'vegetable' },
	{ slug: 'kale', name: 'kale', aliases: ['cavolo nero', 'tuscan kale'], category: 'vegetable' },
	{ slug: 'bok-choy', name: 'bok choy', aliases: ['pak choi', 'bok choi'], category: 'vegetable' },
	{ slug: 'wombok', name: 'wombok', aliases: ['napa cabbage', 'chinese cabbage'], category: 'vegetable' },
	{ slug: 'choy-sum', name: 'choy sum', aliases: ['choi sum'], category: 'vegetable' },
	{ slug: 'gai-lan', name: 'gai lan', aliases: ['chinese broccoli'], category: 'vegetable' },
	{
		slug: 'cucumber',
		name: 'cucumber',
		aliases: ['telegraph cucumber', 'lebanese cucumber'],
		category: 'vegetable',
	},
	{
		slug: 'pumpkin',
		name: 'pumpkin',
		aliases: ['buttercup pumpkin', 'crown pumpkin', 'squash'],
		category: 'vegetable',
	},
	{
		slug: 'butternut',
		name: 'butternut',
		aliases: ['butternut squash', 'butternut pumpkin'],
		category: 'vegetable',
	},
	{ slug: 'beetroot', name: 'beetroot', aliases: ['beet', 'beets'], category: 'vegetable' },
	{ slug: 'parsnip', name: 'parsnip', category: 'vegetable' },
	{ slug: 'swede', name: 'swede', aliases: ['rutabaga'], category: 'vegetable' },
	{ slug: 'turnip', name: 'turnip', category: 'vegetable' },
	{ slug: 'radish', name: 'radish', aliases: ['radishes'], category: 'vegetable' },
	{ slug: 'daikon', name: 'daikon', aliases: ['white radish', 'mooli'], category: 'vegetable' },
	{ slug: 'leek', name: 'leek', aliases: ['leeks'], category: 'vegetable' },
	{ slug: 'fennel', name: 'fennel', aliases: ['florence fennel', 'fennel bulb'], category: 'vegetable' },
	{ slug: 'asparagus', name: 'asparagus', category: 'vegetable' },
	{
		slug: 'green-beans',
		name: 'green beans',
		aliases: ['french beans', 'string beans'],
		category: 'vegetable',
	},
	{ slug: 'broad-beans', name: 'broad beans', aliases: ['fava beans'], category: 'vegetable' },
	{ slug: 'peas', name: 'peas', aliases: ['garden peas', 'frozen peas', 'green peas'], category: 'vegetable' },
	{ slug: 'snow-peas', name: 'snow peas', aliases: ['mangetout'], category: 'vegetable' },
	{ slug: 'sugar-snap-peas', name: 'sugar snap peas', aliases: ['snap peas'], category: 'vegetable' },
	{ slug: 'corn', name: 'corn', aliases: ['sweetcorn', 'corn on the cob', 'maize'], category: 'vegetable' },
	{
		slug: 'mushroom',
		name: 'mushroom',
		aliases: ['mushrooms', 'button mushroom', 'swiss brown'],
		category: 'vegetable',
	},
	{ slug: 'portobello', name: 'portobello', aliases: ['portabella', 'flat mushroom'], category: 'vegetable' },
	{ slug: 'shiitake', name: 'shiitake', category: 'vegetable' },
	{ slug: 'avocado', name: 'avocado', aliases: ['hass avocado'], category: 'vegetable' },
	{
		slug: 'chilli',
		name: 'chilli',
		aliases: ['chili', 'chilli pepper', 'fresh chilli', 'red chilli'],
		category: 'vegetable',
	},
	{ slug: 'jalapeno', name: 'jalapeño', aliases: ['jalapeno'], category: 'vegetable' },
	{
		slug: 'yams',
		name: 'yams',
		aliases: ['nz yams', 'oca'],
		category: 'vegetable',
		sources: ['curated', 'foodon'],
	},
	{ slug: 'taro', name: 'taro', category: 'vegetable', sources: ['usda', 'foodon', 'curated'] },
	{ slug: 'cassava', name: 'cassava', aliases: ['manioc', 'yuca'], category: 'vegetable' },
	{ slug: 'okra', name: 'okra', category: 'vegetable' },
	{ slug: 'artichoke', name: 'artichoke', aliases: ['globe artichoke'], category: 'vegetable' },
	{
		slug: 'jerusalem-artichoke',
		name: 'jerusalem artichoke',
		aliases: ['sunchoke'],
		category: 'vegetable',
	},
	{ slug: 'brussels-sprouts', name: 'brussels sprouts', aliases: ['brussel sprouts'], category: 'vegetable' },
	{ slug: 'witloof', name: 'witloof', aliases: ['chicory', 'belgian endive', 'endive'], category: 'vegetable' },
	{ slug: 'watercress', name: 'watercress', category: 'vegetable' },
	{ slug: 'bean-sprouts', name: 'bean sprouts', aliases: ['mung bean sprouts', 'sprouts'], category: 'vegetable' },
	{ slug: 'alfalfa', name: 'alfalfa', aliases: ['alfalfa sprouts'], category: 'vegetable' },
	{ slug: 'tomato-paste', name: 'tomato paste', aliases: ['tomato concentrate'], category: 'vegetable' },
	{
		slug: 'tinned-tomato',
		name: 'tinned tomato',
		aliases: ['canned tomato', 'diced tomato', 'chopped tomato', 'crushed tomato'],
		category: 'vegetable',
	},
	{ slug: 'passata', name: 'passata', aliases: ['tomato passata', 'sieved tomato'], category: 'vegetable' },
	{ slug: 'sun-dried-tomato', name: 'sun-dried tomato', aliases: ['sundried tomato'], category: 'vegetable' },
	{
		slug: 'olive',
		name: 'olive',
		aliases: ['olives', 'kalamata', 'green olive', 'black olive'],
		category: 'vegetable',
	},
	{ slug: 'pickled-onion', name: 'pickled onion', category: 'vegetable' },
	{ slug: 'gherkin', name: 'gherkin', aliases: ['pickle', 'pickles', 'dill pickle'], category: 'vegetable' },
	{ slug: 'sauerkraut', name: 'sauerkraut', category: 'vegetable' },
	{
		slug: 'kimchi',
		name: 'kimchi',
		category: 'vegetable',
		allergen_uncertain: [
			{ code: 'fish', note: 'many commercial kimchi use fish sauce; check label' },
			{ code: 'crustaceans', note: 'some recipes use shrimp paste' },
		],
	},

	// Fruit
	{
		slug: 'apple',
		name: 'apple',
		aliases: ['apples', 'granny smith', 'braeburn', 'royal gala'],
		category: 'fruit',
	},
	{ slug: 'pear', name: 'pear', aliases: ['pears', 'nashi'], category: 'fruit' },
	{ slug: 'banana', name: 'banana', aliases: ['bananas'], category: 'fruit' },
	{ slug: 'orange', name: 'orange', aliases: ['oranges', 'navel orange'], category: 'fruit' },
	{ slug: 'lemon', name: 'lemon', aliases: ['lemons'], category: 'fruit' },
	{ slug: 'lemon-juice', name: 'lemon juice', category: 'fruit', sources: ['curated'] },
	{ slug: 'lime', name: 'lime', aliases: ['limes'], category: 'fruit' },
	{ slug: 'lime-juice', name: 'lime juice', category: 'fruit', sources: ['curated'] },
	{ slug: 'mandarin', name: 'mandarin', aliases: ['tangerine', 'clementine'], category: 'fruit' },
	{ slug: 'grapefruit', name: 'grapefruit', category: 'fruit' },
	{ slug: 'strawberry', name: 'strawberry', aliases: ['strawberries'], category: 'fruit' },
	{ slug: 'blueberry', name: 'blueberry', aliases: ['blueberries'], category: 'fruit' },
	{ slug: 'raspberry', name: 'raspberry', aliases: ['raspberries'], category: 'fruit' },
	{ slug: 'blackberry', name: 'blackberry', aliases: ['blackberries'], category: 'fruit' },
	{ slug: 'boysenberry', name: 'boysenberry', aliases: ['boysenberries'], category: 'fruit' },
	{
		slug: 'kiwifruit',
		name: 'kiwifruit',
		aliases: ['kiwi', 'kiwi fruit', 'green kiwifruit', 'gold kiwifruit'],
		category: 'fruit',
		sources: ['off', 'usda', 'curated'],
	},
	{
		slug: 'feijoa',
		name: 'feijoa',
		aliases: ['pineapple guava'],
		category: 'fruit',
		sources: ['curated', 'foodon'],
	},
	{ slug: 'passionfruit', name: 'passionfruit', aliases: ['passion fruit'], category: 'fruit' },
	{ slug: 'tamarillo', name: 'tamarillo', aliases: ['tree tomato'], category: 'fruit', sources: ['curated'] },
	{ slug: 'peach', name: 'peach', aliases: ['peaches'], category: 'fruit' },
	{ slug: 'nectarine', name: 'nectarine', aliases: ['nectarines'], category: 'fruit' },
	{
		slug: 'apricot',
		name: 'apricot',
		aliases: ['apricots'],
		category: 'fruit',
		allergen_uncertain: [
			{ code: 'sulphites', note: 'dried apricots often sulphured; fresh usually fine' },
		],
	},
	{
		slug: 'dried-apricot',
		name: 'dried apricot',
		aliases: ['dried apricots'],
		category: 'fruit',
		allergens: ['sulphites'],
	},
	{ slug: 'plum', name: 'plum', aliases: ['plums'], category: 'fruit' },
	{ slug: 'cherry', name: 'cherry', aliases: ['cherries'], category: 'fruit' },
	{ slug: 'grape', name: 'grape', aliases: ['grapes'], category: 'fruit' },
	{ slug: 'watermelon', name: 'watermelon', category: 'fruit' },
	{ slug: 'rockmelon', name: 'rockmelon', aliases: ['cantaloupe', 'muskmelon'], category: 'fruit' },
	{ slug: 'honeydew', name: 'honeydew', aliases: ['honeydew melon'], category: 'fruit' },
	{ slug: 'pineapple', name: 'pineapple', category: 'fruit' },
	{ slug: 'mango', name: 'mango', category: 'fruit' },
	{ slug: 'papaya', name: 'papaya', aliases: ['pawpaw'], category: 'fruit' },
	{ slug: 'coconut', name: 'coconut', aliases: ['fresh coconut', 'coconut flesh'], category: 'fruit' },
	{ slug: 'coconut-milk', name: 'coconut milk', category: 'fruit' },
	{ slug: 'coconut-cream', name: 'coconut cream', aliases: ['tinned coconut cream'], category: 'fruit' },
	{ slug: 'dates', name: 'dates', aliases: ['medjool dates'], category: 'fruit' },
	{
		slug: 'raisins',
		name: 'raisins',
		aliases: ['sultanas', 'dried grapes'],
		category: 'fruit',
		allergen_uncertain: [{ code: 'sulphites', note: 'may be sulphured' }],
	},
	{ slug: 'cranberry', name: 'cranberry', aliases: ['cranberries', 'dried cranberries'], category: 'fruit' },
	{ slug: 'fig', name: 'fig', aliases: ['figs', 'dried figs'], category: 'fruit' },
	{ slug: 'pomegranate', name: 'pomegranate', category: 'fruit' },
	{ slug: 'persimmon', name: 'persimmon', aliases: ['fuyu'], category: 'fruit' },
	{ slug: 'rhubarb', name: 'rhubarb', category: 'fruit' },
	{ slug: 'blackcurrant', name: 'blackcurrant', aliases: ['black currant'], category: 'fruit' },
	{ slug: 'redcurrant', name: 'redcurrant', aliases: ['red currant'], category: 'fruit' },
	{ slug: 'gooseberry', name: 'gooseberry', category: 'fruit' },
	{ slug: 'guava', name: 'guava', category: 'fruit' },
	{ slug: 'quince', name: 'quince', category: 'fruit' },
	{ slug: 'jackfruit', name: 'jackfruit', aliases: ['young jackfruit'], category: 'fruit' },
	{ slug: 'plantain', name: 'plantain', category: 'fruit' },
	{ slug: 'lychee', name: 'lychee', aliases: ['litchi'], category: 'fruit' },
	{ slug: 'dragonfruit', name: 'dragon fruit', aliases: ['pitaya', 'dragonfruit'], category: 'fruit' },
	{ slug: 'starfruit', name: 'starfruit', aliases: ['carambola'], category: 'fruit' },
	{ slug: 'goji', name: 'goji berry', aliases: ['goji berries', 'wolfberry'], category: 'fruit' },

	// Meat
	{ slug: 'beef', name: 'beef', aliases: ['beef steak', 'steak'], category: 'meat' },
	{
		slug: 'beef-mince',
		name: 'beef mince',
		aliases: ['mince', 'ground beef', 'hamburger mince', 'minced beef'],
		category: 'meat',
		sources: ['off', 'usda', 'curated'],
	},
	{ slug: 'lamb', name: 'lamb', aliases: ['lamb roast', 'lamb chops', 'hogget', 'mutton'], category: 'meat' },
	{ slug: 'lamb-mince', name: 'lamb mince', aliases: ['minced lamb', 'ground lamb'], category: 'meat' },
	{ slug: 'lamb-shank', name: 'lamb shank', category: 'meat', sources: ['curated'] },
	{ slug: 'pork', name: 'pork', aliases: ['pork chop', 'pork roast'], category: 'meat' },
	{ slug: 'pork-mince', name: 'pork mince', aliases: ['minced pork', 'ground pork'], category: 'meat' },
	{ slug: 'bacon', name: 'bacon', aliases: ['streaky bacon', 'middle bacon', 'rashers'], category: 'meat' },
	{ slug: 'ham', name: 'ham', aliases: ['leg ham', 'shaved ham'], category: 'meat' },
	{
		slug: 'sausage',
		name: 'sausage',
		aliases: ['sausages', 'bangers'],
		category: 'meat',
		allergen_uncertain: [
			{ code: 'gluten', note: 'some NZ sausages contain breadcrumbs; check label' },
			{ code: 'sulphites', note: 'common preservative in sausages' },
		],
	},
	{
		slug: 'chicken',
		name: 'chicken',
		aliases: ['chicken breast', 'chicken thigh', 'whole chicken'],
		category: 'meat',
	},
	{
		slug: 'chicken-mince',
		name: 'chicken mince',
		aliases: ['minced chicken', 'ground chicken'],
		category: 'meat',
	},
	{ slug: 'chicken-liver', name: 'chicken liver', aliases: ['liver'], category: 'meat' },
	{ slug: 'turkey', name: 'turkey', category: 'meat' },
	{ slug: 'duck', name: 'duck', category: 'meat' },
	{ slug: 'venison', name: 'venison', aliases: ['deer meat'], category: 'meat' },
	{
		slug: 'salami',
		name: 'salami',
		category: 'meat',
		allergen_uncertain: [
			{ code: 'milk', note: 'some salami uses milk powder' },
			{ code: 'sulphites', note: 'may contain sulphites' },
		],
	},
	{ slug: 'chorizo', name: 'chorizo', category: 'meat' },
	{ slug: 'prosciutto', name: 'prosciutto', aliases: ['parma ham'], category: 'meat' },
	{ slug: 'pastrami', name: 'pastrami', category: 'meat' },
	{
		slug: 'meatballs',
		name: 'meatballs',
		category: 'meat',
		allergen_uncertain: [
			{ code: 'gluten', note: 'often contain breadcrumbs' },
			{ code: 'eggs', note: 'often bound with egg' },
		],
	},
	{
		slug: 'frankfurter',
		name: 'frankfurter',
		aliases: ['hot dog', 'saveloy'],
		category: 'meat',
		allergen_uncertain: [
			{ code: 'gluten', note: 'check casing and fillers' },
			{ code: 'milk', note: 'may contain dairy' },
		],
	},
	{
		slug: 'beef-schnitzel',
		name: 'beef schnitzel',
		aliases: ['schnitzel'],
		category: 'meat',
		allergens: ['gluten'],
		allergen_uncertain: [{ code: 'eggs', note: 'crumb binding usually includes egg' }],
		gluten_free: false,
	},
	{
		slug: 'chicken-schnitzel',
		name: 'chicken schnitzel',
		category: 'meat',
		allergens: ['gluten'],
		allergen_uncertain: [{ code: 'eggs', note: 'crumb binding usually includes egg' }],
		gluten_free: false,
	},

	// Seafood
	{ slug: 'salmon', name: 'salmon', aliases: ['atlantic salmon', 'king salmon'], category: 'seafood', allergens: ['fish'] },
	{ slug: 'tuna', name: 'tuna', aliases: ['tinned tuna', 'canned tuna'], category: 'seafood', allergens: ['fish'] },
	{ slug: 'tarakihi', name: 'tarakihi', aliases: ['terakihi'], category: 'seafood', allergens: ['fish'], sources: ['curated', 'foodon'] },
	{ slug: 'snapper', name: 'snapper', aliases: ['schnapper'], category: 'seafood', allergens: ['fish'] },
	{ slug: 'gurnard', name: 'gurnard', category: 'seafood', allergens: ['fish'], sources: ['curated'] },
	{ slug: 'hoki', name: 'hoki', category: 'seafood', allergens: ['fish'], sources: ['curated'] },
	{ slug: 'cod', name: 'cod', aliases: ['blue cod'], category: 'seafood', allergens: ['fish'] },
	{ slug: 'warehou', name: 'warehou', category: 'seafood', allergens: ['fish'], sources: ['curated'] },
	{ slug: 'kahawai', name: 'kahawai', category: 'seafood', allergens: ['fish'], sources: ['curated'] },
	{ slug: 'mackerel', name: 'mackerel', category: 'seafood', allergens: ['fish'] },
	{ slug: 'sardine', name: 'sardine', aliases: ['sardines', 'pilchard'], category: 'seafood', allergens: ['fish'] },
	{ slug: 'anchovy', name: 'anchovy', aliases: ['anchovies'], category: 'seafood', allergens: ['fish'] },
	{
		slug: 'whitebait',
		name: 'whitebait',
		aliases: ['īnanga', 'inanga'],
		category: 'seafood',
		allergens: ['fish'],
		sources: ['curated', 'foodon'],
	},
	{
		slug: 'fish-fillet',
		name: 'fish fillet',
		aliases: ['white fish', 'fish'],
		category: 'seafood',
		allergens: ['fish'],
	},
	{
		slug: 'prawn',
		name: 'prawn',
		aliases: ['prawns', 'shrimp', 'shrimps'],
		category: 'seafood',
		allergens: ['crustaceans'],
	},
	{ slug: 'crab', name: 'crab', category: 'seafood', allergens: ['crustaceans'] },
	{
		slug: 'crayfish',
		name: 'crayfish',
		aliases: ['koura', 'rock lobster', 'lobster'],
		category: 'seafood',
		allergens: ['crustaceans'],
		sources: ['curated'],
	},
	{
		slug: 'mussel',
		name: 'mussel',
		aliases: ['mussels', 'green-lipped mussel', 'greenshell mussel'],
		category: 'seafood',
		allergens: ['molluscs'],
	},
	{
		slug: 'paua',
		name: 'pāua',
		aliases: ['paua', 'abalone'],
		category: 'seafood',
		allergens: ['molluscs'],
		sources: ['curated', 'foodon'],
	},
	{
		slug: 'oyster',
		name: 'oyster',
		aliases: ['oysters', 'bluff oyster'],
		category: 'seafood',
		allergens: ['molluscs'],
	},
	{ slug: 'scallop', name: 'scallop', aliases: ['scallops'], category: 'seafood', allergens: ['molluscs'] },
	{ slug: 'squid', name: 'squid', aliases: ['calamari'], category: 'seafood', allergens: ['molluscs'] },
	{ slug: 'octopus', name: 'octopus', category: 'seafood', allergens: ['molluscs'] },
	{
		slug: 'clam',
		name: 'clam',
		aliases: ['clams', 'tuatua', 'toheroa'],
		category: 'seafood',
		allergens: ['molluscs'],
		sources: ['curated'],
	},
	{ slug: 'fish-sauce', name: 'fish sauce', aliases: ['nam pla'], category: 'seafood', allergens: ['fish'] },
	{
		slug: 'fish-stock',
		name: 'fish stock',
		aliases: ['fish broth'],
		category: 'seafood',
		allergens: ['fish'],
		allergen_uncertain: [{ code: 'celery', note: 'commercial stocks often contain celery' }],
	},

	// Dairy
	{
		slug: 'milk',
		name: 'milk',
		aliases: ['full cream milk', 'trim milk', 'homogenised milk', 'dairy milk'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{
		slug: 'cream',
		name: 'cream',
		aliases: ['pouring cream', 'thickened cream', 'whipping cream'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{ slug: 'sour-cream', name: 'sour cream', aliases: ['soured cream'], category: 'dairy', allergens: ['milk'] },
	{
		slug: 'yoghurt',
		name: 'yoghurt',
		aliases: ['yogurt', 'greek yoghurt', 'natural yoghurt'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{
		slug: 'cheese',
		name: 'cheese',
		aliases: ['tasty cheese', 'cheddar', 'colby'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{
		slug: 'parmesan',
		name: 'parmesan',
		aliases: ['parmigiano', 'parmigiano-reggiano', 'grana padano'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{
		slug: 'mozzarella',
		name: 'mozzarella',
		aliases: ['mozarella', 'pizza cheese'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{ slug: 'feta', name: 'feta', aliases: ['fetta'], category: 'dairy', allergens: ['milk'] },
	{ slug: 'ricotta', name: 'ricotta', category: 'dairy', allergens: ['milk'] },
	{
		slug: 'cream-cheese',
		name: 'cream cheese',
		aliases: ['philadelphia'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{ slug: 'cottage-cheese', name: 'cottage cheese', category: 'dairy', allergens: ['milk'] },
	{ slug: 'brie', name: 'brie', aliases: ['camembert'], category: 'dairy', allergens: ['milk'] },
	{ slug: 'blue-cheese', name: 'blue cheese', aliases: ['blue vein'], category: 'dairy', allergens: ['milk'] },
	{ slug: 'halloumi', name: 'halloumi', aliases: ['haloumi'], category: 'dairy', allergens: ['milk'] },
	{ slug: 'mascarpone', name: 'mascarpone', category: 'dairy', allergens: ['milk'] },
	{ slug: 'buttermilk', name: 'buttermilk', aliases: ['butter milk'], category: 'dairy', allergens: ['milk'] },
	{
		slug: 'condensed-milk',
		name: 'condensed milk',
		aliases: ['sweetened condensed milk'],
		category: 'dairy',
		allergens: ['milk'],
	},
	{ slug: 'evaporated-milk', name: 'evaporated milk', category: 'dairy', allergens: ['milk'] },
	{
		slug: 'ice-cream',
		name: 'ice cream',
		aliases: ['icecream'],
		category: 'dairy',
		allergens: ['milk'],
		allergen_uncertain: [
			{ code: 'eggs', note: 'some ice cream contains egg' },
			{ code: 'nuts', note: 'flavour variants may contain nuts' },
		],
	},
	{
		slug: 'custard',
		name: 'custard',
		category: 'dairy',
		allergens: ['milk'],
		allergen_uncertain: [
			{ code: 'eggs', note: 'egg custard contains eggs; instant custard may not' },
		],
	},

	// Eggs
	{
		slug: 'egg',
		name: 'egg',
		aliases: ['eggs', 'free range egg', 'whole egg'],
		category: 'egg',
		allergens: ['eggs'],
	},
	{
		slug: 'egg-white',
		name: 'egg white',
		aliases: ['egg whites', 'albumen'],
		category: 'egg',
		allergens: ['eggs'],
	},
	{ slug: 'egg-yolk', name: 'egg yolk', aliases: ['egg yolks'], category: 'egg', allergens: ['eggs'] },

	// Grains
	{
		slug: 'flour',
		name: 'flour',
		aliases: ['plain flour', 'all-purpose flour', 'wheat flour'],
		category: 'grain',
		allergens: ['gluten'],
	},
	{
		slug: 'self-raising-flour',
		name: 'self-raising flour',
		aliases: ['self raising flour', 'self-rising flour'],
		category: 'grain',
		allergens: ['gluten'],
	},
	{
		slug: 'bread',
		name: 'bread',
		aliases: ['loaf', 'sliced bread', 'white bread', 'wholemeal bread'],
		category: 'grain',
		allergens: ['gluten'],
	},
	{ slug: 'sourdough', name: 'sourdough', aliases: ['sourdough bread'], category: 'grain', allergens: ['gluten'] },
	{
		slug: 'wrap',
		name: 'wrap',
		aliases: ['tortilla', 'flatbread', 'pita'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'gluten', note: 'corn tortillas are usually GF; flour wraps are not — prefer corn-tortilla slug' },
		],
	},
	{ slug: 'flour-tortilla', name: 'flour tortilla', category: 'bakery', allergens: ['gluten'] },
	{
		slug: 'corn-tortilla',
		name: 'corn tortilla',
		category: 'bakery',
		allergen_uncertain: [{ code: 'gluten', note: 'usually GF corn; confirm brand' }],
		gluten_free: true,
	},
	{
		slug: 'pasta',
		name: 'pasta',
		aliases: ['spaghetti', 'penne', 'fettuccine'],
		category: 'grain',
		allergens: ['gluten'],
	},
	{
		slug: 'lasagna-sheet',
		name: 'lasagna sheet',
		aliases: ['lasagne sheet'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [{ code: 'eggs', note: 'egg pasta variants' }],
	},
	{
		slug: 'noodles',
		name: 'noodles',
		aliases: ['egg noodles', 'wheat noodles'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'eggs', note: 'egg noodles contain eggs; rice noodles do not — prefer rice-noodles slug' },
		],
	},
	{
		slug: 'rice-noodles',
		name: 'rice noodles',
		aliases: ['pad thai noodles', 'vermicelli rice'],
		category: 'grain',
		gluten_free: true,
	},
	{ slug: 'udon', name: 'udon', aliases: ['udon noodles'], category: 'grain', allergens: ['gluten'] },
	{
		slug: 'soba',
		name: 'soba',
		aliases: ['soba noodles', 'buckwheat noodles'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [
			{
				code: 'gluten',
				note: '100% buckwheat soba can be GF; most soba is wheat+buckwheat — fail closed gluten',
			},
		],
	},
	{
		slug: 'ramen-noodles',
		name: 'ramen noodles',
		aliases: ['instant noodles', '2-minute noodles'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'soybeans', note: 'seasoning packs often soy' },
			{ code: 'sesame', note: 'some flavour packs' },
			{ code: 'crustaceans', note: 'seafood flavours' },
			{ code: 'milk', note: 'some flavour packs' },
		],
	},
	{
		slug: 'vermicelli',
		name: 'vermicelli',
		aliases: ['glass noodles', 'bean thread noodles'],
		category: 'grain',
		allergen_uncertain: [
			{
				code: 'gluten',
				note: 'rice/mung vermicelli usually GF; wheat vermicelli is not — ambiguous name',
			},
		],
		gluten_free: true,
	},
	{ slug: 'couscous', name: 'couscous', category: 'grain', allergens: ['gluten'] },
	{
		slug: 'bulgur',
		name: 'bulgur',
		aliases: ['bulgur wheat', 'cracked wheat'],
		category: 'grain',
		allergens: ['gluten'],
	},
	{ slug: 'barley', name: 'barley', aliases: ['pearl barley'], category: 'grain', allergens: ['gluten'] },
	{
		slug: 'oats',
		name: 'oats',
		aliases: ['rolled oats', 'porridge oats', 'oatmeal'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [
			{
				code: 'gluten',
				note: 'botanically GF but NZ coeliac advice: only certified GF oats; standard oats fail closed',
			},
		],
		gluten_free: false,
	},
	{
		slug: 'rice',
		name: 'rice',
		aliases: ['white rice', 'long grain rice', 'jasmine rice', 'basmati'],
		category: 'grain',
		gluten_free: true,
	},
	{ slug: 'brown-rice', name: 'brown rice', category: 'grain', gluten_free: true },
	{ slug: 'risotto-rice', name: 'risotto rice', aliases: ['arborio'], category: 'grain', gluten_free: true },
	{ slug: 'sushi-rice', name: 'sushi rice', category: 'grain', gluten_free: true },
	{ slug: 'quinoa', name: 'quinoa', category: 'grain', gluten_free: true },
	{ slug: 'polenta', name: 'polenta', aliases: ['cornmeal'], category: 'grain', gluten_free: true },
	{
		slug: 'cornflour',
		name: 'cornflour',
		aliases: ['cornstarch', 'maize flour'],
		category: 'grain',
		gluten_free: true,
	},
	{ slug: 'breadcrumbs', name: 'breadcrumbs', aliases: ['panko'], category: 'grain', allergens: ['gluten'] },
	{ slug: 'cracker', name: 'cracker', aliases: ['crackers', 'water cracker'], category: 'grain', allergens: ['gluten'] },
	{
		slug: 'weet-bix',
		name: 'weet-bix',
		aliases: ['weetbix', 'wheat biscuits'],
		category: 'grain',
		allergens: ['gluten'],
		sources: ['curated'],
	},
	{
		slug: 'cereal',
		name: 'cereal',
		aliases: ['breakfast cereal'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'gluten', note: 'many cereals contain wheat; some corn/rice are GF' },
		],
	},
	{ slug: 'semolina', name: 'semolina', category: 'grain', allergens: ['gluten'] },
	{ slug: 'rye', name: 'rye', aliases: ['rye flour', 'rye bread'], category: 'grain', allergens: ['gluten'] },
	{ slug: 'spelt', name: 'spelt', aliases: ['spelt flour'], category: 'grain', allergens: ['gluten'] },
	{
		slug: 'rice-paper',
		name: 'rice paper',
		aliases: ['rice paper wrapper'],
		category: 'grain',
		gluten_free: true,
	},
	{
		slug: 'wonton-wrapper',
		name: 'wonton wrapper',
		aliases: ['dumpling wrapper'],
		category: 'grain',
		allergens: ['gluten'],
		allergen_uncertain: [{ code: 'eggs', note: 'often contain egg' }],
		vegan: false,
		vegetarian: true,
	},

	// Legumes
	{ slug: 'chickpea', name: 'chickpea', aliases: ['chickpeas', 'garbanzo', 'channa'], category: 'legume' },
	{
		slug: 'lentil',
		name: 'lentil',
		aliases: ['lentils', 'red lentil', 'brown lentil', 'green lentil'],
		category: 'legume',
	},
	{ slug: 'black-bean', name: 'black bean', aliases: ['black beans'], category: 'legume' },
	{
		slug: 'kidney-bean',
		name: 'kidney bean',
		aliases: ['red kidney bean', 'kidney beans'],
		category: 'legume',
	},
	{
		slug: 'cannellini',
		name: 'cannellini',
		aliases: ['white bean', 'white beans', 'navy bean'],
		category: 'legume',
	},
	{ slug: 'butter-bean', name: 'butter bean', aliases: ['lima bean'], category: 'legume' },
	{
		slug: 'baked-beans',
		name: 'baked beans',
		aliases: ['beans in tomato sauce'],
		category: 'legume',
		allergen_uncertain: [{ code: 'gluten', note: 'some sauces thicken with wheat; check label' }],
	},
	{
		slug: 'tofu',
		name: 'tofu',
		aliases: ['bean curd', 'firm tofu', 'silken tofu'],
		category: 'legume',
		allergens: ['soybeans'],
	},
	{ slug: 'tempeh', name: 'tempeh', category: 'legume', allergens: ['soybeans'] },
	{
		slug: 'edamame',
		name: 'edamame',
		aliases: ['soy beans', 'soya beans'],
		category: 'legume',
		allergens: ['soybeans'],
	},
	{
		slug: 'hummus',
		name: 'hummus',
		aliases: ['houmous'],
		category: 'legume',
		allergens: ['sesame'],
		allergen_uncertain: [
			{ code: 'sesame', note: 'sesame-free hummus exists; default assumes tahini' },
		],
	},
	{
		slug: 'split-pea',
		name: 'split pea',
		aliases: ['yellow split pea', 'green split pea'],
		category: 'legume',
	},
	{ slug: 'mung-bean', name: 'mung bean', aliases: ['moong'], category: 'legume' },

	// Nuts & seeds
	{ slug: 'peanut', name: 'peanut', aliases: ['peanuts', 'groundnut'], category: 'nut_seed', allergens: ['peanuts'] },
	{
		slug: 'peanut-butter',
		name: 'peanut butter',
		aliases: ['PB'],
		category: 'nut_seed',
		allergens: ['peanuts'],
	},
	{ slug: 'almond', name: 'almond', aliases: ['almonds'], category: 'nut_seed', allergens: ['nuts'] },
	{ slug: 'walnut', name: 'walnut', aliases: ['walnuts'], category: 'nut_seed', allergens: ['nuts'] },
	{ slug: 'cashew', name: 'cashew', aliases: ['cashews'], category: 'nut_seed', allergens: ['nuts'] },
	{
		slug: 'hazelnut',
		name: 'hazelnut',
		aliases: ['hazelnuts', 'filbert'],
		category: 'nut_seed',
		allergens: ['nuts'],
	},
	{ slug: 'pistachio', name: 'pistachio', aliases: ['pistachios'], category: 'nut_seed', allergens: ['nuts'] },
	{ slug: 'macadamia', name: 'macadamia', aliases: ['macadamias'], category: 'nut_seed', allergens: ['nuts'] },
	{ slug: 'pecan', name: 'pecan', aliases: ['pecans'], category: 'nut_seed', allergens: ['nuts'] },
	{
		slug: 'brazil-nut',
		name: 'brazil nut',
		aliases: ['brazil nuts'],
		category: 'nut_seed',
		allergens: ['nuts'],
	},
	{
		slug: 'pine-nut',
		name: 'pine nut',
		aliases: ['pine nuts', 'pignoli'],
		category: 'nut_seed',
		allergens: ['nuts'],
	},
	{
		slug: 'mixed-nuts',
		name: 'mixed nuts',
		category: 'nut_seed',
		allergens: ['nuts'],
		allergen_uncertain: [{ code: 'peanuts', note: 'mixes sometimes include peanuts' }],
	},
	{
		slug: 'sesame',
		name: 'sesame',
		aliases: ['sesame seed', 'sesame seeds'],
		category: 'nut_seed',
		allergens: ['sesame'],
	},
	{ slug: 'tahini', name: 'tahini', aliases: ['sesame paste'], category: 'nut_seed', allergens: ['sesame'] },
	{ slug: 'chia', name: 'chia', aliases: ['chia seed', 'chia seeds'], category: 'nut_seed' },
	{ slug: 'linseed', name: 'linseed', aliases: ['flaxseed', 'flax seed'], category: 'nut_seed' },
	{
		slug: 'pumpkin-seed',
		name: 'pumpkin seed',
		aliases: ['pepita', 'pumpkin seeds'],
		category: 'nut_seed',
	},
	{
		slug: 'sunflower-seed',
		name: 'sunflower seed',
		aliases: ['sunflower seeds'],
		category: 'nut_seed',
	},
	{ slug: 'poppy-seed', name: 'poppy seed', aliases: ['poppy seeds'], category: 'nut_seed' },
	{ slug: 'hemp-seed', name: 'hemp seed', aliases: ['hemp hearts'], category: 'nut_seed' },

	// Herbs & spices
	{
		slug: 'coriander',
		name: 'coriander',
		aliases: ['cilantro', 'fresh coriander', 'coriander leaf', 'chinese parsley'],
		category: 'herb_spice',
		sources: ['off', 'usda', 'curated'],
	},
	{
		slug: 'coriander-seed',
		name: 'coriander seed',
		aliases: ['coriander seeds', 'ground coriander'],
		category: 'herb_spice',
	},
	{
		slug: 'parsley',
		name: 'parsley',
		aliases: ['flat leaf parsley', 'italian parsley', 'curly parsley'],
		category: 'herb_spice',
	},
	{ slug: 'basil', name: 'basil', aliases: ['fresh basil', 'sweet basil'], category: 'herb_spice' },
	{ slug: 'mint', name: 'mint', aliases: ['fresh mint', 'spearmint'], category: 'herb_spice' },
	{ slug: 'rosemary', name: 'rosemary', category: 'herb_spice' },
	{ slug: 'thyme', name: 'thyme', category: 'herb_spice' },
	{ slug: 'oregano', name: 'oregano', category: 'herb_spice' },
	{ slug: 'sage', name: 'sage', category: 'herb_spice' },
	{ slug: 'dill', name: 'dill', aliases: ['dill weed'], category: 'herb_spice' },
	{ slug: 'chives', name: 'chives', category: 'herb_spice' },
	{ slug: 'tarragon', name: 'tarragon', category: 'herb_spice' },
	{ slug: 'bay-leaf', name: 'bay leaf', aliases: ['bay leaves'], category: 'herb_spice' },
	{ slug: 'kawakawa', name: 'kawakawa', category: 'herb_spice', sources: ['curated', 'foodon'] },
	{ slug: 'horopito', name: 'horopito', aliases: ['pepperwood'], category: 'herb_spice', sources: ['curated'] },
	{ slug: 'lemongrass', name: 'lemongrass', aliases: ['lemon grass'], category: 'herb_spice' },
	{
		slug: 'kaffir-lime',
		name: 'kaffir lime leaf',
		aliases: ['makrut lime leaf', 'kaffir lime'],
		category: 'herb_spice',
	},
	{ slug: 'galangal', name: 'galangal', category: 'herb_spice' },
	{ slug: 'pandan', name: 'pandan', aliases: ['pandan leaf'], category: 'herb_spice' },
	{ slug: 'cumin', name: 'cumin', aliases: ['cumin seed', 'ground cumin'], category: 'herb_spice' },
	{ slug: 'paprika', name: 'paprika', aliases: ['smoked paprika', 'sweet paprika'], category: 'herb_spice' },
	{ slug: 'turmeric', name: 'turmeric', aliases: ['ground turmeric'], category: 'herb_spice' },
	{ slug: 'cinnamon', name: 'cinnamon', aliases: ['cassia'], category: 'herb_spice' },
	{ slug: 'nutmeg', name: 'nutmeg', category: 'herb_spice' },
	{ slug: 'clove', name: 'clove', aliases: ['cloves'], category: 'herb_spice' },
	{ slug: 'cardamom', name: 'cardamom', aliases: ['cardamon'], category: 'herb_spice' },
	{ slug: 'star-anise', name: 'star anise', category: 'herb_spice' },
	{ slug: 'fennel-seed', name: 'fennel seed', aliases: ['fennel seeds'], category: 'herb_spice' },
	{
		slug: 'mustard-seed',
		name: 'mustard seed',
		aliases: ['mustard seeds', 'yellow mustard seed'],
		category: 'herb_spice',
		allergens: ['mustard'],
	},
	{
		slug: 'chilli-flakes',
		name: 'chilli flakes',
		aliases: ['chili flakes', 'red pepper flakes', 'crushed chilli'],
		category: 'herb_spice',
	},
	{ slug: 'cayenne', name: 'cayenne', aliases: ['cayenne pepper'], category: 'herb_spice' },
	{
		slug: 'curry-powder',
		name: 'curry powder',
		category: 'herb_spice',
		allergen_uncertain: [
			{ code: 'mustard', note: 'many blends include mustard seed' },
			{ code: 'gluten', note: 'rare fillers; check label' },
		],
	},
	{ slug: 'garam-masala', name: 'garam masala', category: 'herb_spice' },
	{ slug: 'chinese-five-spice', name: 'chinese five spice', aliases: ['five spice'], category: 'herb_spice' },
	{ slug: 'mixed-spice', name: 'mixed spice', aliases: ['pudding spice'], category: 'herb_spice' },
	{ slug: 'allspice', name: 'allspice', aliases: ['pimento'], category: 'herb_spice' },
	{ slug: 'sumac', name: 'sumac', category: 'herb_spice' },
	{
		slug: 'zaatar',
		name: "za'atar",
		aliases: ['zaatar'],
		category: 'herb_spice',
		allergens: ['sesame'],
		allergen_uncertain: [
			{ code: 'sesame', note: 'sesame-free blends exist; classic includes sesame' },
		],
	},
	{
		slug: 'dukkah',
		name: 'dukkah',
		aliases: ['duqqa'],
		category: 'herb_spice',
		allergens: ['nuts', 'sesame'],
		allergen_uncertain: [{ code: 'gluten', note: 'some blends include wheat' }],
	},
	{
		slug: 'vanilla',
		name: 'vanilla',
		aliases: ['vanilla extract', 'vanilla essence', 'vanilla bean'],
		category: 'herb_spice',
	},
	{ slug: 'garlic-powder', name: 'garlic powder', aliases: ['garlic granules'], category: 'herb_spice' },
	{ slug: 'onion-powder', name: 'onion powder', category: 'herb_spice' },
	{
		slug: 'stock-powder',
		name: 'stock powder',
		aliases: ['stock cube', 'bouillon', 'oxo'],
		category: 'herb_spice',
		allergen_uncertain: [
			{ code: 'celery', note: 'very common in stock powders' },
			{ code: 'gluten', note: 'some cubes contain wheat' },
			{ code: 'milk', note: 'some contain dairy' },
			{ code: 'soybeans', note: 'some contain soy' },
		],
	},
	{
		slug: 'italian-herbs',
		name: 'italian herbs',
		aliases: ['italian seasoning', 'mixed herbs'],
		category: 'herb_spice',
	},
	{ slug: 'elderflower', name: 'elderflower', aliases: ['elderflower cordial'], category: 'herb_spice' },
	{ slug: 'lavender', name: 'lavender', category: 'herb_spice' },

	// Condiments
	{
		slug: 'soy-sauce',
		name: 'soy sauce',
		aliases: ['soya sauce', 'soy', 'light soy', 'dark soy'],
		category: 'condiment',
		allergens: ['soybeans', 'gluten'],
		allergen_uncertain: [
			{
				code: 'gluten',
				note: 'tamari is often GF; standard soy sauce is wheat-based — fail closed gluten',
			},
		],
		gluten_free: false,
	},
	{
		slug: 'tamari',
		name: 'tamari',
		aliases: ['gluten free soy sauce'],
		category: 'condiment',
		allergens: ['soybeans'],
		allergen_uncertain: [{ code: 'gluten', note: 'most tamari is GF; confirm label' }],
		gluten_free: true,
	},
	{
		slug: 'worcestershire',
		name: 'worcestershire sauce',
		aliases: ['worcestershire', 'worcester sauce'],
		category: 'condiment',
		allergen_uncertain: [
			{ code: 'fish', note: 'classic recipe includes anchovy' },
			{ code: 'gluten', note: 'some brands contain gluten' },
			{ code: 'soybeans', note: 'some brands contain soy' },
		],
		vegan: false,
		vegetarian: false,
	},
	{
		slug: 'tomato-sauce',
		name: 'tomato sauce',
		aliases: ['ketchup', 'tomato ketchup'],
		category: 'condiment',
	},
	{
		slug: 'mayonnaise',
		name: 'mayonnaise',
		aliases: ['mayo', 'aioli'],
		category: 'condiment',
		allergens: ['eggs'],
		allergen_uncertain: [{ code: 'mustard', note: 'many mayo recipes include mustard' }],
		vegan: false,
		vegetarian: true,
	},
	{
		slug: 'mustard',
		name: 'mustard',
		aliases: ['dijon', 'wholegrain mustard', 'yellow mustard'],
		category: 'condiment',
		allergens: ['mustard'],
	},
	{ slug: 'vinegar', name: 'vinegar', aliases: ['white vinegar'], category: 'condiment' },
	{ slug: 'malt-vinegar', name: 'malt vinegar', category: 'condiment', allergens: ['gluten'] },
	{ slug: 'balsamic', name: 'balsamic vinegar', aliases: ['balsamic'], category: 'condiment' },
	{
		slug: 'apple-cider-vinegar',
		name: 'apple cider vinegar',
		aliases: ['acv', 'cider vinegar'],
		category: 'condiment',
	},
	{
		slug: 'wine-vinegar',
		name: 'wine vinegar',
		aliases: ['red wine vinegar', 'white wine vinegar'],
		category: 'condiment',
	},
	{ slug: 'hot-sauce', name: 'hot sauce', aliases: ['tabasco', 'chilli sauce'], category: 'condiment' },
	{
		slug: 'sweet-chilli',
		name: 'sweet chilli sauce',
		aliases: ['sweet chili sauce'],
		category: 'condiment',
	},
	{
		slug: 'oyster-sauce',
		name: 'oyster sauce',
		category: 'condiment',
		allergens: ['molluscs'],
		allergen_uncertain: [
			{ code: 'gluten', note: 'often contains wheat' },
			{ code: 'soybeans', note: 'often contains soy' },
		],
		vegan: false,
		vegetarian: false,
	},
	{
		slug: 'hoisin',
		name: 'hoisin sauce',
		category: 'condiment',
		allergens: ['soybeans'],
		allergen_uncertain: [
			{ code: 'gluten', note: 'often contains wheat' },
			{ code: 'sesame', note: 'some brands contain sesame' },
		],
	},
	{
		slug: 'teriyaki',
		name: 'teriyaki sauce',
		category: 'condiment',
		allergens: ['soybeans', 'gluten'],
		gluten_free: false,
	},
	{
		slug: 'pesto',
		name: 'pesto',
		category: 'condiment',
		allergens: ['nuts', 'milk'],
		allergen_uncertain: [
			{ code: 'nuts', note: 'classic basil pesto uses pine nuts' },
			{ code: 'milk', note: 'classic includes parmesan' },
		],
		vegan: false,
		vegetarian: true,
	},
	{ slug: 'relish', name: 'relish', aliases: ['tomato relish'], category: 'condiment' },
	{ slug: 'chutney', name: 'chutney', aliases: ['mango chutney'], category: 'condiment' },
	{ slug: 'jam', name: 'jam', aliases: ['jelly', 'marmalade', 'conserve'], category: 'condiment' },
	{
		slug: 'honey',
		name: 'honey',
		aliases: ['manuka honey', 'mānuka honey'],
		category: 'condiment',
		vegan: false,
		vegetarian: true,
	},
	{ slug: 'maple-syrup', name: 'maple syrup', aliases: ['maple'], category: 'condiment' },
	{ slug: 'golden-syrup', name: 'golden syrup', category: 'condiment' },
	{ slug: 'treacle', name: 'treacle', aliases: ['molasses'], category: 'condiment' },
	{
		slug: 'sugar',
		name: 'sugar',
		aliases: ['white sugar', 'caster sugar', 'raw sugar'],
		category: 'condiment',
	},
	{ slug: 'brown-sugar', name: 'brown sugar', aliases: ['soft brown sugar'], category: 'condiment' },
	{
		slug: 'icing-sugar',
		name: 'icing sugar',
		aliases: ['powdered sugar', 'confectioners sugar'],
		category: 'condiment',
	},
	{ slug: 'coconut-sugar', name: 'coconut sugar', category: 'condiment' },
	{
		slug: 'baking-powder',
		name: 'baking powder',
		category: 'condiment',
		allergen_uncertain: [
			{ code: 'gluten', note: 'most NZ baking powder is GF; rare wheat starch — check if coeliac' },
		],
	},
	{
		slug: 'baking-soda',
		name: 'baking soda',
		aliases: ['bicarbonate of soda', 'bicarb'],
		category: 'condiment',
	},
	{ slug: 'cream-of-tartar', name: 'cream of tartar', category: 'condiment', sources: ['usda', 'curated'] },
	{ slug: 'yeast', name: 'yeast', aliases: ['instant yeast', 'active yeast', 'dried yeast'], category: 'condiment' },
	{
		slug: 'gelatine',
		name: 'gelatine',
		aliases: ['gelatin', 'gelatine leaves'],
		category: 'condiment',
		vegan: false,
		vegetarian: false,
	},
	{ slug: 'agar', name: 'agar', aliases: ['agar agar'], category: 'condiment' },
	{ slug: 'cocoa', name: 'cocoa', aliases: ['cocoa powder', 'cacao'], category: 'condiment' },
	{
		slug: 'chocolate',
		name: 'chocolate',
		aliases: ['dark chocolate'],
		category: 'condiment',
		allergen_uncertain: [
			{ code: 'milk', note: 'milk chocolate contains milk; dark may have traces' },
			{ code: 'soybeans', note: 'lecithin often soy' },
			{ code: 'nuts', note: 'may contain nuts' },
		],
	},
	{
		slug: 'milk-chocolate',
		name: 'milk chocolate',
		category: 'condiment',
		allergens: ['milk'],
		allergen_uncertain: [
			{ code: 'soybeans', note: 'lecithin often soy' },
			{ code: 'nuts', note: 'may contain nuts' },
		],
		vegan: false,
		vegetarian: true,
	},
	{
		slug: 'white-chocolate',
		name: 'white chocolate',
		category: 'condiment',
		allergens: ['milk'],
		allergen_uncertain: [{ code: 'soybeans', note: 'lecithin often soy' }],
		vegan: false,
		vegetarian: true,
	},
	{
		slug: 'peanut-sauce',
		name: 'peanut sauce',
		aliases: ['satay sauce'],
		category: 'condiment',
		allergens: ['peanuts'],
		allergen_uncertain: [
			{ code: 'soybeans', note: 'often contains soy' },
			{ code: 'gluten', note: 'may contain wheat' },
		],
	},
	{
		slug: 'miso',
		name: 'miso',
		aliases: ['miso paste'],
		category: 'condiment',
		allergens: ['soybeans'],
		allergen_uncertain: [
			{ code: 'gluten', note: 'some miso uses barley/wheat; rice/soy miso may be GF' },
		],
	},
	{
		slug: 'wasabi',
		name: 'wasabi',
		category: 'condiment',
		allergen_uncertain: [
			{ code: 'mustard', note: 'imitation wasabi often horseradish; may include mustard — check' },
		],
	},
	{
		slug: 'pickled-ginger',
		name: 'pickled ginger',
		aliases: ['gari'],
		category: 'condiment',
		allergen_uncertain: [{ code: 'sulphites', note: 'may contain sulphites' }],
	},
	{
		slug: 'mirin',
		name: 'mirin',
		aliases: ['sweet rice wine'],
		category: 'condiment',
		allergen_uncertain: [
			{ code: 'gluten', note: 'hon-mirin usually GF; mirin-style seasoning may contain gluten' },
		],
	},
	{
		slug: 'shaoxing',
		name: 'shaoxing wine',
		aliases: ['chinese cooking wine'],
		category: 'condiment',
		allergen_uncertain: [{ code: 'gluten', note: 'some brands contain wheat' }],
	},
	{ slug: 'capers', name: 'capers', aliases: ['caper'], category: 'condiment' },
	{ slug: 'sambal', name: 'sambal', aliases: ['sambal oelek'], category: 'condiment' },
	{
		slug: 'harissa',
		name: 'harissa',
		category: 'condiment',
		allergen_uncertain: [{ code: 'gluten', note: 'check brand' }],
	},
	{ slug: 'nutritional-yeast', name: 'nutritional yeast', aliases: ['nooch'], category: 'condiment' },

	// Oils & fats
	{
		slug: 'olive-oil',
		name: 'olive oil',
		aliases: ['extra virgin olive oil', 'evoo', 'light olive oil'],
		category: 'oil_fat',
	},
	{
		slug: 'vegetable-oil',
		name: 'vegetable oil',
		aliases: ['canola oil', 'rapeseed oil', 'sunflower oil'],
		category: 'oil_fat',
	},
	{
		slug: 'sesame-oil',
		name: 'sesame oil',
		aliases: ['toasted sesame oil'],
		category: 'oil_fat',
		allergens: ['sesame'],
	},
	{ slug: 'coconut-oil', name: 'coconut oil', category: 'oil_fat' },
	{
		slug: 'peanut-oil',
		name: 'peanut oil',
		aliases: ['groundnut oil'],
		category: 'oil_fat',
		allergens: ['peanuts'],
	},
	{ slug: 'avocado-oil', name: 'avocado oil', category: 'oil_fat' },
	{ slug: 'rice-bran-oil', name: 'rice bran oil', category: 'oil_fat' },
	{
		slug: 'ghee',
		name: 'ghee',
		aliases: ['clarified butter'],
		category: 'oil_fat',
		allergens: ['milk'],
		vegan: false,
		vegetarian: true,
	},
	{ slug: 'lard', name: 'lard', aliases: ['pork fat'], category: 'oil_fat', vegan: false, vegetarian: false },
	{
		slug: 'dripping',
		name: 'dripping',
		aliases: ['beef dripping'],
		category: 'oil_fat',
		vegan: false,
		vegetarian: false,
	},
	{
		slug: 'margarine',
		name: 'margarine',
		aliases: ['spread'],
		category: 'oil_fat',
		allergen_uncertain: [
			{ code: 'milk', note: 'some spreads contain milk' },
			{ code: 'soybeans', note: 'often contains soy' },
		],
	},

	// Bakery
	{
		slug: 'puff-pastry',
		name: 'puff pastry',
		aliases: ['flaky pastry'],
		category: 'bakery',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'milk', note: 'butter pastry contains milk; margarine versions may not' },
		],
	},
	{
		slug: 'shortcrust',
		name: 'shortcrust pastry',
		aliases: ['pie pastry'],
		category: 'bakery',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'milk', note: 'often contains butter' },
			{ code: 'eggs', note: 'some recipes include egg' },
		],
	},
	{ slug: 'filo', name: 'filo pastry', aliases: ['phyllo'], category: 'bakery', allergens: ['gluten'] },
	{
		slug: 'pizza-base',
		name: 'pizza base',
		aliases: ['pizza base ready-made'],
		category: 'bakery',
		allergens: ['gluten'],
	},
	{
		slug: 'bagel',
		name: 'bagel',
		category: 'bakery',
		allergens: ['gluten'],
		allergen_uncertain: [{ code: 'sesame', note: 'often topped with sesame' }],
	},
	{
		slug: 'croissant',
		name: 'croissant',
		category: 'bakery',
		allergens: ['gluten', 'milk'],
		allergen_uncertain: [{ code: 'eggs', note: 'may contain egg' }],
		vegan: false,
		vegetarian: true,
	},
	{
		slug: 'muffin',
		name: 'muffin',
		category: 'bakery',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'eggs', note: 'usually contains egg' },
			{ code: 'milk', note: 'usually contains milk' },
		],
	},
	{
		slug: 'biscuit',
		name: 'biscuit',
		aliases: ['cookie', 'cookies'],
		category: 'bakery',
		allergens: ['gluten'],
		allergen_uncertain: [
			{ code: 'eggs', note: 'often' },
			{ code: 'milk', note: 'often' },
			{ code: 'nuts', note: 'variants' },
		],
	},

	// Beverages / stocks
	{ slug: 'coffee', name: 'coffee', aliases: ['espresso', 'instant coffee'], category: 'beverage' },
	{ slug: 'tea', name: 'tea', aliases: ['black tea', 'english breakfast'], category: 'beverage' },
	{ slug: 'green-tea', name: 'green tea', category: 'beverage' },
	{ slug: 'matcha', name: 'matcha', aliases: ['matcha powder'], category: 'beverage' },
	{ slug: 'wine', name: 'wine', aliases: ['red wine', 'white wine', 'cooking wine'], category: 'beverage' },
	{ slug: 'beer', name: 'beer', aliases: ['lager', 'ale'], category: 'beverage', allergens: ['gluten'] },
	{ slug: 'orange-juice', name: 'orange juice', category: 'beverage', sources: ['curated'] },
	{ slug: 'apple-juice', name: 'apple juice', category: 'beverage', sources: ['curated'] },
	{ slug: 'tomato-juice', name: 'tomato juice', category: 'beverage', sources: ['curated'] },
	{
		slug: 'soda-water',
		name: 'soda water',
		aliases: ['sparkling water', 'club soda'],
		category: 'beverage',
		sources: ['curated'],
	},
	{
		slug: 'stock',
		name: 'stock',
		aliases: ['broth'],
		category: 'beverage',
		allergen_uncertain: [
			{ code: 'celery', note: 'commercial stock usually contains celery' },
			{ code: 'gluten', note: 'check label' },
			{ code: 'fish', note: 'fish stock variant' },
		],
		vegan: true,
		vegetarian: true,
	},
	{
		slug: 'chicken-stock',
		name: 'chicken stock',
		aliases: ['chicken broth'],
		category: 'beverage',
		allergen_uncertain: [
			{ code: 'celery', note: 'commercial usually contains celery' },
			{ code: 'gluten', note: 'check label' },
		],
		vegan: false,
		vegetarian: false,
	},
	{
		slug: 'beef-stock',
		name: 'beef stock',
		aliases: ['beef broth'],
		category: 'beverage',
		allergen_uncertain: [
			{ code: 'celery', note: 'commercial usually contains celery' },
			{ code: 'gluten', note: 'check label' },
		],
		vegan: false,
		vegetarian: false,
	},
	{
		slug: 'vegetable-stock',
		name: 'vegetable stock',
		aliases: ['veg stock', 'vegetable broth'],
		category: 'beverage',
		allergen_uncertain: [
			{ code: 'celery', note: 'commercial usually contains celery' },
			{ code: 'gluten', note: 'check label' },
		],
	},
	{ slug: 'coconut-water', name: 'coconut water', category: 'beverage' },

	// Other
	{ slug: 'nori', name: 'nori', aliases: ['sushi seaweed', 'seaweed sheet'], category: 'other' },
	{ slug: 'seaweed', name: 'seaweed', aliases: ['wakame', 'kelp', 'kombu'], category: 'other' },
	{
		slug: 'corn-chips',
		name: 'corn chips',
		aliases: ['tortilla chips'],
		category: 'other',
		allergen_uncertain: [
			{ code: 'gluten', note: 'usually corn-based; check seasoning' },
			{ code: 'milk', note: 'cheese flavours contain milk' },
		],
	},
	{ slug: 'cacao-nibs', name: 'cacao nibs', category: 'other', sources: ['usda', 'curated'] },
	{ slug: 'popcorn', name: 'popcorn', category: 'other' },
]

function build() {
	const ingredients = specs.map(item)
	const bySlug = new Map()
	for (const row of ingredients) {
		if (bySlug.has(row.slug)) {
			throw new Error(`Duplicate slug: ${row.slug}`)
		}
		bySlug.set(row.slug, row)
	}

	ingredients.sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug))

	const aliasMap = new Map()
	for (const row of ingredients) {
		const keys = [row.name.toLowerCase(), ...row.aliases.map((a) => a.toLowerCase())]
		for (const key of keys) {
			if (!aliasMap.has(key)) aliasMap.set(key, new Set())
			aliasMap.get(key).add(row.slug)
		}
	}

	/** @type {{ slug: string, kind: string, detail: string }[]} */
	const reviews = []
	for (const row of ingredients) {
		for (const u of row.allergen_uncertain) {
			reviews.push({
				slug: row.slug,
				kind: 'allergen_uncertain',
				detail: `${u.code}: ${u.note}`,
			})
		}
	}
	const ambiguous = [
		'chocolate',
		'stock',
		'vermicelli',
		'ramen-noodles',
		'sausage',
		'hummus',
		'oats',
		'tamari',
		'pesto',
		'kimchi',
		'worcestershire',
		'wrap',
		'cereal',
		'noodles',
		'margarine',
	]
	for (const slug of ambiguous) {
		if (bySlug.has(slug)) {
			reviews.push({
				slug,
				kind: 'diet_or_identity_ambiguous',
				detail: 'Ambiguous commercial product; diet/allergen flags need human confirm',
			})
		}
	}
	for (const [label, slugs] of [...aliasMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
		if (slugs.size > 1) {
			reviews.push({
				slug: [...slugs].sort().join(','),
				kind: 'alias_clash',
				detail: `label '${label}' maps to ${[...slugs].sort().join(', ')}`,
			})
		}
	}

	const doc = {
		version: 1,
		locale: 'en-NZ',
		description:
			'Canonical NZ pantry ingredients for Chef Llama chip canonicalizer, planned D1 ingredients table, and future Vectorize embeddings.',
		id_policy: {
			slug: 'Stable external key (kebab-case). Unique. Used by chip canonicalizer and Try me wiring.',
			d1_id:
				'On load into RECIPES_DB, each row also gets a ULID primary key (see docs/data.md). Slug stays UNIQUE.',
			vectorize: 'Embed name + aliases; metadata includes slug (and ULID after D1 load).',
		},
		diet_flags: ['vegan', 'vegetarian', 'gluten_free'],
		diet_flags_note:
			'v1 closed Diet flags only (product.md). Multi-Diet UI moved from v2 into v1; the flag list did not expand (no keto/halal/paleo).',
		allergen_codes: ALLERGENS,
		allergen_codes_note:
			'Aligned with Open Food Facts allergen taxonomy tags (en:*). Easy to hand-check. Uncertain cases use allergen_uncertain — never guess.',
		categories: CATEGORIES,
		ingredients,
	}

	mkdirSync(outDir, { recursive: true })
	writeFileSync(join(outDir, 'nz-pantry.json'), `${JSON.stringify(doc, null, 2)}\n`)
	writeFileSync(
		join(outDir, 'MANUAL_REVIEW.json'),
		`${JSON.stringify({ count: reviews.length, items: reviews }, null, 2)}\n`,
	)

	console.log(`ingredients: ${ingredients.length}`)
	console.log(`review items: ${reviews.length}`)
	console.log(
		`alias clashes: ${reviews.filter((r) => r.kind === 'alias_clash').length}`,
	)
}

build()
