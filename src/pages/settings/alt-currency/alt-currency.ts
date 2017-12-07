import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import * as _ from 'lodash';

// PRoviders
import { ConfigProvider } from '../../../providers/config/config';
import { RateProvider } from '../../../providers/rate/rate';
import { PersistenceProvider } from '../../../providers/persistence/persistence';
import { ProfileProvider } from '../../../providers/profile/profile';
import { WalletProvider } from '../../../providers/wallet/wallet';

@Component({
  selector: 'page-alt-currency',
  templateUrl: 'alt-currency.html',
})
export class AltCurrencyPage {

  public completeAlternativeList: Array<any>;
  public searchedAltCurrency: string;
  public altCurrencyList: Array<any>;
  public loading: any;
  public currentCurrency: any;
  public lastUsedAltCurrencyList: Array<any>;

  private PAGE_COUNTER: number = 2;
  private SHOW_LIMIT: number = 10;
  private unusedCurrencyList: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private configProvider: ConfigProvider,
    private rate: RateProvider,
    private profileProvider: ProfileProvider,
    private persistenceProvider: PersistenceProvider,
    private walletProvider: WalletProvider
  ) {
    this.completeAlternativeList = [];
    this.altCurrencyList = [];
    this.unusedCurrencyList = [{
      isoCode: 'LTL'
    }, {
      isoCode: 'BTC'
    }];
  }

  ionViewWillEnter() {
    this.rate.updateRates().then((data) => {
      this.completeAlternativeList = this.rate.listAlternatives(true);
      let idx = _.keyBy(this.unusedCurrencyList, 'isoCode');
      let idx2 = _.keyBy(this.lastUsedAltCurrencyList, 'isoCode');

      this.completeAlternativeList = _.reject(this.completeAlternativeList, (c: any) => {
        return idx[c.isoCode] || idx2[c.isoCode];
      });
      this.altCurrencyList = this.completeAlternativeList.slice(0, this.SHOW_LIMIT);
    }).catch((error) => {
      console.log("Error: ", error);
    });

    let config = this.configProvider.get();
    this.currentCurrency = config.wallet.settings.alternativeIsoCode;

    this.persistenceProvider.getLastCurrencyUsed().then((lastUsedAltCurrency: any) => {
      this.lastUsedAltCurrencyList = lastUsedAltCurrency ? lastUsedAltCurrency : [];
    }).catch((err: any) => {
      console.log("Error: ", err);
    });
  }

  public loadAltCurrencies(loading): void {
    if (this.altCurrencyList.length === this.completeAlternativeList.length) {
      loading.complete();
      return;
    }
    setTimeout(() => {
      this.altCurrencyList = this.completeAlternativeList.slice(0, this.PAGE_COUNTER * this.SHOW_LIMIT);
      this.PAGE_COUNTER++;
      loading.complete();
    }, 300);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AltCurrencyPage');
  }

  public save(newAltCurrency: any): void {
    var opts = {
      wallet: {
        settings: {
          alternativeName: newAltCurrency.name,
          alternativeIsoCode: newAltCurrency.isoCode,
        }
      }
    };

    this.configProvider.set(opts);
    this.saveLastUsed(newAltCurrency);
    this.walletProvider.updateRemotePreferences(this.profileProvider.getWallets());
    this.navCtrl.pop();
  };

  private saveLastUsed(newAltCurrency): void {
    this.lastUsedAltCurrencyList.unshift(newAltCurrency);
    this.lastUsedAltCurrencyList = _.uniqBy(this.lastUsedAltCurrencyList, 'isoCode');
    this.lastUsedAltCurrencyList = this.lastUsedAltCurrencyList.slice(0, 3);
    this.persistenceProvider.setLastCurrencyUsed(JSON.stringify(this.lastUsedAltCurrencyList)).then(() => { });
  };

  public findCurrency(searchedAltCurrency: string): void {
    this.altCurrencyList = _.filter(this.completeAlternativeList, (item) => {
      var val = item.name
      var val2 = item.isoCode;
      return _.includes(val.toLowerCase(), searchedAltCurrency.toLowerCase()) || _.includes(val2.toLowerCase(), searchedAltCurrency.toLowerCase());
    })
  }

}
