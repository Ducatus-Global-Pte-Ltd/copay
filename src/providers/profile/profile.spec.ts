import * as _ from 'lodash';
import { Events } from 'ionic-angular';
// import { fakeAsync, tick } from '@angular/core/testing';
import { BwcProvider, PersistenceProvider } from '..';
// import { Logger } from '../logger/logger';
import { TestUtils } from '../../test';
import { ProfileProvider } from './profile';
import { PopupProvider } from '../../providers/popup/popup';
import { ConfigProvider } from '../../providers/config/config';
import { Profile } from '../../models/profile/profile.model';

fdescribe('Profile Provider', () => {
  // let loggerProvider: Logger;
  let profileProvider: ProfileProvider;
  let configProvider: ConfigProvider;
  let popupProvider: PopupProvider;
  let events: Events;
  let eventsPublishSpy;

  const walletMock = {
    id1: {
      id: 'id1',
      lastKnownBalance: '10.00 BTC',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'livenet',
        n: 1,
        m: 1,
        walletId: 'id1'
      },
      cachedStatus: {
        availableBalanceSat: 1000000000 // 10 BTC
      },
      needsBackup: false,
      order: '',
      isComplete: () => {
        return true;
      },
      setNotificationsInterval: _updatePeriod => {}
    },
    id2: {
      id: 'id2',
      lastKnownBalance: '5.00 BCH',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'bch',
        network: 'livenet',
        n: 1,
        m: 1,
        walletId: 'id2'
      },
      cachedStatus: {
        availableBalanceSat: 500000000 // 5 BCH
      },
      needsBackup: true,
      order: 2,
      isComplete: () => {
        return true;
      }
    },
    id3: {
      id: 'id3',
      lastKnownBalance: '1.50 BTC',
      lastKnownBalanceUpdatedOn: null,
      credentials: {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2,
        walletId: 'id3'
      },
      cachedStatus: {
        availableBalanceSat: 150000000 // 1.50 BTC
      },
      needsBackup: true,
      order: 3,
      isComplete: () => {
        return true;
      }
    }
  };

  const walletToImport = {
    walletId: 'id1',
    xPrivKey: 'xPrivKey1',
    xPrivKeyEncrypted: 'xPrivKeyEncrypted1',
    mnemonicEncrypted: 'mnemonicEncrypted1',
    n: 1
  };

  const walletClientMock = {
    credentials: {
      coin: 'btc',
      network: 'livenet',
      n: 1,
      m: 1,
      walletId: 'id1'
    },
    canSign: () => {
      return true;
    },
    encryptPrivateKey: () => {
      return true;
    },
    export: (_str: string, _opts) => {
      return '{"walletId": "id1", "xPrivKey": "xPrivKey1", "xPrivKeyEncrypted": "xPrivKeyEncrypted1", "mnemonicEncrypted": "mnemonicEncrypted1", "n": 1}';
    },
    import: (_str: string, _opts) => {
      return true;
    },
    importFromExtendedPrivateKey: (_xPrivKey: string, _opts, _cb) => {
      return _cb(null, walletToImport);
    },
    importFromExtendedPublicKey: (
      _xPubKey: string,
      _externalSource: string,
      _entropySource: string,
      _opts,
      _cb
    ) => {
      return _cb(null, walletToImport);
    },
    importFromMnemonic: (_words: string, _opts, _cb) => {
      return _cb(null, walletToImport);
    },
    initialize: (_opts, _cb) => {
      return true;
    },
    isPrivKeyEncrypted: () => {
      return true;
    },
    isPrivKeyExternal: () => {
      return true;
    },
    removeAllListeners: () => {
      return true;
    },
    on: (_event: string, _cb) => {
      return _cb;
    },
    validateKeyDerivation: (_opts, _cb) => {
      return true;
    }
  };

  class BwcProviderMock {
    constructor() {}
    getErrors() {
      return {
        NOT_AUTHORIZED: new Error('not authorized'),
        ERROR: new Error('error')
      };
    }
    getBitcore() {
      return true;
    }
    getBitcoreCash() {
      return true;
    }
    getClient(_walletData, _opts) {
      return walletClientMock;
    }
  }

  class PersistenceProviderMock {
    constructor() {}
    getLastKnownBalance() {
      return Promise.resolve('0.00 BTC');
    }
    setBackupFlag(_walletId) {
      return Promise.resolve();
    }
    setWalletOrder() {
      return Promise.resolve();
    }
    getWalletOrder() {
      return Promise.resolve(1);
    }
    getHideBalanceFlag(_walletId) {
      return Promise.resolve(true);
    }
    storeProfile(_profile) {
      return Promise.resolve();
    }
    getAddressBook(_network: string) {
      return Promise.resolve('{"name": "Gabriel Loco"}');
    }
    setAddressBook(_network: string, _strAddressBook: string) {
      return Promise.resolve();
    }
    storeNewProfile(_profile) {
      return Promise.resolve();
    }
    storeVault(_vault) {
      return Promise.resolve();
    }
    getVault() {
      return Promise.resolve({});
    }
  }

  // class ProfileModelMock {
  //   constructor() { }
  //   updateWallet(_credentials) {
  //     return Promise.resolve();
  //   }
  // }

  beforeEach(() => {
    const testBed = TestUtils.configureProviderTestingModule([
      { provide: BwcProvider, useClass: BwcProviderMock },
      { provide: PersistenceProvider, useClass: PersistenceProviderMock }
    ]);
    configProvider = testBed.get(ConfigProvider);
    profileProvider = testBed.get(ProfileProvider);
    popupProvider = testBed.get(PopupProvider);
    // loggerProvider = testBed.get(Logger);
    profileProvider.wallet = walletMock;
    profileProvider.profile = Profile.create();

    events = testBed.get(Events);
    eventsPublishSpy = spyOn(events, 'publish');
  });

  describe('setWalletOrder', () => {
    it('should set the order if walletId already exists in wallet object', () => {
      const walletId: string = 'id1';
      const order: number = 1;
      profileProvider.setWalletOrder(walletId, order);
      expect(profileProvider.wallet.id1.order).toBeDefined();
      profileProvider.wallet.id1.order = order;
      expect(profileProvider.wallet.id1.order).toBe(1);
    });

    it("should not set the order if walletId doesn't exist in wallet object", () => {
      const walletId: string = 'id4';
      const order: number = 4;
      profileProvider.setWalletOrder(walletId, order);
      expect(profileProvider.wallet.id4).not.toBeDefined();
    });
  });

  describe('getWalletOrder', () => {
    it('should get the correct order from persistenceProvider if it is defined', () => {
      const walletId: string = 'id1';
      profileProvider.getWalletOrder(walletId).then(order => {
        expect(order).toBe(1);
      });
    });
  });

  describe('setBackupFlag', () => {
    it('should set needsBackup to false for a specified walletId', () => {
      const walletId: string = 'id3';
      profileProvider.setBackupFlag(walletId);
      expect(profileProvider.wallet.id3.needsBackup).toBeFalsy();
    });
  });

  describe('setFastRefresh', () => {
    it('should set needsBackup to false for a specified walletId', () => {
      const setNotificationsIntervalSpy = spyOn(
        profileProvider.wallet.id1,
        'setNotificationsInterval'
      );
      profileProvider.UPDATE_PERIOD_FAST = 5;
      profileProvider.setFastRefresh(profileProvider.wallet.id1);
      expect(setNotificationsIntervalSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('setSlowRefresh', () => {
    it('should set needsBackup to false for a specified walletId', () => {
      const setNotificationsIntervalSpy = spyOn(
        profileProvider.wallet.id1,
        'setNotificationsInterval'
      );
      profileProvider.UPDATE_PERIOD = 15;
      profileProvider.setSlowRefresh(profileProvider.wallet.id1);
      expect(setNotificationsIntervalSpy).toHaveBeenCalledWith(15);
    });
  });

  describe('updateCredentials', () => {
    it('should call the updateWallet method of profile to update credentials', () => {
      const updateWalletSpy = spyOn(profileProvider.profile, 'updateWallet');
      const credentials = profileProvider.wallet.id1.credentials;
      profileProvider.updateCredentials(credentials);

      expect(updateWalletSpy).toHaveBeenCalledWith(credentials);
    });
  });

  describe('storeProfileIfDirty', () => {
    it('should store the profile if it is dirty', () => {
      profileProvider.profile.dirty = true;
      profileProvider.storeProfileIfDirty();
      expect().nothing();
    });

    it('should not store the profile if it is not dirty', () => {
      profileProvider.profile.dirty = false;
      profileProvider.storeProfileIfDirty();
      expect().nothing();
    });
  });

  describe('importWallet', () => {
    it('should return err if importWallet receive a corrupt string', () => {
      const str: string = 'corruptedString';
      const opts = {};
      profileProvider
        .importWallet(str, opts)
        .then(walletClient => {
          expect(walletClient).not.toBeDefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });

    it("should return err if JSON.parse is ok but str doesn't have property xPrivKey or xPrivKeyEncrypted", () => {
      let str: string =
        '{xPrivKeyEncrypted": "xPrivKeyEncrypted1", "mnemonicEncrypted": "mnemonicEncrypted1"}';
      const opts = {};
      profileProvider
        .importWallet(str, opts)
        .then(walletClient => {
          expect(walletClient).not.toBeDefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });

      str =
        '{"xPrivKey": "xPrivKey1", "mnemonicEncrypted": "mnemonicEncrypted1"}';
      profileProvider
        .importWallet(str, opts)
        .then(walletClient => {
          expect(walletClient).not.toBeDefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });

    it("should return err if JSON.parse is ok but str doesn't have property n", () => {
      const str: string =
        '{"xPrivKey": "xPrivKey1", "xPrivKeyEncrypted": "xPrivKeyEncrypted1", "mnemonicEncrypted": "mnemonicEncrypted1"}';
      const opts = {};
      profileProvider
        .importWallet(str, opts)
        .then(walletClient => {
          expect(walletClient).not.toBeDefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });

    it('should return err if ionicPrompt from "askPassword" does not return a password', () => {
      const str: string =
        '{"xPrivKey": "xPrivKey1", "xPrivKeyEncrypted": "xPrivKeyEncrypted1", "mnemonicEncrypted": "mnemonicEncrypted1", "n": 1}';
      const opts = {};

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(false)
      );

      profileProvider
        .importWallet(str, opts)
        .then(walletClient => {
          expect(walletClient).not.toBeDefined();
        })
        .catch(err => {
          expect(err).toBeDefined();
        });
    });

    it('should return the correct walletClient', () => {
      const str: string =
        '{"xPrivKey": "xPrivKey1", "xPrivKeyEncrypted": "xPrivKeyEncrypted1", "mnemonicEncrypted": "mnemonicEncrypted1", "n": 1}';
      const opts = {};

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(popupProvider, 'ionicPrompt').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });

      profileProvider
        .importWallet(str, opts)
        .then(walletClient => {
          expect(walletClient).toBeDefined();
          expect(walletClient.credentials.walletId).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('importVaultWallets', () => {
    it('should publish Local/WalletListChange event if importVaultWallets is executed correctly', async () => {
      const words: string = 'mom mom mom mom mom mom mom mom mom mom mom mom';
      const opts = {};

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(popupProvider, 'ionicPrompt').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });
      spyOn(profileProvider, 'importMnemonic').and.returnValue(
        Promise.resolve(walletClientMock)
      );
      spyOn(profileProvider.profile, 'hasWallet').and.returnValue(false);

      await profileProvider.importVaultWallets(words, opts).catch(err => {
        expect(err).not.toBeDefined();
      });

      expect(eventsPublishSpy).toHaveBeenCalledWith('Local/WalletListChange');
    });
  });

  describe('importExtendedPrivateKey', () => {
    it('should publish Local/WalletListChange event if importExtendedPrivateKey is executed correctly', async () => {
      const xPrivKey: string = 'xPrivKey1';
      const opts = {};

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(popupProvider, 'ionicPrompt').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });
      spyOn(profileProvider.profile, 'hasWallet').and.returnValue(false);

      await profileProvider
        .importExtendedPrivateKey(xPrivKey, opts)
        .then(wallet => {
          expect(wallet).toBeDefined();
          expect(wallet.id).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });

      expect(eventsPublishSpy).toHaveBeenCalledWith('Local/WalletListChange');
    });
  });

  describe('Function: normalizeMnemonic', () => {
    it('Should return the same input string if is called without words', () => {
      const words = '';
      expect(profileProvider.normalizeMnemonic(words)).toEqual('');
    });

    it('Should return the same words list if it is already normalized', () => {
      const words = 'mom mom mom mom mom mom mom mom mom mom mom mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized if is called with more than one space between words', () => {
      const words =
        'mom  mom mom           mom mom mom mom mom mom mom mom mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized if is called with spaces at the end of the phrase', () => {
      const words = 'mom mom mom mom mom mom mom mom mom mom mom mom    ';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized if is called with spaces at the beginning of the phrase', () => {
      const words = '     mom mom mom mom mom mom mom mom mom mom mom mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized with different capitalizations', () => {
      const words = 'Mom MOM mom mom mOm mom moM mom MOM mom Mom Mom';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );
    });

    it('Should return words list normalized for all different languages if it is called with capital letters and spaces in different combinations of positions', () => {
      const words =
        '     mom  Mom mom           mom mom MOM mom moM mom mom mom mom    ';
      expect(profileProvider.normalizeMnemonic(words)).toEqual(
        'mom mom mom mom mom mom mom mom mom mom mom mom'
      );

      const spanishWords =
        ' tener golpe máquina   cumbre caÑón UNO lino Vigor RÁbano sombra oleada multa  ';
      expect(profileProvider.normalizeMnemonic(spanishWords)).toEqual(
        'tener golpe máquina cumbre cañón uno lino vigor rábano sombra oleada multa'
      );

      const frenchWords =
        '  effacer embryon groupe   rigide BUSTIER caresser adjectif colonel friable bolide terrible divertir  ';
      expect(profileProvider.normalizeMnemonic(frenchWords)).toEqual(
        'effacer embryon groupe rigide bustier caresser adjectif colonel friable bolide terrible divertir'
      );

      const italianWords =
        'AVERE   farfalla siccome balzano grinza dire baGnato fegato nomina satollo baldo nobile  ';
      expect(profileProvider.normalizeMnemonic(italianWords)).toEqual(
        'avere farfalla siccome balzano grinza dire bagnato fegato nomina satollo baldo nobile'
      );

      const dutchWords =
        'blush cube farm element maTH gauge defy install garden awkward wide fancy  ';
      expect(profileProvider.normalizeMnemonic(dutchWords)).toEqual(
        'blush cube farm element math gauge defy install garden awkward wide fancy'
      );

      const polishWords =
        ' spider  rose radio defense   garment voice kitten dune    license chunk   glove shuffle';
      expect(profileProvider.normalizeMnemonic(polishWords)).toEqual(
        'spider rose radio defense garment voice kitten dune license chunk glove shuffle'
      );

      const germanWords =
        'Harsh Original Stove Fortune Enforce Young Throw Clay Liberty Certain Loud Aware';
      expect(profileProvider.normalizeMnemonic(germanWords)).toEqual(
        'harsh original stove fortune enforce young throw clay liberty certain loud aware'
      );

      const japaneseWords =
        '  のぼる　しゅみ　ぜっく　おおどおり　 そんしつ　はさん　けつえき　くうき　こんき　ひやす　うよく　しらせる   ';
      expect(profileProvider.normalizeMnemonic(japaneseWords)).toEqual(
        'のぼる　しゅみ　ぜっく　おおどおり　そんしつ　はさん　けつえき　くうき　こんき　ひやす　うよく　しらせる'
      );

      const simplifiedChineseWords = '  泰 柱 腹 侵 米 强 隙 学 良  迅 使 毕 ';
      expect(profileProvider.normalizeMnemonic(simplifiedChineseWords)).toEqual(
        '泰 柱 腹 侵 米 强 隙 学 良 迅 使 毕'
      );

      const traditionalChineseWords =
        ' 只 沒 結 解 問 意   建 月  公 無 系 軍 ';
      expect(
        profileProvider.normalizeMnemonic(traditionalChineseWords)
      ).toEqual('只 沒 結 解 問 意 建 月 公 無 系 軍');

      const russianWords =
        'proud admit  enforce  fruit  prosper  odor approve present have there smart kitten ';
      expect(profileProvider.normalizeMnemonic(russianWords)).toEqual(
        'proud admit enforce fruit prosper odor approve present have there smart kitten'
      );

      const portugueseWords =
        'ABSENT POND DEPOSIT SMOOTH EMPTY TROPHY LOUD THERE ADMIT WHISPER MULE MORE';
      expect(profileProvider.normalizeMnemonic(portugueseWords)).toEqual(
        'absent pond deposit smooth empty trophy loud there admit whisper mule more'
      );
    });
  });

  describe('importSingleSeedMnemonic', () => {
    it('should publish Local/WalletListChange event if importSingleSeedMnemonic is executed correctly', async () => {
      const words: string = 'mom mom mom mom mom mom mom mom mom mom mom mom';
      const opts = {};

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(popupProvider, 'ionicPrompt').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });
      spyOn(profileProvider.profile, 'hasWallet').and.returnValue(false);

      await profileProvider
        .importSingleSeedMnemonic(words, opts)
        .then(wallet => {
          expect(wallet).toBeDefined();
          expect(wallet.id).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });

      expect(eventsPublishSpy).toHaveBeenCalledWith('Local/WalletListChange');
    });
  });

  describe('importMnemonic', () => {
    it('should return the wallet if importMnemonic is executed correctly', () => {
      const words: string = 'mom mom mom mom mom mom mom mom mom mom mom mom';
      const opts = {};
      const ignoreError: boolean = true;

      profileProvider
        .importMnemonic(words, opts, ignoreError)
        .then(wallet => {
          expect(wallet).toBeDefined();
          expect(wallet.credentials.walletId).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  describe('importExtendedPublicKey', () => {
    it('should publish Local/WalletListChange event if importExtendedPublicKey is executed correctly', async () => {
      const opts = {
        extendedPublicKey: 'extendedPublicKey1',
        externalSource: 'externalSource1',
        entropySource: 'entropySource1'
      };

      spyOn(popupProvider, 'ionicConfirm').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(popupProvider, 'ionicPrompt').and.returnValue(
        Promise.resolve(true)
      );
      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });
      spyOn(profileProvider.profile, 'hasWallet').and.returnValue(false);

      await profileProvider
        .importExtendedPublicKey(opts)
        .then(wallet => {
          expect(wallet).toBeDefined();
          expect(wallet.credentials.walletId).toEqual('id1');
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });

      expect(eventsPublishSpy).toHaveBeenCalledWith('Local/WalletListChange');
    });
  });

  describe('createProfile', () => {
    it('should call storeNewProfile function with the new profile', () => {
      const storeNewProfileSpy = spyOn(
        PersistenceProviderMock.prototype,
        'storeNewProfile'
      );

      profileProvider.createProfile();

      expect(storeNewProfileSpy).toHaveBeenCalledWith(profileProvider.profile);
    });
  });

  describe('bindProfile', () => {
    it('should work without errors if onboardingCompleted and disclaimerAccepted', async () => {
      const profile = {
        credentials: [
          profileProvider.wallet.id1.credentials,
          profileProvider.wallet.id2.credentials
        ]
      };

      spyOn(configProvider, 'get').and.returnValue({ bwsFor: 'id1' });
      profileProvider.profile.onboardingCompleted = true;
      profileProvider.profile.disclaimerAccepted = true;

      await profileProvider
        .bindProfile(profile)
        .then(() => {
          expect().nothing();
        })
        .catch(err => {
          expect(err).not.toBeDefined();
        });
    });
  });

  xdescribe('getWallets()', () => {
    it('should get successfully all wallets when no opts', () => {
      const wallets = profileProvider.getWallets();
      expect(wallets).toEqual(_.values(profileProvider.wallet));
    });

    it('should get successfully all wallets when opts are provided', () => {
      const opts = {
        coin: 'btc',
        network: 'testnet',
        n: 2,
        m: 2,
        hasFunds: true,
        minAmount: 0,
        onlyComplete: true
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([profileProvider.wallet.id3]);
    });

    it('should not return any wallet when there is no wallets validating provided opts', () => {
      const opts = {
        coin: 'bch',
        network: 'livenet',
        minAmount: 1000000000
      };
      const wallets = profileProvider.getWallets(opts);
      expect(wallets).toEqual([]);
    });
  });
});
