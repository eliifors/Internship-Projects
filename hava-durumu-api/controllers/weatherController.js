const axios = require('axios');
const { validationResult } = require('express-validator');

class WeatherController {
  constructor() {
    this.API_KEY = "f7ea5f2b6b92efa498e1ea527c7ffb94";
    this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
    this.GEO_URL = 'https://api.openweathermap.org/geo/1.0';
  }

  // API Key kontrolü
  checkApiKey() {
    if (!this.API_KEY) {
      throw new Error('OpenWeatherMap API key tanımlanmamış!');
    }
  }

  // Şehir koordinatlarını getir
  async getCityCoordinates(cityName) {
    try {
      const response = await axios.get(`${this.GEO_URL}/direct`, {
        params: {
          q: cityName,
          limit: 1,
          appid: this.API_KEY
        }
      });

      if (response.data.length === 0) {
        return null;
      }

      return {
        lat: response.data[0].lat,
        lon: response.data[0].lon,
        name: response.data[0].name,
        country: response.data[0].country,
        state: response.data[0].state || null
      };
    } catch (error) {
      throw new Error('Şehir koordinatları alınamadı');
    }
  }

  // Hava durumu verisini formatla
  formatWeatherData(data, cityInfo = null) {
    return {
      city: {
        name: cityInfo ? cityInfo.name : data.name,
        country: cityInfo ? cityInfo.country : data.sys?.country,
        coordinates: {
          lat: data.coord.lat,
          lon: data.coord.lon
        }
      },
      weather: {
        main: data.weather[0].main,
        description: this.translateDescription(data.weather[0].description),
        icon: data.weather[0].icon
      },
      temperature: {
        current: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        min: Math.round(data.main.temp_min),
        max: Math.round(data.main.temp_max)
      },
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      wind: {
        speed: data.wind?.speed || 0,
        direction: data.wind?.deg || 0,
        gust: data.wind?.gust || null
      },
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
      cloudiness: data.clouds?.all || 0,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('tr-TR'),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('tr-TR'),
      timestamp: new Date(data.dt * 1000).toISOString()
    };
  }

  // Tahmin verisini formatla
  formatForecastData(data, cityInfo = null) {
    return {
      city: {
        name: cityInfo ? cityInfo.name : data.city.name,
        country: cityInfo ? cityInfo.country : data.city.country,
        coordinates: {
          lat: data.city.coord.lat,
          lon: data.city.coord.lon
        }
      },
      forecast: data.list.map(item => ({
        datetime: new Date(item.dt * 1000).toISOString(),
        date: new Date(item.dt * 1000).toLocaleDateString('tr-TR'),
        time: new Date(item.dt * 1000).toLocaleTimeString('tr-TR'),
        weather: {
          main: item.weather[0].main,
          description: this.translateDescription(item.weather[0].description),
          icon: item.weather[0].icon
        },
        temperature: {
          current: Math.round(item.main.temp),
          feelsLike: Math.round(item.main.feels_like),
          min: Math.round(item.main.temp_min),
          max: Math.round(item.main.temp_max)
        },
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        wind: {
          speed: item.wind?.speed || 0,
          direction: item.wind?.deg || 0
        },
        cloudiness: item.clouds?.all || 0,
        precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0
      }))
    };
  }

  // Açıklamaları Türkçeye çevir
  translateDescription(description) {
    const translations = {
      'clear sky': 'açık',
      'few clouds': 'az bulutlu',
      'scattered clouds': 'parçalı bulutlu',
      'broken clouds': 'çok bulutlu',
      'overcast clouds': 'kapalı',
      'light rain': 'hafif yağmurlu',
      'moderate rain': 'yağmurlu',
      'heavy rain': 'şiddetli yağmurlu',
      'thunderstorm': 'gök gürültülü fırtına',
      'snow': 'karlı',
      'mist': 'puslu',
      'fog': 'sisli',
      'haze': 'dumanlı'
    };

    return translations[description.toLowerCase()] || description;
  }

