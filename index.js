const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser")
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI);

app.use(bodyParser.urlencoded({extended: false}));

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const user = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  count: {
    type: Number
  },
  log: [
    {
      description: {
        type: String
      },
      duration: {
        type: Number
      },
      date: {
        type: Date
      }
    }
  ]
});

let User = mongoose.model('User', user);

app.post('/api/users', async (req, res) => {
  let user = new User({ username: req.body.username });
  await user.save();
  res.json(user);
});

app.get('/api/users', async (req, res) => {
  res.json(await User.find());
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  let date = req.body.date ? new Date(req.body.date) : new Date();
  await User.updateOne({_id: req.params._id}, {
    $push: {
      log: {
        description: req.body.description,
        duration: req.body.duration,
        date: date,
      }
    },
    $inc: { count: 1 }
  }).exec();
  let user = await User.findById(req.params._id);
  res.json({
    _id: user._id,
    username: user.username,
    date: date.toDateString(),
    description: req.body.description,
    duration: Number.parseInt(req.body.duration)
  });
});

app.get('/api/users/:_id/logs', async (req, res) => {
  let user = (await User.findById(req.params._id)).toObject();
  let log = user.log/* .filter(log => {
    let flag = true;
    if (req.query.from) {
      flag = new Date(req.query.from).getTime() <= log.date.getTime();
    }
    if (req.query.to) {
      flag = new Date(req.query.from).getTime() >= log.date.getTime();
    }
    return flag;
  }) */
  .slice(0, req.query.limit || user.log.length)
  .map(log => {
    return {
      date: log.date.toDateString(),
      description: log.description,
      duration: log.duration
    }
  });
  user.log = log;
  res.json(user);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
