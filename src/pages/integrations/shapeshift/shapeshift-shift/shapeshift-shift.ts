import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';
import * as _ from 'lodash';

// Pages
import { AmountPage } from './../../../send/amount/amount';

// Providers
import { ExternalLinkProvider } from '../../../../providers/external-link/external-link';
import { PopupProvider } from '../../../../providers/popup/popup';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { ShapeshiftProvider } from '../../../../providers/shapeshift/shapeshift';

@Component({
  selector: 'page-shapeshift-shift',
  templateUrl: 'shapeshift-shift.html',
})
export class ShapeshiftShiftPage {

  private defaultCoin: string;
  private walletsBtc: Array<any>;
  private walletsBch: Array<any>;

  public toWallets: Array<any>;
  public fromWallets: Array<any>;
  public fromWallet: any;
  public toWallet: any;
  public rate: number;
  public limit: number;
  public network: string;
  public fromWalletSelectorTitle: string;
  public toWalletSelectorTitle: string;

  constructor(
    private logger: Logger,
    private navCtrl: NavController,
    private navParams: NavParams,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private shapeshiftProvider: ShapeshiftProvider
  ) {
    this.defaultCoin = 'btc';
    this.walletsBtc = [];
    this.walletsBch = [];
    this.fromWalletSelectorTitle = 'From';
    this.toWalletSelectorTitle = 'To';
    this.network = this.shapeshiftProvider.getNetwork();

    this.walletsBtc = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: 'btc'
    });

    this.walletsBch = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: 'bch'
    });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad ShapeshiftShiftPage');
  }

  ionViewWillEnter() {
    this.fromWallets = _.filter(this.walletsBtc.concat(this.walletsBch), (w: any) => {
      // Available balance and 1-signature wallet
      return w.status.balance.availableAmount > 0 && w.credentials.m == 1;
    });

    if (_.isEmpty(this.fromWallets)) {
      this.showErrorAndBack(null, 'No wallets available to use ShapeShift'); // TODO: gettextCatalog
      return;
    }

    this.onFromWalletSelect(this.fromWallets[0]);
  }

  private showErrorAndBack(title: string, msg: any): void {
    title = title ? title : 'Error'; // TODO: gettextCatalog
    this.logger.error(msg);
    msg = (msg && msg.errors) ? msg.errors[0].message : msg;
    this.popupProvider.ionicAlert(title, msg).then(() => {
      this.navCtrl.pop();
    });
  }

  private showToWallets(): void {
    this.toWallets = this.fromWallet.coin == 'btc' ? this.walletsBch : this.walletsBtc;
    this.onToWalletSelect(this.toWallets[0]);

    let pair = this.fromWallet.coin + '_' + this.toWallet.coin;
    this.shapeshiftProvider.getRate(pair, (err: any, rate: number) => {
      this.rate = rate;
    });
    this.shapeshiftProvider.getLimit(pair, (err: any, limit: number) => {
      this.limit = limit;
    });
  }

  public onFromWalletSelect(wallet: any): void {
    this.fromWallet = wallet;
    this.showToWallets();
  }

  public onToWalletSelect(wallet: any): void {
    this.toWallet = wallet;
  }

  public setAmount(): void {
    this.navCtrl.push(AmountPage, {
      nextStep: 'ShapeshiftConfirmPage',
      fixedUnit: true,
      coin: this.fromWallet.coin,
      id: this.fromWallet.id,
      toWalletId: this.toWallet.id
    });
  }

}
