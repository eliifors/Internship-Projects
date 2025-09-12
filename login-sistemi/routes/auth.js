const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// @route POST /api/auth/register
// @desc Register user
// @access Public
router.post(
'/register',
[
check('name', 'Name is required').notEmpty(),
check('email', 'Please include a valid email').isEmail(),
check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
],
authController.register
);

// @route POST /api/auth/login
// @desc Login user and return JWT
// @access Public
router.post(
'/login',
[
check('email', 'Please include a valid email').isEmail(),
check('password', 'Password is required').exists()
],
authController.login
);

// @route GET /api/auth/me
// @desc Get current user (protected)
// @access Private
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;