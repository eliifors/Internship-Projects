const { customAlphabet } = require('nanoid');

const length = parseInt(process.env.SHORT_ID_LENGTH || '7', 10);
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = customAlphabet(alphabet, length);

module.exports = function generateShortId() {
return nanoid();
};