const { RequestHelper, RequestMaid, RequestDriver, Province, District, SubDistrict,
} = require("../models/index.ts");
const { substring, or, and, eq, between } = require("sequelize").Op;
const { sendMail } = require("./mail.ts");

async function newRequestEmail(data1, data2) {
  let request_type = data1.request_type == "driver" ? "Driver" : "Helper";
  let body_message = `
    <h3>There's a new request for ${request_type}.</h3>
    <table>
    <tbody>
    <tr>
    <td><b>Request ${request_type} code:</b></td><td>${data1.request_helper_code || "-"}</td>
    </tr>
    <tr>
    <td><b>Contact name:</b></td><td>${data1.contact_name}</td>
    </tr>
    <tr>
    <td><b>Phone number:</b></td><td>${data1.phone_number}</td>
    </tr>
    <tr>
    <td><b>Email:</b></td><td>${data1.email}</td>
    </tr>
    <tr>
    <td><b>Line ID:</b></td><td>${data1.line_id}</td>
    </tr>
    <tr>
    <td><b>Province:</b></td><td>${data1.province_name_en}</td>
    </tr>
    <tr>
    <td><b>District:</b></td><td>${data1.district_name_en}</td>
    </tr>
    <tr>
    <td><b>Sub District:</b></td><td>${data1.sub_district_name_en}</td>
    </tr>
    <tr>
    <td><b>Type of Building:</b></td><td>${data1.type_of_building}</td>
    </tr>
    <tr>
    <td><b>Floor:</b></td><td>${data1.floor}</td>
    </tr>
    <tr>
    <td><b>Address detail:</b></td><td>${data1.address_detail}</td>
    </tr>
    <tr>
    <td><b>Employer Nationality:</b></td><td>${data1.employer_nationality}</td>
    </tr>
    `;
  if (request_type == "Driver") {
    body_message += `
      <tr>
      <td><b>Driving Area:</b></td><td>${data2.driving_area}</td>
      </tr>
      <tr>
      <td><b>Customer Own a Car:</b></td><td>${data2.has_car ? "Yes" : "No"
      }</td>
      </tr>
      <tr>
      <td><b>Customer Car Type:</b></td><td>${data2.car_type || "-"} ${data2.car_type_other
      } (${data2.car_gear_type || "-"})</td>
      </tr>
      <tr>
      <td><b>Expect Language from Driver:</b></td><td>${data2.expect_language
      }</td>
      </tr>
      <tr>
      <td><b>Driver Age Range:</b></td><td>${data2.prefer_age_range}</td>
      </tr>
      <tr>
      <td><b>Work Days:</b></td><td>${data2.work_day}</td>
      </tr>
      <tr>
      <td><b>Work Time:</b></td><td>${data2.work_time}</td>
      </tr>
      <tr>
      <td><b>Currently Hire a Driver:</b></td><td>${data2.any_driver ? "Yes" : "No"}</td>
      </tr>
      <tr>
      <td><b>Offer Over-Time for Driver:</b></td><td>${data2.is_ot ? "Yes" : "No"
      }</td>
      </tr>
      <tr>
      <td><b>Expected Salary for Candidate:</b></td><td>${data2.expect_salary
      }</td>
      </tr>
      <tr>
      <td><b>When can start hiring:</b></td><td>${data2.start_hiring}</td>
      </tr>
      <tr>
      <td><b>Interview Preference:</b></td><td>${data2.interview_channel}</td>
      </tr>
      <tr>
      <td><b>Replace Guarantee:</b></td><td>${data2.replacement_guarantee}</td>
      </tr>
      </tbody>
      </table>
      `;
    await sendMail(
      "Request for Driver",
      body_message,
      "sale@ayasan.vn"
    );
  } else {
    body_message += `
      <tr>
      <td><b>Type of Worker:</b></td><td>${data2.type_of_worker}</td>
      </tr>
      <tr>
      <td><b>Type of Work Schedule:</b></td><td>${data2.work_type}</td>
      </tr>
      <tr>
      <td><b>Work Days:</b></td><td>${data2.work_day}</td>
      </tr>
      <tr>
      <td><b>Work Time:</b></td><td>${data2.work_time}</td>
      </tr>
      <tr>
      <td><b>Helper Nationality:</b></td><td>${data2.helper_nationality}</td>
      </tr>
      <tr>
      <td><b>Expected Language from Helper:</b></td><td>${data2.expect_language
      } ${data2.expect_language_other}</td>
      </tr>
      <tr>
      <td><b>Cooking Required:</b></td><td>${data2.require_cooking ? "Yes" : "No"
      } ${data2.require_cooking ? "(" + data2.cooking_type + ")" : ""}</td>
      </tr>
      <tr>
      <td><b>Having Kids:</b></td><td>${data2.any_kid ? "Yes" : "No"}
      ${data2.any_kid ? "How many kids: " + data2.amount_kid : ""}
      ${data2.any_kid ? "Ages: " + data2.age_year + "," + data2.age_month : ""}
      </td>
      </tr>
      <tr>
      <td><b>Having Pets:</b></td><td>${data2.any_pet ? "Yes" : "No"}
      ${data2.any_kid ? "How many pets: " + data2.amount_kid : ""}
      ${data2.any_kid ? "Type of pets: " + data2.type_of_pet : ""}
      </td>
      </tr>
      <tr>
      <td><b>Amount of Currently Hire Maids/Nannies:</b></td><td>${data2.amount_current_helper
      }</td>
      </tr>
      <tr>
      <td><b>Special Requirement:</b></td><td>${data2.special_requirement}</td>
      </tr>
      </tbody>
      </table>
      `;
    await sendMail(
      "Request for Helper (Maid/Nanny)",
      body_message,
      "sale@ayasan.vn"
    );
  }
}

