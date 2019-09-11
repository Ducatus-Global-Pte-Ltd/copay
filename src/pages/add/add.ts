import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

// pages
import { ImportWalletPage } from '../add/import-wallet/import-wallet';
import { JoinWalletPage } from '../add/join-wallet/join-wallet';
import { SelectCurrencyPage } from '../add/select-currency/select-currency';

// providers
import { Logger } from '../../providers';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public allowMultiplePrimaryWallets: boolean;

  constructor(
    private navCtrl: NavController,
    private logger: Logger,
    private navParams: NavParams
  ) {}

  ionViewDidLoad() {
    this.logger.info('Loaded: AddPage');
  }

  public goToAddWalletPage(
    isShared: boolean,
    isJoin: boolean,
    isCreate: boolean
  ): void {
    if (isCreate) {
      this.navCtrl.push(SelectCurrencyPage, {
        isShared,
        keyId: this.navParams.data.keyId
      });
    } else if (isJoin) {
      this.navCtrl.push(JoinWalletPage, {
        keyId: this.navParams.data.keyId,
        url: this.navParams.data.url
      });
    }
  }

  public goToImportWallet(): void {
    this.navCtrl.push(ImportWalletPage);
  }
}
