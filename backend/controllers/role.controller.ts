const { Role, ErrorLog } = require('../models/index.ts');
const { substring, and, or, not, eq, ne, gte, lte, is } = require('sequelize').Op;
let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  try {
    let { role_name, permission } = req.body;
    const result = await Role.create({ role_name, permission });
    return res.status(200).json(result);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'role.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  try {
    let { role_id } = req.params;
    let { role_name, permission } = req.body;
    await Role.update({ role_name, permission }, { where: { id: role_id }});
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'role.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  try {
    let { role_id } = req.params;
    await Role.destroy({ where: { id: role_id } });
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'role.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { role_id } = req.params;
    const role = await Role.findOne({
      where: { id: role_id }
    });
    if (!role)
      throw { message: 'Role not found' };
    return res.status(200).json(role);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'role.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter, keyword } = req.query;
    let { role_id } = req.params;
    page = page - 1;
    let offset = (!page) ? 0 : limit * page;
    if (offset < 0)
      offset = 0;
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach(prop => {
        fields[prop] = filter[prop];
      });
    } else if (keyword) {
      field_list = ['role_name', 'permission'];
      fields = {
        [or]: []
      };
      field_list.forEach(item => {
        fields[or].push({
          [item]: {
            [substring]: keyword
          }
        });
      });
    }
    if (role_id) {
      fields[and] = [{ role_id }]
    }
    const list = await Role.findAll({
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
    await ErrorLog.create({ location: 'role.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function count (req, res) {
  try {
    let { sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter, keyword } = req.query;
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach(prop => {
        fields[prop] = filter[prop];
      });
    } else if (keyword) {
      field_list = ['role_name', 'permission'];
      fields = {
        [or]: []
      };
      field_list.forEach(item => {
        fields[or].push({
          [item]: {
            [substring]: keyword
          }
        });
      });
    }
    const count = await Role.count({
      where: fields,
      order: [
        [sortby, ordering]
      ]
    });
    return res.status(200).json(count);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'role.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

module.exports = {
  create,
  update,
  remove,
  getDetail,
  getList,
  count
}