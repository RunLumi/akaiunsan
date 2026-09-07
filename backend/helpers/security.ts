import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const saltRounds = 10;

const NODE_ENV = process.env.NODE_ENV || 'local';
const key = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '', 'config', `${NODE_ENV}.json`), 'utf8'));
import db from './../models/index.ts';
const { Customer, Admin } = db;

const securityModule = {
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

};

export default securityModule;
