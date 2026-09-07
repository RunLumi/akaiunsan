const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

const cors = require('cors');
app.use(cors());

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = require('./models');
db.sequelize.sync();

require('./routes/index')(app);

// Test harnesses (supertest) import the app without binding a port; pm2 and
// local dev still run `node app.js` and expect it to listen.
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log('================================================');
    console.log(' .d88b. 888d888 8888b. 88888b.  .d88b.  .d88b.  ');
    console.log('d88""88b888P"      "88b888 "88bd88P"88bd8P  Y8b ');
    console.log('888  888888    .d888888888  888888  88888888888 ');
    console.log('Y88..88P888    888  888888  888Y88b 888Y8b.     ');
    console.log(' "Y88P" 888    "Y888888888  888 "Y88888 "Y8888  ');
    console.log('                                    888         ');
    console.log('                               Y8b d88P         ');
    console.log('                                "Y88P"          ');
    console.log('================================================');
    let current_date = new Date();
    console.log('run datetime:', current_date);
    console.log('port:', PORT);
    console.log('env:', process.env.NODE_ENV);
    console.log('================================================');
  });
}

module.exports = app;