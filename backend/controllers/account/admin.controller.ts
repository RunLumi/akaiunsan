import fs from 'fs';
import { Admin, Role, ErrorLog } from '../../models/index.ts';
import { genTxt, getAdminData } from '../../helpers/util.ts';
import { encryptPassword, comparePassword, generateToken, requestForgetPasswordToken, verifyToken } from '../../helpers/security.ts';
import __interop_model from '../../models/index.ts';
import nodemailer from 'nodemailer';
import { loadConfig } from '../../helpers/config.ts';
const model = (__interop_model as any).sequelize;
let error_status = 500;
let error_message = 'Unexpected error';
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = loadConfig(NODE_ENV);

async function signin (req, res) {
  try {
    let { username, password } = req.body;
    const admin = await Admin.findOne({ where: { username, active: true }, include: [{ model: Role }]});
    if (!admin)
      throw { message: 'User not found.' };
    const compare_result = await comparePassword(password, admin.password);
    if (!compare_result)
      throw { status: 400, message: 'Username/Password is incorrect.' };
    const token = await generateToken(username, req.hostname);
    return res.status(200).json({
      id: admin.id,
      firstname: admin.firstname,
      lastname: admin.lastname,
      username: admin.username,
      email: admin.email,
      phone_number: admin.phone_number,
      role: admin.role,
      line_id: admin.line_id,
      profile_image_url: admin.profile_image_url,
      permission: admin.Role.permission.split(','),
      _token: token
    });
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.signin', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function register (req, res) {
  const t = await model.transaction();
  try {
    let data = req.body;
    const count = await Admin.count();
    if (count)
      throw { message: 'Please login to create new account.' };
    let { admin } = await getAdminData(data);
    admin.password = data.password;
    admin.password = await encryptPassword(admin.password);
    admin.role = 'admin';
    const result = await Admin.create(admin, { transaction: t });
    const token = await generateToken(data.username, req.hostname);
    await t.commit();
    return res.status(200).json({
      id: result.id,
      username: result.username,
      _token: token
    });
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.register', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  const t = await model.transaction();
  try {
    let admin_info = req.admin;
    let data = req.body;
    const exist_admin = await Admin.findOne({ where: { username: data.username }});
    if (exist_admin && admin_info.id != exist_admin.id)
      throw { message: 'This username is already in used.' };
    await Admin.update(data, { where: { id: admin_info.id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    console.log(err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updatePassword (req, res) {
  const t = await model.transaction();
  try {
    let admin_info = req.admin;
    let { password, new_password, confirm_password } = req.body;
    const admin = await Admin.findOne({ where: { username: admin_info.username }});
    const compare_result = await comparePassword(password, admin.password);
    if (!compare_result)
      throw { status: 500, message: 'Current password is incorrect.' };
    if (new_password.length < 8)
      throw { message: 'Password must be at least 8 characters.' };
    if (new_password != confirm_password)
      throw { message: 'New passsword and confirm password are not matched.' };
    const hashed_password = await encryptPassword(new_password);
    await Admin.update({ password: hashed_password }, { where: { id: admin_info.id }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.updatePassword', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getAdminFromToken (req, res) {
  try {
    return res.status(200).json({ user: req.admin });
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'customer.controller.getCustomerFromToken', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function uploadProfile (req, res) {
  try {
    if (req.file) {
      return res.status(200).json(`/uploads/admins/${req.file.filename}`);
    } else
      throw { message: 'No file uploaded' }
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.uploadProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function removeProfile (req, res) {
  try {
    let { profile_image } = req.params;
    fs.unlinkSync(`uploads/admins/${profile_image}`);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.removeProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function requestForgetPassword (req, res) {
  try {
    let { username } = req.body;
    const admin = await Admin.findOne({ where: { username }});
    if (!admin)
      throw { message: 'This email is not registered.' };
    if (!admin.email)
      throw { message: 'Unable to reset password.' };
    const token = await requestForgetPasswordToken(admin, req.hostname);
    var transporter = nodemailer.createTransport({
      host: key['mail-config'].host,
      port: key['mail-config'].port,
      // ignoreTLS: false,
      secure: key['mail-config'].secure,
      auth: {
        user: key['mail-config'].user,
        pass: key['mail-config'].password,
      }
    });

    var mailOptions = {
      from: 'Ayasan Service IT <sale@ayasan.vn>',
      to: `${admin.firstname} ${admin.lastname} <${admin.email}>`,
      subject: 'Ayasan Service Backoffice - Forget password',
      html: `<p>Forget token</p>
      <p>${token}</p>`
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
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
    const admin = await Admin.findOne({ where: { username: decoded._user.username }})
    if (!admin)
      throw { message: 'This account doesn\'t exist.' };
    if (new_password != confirm_password)
      throw { message: 'New password and confirm password are not matched.' };
    let encrypted_password = await encryptPassword(new_password);
    await Admin.update({ password: encrypted_password }, { where: { username: decoded._user.username }, transaction: t });
    await t.commit();
    return res.status(200).json(true);
  } catch (err) {
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.controller.resetPassword', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

const adminModule = { update, uploadProfile, removeProfile, signin, updatePassword, resetPassword, register, requestForgetPassword, getAdminFromToken };
export default adminModule;