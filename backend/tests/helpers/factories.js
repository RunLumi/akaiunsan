const db = require('../../models');
const { encryptPassword, generateToken } = require('../../helpers/security');

const ADMIN_PASSWORD = 'adminPassw0rd';
const CUSTOMER_PASSWORD = 'customerPassw0rd';

async function createRole(overrides = {}) {
  return db.Role.create({
    role_name: 'Test Role',
    permission: 'User,Banner,Request,Supporter',
    ...overrides,
  });
}

async function createAdmin(overrides = {}) {
  let role_id = overrides.role_id;
  if (role_id === undefined) {
    const role = await createRole();
    role_id = role.id;
  }
  return db.Admin.create({
    firstname: 'Ada',
    lastname: 'Min',
    username: 'admin@test.local',
    email: 'admin@test.local',
    password: await encryptPassword(ADMIN_PASSWORD),
    role: 'admin',
    role_id,
    active: true,
    ...overrides,
  });
}

async function createCustomer(overrides = {}) {
  return db.Customer.create({
    firstname: 'Custy',
    lastname: 'Custerson',
    email: 'customer@test.local',
    password: await encryptPassword(CUSTOMER_PASSWORD),
    active: true,
    ...overrides,
  });
}

async function createAddress(customer_id, overrides = {}) {
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
async function customerToken(customer) {
  return generateToken(customer.email, 'test-host');
}

/** An admin JWT the backofficeValidator middleware will accept. */
async function adminToken(admin) {
  return generateToken(admin.username, 'test-host');
}

module.exports = {
  ADMIN_PASSWORD,
  CUSTOMER_PASSWORD,
  createRole,
  createAdmin,
  createCustomer,
  createAddress,
  customerToken,
  adminToken,
};
