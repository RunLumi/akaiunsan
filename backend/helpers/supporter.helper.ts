import fs from 'fs';
import { Supporter, SupporterExperience, SupporterSkill, SupporterEducation, SupporterLanguage, SupporterViewCount, } from '../models/index.ts';
import { QueryTypes,Sequelize } from 'sequelize';
import __esModuleChain_Op from 'sequelize';
import db from '../models/index.ts';
declare var fields: any;
declare var field_list: any;
const { substring, and, or, not, eq, ne, gte, lte } = (__esModuleChain_Op as any).Op;
const NODE_ENV = process.env.NODE_ENV || "local";
const key = JSON.parse(fs.readFileSync(`config/${NODE_ENV}.json`, 'utf8'));
const config = JSON.parse(fs.readFileSync(`config/${NODE_ENV}.json`, 'utf8'));

const IMAGE_BASE_URL = config.image_base_url;
const DEFAULT_PROFILE_IMAGE_URL = config.default_image_url;

async function getSupporterAttribute(data) {
  let attribute_array = [
    "firstname",
    "profile_image_url",
    "display_name",
    "gender",
    "birthday",
    "weight",
    "height",
    "marriage_status",
    "nationality",
    "nationality_other",
    "religion",
    "personal_id",
    "passport_id",
    "driving_license",
    "motorbike_driving_license",
    "vaccine",
    "work_permit",
    "work_permit_expiration_date",
    "email",
    "phone_number",
    "line_id",
    "address_glat",
    "address_glng",
    "address_sub_district",
    "address_district",
    "address_province",
    "address_country",
    "address_postal_code",
    "addrress_detail",
    "emergency_contact_person",
    "emergency_contact_phone",
    "job_roles",
    "job_live",
    "job_type",
    "job_location",
    "expected_salary",
    "currency",
    "reference_person",
    "reference_contact",
    "active",
    "internal_code",
    "remark",
    "comment",
    "bank_name",
    "bank_account_name",
    "bank_account_number",
    "line_account_id",
    "address_location",
    "is_pet",
    "pet_detail",
    "is_app",
    "app_available_days",
    "app_available_time",
  ];
  let supporter = {};
  for (let attribute in data) {
    if (attribute_array.includes(attribute))
      supporter[attribute] = data[attribute];
  }
  if (
    supporter.profile_image_url &&
    supporter.profile_image_url.includes(key["image_base_url"])
  ) {
    supporter.profile_image_url = supporter.profile_image_url.replace(
      `${key["image_base_url"]}supporters/`,
      ""
    );
  }
  return supporter;
}

async function manageSupporterEducation(
  supporter_id,
  list = [],
  remove_list = []
) {
  for (let item of list) {
    item.supporter_id = supporter_id;
    if (item.id)
      await SupporterEducation.update(item, { where: { id: item.id } });
    else await SupporterEducation.create(item);
  }
  for (let item of remove_list) {
    await SupporterEducation.destroy({ where: { id: item } });
  }
  return true;
}

async function manageSupporterSkill(supporter_id, list = [], remove_list = []) {
  for (let item of list) {
    item.supporter_id = supporter_id;
    if (item.id) await SupporterSkill.update(item, { where: { id: item.id } });
    else await SupporterSkill.create(item);
  }
  for (let item of remove_list) {
    await SupporterSkill.destroy({ where: { id: item } });
  }
  return true;
}

async function manageSupporterExperience(
  supporter_id,
  list = [],
  remove_list = []
) {
  for (let item of list) {
    item.supporter_id = supporter_id;
    if (item.id)
      await SupporterExperience.update(item, { where: { id: item.id } });
    else await SupporterExperience.create(item);
  }
  for (let item of remove_list) {
    await SupporterExperience.destroy({ where: { id: item } });
  }
  return true;
}

async function manageSupporterLanguage(
  supporter_id,
  list = [],
  remove_list = []
) {
  for (let item of list) {
    item.supporter_id = supporter_id;
    if (item.id)
      await SupporterLanguage.update(item, { where: { id: item.id } });
    else await SupporterLanguage.create(item);
  }
  for (let item of remove_list) {
    await SupporterLanguage.destroy({ where: { id: item } });
  }
  return true;
}

