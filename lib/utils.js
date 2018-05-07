
function getCurrentMySQLConnection(sails) {
  return sails.config.connections[sails.config.models.connection];
}
function getCurrentSchema (sails) {
  return this.getCurrentMySQLConnection(sails).database;
}

module.exports = {getCurrentSchema, getCurrentMySQLConnection};
