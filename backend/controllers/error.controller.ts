import { ErrorLog } from '../models/index.ts';
/**
 * record error log from front-end
 */
export default async (req, res) => {
  let { error_location, error_message = 'Unexpected error' } = req.body;
  await ErrorLog.create({ location: error_location, message: error_message });
  return res.status(200).json(true);
}