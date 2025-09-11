const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyaları public klasöründen servisle
app.use(express.static(path.join(__dirname, 'public')));

// Basit healthcheck
app.get('/ping', (req, res) => res.send('pong'));

// Basit kullanıcı takibi (in-memory)
let users = {}; // socketId -> { username }

io.on('connection', (socket) => {
  console.log('Yeni bağlantı:', socket.id);

  // Kullanıcı adı ayarla
  socket.on('setUsername', (username, callback) => {
    if (!username || typeof username !== 'string') return;
    username = username.trim().slice(0, 30);

    // Aynı kullanıcı adının kullanımını engelle
    const nameTaken = Object.values(users).some(u => u.username === username);
    if (nameTaken) {
      callback({ ok: false, message: 'Bu kullanıcı adı zaten alınmış.' });
      return;
    }

    users[socket.id] = { username };
    socket.broadcast.emit('userJoined', { id: socket.id, username });
    io.emit('users', Object.values(users).map(u => u.username));
    callback({ ok: true, users: Object.values(users).map(u => u.username) });
  });

  // Mesaj gönderme
  socket.on('sendMessage', (msg) => {
    const user = users[socket.id];
    if (!user) return;
    const message = {
      id: Date.now() + Math.random().toString(36).slice(2, 8),
      from: user.username,
      text: String(msg).slice(0, 1000),
      time: new Date().toISOString()
    };
    // Mesajı tüm kullanıcılara yayınla
    io.emit('newMessage', message);
  });

  // Yazıyor bildirimi
  socket.on('typing', (isTyping) => {
    const user = users[socket.id];
    if (!user) return;
    socket.broadcast.emit('typing', { username: user.username, isTyping: !!isTyping });
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      console.log('Ayrıldı:', user.username);
      delete users[socket.id];
      socket.broadcast.emit('userLeft', { id: socket.id, username: user.username });
      io.emit('users', Object.values(users).map(u => u.username));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));