var Promise = require('bluebird');
var mysql = require('mysql');
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

function MySQLService(sails) {
  // return this;
}

var pool = mysql.createPool(sails.config.connections[sails.config.models.connection]);

MySQLService.prototype.QUERY = function QUERY (query, data) {
	data = data ? data: [];

	return pool.getConnectionAsync().then(function (connection) {
		return connection.queryAsync(query, data).then(function (results, fields) {
      connection.release();
			return Promise.resolve(results, fields);
		}).finally(function () {
    })
    .catch(function (error) {
      console.log('ERRO')
      sails.log.error(`Erro queryAsync() :: ${query} :: ${data}`, error);
      return Promise.reject(error);
    });
	})
  .catch(function (error) {
    sails.log.error(`Erro getConnectionAsync() :: ${query} :: ${data}`)
    return Promise.reject(error);
  });
}

MySQLService.prototype.columnExists = function columnExists(deprecation, cb) {
	let sql = "SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?";
	let {table, column, removedAt} = deprecation;
  let currentSchema = sails.config.connections[sails.config.models.connection].database;
	return this.QUERY(sql, [currentSchema, table, column]).then(function getResults(results) {
		sails.log.debug(`Verificando a coluna ${column} na tabela ${currentSchema}.${table} - Resultado: ${results.length}`);
		if(!results.length && removedAt) {
			// sails.log.warn(`A coluna ${column} na tabela ${currentSchema}.${table} foi depreciada em ${removedAt} e pode ser removida do arquivo deprecations/columns.js`);
		}
		return Promise.resolve(results.length ? true: false);
	}).catch(function (error) {
    return Promise.reject(error);
  })
}

MySQLService.prototype.registerMigration = function () {

}

module.exports = MySQLService;
