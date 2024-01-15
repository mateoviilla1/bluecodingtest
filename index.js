const express = require('express');
const shortUrl = require('node-url-shortener');
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/test');

const Urls = mongoose.model('Urls', { urlName: String, count: Number });

const app = express();

app.use(express.json());
const port = 3000;

const insertUrl = async (url) => {
  const dbUrl = await Urls.find({ urlName: url });
  if (dbUrl) {
    const updated = await Urls.updateOne(
      { urlName: url },
      { $inc: { count: 1 } }
    );
    console.log(updated);
  } else {
    const newInsert = new Urls({ urlName: url });
    await newInsert.save();
  }
};

app.post('/short', async (req, res) => {
  const { urlBody } = req.body;

  shortUrl.short(urlBody, async (err, url) => {
    if (err) {
      return res.status(500);
    }

    await insertUrl(url);
    return res.status(200).send({ url });
  });
});

app.get('/mostUsed', async (req, res) => {
  // const urlTable = new Urls();

  const data = await Urls.find().sort({ count: -1 }).limit(2);

  return res.send(data);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
