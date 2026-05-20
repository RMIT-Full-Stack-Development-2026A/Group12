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

const STANDARD_MARKERS = ['X', 'O', 'A', 'B', '△', '○']
const VIP_MARKERS = ['★', '❤', '☯']
const MARKER_OPTIONS = [...STANDARD_MARKERS, ...VIP_MARKERS]
const MARKER_COLORS = ['#000000', '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0f766e']
const BOARD_STYLES = [1, 2, 3]
const BOARD_SIZES = ['10x10', '15x15']

const ALLOWED_MARKERS = [...STANDARD_MARKERS, ...VIP_MARKERS];
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
	STANDARD_MARKERS,
	VIP_MARKERS,
	MARKER_OPTIONS,
	MARKER_COLORS,
	BOARD_STYLES,
	BOARD_SIZES,
	AI_BOT_NAMES,
	ALLOWED_MARKERS,
	ALLOWED_BOARD_SIZES,
	ALLOWED_GAME_MODES,
	ALLOWED_AI_LEVELS,
}
