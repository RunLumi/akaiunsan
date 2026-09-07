const { verifyToken } = require('./../helpers/security');
const { findAdminByUsername } = require('./../helpers/admin');
const { findCustomerByEmail } = require('./../helpers/customer');
const { ErrorLog } = require('../models');
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = require(`../config/${NODE_ENV}.json`);
let error_message = 'Unexpected error';

module.exports = {
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
    console.log(req.headers); // Log thông tin headers
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
}
