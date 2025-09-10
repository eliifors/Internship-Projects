const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const weatherController = require('../controllers/weatherController');


// Validation middleware
const cityValidation = [
  param('city')
    .notEmpty()
    .withMessage('Şehir adı gereklidir')
    .isLength({ min: 2, max: 50 })
    .withMessage('Şehir adı 2-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-ZğüşıöçĞÜŞIİÖÇ\s-]+$/)
    .withMessage('Geçersiz şehir adı formatı')
];

const multipleCitiesValidation = [
  body('cities')
    .isArray({ min: 1, max: 5 })
    .withMessage('En az 1, en fazla 5 şehir girilebilir'),
  body('cities.*')
    .isString()
    .notEmpty()
    .withMessage('Şehir adları string olmalıdır')
    .isLength({ min: 2, max: 50 })
    .withMessage('Her şehir adı 2-50 karakter arasında olmalıdır')
];

// Routes
router.get('/current/:city', cityValidation, weatherController.getCurrentWeather);
router.get('/forecast/:city', cityValidation, weatherController.getForecast);
router.post('/multiple', multipleCitiesValidation, weatherController.getMultipleCities);
router.get('/cities/search', weatherController.searchCities);

module.exports = router;
