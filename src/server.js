const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./user.js');

const STATUS_USER_ERROR = 422;
const BCRYPT_COST = 11;

const server = express();
server.use(bodyParser.json());
server.use(
  session({
    // ???
    name: 'auth',
    secret: 'e5SPiqsEtjexkTj3Xqovsjzq8ovjfgVDFMfUzSmJO21dtXs4re',
    resave: true,
    saveUninitialized: false,
    // ???
    cookie: { maxAge: 1 * 24 * 60 * 60 * 1000 },
    // ???
    secure: false
  })
);

// If there's any error, or if the credentials are invalid, respond with an appropriate status and error
// message using the `sendUserError()` helper function.
const sendUserError = (err, res) => {
  res.status(STATUS_USER_ERROR);
  if (err && err.message) {
    res.json({ message: err.message, stack: err.stack });
  } else {
    res.json({ error: err });
  }
};

// STRETCH: write a piece of **global** middleware that
// ensures a user is logged in when accessing _any_ route prefixed by
// `/restricted/`.
const restricted = (req, res, next) => {
  const path = req.path;
  if (/restricted/.test(path)) {
    if (!req.session.loggedIn) {
      sendUserError('You are not authorized to access this path', res);
      return;
    }
  }
  next();
};

server.use(restricted);

// Route Handlers:
// Play with this using Postman.  First post a valid user with a username, and password.
// Then [POST] login with that users same validation info.  Then you should be able to see your user's information with the hashed password
// at [GET] /me. Also you should be able to access [GET] /restricted

server.post('/users', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    sendUserError(
      'You must provide a valid username and password to sign up',
      res
    );
  }
  const passwordHash = password;
  const user = new User({ username, passwordHash });
  user
    .save()
    .then((newUser) => {
      res.status(200).json(newUser);
    })
    .catch((err) => {
      res
        .status(500)
        .json({ error: 'There was a server error while signing up', err });
    });
});

server.post('/login', (req, res) => {
  let { username } = req.body;
  const { password } = req.body;
  if (!username || !password) {
    sendUserError('You must provide a username and password to sign in', res);
    return;
  }
  username = username.toLowerCase();
  User.findOne({ username }).exec((err, found) => {
    if (err || found === null) {
      sendUserError('No user found for that ID', res);
      return;
    }
    bcrypt.compare(password, found.passwordHash, (error, verified) => {
      if (error) {
        res
          .status(500)
          .json({ error: 'There was in internal error while logging in' });
      } else if (verified) {
        req.session.loggedIn = found.id;
        res.status(200).json({ success: true });
      } else sendUserError('The password you entered is invalid', res);
    });
  });
});

server.get('/restricted', (req, res) => {
  res.status(200).json({ message: 'You have accessed the restricted content' });
});

const authenticate = (req, res, next) => {
  if (req.session.loggedIn) {
    User.findOne({ _id: req.session.loggedIn })
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((err) => {
        res
          .status(500)
          .json({ error: 'There was an internal error while processing' });
      });
  } else {
    sendUserError('You must be logged in to the system', res);
  }
};

server.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

module.exports = { server };
