'use strict';
/*
  WARNING! This file is really grim.
  Rapid prototyping leads to nasty stuff. Have fun with this one!
*/

const config  = require('konfig')({ path: 'config' });
const express = require('express');
const jp = require('jsonpath');

const app = express();

let services = [];

function pad(num, size = 2) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}

function getInsertVar(vari) {
  let date = new Date();
  switch (vari) {
    case 'DAY':
      return pad(date.getUTCDate());
    case 'YEAR':
      return date.getUTCFullYear();
    case 'MONTH':
      return pad(date.getUTCMonth() + 1);
    case 'HOUR':
      return pad(date.getUTCHours());
    case 'MIN':
      return pad(date.getUTCMinutes());
    case 'TDAY':
      return pad(new Date(date.getTime()+1000*60*60*24).getUTCDate());
    default:
      return '';
  }
}

function insertVars(url) {

  var myUrl = url;

  return function (){
    let insideUrl = myUrl;
    let replacements = insideUrl.match(/\$\([A-Za-z]*\)/g)
    if(replacements){
      replacements.forEach((item) => {
        let vari = item.match(/[a-zA-Z]+/)[0];
        insideUrl = insideUrl.replace(item, getInsertVar(vari));
      });
    }
    return insideUrl;
  }
}

//This creates the objects that are called for each service
for(let service in config.app.serviceEndpoints){
  let serviceData = config.app.serviceEndpoints[service];

  let module = require('./plugins/' + serviceData.request.type + '.js');
  module = new module();
  serviceData.request['url'] = insertVars(serviceData.request.url);
  module.setup(serviceData.request);

  services.push({"name": service, "jsonpath": config.app.serviceEndpoints[service].jsonPath,"call": function() {return module.call();} }); 
}

//Loop through the routes and get the services that they are
let routes = [];
for (let key in config.app.aggregation){
  let route = config.app.aggregation[key];

  let routeServices = [];
  route.services.forEach(function(routeService) {
    let res = services.filter(service => service.name === routeService);
    routeServices.push(res[0]);
  });

  routes.push({path: route.path, services: routeServices});
}

//Apply the json path rules
function applyJsonPath(jsonpath, data) {
  return jp.query(data, jsonpath);
}

//Use name
function formatResponse(service, response) {
  try {
    if(response.length === 1){response = response[0];}
  } catch (e) {};

  let obj = {"name": service.name, "resp": response};
  return obj;
}

function arrayToObject (array) { 
   return array.reduce((obj, item) => {
     obj[item.name] = item.resp;
     return obj;
   }, {});
}

//Create the routes for each object
routes.forEach(function(route) {
  console.log(route);
  var execute = route;
  app.get(route.path, function(req , res){
    let methods = [];
    execute.services.forEach(function(service) {
      methods.push(service.call()
        .then((data) => applyJsonPath(service.jsonpath, data))
        .then((json) => formatResponse(service, json))
        .catch((err) => {console.log(err); return {"name": service.name, "resp": "ERROR"};}));
    });

    Promise.all(methods).then((values) => {
      values = arrayToObject(values);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(values));
    });

  });
});

app.listen(process.env.PORT || config.app.server.port, () => {
  console.log("listening..");
});

module.exports = app;
