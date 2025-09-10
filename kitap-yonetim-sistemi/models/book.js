const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Kitap başlığı gereklidir'],
    trim: true,
    maxlength: [200, 'Başlık en fazla 200 karakter olabilir']
  },
  author: {
    type: String,
    required: [true, 'Yazar adı gereklidir'],
    trim: true,
    maxlength: [100, 'Yazar adı en fazla 100 karakter olabilir']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Kategori seçimi gereklidir']
  },
  publishYear: {
    type: Number,
    min: [1000, 'Geçerli bir yıl giriniz'],
    max: [new Date().getFullYear(), 'Gelecek yıl girilemez']
  },
  pageCount: {
    type: Number,
    min: [1, 'Sayfa sayısı en az 1 olmalıdır']
  },
  description: {
    type: String,
    maxlength: [1000, 'Açıklama en fazla 1000 karakter olabilir']
  },
  inStock: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

//Arama rehberi için 
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ category: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ publishYear: -1 });

module.exports = mongoose.model('Book', bookSchema);