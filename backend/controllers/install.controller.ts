const { Admin, Role, ErrorLog } = require('../models/index.ts');
const model = require('../models/index.ts').sequelize;
const { genTxt } = require('../helpers/util.ts');
const { encryptPassword } = require('../helpers/security.ts');
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = require(`../config/${NODE_ENV}.json`);
let error_message = 'Unexpected error';
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  const t = await model.transaction();
  try {
    const count = await Admin.count();
    if (!count) {
      let temp_pwd = genTxt(12);
      const hashed_pwd = await encryptPassword(temp_pwd);
      await Role.create({
        role_name: 'Super Admin'
      });
      await Admin.create({
        email: 'sale@ayasan.vn',
        firstname: 'Ayasan',
        lastname: 'IT',
        role: 'Super admin',
        username: 'sale@ayasan.vn',
        password: hashed_pwd
      }, { transaction: t })
      await t.commit();
      
      // test mail
      var transporter = nodemailer.createTransport({
        host: key['mail-config'].host,
        port: key['mail-config'].port,
        secure: key['mail-config'].secure,
        auth: {
          user: key['mail-config'].user,
          pass: key['mail-config'].password
        }
      });

      var mailOptions = {
        from: 'sale@ayasan.vn',
        to: 'sale@ayasan.vn',
        subject: 'Ayasan Service - Backoffice first install',
        html: `<p>Recommend to update your information asap.</p>
        <p>${temp_pwd}</p>`
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      // end test mail
      return res.status(200).json({ message: 'Done installation admin' });
    } else {
      return res.status(200).json({ message: 'Done nothing' });
    }
  } catch (err) {
    console.log('error:', err)
    if (t.finished != 'commit')
      await t.rollback();
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    ErrorLog.create({ location: 'app.listen', message: error_message });
    return res.status(500).json({ message: error_message });
  }
}