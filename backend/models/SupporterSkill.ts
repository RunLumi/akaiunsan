module.exports = (sequelize, DataTypes) => {
  const SupporterSkill = sequelize.define('SupporterSkill', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    skill: {
      type: DataTypes.STRING
    },
    level: {
      type: DataTypes.STRING
    },
    driver_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'supporter_skill'
  });

  return SupporterSkill;
}