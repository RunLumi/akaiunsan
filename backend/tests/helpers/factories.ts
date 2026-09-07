import db from '../../models/index.ts';
import { encryptPassword, generateToken } from '../../helpers/security.ts';

export const ADMIN_PASSWORD = 'adminPassw0rd';
export const CUSTOMER_PASSWORD = 'customerPassw0rd';

export async function createRole(overrides = {}) {
  return db.Role.create({
    role_name: 'Test Role',
    permission: 'User,Banner,Request,Supporter',
    ...overrides,
  });
}

export async function createAdmin(overrides = {}) {
  let roleId = overrides.role_id;
  if (roleId === undefined) {
    const role = await createRole();
    roleId = role.id;
  }
  return db.Admin.create({
    firstname: 'Ada',
    lastname: 'Min',
    username: 'admin@test.local',
    email: 'admin@test.local',
    password: await encryptPassword(ADMIN_PASSWORD),
    role: 'admin',
    role_id: roleId,
    active: true,
    ...overrides,
  });
}

export async function createCustomer(overrides = {}) {
  return db.Customer.create({
    firstname: 'Custy',
    lastname: 'Custerson',
    email: 'customer@test.local',
    password: await encryptPassword(CUSTOMER_PASSWORD),
    active: true,
    ...overrides,
  });
}

export async function createAddress(customer_id: number, overrides = {}) {
  return db.Address.create({
    customer_id,
    firstname: 'Custy',
    lastname: 'Custerson',
    address_detail: '1 Test Road',
    address_country: 'Thailand',
    ...overrides,
  });
}

/** A customer JWT the clientValidator middleware will accept. */
export async function customerToken(customer) {
  return generateToken(customer.email, 'test-host');
}

/** An admin JWT the backofficeValidator middleware will accept. */
export async function adminToken(admin) {
  return generateToken(admin.username, 'test-host');
}
