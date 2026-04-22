/*
 * ============================================================
 * PROJECT  : TicTacToang
 * MODULE   : User Profile
 * LAYER    : Model
 * FEATURE  : Edit Profile
 * BRANCH   : feature/edit-profile
 * AUTHOR   : Edit Profile Developer
 * CREATED  : 2026-04-10
 * SRS REF  : 3.1.1 / 3.2.1
 * NOTE     : Stores UI preference choices used by profile APIs.
 * ============================================================
 */

const mongoose = require('mongoose');
const { BOARD_SIZES, BOARD_STYLES, MARKER_OPTIONS } = require('../../constants/enums');

const preferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    preferredMarker: {
      type: String,
      enum: MARKER_OPTIONS,
      default: 'X'
    },
    preferredBoardStyle: {
      type: Number,
      enum: BOARD_STYLES,
      default: 1
    },
    preferredBoardSize: {
      type: String,
      enum: BOARD_SIZES,
      default: '10x10'
    },
    isVipStyle: {
      // Only settable when user.isPremium === true
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    collection: 'player_preference'
  }
);

module.exports =
  mongoose.models.PlayerPreference ||
  mongoose.model('PlayerPreference', preferenceSchema);
