const service = require('./auth.service');

exports.login = async (req, res) => {
  try {
    const data = await service.login(req.body);

    res.json({
      message: 'Login success',
      token: data.token,
      user: {
        id: data.user._id,
        role: data.user.role
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};