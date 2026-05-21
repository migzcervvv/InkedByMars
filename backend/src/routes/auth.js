'use strict';

const express = require('express');
const router = express.Router();

const { login, register, logout, getMe } = require('../controllers/authController');
const { loginValidators, registerValidators } = require('../validators/authValidators');
const validate = require('../middlewares/validate');
const { requireAdmin, requireSuperAdmin } = require('../middlewares/auth');

// Public
router.post('/login', loginValidators, validate, login);

// Protected — super_admin only can create new admins
router.post('/register', requireSuperAdmin, registerValidators, validate, register);

// Protected
router.post('/logout', requireAdmin, logout);
router.get('/me', requireAdmin, getMe);

module.exports = router;
