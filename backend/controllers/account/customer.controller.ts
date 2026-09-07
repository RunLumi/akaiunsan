const { Customer, ErrorLog } = require('../../models/index.ts');
const { genTxt, getCustomerData } = require('../../helpers/util.ts');
const { encryptPassword, comparePassword, generateToken,
  requestForgetPasswordToken, verifyToken } = require('../../helpers/security.ts');
const model = require('../../models/index.ts').sequelize;
let error_status = 500;
let error_message = 'Unexpected error';
const nodemailer = require('nodemailer');
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = require(`../../config/${NODE_ENV}.json`);
const fs = require('fs');
const { sendMail } = require('../../helpers/mail.ts');

async function signup (req, res) {
  const t = await model.transaction();
  try {
    let data = req.body;
    let { customer } = await getCustomerData(data);
    const exist_customer = await Customer.findOne({ where: { email: customer.email }});
    if (exist_customer)
      throw { message: 'This email is already registered.' }
    let { password } = req.body;
    if (password.length < 8)
      throw { message: 'Password must be at least 8 characters.' };
    customer.password = await encryptPassword(password);
    customer.active = true;
    const new_customer = await Customer.create(customer, { transaction: t });
    const token = await generateToken(customer.email, req.hostname);

    // let email_lang, email_topic;

    // if (req.headers['request-lang'] && req.headers['request-lang'] == 'th') {
    //   email_lang = 'th';
    //   email_topic = 'อะยะซันเซอร์วิสยินดีต้อนรับ';
    // } else {
      // }
      
    let email_lang = 'en';
    let email_topic = 'Welcome to Ayasan Service';
    const mail_template = await new Promise((resolve, reject) => {
      fs.readFile(`${__dirname}/../../mail-template/${email_lang}/account.html`, 'utf8', function (err, data) {
        if (err) {
          reject(err)
        }
        resolve(data)
      });
    });

    let email_message = mail_template.replace('${firstname}', customer.firstname)
    email_message = email_message.replace('${lastname}', customer.lastname)
    const isBcc = true;
    await sendMail(email_topic, email_message, customer.email, isBcc);

    await t.commit();
    return res.status(200).json({
      user: {
        id: new_customer.id,
        firstname: new_customer.firstname,
        lastname: new_customer.lastname,
        email: new_customer.email,
      },
      _token: token
    });
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.signup', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function signin (req, res) {
  try {
    let { email, password } = req.body;
    const customer = await Customer.findOne({ where: { email, active: true }});
    if (!customer)
      throw { message: 'Email/password is incorrect.' };
    let compare_result = await comparePassword(password, customer.password);
    if (!compare_result)
      throw { message: 'Email/password is incorrect.' };
    const token = await generateToken(email, req.hostname);
    return res.status(200).json({
      user: {
        id: customer.id,
        firstname: customer.firstname,
        lastname: customer.lastname,
        email: customer.email
      },
      _token: token
    });
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.signin', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let customer_info = req.customer;
    let data = req.body;
    let { customer } = await getCustomerData(data);
    await Customer.update(customer, { where: { id: customer_info.id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updatePassword (req, res) {
  const t = await model.transaction();
  try {
    let customer_info = req.customer;
    let { current_password, new_password, confirm_password } = req.body;
    const customer = await Customer.findOne({ where: { email: customer_info.email }});
    const compare_result = await comparePassword(current_password, customer.password);
    if (!compare_result)
      throw { status: 500, message: 'Current password is incorrect.' };
    if (new_password.length < 8)
      throw { message: 'Password must be at least 8 characters.' };
    if (new_password != confirm_password)
      throw { message: 'New passsword and confirm password are not matched.' };
    const hashed_password = await encryptPassword(new_password);
    await Customer.update({ password: hashed_password }, { where: { id: customer_info.id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function uploadProfile (req, res) {
  try {
    if (req.file) {
      return res.status(200).json(`/uploads/customers/${req.file.filename}`);
    } else
      throw { message: 'No file uploaded' }
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.uploadProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function removeProfile (req, res) {
  try {
    let { profile_image } = req.params;
    fs.unlinkSync(`${__dirname}/../uploads/customers/${profile_image}`);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.removeProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getCustomerFromToken (req, res) {
  try {
    return res.status(200).json({ user: req.customer });
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.getCustomerFromToken', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function requestForgetPassword (req, res) {
  try {
    let { email } = req.body;
    const customer = await Customer.findOne({ where: { email }});
    if (!customer)
      throw { message: 'This email is not registered.' };

    const token = await requestForgetPasswordToken(email, req.hostname);
    
    let email_lang, email_topic;
    if (req.headers['request-lang'] && req.headers['request-lang'] == 'th') {
      email_lang = 'th';
      email_topic = 'กำหนดรหัสผ่านใหม่';
    } else {
      email_lang = 'en';
      email_topic = 'Reset Password';
    }
    const mail_template = await new Promise((resolve, reject) => {
      fs.readFile(`${__dirname}/../../mail-template/${email_lang}/forget-password.html`, 'utf8', function (err, data) {
        if (err) {
          reject(err)
        }
        resolve(data)
      });
    });

    let email_message = mail_template.replace('${firstname}', customer.firstname)
    email_message = email_message.replace('${lastname}', customer.lastname)
    email_message = email_message.replace('${token}', token)
    email_message = email_message.replace('${token}', token)

    await sendMail(email_topic, email_message, customer.email);

    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.requestForgetPassword', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function resetPassword (req, res) {
  const t = await model.transaction();
  try {
    let { _forget_token, new_password, confirm_password } = req.body;
    const decoded = await verifyToken(_forget_token);
    const customer = await Customer.findOne({ where: { email: decoded._user.username }})
    if (!customer)
      throw { message: 'This account doesn\'t exist.' };
    if (new_password != confirm_password)
      throw { message: 'New password and confirm password are not matched.' };
    let encrypted_password = await encryptPassword(new_password);
    await Customer.update({ password: encrypted_password }, { where: { email: decoded._user.username }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.resetPassword', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

module.exports = {
  update: update,
  updatePassword,
  uploadProfile: uploadProfile,
  removeProfile: removeProfile,
  signup: signup,
  signin: signin,
  getCustomerFromToken,
  requestForgetPassword,
  resetPassword
}