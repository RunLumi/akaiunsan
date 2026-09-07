import fs from 'fs';
import nodemailer from 'nodemailer';
import { loadConfig } from '../helpers/config.ts';
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = loadConfig(NODE_ENV);

async function sendMail (topic, body, receiver = 'sale@akaiunsan.vn', isBcc = false) {
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
      from: 'Akaiunsan Service <sale@akaiunsan.vn>',
      to: receiver,
      bcc: 'sale@akaiunsan.vn',
      subject: `${topic}`,
      html: body,
    };
  } else {
    var mailOptions = {
      from: 'Akaiunsan Service <sale@akaiunsan.vn>',
      to: receiver,
      subject: `${topic}`,
      html: body,
    };
  }

  
  return await transporter.sendMail(mailOptions);
  // return true;
}

export { sendMail };