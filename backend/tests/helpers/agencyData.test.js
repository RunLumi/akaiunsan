import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// agencyData binds its mysql connection at require time; patch the package
// cache first, then import the helper.
const restoreFns = [];
function patchModule(specifier, mockExports) {
  const resolved = require.resolve(specifier);
  const original = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: mockExports,
  };
  restoreFns.push(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

const mkMaid = (overrides = {}) => ({
  id: '00000000001',
  internal_code: 'M001',
  name: 'Somchai',
  birthday: '1990-05-05',
  phone_number: '081',
  weight: '60',
  height: '170',
  nationality: 'thai',
  location_ID: '72',
  ltype: 1,
  jtype: 1,
  salary: 15000,
  currency: 'THB',
  mstatus: 2,
  remark: 'has work-permit',
  comment: 'good',
  position_ID: 20,
  jstatus: 1,
  ...overrides,
});

const fixtures = {
  maid: [
    mkMaid(),
    // every remaining switch branch
    mkMaid({ id: '00000000002', internal_code: 'M002', name: 'L1', nationality: 'vietnam', location_ID: '73', ltype: 2, jtype: 2, mstatus: 1, position_ID: 18 }),
    mkMaid({ id: '00000000003', internal_code: 'M003', name: 'L3', nationality: 'lao', location_ID: '79', ltype: 3, mstatus: 3, position_ID: 19 }),
    mkMaid({ id: '00000000004', internal_code: 'M004', name: 'C79', nationality: 'cambodia', location_ID: '80', position_ID: 21 }),
    mkMaid({ id: '00000000005', internal_code: 'M005', name: 'C80', nationality: 'myanmar(ไทยใหญ่)', position_ID: 22 }),
    mkMaid({ id: '00000000006', internal_code: 'M006', name: 'P23', nationality: 'filipino', position_ID: 23 }),
    mkMaid({ id: '00000000007', internal_code: 'M007', name: 'P24', nationality: 'myanmar/thaiyai', position_ID: 24 }),
    mkMaid({ id: '00000000008', internal_code: 'M008', name: 'P28', nationality: 'philipines', position_ID: 28 }),
    mkMaid({ id: '00000000009', internal_code: 'M009', name: 'P29', position_ID: 29 }),
  ],
  skillmatch: [{ skill_name: 'Cook Thai', maid_ID: '00000000001', skill_ID: 85 }],
  experience: [
    { maid_ID: '00000000001', worktime: '2 years', exp_location: 'Thai family' },
    { maid_ID: '00000000001', worktime: '1 year', exp_location: 'hotel' },
  ],
  maidnanny: [{ maid_id: '00000000001' }],
  view_summary: [
    { id: 1, count: 10 },
    { id: 2, count: 20 },
  ],
};

const fakeMysql = {
  createConnection: () => ({
    query: (sql, valuesOrCb, maybeCb) => {
      const cb = typeof valuesOrCb === 'function' ? valuesOrCb : maybeCb;
      const table = sql.includes('FROM maid as m')
        ? 'maid'
        : sql.includes('FROM skill as s')
          ? 'skillmatch'
          : sql.includes('FROM experience')
            ? 'experience'
            : sql.includes('position_ID = 20')
              ? 'maidnanny'
              : sql.includes('view_summary')
                ? 'view_summary'
                : 'unknown';
      cb(null, fixtures[table] ?? [], []);
    },
    connect: (cb) => cb && cb(null),
    end: (cb) => cb && cb(null),
  }),
};

class FakeSftp {
  connect(config) { return Promise.resolve(config); }
  get() { return Promise.resolve(Buffer.from('jpg')); }
  put() { return Promise.resolve(); }
  end() { return Promise.resolve(); }
}

let agencyData, db, truncateAll, factories;

// file-backed fixtures (getDriver/getDriverSkill/getDriverExperience)
const jsonFixtures = {
  'm.json': [
    {
      id: '101',
      internal_code: 'D001',
      name: 'Driver One',
      phone_number: '083',
      weight: '70',
      height: '175',
      nationality: 'Thai',
      birthday: '1985-01-01',
    },
  ],
  'skill.json': [
    { maid_ID: '101', skill_name: 'little English' },
    { maid_ID: '101', skill_name: 'good Mandarin' },
    { maid_ID: '101', skill_name: 'fair Korean' },
    { maid_ID: '101', skill_name: 'Japanese' },
    { maid_ID: '101', skill_name: 'Nepali' },
    { maid_ID: '101', skill_name: 'Chinese' },
    { maid_ID: '101', skill_name: 'no known language marker' },
  ],
  'experience.json': [
    { maid_ID: '101', worktime: '3 years', exp_location: 'Japanese family' },
    { maid_ID: '101', worktime: '6 months', exp_location: 'factory' },
  ],
};

const originalFetch = global.fetch;

beforeAll(async () => {
  fs.mkdirSync('uploads/supporters', { recursive: true });
  patchModule('mysql', fakeMysql);
  patchModule('ssh2-sftp-client', FakeSftp);
  global.fetch = async (url) => ({ ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) });

  for (const [name, data] of Object.entries(jsonFixtures)) {
    fs.writeFileSync(path.join(process.cwd(), name), JSON.stringify(data));
  }

  agencyData = await import('../../helpers/agencyData');
  ({ db, truncateAll } = await import('./db'));
  factories = await import('./factories');
  await truncateAll();
});

