'use strict';

angular.module('copayApp.controllers').controller('preferencesDeleteWalletController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, storageService, notification, profileService, isCordova, go, gettext, gettextCatalog, animationService) {
    this.isCordova = isCordova;
    this.error = null;
    $scope.isDeletingWallet = false;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');

    var _modalDeleteWallet = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance, gettext) {
        $scope.title = delete_msg;
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close(accept_msg);

        };
        $scope.cancel = function() {
          $modalInstance.dismiss(cancel_msg);
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: animationService.modalAnimated.slideUp,
        controller: ModalInstanceCtrl
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutDown);
      });

      modalInstance.result.then(function(ok) {
        if (ok) {
          $timeout(function() {
            $scope.isDeletingWallet = true;
            _deleteWallet();
          }, 100);
        }
      });
    };

    var _deleteWallet = function() {
      var fc = profileService.focusedClient;
      var name = fc.credentials.walletName;
      var walletName = (fc.alias || '') + ' [' + name + ']';
      var self = this;

      profileService.deleteWalletFC({}, function(err) {
        $scope.isDeletingWallet = false;
        if (err) {
          self.error = err.message || err;
        } else {
          notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {
            walletName: walletName
          }));
          go.walletHome();
        }
      });
    };

    this.deleteWallet = function() {
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              $timeout(function() {
                $scope.isDeletingWallet = true;
                _deleteWallet();
              }, 100);
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet();
      }
    };
  });
