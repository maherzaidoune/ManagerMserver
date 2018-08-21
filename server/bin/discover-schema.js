/*
 * Discovers a table schema and outputs it into a file: run this script via:
 * $ node discover-schema.js
 */

var path = require('path');
var fs = require('fs');
var app = require('loopback');
var output_directory = path.resolve(__dirname, '..', '..', 'common', 'models');

function callback(err, schema) {
  if (err) {
    console.error(err);
    return;
  }
  if (typeof schema != 'object') {
    throw 'schema object not defined';
  }
  console.log("Auto discovery for schema " + schema.name);
  /*
  * Convert schema name from CamelCase to dashed lowercase (loopback format 
  * for json files describing models), for example: CamelCase -> camel-case.
  */
  //var model_name = schema.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  var model_name = mapName(null, schema.name);

  console.log('Writing model JSON file..');
  // write model definition JSON file
  var now_ms = Date.now();
  var model_JSON_file = path.join(output_directory, model_name + '.json');
  // if JSON file exists
  if (fs.existsSync(model_JSON_file)) {
    // save a backup copy of the JSON file
    let bkp_file = path.join(output_directory, model_name + ".json" + '.bkp_' + now_ms);
    fs.renameSync(model_JSON_file, bkp_file);
    console.log("Backing up old JSON file..");
  }
  // write the new JSON file
  fs.writeFileSync(
    model_JSON_file,
    JSON.stringify(schema, null, 2)
  );
  console.log("JSON saved to " + model_JSON_file);

  console.log('Writing model JS file..');
  // write model JS file, useful to extend a model with custom methods
  var model_JS_file = path.join(output_directory, model_name + '.js');
  // if JS file exists
  if (fs.existsSync(model_JS_file)) {
    // save a backup copy of the JS file
    let bkp_file = path.join(output_directory, model_name + ".js" + '.bkp_' + now_ms)
    fs.renameSync(model_JS_file, bkp_file);
    console.log("Backing up old JS file..");
  }
  // write the new JS file
  fs.writeFileSync(
    model_JS_file,
    "'use strict';module.exports=function(" + model_name + ") {};"
  );
  console.log("JSON saved to " + model_JSON_file);

  // Append model to model-config.json
  var model_config_file = path.resolve(__dirname, '../model-config.json');
  var model_config_obj = JSON.parse(fs.readFileSync(model_config_file, 'utf8'));
  if (typeof model_config_obj[model_name] === 'undefined') {
    let datasource = process.argv[3];
    model_config_obj[model_name] = { 'dataSource': datasource, 'public': false };
    let json_content = JSON.stringify(model_config_obj, null, 2);
    fs.writeFileSync(model_config_file, JSON.stringify(model_config_obj, null, 2));
  }
}

function printUsage() {
  console.log("\nUsage: node discover-schema.js [-ds datasource -sn db_schema_name]\n" +
    "\t-ds datasource: name of the datasource as specified in datasources.json\n" +
    "\t-sn db_schema_name: name of the table in the db\n");
}

// custom name mapper
function mapName(type, name) {
  return name;
};

function main() {
  switch (process.argv.length) {
    /*
    * if there are 6 params (first and second are execPath and JS file being executed)
    */
    case 6:
      // should be datasource
      var param11 = process.argv[2];
      var datasource = process.argv[3];
      // should be db schema name
      var param21 = process.argv[4];
      var schema_name = process.argv[5];

      var datasource_json = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'datasources.json'), 'utf8'));

      if (param11 === '-ds' && param21 === '-sn' && datasource_json.hasOwnProperty(datasource)) {
        options = {};
        options.nameMapper = mapName;
        var ds = app.createDataSource(datasource, datasource_json[datasource]);
        ds.discoverSchema(schema_name, options, callback);
      } else {
        printUsage();
      }
      break;
    default:
      printUsage();
  }
}

// main function
main();