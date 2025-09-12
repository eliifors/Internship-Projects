# Kullanıcı Kayıt & Login Sistemi

Bu proje, Node.js kullanılarak geliştirilmiş basit bir kimlik doğrulama API’sidir.  
Kullanıcılar kayıt olabilir, giriş yapabilir ve JWT ile token alarak korunan endpointlere erişebilir.  
Şifreler bcrypt ile hashlenerek güvenli şekilde saklanır.

## Kullanılan Teknolojiler
- Node.js & Express
- MongoDB & Mongoose
- Bcrypt.js (şifre güvenliği)
- JWT (token ile kimlik doğrulama)
- Dotenv (ortam değişkenleri)

## Çalıştırma
```bash
npm install
npm start
