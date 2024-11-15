const express = require("express"); 
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const mongoUri = 'mongodb://localhost:27017/spyne-db';



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

    res.json(reqUser.userCarList);
});


app.get("/getProductById", async (req, res) => {
    const {productId, userId} = req.body;
    if(!productId || !userId) return res.status(400).json({error: "productId and userId are required"});

    const reqUser = await UserCar.findOne({userId: userId});
    const product = reqUser.userCarList.find(product => product._id.toString() === productId);

    if(!product) return res.status(404).json({error: "Product not found"});
    res.json(product);
});


app.delete("/deleteProductById", async (req, res) => {
    try {
      const { productId, userId } = req.body;
      
      // Validate inputs
      if (!productId || !userId) {
        return res.status(400).json({ error: "productId and userId are required" });
      }
  
      // Find the user's car list
      const userCar = await UserCar.findOne({ userId: userId });
      
      if (!userCar) {
        return res.status(404).json({ error: "User car list not found" });
      }
  
      // Check if product exists in user's list
      const productIndex = userCar.userCarList.indexOf(productId);
      if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found in user's list" });
      }
  
      // Remove product from userCarList
      userCar.userCarList.splice(productIndex, 1);
      await userCar.save();
  
      // Also delete the product from Products collection
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
  
      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }
  
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
  
      // Create new user
      const newUser = new User({
        username,
        email,
        password
      });
  
      // Save user (password will be hashed by pre-save middleware)
      await newUser.save();
  
      // Create UserCar document for the new user
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
  
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
  
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Email does not exist" });
      }
  
      // Compare password
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