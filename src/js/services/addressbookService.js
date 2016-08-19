'use strict';

angular.module('copayApp.services').factory('addressbookService', function($stateParams, storageService, profileService, lodash) {
  var root = {};

  root.getLabel = function(addr, cb) {
    var wallet = profileService.getWallet($stateParams.walletId);
    storageService.getAddressbook(wallet.credentials.network, function(err, ab) {
      if (!ab) return cb();
      if (ab[addr]) return cb(ab[addr]);
      else return cb();
    });
  };

  root.list = function(cb) {
    storageService.getAddressbook('testnet', function(err, ab) {
      if (err) return cb('Could not get the Addressbook');

      if (ab) ab = JSON.parse(ab);

      ab = ab || {};
      storageService.getAddressbook('livenet', function(err, ab2) {
        if (ab2) ab2 = JSON.parse(ab2);

        ab2 = ab2 || {};
        return cb(err, lodash.defaults(ab2, ab));
      });
    });
  };

  root.add = function(entry, cb) {
    var wallet = profileService.getWallet($stateParams.walletId);
    root.list(function(err, ab) {
      if (err) return cb(err);
      if (!ab) ab = {};
      if (ab[entry.address]) return cb('Entry already exist');
      ab[entry.address] = entry.label;
      storageService.setAddressbook(wallet.credentials.network, JSON.stringify(ab), function(err, ab) {
        if (err) return cb('Error adding new entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.remove = function(addr, cb) {
    var wallet = profileService.getWallet($stateParams.walletId);
    root.list(function(err, ab) {
      if (err) return cb(err);
      if (!ab) return;
      if (!ab[addr]) return cb('Entry does not exist');
      delete ab[addr];
      storageService.setAddressbook(wallet.credentials.network, JSON.stringify(ab), function(err) {
        if (err) return cb('Error deleting entry');
        root.list(function(err, ab) {
          return cb(err, ab);
        });
      });
    });
  };

  root.removeAll = function() {
    var wallet = profileService.getWallet($stateParams.walletId);
    storageService.removeAddressbook(wallet.credentials.network, function(err) {
      if (err) return cb('Error deleting addressbook');
      return cb();
    });
  };

  return root;
});
