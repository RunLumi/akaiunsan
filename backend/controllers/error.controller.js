/**
 * record error log from front-end
 */
const { ErrorLog } = require('../models');
module.exports = async (req, res) => {
  let { error_location, error_message = 'Unexpected error' } = req.body;
  await ErrorLog.create({ location: error_location, message: error_message });
  return res.status(200).json(true);
}