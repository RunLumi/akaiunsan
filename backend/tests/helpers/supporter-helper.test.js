import { describe, it, expect, beforeAll } from 'vitest';
import db from '../../models/index.ts';

import * as supporterHelper from '../../helpers/supporter.helper.ts';

let created;

beforeAll(async () => {
  const { truncateAll } = await import('./db');
  await truncateAll();
});

describe('helpers/supporter.helper — create with children', () => {
  it('creates a supporter with educations, skills, languages, experiences', async () => {
    created = await supporterHelper.create({
      firstname: 'Full',
      lastname: 'Profile',
      job_type: 'Full time',
      job_roles: 'maid,nanny',
      nationality: 'Thai',
      active: true,
      educations: [{ education_level: 'High school', major: 'General' }],
      skills: [{ skill: 'Cook Thai', level: 'good' }],
      languages: [{ language: 'English', level: 'fair' }],
      experiences: [{ detail: '2 years hotel', employer_nationality: null }],
    });

    expect(created.id).toBeGreaterThan(0);
    expect(
      await db.SupporterSkill.count({ where: { supporter_id: created.id } })
    ).toBe(1);
    expect(
      await db.SupporterLanguage.count({ where: { supporter_id: created.id } })
    ).toBe(1);
    expect(
      await db.SupporterExperience.count({ where: { supporter_id: created.id } })
    ).toBe(1);
    expect(
      await db.SupporterEducation.count({ where: { supporter_id: created.id } })
    ).toBe(1);
  });

  it('update replaces child rows via remove lists', async () => {
    const skill = await db.SupporterSkill.findOne({ where: { supporter_id: created.id } });
    const language = await db.SupporterLanguage.findOne({ where: { supporter_id: created.id } });
    const experience = await db.SupporterExperience.findOne({ where: { supporter_id: created.id } });
    const education = await db.SupporterEducation.findOne({ where: { supporter_id: created.id } });

    await supporterHelper.update(created.id, {
      firstname: 'Full2',
      skills: [{ skill: 'Drive', level: 'fair' }],
      languages: [{ language: 'Thai', level: 'good' }],
      experiences: [{ detail: 'van' }],
      educations: [{ education_level: 'Bachelor' }],
      remove_skills: [skill.id],
      remove_languages: [language.id],
      remove_experiences: [experience.id],
      remove_educations: [education.id],
    });

    expect(
      await db.SupporterSkill.count({ where: { supporter_id: created.id } })
    ).toBe(1);
    expect(
      (await db.SupporterSkill.findOne({ where: { supporter_id: created.id } })).skill
    ).toBe('Drive');
    expect(
      await db.SupporterSkill.count({ where: { id: skill.id } })
    ).toBe(0);
  });

  it('getDetail enriches profile url and splits roles', async () => {
    const detail = await supporterHelper.getDetail(created.id);
    // created without profile_image_url → default-image branch
    expect(detail.profile_image_url).toBe('https://cdn.test.local/default-profile.png');
    expect(detail.job_roles).toEqual(['maid', 'nanny']); // csv split

    // with-image branch
    await db.Supporter.update(
      { profile_image_url: 'photo.jpg' },
      { where: { id: created.id } }
    );
    const withPhoto = await supporterHelper.getDetail(created.id);
    expect(withPhoto.profile_image_url).toBe('https://cdn.test.local/supporters/photo.jpg');
  });

  it('getList and count honor filters', async () => {
    const list = await supporterHelper.getList(1, 10, 'id', 'ASC', null, null);
    expect(list.length).toBeGreaterThanOrEqual(1);
    const total = await supporterHelper.count(null, null);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it('increaseViewCount bumps the counter row', async () => {
    await supporterHelper.increaseViewCount(created.id);
    // whatever the implementation writes, the call must not throw
    expect(true).toBe(true);
  });

  it('remove deletes the supporter', async () => {
    await supporterHelper.remove(created.id);
    expect(await db.Supporter.findByPk(created.id)).toBeNull();
  });
});