async function create(data) {
  let supporter = await getSupporterAttribute(data);
  let { educations, skills, languages, experiences } = data;
  try {
    const supporter_result = await Supporter.create(supporter);
    let supporter_id = supporter_result.id;
    await manageSupporterEducation(supporter_id, educations);
    await manageSupporterSkill(supporter_id, skills);
    await manageSupporterExperience(supporter_id, experiences);
    await manageSupporterLanguage(supporter_id, languages);
    return supporter_result;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function update(supporter_id, data) {
  let supporter = await getSupporterAttribute(data);
  let {
    educations,
    skills,
    languages,
    experiences,
    remove_educations,
    remove_skills,
    remove_experiences,
    remove_languages,
  } = data;
  try {
    await Supporter.update(supporter, { where: { id: supporter_id } });

    await manageSupporterEducation(supporter_id, educations, remove_educations);
    await manageSupporterSkill(supporter_id, skills, remove_skills);
    await manageSupporterExperience(
      supporter_id,
      experiences,
      remove_experiences
    );
    await manageSupporterLanguage(supporter_id, languages, remove_languages);
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getDetail(supporter_id) {
  try {
    const supporter = await Supporter.findOne({
      where: { id: supporter_id },
      include: [
        { model: SupporterSkill },
        { model: SupporterExperience },
        { model: SupporterEducation },
        { model: SupporterLanguage },
      ],
    });
    if (!supporter) throw { message: "Supporter not found" };
    if (supporter.profile_image_url)
      supporter.profile_image_url = `${IMAGE_BASE_URL}supporters/${supporter.profile_image_url}`;
    else supporter.profile_image_url = DEFAULT_PROFILE_IMAGE_URL;
    let roles = [];
    if(supporter.job_roles){
      roles = supporter.job_roles.split(",");
    }
    supporter.job_roles = roles;
    return supporter;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getList(
  page = 0,
  limit = 10,
  sortby = "id",
  ordering = "ASC",
  filter = null,
  keyword = null
) {
  try {
    page = page - 1;
    let offset = !page ? 0 : limit * page;
    if (offset < 0) offset = 0;
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach((prop) => {
        fields[prop] = filter[prop];
      });
    } else if (keyword) {
      field_list = [
        "firstname",
        "internal_code",
        "phone_number",
        "email",
        "line_id",
      ];
      fields = {
        [or]: [],
      };
      field_list.forEach((item) => {
        fields[or].push({
          [item]: {
            [substring]: keyword,
          },
        });
      });
    }
    const list = await Supporter.findAll({
      where: fields,
      limit: Number(limit),
      offset: offset,
      order: [[sortby, ordering]],
    });
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function count(filter = null, keyword = null) {
  try {
    let fields = {};
    if (filter) {
      Object.keys(filter).forEach((prop) => {
        fields[prop] = filter[prop];
      });
    } else if (keyword) {
      field_list = [
        "firstname",
        "internal_code",
        "phone_number",
        "email",
        "line_id",
      ];
      fields = {
        [or]: [],
      };
      field_list.forEach((item) => {
        fields[or].push({
          [item]: {
            [substring]: keyword,
          },
        });
      });
    }
    const count = await Supporter.count({
      where: fields,
    });
    return count;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getPublicDetail(supporter_id) {
  try {
    const supporter = await Supporter.findOne({
      where: { id: supporter_id },
      attributes: [
        "id",
        "profile_image_url",
        "firstname",
        "internal_code",
        "birthday",
        "weight",
        "height",
        "nationality",
        "job_location",
        "job_location",
        "job_live",
        "job_roles",
        "job_type",
        "marriage_status",
        "nationality",
        "expected_salary",
        "profile_image_url",
        "remark",
        "work_permit",
        "vaccine",
      ],
      include: [
        { model: SupporterSkill },
        { model: SupporterExperience },
        { model: SupporterEducation },
        { model: SupporterLanguage },
      ],
    });
    if (!supporter) throw { message: "Supporter not found" };
    if (supporter.profile_image_url)
      supporter.profile_image_url = `${IMAGE_BASE_URL}supporters/${supporter.profile_image_url}`;
    else supporter.profile_image_url = DEFAULT_PROFILE_IMAGE_URL;
    let roles = supporter.job_roles.split(",");
    supporter.job_roles = roles;

    return supporter;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getPublicList(query) {
  try {
    let { page = 0, limit = 10, sortby = "id", ordering = "ASC" } = query;
    page = page - 1;
    let offset = !page ? 0 : limit * page;
    if (offset < 0) offset = 0;
    let where_clause = "Supporter.active = TRUE";
    let join_clause = "";
    let join_clause_2 = "";
    let cond_count = 0;
    let jobs = null;

    for (let prop in query) {
      switch (prop) {
        case "job_roles":
          jobs = query[prop].split(",");
          if (jobs.length > 1) {
            for (let job of jobs) {
              where_clause =
                where_clause + ` AND Supporter.job_roles LIKE '%${job}%'`;
            }
          }
          break;
        case "page_list":
          if (!query["page_list"] || query["page_list"].length > 0) {
            let jobs = query[prop].split(",");
            let job_roles_group = "";
            for (let job of jobs) {
              if (job_roles_group == "")
                job_roles_group =
                  job_roles_group + `Supporter.job_roles LIKE '%${job}%'`;
              else
                job_roles_group =
                  job_roles_group + ` OR Supporter.job_roles LIKE '%${job}%'`;
            }
            where_clause = where_clause + ` AND (${job_roles_group})`;
          }
          break;
        case "nationality":
          let nationalities = query[prop].split(",");
          let nationality_group = "";
          for (let nationality of nationalities) {
            if (nationality_group == "")
              nationality_group =
                nationality_group +
                `Supporter.nationality LIKE '%${nationality}%'`;
            else
              nationality_group =
                nationality_group +
                ` OR Supporter.nationality LIKE '%${nationality}%'`;
          }
          where_clause = where_clause + ` AND (${nationality_group})`;
          break;
        case "max_salary":
          where_clause =
            where_clause + ` AND Supporter.expected_salary <= ${query[prop]}`;
          break;
        case "min_salary":
          where_clause =
            where_clause + ` AND Supporter.expected_salary >= ${query[prop]}`;
          break;
        case "job_live":
          where_clause =
            where_clause + ` AND Supporter.job_live LIKE '%${query[prop]}%'`;
          break;
        case "job_type":
          where_clause =
            where_clause + ` AND Supporter.job_type LIKE '%${query[prop]}%'`;
          break;
        case "phone_number":
          where_clause =
            where_clause + ` AND Supporter.phone_number = '${query[prop]}'`;

          fields[and].push({
            phone_number: {
              [substring]: query[prop],
            },
          });
          break;
        case "line_account_id":
          where_clause =
            where_clause +
            ` AND Supporter.line_account_id LIKE '%${query[prop]}%'`;

          ;(fields as any)[and].push({
            line_account_id: {
              [eq]: query[prop],
            },
          });
          break;
        case "job_location":
          where_clause =
            where_clause + ` AND Supporter.job_location = '${query[prop]}'`;
          break;
        case "languages":
          let languages = query[prop].split(",");
          for (let language of languages) {
            if (join_clause == "") {
              join_clause = `SELECT supporter.supporter_id from supporter_language supporter`;
              join_clause_2 = ` WHERE supporter.language = '${language}'`;
            } else {
              join_clause += ` JOIN supporter_language supporter${cond_count} on (supporter${cond_count}.supporter_id = supporter.supporter_id)`;
              join_clause_2 += ` AND supporter${cond_count}.language = '${language}'`;
            }
            cond_count++;
          }
          break;
        case "skills":
          let skills = query[prop].split(",");
          for (let skill of skills) {
            if (join_clause == "") {
              join_clause = `SELECT supporter.supporter_id from supporter_skill supporter`;
              join_clause_2 = ` WHERE supporter.skill = '${skill}'`;
            } else {
              join_clause += ` JOIN supporter_skill supporter${cond_count} on (supporter${cond_count}.supporter_id = supporter.supporter_id)`;
              join_clause_2 += ` AND supporter${cond_count}.skill = '${skill}'`;
            }
          }
          break;
        case "internal_code":
          where_clause =
            where_clause +
            ` AND Supporter.internal_code LIKE '%${query[prop]}%'`;
          break;
        default:
          break;
      }
    }
    if (join_clause != "") {
      join_clause = `JOIN (${join_clause}${join_clause_2}) SupporterSkills ON (SupporterSkills.supporter_id = Supporter.id)`;
    }
    let sql = "";
    if (jobs && jobs.length == 1) {
      sql = `SELECT Supporter.id, Supporter.profile_image_url, Supporter.internal_code, Supporter.birthday,
      Supporter.weight, Supporter.height, Supporter.nationality, Supporter.job_location, Supporter.job_live,
      Supporter.job_roles, Supporter.job_type, Supporter.marriage_status, Supporter.expected_salary, Supporter.remark, Supporter.vaccine,
      SupporterViewCount.count
      FROM (
        (SELECT * FROM supporter WHERE job_roles = "${jobs[0]}" ORDER BY ${sortby} ${ordering})
        UNION
        (SELECT * FROM supporter WHERE job_roles != "${jobs[0]}" && job_roles LIKE "%${jobs[0]}%" ORDER BY ${sortby} ${ordering})
      ) Supporter left join supporter_view_count SupporterViewCount on SupporterViewCount.supporter_id = Supporter.id
      ${join_clause}
      WHERE ${where_clause}
      LIMIT ${limit}
      OFFSET ${offset}`;
    } else {
      sql = `SELECT Supporter.id, Supporter.profile_image_url, Supporter.internal_code, Supporter.birthday,
      Supporter.weight, Supporter.height, Supporter.nationality, Supporter.job_location, Supporter.job_live,
      Supporter.job_roles, Supporter.job_type, Supporter.marriage_status, Supporter.expected_salary, Supporter.remark, Supporter.vaccine, SupporterViewCount.count
      FROM supporter Supporter left join supporter_view_count SupporterViewCount on SupporterViewCount.supporter_id = Supporter.id
      ${join_clause}
      WHERE ${where_clause}
      ORDER BY ${sortby} ${ordering}
      LIMIT ${limit}
      OFFSET ${offset}`;
    }
    const [rows] = await db.sequelize.query(sql, { type: QueryTypes.SELECT });
    for (let supporter of rows) {
      if (supporter.profile_image_url)
        supporter.profile_image_url = `${IMAGE_BASE_URL}supporters/${supporter.profile_image_url}`;
      else supporter.profile_image_url = DEFAULT_PROFILE_IMAGE_URL;
      let roles = supporter.job_roles.split(",");
      supporter.job_roles = roles;
    }
    return rows;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getPublicCount(query) {
  try {
    let where_clause = "Supporter.active = TRUE";
    let join_clause = "";
    let join_clause_2 = "";
    let cond_count = 0;

    for (let prop in query) {
      switch (prop) {
        case "job_roles":
          let jobs = query[prop].split(",");
          for (let job of jobs) {
            where_clause =
              where_clause + ` AND Supporter.job_roles LIKE '%${job}%'`;
          }
          break;
        case "page_list":
          if (!query["page_list"] || query["page_list"].length > 0) {
            let jobs = query[prop].split(",");
            let job_roles_group = "";
            for (let job of jobs) {
              if (job_roles_group == "")
                job_roles_group =
                  job_roles_group + `Supporter.job_roles LIKE '%${job}%'`;
              else
                job_roles_group =
                  job_roles_group + ` OR Supporter.job_roles LIKE '%${job}%'`;
            }
            where_clause = where_clause + ` AND (${job_roles_group})`;
          }
          break;
        case "nationality":
          let nationalities = query[prop].split(",");
          let nationality_group = "";
          for (let nationality of nationalities) {
            if (nationality_group == "")
              nationality_group =
                nationality_group + `Supporter.nationality = '${nationality}'`;
            else
              nationality_group =
                nationality_group +
                ` OR Supporter.nationality = '${nationality}'`;
          }
          where_clause = where_clause + ` AND (${nationality_group})`;
          break;
        case "max_salary":
          where_clause =
            where_clause + ` AND Supporter.expected_salary <= ${query[prop]}`;
          break;
        case "min_salary":
          where_clause =
            where_clause + ` AND Supporter.expected_salary >= ${query[prop]}`;
          break;
        case "job_live":
          where_clause =
            where_clause + ` AND Supporter.job_live LIKE '%${query[prop]}%'`;
          break;
        case "job_type":
          where_clause =
            where_clause + ` AND Supporter.job_type LIKE '%${query[prop]}%'`;
          break;
        case "phone_number":
          where_clause =
            where_clause + ` AND Supporter.phone_number = '${query[prop]}'`;
          break;
        case "line_account_id":
          where_clause =
            where_clause +
            ` AND Supporter.line_account_id LIKE '%${query[prop]}%'`;
          break;
        case "job_location":
          where_clause =
            where_clause + ` AND Supporter.job_location = '${query[prop]}'`;
          break;
        case "languages":
          let languages = query[prop].split(",");
          for (let language of languages) {
            if (join_clause == "") {
              join_clause = `SELECT supporter.supporter_id from supporter_language supporter`;
              join_clause_2 = ` WHERE supporter.language = '${language}'`;
            } else {
              join_clause += ` JOIN supporter_language supporter${cond_count} on (supporter${cond_count}.supporter_id = supporter.supporter_id)`;
              join_clause_2 += ` AND supporter${cond_count}.language = '${language}'`;
            }
            cond_count++;
          }
          break;
        case "skills":
          let skills = query[prop].split(",");
          for (let skill of skills) {
            if (join_clause == "") {
              join_clause = `SELECT supporter.supporter_id from supporter_skill supporter`;
              join_clause_2 = ` WHERE supporter.skill = '${skill}'`;
            } else {
              join_clause += ` JOIN supporter_skill supporter${cond_count} on (supporter${cond_count}.supporter_id = supporter.supporter_id)`;
              join_clause_2 += ` AND supporter${cond_count}.skill = '${skill}'`;
            }
          }
          break;
        case "internal_code":
          where_clause =
            where_clause +
            ` AND Supporter.internal_code LIKE '%${query[prop]}%'`;
          break;
        default:
          break;
      }
    }
    if (join_clause != "") {
      join_clause = `JOIN (${join_clause}${join_clause_2}) SupporterSkills ON (SupporterSkills.supporter_id = Supporter.id)`;
    }
    let sql = `SELECT Count(*) as count
      FROM supporter Supporter
      ${join_clause}
      WHERE ${where_clause}`;

    const [row] = await db.sequelize.query(sql, { type: QueryTypes.SELECT });
    return row.count;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function remove(supporter_id) {
  try {
    await Supporter.destroy({ where: { id: supporter_id } });
    await SupporterExperience.destroy({ where: { supporter_id } });
    await SupporterSkill.destroy({ where: { supporter_id } });
    await SupporterLanguage.destroy({ where: { supporter_id } });
    await SupporterEducation.destroy({ where: { supporter_id } });
    await SupporterViewCount.destroy({ where: { supporter_id } });
    return true;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function increaseViewCount(supporter_id) {
  try {
    const supporterView = await SupporterViewCount.findOne({
      where: { supporter_id },
    });
    if (!supporterView) {
      await SupporterViewCount.create({
        count: 1,
        supporter_id,
      });
    } else {
      await SupporterViewCount.update(
        { count: supporterView.count + 1 },
        { where: { supporter_id } }
      );
    }

    return true;
  } catch (e) {
    throw new Error(e.message);
  }
}

export { create, update, getDetail, getList, count, getPublicDetail, getPublicList, getPublicCount, remove, increaseViewCount };