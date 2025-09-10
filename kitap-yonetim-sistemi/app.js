const express = require('express');
const mongoose = require('mongoose');

const app = express();

const bookRoutes = require('./routes/bookRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MongoDB bağlantısı
mongoose.connect("mongodb+srv://eliif:eliif111121@cluster0.q9cqw4m.mongodb.net/")
.then(() => {
    console.log("MongoDB bağlantısı başarılı");
})
.catch((err) => {
    console.error("MongoDB bağlantısı hatası:", err);
});

// Routeslar
app.use('/api/books', bookRoutes);
app.use('/api/categories', categoryRoutes);


// 404 hatası için middleware
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint bulunamadı!' 
  });
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
