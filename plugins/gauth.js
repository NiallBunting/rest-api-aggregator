'use strict';

const google = require('googleapis');
const {JWT} = require('google-auth-library');

class GAuth {
  constructor() {}

  setup(data) {
    this.url = data.url;
    this.cals = data.cals;
    this.auth = data.auth;

    this.client = this._createAndAuth();
  }

  call() {
    let cals = this._generateCalUrls(this.cals);
    let that = this;
    return new Promise(function(resolve, reject){
      //https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMax=2018-10-02T00%3A00%3A00Z&timeMin=2018-10-01T00%3A00%3A00Z&fields=items(description%2Cend%2Cstart%2Csummary)&key={YOUR_API_KEY}
      //let url = `https://www.googleapis.com/calendar/v3/users/me/calendarList`;
      //url = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
      //url = 'https://www.googleapis.com/calendar/v3/calendars/en.uk#holiday@group.v.calendar.google.com/events';

      let p = Promise.resolve();

      for(let i = 0; i < cals.length; i++) {
        let url = cals[i];
        p = p.then(() => that.client.request({url})).then((data) => {
          //Dirty hack - if contain data escape the chain
          if(data.data.items.length > 0) {
            console.log(data.data);
            throw {"status": "good", "data": data.data};
          }
          return;
        });
      }

      p.catch((err) => {
        if(err && err.status && err.status == "good"){
          resolve(err.data);
        }
        resolve([]);
      }).then(() => {
        resolve([]);
      });
    });
  }

  _generateCalUrls(cals){
    let dateNow = new Date();
    let midnightTomoz = new Date(Date.UTC(dateNow.getUTCFullYear(), dateNow.getUTCMonth(), dateNow.getUTCDate() + 1));
    dateNow = encodeURIComponent(dateNow.toISOString());
    midnightTomoz = encodeURIComponent(midnightTomoz.toISOString());

   return cals.reduce((obj, item) => {
    let calId = encodeURIComponent(item);
    let url = this.url() + calId +'/events?fields=items(description%2Cend%2Cstart%2Csummary)&timeMax=' + midnightTomoz + '&timeMin=' + dateNow;
     obj.push(url);
     return obj;
   }, []);
  }

  _createAndAuth(){
    let client = new JWT(
      this.auth.email,
      null,
      this.auth.key,
      ['https://www.googleapis.com/auth/calendar']
    );
    return client;
  }
}

module.exports = GAuth;
