const { auth: authService } = require('../services');
const {
  mapRegisterPayload,
  mapLoginPayload
} = require('../dtos/authDto');

async function register(req, res) {
  const requestDto = mapRegisterPayload(req.body);
  const result = await authService.register(requestDto);
  return res.status(result.statusCode).json(result.body);
}

async function login(req, res) {
  const requestDto = mapLoginPayload(req.body);
  const result = await authService.login(requestDto);
  return res.status(result.statusCode).json(result.body);
}

function getCountryList(req, res) {
  const result = authService.getCountryList();
  return res.status(result.statusCode).json(result.body);
}

module.exports = {
  register,
  login,
  getCountryList
};