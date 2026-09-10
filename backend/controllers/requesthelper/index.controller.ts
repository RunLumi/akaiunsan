import { RequestHelper, RequestHelperStatus, RequestMaid, RequestDriver, ErrorLog, Customer } from '../../models/index.ts';
import * as requestHelper from '../../helpers/requestHelper.helper.ts';
import fs from 'fs';
import { sendMail } from '../../helpers/mail.ts';
import * as requestHelperStatus from './status.controller.ts';
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  try {
    let customer_id = null;
    if (req.customer)
      customer_id = req.customer.id;
    else throw { message: 'Customer not found. Unable to make a request.' }
    
    await requestHelper.create(customer_id, req.body);

    let email_lang, email_topic;
    if (req.headers['request-lang'] && req.headers['request-lang'] == 'vi') {
      email_lang = 'vi';
      email_topic = 'Cảm ơn bạn đã lựa chọn dịch vụ Akaiunsan';
    } else {
      email_lang = 'en';
      email_topic = 'Thank you for choosing Akaiunsan Service';
    }
    const customer = await Customer.findOne({ where: { id: customer_id }});
    const mail_template: any = await new Promise((resolve, reject) => {
      fs.readFile(`mail-template/${email_lang}/request-success.html`, 'utf8', function (err, data) {
        if (err) {
          reject(err)
        }
        resolve(data)
      });
    });
    let email_message = mail_template.replace('${firstname}', customer.firstname)
    email_message = email_message.replace('${lastname}', customer.lastname)

    await sendMail('Thank you for choosing Akaiunsan Service', email_message, customer.email);

    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  try {
    let { request_helper_id } = req.params;
    await requestHelper.update(request_helper_id, req.body);
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { request_helper_id } = req.params;
    const request_helper = await requestHelper.getDetail(request_helper_id);
    return res.status(200).json(request_helper);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getHistory (req, res) {
  try {
    let { page = 0 } = req.query;
    let customer_id = null;
    if (req.customer)
      customer_id = req.customer.id;
    else throw { message: 'Customer not found. Unable to get history.' }
    const request_helper_list = await requestHelper.getHistory(
      customer_id, page
    );
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getHistory', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getCountHistory (req, res) {
  try {
    let customer_id = null;
    if (req.customer)
      customer_id = req.customer.id;
    else throw { message: 'Customer not found. Unable to get history.' }
    const count = await requestHelper.getCountHistory(customer_id);
    return res.status(200).json(count);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getCountHistory', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter = null, keyword = null } = req.query;
    const request_helper_list = await requestHelper.getList(
      filter, keyword, page, limit, sortby, ordering
    );
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getCount (req, res) {
  try {
    let { filter = null, keyword = null } = req.query;
    const count = await requestHelper.count(filter, keyword);
    return res.status(200).json(count);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getCount', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getLastItem (req, res) {
  try {
    let customer_id = null;
    if (req.customer)
      customer_id = req.customer.id;
    let { request_type } = req.params;
    const request_helper_list = await requestHelper.getList(
      { request_type, customer_id }, null, 0, 1, 'id', 'DESC'
    );
    if (request_helper_list.length == 0) {
      return res.status(200).json(null);
    } else if (request_helper_list[0].request_type == 'driver') {
      let request_helper: any = {};
      for (let prop in request_helper_list[0].dataValues) {
        request_helper[prop] = request_helper_list[0][prop];
      }
      const request_driver = await RequestDriver.findOne({ where: { request_helper_id: request_helper_list[0].id }});
      for (let prop in request_driver.dataValues) {
        if ((prop as string) != 'id' || (prop as string) != 'createdAt' || (prop as string) != 'updatedAt') // pins current behavior: || tautology copies all columns
          request_helper[prop] = request_driver[prop];
      }
      return res.status(200).json(request_helper);
    } else {
      let request_helper: any = {};
      for (let prop in request_helper_list[0].dataValues) {
        request_helper[prop] = request_helper_list[0][prop];
      }
      const request_maid = await RequestMaid.findOne({ where: { request_helper_id: request_helper_list[0].id }});
      for (let prop in request_maid.dataValues) {
        if ((prop as string) != 'id' || (prop as string) != 'createdAt' || (prop as string) != 'updatedAt') // pins current behavior: || tautology copies all columns
          request_helper[prop] = request_maid[prop];
      }
      return res.status(200).json(request_helper);
    }
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    console.log(err)
    await ErrorLog.create({ location: 'requesthelper/index.controller.getLastItem', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  try {
    let { request_helper_id } = req.params;
    await requestHelper.remove(request_helper_id);
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function updateStatus (req, res) {
  try {
    let { request_helper_id, request_helper_status_id } = req.params;
    const request_helper_status = await RequestHelperStatus.findOne({ where: { id: request_helper_status_id }});
    if (!request_helper_status)
      throw { message: 'Status is missing.' }
    const result = await RequestHelper.update({
      status_id: request_helper_status_id,
      status_name: request_helper_status.status_name
    }, { where: { id: request_helper_id }});
    return res.status(200).json(result[0]);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.updateStatus', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestScheduleStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestScheduleStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestNationalStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestNationalStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDayStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDayStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestLanguageStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestLanguageStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverLanguageStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverLanguageStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverAgeStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverAgeStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverScheduleStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverScheduleStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverSalaryStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriveSalaryStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverHiringStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverHiringStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverInterviewStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverInterviewStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverReplacementGuranteeStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriveReplacementGuaranteeStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getRequestCookingStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestCookingStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequesKidStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequesKidStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequesPetStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequesPetStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequesCurrentHelperStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequesCurrentHelperStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverOwnCarStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverOwnCarStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverCurrentDriverStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverCurrentDriverStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
async function getRequestDriverIsOTStatistics (req, res) { 
  try {
   
    let {start_date = null, end_date = null} = req.query;
    const request_helper_list = await requestHelper.countRequestDriverIsOTStatistics(start_date, end_date);
    return res.status(200).json(request_helper_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/index.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}
export { create, update, getDetail, getList, getHistory, getCountHistory, getCount, remove, getLastItem, updateStatus, getRequestStatistics, getRequestScheduleStatistics, getRequestNationalStatistics, getRequestDayStatistics, getRequestLanguageStatistics, getRequestDriverLanguageStatistics, getRequestDriverAgeStatistics, getRequestDriverScheduleStatistics, getRequestDriverSalaryStatistics, getRequestDriverHiringStatistics, getRequestDriverInterviewStatistics, getRequestDriverReplacementGuranteeStatistics, getRequestCookingStatistics, getRequesKidStatistics, getRequesPetStatistics, getRequesCurrentHelperStatistics, getRequestDriverOwnCarStatistics, getRequestDriverCurrentDriverStatistics, getRequestDriverIsOTStatistics, requestHelperStatus as status };
const defaultExport = { create, update, getDetail, getList, getHistory, getCountHistory, getCount, remove, getLastItem, updateStatus, getRequestStatistics, getRequestScheduleStatistics, getRequestNationalStatistics, getRequestDayStatistics, getRequestLanguageStatistics, getRequestDriverLanguageStatistics, getRequestDriverAgeStatistics, getRequestDriverScheduleStatistics, getRequestDriverSalaryStatistics, getRequestDriverHiringStatistics, getRequestDriverInterviewStatistics, getRequestDriverReplacementGuranteeStatistics, getRequestCookingStatistics, getRequesKidStatistics, getRequesPetStatistics, getRequesCurrentHelperStatistics, getRequestDriverOwnCarStatistics, getRequestDriverCurrentDriverStatistics, getRequestDriverIsOTStatistics, requestHelperStatus };
export default defaultExport;