const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
shortId: { type: String, required: true, unique: true, index: true },
longUrl: { type: String, required: true },
alias: { type: String, default: null, unique: true, sparse: true },
clicks: { type: Number, default: 0 },
createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Url', urlSchema);