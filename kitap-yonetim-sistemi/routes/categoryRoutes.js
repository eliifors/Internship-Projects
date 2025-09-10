const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');


// Doğrulama kuralları
const categoryValidation = [
  body('name').notEmpty().withMessage('Kategori adı gereklidir').isLength({ max: 50 }),
  body('description').optional().isLength({ max: 200 })
];


// Routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/:id/books', categoryController.getBooksByCategory);
router.post('/', categoryValidation, categoryController.createCategory);
router.put('/:id', categoryValidation, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;