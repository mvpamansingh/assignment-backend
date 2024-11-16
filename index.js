const express = require("express"); 
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const mongoUri = 'mongodb+srv://amans:BlackDog@123@cluster0.rapuo.mongodb.net/splynedb';

const projectId = "maa-oauth";
const keyFilename = "maa-oauth-22b2807272c4.json";

const storage = new Storage({
  projectId,
  keyFilename
});

// storage.getBuckets().then(results => {
//    // const buckets = results[0];
//     console.log(results);
// })


const carBucket = storage.bucket("assignment-car")

// models
const User = require('./models/Users');
const UserCar = require('./models/UsersCars');
const Product = require('./models/Products');

mongoose
  .connect(mongoUri, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));



app.get("/", (req, res) => {
  res.send("Hello World Check");
});


// Routes

app.post("/getAllProducts", async (req, res) => {
    try {
        const {userId} = req.body;
        if(!userId) return res.status(400).json({error: "userId is required"});

        const userCar = await UserCar.findOne({userId: userId});
        if (!userCar) {
            return res.status(404).json({ error: "User not found" });
        }

        const products = await Product.find({
            '_id': { $in: userCar.userCarList }
        });

        res.json(products);
    } catch (error) {
        console.error("Get all products error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.post("/getProductById", async (req, res) => {
    try {
        
      const { productId, userId } = req.body;
        if (!productId || !userId) {
            return res.status(400).json({ error: "productId and userId are required" });
        }

        
        const userCar = await UserCar.findOne({userId: userId });
        if (!userCar) {
            return res.status(404).json({ error: "User not found" });
        }

       
        if (!userCar.userCarList.includes(productId)) {
            return res.status(404).json({ error: "Product not found in user's list" });
        }

        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json(product);
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.post("/deleteProductById", async (req, res) => {
    try {
      const { productId, userId } = req.body;
      
    
      if (!productId || !userId) {
        return res.status(400).json({ error: "productId and userId are required" });
      }
  
      
      const userCar = await UserCar.findOne({ userId: userId });
      
      if (!userCar) {
        return res.status(404).json({ error: "User car list not found" });
      }
  
      
      const productIndex = userCar.userCarList.indexOf(productId);
      if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found in user's list" });
      }
  
     
      userCar.userCarList.splice(productIndex, 1);
      await userCar.save();
  
    
      await Product.findByIdAndDelete(productId);
  
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// SignUp endpoint
app.post("/signup", async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
  
     
      const newUser = new User({
        username,
        email,
        password
      });
  
      
      await newUser.save();
  
     
      const newUserCar = new UserCar({
        userId: newUser._id,
        userCarList: []
      });
      await newUserCar.save();
  
      res.status(201).json({ message: "User created successfully", userId: newUser._id });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // SignIn endpoint
  app.post("/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
  
      
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Email does not exist" });
      }
  
      
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }
  
      res.json({ 
        message: "Login successful",
        userId: user._id,
        username: user.username,
        email: user.email
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  




// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 6 * 1024 * 1024, 
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png/;
//     const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (extname && mimetype) {
//       return cb(null, true);
//     } else {
//       cb('Error: Images only (jpeg, jpg, png)!');
//     }
//   }
// });

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})


app.post("/createProduct", upload.array('carImages', 10), async (req, res) => {
  try {
    const { createdBy, title, description, tags, company, carType, dealer } = req.body;
    const files = req.files;
    
    console.log('Request body:', req.body); 
    console.log('Files:', files);
  
    if (!createdBy || !title || !description || !company) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    
    const invalidFile = req.files.find(file => !file.mimetype.startsWith('image/'));
    if (invalidFile) {
      return res.status(400).json({ error: "Only image files are allowed" });
    }
   
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }
    if (files.length > 10) {
      return res.status(400).json({ error: "Maximum 10 images allowed" });
    }

    
    const carImages = await Promise.all(files.map(async (file) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      const blob = carBucket.file(fileName);
      
     
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        resumable: false
      });

      
      await new Promise((resolve, reject) => {
        blobStream.on('error', (error) => reject(error));
        blobStream.on('finish', () => resolve());
        blobStream.end(file.buffer);
      });

      
      const publicUrl = `https://storage.googleapis.com/${carBucket.name}/${fileName}`;
      console.log(publicUrl)
      return {
        url: publicUrl,
        publicId: fileName
      };
    }));

    
    const newProduct = new Product({
      title,
      description,
      tags: tags ? JSON.parse(tags) : [],
      company,
      carType,
      dealer,
      carImages,
      createdBy: createdBy
    });

    await newProduct.save();

    
    const userCar = await UserCar.findOne({ userId :createdBy });
    if (!userCar) {
      return res.status(404).json({ error: "User car list not found" });
    }

    userCar.userCarList.push(newProduct._id);
    await userCar.save();

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct
    });

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error", details:error.message });
  }
});



app.post("/updateProductById", upload.array('carImages', 10), async (req, res) => {
  try {
    const { productId, title, description, tags, carType, dealer } = req.body;
    const files = req.files;

   
    if (!productId) {
      return res.status(400).json({ error: "ProductId is required" });
    }

    
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    
    let carImages = existingProduct.carImages; 
    if (files && files.length > 0) {
      
      const newCarImages = await Promise.all(files.map(async (file) => {
        const fileName = `${Date.now()}-${file.originalname}`;
        const blob = carBucket.file(fileName);
        
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
          resumable: false
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', (error) => reject(error));
          blobStream.on('finish', () => resolve());
          blobStream.end(file.buffer);
        });

        const publicUrl = `https://storage.googleapis.com/${carBucket.name}/${fileName}`;
        return {
          url: publicUrl,
          publicId: fileName
        };
      }));


      carImages = newCarImages;
    }

    
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        title: title || existingProduct.title,
        description: description || existingProduct.description,
        tags: tags ? JSON.parse(tags) : existingProduct.tags,
        carType: carType || existingProduct.carType,
        dealer: dealer || existingProduct.dealer,
        carImages: carImages
      },
      { new: true } 
    );

    res.json({
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
});

