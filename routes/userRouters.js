const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require("passport");
const dotenv = require("dotenv");
dotenv.config();
const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Configure Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/users/auth/google/callback",
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // If user doesn't exist, create a new user
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            password: hashedPassword,
            phone: "",
            address: "",
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Route to initiate Google login
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google OAuth callback route
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "http://localhost:3000/login?error=true",
  }),
  async (req, res) => {
    try {
      // Create JWT token
      const token = jwt.sign({ userId: req.user._id }, "jwt_secret_key", {
        expiresIn: "1h",
      });
 
      // Redirect to React app with token
      res.redirect(`http://localhost:3000/login?token=${token}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect("http://localhost:3000/login?error=true");
    }
  }
);
// Cấu hình Passport Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:4000/users/auth/facebook/callback",
      profileFields: ["id", "displayName", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra xem user đã tồn tại chưa
        let user = await User.findOne({ facebookId: profile.id });

        if (!user) {
          // Nếu chưa có user, tạo user mới
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          user = new User({
            facebookId: profile.id,
            name: profile.displayName,
            email:
              profile.emails?.[0]?.value || `fb_${profile.id}@facebook.com`,
            password: hashedPassword,
            phone: "",
            address: "",
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Route bắt đầu đăng nhập Facebook
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", {
    scope: ["public_profile", "email"],
  })
);

// Route callback từ Facebook
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "http://localhost:3000/login?error=true",
  }),
  async (req, res) => {
    try {
      // Tạo JWT token
      const token = jwt.sign({ userId: req.user._id }, "jwt_secret_key", {
        expiresIn: "1h",
      });

      // Chuyển hướng về React app với token
      res.redirect(`http://localhost:3000/login?token=${token}`);
    } catch (error) {
      console.error("Facebook callback error:", error);
      res.redirect("http://localhost:3000/login?error=true");
    }
  }
);

// Đăng ký
router.post('/register', async (req, res) => {
    const { name, email, password, phone, address } = req.body;
    const reg = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const isCheckEmail = reg.test(email)
    try {
        // Kiểm tra xem email đã tồn tại chưa
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'Email đã tồn tại' });
        }
        console.log('isCheckEmail', isCheckEmail)
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        // Tạo người dùng mới
        user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
        });
        // Lưu vào cơ sở dữ liệu
        await user.save();
        res.status(201).json({ message: 'Đăng ký thành công', user });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Lỗi đăng ký', details: err });
    }
});

// Đăng nhập với quyền user 
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Kiểm tra email có tồn tại không
        const user = await User.findOne({ email, role: 'user' });
        if (!user) {
            return res.status(400).json({ error: 'Email không tồn tại' });
        }
        // So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu không đúng' });
        }
        // Tạo token JWT
        const token = jwt.sign({ userId: user._id }, 'jwt_secret_key', { expiresIn: '5h' });

        res.status(200).json({ message: 'Đăng nhập thành công', token });
    } catch (err) {
        console.error('Login error:', err); // Log the full error in the server console
        res.status(500).json({ error: 'Lỗi đăng nhập', details: err.message });
    }
});

// Đăng nhập theo quyền shipper
router.post('/login-shipper', async (req, res) => {
  const { email, password } = req.body;
  try {
      // Kiểm tra email có tồn tại không
      const user = await User.findOne({ email, role: 'shipper' });
      if (!user) {
          return res.status(400).json({ error: 'Email không tồn tại' });
      }
      // So sánh mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ error: 'Mật khẩu không đúng' });
      }
      // Tạo token JWT
      const token = jwt.sign({ userId: user._id }, 'jwt_secret_key', { expiresIn: '5h' });

      res.status(200).json({ message: 'Đăng nhập thành công', token });
  } catch (err) {
      console.error('Login error:', err); // Log the full error in the server console
      res.status(500).json({ error: 'Lỗi đăng nhập', details: err.message });
  }
});

// Đăng nhập theo quyền admin
router.post('/login-admin', async (req, res) => {
  const { email, password } = req.body;
  try {
      // Kiểm tra email có tồn tại không
      const user = await User
        .findOne({ email, role: 'admin' });
      if (!user) {
          return res.status(400).json({ error: 'Email không tồn tại' });
      }
      // So sánh mật khẩu
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          return res.status(400).json({ error: 'Mật khẩu không đúng' });
      }
      // Tạo token JWT
      const token = jwt.sign({ userId: user._id }, 'jwt_secret_key', { expiresIn: '5h' });

          res.status(200).json({ message: 'Đăng nhập thành công', token });
  } catch (err) {
      console.error('Login error:', err); // Log the full error in the server console
      res.status(500).json({ error: 'Lỗi đăng nhập', details: err.message });
  }
});

// Lấy tất cả người dùng
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách người dùng', details: err });
    }
});

// Lấy người dùng theo userId
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.userId });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi lấy thông tin người dùng', details: err });
    }
});

// Thêm người dùng mới
router.post('/createUser', async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;

  // Kiểm tra email hợp lệ
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ' });
  }

  try {
    // Kiểm tra xem email đã tồn tại với bất kỳ vai trò nào chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: `Email đã được sử dụng cho vai trò: ${existingUser.role}` });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role // role có thể là 'user', 'admin', hoặc 'shipper'
    });

    // Lưu vào cơ sở dữ liệu
    await newUser.save();
    res.status(201).json({ message: 'Đăng ký thành công', user: newUser });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Lỗi đăng ký', details: err.message });
  }
});

// Sửa thông tin người dùng
router.put('/:userId', async (req, res) => {
    try {
        const { gender, birthday, ...otherFields } = req.body;

        // Validate giới tính nếu có
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ error: 'Giới tính không hợp lệ' });
        }

        // Validate ngày sinh nếu có
        if (birthday && isNaN(Date.parse(birthday))) {
            return res.status(400).json({ error: 'Ngày sinh không hợp lệ' });
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: req.params.userId },
            { ...otherFields, gender, birthday },
            { new: true } // Trả về tài liệu đã cập nhật
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi cập nhật người dùng', details: err });
    }
});

// Xóa người dùng
router.delete('/:userId', async (req, res) => {
    try {
        const deletedUser = await User.findOneAndDelete({ _id: req.params.userId });
        if (!deletedUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.status(200).json({ message: 'Đã xóa người dùng thành công' });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi khi xóa người dùng', details: err });
    }
});

module.exports = router;
