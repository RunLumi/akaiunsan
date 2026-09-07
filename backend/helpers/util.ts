import { parseAsync } from 'json2csv';
import fs from 'fs';
import mysql from 'mysql';
import Client from 'ssh2-sftp-client';
const NODE_ENV = process.env.NODE_ENV || 'local';
const key = JSON.parse(fs.readFileSync(`config/${NODE_ENV}.json`, 'utf8'));
const agency_connection = mysql.createConnection(key['agency-connection']);
// SFTP credentials come from config ("sftp-connection") or env vars — never hardcode them here.
const sftpConfig = Object.assign(
  {},
  key['sftp-connection'],
  {
    host: process.env.SFTP_HOST || (key['sftp-connection'] || {}).host,
    username: process.env.SFTP_USER || (key['sftp-connection'] || {}).username,
    password: process.env.SFTP_PASSWORD || (key['sftp-connection'] || {}).password
  }
);
const sftp = new Client();

async function getCustomerData (data) {
  let attribute_array = ['firstname', 'lastname', 'display_name',
    'email', 'line_id', 'phone_number', 'facebook_name', 'active'];
  let customer = {};
  for (let attribute in data) {
    if (attribute_array.includes(attribute))
      customer[attribute] = data[attribute];
  }
  return { customer }
}

async function getAddressData (customer_id: any, data: any) {
  let attribute_array = ['firstname', 'lastname', 'company_name', 'company_branch',
    'tax_id', 'address_type', 'address_detail', 'address_sub_district', 'address_district',
    'address_province', 'address_country', 'address_postal_code', 'phone_number'];
  let address: any = {};
  for (let attribute in data) {
    if (attribute_array.includes(attribute))
      address[attribute] = data[attribute];
  }
  address.customer_id = customer_id
  return { address }
}

async function getAdminData (data) {
  let attribute_array = ['firstname', 'lastname', 'username', 'role_id',
    'active', 'email', 'password', 'phone_number', 'line_id', 'profile_image_url'];
  let admin = {};
  for (let attribute in data) {
    if (attribute_array.includes(attribute))
      admin[attribute] = data[attribute];
  }
  return { admin }
}

async function getCustomerSupplyData (data) {
  let attribute_array = ['maid_quantity', 'maid_salary', 'total_cost', 'total_supply_cost',
    'total_maid_salary', 'total_price', 'remark', 'biz_customer_name'];
  let { customer_supply_details } = data;
  let customer_supply = {};
  for (let attribute in data) {
    if (attribute_array.includes(attribute))
      customer_supply[attribute] = data[attribute];
  }
  return { customer_supply, customer_supply_details }
}

function genTxt (length = 8) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let rand_txt = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    rand_txt += charset.charAt(Math.floor(Math.random() * n));
  }
  return rand_txt;
}

async function findOnAgency (table_name, field, order_by) {
  return new Promise((resolve, reject) => {
    agency_connection.query(`SELECT ${field} FROM ${table_name} ORDER BY ${order_by} DESC LIMIT 1`, function (error, result, fields) {
      if (error || !result.length) {
        reject({ message: 'unable to create maid record' });
      } else {
        resolve(result);
      }
    });
  });
}

