const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = mongoose.model(
  'User',
  mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: [true, 'Username already taken'],
    },
    log: [
      {
        description: {
          type: String,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  })
);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/users', async (req, res) => {
  const exist = await User.findOne({ username: req.body.username });
  if (exist) return res.send('Username already taken');

  try {
    const user = await User.create(req.body);
    const { username, _id } = user;
    res.json({ username, _id });
  } catch (error) {
    return res.send(error.errors[Object.keys(error.errors)[0]].message);
  }
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

app.post('/api/users/:id/exercises', async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return res.json('User not found');

  let { description, duration, date } = req.body;
  if (!date) date = new Date();
  user.log.push({ description, duration, date: new Date(date) });

  try {
    await user.save();
  } catch (error) {
    return res.send(error.errors[Object.keys(error.errors)[0]].message);
  }

  const { username, _id } = user;
  const data = {
    _id,
    username,
    date: new Date(date).toDateString(),
    duration: parseInt(duration),
    description,
  };
  res.json(data);
});

app.get('/api/users/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { from, to, limit } = req.query;

  const options = {};
  if (limit) options['log'] = { $slice: parseInt(limit) };

  const user = await User.findById(id, options);
  if (!user) return res.json('User not found');

  if (from)
    user.log = user.log.filter((x) => x.date.getTime() > new Date(from).getTime());
  if (to)
    user.log = user.log.filter(
      (x) => x.date.getTime() < new Date(req.query.to).getTime()
    );

  const { _id, username, log } = user;

  const data = { _id, username, count: log.length, log };
  res.json(data);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
