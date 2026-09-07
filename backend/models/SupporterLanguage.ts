export default (sequelize, DataTypes) => {
  const SupporterLanguage = sequelize.define('SupporterLanguage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    language: {
      type: DataTypes.STRING
    },
    speak_level: {
      type: DataTypes.STRING
    },
    read_level: {
      type: DataTypes.STRING
    },
    write_level: {
      type: DataTypes.STRING
    },
    level: {
      type: DataTypes.STRING
    },
    driver_id: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'supporter_language'
  });
  return SupporterLanguage;
}