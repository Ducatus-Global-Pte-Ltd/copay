'use strict';

angular.module('copayApp.services').factory('payproService',
function($window, profileService, platformInfo, popupService, gettextCatalog, ongoingProcess, $log, $state) {

  var ret = {};

  ret.getPayProDetails = function(uri, cb) {
    if (!cb) cb = function() {};

    var wallet = profileService.getWallets({
      onlyComplete: true
    })[0];

    if (!wallet) return cb();

    if (platformInfo.isChromeApp) {
      popupService.showAlert(gettextCatalog.getString('Payment Protocol not supported on Chrome App'));
      return cb(true);
    }

    $log.debug('Fetch PayPro Request...', uri);

    ongoingProcess.set('fetchingPayPro', true);

    wallet.fetchPayPro({
      payProUrl: uri,
    }, function(err, paypro) {

      ongoingProcess.set('fetchingPayPro', false);
      if (err) {
        return cb(true);
      }

      if (!paypro.verified) {
        $log.warn('Failed to verify payment protocol signatures');
        popupService.showAlert(gettextCatalog.getString('Payment Protocol Invalid'));
        return cb(true);
      }
      cb(null, paypro);

    });
  };

  return ret;
});
