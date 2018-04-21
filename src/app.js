const express = require('express');
const mongoose = require('mongoose');

mongoose
  .connect('mongodb://localhost/authdb')
  .then(() => {
    console.log('\n=== connected to MongoDB ===\n');
  })
  .catch(err => console.log('database connection failed', err));

const server = express();

// Custum Middleware
const greeter = function(req, res, next) {
  req.hello = `Hello Jeremy`;
  next();
}

server.use(express.json());
server.use(greeter)

server.get('/', (req, res) => {
  res.status(200).json({ api: 'running!', greeting: req.hello });
});

server.listen(5000, () => console.log('\n=== api on port 5000 ===\n'));