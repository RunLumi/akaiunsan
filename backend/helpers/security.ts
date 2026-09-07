const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = require(`../config/${NODE_ENV}.json`);
const { Customer, Admin } = require('./../models/index.ts');

module.exports = {
  encryptPassword: async (_password) => {
    const salt = await bcrypt.genSaltSync(saltRounds);
    return await bcrypt.hashSync(_password, salt);
  },
  comparePassword: async (_password, hash) => {
    return await bcrypt.compare(_password, hash);
  },
  generateToken: async (username, host_name = '') => {
    let createdDate = new Date();
    return await jwt.sign({
      _user: { username, createdDate },
      host_name
    }, key["jwt-secret"], {
      expiresIn: '30d',
      algorithm: 'HS256'
    });
  },
  verifyToken: async (token) => {
    return await jwt.verify(token, key['jwt-secret'], { algorithms: ['HS256'] });
  },
  findUser: async (username) => {
    const found = await Customer.findOne({ where: { email: username } });
    if (found)
      return found;
    const found_admin = await Admin.findOne({ where: { username }});
    if (found_admin)
      return found_admin;
    else
      throw Error(`User does not found.`);
  },
  requestForgetPasswordToken: async (username, host_name = '') => {
    let createdDate = new Date();
    return await jwt.sign({
      _user: { username, createdDate },
      host_name
    }, key["jwt-secret"], {
      expiresIn: 60*30,
      algorithm: 'HS256'
    });
  }
}