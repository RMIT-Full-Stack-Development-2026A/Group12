const express = require('express');
const { register, login } = require('../controller/authController');
const { validateRegister, validateLogin } = require('../middleware/authValidation');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

module.exports = router;
