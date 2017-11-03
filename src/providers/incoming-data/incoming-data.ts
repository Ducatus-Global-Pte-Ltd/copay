import { Injectable } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
import { Logger } from '@nsalaun/ng-logger';

//providers
import { BwcProvider } from '../bwc/bwc';
import { PayproProvider } from '../paypro/paypro';
import { ScanProvider } from '../scan/scan';
import { PopupProvider } from '../popup/popup';
import { AppProvider } from '../app/app';

//pages
import { SendPage } from '../../pages/send/send';
import { ConfirmPage } from '../../pages/send/confirm/confirm';
import { AmountPage } from '../../pages/send/amount/amount';
import { JoinWalletPage } from '../../pages/add/join-wallet/join-wallet';
import { ImportWalletPage } from '../../pages/add/import-wallet/import-wallet';

@Injectable()
export class IncomingDataProvider {

  constructor(
    private events: Events,
    private navCtrl: NavController,
    private bwcProvider: BwcProvider,
    private payproProvider: PayproProvider,
    private scanProvider: ScanProvider,
    private popupProvider: PopupProvider,
    private logger: Logger,
    private appProvider: AppProvider
  ) {
    console.log('Hello IncomingDataProvider Provider');
  }

  //TODO
  public showMenu(data: any): void {
    this.events.publish('incomingDataMenu.showMenu', data);
  }

