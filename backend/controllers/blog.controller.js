const { ErrorLog } = require('../models');
let error_status = 500;
let error_message = 'Unexpected error';
const BLOG_URL = 'https://blog.ayasan-service.com/'
const BLOG_RSS_URL = 'https://blog.ayasan-service.com/feed/?paged=';
const BLOG_RSS_SEARCH_URL = 'https://blog.ayasan-service.com/?feed=rss2';
const scrape = require('html-metadata');
const request = require('request');

async function getList (req, res) {
  try {
    const rssConverter = require('rss-converter');
    let { page = 1 } = req.query;
    let feed = await rssConverter.toJson(`${BLOG_RSS_URL}${page}`);

    let blog_list = []
    feed.items.forEach(item => {
      blog_list.push({
        title: item.title,
        link: item.link.replace('https://ayasansite.wordpress.com/', '/blog/detail/'),
        guid: item.guid.replace('https://ayasansite.wordpress.com/', ''),
        author: item.dc_author,
        date: item.pubDate,
        description: item.description,
        image_url: item.media_thumbnail_url,
      })
    });

    return res.status(200).json(blog_list);
  } catch (err) {
   
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'blog.controller.getList', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getContent (req, res) {
  try {
    let { content_url, guid } = req.body;

    var options =  {
      url: `${BLOG_URL}?p=${guid}`,
      jar: request.jar(), // Cookie jar
      headers: {
        'User-Agent': 'webscraper'
      }
    };
    const meta_data = await scrape(options);

    let result = await new Promise((resolve, reject) => {
      request(`${BLOG_URL}?p=${guid}`, function (error, response, body) {
        if (error || (response && response.statusCode != 200)) {
          reject({ message: 'Request blog error' })
        } else {
          resolve(body)
        }
      });
    })

    const cheerio = require('cheerio');
    let $ = cheerio.load(result);

    let blog_content = $('.entry-content').html();
    $ = cheerio.load(blog_content);
    $('div').remove();
    $('script').remove();
    blog_content = $.html();
    blog_content = blog_content.replace('<html><head></head><body>', '')
    blog_content = blog_content.replace('</body></html>', '')

    let data = {
      metadata: {
        title: meta_data.general.title,
        description: meta_data.general.description,
        image: {
          url: meta_data.openGraph.image.url,
          width: meta_data.openGraph.image.width,
          height: meta_data.openGraph.image.height,
          twitter: meta_data.twitter.image
        }
      },
      content: blog_content
    }

    return res.status(200).json(data);
  } catch (err) {
    // console.log(err)
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'blog.controller.getContent', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

async function getSearch (req, res) {
  try {
    const rssConverter = require('rss-converter');
    let { page = 1, keyword = '' } = req.query;
    console.log(keyword)
    let feed = await rssConverter.toJson(`${BLOG_RSS_SEARCH_URL}&s=${keyword}&paged=${page}`);

    let blog_list = []
    feed.items.forEach(item => {
      blog_list.push({
        title: item.title,
        link: item.link.replace('https://ayasansite.wordpress.com/', '/blog/detail/'),
        guid: item.guid.replace('http://ayasansite.wordpress.com/', ''),
        author: item.dc_author,
        date: item.pubDate,
        description: item.description,
        image_url: item.media_thumbnail_url,
      })
    });

    return res.status(200).json(blog_list);
  } catch (err) {
    console.log(err)
    err.message ? error_message = err.message : error_message;
    typeof err == 'string' ? error_message = err : error_message;
    await ErrorLog.create({ location: 'blog.controller.getSearch', message: error_message });
    return res.status(error_status).json({ message: error_message });
  }
}

module.exports = {
  getList,
  getContent,
  getSearch
}