// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
const cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// your first API endpoint...
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api', (req, res) => {
  const date = new Date();

  const utc = date.toUTCString();
  const unix = date.getTime();

  res.json({ unix, utc });
});

app.get('/api/:timestamp', (req, res) => {
  const { timestamp } = req.params;

  if (typeof timestamp != 'string') res.json({ error: 'Invalid Date' });

  let date = new Date(timestamp);

  if (!isNaN(timestamp) && !isNaN(parseFloat(timestamp)))
    date = new Date(parseInt(timestamp, 10));

  const utc = date.toUTCString();
  const unix = date.getTime();

  if (utc === 'Invalid Date' || unix === 'Invalid Date') {
    res.json({ error: 'Invalid Date' });
  }

  res.json({ unix, utc });
});

// listen for requests :)
const port = process.env.PORT || 5000;
const listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
