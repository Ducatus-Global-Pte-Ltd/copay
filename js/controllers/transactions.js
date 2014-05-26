'use strict';

angular.module('copay.transactions').controller('TransactionsController',
  function($scope, $rootScope, $timeout, controllerUtils) {

    $scope.title = 'Transactions';
    $scope.loading = false;
    $scope.onlyPending = true;
    $scope.lastShowed = false;

    $scope.txpCurrentPage = 1;
    $scope.txpItemsPerPage = 4;

    $scope.update = function () {
      $scope.loading = false;
      var from = ($scope.txpCurrentPage-1) * $scope.txpItemsPerPage;
      var opts = {
        onlyPending: $scope.onlyPending,
        skip: !$scope.onlyPending ? [from, from + $scope.txpItemsPerPage] : null
      };
      controllerUtils.updateTxs(opts);
      $rootScope.$digest();
    };

    $scope.show = function (onlyPending) {
      $scope.loading=true;
      $scope.onlyPending = onlyPending;
      setTimeout(function(){
        $scope.update();
      }, 10);
    };

    $scope.toogleLast = function () {
      $scope.loading = true;
      $scope.lastShowed = !$scope.lastShowed;
      if ($scope.lastShowed) {
        $scope.getTransactions(function(txs){
          $timeout(function() {
            $scope.loading = false;
            $scope.blockchain_txs = txs;
            $scope.$digest();
          }, 10);
        });
      } else {
        $timeout(function(){
          $scope.loading = false;
          $rootScope.$digest();
        }, 10);
      }
    };

    $scope.send = function (ntxid,cb) {
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      var w = $rootScope.wallet;
      w.sendTx(ntxid, function(txid) {
          console.log('[transactions.js.68:txid:] SENTTX CALLBACK',txid); //TODO
          $rootScope.$flashMessage = txid
            ? {type:'success', message: 'Transaction broadcasted. txid: ' + txid}
            : {type:'error', message: 'There was an error sending the Transaction'}
            ;
          if (cb) return cb();
          else $scope.update();
      });
    };

    $scope.sign = function (ntxid) {
      $scope.loading = true;
      var w = $rootScope.wallet;
      w.sign(ntxid, function(ret){
        if (!ret) {
          $rootScope.$flashMessage = {
            type:'error',
            message: 'There was an error signing the Transaction',
          };
            $scope.update();
        } else {
          var p = w.txProposals.getTxProposal(ntxid);
          if (p.builder.isFullySigned()) {
            $scope.send(ntxid, function() {
              $scope.update();
            });
          }
          else 
            $scope.update();
        }
      });
    };

    $scope.getTransactions = function(cb) {
      var w   =$rootScope.wallet;
      if (w) {
        console.log('### Querying last transactions...'); //TODO
        var addresses = w.getAddressesStr();
        if (addresses.length > 0) {
          return w.blockchain.getTransactions(addresses, cb);
        }
      }
      return cb();
    };

    $scope.getShortNetworkName = function() {
      return config.networkName.substring(0,4);
    };

    $scope.reject = function (ntxid) {
      $scope.loading = true;
      $rootScope.txAlertCount = 0;
      var w = $rootScope.wallet;
      w.reject(ntxid);
      $rootScope.$flashMessage = {type:'warning', message: 'Transaction rejected by you'};
      $scope.loading = false;
    };

  });
