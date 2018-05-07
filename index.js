var path              = require("path");
var print             = require('print-message');
var deprecatedColumns = require(path.resolve('deprecations/columns'));
var MySQLService      = require('./lib/service/mysql-service');
var Utils             = require('./lib/utils');
const chalk           = require('chalk');

var log = sails.log;

module.exports = function myHook(sails) {

   return {
     configure: () => {
       print(['SCHEMA DEPRECATIONS']);
       checkForDeprecatedColumns();
     }
   };

   function checkForDeprecatedColumns() {
     let MySQL = new MySQLService(sails);
     let currentSchema = Utils.getCurrentSchema(sails);

     let deprecationsCheck = deprecatedColumns.map(function (deprecation) {
       return function(next) {
         return MySQL.columnExists(deprecation).then(function (result) {
           deprecation.confirmed = result;
           next(null, deprecation);
           return result;
         })
         .catch(function (err) {
           return next(err);
         });
       }
     });

     async.series(deprecationsCheck, function (error, results) {
       if(!results.length) {
         return;
         log.info(chalk.green.bold('No deprecations found for this columns'));
       }
       log.info(chalk.green.bold(':: Found ' + results.length + ' deprecated columns\n'));
       results.forEach((deprecation) => {

         let {table, column, message, removedAt} = deprecation;

         if(deprecation.confirmed) {
           print([ 'TABLE \t\t:: ' + table, 'COLUMN \t:: ' + column, 'MESSAGE \t:: ' + message], {border: false, marginBottom: 1, color: 'yellow'});
         } else {
           if(deprecation.removedAt) {
             sails.log.warn(`A coluna ${column} na tabela ${currentSchema}.${table} foi depreciada em ${removedAt} e pode ser removida do arquivo deprecations/columns.js`);
           } else {
             sails.log.warn(`A coluna ${column} na tabela ${currentSchema}.${table} foi depreciada, porém não há registro da data de remoção no arquivo deprecations/columns.js`);
           }
         }
       });
     });
   }

};
