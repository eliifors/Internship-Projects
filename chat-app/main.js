const socket = io();
text.textContent = msg.text;
el.appendChild(meta);
el.appendChild(text);
messagesDiv.appendChild(el);
messagesDiv.scrollTop = messagesDiv.scrollHeight;

joinBtn.addEventListener('click', () => {
const username = usernameInput.value.trim();
if (!username) return alert('Lütfen bir kullanıcı adı girin');
socket.emit('setUsername', username, (res) => {
if (!res.ok) return alert(res.message || 'Kullanıcı adı alınamadı');
myUsername = username;
document.querySelector('.login').hidden = true;
onlineList.hidden = false;
updateUsers(res.users);
});
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
if (e.key === 'Enter') sendMessage();
else {
socket.emit('typing', true);
clearTimeout(typingTimeout);
typingTimeout = setTimeout(() => socket.emit('typing', false), 800);
}
});

function sendMessage() {
const text = messageInput.value.trim();
if (!text || !myUsername) return;
socket.emit('sendMessage', text);
messageInput.value = '';
}

function updateUsers(list) {
usersUl.innerHTML = '';
list.forEach(u => {
const li = document.createElement('li');
li.textContent = u;
usersUl.appendChild(li);
});
}

// Socket events
socket.on('newMessage', (msg) => {
addMessage(msg, msg.from === myUsername);
});

socket.on('users', (list) => updateUsers(list));

socket.on('userJoined', ({ username }) => {
const info = { from: 'System', text: `${username} sohbete katıldı`, time: new Date().toISOString() };
addMessage(info, false);
});

socket.on('userLeft', ({ username }) => {
const info = { from: 'System', text: `${username} ayrıldı`, time: new Date().toISOString() };
addMessage(info, false);
});

socket.on('typing', ({ username, isTyping }) => {
if (isTyping) typingDiv.textContent = `${username} yazıyor...`;
else typingDiv.textContent = '';
});

// Basit güvenlik: socket disconnect on page unload
window.addEventListener('beforeunload', () => {
socket.disconnect();
});