const Category = require('../models/category');
const Book = require('../models/book');
const { validationResult } = require('express-validator');

// Tüm kategorileri getir
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    res.json({ 
      success: true, 
      data: categories,
      count: categories.length 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ID ile kategori getir
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kategori bulunamadı' 
      });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kategoriye ait kitapları getir
exports.getBooksByCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kategori bulunamadı' 
      });
    }

    const books = await Book.find({ category: req.params.id })
      .populate('category', 'name')
      .sort({ title: 1 });

    res.json({ 
      success: true, 
      data: books,
      category: category.name,
      count: books.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Yeni kategori oluştur
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const category = new Category(req.body);
    await category.save();

    res.status(201).json({ 
      success: true, 
      data: category,
      message: 'Kategori başarıyla oluşturuldu'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        message: 'Bu kategori adı zaten kullanılıyor' 
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// Kategori güncelle
exports.updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kategori bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      data: category,
      message: 'Kategori başarıyla güncellendi'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        message: 'Bu kategori adı zaten kullanılıyor' 
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// Kategori sil
exports.deleteCategory = async (req, res) => {
  try {
    // Kategoriye ait kitap var mı kontrol et
    const bookCount = await Book.countDocuments({ category: req.params.id });
    
    if (bookCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu kategoriye ait kitaplar bulunduğu için silinemez' 
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kategori bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Kategori başarıyla silindi' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};