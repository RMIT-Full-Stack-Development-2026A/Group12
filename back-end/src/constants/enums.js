/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Constant
 * FEATURE  : Edit Profile / Session History
 * BRANCH   : feature/edit-profile
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1 / 3.1.2
 * NOTE     : Shared constants for profile update and session output mapping.
 * ============================================================
 */

// enums.js - Edit Profile additions
// Added by: feature/edit-profile branch
// Do NOT overwrite existing exports from other branches.
// Other branches should append their constants directly below this block:
// - feature/register: validation and registration enums
// - feature/login: auth and token status enums
// - feature/game: session and board enums
// - feature/subscription: billing and premium enums
// - feature/admin: admin action and moderation enums

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
  'New Zealand'
];

const MARKER_OPTIONS = ['X', 'O', '★', '♦', '●', '▲'];
const BOARD_STYLES = [1, 2, 3];
const BOARD_SIZES = ['10x10', '15x15'];
const AI_BOT_NAMES = {
  easy: 'Jeremy',
  medium: 'Bot',
  hard: 'HardBot'
};

module.exports = {
  COUNTRY_LIST,
  MARKER_OPTIONS,
  BOARD_STYLES,
  BOARD_SIZES,
  AI_BOT_NAMES
};
