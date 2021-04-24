require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const shortid = require('shortid');
const dns = require('dns');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true,
  },
});

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  if (!url || !/^((http|https):\/\/)/.test(url))
    return res.json({ error: 'invalid url' });

  const original_url = url;
  const { hostname } = new URL(url);

  dns.lookup(hostname, async (err) => {
    console.log(err);
    if (err) return res.json({ error: 'invalid url' });

    let short_url = shortid.generate();
    while ((await Url.findOne({ shortUrl: short_url })) !== null) {
      short_url = shortid.generate();
    }

    const newUrl = new Url({
      originalUrl: original_url,
      shortUrl: short_url,
    });
    await newUrl.save();

    res.json({ original_url, short_url });
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;

  const url = await Url.findOne({ shortUrl: short_url });
  if (!url) return res.json({ error: 'No short URL found for the given input' });

  let redirect_url = url.originalUrl;
  if (!/^((http|https):\/\/)/.test(redirect_url))
    redirect_url = `http://${url.originalUrl}`;

  res.redirect(redirect_url);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
