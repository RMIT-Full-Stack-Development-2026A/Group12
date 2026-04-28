const COUNTRY_LIST = [
	'Vietnam',
	'Australia',
	'United States',
	'United Kingdom',
	'Canada',
	'Singapore',
	'Japan',
	'South Korea',
	'India',
	'Germany',
	'France',
	'New Zealand',
]

const MARKER_OPTIONS = ['X', 'O', 'A', 'B', '△', '○']
const BOARD_STYLES = [1, 2, 3]
const BOARD_SIZES = ['10x10', '15x15']

const ALLOWED_MARKERS = ['X', 'O', 'A', 'B', '△', '○'];
const ALLOWED_BOARD_SIZES = [3, 10, 15];
const ALLOWED_GAME_MODES = ['LOCAL', 'SINGLE', 'ONLINE'];
const ALLOWED_AI_LEVELS = ['easy', 'medium', 'hard'];

const AI_BOT_NAMES = {
	easy: 'Easy Bot',
	medium: 'Medium Bot',
	hard: 'Hard Bot',
}

module.exports = {
	COUNTRY_LIST,
	MARKER_OPTIONS,
	BOARD_STYLES,
	BOARD_SIZES,
	AI_BOT_NAMES,
	ALLOWED_MARKERS,
	ALLOWED_BOARD_SIZES,
	ALLOWED_GAME_MODES,
	ALLOWED_AI_LEVELS,
}
