const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");

const User = require("./auth/UserModel");

mongoose
  .connect("mongodb://localhost/authdb")
  .then(() => {
    console.log("\n=== connected to MongoDB ===\n");
  })
  .catch(err => console.log("database connection failed", err));

const server = express();

// Custum Middleware
const authenticate = function(name) {
  return function(req, res, next) {
    req.hello = `hello ${name}!`;
    next();
  };
};

server.use(express.json());

// By default this is going to place something called session inside my requests
server.use(
  session({
    secret: "you shall not pass!!",
    cookie: { maxAge: 1 * 24 * 60 * 60 * 1000 },
    secure: false,
    name: 'auth'
  })
);

server.post("/login", (req, res) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then(user => {
      if (user) {
        user.isPasswordValid(password, cb); // maybe a promise
      }
    })
    .catch(err => res.status(500).json(err));
});

server.get("/", (req, res) => {
  req.session.name = 'Carlos';
  res.send('have a cookie');
  User.find().then(users => res.json(users))
});

server.get("/greet", (req, res) => {
  const { name } = req.session;
  res.send(`hello ${name}`); 
});

// The idea here is when you have your login system, and you want to create
// a new user, how do you achieve that? With this code here:
// Remember that 'User' here is NOT the schema!  It is the model
server.post("/register", (req, res) => {
  const user = new User(req.body);

  // this is a mongoose document that is mapped to a db document
  user
    // another pre-packaged method???
    .save()
    .then(savedUser => res.status(200).json(savedUser))
    .catch(err => res.status(500).json(err));
});

server.listen(5000, () => console.log("\n=== api on port 5000 ===\n"));

// Schema - compiles -> model - new/instantiate -> mongoose document ->
