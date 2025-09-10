const express = require('express');


const weatherRoutes = require('./routes/weatherRoutes');



const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/weather', weatherRoutes);


// Ana route
app.get('/', (req, res) => {
  res.json({
    message: 'Hava Durumu API\'sine Hoş Geldiniz!',
    endpoints: {
      current: '/api/weather/current/:city',
      forecast: '/api/weather/forecast/:city',
      multiple: '/api/weather/multiple'
    },
    usage: {
      example: '/api/weather/current/istanbul'
    }
  });
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı!'
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
