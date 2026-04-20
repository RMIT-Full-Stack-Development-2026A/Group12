const mongoose = require("mongoose");

const BotSchema = new mongoose.Schema({
    name: String,
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    }
});

const Bot = mongoose.model("Bot", BotSchema);
module.exports = Bot;