const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
name: { type: String, required: true, index: true },
description: { type: String },
price: { type: Number, required: true },
countInStock: { type: Number, default: 0 },
category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
image: { type: String },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);