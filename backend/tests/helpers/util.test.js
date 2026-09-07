import { describe, it, expect } from 'vitest';

const { uploadSupporterProfileImage, genTxt, getCustomerData, getAddressData } =
  require('../../helpers/util');

describe('genTxt', () => {
  it('generates a random string of the requested length', () => {
    const out = genTxt(20);
    expect(out).toHaveLength(20);
    expect(genTxt(20)).not.toBe(out);
  });
});

describe('getCustomerData', () => {
  it('keeps only whitelisted customer attributes', async () => {
    const { customer } = await getCustomerData({
      firstname: 'A',
      lastname: 'B',
      email: 'a@b.co',
      password: 'secret',
      admin: true,
    });
    expect(customer).toEqual({ firstname: 'A', lastname: 'B', email: 'a@b.co' });
  });
});

describe('getAddressData', () => {
  it('keeps whitelisted attributes and stamps the customer id', async () => {
    const { address } = await getAddressData(7, {
      address_detail: 'room 1',
      evil: 'nope',
    });
    expect(address).toEqual({ address_detail: 'room 1', customer_id: 7 });
  });
});

describe('uploadSupporterProfileImage', () => {
  it('rejects with the sftp error instead of hanging on a typo', async () => {
    // connect() fails; the promise must reject with that error. Previously the
    // catch block called the misspelled `erject`, so the outer promise never
    // settled and callers hung forever.
    const sftpError = new Error('sftp refused');
    const Client = require('ssh2-sftp-client');
    const originalConnect = Client.prototype.connect;
    Client.prototype.connect = () => Promise.reject(sftpError);

    try {
      await expect(uploadSupporterProfileImage('x.jpg')).rejects.toThrow('sftp refused');
    } finally {
      Client.prototype.connect = originalConnect;
    }
  }, 5000);
});
