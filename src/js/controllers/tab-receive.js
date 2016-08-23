'use strict';

angular.module('copayApp.controllers').controller('tabReceiveController', function($scope, $ionicPopover, $timeout, platformInfo, nodeWebkit, walletService, profileService, configService, lodash, gettextCatalog) {

  $scope.isCordova = platformInfo.isCordova;

  $scope.init = function() {
    $scope.index = 0;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isNW = platformInfo.isNW;
    $scope.setWallets();
    $scope.setAddress(false);
    $scope.options = {
      loop: false,
      effect: 'flip',
      speed: 500,
      spaceBetween: 100
    }

    $scope.$on("$ionicSlides.sliderInitialized", function(event, data) {
      // data.slider is the instance of Swiper
      $scope.slider = data.slider;
    });

    $scope.$on("$ionicSlides.slideChangeStart", function(event, data) {
      console.log('Slide change is beginning');
    });

    $scope.$on("$ionicSlides.slideChangeEnd", function(event, data) {
      $scope.index = data.slider.activeIndex;
      $scope.setAddress();
    });
  }

  $scope.shareAddress = function(addr) {
    if ($scope.isCordova) {
      window.plugins.socialsharing.share('bitcoin:' + addr, null, null, null);
    }
  };

  $scope.setAddress = function(forceNew) {
    if ($scope.generatingAddress) return;

    $scope.addr = null;
    $scope.addrError = null;

    var wallet = $scope.wallets[$scope.index];
    if (!wallet.isComplete()) {
      $scope.incomplete = true;
      $timeout(function() {
        $scope.$digest();
      });
      return;
    }

    $scope.incomplete = false;
    $scope.generatingAddress = true;
    $timeout(function() {
      walletService.getAddress($scope.wallets[$scope.index], forceNew, function(err, addr) {
        $scope.generatingAddress = false;
        if (err) {
          $scope.addrError = err;
        } else {
          if (addr)
            $scope.addr = addr;
        }
        $scope.$digest();
      });
    });
  };


  $scope.setWallets = function() {
    $scope.wallets = profileService.getWallets();
  };

});
