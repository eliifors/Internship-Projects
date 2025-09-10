const Book = require('../models/book');
const Category = require('../models/category');
const { validationResult } = require('express-validator');

// Tüm kitapları getir (filtreleme ve sayfalama ile)
exports.getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    let sort = {};

    // Filtreleme
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.author) {
      query.author = { $regex: req.query.author, $options: 'i' };
    }

    if (req.query.publishYear) {
      query.publishYear = req.query.publishYear;
    }

    if (req.query.inStock !== undefined) {
      query.inStock = req.query.inStock === 'true';
    }

    // Sıralama
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort.createdAt = -1; // Varsayılan: En yeni önce
    }

    const books = await Book.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kitap arama
exports.searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Arama terimi gereklidir' 
      });
    }

    const books = await Book.find({
      $text: { $search: q }
    })
    .populate('category', 'name')
    .sort({ score: { $meta: 'textScore' } });

    res.json({
      success: true,
      data: books,
      count: books.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ID ile kitap getir
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('category');
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kitap bulunamadı' 
      });
    }

    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Yeni kitap oluştur
exports.createBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Kategori kontrolü
    const categoryExists = await Category.findById(req.body.category);
    if (!categoryExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçersiz kategori' 
      });
    }

    const book = new Book(req.body);
    await book.save();
    
    await book.populate('category', 'name');

    res.status(201).json({ 
      success: true, 
      data: book,
      message: 'Kitap başarıyla oluşturuldu'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        message: 'Bu ISBN numarası zaten kullanılıyor' 
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// Kitap güncelle
exports.updateBook = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Geçersiz kategori' 
        });
      }
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('category', 'name');
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kitap bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      data: book,
      message: 'Kitap başarıyla güncellendi'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        success: false, 
        message: 'Bu ISBN numarası zaten kullanılıyor' 
      });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// Kitap sil
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kitap bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Kitap başarıyla silindi' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
