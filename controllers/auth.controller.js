const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { email, password, name, phone, address } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 400, 'Email already exists', null);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    email,
    password: hashedPassword,
    name,
    phone,
    address,
  });
  await user.save();
  return successResponse(res, 201, 'Register successful', user);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return errorResponse(res, 400, 'Invalid email', null);
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return errorResponse(res, 400, 'Invalid password', null);
  }
  return successResponse(res, 200, 'Login successful', user);
};
