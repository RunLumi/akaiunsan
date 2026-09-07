import sharp from 'sharp';
import { imageSize } from 'image-size';
import moment from 'moment';
import * as cheerio from 'cheerio';
import rssConverter from 'rss-converter';
import fs from 'fs';
import { Banner, BannerLanguage, ErrorLog } from '../models/index.ts';
let error_status = 500;
let error_message = 'Unexpected error';
const NODE_ENV = process.env.NODE_ENV || 'local';
const config = JSON.parse(fs.readFileSync(`config/${NODE_ENV}.json`, 'utf8'));
const IMAGE_BASE_URL = config.image_base_url;

async function update (req, res) {
  try {
    let { banner_list = [], remove_banner_list = [], remove_banner_language_list = [] } = req.body;
    for (let item of remove_banner_list) {
      await Banner.destroy({ where: { id: item }})
    }
    for (let item of remove_banner_language_list) {
      await BannerLanguage.destroy({ where: { id: item }})
    }
    for (let [index, item] of banner_list.entries()) {
      let banner_id = item.id;
      if (banner_id) {
        await Banner.update({
          active: item.active,
          link: item.link,
          title: item.title,
          image_url: item.image_url,
          mobile_image_url: item.mobile_image_url,
          start_date: item.start_date,
          end_date: item.end_date,
          ordering: index
        }, { where: { id: item.id }});
      } else {
        const banner = await Banner.create({
          active: item.active,
          link: item.link,
          title: item.title,
          image_url: item.image_url,
          mobile_image_url: item.mobile_image_url,
          start_date: item.start_date,
          end_date: item.end_date,
          ordering: index
        })
        banner_id = banner.id;
      }
      if (item.banner_language || item.banner_language.length > 0) {
        for (let banner_lang of item.banner_language) {
          if (banner_lang.id) {
            await BannerLanguage.update({
              link: banner_lang.link,
              title: banner_lang.title,
              image_url: banner_lang.image_url,
              mobile_image_url: banner_lang.mobile_image_url,
              lang_code: banner_lang.lang_code,
              banner_id: banner_id
            }, { where: { id: banner_lang.id }});
          } else {
            await BannerLanguage.create({
              link: banner_lang.link,
              title: banner_lang.title,
              image_url: banner_lang.image_url,
              mobile_image_url: banner_lang.mobile_image_url,
              lang_code: banner_lang.lang_code,
              banner_id: banner_id
            })
          }
        }
      }
    }
    return res.status(200).json(true);
  } catch (err) {
    // console.log(err)
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'banner.controller.update', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getDisplay (req, res) {
  
  try {
    const lang_code = req.params.lang_code ? req.params.lang_code.toUpperCase() : null;
    const list = await Banner.findAll({ where: { active: true }, order: [['ordering', 'ASC']], include: [{ model: BannerLanguage }] });
    let banner_list = [];
    let current_time = new Date();
    const today_array = current_time.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }).split(',')[0].split('/');
    let today = today_array[2] + '-';
    today += `0${today_array[0]}`.slice(-2) + '-';
    today += `0${today_array[1]}`.slice(-2);
    list.forEach(element => {
      if (!element.image_url || !element.mobile_image_url)
        return;
      if (element.start_date) {
        const compare_start_date = moment(today).isBefore(element.start_date);
        if (compare_start_date)
          return;
      }
      if (element.end_date) {
        const compare_end_date = moment(today).isAfter(element.end_date);
        if (compare_end_date)
          return;
      }
      let image_url = element.image_url;
      let mobile_image_url = element.mobile_image_url;
      if (element.BannerLanguages || element.BannerLanguages.length > 0) {
        element.BannerLanguages.forEach(banner_lang => {
          if (banner_lang.lang_code == lang_code) {
            image_url = banner_lang.image_url
            mobile_image_url = banner_lang.mobile_image_url
          }
        });
      }
      banner_list.push({
        title: element.title,
        link: element.link,
        image_url: `${IMAGE_BASE_URL}banners/${image_url}`,
        mobile_image_url: `${IMAGE_BASE_URL}banners/${mobile_image_url}`
      });
    });
    return res.status(200).json(banner_list);
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'banner.controller.getDisplay', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getList (req, res) {
  try {
    const list = await Banner.findAll({ order: [['ordering', 'ASC']], include: [{ model: BannerLanguage }] });
    let banner_list = [];
    for (let item of list) {
      let banner_lang_list = [];
      item.BannerLanguages.forEach(banner_lang => {
        banner_lang_list.push({
          id: banner_lang.id,
          lang_code: banner_lang.lang_code,
          link: banner_lang.link,
          title: banner_lang.title,
          image_url: banner_lang.image_url,
          mobile_image_url: banner_lang.mobile_image_url,
        })
      })
      banner_list.push({
        id: item.id,
        active: item.active,
        link: item.link,
        title: item.title,
        image_url: item.image_url,
        mobile_image_url: item.mobile_image_url,
        start_date: item.start_date,
        end_date: item.end_date,
        banner_lang_list: banner_lang_list
      })
    }
    return res.status(200).json(banner_list);
  } catch (err) {
    // console.log(error);
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'banner.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function uploadImage (req, res) {
  try {
    if (req.file) {
      return res.status(200).json(`${req.file.filename}`);
    } else
      throw { message: 'No file uploaded' }
  } catch (err) {
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'banner.controller.uploadImage', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

export { getList, getDisplay, update, uploadImage };
const defaultExport = { getList, getDisplay, update, uploadImage };
export default defaultExport;