var express = require('express');
const {
  getUserDetails,
  getAllUsers,
  updateUser,
  deleteUser,
  createUser,
} = require('../controllers/user.controller');
var router = express.Router();

router.get('/', getAllUsers);
router.post('/', createUser);
router.get('/:id', getUserDetails);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);


module.exports = router;
