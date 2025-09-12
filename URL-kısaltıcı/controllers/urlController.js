const validUrl = require('valid-url');

exports.createShortUrl = async (req, res) => {
  try {
	const { longUrl, alias } = req.body;
	const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

	if (!validUrl.isUri(longUrl)) {
	  return res.status(400).json({ msg: 'Geçersiz URL.' });
	}

	if (alias) {
	  const existingAlias = await Url.findOne({ alias });
	  if (existingAlias) return res.status(400).json({ msg: 'Alias zaten kullanılıyor.' });

	  const shortId = alias;
	  const shortUrl = `${baseUrl}/${shortId}`;

	  const url = new Url({ shortId, longUrl, alias });
	  await url.save();

	  return res.status(201).json({ shortUrl, shortId, longUrl });
	}

	// Check if longUrl already shortened
	let url = await Url.findOne({ longUrl });
	if (url) {
	  return res.json({ shortUrl: `${baseUrl}/${url.shortId}`, shortId: url.shortId, longUrl: url.longUrl });
	}

	// generate unique shortId
	let shortId;
	let exists = true;
	let attempts = 0;
	while (exists && attempts < 5) {
	  shortId = generateShortId();
	  exists = await Url.findOne({ shortId });
	  attempts++;
	}
	if (exists) return res.status(500).json({ msg: 'Kısa id oluşturulamadı, tekrar deneyin.' });

	const shortUrl = `${baseUrl}/${shortId}`;

	url = new Url({ shortId, longUrl });
	await url.save();

	return res.status(201).json({ shortUrl, shortId, longUrl });
  } catch (err) {
	console.error(err.message);
	res.status(500).send('Server error');
  }
};

exports.redirect = async (req, res) => {
const { shortId } = req.params;
try {
const url = await Url.findOne({ $or: [{ shortId }, { alias: shortId }] });
if (!url) return res.status(404).send('URL bulunamadı');

url.clicks += 1;
await url.save();

return res.redirect(302, url.longUrl);
} catch (err) {
console.error(err.message);
res.status(500).send('Server error');
}
};

exports.getUrlInfo = async (req, res) => {
const { shortId } = req.params;
try {
const url = await Url.findOne({ $or: [{ shortId }, { alias: shortId }] }).select('-_id shortId alias longUrl clicks createdAt');
if (!url) return res.status(404).json({ msg: 'URL bulunamadı' });

return res.json(url);
} catch (err) {
console.error(err.message);
res.status(500).send('Server error');
}
};