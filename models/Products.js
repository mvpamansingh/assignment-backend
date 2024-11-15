const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  company: {
    type: String,
    required: true,
    trim: true
  },
  carType: {
    type: String,
    //required: true,
    trim: true
  },
  dealer: {
    type: String,
    
    trim: true
  },
  carImages: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Validate maximum number of images
productSchema.path('carImages').validate(function(images) {
  return images.length <= 10;
}, 'Cannot upload more than 10 images per car');

const Product = mongoose.model('Product', productSchema);
module.exports = Product;