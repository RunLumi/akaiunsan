import fs from 'fs';
import nodemailer from 'nodemailer';
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = JSON.parse(fs.readFileSync(`config/${NODE_ENV}.json`, 'utf8'));

async function sendMail (topic, body, receiver = 'sale@ayasan.vn', isBcc = false) {
  var transporter = await nodemailer.createTransport({
    host: key['mail-config'].host,
    port: key['mail-config'].port,
    secure: key['mail-config'].secure,
    auth: {
      user: key['mail-config'].user,
      pass: key['mail-config'].password
    }
  });

  if(isBcc) {
    var mailOptions = {
      from: 'Ayasan Service <sale@ayasan.vn>',
      to: receiver,
      bcc: 'sale@ayasan.vn',
      subject: `${topic}`,
      html: body,
    };
  } else {
    var mailOptions = {
      from: 'Ayasan Service <sale@ayasan.vn>',
      to: receiver,
      subject: `${topic}`,
      html: body,
    };
  }

  
  return await transporter.sendMail(mailOptions);
  // return true;
}

export { sendMail };