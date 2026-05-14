const express = require('express');
const { register, login, getCountryList, verify } = require('../controller/authController');
const { validateRegister, validateLogin } = require('../middleware/authValidation');
const { authenticateJWT } = require('../middleware/jwtAuth');

const router = express.Router();

router.get('/countries', getCountryList);
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/verify', authenticateJWT, verify);

module.exports = router;
