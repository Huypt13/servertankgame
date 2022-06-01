const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  id: { type: String, require: true },
  username: { type: String, require: true },
  password: { type: String, require: true },
});

module.exports = mongoose.model("User", UserSchema);