async function create(customer_id, data) {
  let request_helper = {
    customer_id: customer_id,
    contact_name: data.contact_name,
    phone_number: data.phone_number,
    line_id: data.line_id,
    email: data.email,
    province_id: data.province_id,
    province_name_th: "",
    province_name_en: "",
    district_id: data.district_id,
    district_name_th: "",
    district_name_en: "",
    sub_district_id: data.sub_district_id,
    sub_district_name_th: "",
    sub_district_name_en: "",
    type_of_building: data.type_of_building,
    address_detail: data.address_detail,
    floor: data.floor,
    request_type: data.request_type,
    employer_nationality: data.employer_nationality,
    request_helper_code: data.request_helper_code,
  };
  let province = await Province.findOne({
    where: { id: request_helper.province_id },
  });
  request_helper.province_name_th = province.province_name_th;
  request_helper.province_name_en = province.province_name_en;
  let district = await District.findOne({
    where: { id: request_helper.district_id },
  });
  request_helper.district_name_th = district ? district.district_name_th : null;
  request_helper.district_name_en = district ? district.district_name_en : null;
  let sub_district = await SubDistrict.findOne({
    where: { id: request_helper.sub_district_id },
  });
  request_helper.sub_district_name_th = sub_district
    ? sub_district.sub_district_name_th
    : null;
  request_helper.sub_district_name_en = sub_district
    ? sub_district.sub_district_name_en
    : null;
  try {
    const request_helper_result = await RequestHelper.create(request_helper);
    if (data.request_type == "driver") {
      let request_driver = {
        driving_area: data.driving_area,
        has_car: data.has_car,
        car_type: data.car_type,
        car_type_other: data.car_type_other,
        car_gear_type: data.car_gear_type,
        expect_language: data.expect_language,
        prefer_age_range: data.prefer_age_range,
        work_day: data.work_day,
        work_day_other: data.work_day_other,
        work_time: data.work_time,
        any_driver: data.any_driver,
        is_ot: data.is_ot,
        expect_salary: data.expect_salary,
        start_hiring: data.start_hiring,
        interview_channel: data.interview_channel,
        replacement_guarantee: data.replacement_guarantee,
        request_helper_id: request_helper_result.id,
      };
      await RequestDriver.create(request_driver);
      await newRequestEmail(request_helper, request_driver);
      return request_helper_result.id;
    } else {
      let request_maid = {
        type_of_worker: data.type_of_worker,
        work_type: data.work_type,
        work_day: data.work_day,
        work_day_other: data.work_day_other,
        work_time: data.work_time,
        helper_nationality: data.helper_nationality,
        expect_language: data.expect_language,
        expect_language_other: data.expect_language_other,
        require_cooking: data.require_cooking,
        cooking_type: data.cooking_type,
        any_kid: data.any_kid,
        amount_kid: data.amount_kid,
        age_month: data.age_month,
        age_year: data.age_year,
        any_pet: data.any_pet,
        amount_pet: data.amount_pet,
        type_of_pet: data.type_of_pet,
        amount_current_helper: data.amount_current_helper,
        special_requirement: data.special_requirement,
        request_helper_id: request_helper_result.id,
      };
      await RequestMaid.create(request_maid);
      await newRequestEmail(request_helper, request_maid);
      return request_helper_result.id;
    }
  } catch (e) {
    throw new Error(e.message);
  }
}

