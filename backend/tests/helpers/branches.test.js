import { describe, it, expect } from 'vitest';

const agencyData = require('../../helpers/agencyData.ts');
const version = require('../../helpers/version.ts');
const util = require('../../helpers/util.ts');

describe('helpers/version branches', () => {
  it('formatTimeAgo spans seconds→years', () => {
    const now = Date.now();
    expect(version.formatTimeAgo(new Date(now))).toBe('just now');
    expect(version.formatTimeAgo(new Date(now - 30000))).toContain('second');
    expect(version.formatTimeAgo(new Date(now - 300000))).toContain('minute');
    expect(version.formatTimeAgo(new Date(now - 7200000))).toContain('hour');
    expect(version.formatTimeAgo(new Date(now - 5 * 86400000))).toContain('day');
    expect(version.formatTimeAgo(new Date(now - 45 * 86400000))).toContain('month');
    expect(version.formatTimeAgo(new Date(now - 800 * 86400000))).toContain('year');
  });

  it('formatUptime spans minutes/hours/days', () => {
    expect(version.formatUptime(30)).toContain('s');
    expect(version.formatUptime(90)).toContain('m');
    expect(version.formatUptime(7200)).toContain('h');
    expect(version.formatUptime(172800)).toContain('d');
  });

  it('getHealthInfo survives a missing git binary context', () => {
    const info = version.getHealthInfo();
    expect(typeof info).toBe('object');
    // whatever fields exist, it must not contain undefined values
    for (const v of Object.values(info)) {
      expect(v === null || v === undefined).toBe(false);
    }
  });
});

describe('helpers/agencyData correctNationality remaining branches', () => {
  it('maps every declared alias', () => {
    expect(agencyData.correctNationality('Vietnamese')).toBe('Vietnamese');
    expect(agencyData.correctNationality('vietnamese')).toBe('Vietnamese');
    expect(agencyData.correctNationality('laos')).toBe('Lao');
    expect(agencyData.correctNationality('myanmar/thaiyai')).toBe('Myanmar/Thaiyai');
    expect(agencyData.correctNationality('cambodian')).toBe('Combodian');
    expect(agencyData.correctNationality('philipine')).toBe('Filipino');
    expect(agencyData.correctNationality('philipines')).toBe('Filipino');
    expect(agencyData.correctNationality('')).toBeNull();
    expect(agencyData.correctNationality(undefined)).toBeNull();
  });
});

describe('helpers/util genAgencyData branch matrix', () => {
  const base = {
    firstname: 'X',
    phone_number: '02',
    job_live: 'Live in',
    job_type: 'Full time',
    marriage_status: 'Single',
    nationality: 'Thai',
    job_location: 'Bangkok',
  };

  it('maps all job_roles → position_ID combos', async () => {
    const roles = {
      'maid': 18, 'nanny': 19, 'maid,nanny': 20, 'maid,cook': 21,
      'maid,elder': 22, 'maid,pet': 23, 'premium': 24, 'elder': 28,
      'restaurant': 29, 'driver': 0,
    };
    for (const [rolesStr, expected] of Object.entries(roles)) {
      const out = await util.genAgencyData(1, { ...base, job_roles: rolesStr });
      expect(out.position_ID, rolesStr).toBe(expected);
    }
  });

  it('maps marriage statuses, locations and LAK currency', async () => {
    const out1 = await util.genAgencyData(1, { ...base, marriage_status: 'Married', job_location: 'Nonthaburi', currency: 'LAK' });
    expect(out1.mstatus).toBe(2);
    expect(out1.location_ID).toBe(73);
    expect(out1.currency).toBe('Kip');

    const out2 = await util.genAgencyData(1, { ...base, marriage_status: 'Divorced', job_location: 'Cambodia' });
    expect(out2.mstatus).toBe(3);
    expect(out2.location_ID).toBe(79);

    const out3 = await util.genAgencyData(1, { ...base, job_location: 'Laos', job_type: 'Part time', job_live: 'Live out' });
    expect(out3.location_ID).toBe(80);
    expect(out3.jtype).toBe(2);
    expect(out3.ltype).toBe(2);
  });

  it('handles a birthday and empty optionals', async () => {
    const out = await util.genAgencyData(1, { firstname: 'B', birthday: '1994-04-04' });
    expect(out.birthday).toBe('1994-04-04');
  });
});