async function createOnAgency (table_name, data) {
  return new Promise((resolve, reject) => {
    agency_connection.query(`INSERT INTO ${table_name} SET ?`, data, function (error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

async function bulkCreateOnAgency (table_name, data) {
  let promise_array = [];
  for (let item of data) {
    promise_array.push(new Promise ((resolve, reject) => {
      agency_connection.query(`INSERT INTO ${table_name} SET ?`, item, function (error, results, fields) {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    }))
  }
  return new Promise((resolve_all, reject_all) => {
    if (data.length)
      Promise.all(promise_array).then(() => {
        resolve_all(true);
      }).catch((error) => {
        console.log(error)
        reject_all({ message: 'Error bulk create' })
      });
    else
      resolve_all(true)
  });
}

async function updateOnAgency (table_name, attribute_set, condition, data) {
  return new Promise((resolve, reject) => {
    agency_connection.query(`UPDATE ${table_name} SET ${attribute_set} WHERE ${condition}`, data, function (error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

async function removeOnAgency (table_name, condition, data) {
  return new Promise((resolve, reject) => {
    agency_connection.query(`DELETE FROM ${table_name} WHERE ${condition}`, data, function (error, results, fields) {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

async function genAgencyData (supporter_id, supporter) {
  let birthday_text = '';
  if (supporter.birthday) {
    let birthday = new Date(supporter.birthday);
    let month = '0' + (birthday.getMonth() + 1);
    let day = '0' + birthday.getDate();
    month = month.slice(-2);
    day = day.slice(-2);
    birthday_text = `${birthday.getFullYear()}-${month}-${day}`;
  }
  let position_ID = 0;
  if (supporter.job_roles) {
    let position_array = supporter.job_roles.split(',')
    if (position_array.includes('maid')) {
      if (position_array.includes('nanny'))
        position_ID = 20;
      else if (position_array.includes('cook'))
        position_ID = 21;
      else if (position_array.includes('elder'))
        position_ID = 22;
      else if (position_array.includes('pet'))
        position_ID = 23;
      else
        position_ID = 18;
    } else if (position_array.includes('nanny'))
      position_ID = 19;
    else if (position_array.includes('premium'))
      position_ID = 24
    else if (position_array.includes('elder'))
      position_ID = 28;
    else if (position_array.includes('restaurant'))
      position_ID = 29;
  }
  let mstatus = 0;
  if (supporter.marriage_status == 'Divorced')
    mstatus = 3
  else if (supporter.marriage_status == 'Married')
    mstatus = 2
  else
    mstatus = 1
  let location_ID: any = '';
  if (supporter.job_location == 'Bangkok')
    location_ID = 72
  else if (supporter.job_location == 'Nonthaburi')
  location_ID = 73
  else if (supporter.job_location == 'Cambodia')
    location_ID = 79
  else if (supporter.job_location == 'Laos')
    location_ID = 80

  let currency: any = supporter.currency || ''
  if (supporter.currency == 'LAK')
    currency = 'Kip'
  let agency_supporter = {
    maid_ID: '000000000000',
    code: supporter.internal_code || '',
    position_ID: position_ID,
    name: supporter.firstname,
    birthday: birthday_text,
    tel: supporter.phone_number || '',
    weight: supporter.weight || '',
    height: supporter.height || '',
    national: supporter.nationality || '',
    location_ID: location_ID,
    ltype: (supporter.job_live == 'Live in') ? 1 : 2,
    jtype: (supporter.job_type == 'Full time') ? 1 : 2,
    salary: supporter.expected_salary || 0,
    currency: currency,
    mstatus: mstatus,
    youtube: '',
    jstatus: supporter.active || 2,
    remark: supporter.remark || '',
    comment: supporter.comment || '',
    maid_backoffice_id: supporter_id,
    profile_image_url: supporter.profile_image_url
  }
  return agency_supporter;
}

async function uploadSupporterProfileImage (image_url) {
  return new Promise((resolve, reject) => {
    let origin_url = `uploads/supporters/${image_url}`;
    let destination_url = `/var/www/vhosts/ayasan-service.com/httpdocs/assets/uploads/profilepicture/${image_url}`;
    sftp.connect(Object.assign({ port: '22' }, sftpConfig)).then(() => {
      sftp.put(origin_url, destination_url).then(() => {
        sftp.end();
        resolve(true);
      });
    }).catch(err => {
      reject(err);
    });
  });
}

async function json2csv (header, data) {
  return new Promise((resolve, reject) => {

    const opts = { fields: header };
    parseAsync(data, opts)
      .then(csv => resolve(csv))
      .catch(err => reject(err));
  });
}

async function writeCsvFile(file_name, data){
  return new Promise(function(resolve, reject){

    fs.writeFile(`./exports/${file_name}`, data,  function(err){
      if (err)
        reject(err);
      else
        resolve(true);
    });
  });
}

export { getCustomerData as getCustomerData, genTxt as genTxt, findOnAgency as findOnAgency, createOnAgency as createOnAgency, updateOnAgency as updateOnAgency, removeOnAgency as removeOnAgency, genAgencyData as genAgencyData, bulkCreateOnAgency as bulkCreateOnAgency, getAdminData as getAdminData, uploadSupporterProfileImage as uploadSupporterProfileImage, getAddressData as getAddressData, json2csv, writeCsvFile, getCustomerSupplyData };