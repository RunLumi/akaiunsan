const { AdminHistory, Role, ErrorLog } = require('../models/index.ts');
let error_message = 'Unexpected error';

async function recordHistory (req, res, next) {
  try {
    if (req.method != 'GET') {
      await AdminHistory.create({
        admin_id: req.admin.id,
        admin_username: req.admin.username,
        path: req.originalUrl,
        params: JSON.stringify(req.body)
      });
      next();
    } else
      next();
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.recordHistory', message: error_message });
    return res.status(401).send({ message: error_message })
  }
}

async function checkPermission (req, res, next) {
  try {
    const path = req.originalUrl;
    const role = await Role.findOne({ where: { id: req.admin.role_id }});
    let allow_access = false;
    if (path.includes('/admins') || path.includes('/roles'))
      allow_access = role.permission.includes('User')
    if (path.includes('/banners'))
      allow_access = role.permission.includes('Banner')
    if (path.includes('/request-helpers') || path.includes('/request-helper-status'))
      allow_access = role.permission.includes('Request')
    if (path.includes('/supporters'))
      allow_access = role.permission.includes('Supporter')
    
    if (allow_access)
      next();
    else
      throw { message: 'Access denied' };
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'admin.checkPermission', message: error_message });
    return res.status(401).send({ message: error_message })
  }
}

module.exports = {
  recordHistory,
  checkPermission
}