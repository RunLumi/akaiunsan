import { Admin } from './../models/index.ts';

async function findAdminByUsername (username) {
  const found = await Admin.findOne({ where: { username }});
  if (!found) {
    throw Error(`Admin does not found.`);
  }
  return found;
}

async function findAdminById (admin_id) {
  const found = await Admin.findOne({ where: { id: admin_id }});
  if (!found) {
    throw Error(`Admin does not found.`);
  }
  return found;
}

export { findAdminByUsername, findAdminById };