var path              = require("path");
var printMessage      = require('print-message');
var deprecatedColumns = require(path.resolve('deprecations/columns'));
var MySQLService = require('./utils/mysql-service');

module.exports = function myHook(sails) {

   return {
     configure: () => {
       checkForDeprecatedColumns();
     }
   };

   function checkForDeprecatedColumns() {
     var MySQL = new MySQLService(sails);

     var deprecationsCheck = deprecatedColumns.map(function (deprecation) {
       return function(next) {
         return MySQL.columnExists(deprecation).then(function (result) {
           if(result) {
             deprecation.confirmed = true;
           }
           next(null, deprecation);
           return result;
         })
         .catch(function (err) {
           console.log('catch MySQL.columnExists', err);
           return next(err);
         });
       }
     });

     async.series(deprecationsCheck, function (error, results) {
       results = results.filter( (result) => result.confirmed );

       if(!results.length) {
         return;
       }

       printMessage(['SCHEMA DEPRECATIONS :: :: ' + results.length]);

       results.forEach((deprecation) => {
         printMessage([ 'TABLE :: ' + deprecation.table, 'COLUMN :: ' + deprecation.column, 'MESSAGE :: ' + deprecation.message], {border: false, marginBottom: 1, color: 'yellow'});
       });
     });
   }

};
