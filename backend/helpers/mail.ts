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
  } as any);

  var mailOptions: any = {
    from: 'Akaiunsan Service <sale@akaiunsan.vn>',
    to: receiver,
    subject: `${topic}`,
    html: body,
  };
  if (isBcc) {
    mailOptions.bcc = 'sale@akaiunsan.vn';
  }

  
  return await transporter.sendMail(mailOptions);
  // return true;
}

export { sendMail };