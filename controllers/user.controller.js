const User = require('../models/User');
const { errorResponse, successResponse } = require('../utils/responseUtil');
const bcrypt = require('bcrypt');

exports.getUserDetails = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return errorResponse(res, 404, 'User not found', null);
  }
  return successResponse(res, 200, 'User details fetched successfully', user);
};
exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  return successResponse(res, 200, 'All users fetched successfully', users);
};
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  const user = await User.findById(id);
  if (!user) {
    return errorResponse(res, 404, 'User not found', null);
  }
  user.name = name;
  user.phone = phone;
  user.address = address;
  await user.save();
  return successResponse(res, 200, 'User updated successfully', user);
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  return successResponse(res, 200, 'User deleted successfully', user);
};
exports.createUser = async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
  });
  return successResponse(res, 201, 'User created successfully', user);
};
