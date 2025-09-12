const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const rateLimiter = require('../middleware/rateLimiter');

// create short url
router.post('/shorten', rateLimiter, urlController.createShortUrl);

// get info about short url
router.get('/:shortId', urlController.getUrlInfo);

module.exports = router;