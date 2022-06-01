const User = require("./User.Schema");

class UserService {
  async getAllUsers() {
    return await User.find({});
  }
  async getUser({ username, password }) {
    return await User.findOne({ username, password });
  }
  async getByUsername(username) {
    return await User.findOne({ username });
  }
  async insertUser({ username, password }) {
    const user1 = await this.getByUsername(username);
    if (user1) {
      return null;
    }
    const user = await new User({ username, password }).save();
    return user;
  }
}

module.exports = new UserService();
