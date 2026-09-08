import { ErrorLog } from '../models/index.ts';
import { sendMail } from '../helpers/mail.ts';
let error_status = 500;
let error_message = 'Unexpected error';

async function contactUs (req, res) {
  try {
    let { name, email, phone_number, message } = req.body;
    if (!name || !email || !phone_number)
      throw { status: 400, message: 'Please fill in contact information.' }
    let body_message = `
    <h3>There's a new message from contact us form</h3>
    <table>
    <tbody>
    <tr>
    <td><b>Sender:</b></td><td>${name}</td>
    </tr>
    <tr>
    <td><b>Email:</b></td><td>${email}</td>
    </tr>
    <tr>
    <td><b>Phone number:</b></td><td>${phone_number}</td>
    </tr>
    <tr>
    <td><b>Message</b></td><td>${message}</td>
    </tr>
    </tbody>
    </table>
    `;
    await sendMail('Contact Us message', body_message, 'sale@akaiunsan.vn');
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    const respond_status = (err && typeof err == 'object' && typeof err.status == 'number') ? err.status : error_status;
    ErrorLog.create({ location: 'mail.controller.contactUs', message: error_message });
    return res.status(respond_status).json({ message: error_message });
  }
}

async function contactBiz (req, res) {
  try {
    let { name, package: pkg_name = '-', email, phone_number, company_name, location, message } = req.body;
    if (!name || !email || !phone_number || !company_name || !location)
      throw { status: 400, message: 'Please fill in contact information.' }
    let body_message = `
    <h3>There's a new request for quotation.</h3>
    <table>
    <tbody>
    <tr>
    <td><b>Contact:</b></td><td>${name}</td>
    </tr>
    <tr>
    <td><b>Package:</b></td><td>${pkg_name}</td>
    </tr>
    <tr>
    <td><b>Email:</b></td><td>${email}</td>
    </tr>
    <tr>
    <td><b>Phone number:</b></td><td>${phone_number}</td>
    </tr>
    <tr>
    <td><b>Company:</b></td><td>${company_name}</td>
    </tr>
    <tr>
    <td><b>Location:</b></td><td>${location}</td>
    </tr>
    <tr>
    <td><b>Message</b></td><td>${message}</td>
    </tr>
    </tbody>
    </table>
    `;
    await sendMail('Request for business quotation', body_message, 'sale@akaiunsan.vn');
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    const respond_status = (err && typeof err == 'object' && typeof err.status == 'number') ? err.status : error_status;
    ErrorLog.create({ location: 'mail.controller.contactBiz', message: error_message });
    return res.status(respond_status).json({ message: error_message });
  }
}

async function employment (req, res) {
  try {
    let { name, email, phone_number, message } = req.body;
    if (!name || !email || !phone_number)
      throw { status: 400, message: 'Please fill in contact information.' }
    let body_message = `
    <h3>There's a new message from employment form</h3>
    <table>
    <tbody>
    <tr>
    <td><b>Sender:</b></td><td>${name}</td>
    </tr>
    <tr>
    <td><b>Email:</b></td><td>${email}</td>
    </tr>
    <tr>
    <td><b>Phone number:</b></td><td>${phone_number}</td>
    </tr>
    <tr>
    <td><b>Message</b></td><td>${message}</td>
    </tr>
    </tbody>
    </table>
    `;
    await sendMail('Employment Request Message', body_message, 'sale@akaiunsan.vn');
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    const respond_status = (err && typeof err == 'object' && typeof err.status == 'number') ? err.status : error_status;
    ErrorLog.create({ location: 'mail.controller.employment', message: error_message });
    return res.status(respond_status).json({ message: error_message });
  }
}

export { contactUs, contactBiz, employment };
const defaultExport = { contactUs, contactBiz, employment };
export default defaultExport;