const { Supporter, SupporterViewCount, ErrorLog } = require('../models/index.ts');
const model = require('../models/index.ts').sequelize;
// const { substring, and, or, not, eq, ne, gte, lte } = require('sequelize').Op;
const { sequelize } = require('../models/index.ts');
let error_status = 500;
let error_message = 'Unexpected error';
const fs = require('fs');
const NODE_ENV = process.env.NODE_ENV || 'local';
const config = require(`../config/${NODE_ENV}.json`);

async function createCount (req, res) {
  try {
    const getCount = new Promise((resolve, reject) => {
      fs.readFile('view_summary.json', 'utf-8', function (err, data) {
        if (err) reject(err);
        obj = JSON.parse(data);
        resolve(obj);
      });
    });
    const view_count_list = await getCount;
    let sql = 'INSERT INTO `supporter_view_count` (`supporter_id`, `count`, `createdAt`, `updatedAt`) VALUES\n';
    let maid_date = new Date();
    for (let item of view_count_list) {
      let maid_id = Number(item.id);
      const supporter = await Supporter.findOne({ where: { maid_id }});
      const moment = require('moment');
      if (supporter) {
        sql += '(' + supporter.id + ', ' + item.count + ', "' + moment(String(maid_date)).format('YYYY-MM-DD hh:mm:ss');
        sql += '", "' + moment(String(maid_date)).format('YYYY-MM-DD hh:mm:ss') + '"),\n';
      }
    }
    const writeFile = new Promise((resolve, reject) => {
      let file = fs.createWriteStream('count.sql');
      file.on('error', function(err) {
        let error_message = 'Something went wrong.';
        err.message ? error_message = err.message : error_message;
        ErrorLog.create({ location: 'special.controller.maid', message: error_message });
        reject(false);
      });
      file.write(sql);
      file.end();
      resolve(true);
    });
    await writeFile;
    // console.log(view_count_list);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getOldDriverData', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

module.exports = {
  createCount
}