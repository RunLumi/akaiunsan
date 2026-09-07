import { Province, District, SubDistrict, ErrorLog } from '../models/index.ts';
let error_status = 500;
let error_message = 'Unexpected error';

async function getProvinceList (req, res) {
  try {
    const province_list = await Province.findAll();
    return res.status(200).json(province_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.json.controller.getProvinceList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDistrictList (req, res) {
  try {
    let { province_id } = req.params;
    const district_list = await District.findAll({ where: { province_id }});
    return res.status(200).json(district_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.json.controller.getDistrictList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getSubDistrictList (req, res) {
  try {
    let { district_id } = req.params;
    const sub_district_list = await SubDistrict.findAll({ where: { district_id }});
    return res.status(200).json(sub_district_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'address.json.controller.getSubDistrictList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getProvinceList, getDistrictList, getSubDistrictList };
const defaultExport = { getProvinceList, getDistrictList, getSubDistrictList };
export default defaultExport;