  public redir(data: any): boolean {
    // data extensions for Payment Protocol with non-backwards-compatible request
    if ((/^bitcoin(cash)?:\?r=[\w+]/).exec(data)) {
      data = decodeURIComponent(data.replace(/bitcoin(cash)?:\?r=/, ''));
      this.navCtrl.push(ConfirmPage, { paypro: data });
      return true;
    }

    data = this.sanitizeUri(data);

    // Bitcoin  URL
    if (this.bwcProvider.getBitcore().URI.isValid(data)) {

      var coin = 'btc';
      var parsed = this.bwcProvider.getBitcore().URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ? parsed.amount : '';

      if (parsed.r) {
        this.payproProvider.getPayProDetails(parsed.r).then((details) => {
          this.handlePayPro(details);
        }).catch((err: string) => {
          if (addr && amount) this.goSend(addr, amount, message, coin);
          else this.popupProvider.ionicAlert('Error', err); //TODO gettextcatalog
        });
      } else {
        this.goSend(addr, amount, message, coin);
      }
      return true;
      // Cash URI
    } else if (this.bwcProvider.getBitcoreCash().URI.isValid(data)) {
      var coin = 'bch';
      var parsed = this.bwcProvider.getBitcoreCash().URI(data);

      var addr = parsed.address ? parsed.address.toString() : '';
      var message = parsed.message;

      var amount = parsed.amount ? parsed.amount : '';

      // paypro not yet supported on cash
      if (parsed.r) {
        this.payproProvider.getPayProDetails(parsed.r).then((details: any) => {
          this.handlePayPro(details, coin);
        }).catch((err: string) => {
          if (addr && amount)
            this.goSend(addr, amount, message, coin);
          else
            this.popupProvider.ionicAlert('Error', err);//TODO gettextcatalog
        });
      } else {
        this.goSend(addr, amount, message, coin);
      }
      return true;

      // Cash URI with bitcoin core address version number?
    } else if (this.bwcProvider.getBitcore().URI.isValid(data.replace(/^bitcoincash:/, 'bitcoin:'))) {
      this.logger.debug('Handling bitcoincash URI with legacy address');
      let coin = 'bch';
      let parsed = this.bwcProvider.getBitcore().URI(data.replace(/^bitcoincash:/, 'bitcoin:'));

      let oldAddr = parsed.address ? parsed.address.toString() : '';
      if (!oldAddr) return false;

      let addr = '';

      let a = this.bwcProvider.getBitcore().Address(oldAddr).toObject();
      addr = this.bwcProvider.getBitcoreCash().Address.fromObject(a).toString();

      // Translate address
      this.logger.debug('address transalated to:' + addr);
      this.popupProvider.ionicConfirm('Bitcoin cash Payment', 'Payment address was translated to new Bitcoin Cash address format: ' + addr, 'OK', 'Cancel').then(() => {

        let message = parsed.message;
        let amount = parsed.amount ? parsed.amount : '';

        // paypro not yet supported on cash
        if (parsed.r) {
          this.payproProvider.getPayProDetails(parsed.r).then((details) => {
            this.handlePayPro(details, coin);
          }).catch((err) => {
            if (addr && amount)
              this.goSend(addr, amount, message, coin);
            else
              this.popupProvider.ionicAlert('Error', err);//TODO gettextcatalog
          });
        } else {
          this.goSend(addr, amount, message, coin);
        }
      }).catch(() => {
        return false;
      });
      return true;
      // Plain URL
    } else if (/^https?:\/\//.test(data)) {

      this.payproProvider.getPayProDetails(data).then((details) => {
        this.handlePayPro(details);
        return true;
      }).catch(() => {
        this.showMenu({
          data: data,
          type: 'url'
        });
        return;
      });
      // Plain Address
    } else if (this.bwcProvider.getBitcore().Address.isValid(data, 'livenet') || this.bwcProvider.getBitcore().Address.isValid(data, 'testnet')) {
      if (this.navCtrl.getActive().name === 'ScanPage') {
        this.showMenu({
          data: data,
          type: 'bitcoinAddress'
        });
      } else {
        this.goToAmountPage(data);
      }
    } else if (this.bwcProvider.getBitcoreCash().Address.isValid(data, 'livenet')) {
      if (this.navCtrl.getActive().name === 'ScanPage') {
        this.showMenu({
          data: data,
          type: 'bitcoinAddress',
          coin: 'bch',
        });
      } else {
        this.goToAmountPage(data, 'bch');
      }
    } else if (data && data.indexOf(this.appProvider.info.name + '://glidera') === 0) {
      var code = this.getParameterByName('code', data);
      //this.navCtrl.push(GlideraPage, {code: code}); //Glidera TODO
      this.logger.debug('Glidera TODO');
      return true;
    } else if (data && data.indexOf(this.appProvider.info.name + '://coinbase') === 0) {
      var code = this.getParameterByName('code', data);
      //this.navCtrl.push(CoinbasePage, {code: code}); //Glidera TODO
      this.logger.debug('Coinbase TODO');
      return true;
      // BitPayCard Authentication
    } else if (data && data.indexOf(this.appProvider.info.name + '://') === 0) {

      // Disable BitPay Card
      if (!this.appProvider.info._enabledExtensions.debitcard) return false;

      var secret = this.getParameterByName('secret', data);
      var email = this.getParameterByName('email', data);
      var otp = this.getParameterByName('otp', data);
      var reason = this.getParameterByName('r', data);
      switch (reason) {
        default:
        case '0':
          /* For BitPay card binding */
          //this.navCtrl.push(BitPayCardPage,{ secret: secret, email: email, otp: otp}); //Glidera TODO
          this.logger.debug('BitPay card TODO');
          break;
      }
      return true;

      // Join
    } else if (data && data.match(/^copay:[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      this.navCtrl.push(JoinWalletPage, { url: data })
      return true;
      // Old join
    } else if (data && data.match(/^[0-9A-HJ-NP-Za-km-z]{70,80}$/)) {
      this.navCtrl.push(JoinWalletPage, { url: data })
      return true;
    } else if (data && (data.substring(0, 2) == '6P' || this.checkPrivateKey(data))) {
      this.showMenu({
        data: data,
        type: 'privateKey'
      });
    } else if (data && ((data.substring(0, 2) == '1|') || (data.substring(0, 2) == '2|') || (data.substring(0, 2) == '3|'))) {
      this.navCtrl.push(ImportWalletPage, { code: data })
      return true;

    } else {

      if (this.navCtrl.getActive().name === 'ScanPage') {
        this.showMenu({
          data: data,
          type: 'text'
        });
      }
    }
    return false;
  }

  private sanitizeUri(data: any): string {
    // Fixes when a region uses comma to separate decimals
    var regex = /[\?\&]amount=(\d+([\,\.]\d+)?)/i;
    var match = regex.exec(data);
    if (!match || match.length === 0) {
      return data;
    }
    var value = match[0].replace(',', '.');
    var newUri = data.replace(regex, value);

    // mobile devices, uris like copay://glidera
    newUri.replace('://', ':');

    return newUri;
  }

  private getParameterByName(name: string, url: string): string {
    if (!url) return;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  private checkPrivateKey(privateKey: string): boolean {
    try {
      this.bwcProvider.getBitcore().PrivateKey(privateKey, 'livenet');
    } catch (err) {
      return false;
    }
    return true;
  }

  private goSend(addr: string, amount: string, message: string, coin: string): void {
    this.navCtrl.push(SendPage, {});
    if (amount) {
      this.navCtrl.push(ConfirmPage, {
        toAmount: amount,
        toAddress: addr,
        description: message,
        coin: coin
      });
    } else {
      this.navCtrl.push(AmountPage, {
        toAddress: addr,
        coin: coin
      });
    }
  }

  private goToAmountPage(toAddress: string, coin?: string) {
    this.navCtrl.push(SendPage, {});
    this.navCtrl.push(AmountPage, {
      toAddress: toAddress,
      coin: coin
    });
  }

  private handlePayPro(payProDetails: any, coin?: string): void {
    var stateParams = {
      toAmount: payProDetails.amount,
      toAddress: payProDetails.toAddress,
      description: payProDetails.memo,
      paypro: payProDetails,
      coin: coin,
    };
    this.scanProvider.pausePreview();
    this.navCtrl.push(ConfirmPage, stateParams);
  }

}
