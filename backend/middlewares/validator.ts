import fs from 'fs';
import { verifyToken } from './../helpers/security.ts';
import { findAdminByUsername } from './../helpers/admin.ts';
import { findCustomerByEmail } from './../helpers/customer.ts';
import { ErrorLog } from '../models/index.ts';
import { loadConfig } from '../helpers/config.ts';
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = loadConfig(NODE_ENV);
let error_message = 'Unexpected error';

const validators = {
  clientValidator: async (req, res, next) => {
    let { authorization } = req.headers;

    if (!authorization) 
      return res.status(401).send({ message: 'Authorization is required.' })
    if (authorization.split(' ')[0] !== 'Bearer')
      return res.status(401).send({ message: 'Header Bearer token type is required. Bearer: [token]' })

    const token = authorization.split(' ')[1]
    if (!token)
      return res.status(401).send({ message: 'Provided token is invalid formatted.' })

    try {
      const decoded = await verifyToken(token)
      const userInstance = await findCustomerByEmail(decoded._user.username)
      const userDetail = userInstance.dataValues
      // remove password from user data.
      delete userDetail.password
      // expose user in request object.
      req.customer = userDetail
      // console.log(req.customer)
      next()
    } catch (err) {
      err.message ? error_message = err.message : error_message;
      // console.error(error_message)
      typeof err == 'string' ? error_message = err : error_message;
      await ErrorLog.create({ location: 'client.verify', message: error_message });
      return res.status(401).send({ message: error_message })
    }
  },
  backofficeValidator: async (req, res, next) => {
    let { authorization } = req.headers;

    if (!authorization) 
      return res.status(401).send({ message: 'Authorization is required.' })
    if (authorization.split(' ')[0] !== 'Bearer')
      return res.status(401).send({ message: 'Header Bearer token type is required. Bearer: [token]' })

    const token = authorization.split(' ')[1]
    if (!token)
      return res.status(401).send({ message: 'Provided token is invalid formatted.' })

    try {
      const decoded = await verifyToken(token)
      const userInstance = await findAdminByUsername(decoded._user.username)
      const userDetail = userInstance.dataValues
      // remove password from user data.
      delete userDetail.password
      // expose user in request object.
      req.admin = userDetail
      next()
    } catch (err) {
      err.message ? error_message = err.message : error_message;
      typeof err == 'string' ? error_message = err : error_message;
      await ErrorLog.create({ location: 'backoffice.verify', message: error_message });
      return res.status(401).send({ message: error_message })
    }
  },
  headerValidator: (req, res, next) => {
    let { app_key } = req.headers;
    if (app_key == key.app_key)
      next();
    else {
      ErrorLog.create({ location: 'app use', message: `Unauthorized due to app key (${app_key})` })
     .then(() => {
        let message = "frontend: " + app_key + " -- api: " + key.app_key;
        return res.status(401).send({ message: message });
      });
    }
  },

};

export default validators;
