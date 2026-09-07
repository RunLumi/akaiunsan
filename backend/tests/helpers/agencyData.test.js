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

const fixtures = {
  maid: [
    {
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
    },
    {
      id: '00000000002',
      internal_code: 'M002',
      name: 'Anna',
      birthday: '0000-00-00',
      phone_number: '082',
      weight: '50',
      height: '160',
      nationality: 'philipine',
      location_ID: '99',
      ltype: 9,
      jtype: 9,
      salary: 20000,
      currency: 'THB',
      mstatus: 9,
      remark: null,
      comment: null,
      position_ID: 99,
      jstatus: 2,
    },
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
  ],
  'experience.json': [
    { maid_ID: '101', worktime: '3 years', exp_location: 'Japanese family' },
    { maid_ID: '101', worktime: '6 months', exp_location: 'factory' },
  ],
};

const originalFetch = global.fetch;

beforeAll(async () => {
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

    expect(supporters).toHaveLength(2);
    const [first, second] = supporters;

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

    // second row exercises the inactive/unknown-code paths
    expect(second.active).toBe(false); // jstatus 2
    expect(second.job_roles).toBeNull();
    expect(second.birthday).toBeNull();
    expect(second.work_permit).toBe(false);
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
  it('pins current behavior: getDriver never settles (copy-pasted req.body crash)', async () => {
    // The mapper reads `req.body.birthday` inside a helper where no req
    // exists, and calls driver.birthday.split without a null guard — the
    // throw happens inside the fs.readFile callback, so the outer promise
    // never resolves or rejects. pins current behavior (dead code).
    const swallow = () => {};
    process.on('uncaughtException', swallow); // the pinned crash is uncaught
    const outcome = await Promise.race([
      agencyData.getDriver(),
      new Promise((resolve) => setTimeout(() => resolve('never-settles'), 1000)),
    ]);
    process.off('uncaughtException', swallow);
    expect(outcome).toBe('never-settles');
  });

  it('maps skill.json into language rows', async () => {
    const languages = await agencyData.getDriverSkill(); // resolves the bare array
    const english = languages.find((l) => l.language === 'English');
    expect(english.level).toBe('little');
    const mandarin = languages.find((l) => l.language === 'Chinese (Mandarin)');
    expect(mandarin.level).toBe('good');
  });

  it('maps experience.json rows', async () => {
    const experiences = await agencyData.getDriverExperience();
    const family = experiences.find((e) => e.employer_nationality);
    expect(family.employer_nationality).toBe('Japanese family');
    const plain = experiences.find((e) => !e.employer_nationality);
    expect(plain.detail).toBe('6 months (factory)');
  });
});
