# This will be a rest-api-aggregator

This will gather information from various REST apis into one composite endpoint. This is different from other API Gateways as it will aggregate the results.

> THIS CONTAINS MULTIPLE HACKS/VERY GRIM THINGS. PLEASE NEVER USE THIS FOR SOMETHING IMPORTANT.

This has just been shoe horned together over the course of a few days.

## About

This service is really rather basic it creates objects for each of the service endpoints. It then creates routes based on whats in the aggregation part of the config and calls the objects.

The design of this service is to keep it as basic as possible and really easy to modify. The design is that the plugin named in the config will have `setup()` called with request data supplied in the config. Then later on when the endpoint is called will have the `call()` method called.

The plugin should return a promise containing the data and then the jsonPath will be ran against that to pick out the data the user specified.

## Configuring the config file

You need to add the relevant information to the serviceEndpoints section. This needs to contain a jsonPath and a request. The url is the url the request will be made against and the type is the pluging that will be called. Additional information in the request section may be needed depending on the plugin.

## Running the service

Clone the repo and then run the following:

```
$ npm install
$ npm start
```
