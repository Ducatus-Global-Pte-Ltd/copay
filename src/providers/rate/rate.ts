import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

@Injectable()
export class RateProvider {

  private _rates: Object;
  private _alternatives: Array<any>;
  private _ratesBCH: Object;
  private _isAvailable: boolean = false;

  private rateServiceUrl = 'https://bitpay.com/api/rates';
  private bchRateServiceUrl = 'https://api.kraken.com/0/public/Ticker?pair=BCHUSD,BCHEUR';

  constructor(public http: HttpClient) {
    console.log('Hello RateProvider Provider');
    this._rates = {};
    this._alternatives = [];
    this._ratesBCH = {};
    this.updateRates();
  }

  updateRates(): Promise<any> {
    return new Promise((resolve, reject) => {
      let self = this;
      this.getBTC().then((dataBTC) => {

        _.each(dataBTC, (currency) => {
          self._rates[currency.code] = currency.rate;
          self._alternatives.push({
            name: currency.name,
            isoCode: currency.code,
            rate: currency.rate
          });
        });

        this.getBCH().then((dataBCH) => {

          _.each(dataBCH.result, (data, paircode) => {
            let code = paircode.substr(3, 3);
            let rate = data.c[0];
            self._ratesBCH[code] = rate;
          });

          this._isAvailable = true;
          resolve();
        })
          .catch((errorBCH) => {
            console.log("Error: ", errorBCH);
            reject(errorBCH);
          });
      })
        .catch((errorBTC) => {
          console.log("Error: ", errorBTC);
          reject(errorBTC);
        });
    });
  }

  getBTC(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(this.rateServiceUrl).subscribe((data) => {
        resolve(data);
      });
    });
  }

  getBCH(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(this.bchRateServiceUrl).subscribe((data) => {
        resolve(data);
      });
    });
  }

  getRate(code, chain?) {
    if (chain == 'bch')
      return this._ratesBCH[code];
    else
      return this._rates[code];
  };

  getAlternatives() {
    return this._alternatives;
  };

  toFiat(satoshis, code, chain) {
    return satoshis * this.getRate(code, chain);
  };

  fromFiat(amount, code, chain) {
    return amount / this.getRate(code, chain);
  };

  listAlternatives(sort: boolean) {
    let alternatives = _.map(this.getAlternatives(), (item) => {
      return {
        name: item.name,
        isoCode: item.isoCode
      }
    });
    if (sort) {
      alternatives.sort((a, b) => {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    }
    return _.uniqBy(alternatives, 'isoCode');
  };

  //TODO IMPROVE WHEN AVAILABLE
  whenAvailable() {
    return new Promise((resolve, reject) => {
      if (this._isAvailable) resolve();
      else {
        this.updateRates().then(() => {
          resolve();
        });
      }
    });

  }

}