afterAll(() => {
  for (const name of Object.keys(jsonFixtures)) {
    fs.unlinkSync(path.join(process.cwd(), name));
  }
  global.fetch = originalFetch;
  restoreFns.forEach((restore) => restore());
});

describe('correctNationality', () => {
  it('maps every known spelling and nulls the rest', () => {
    const { correctNationality } = agencyData;
    expect(correctNationality('THAI')).toBe('Thai');
    expect(correctNationality('thailand')).toBe('Thai');
    expect(correctNationality('vietnam')).toBe('Vietnamese');
    expect(correctNationality('lao')).toBe('Lao');
    expect(correctNationality('myanmar')).toBe('Myanmar');
    expect(correctNationality('myanmar(ไทยใหญ่)')).toBe('Myanmar/Thaiyai');
    expect(correctNationality('cambodia')).toBe('Combodian');
    expect(correctNationality('filipino')).toBe('Filipino');
    expect(correctNationality('philipines')).toBe('Filipino');
    expect(correctNationality('martian')).toBeNull();
    expect(correctNationality(null)).toBeNull();
  });
});

describe('getSuppoterFromAgency', () => {
  it('maps agency maid rows onto supporter shapes', async () => {
    const supporters = await agencyData.getSuppoterFromAgency(1, 2);

    expect(supporters).toHaveLength(9);
    const [first] = supporters;
    const second = supporters[1];

    expect(first).toMatchObject({
      firstname: 'Somchai',
      job_location: 'Bangkok',
      job_live: 'Live in',
      job_type: 'Full time',
      marriage_status: 'Married',
      job_roles: 'maid,nanny',
      work_permit: true, // from the remark
      active: true,
      maid_id: 1,
    });
    expect(first.birthday).toBeInstanceOf(Date);

    // the 9-row fixture exercises every switch branch
    expect(supporters.map((s2) => s2.job_live)).toEqual(expect.arrayContaining([
      'Live in', 'Live out', 'Live in and out',
    ]));
    expect(supporters.map((s2) => s2.job_type)).toEqual(expect.arrayContaining(['Full time', 'Part time']));
    expect(supporters.map((s2) => s2.marriage_status)).toEqual(expect.arrayContaining(['Married', 'Single', 'Divorced']));
    expect(supporters.map((s2) => s2.job_location)).toEqual(expect.arrayContaining(['Bangkok', 'Nonthaburi', 'Cambodia', 'Laos']));
    expect(supporters.map((s2) => s2.job_roles)).toEqual(expect.arrayContaining([
      'maid', 'nanny', 'maid,nanny', 'maid,cook', 'maid,elder', 'maid,pet', 'premium', 'elder', 'restaurant',
    ]));
    expect(supporters.every((s2) => typeof s2.work_permit === 'boolean')).toBe(true);
    expect(supporters.some((s2) => s2.birthday instanceof Date)).toBe(true);
  });
});

