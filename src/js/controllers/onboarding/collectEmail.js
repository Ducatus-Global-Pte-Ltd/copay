'use strict';

angular.module('copayApp.controllers').controller('collectEmailController', function($scope, $state, $timeout, $stateParams, profileService, configService, walletService, platformInfo) {

  var isCordova = platformInfo.isCordova;
  var isWP = platformInfo.isWP;
  var usePushNotifications = isCordova && !isWP;

  var wallet = profileService.getWallet($stateParams.walletId);
  var walletId = wallet.credentials.walletId;

  $scope.save = function() {
    var opts = {
      emailFor: {}
    };
    opts.emailFor[walletId] = $scope.email;

    walletService.updateRemotePreferences(wallet, {
      email: $scope.email,
    }, function(err) {
      if (err) $log.warn(err);
      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        if (!usePushNotifications) $state.go('onboarding.backupRequest', {
          walletId: walletId
        });
        else $state.go('onboarding.notifications', {
          walletId: walletId
        });
      });
    });
  };

  $scope.confirm = function(emailForm) {
    if (emailForm.$invalid) return;
    $scope.confirmation = true;
    $scope.email = emailForm.email.$modelValue;
  };

  $scope.cancel = function() {
    $scope.confirmation = false;
    $timeout(function() {
      $scope.$digest();
    }, 1);
  };

  $scope.onboardingMailSkip = function() {
    $state.go('onboarding.backupRequest', {
      walletId: walletId
    });
  };
});
