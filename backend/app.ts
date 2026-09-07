import express from 'express';
import cors from 'cors';
import db from './models/index.ts';
import registerRoutes from './routes/index.ts';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

db.sequelize.sync();

registerRoutes(app);

// Test harnesses (supertest) import the app without binding a port; pm2 and
// local dev still run the entry and expect it to listen. In ESM there is no
// require.main — detect direct execution via the executed argv path.
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
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

export default app;
