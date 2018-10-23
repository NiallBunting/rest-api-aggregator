'use strict';

const request = require('request-promise-native');

class HttpService {
  constructor() {
    this.url = "";
  }

  setup(data) {
    this.headers = data.headers;
    this.url = data.url;
  }

  call() {
    return request({url: this.url(), headers: this.headers}).then((data) => JSON.parse(data));
  }
}

module.exports = HttpService;
