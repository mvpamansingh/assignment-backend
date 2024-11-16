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


const mongoUri = 'mongodb://localhost:27017/spyne-db';

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

app.get("/getAllProducts", async (req, res) => {

    const {userId} = req.body;
    if(!userId) return res.status(400).json({error: "userId is required"});

    const reqUser = await UserCar.findOne({userId: userId});

    const products = await Product.find({
        '_id': { $in: userCar.userCarList }
    });

    res.json(products);
});


app.get("/getProductById", async (req, res) => {
    try {
        const { productId, userId } = req.body;
        if (!productId || !userId) {
            return res.status(400).json({ error: "productId and userId are required" });
        }

        
        const userCar = await UserCar.findOne({ userId });
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


app.delete("/deleteProductById", async (req, res) => {
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


  




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only (jpeg, jpg, png)!');
    }
  }
});





