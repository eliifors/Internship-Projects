const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();
app.use(express.json());
app.use(cors());

// routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

app.get('/', (req, res) => res.send('Mini e-ticaret backend çalışıyor'));

app.use(errorHandler);

module.exports = app;
