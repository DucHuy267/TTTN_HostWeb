const express = require('express');
const productRouters = require('./routes/productRouters');
const categoryRouters = require('./routes/categoryRouters');
const userRouters = require('./routes/userRouters');
const cartRouters = require('./routes/cartRouters');
const orderRouters = require('./routes/orderRoutes');
const brandRoutes = require('./routes/brandRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const charts = require('./routes/charts');
const chatbot = require('./routes/Chatbot');
const comments = require('./routes/comments');
const dmf = require('./routes/DMF');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require("passport");
const dotenv = require("dotenv");
const session = require("express-session");
const jwt = require("jsonwebtoken");    

require("./config/passport")
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://root:123@cocoon.w7y96.mongodb.net/tttn');
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Error connecting to MongoDB', err);
        process.exit(1);
    };
}

const app = express();
app.use(
  session({
    secret: "afhgfhfdhgfh123213",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(cors());
app.use(passport.initialize());
app.use(passport.session());
const port = 4000;

connectDB();

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to parse URL-encoded requests
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all: return React index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Sử dụng các routes cho sản phẩm và danh mục
app.use('/products', productRouters);
app.use('/categories', categoryRouters);
app.use('/users', userRouters);
app.use('/carts', cartRouters);
app.use('/orders', orderRouters);
app.use('/brands', brandRoutes);
app.use('/vouchers', voucherRoutes);
app.use('/charts', charts);
app.use('/chatbot', chatbot)
app.use('/comments', comments);
app.use('/dmf', dmf);

// Social authentication routes
app.get(
    "/auth/facebook",
    passport.authenticate("facebook", {
      scope: ["public_profile", "email"], // Thêm cả public_profile
    })
  );
  
  app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", {
      failureRedirect: "http://localhost:3000/login?error=true",
      session: false,
    }),
    (req, res) => {
      // Tạo JWT token
      const token = jwt.sign({ userId: req.user._id }, "afhgfhfdhgfh123213", {
        expiresIn: "1h",
      });
      res.redirect(`http://localhost:3000/login?token=${token}`);
    }
  );
  // Google Authentication Routes
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      prompt: "select_account consent",
    })
  );
  
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "http://localhost:3000/login?error=true",
      session: false,
    }),
    (req, res) => {
      const token = jwt.sign({ userId: req.user._id }, "afhgfhfdhgfh123213", {
        expiresIn: "1h",
      });
      res.redirect(`http://localhost:3000/login?token=${token}`);
    }
  );

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