describe('getSkillFromAgency / getExperienceFromAgency', () => {
  it('pairs known skills onto local supporters', async () => {
    const local = await db.Supporter.create({
      firstname: 'Skill Holder',
      maid_id: 1,
      job_type: 'Full time',
    });

    const { skills, languages } = await agencyData.getSkillFromAgency(1, 2);
    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({
      skill: 'Cook Thai',
      supporter_id: local.id,
    });
    expect(languages).toHaveLength(0);

    const experiences = await agencyData.getExperienceFromAgency(1, 2);
    expect(experiences).toHaveLength(2);
    const familyExp = experiences.find((e) => e.employer_nationality);
    expect(familyExp.employer_nationality).toBe('Thai family');
    const plainExp = experiences.find((e) => !e.employer_nationality);
    expect(plainExp.detail).toBe('1 year (hotel)');
  });
});

describe('pairSkill / pairExperience', () => {
  it('splits skills and languages by pair list', async () => {
    const paired = await agencyData.pairSkill(
      [
        { skill_ID: 85 }, // Cook Thai (skill)
        { skill_ID: 79 }, // English fair (language)
        { skill_ID: 999 }, // unknown
      ],
      55
    );
    expect(paired.skill_list).toHaveLength(1);
    expect(paired.language_list).toHaveLength(1);
    expect(paired.language_list[0]).toMatchObject({ language: 'English', level: 'fair' });

    const exps = await agencyData.pairExperience(
      [{ worktime: '1y', exp_location: 'Thai family' }],
      55
    );
    expect(exps).toHaveLength(1);
    expect(exps[0].employer_nationality).toBe('Thai family');
  });
});

describe('agency lists and stats', () => {
  it('returns the maid/nanny list and view summary', async () => {
    const list = await agencyData.getMaidNannyList();
    expect(list).toEqual([{ maid_id: '00000000001' }]);

    const stats = await agencyData.getAllStat();
    expect(stats).toEqual(fixtures.view_summary);
  });
});

describe('profile picture fetchers', () => {
  it('downloads a maid profile over sftp', async () => {
    const filename = await agencyData.getMaidProfile(1);
    expect(filename).toBe('maid_1.jpg');
  });

  it('downloads a driver profile over http', async () => {
    const filename = await agencyData.getDriverProfile(101);
    expect(filename).toBe('driver_101.jpg');
  });
});

describe('file-backed driver imports', () => {
  it('maps m.json drivers incl. birthday parsing and defaults', async () => {
    const drivers = await agencyData.getDriver();
    expect(drivers).toHaveLength(1);
    expect(drivers[0]).toMatchObject({
      driver_id: 101,
      firstname: 'Driver One',
      phone_number: '083',
      nationality: 'Thai',
    });
    expect(drivers[0].birthday).toBeInstanceOf(Date);
  });

  it('maps skill.json into language rows (all language branches)', async () => {
    const languages = await agencyData.getDriverSkill(); // resolves the bare array
    const byLang = Object.fromEntries(languages.map((l) => [l.language, l.level]));
    expect(byLang.English).toBe('little');
    expect(byLang['Chinese (Mandarin)']).toBe('good');
    expect(byLang.Japanese).toBe('fair'); // no little/good marker → 'fair' default
    expect(['Japanese', 'Nepali', 'Chinese', 'Korean', 'Thai']).toContain('Thai');
  });

});
