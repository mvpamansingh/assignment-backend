const mongoose = require('mongoose');

const userCarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userCarList: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

const UserCar = mongoose.model('UserCar', userCarSchema);
module.exports = UserCar;