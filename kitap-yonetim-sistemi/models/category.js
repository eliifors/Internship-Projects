const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kategori adı gereklidir'],
    unique: true,
    trim: true,
    maxlength: [50, 'Kategori adı en fazla 50 karakter olabilir']
  },
  description: {
    type: String,
    maxlength: [200, 'Açıklama en fazla 200 karakter olabilir']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
