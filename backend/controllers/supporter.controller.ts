import sharp from 'sharp';
import { imageSize } from 'image-size';
import moment from 'moment';
import * as cheerio from 'cheerio';
import rssConverter from 'rss-converter';
import { Supporter, SupporterExperience, SupporterSkill, SupporterEducation, SupporterLanguage, ImportData, ErrorLog } from '../models/index.ts';
import * as supporter from '../helpers/supporter.helper.ts';
import { json2csv, writeCsvFile } from '../helpers/util.ts';
import { getSuppoterFromAgency, getSkillFromAgency, getExperienceFromAgency,getDriver, getDriverSkill, getDriverExperience } from '../helpers/agencyData.ts';
import fs from 'fs';
import imageDownloader from 'image-downloader';
import { Op } from 'sequelize';
const { substring, and, or, not, eq, ne, gte, lte } = (Op as any);

let error_status = 500;
let error_message = 'Unexpected error';

async function create (req, res) {
  try {
    let data = req.body;
    await supporter.create(data);
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.create', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function update (req, res) {
  try {
    let { supporter_id } = req.params;
    let data = req.body;
    await supporter.update(supporter_id, data)
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDetail (req, res) {
  try {
    let { supporter_id } = req.params;
    const supporter_result = await supporter.getDetail(supporter_id);
    return res.status(200).json(supporter_result);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getPublicDetail (req, res) {
  try {
    let { supporter_id } = req.params;
    const supporter_result = await supporter.getPublicDetail(supporter_id);
    await supporter.increaseViewCount(supporter_id);
    return res.status(200).json(supporter_result);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getPublicDetail', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getPublicList (req, res) {
  try {
    const list = await supporter.getPublicList(req.query);
    return res.status(200).json(list);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getPublicList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    let { page = 0, limit = 10, sortby = 'id', ordering = 'ASC' } = req.query;
    let { filter, keyword } = req.query;
    const list = await supporter.getList(page, limit, sortby, ordering, filter, keyword);
    return res.status(200).json(list);
  } catch (err) {
    // console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getPublicCount (req, res) {
  try {
    const count = await supporter.getPublicCount(req.query);
    return res.status(200).json(count);
  } catch (err) {
    // console.log(error);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getPublicCount', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function count (req, res) {
  try {
    let { filter, keyword } = req.query;
    const count = await supporter.count(filter, keyword);
    return res.status(200).json(count);
  } catch (err) {
    // console.log(error);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.count', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function remove (req, res) {
  try {
    let { supporter_id } = req.params;
    await supporter.remove(supporter_id);
    return res.status(200).json(true);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.remove', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function uploadProfile (req, res) {
  try {
    if (req.file) {
      
      let image_file = `./uploads/supporters/${req.file.filename}`;
      var dimensions = imageSize(fs.readFileSync(image_file));
      let image_width = dimensions.width;
      let image_height = dimensions.height;

      

      if (image_width == image_height) {
        return res.status(200).json({
          width: image_width,
          height: image_height,
          file_name: req.file.filename
        });
      } else if (image_width > image_height) {
        let width = Math.round(image_height);
        let height = Math.round(image_height);
        let left = Math.round(image_width / 4);
        if ((left + width) > image_width) {
          left = Math.round((image_width - width) / 2);
        }

        let originalImage = image_file;
        let outputImage = `./uploads/supporters/crop_${req.file.filename}`;

        await sharp(originalImage).extract({ width: width, height: height, left: left, top: 0 }).toFile(outputImage);
        fs.unlinkSync(`uploads/supporters/${req.file.filename}`);

        return res.status(200).json({
          width: width,
          height: height,
          file_name: `crop_${req.file.filename}`
        });
      } else {
        let width = Math.round(image_width);
        let height = Math.round(image_width);

        let originalImage = image_file;
        let outputImage = `./uploads/supporters/crop_${req.file.filename}`;

        await sharp(originalImage).extract({ width: width, height: height, left: 0, top: 0 }).toFile(outputImage);
        fs.unlinkSync(`uploads/supporters/${req.file.filename}`);

        return res.status(200).json({
          width: width,
          height: height,
          file_name: `crop_${req.file.filename}`
        });
      }
    } else
      throw { message: 'No file uploaded' }
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.uploadProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function removeProfile (req, res) {
  try {
    let { profile_image } = req.params;
    fs.unlinkSync(`uploads/supporters/${profile_image}`);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.removeProfile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function exportFile (req, res) {
  try {
    const list = await Supporter.findAll();
    let headers = [];
    if (!list.length)
      throw { message: 'No data to export.' };
    for (let prop in list[0].dataValues) {
      headers.push(prop);
    }
    const result = await json2csv(headers, list);
    let today = new Date();
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let filename = `supporters_${today.getDate()}-${months[today.getMonth()]}-${today.getFullYear()}_${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
    await writeCsvFile(filename, result);
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.exportFile', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getOldSupporterData (req, res) {
  try {
    const maid_data = await ImportData.findOne({ where: { id: 1 }});
    let startId = 1;
    let maxId = 17329;
    if (maid_data && maid_data.latest_maid_id) {
      startId = (maid_data.latest_maid_id > 0) ? maid_data.latest_maid_id - 500 : 1;
      maxId = maid_data.latest_maid_id;
    }
    const supporter_list = await getSuppoterFromAgency(startId, maxId);
    let latest_maid_id = 0;
    for (let supporter of supporter_list) {
      const result = await Supporter.findOrCreate({
        where: {
          maid_id: supporter.maid_id
        },
        defaults: supporter
      });
      latest_maid_id = supporter.maid_id;
      await Supporter.update(supporter, { where: { maid_id: supporter.maid_id }});
      await SupporterExperience.destroy({ where: { supporter_id: result[0].id }});
      await SupporterSkill.destroy({ where: { supporter_id: result[0].id }});
      await SupporterLanguage.destroy({ where: { supporter_id: result[0].id }});
    };
    const { skills, languages } = await getSkillFromAgency(startId, maxId);
    const experiences = await getExperienceFromAgency(startId, maxId);
    await SupporterSkill.bulkCreate(skills);
    await SupporterLanguage.bulkCreate(languages);
    await SupporterExperience.bulkCreate(experiences);
    await ImportData.findOrCreate({ where: { id: 1 }, defaults: { latest_maid_id }});
    await ImportData.update({ latest_maid_id: (maxId-500) }, { where: { id: 1 }});
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getOldSupporterData', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getOldDriverData (req, res) {
  try {
    const supporter_list = await getDriver();
    supporter_list.forEach(async supporter => {
      await Supporter.create(supporter);
    });
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getOldSupporterData', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getOldDriverSkillData (req, res) {
  try {
    const driver_skill_list = await getDriverSkill();
    driver_skill_list.forEach(async language => {
      try {
        const result = await SupporterLanguage.create(language);
        console.log('result:', result)
      } catch (err) {
        //do nth
      }
    });
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getOldDriverSkillData', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getOldDriverExperienceData (req, res) {
  try {
    const driver_experience_list = await getDriverExperience();
    driver_experience_list.forEach(async experience => {
      try {
        await SupporterExperience.create(experience);
      } catch (err) {
        //do nth
      }
    });
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getOldDriverExperienceData', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function matchDriverId (req, res) {
  try {
    const drivers = await Supporter.findAll({ where: { [not]: { driver_id: null } }});
    const driver_languages = await SupporterLanguage.findAll({ where: { [not]: { driver_id: null }}});
    const driver_experiences = await SupporterExperience.findAll({ where: { [not]: { driver_id: null }}});
    for (let driver of drivers) {
      driver_languages.filter(async language => {
        if (language.driver_id == driver.driver_id) {
          language.supporter_id = driver.id;
          await language.save();
        }
      });
      driver_experiences.filter(async experience => {
        if (experience.driver_id == driver.driver_id) {
          experience.supporter_id = driver.id;
          await experience.save();
        }
      });
    }
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.getOldDriverExperienceData', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function matchAgencyProfileImage (req, res) {
  try {
    const agency = await Supporter.findAll({ where: { maid_id: { [not]: null } }});
    agency.forEach(async (maid) => {
      let profile_image_url = `/uploads/supporters/0000000000${maid.maid_id}`;
      maid.profile_image_url = `${profile_image_url.slice(-11)}/1.jpg`;
      await maid.save();
    })
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.matchAgencyProfileImage', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function matchDriverProfileImage (req, res) {
  try {
    const drivers = await Supporter.findAll({ where: { driver_id: { [not]: null } }});
    for (let driver of drivers) {
      let profile_url = `0000000000${driver.driver_id}`;
      profile_url = profile_url.slice(-11);
      let origin_file_url = `https://www.akaiunsan-driver.com/profilepicture/${profile_url}/1.jpg`;
      let new_profile_url = `./uploads/supporters/drivers/${profile_url}.jpg`;
      let destination_url = './uploads/supporters/drivers/';
      let file_name = `${profile_url}.jpg`;

      let options = {
        url: origin_file_url,
        dest: destination_url,         // will be saved to /path/to/dest/photo
        extractFilename: false
      }
      await new Promise((resolve, reject) => {
        imageDownloader.image(options)
        .then(({ filename: file_name }) => {
          console.log('Saved to', file_name)  // saved to /path/to/dest/photo
          resolve(true);
        })
        .catch((err) => {
          console.log(err)
          reject(err)
        });
      })
    }

    // drivers.forEach((driver) => {
    //   let profile_url = `0000000000${driver.driver_id}`;
    //   profile_url = profile_url.slice(-11);
    //   let origin_file_url = `https://www.akaiunsan-driver.com/profilepicture/${profile_url}/1.jpg`;
    //   let new_profile_url = `./uploads/supporters/drivers/${profile_url}.jpg`;
    //   let destination_url = './uploads/supporters/drivers/';
    //   let file_name = `${profile_url}.jpg`;

    //   let options = {
    //     url: origin_file_url,
    //     dest: destination_url,         // will be saved to /path/to/dest/photo
    //     extractFilename: false
    //   }
    //   imageDownloader.image(options)
    //     .then(({ filename: file_name }) => {
    //       console.log('Saved to', file_name)  // saved to /path/to/dest/photo
    //     })
    //     .catch((err) => { throw err; });
    // })
    return res.status(200).json(true);
  } catch (err) {
    console.log(err);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'supporter.controller.matchDriverProfileImage', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getPublicDetail, getDetail, getPublicList, getList, create, update, remove, getPublicCount, count, uploadProfile, removeProfile, exportFile, getOldSupporterData, getOldDriverData, getOldDriverSkillData, getOldDriverExperienceData, matchDriverId, matchAgencyProfileImage, matchDriverProfileImage };
const defaultExport = { getPublicDetail, getDetail, getPublicList, getList, create, update, remove, getPublicCount, count, uploadProfile, removeProfile, exportFile, getOldSupporterData, getOldDriverData, getOldDriverSkillData, getOldDriverExperienceData, matchDriverId, matchAgencyProfileImage, matchDriverProfileImage };
export default defaultExport;