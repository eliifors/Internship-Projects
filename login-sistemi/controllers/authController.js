const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

const { name, email, password } = req.body;

try {
// check existing
let user = await User.findOne({ email });
if (user) return res.status(400).json({ errors: [{ msg: 'User already exists' }] });

// hash password
const hashed = await bcrypt.hash(password, saltRounds);

user = new User({ name, email, password: hashed });
await user.save();

// create jwt payload
const payload = { user: { id: user.id } };

jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn }, (err, token) => {
if (err) throw err;
res.status(201).json({ token });
});
} catch (err) {
console.error(err.message);
res.status(500).send('Server error');
}
};

exports.login = async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

const { email, password } = req.body;

try {
const user = await User.findOne({ email });
if (!user) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });

const payload = { user: { id: user.id } };

jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn }, (err, token) => {
if (err) throw err;
res.json({ token });
});
} catch (err) {
console.error(err.message);
res.status(500).send('Server error');
}
};

exports.getMe = async (req, res) => {
try {
const user = await User.findById(req.user.id).select('-password');
res.json(user);
} catch (err) {
console.error(err.message);
res.status(500).send('Server error');
}
};