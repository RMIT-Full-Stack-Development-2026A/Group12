const mongoose = require("mongoose");

const BotSchema = new mongoose.Schema({
    name: String,
    difficulty: {
        type: String,
        enum: ['EASY', 'MEDIUM', 'HARD']
    }
});

const Bot = mongoose.model("Bot", BotSchema);
module.exports = Bot;