async function update(request_helper_id, data) {
  let request_helper = {
    contact_name: data.contact_name,
    phone_number: data.phone_number,
    line_id: data.line_id,
    email: data.email,
    province_id: data.province_id,
    province_name_th: "",
    province_name_en: "",
    district_id: data.district_id,
    district_name_th: "",
    district_name_en: "",
    sub_district_id: data.sub_district_id,
    sub_district_name_th: "",
    sub_district_name_en: "",
    type_of_building: data.type_of_building,
    address_detail: data.address_detail,
    floor: data.floor,
    request_type: data.request_type,
    employer_nationality: data.employer_nationality,
    request_helper_code: data.request_helper_code,
  };
  let province = await Province.findOne({
    where: { id: request_helper.province_id },
  });
  request_helper.province_name_th = province.province_name_th;
  request_helper.province_name_en = province.province_name_en;
  let district = await District.findOne({
    where: { id: request_helper.district_id },
  });
  request_helper.district_name_th = district.district_name_th;
  request_helper.district_name_en = district.district_name_en;
  let sub_district = await SubDistrict.findOne({
    where: { id: request_helper.sub_district_id },
  });
  request_helper.sub_district_name_th = sub_district.sub_district_name_th;
  request_helper.sub_district_name_en = sub_district.sub_district_name_en;
  try {
    await RequestHelper.update(request_helper, {
      where: { id: request_helper_id },
    });
    if (data.request_type == "driver") {
      let request_driver = {
        driving_area: data.driving_area,
        has_car: data.has_car,
        car_type: data.car_type,
        car_type_other: data.car_type_other,
        car_gear_type: data.car_gear_type,
        expect_language: data.expect_language,
        prefer_age_range: data.prefer_age_range,
        work_day: data.work_day,
        work_day_other: data.work_day_other,
        work_time: data.work_time,
        any_driver: data.any_driver,
        is_ot: data.is_ot,
        expect_salary: data.expect_salary,
        start_hiring: data.start_hiring,
        interview_channel: data.interview_channel,
        replacement_guarantee: data.replacement_guarantee,
      };
      await RequestDriver.update(request_driver, {
        where: { request_helper_id },
      });
      return true;
    } else {
      let request_maid = {
        type_of_worker: data.type_of_worker,
        work_type: data.work_type,
        work_day: data.work_day,
        work_day_other: data.work_day_other,
        work_time: data.work_time,
        helper_nationality: data.helper_nationality,
        expect_language: data.expect_language,
        expect_language_other: data.expect_language_other,
        require_cooking: data.require_cooking,
        cooking_type: data.cooking_type,
        any_kid: data.any_kid,
        amount_kid: data.amount_kid,
        age_month: data.age_month,
        age_year: data.age_year,
        any_pet: data.any_pet,
        amount_pet: data.amount_pet,
        type_of_pet: data.type_of_pet,
        amount_current_helper: data.amount_current_helper,
        special_requirement: data.special_requirement,
      };
      await RequestDriver.update(request_maid, {
        where: { request_helper_id },
      });
      return true;
    }
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getDetail(request_helper_id) {
  try {
    const request_helper_result = await RequestHelper.findOne({
      where: { id: request_helper_id },
    });
    let request_helper = {};
    for (let prop in request_helper_result.dataValues) {
      request_helper[prop] = request_helper_result[prop];
    }
    if (request_helper_result.request_type == "driver") {
      const request_driver = await RequestDriver.findOne({
        where: { request_helper_id },
      });
      request_helper.driving_area = request_driver.driving_area;
      request_helper.has_car = request_driver.has_car;
      request_helper.car_type = request_driver.car_type;
      request_helper.car_type_other = request_driver.car_type_other;
      request_helper.car_gear_type = request_driver.car_gear_type;
      request_helper.expect_language = request_driver.expect_language;
      request_helper.prefer_age_range = request_driver.prefer_age_range;
      request_helper.work_day = request_driver.work_day;
      request_helper.work_time = request_driver.work_time;
      request_helper.any_driver = request_driver.any_driver;
      request_helper.is_ot = request_driver.is_ot;
      request_helper.expect_salary = request_driver.expect_salary;
      request_helper.start_hiring = request_driver.start_hiring;
      request_helper.interview_channel = request_driver.interview_channel;
      request_helper.replacement_guarantee =
        request_driver.replacement_guarantee;
      return request_helper;
    } else {
      const request_maid = await RequestMaid.findOne({
        where: { request_helper_id },
      });
      request_helper.type_of_worker = request_maid.type_of_worker;
      request_helper.work_type = request_maid.work_type;
      request_helper.work_day = request_maid.work_day;
      request_helper.work_day_other = request_maid.work_day_other;
      request_helper.work_time = request_maid.work_time;
      request_helper.helper_nationality = request_maid.helper_nationality;
      request_helper.expect_language = request_maid.expect_language;
      request_helper.expect_language_other = request_maid.expect_language_other;
      request_helper.require_cooking = request_maid.require_cooking;
      request_helper.cooking_type = request_maid.cooking_type;
      request_helper.any_kid = request_maid.any_kid;
      request_helper.amount_kid = request_maid.amount_kid;
      request_helper.age_month = request_maid.age_month;
      request_helper.age_year = request_maid.age_year;
      request_helper.any_pet = request_maid.any_pet;
      request_helper.amount_pet = request_maid.amount_pet;
      request_helper.type_of_pet = request_maid.type_of_pet;
      request_helper.amount_current_helper = request_maid.amount_current_helper;
      request_helper.special_requirement = request_maid.special_requirement;
      return request_helper;
    }
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getList(
  filter = null,
  keyword = null,
  page = 0,
  limit = 10,
  sortby = "id",
  ordering = "ASC"
) {
  try {
    page = page - 1;
    let offset = !page ? 0 : limit * page;
    if (offset < 0) offset = 0;
    let fields = {
      [or]: [],
      [and]: [],
    };
    if (filter) {
      Object.keys(filter).forEach((prop) => {
        fields[and].push({ [prop]: filter[prop] });
      });
    }
    if (keyword) {
      field_list = [
        "contact_name",
        "phone_number",
        "line_id",
        "email",
        "province_name_th",
        "province_name_en",
        "district_name_th",
        "district_name_en",
        "sub_district_name_th",
        "sub_district_name_en",
        "request_helper_code",
        "id",
      ];
      field_list.forEach((item) => {
        fields[or].push({
          [item]: {
            [substring]: keyword,
          },
        });
      });
    }
    if (fields[or].length == 0) delete fields[or];
    if (fields[and].length == 0) delete fields[and];
    const list = await RequestHelper.findAll({
      where: fields,
      limit: Number(limit),
      offset: offset,
      order: [[sortby, ordering]],
      include: [{ model: RequestMaid }, { model: RequestDriver }],
    });
    return list;
  } catch (e) {
    console.log(e);
    throw new Error(e.message);
  }
}

async function getHistory(customer_id, page) {
  try {
    page = page - 1;
    const limit = 10;
    let offset = !page ? 0 : limit * page;
    if (offset < 0) offset = 0;
    const sortby = "id";
    const ordering = "DESC";
    const list = await RequestHelper.findAll({
      where: { customer_id },
      limit: Number(limit),
      offset: offset,
      order: [[sortby, ordering]],
      include: [{ model: RequestMaid }, { model: RequestDriver }],
    });
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function getCountHistory(customer_id) {
  try {
    const count = await RequestHelper.count({
      where: { customer_id },
      include: [{ model: RequestMaid }, { model: RequestDriver }],
    });
    return count;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function count(filter = null, keyword = null) {
  try {
    let fields = {
      [or]: [],
      [and]: [],
    };
    if (filter) {
      Object.keys(filter).forEach((prop) => {
        fields[and].push({ [prop]: filter[prop] });
      });
    }
    if (keyword) {
      field_list = [
        "contact_name",
        "phone_number",
        "line_id",
        "email",
        "province_name_th",
        "province_name_en",
        "district_name_th",
        "district_name_en",
        "sub_district_name_th",
        "sub_district_name_en",
        "request_helper_code",
        "id",
      ];
      field_list.forEach((item) => {
        fields[or].push({
          [item]: {
            [substring]: keyword,
          },
        });
      });
    }
    if (fields[or].length == 0) delete fields[or];
    if (fields[and].length == 0) delete fields[and];
    const list = await RequestHelper.count({
      where: fields,
    });
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function remove(request_helper_id) {
  try {
    await RequestHelper.destroy({ where: { id: request_helper_id } });
    await RequestDriver.destroy({ where: { request_helper_id } });
    await RequestMaid.destroy({ where: { request_helper_id } });
    return true;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function countRequestStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "Maid",
      "Elder Care",
      "Nanny",
      "Cook",
      "Pet",
      "Restaurant",
      "Driver",
    ];
    let field_list = ["type_of_worker", "createdAt"];
    for (let i = 0; i < lst_type.length - 1; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == "Pet" ? "Pet Care" : lst_type[i];
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    fields = {
      [and]: [],
    };
    fields[and].push({
      [field_list[1]]: {
        [between]: [start_date, end_date],
      },
    });
    let object = { type: "", number: 0 };
    object.type = lst_type[lst_type.length - 1];
    object.number = await RequestDriver.count({ where: fields });
    list.push(object);
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestScheduleStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "Full-time and live-in",
      "Full-time and live-out",
      "Part-time",
    ];
    let field_list = ["work_type", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [eq]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestNationalStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = ["Philippine", "Lao", "Any", "Thai", "Myanmar"];
    let field_list = ["helper_nationality", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDayStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "Monday - Friday",
      "Monday - Saturday",
      "Monday - Wednesday",
      "Tuesday - Thursday",
      "Monday & Friday",
      "Other",
    ];
    let field_list = ["work_day", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestLanguageStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = ["Speak Thai", "Speak English", "Other"];
    let field_list = ["expect_language", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverLanguageStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = ["Speak Thai", "Speak English", "Speak little English"];
    let field_list = ["expect_language", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverAgeStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "20-30 years old",
      "30-40 years old",
      "40-50 years old",
      "Any",
    ];

    let field_list = ["prefer_age_range", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverScheduleStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "Monday",
      "Tuesday",
      "Wednesaday",
      "Thurday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    let field_list = ["work_day", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == "Wednesaday" ? "Wednesday" : lst_type[i] == "Thurday" ? "Thursday" : lst_type[i];;

      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriveSalaryStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "15000 to 18000 Baht",
      "18000 to 20000 Baht",
      "20000 Baht up",
      "Any",
    ];
    let field_list = ["expect_salary", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverHiringStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "In 1 to 3 days",
      "In 7 days",
      "In 14 days",
      "After 14 days",
    ];
    let field_list = ["start_hiring", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverInterviewStatistics(start_date, end_date) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "Home Inverview",
      "Online Interview",
      "Office Interview",
      "Try-Out",
    ];
    let field_list = ["interview_channel", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriveReplacementGuaranteeStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      "3 months 3 times replacement",
      "6 months 6 times replacement",
      "1 year 12 times replacement",
    ];
    let field_list = ["replacement_guarantee", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}

async function countRequestCookingStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      1,
      0,];
    let field_list = ["require_cooking", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == 1 ? "Yes" : "No";
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequesKidStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      1, 0
    ];
    let field_list = ["any_kid", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == 1 ? "Yes" : "No";
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequesPetStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      1, 0
    ];
    let field_list = ["any_pet", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == 1 ? "Yes" : "No";
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequesCurrentHelperStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      0, 1, 2, 3, 4, 5, 6
    ];
    let field_list = ["amount_current_helper", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i];
      object.number = await RequestMaid.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverOwnCarStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      1, 0
    ];
    let field_list = ["has_car", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == 1 ? "Yes" : "No";
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverCurrentDriverStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      1, 0
    ];
    let field_list = ["any_driver", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == 1 ? "Yes" : "No";
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
async function countRequestDriverIsOTStatistics(
  start_date,
  end_date
) {
  try {
    start_date = new Date(start_date);
    end_date = new Date(end_date);
    end_date = end_date.setDate(end_date.getDate() + 1);

    let list = [];
    let lst_type = [
      1, 0
    ];
    let field_list = ["is_ot", "createdAt"];
    for (let i = 0; i < lst_type.length; i++) {
      let fields = {
        [and]: [],
      };
      fields[and].push({
        [field_list[0]]: {
          [substring]: lst_type[i],
        },
      });
      fields[and].push({
        [field_list[1]]: {
          [between]: [start_date, end_date],
        },
      });
      let object = { type: "", number: 0 };
      object.type = lst_type[i] == 1 ? "Yes" : "No";
      object.number = await RequestDriver.count({ where: fields });
      list.push(object);
    }
    return list;
  } catch (e) {
    throw new Error(e.message);
  }
}
module.exports = {
  create,
  update,
  getDetail,
  getList,
  getHistory,
  getCountHistory,
  remove,
  count,
  countRequestStatistics,
  countRequestScheduleStatistics,
  countRequestNationalStatistics,
  countRequestDayStatistics,
  countRequestLanguageStatistics,
  countRequestDriverLanguageStatistics,
  countRequestDriverAgeStatistics,
  countRequestDriverScheduleStatistics,
  countRequestDriveSalaryStatistics,
  countRequestDriverHiringStatistics,
  countRequestDriverInterviewStatistics,
  countRequestDriveReplacementGuaranteeStatistics,
  countRequestCookingStatistics,
  countRequesKidStatistics,
  countRequesPetStatistics,
  countRequesCurrentHelperStatistics,
  countRequestDriverOwnCarStatistics,
  countRequestDriverCurrentDriverStatistics,
  countRequestDriverIsOTStatistics
};
