const NODE_ENV = process.env.NODE_ENV || 'local';
const config = require(`../config/${NODE_ENV}.json`);
const Sequelize = require('sequelize');
const fs = require('fs');
const relations = require('./relations.ts');

const db: any = {};

let sequelize_config;

if (NODE_ENV == 'production') {
  sequelize_config = {
    host: config["db-connection"].host,
    dialect: "mysql",
    pool: {
      max: 50,
      min: 0,
      acquire: 1000000,
      idle: 200000
    },
    dialectOptions: {
      socketPath: "/var/run/mysqld/mysqld.sock"
    },
    logging: false
  }
} else {
  sequelize_config = {
    host: config["db-connection"].host,
    dialect: "mysql",
    pool: {
      // Tests hit endpoints that leak transactions (pinned bugs like
      // job.createReview never committing); a larger pool keeps the suite
      // from starving while those connections drain on teardown.
      max: NODE_ENV === 'test' ? 40 : 5,
      min: 0,
      acquire: 30000,
      idle: 60000
    },
    logging: false,
    port: config["db-connection"].port,
  }
}

const sequelize = new Sequelize(
  config["db-connection"].database,
  config["db-connection"].user,
  config["db-connection"].password,
  sequelize_config
)

db.Sequelize = Sequelize;
db.sequelize = sequelize;

fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf(".") !== 0)
      && !["index.ts", "index.js", "relations.ts", "relations.js"].includes(file)
      && (file.endsWith('.ts') || file.endsWith('.js'));
  })
  .forEach(file => {
    let modelName = file.replace(/\.(ts|js)$/, '');
    db[modelName] = require(`./${file}`)(sequelize, Sequelize);
  });

  relations(db);

module.exports = db;