const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect("mongodb://127.0.0.1:27017/blogdb")
  .then(() => console.log("MongoDB'ye bağlandı"))
  .catch(err => console.log(err));

// User şeması
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Blog şeması
const blogSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const Blog = mongoose.model("Blog", blogSchema);

// Middleware - JWT doğrulama
const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Token bulunamadı" });

  jwt.verify(token, "SECRET_KEY", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Geçersiz token" });
    req.userId = decoded.userId;
    next();
  });
};

// Rotalar

// Kullanıcı kayıt
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPw = await bcrypt.hash(password, 10);
  try {
    const newUser = new User({ username, password: hashedPw });
    await newUser.save();
    res.json({ message: "Kayıt başarılı" });
  } catch (err) {
    res.status(400).json({ message: "Kullanıcı zaten var" });
  }
});

// Kullanıcı giriş
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı" });

  const isPwValid = await bcrypt.compare(password, user.password);
  if (!isPwValid) return res.status(400).json({ message: "Yanlış şifre" });

  const token = jwt.sign({ userId: user._id }, "SECRET_KEY", { expiresIn: "1h" });
  res.json({ token });
});

// Blog ekle (login gerekli)
app.post("/blogs", authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  const blog = new Blog({ title, content, author: req.userId });
  await blog.save();
  res.json(blog);
});

// Tüm blogları listele
app.get("/blogs", async (req, res) => {
  const blogs = await Blog.find().populate("author", "username");
  res.json(blogs);
});

// Server
app.listen(3000, () => {
  console.log("Server 3000 portunda çalışıyor");
});
