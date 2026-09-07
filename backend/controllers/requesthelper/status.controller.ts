import { substring } from 'sequelize';
import db from '../../models/index.ts';
const { RequestHelperStatus, ErrorLog } = db;
.Op;
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  try {
    let { status_name } = req.body;
    await RequestHelperStatus.create({ status_name });
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/status.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  try {
    let { request_helper_status_id } = req.params;
    let { status_name } = req.body;
    await RequestHelperStatus.update({ status_name }, { where: { id: request_helper_status_id }});
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/status.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { request_helper_status_id } = req.params;
    const request_helper_status = await RequestHelperStatus.findOne({ where: { id: request_helper_status_id }});
    return res.status(200).json(request_helper_status);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/status.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { keyword } = req.query;
    page = page - 1;
    let offset = (!page) ? 0 : limit * page;
    if (offset < 0)
      offset = 0;
    let fields = {};
    if (keyword) {
      fields = { status_name: { [substring]: keyword }}
    }
    const list = await RequestHelperStatus.findAll({
      where: fields,
      limit: Number(limit),
      offset: offset,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/status.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getCount (req, res) {
  try {
    let { keyword } = req.query;
    let fields = {};
    if (keyword) {
      fields = { status_name: { [substring]: keyword }}
    }
    const count = await RequestHelperStatus.count({
      where: fields
    });
    return res.status(200).json(count);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/status.controller.getCount', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  try {
    let { request_helper_status_id } = req.params;
    await RequestHelperStatus.destroy({ where: { id: request_helper_status_id }});
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'requesthelper/status.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { create, update, getDetail, getList, getCount, remove };