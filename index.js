const express = require('express');
const shortUrl = require('node-url-shortener');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/test');

const Urls = mongoose.model('Urls', {
  urlName: String,
  count: Number,
  title: String,
});

const app = express();

app.use(express.json());
const port = 3000;

const insertUrl = async (url) => {
  const dbUrl = await Urls.find({ urlName: url });
  console.log(dbUrl);
  if (dbUrl.length > 0) {
    const updated = await Urls.updateOne(
      { urlName: url },
      { $inc: { count: 1 } }
    );
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
  const data = await Urls.find().sort({ count: -1 }).limit(100);

  return res.send(data);
});

const parseTitle = (body) => {
  let match = body.match(/<title>([^<]*)<\/title>/); // regular expression to parse contents of the <title> tag
  if (!match || typeof match[1] !== 'string')
    throw new Error('Unable to parse the title tag');
  return match[1];
};

app.get('/title', async (req, res) => {
  // if (!url) return res.status(400).end('Missing url query parameter');

  const url = 'https://cdpt.in/MzM4OTEyMg==';
  const dbUrl = await Urls.findOne({ urlName: url });
  const urlText = await fetch(url)
    .then((res) => res.text()) // parse response's body as text
    .then((body) => parseTitle(body)) // extract <title> from body
    .catch((e) => res.status(500).end(e)); // catch possible errors
  console.log(urlText);

  const updated = await Urls.updateOne({ urlName: url }, { title: urlText });

  console.log({ updated });
  const data = await Urls.findOne({ urlName: url });

  return res.send({ data });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