  // Güncel hava durumu
  async getCurrentWeather(req, res) {
    try {
      this.checkApiKey();

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const cityName = req.params.city;

      // Şehir koordinatlarını al
      const cityInfo = await this.getCityCoordinates(cityName);
      if (!cityInfo) {
        return res.status(404).json({
          success: false,
          message: 'Şehir bulunamadı! Lütfen geçerli bir şehir adı giriniz.'
        });
      }

      // Hava durumu verilerini al
      const response = await axios.get(`${this.BASE_URL}/weather`, {
        params: {
          lat: cityInfo.lat,
          lon: cityInfo.lon,
          appid: this.API_KEY,
          units: 'metric',
          lang: 'tr'
        }
      });

      const formattedData = this.formatWeatherData(response.data, cityInfo);

      res.json({
        success: true,
        data: formattedData
      });

    } catch (error) {
      console.error('Weather API Error:', error.message);

      if (error.response?.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Geçersiz API anahtarı'
        });
      }

      if (error.response?.status === 429) {
        return res.status(429).json({
          success: false,
          message: 'API kullanım limiti aşıldı'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Hava durumu bilgileri alınamadı'
      });
    }
  }

  // 5 günlük tahmin
  async getForecast(req, res) {
    try {
      this.checkApiKey();

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const cityName = req.params.city;

      // Şehir koordinatlarını al
      const cityInfo = await this.getCityCoordinates(cityName);
      if (!cityInfo) {
        return res.status(404).json({
          success: false,
          message: 'Şehir bulunamadı! Lütfen geçerli bir şehir adı giriniz.'
        });
      }

      // Hava durumu tahminlerini al
      const response = await axios.get(`${this.BASE_URL}/forecast`, {
        params: {
          lat: cityInfo.lat,
          lon: cityInfo.lon,
          appid: this.API_KEY,
          units: 'metric',
          lang: 'tr'
        }
      });

      const formattedData = this.formatForecastData(response.data, cityInfo);

      res.json({
        success: true,
        data: formattedData
      });

    } catch (error) {
      console.error('Forecast API Error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Hava durumu tahminleri alınamadı'
      });
    }
  }

  // Çoklu şehir hava durumu
  async getMultipleCities(req, res) {
    try {
      this.checkApiKey();

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { cities } = req.body;
      const weatherData = [];

      for (const cityName of cities) {
        try {
          const cityInfo = await this.getCityCoordinates(cityName);
          
          if (!cityInfo) {
            weatherData.push({
              city: cityName,
              success: false,
              message: 'Şehir bulunamadı'
            });
            continue;
          }

          const response = await axios.get(`${this.BASE_URL}/weather`, {
            params: {
              lat: cityInfo.lat,
              lon: cityInfo.lon,
              appid: this.API_KEY,
              units: 'metric',
              lang: 'tr'
            }
          });

          weatherData.push({
            success: true,
            data: this.formatWeatherData(response.data, cityInfo)
          });

        } catch (error) {
          weatherData.push({
            city: cityName,
            success: false,
            message: 'Hava durumu bilgisi alınamadı'
          });
        }
      }

      res.json({
        success: true,
        data: weatherData
      });

    } catch (error) {
      console.error('Multiple cities error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Çoklu şehir verisi alınamadı'
      });
    }
  }

  // Şehir arama
  async searchCities(req, res) {
    try {
      this.checkApiKey();

      const { q, limit = 5 } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'En az 2 karakter giriniz'
        });
      }

      const response = await axios.get(`${this.GEO_URL}/direct`, {
        params: {
          q: q,
          limit: Math.min(parseInt(limit), 10),
          appid: this.API_KEY
        }
      });

      const cities = response.data.map(city => ({
        name: city.name,
        country: city.country,
        state: city.state || null,
        coordinates: {
          lat: city.lat,
          lon: city.lon
        }
      }));

      res.json({
        success: true,
        data: cities,
        count: cities.length
      });

    } catch (error) {
      console.error('City search error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Şehir arama yapılamadı'
      });
    }
  }
}

module.exports = new WeatherController();