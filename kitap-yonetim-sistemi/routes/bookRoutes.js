const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookController = require('../controllers/bookController');

// Doğrulama kuralları
const bookValidation = [
  body('title').notEmpty().withMessage('Kitap başlığı gereklidir').isLength({ max: 200 }),
  body('author').notEmpty().withMessage('Yazar adı gereklidir').isLength({ max: 100 }),
  body('category').notEmpty().withMessage('Kategori gereklidir').isMongoId(),
  body('publishYear').optional().isInt({ min: 1000, max: new Date().getFullYear() }),
  body('pageCount').optional().isInt({ min: 1 }),
  body('description').optional().isLength({ max: 1000 })
];

// Routes
router.get('/', bookController.getAllBooks);
router.get('/search', bookController.searchBooks);
router.get('/:id', bookController.getBookById);
router.post('/', bookValidation, bookController.createBook);
router.put('/:id', bookValidation, bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;