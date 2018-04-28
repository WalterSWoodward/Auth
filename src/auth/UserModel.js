const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    index: true,
    lowercase: true, // Luis => luis -- stored like this
  },
  password: {
    type: String,
    required: true,
  },
});

// pre -- before someone saves this user do this -->
// remember this is STILL middleware (noticed "next")
// This HAS to be a regular function, not arrow, b/c
// we need to use 'this'
UserSchema.pre('save', function(next) {
  console.log('pre save hook');
  // 'this' refers to the instance of the schema with a password
  // in it.  16.5 rounds.
  // this.password never gets saved to the database.  It is
  // hi-jacked here and hashed by bcrypt
  console.log('this.password:', this.password)
  bcrypt.hash(this.password, 16.5, (err, hash) => {
    // 2 ^ 16.5 ~ 92.k rounds of hashing
    if (err) {
      return next(err);
    }
    // if there is no error, then the original password is 
    // replaced with the hash of the password
    this.password = hash;

    return next();
  });
});

// are executed on a mongoose document = instance of a model
UserSchema.methods.isPasswordValid = function(passwordGuess) {
  return bcrypt.compare(passwordGuess, this.password);
};

module.exports = mongoose.model('User', UserSchema);
