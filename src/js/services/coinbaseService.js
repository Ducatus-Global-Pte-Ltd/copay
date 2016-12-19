'use strict';

angular.module('copayApp.services').factory('coinbaseService', function($http, $log, $window, platformInfo, lodash, storageService, configService) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;
  var isNW = platformInfo.isNW;

  // FAKE DATA
  var isFake = true;

  root.priceSensitivity = [
    {
      value: 0.5,
      name: '0.5%'
    },
    {
      value: 1,
      name: '1%'
    },
    {
      value: 2,
      name: '2%'
    },
    {
      value: 5,
      name: '5%'
    },
    {
      value: 10,
      name: '10%'
    }
  ];
  
  root.selectedPriceSensitivity = root.priceSensitivity[1];

  root.setCredentials = function() {

    if (!$window.externalServices || !$window.externalServices.coinbase) {
      return;
    }

    var coinbase = $window.externalServices.coinbase;

    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    credentials.NETWORK = 'livenet';

    // Coinbase permissions
    credentials.SCOPE = ''
      + 'wallet:accounts:read,'
      + 'wallet:addresses:read,'
      + 'wallet:addresses:create,'
      + 'wallet:user:read,'
      + 'wallet:user:email,'
      + 'wallet:buys:read,'
      + 'wallet:buys:create,'
      + 'wallet:sells:read,'
      + 'wallet:sells:create,'
      + 'wallet:transactions:read,'
      + 'wallet:transactions:send,'
      + 'wallet:payment-methods:read';

    // NW has a bug with Window Object
    if (isCordova && isNW) {
      credentials.REDIRECT_URI = coinbase.redirect_uri.mobile;
    } else {
      credentials.REDIRECT_URI = coinbase.redirect_uri.desktop;
    }

    if (credentials.NETWORK == 'testnet') {
      credentials.HOST = coinbase.sandbox.host;
      credentials.API = coinbase.sandbox.api;
      credentials.CLIENT_ID = coinbase.sandbox.client_id;
      credentials.CLIENT_SECRET = coinbase.sandbox.client_secret;
    }
    else {
      credentials.HOST = coinbase.production.host;
      credentials.API = coinbase.production.api;
      credentials.CLIENT_ID = coinbase.production.client_id;
      credentials.CLIENT_SECRET = coinbase.production.client_secret;
    };
  };

  var _afterTokenReceived = function(data, cb) {
    if (data && data.access_token && data.refresh_token) {
      storageService.setCoinbaseToken(credentials.NETWORK, data.access_token, function() {
        storageService.setCoinbaseRefreshToken(credentials.NETWORK, data.refresh_token, function() {
          return cb(null, data.access_token);
        });
      });
    } else {
      return cb('Could not get the access token');
    }
  };

  root.getEnvironment = function() {
    return credentials.NETWORK;
  };

  root.getOauthCodeUrl = function() {
    // TODO CHANGE LIMIT BACK TO 1000 *************************************************
    return credentials.HOST
      + '/oauth/authorize?response_type=code&client_id='
      + credentials.CLIENT_ID
      + '&redirect_uri='
      + credentials.REDIRECT_URI
      + '&state=SECURE_RANDOM&scope='
      + credentials.SCOPE
      + '&meta[send_limit_amount]=1&meta[send_limit_currency]=USD&meta[send_limit_period]=day';
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: credentials.HOST + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type : 'authorization_code',
        code: code,
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Authorization Access Token: SUCCESS');
      // Show pending task from the UI
      storageService.setNextStep('BuyAndSell', 'true', function(err) {});
      _afterTokenReceived(data.data, cb);
    }, function(data) {
      $log.error('Coinbase Authorization Access Token: ERROR ' + data.statusText);
      return cb(data.data || 'Could not get the access token');
    });
  };

  var _refreshToken = function(refreshToken, cb) {
    var req = {
      method: 'POST',
      url: credentials.HOST + '/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type : 'refresh_token',
        client_id : credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI,
        refresh_token: refreshToken
      }
    };

    $http(req).then(function(data) {
      $log.info('Coinbase Refresh Access Token: SUCCESS');
      _afterTokenReceived(data.data, cb);
    }, function(data) {
      $log.error('Coinbase Refresh Access Token: ERROR ' + data.statusText);
      return cb(data.data || 'Could not get the access token');
    });
  };

  var _getMainAccountId = function(accessToken, cb) {
    root.getAccounts(accessToken, function(err, a) {
      if (err) return cb(err);
      var data = a.data;
      for (var i = 0; i < data.length; i++) {
        if (data[i].primary && data[i].type == 'wallet') {
          return cb(null, data[i].id);
        }
      }
      coinbaseService.logout(function() {});
      return cb('Your primary account should be a WALLET. Set your wallet account as primary and try again');
    });
  };

  root.init = function(cb) {
    if (lodash.isEmpty(credentials.CLIENT_ID)) {
      return cb('Coinbase is Disabled');
    }
    $log.debug('Init Token...');

    storageService.getCoinbaseToken(credentials.NETWORK, function(err, accessToken) {
      if (err || !accessToken) return cb();
      else {
        _getMainAccountId(accessToken, function(err, accountId) {
          if (err) {
            if (err.errors && err.errors[0] && err.errors[0].id == 'expired_token') {
              $log.debug('Refresh token');
              storageService.getCoinbaseRefreshToken(credentials.NETWORK, function(err, refreshToken) {
                if (err) return cb(err);
                _refreshToken(refreshToken, function(err, newToken) {
                  if (err) return cb(err);
                  _getMainAccountId(newToken, function(err, accountId) {
                    if (err) return cb(err);
                    return cb(null, {accessToken: newToken, accountId: accountId});
                  });
                });
              });
            } else {
              return cb(err);
            }
          } else {
            return cb(null, {accessToken: accessToken, accountId: accountId});
          }
        });
      }
    });
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccounts = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts', token)).then(function(data) {
      $log.info('Coinbase Get Accounts: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Accounts: ERROR ' + data.statusText);
      return cb(data.data || 'Could not get the accounts');
    });
  };

  root.getAccount = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId, token)).then(function(data) {
      $log.info('Coinbase Get Account: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Account: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getAuthorizationInformation = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/auth', token)).then(function(data) {
      $log.info('Coinbase Autorization Information: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Autorization Information: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getCurrentUser = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user', token)).then(function(data) {
      $log.info('Coinbase Get Current User: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Current User: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransaction = function(token, accountId, transactionId, cb) {
    if (isFake) return cb(null, get_transaction);
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions/' + transactionId, token)).then(function(data) {
      $log.info('Coinbase Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transaction: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getTransactions = function(token, accountId, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/accounts/' + accountId + '/transactions', token)).then(function(data) {
      $log.info('Coinbase Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.paginationTransactions = function(token, Url, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get(Url.replace('/v2', ''), token)).then(function(data) {
      $log.info('Coinbase Pagination Transactions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Pagination Transactions: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellPrice = function(token, currency, cb) {
    $http(_get('/prices/sell?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Sell Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Sell Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyPrice = function(token, currency, cb) {
    $http(_get('/prices/buy?currency=' + currency, token)).then(function(data) {
      $log.info('Coinbase Buy Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Buy Price: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethods = function(token, cb) {
    if (isFake) return cb(null, payment_methods);
    $http(_get('/payment-methods', token)).then(function(data) {
      $log.info('Coinbase Get Payment Methods: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Payment Methods: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.getPaymentMethod = function(token, paymentMethodId, cb) {
    $http(_get('/payment-methods/' + paymentMethodId, token)).then(function(data) {
      $log.info('Coinbase Get Payment Method: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Get Payment Method: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  var _post = function(endpoint, token, data) {
    return {
      method: 'POST',
      url: credentials.API + '/v2' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      data: data
    };
  };

  root.sellRequest = function(token, accountId, data, cb) {
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: data.commit || false
    };
    $http(_post('/accounts/' + accountId + '/sells', token, data)).then(function(data) {
      $log.info('Coinbase Sell Request: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Sell Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sellCommit = function(token, accountId, sellId, cb) {
    $http(_post('/accounts/' + accountId + '/sells/' + sellId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Sell Commit: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Sell Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyRequest = function(token, accountId, data, cb) {
    if (isFake) return cb(null, buy_request);
    var data = {
      amount: data.amount,
      currency: data.currency,
      payment_method: data.payment_method || null,
      commit: false
    };
    $http(_post('/accounts/' + accountId + '/buys', token, data)).then(function(data) {
      $log.info('Coinbase Buy Request: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Buy Request: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.buyCommit = function(token, accountId, buyId, cb) {
    if (isFake) return cb(null, buy_commit);
    $http(_post('/accounts/' + accountId + '/buys/' + buyId + '/commit', token)).then(function(data) {
      $log.info('Coinbase Buy Commit: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Buy Commit: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.createAddress = function(token, accountId, data, cb) {
    var data = {
      name: data.name
    };
    $http(_post('/accounts/' + accountId + '/addresses', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  root.sendTo = function(token, accountId, data, cb) {
    if (isFake) return cb(null, send_to_copay);
    var data = {
      type: 'send',
      to: data.to,
      amount: data.amount,
      currency: data.currency,
      description: data.description
    };
    $http(_post('/accounts/' + accountId + '/transactions', token, data)).then(function(data) {
      $log.info('Coinbase Create Address: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Coinbase Create Address: ERROR ' + data.statusText);
      return cb(data.data);
    });
  };

  // Pending transactions
  
  root.savePendingTransaction = function(ctx, opts, cb) {
    _savePendingTransaction(ctx, opts, cb);
  };

  var _savePendingTransaction = function(ctx, opts, cb) {
    storageService.getCoinbaseTxs(credentials.NETWORK, function(err, oldTxs) {
      if (lodash.isString(oldTxs)) {
        oldTxs = JSON.parse(oldTxs);
      }
      if (lodash.isString(ctx)) {
        ctx = JSON.parse(ctx);
      }
      var tx = oldTxs || {};
      tx[ctx.id] = ctx;
      if (opts && (opts.error || opts.status)) {
        tx[ctx.id] = lodash.assign(tx[ctx.id], opts);
      }
      if (opts && opts.remove) {
        delete(tx[ctx.id]);
      }
      tx = JSON.stringify(tx);

      storageService.setCoinbaseTxs(credentials.NETWORK, tx, function(err) {
        return cb(err);
      });
    });
  };

  root.getPendingTransactions = function(accessToken, accountId, cb) {
    var coinbasePendingTransactions;
    storageService.getCoinbaseTxs(credentials.NETWORK, function(err, txs) {
      txs = txs ? JSON.parse(txs) : {};
      coinbasePendingTransactions = lodash.isEmpty(txs) ? null : txs;
      lodash.forEach(coinbasePendingTransactions, function(dataFromStorage, txId) {
        if ((dataFromStorage.type == 'sell' && dataFromStorage.status == 'completed') ||
          (dataFromStorage.type == 'buy' && dataFromStorage.status == 'completed') ||
          dataFromStorage.status == 'error' ||
          (dataFromStorage.type == 'send' && dataFromStorage.status == 'completed')) 
          return cb(null, coinbasePendingTransactions);
        root.getTransaction(accessToken, accountId, txId, function(err, tx) {
          if (err) {
            _savePendingTransaction(dataFromStorage, {
              status: 'error',
              error: err
            }, function(err) {
              if (err) $log.debug(err);
            });
            return cb(err);
          }
          _updateCoinbasePendingTransactions(dataFromStorage, tx.data);
          coinbasePendingTransactions[txId] = dataFromStorage;
          if (tx.data.type == 'send' && tx.data.status == 'completed' && tx.data.from) {
            root.sellPrice(accessToken, dataFromStorage.sell_price_currency, function(err, s) {
              if (err) {
                _savePendingTransaction(dataFromStorage, {
                  status: 'error',
                  error: err
                }, function(err) {
                  if (err) $log.debug(err);
                });
                return cb(err);
              }
              var newSellPrice = s.data.amount;
              var variance = Math.abs((newSellPrice - dataFromStorage.sell_price_amount) / dataFromStorage.sell_price_amount * 100);
              if (variance < dataFromStorage.price_sensitivity.value) {
                _sellPending(tx.data, accessToken, accountId);
              } else {
                var error = {
                  errors: [{
                    message: 'Price falls over the selected percentage'
                  }]
                };
                _savePendingTransaction(dataFromStorage, {
                  status: 'error',
                  error: error
                }, function(err) {
                  if (err) $log.debug(err);
                });
              }
            });
          } else if (tx.data.type == 'buy' && tx.data.status == 'completed' && tx.data.buy) {
            _sendToCopay(dataFromStorage, accessToken, accountId);
          } else {
            _savePendingTransaction(dataFromStorage, {}, function(err) {
              if (err) $log.debug(err);
            });
          }
          return cb(null, coinbasePendingTransactions);
        });
      });
    });
  };

  var _sellPending = function(tx, accessToken, accountId) {
    if (!tx) return;
    var data = tx.amount;
    data['commit'] = true;
    root.sellRequest(accessToken, accountId, data, function(err, res) {
      if (err) {
        _savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, function(err) {
          if (err) $log.debug(err);
        });
      } else {
        if (!res.data.transaction) {
          _savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, function(err) {
            if (err) $log.debug(err);
          });
          return;
        }
        _savePendingTransaction(tx, {
          remove: true
        }, function(err) {
          root.getTransaction(accessToken, accountId, res.data.transaction.id, function(err, updatedTx) {
            _savePendingTransaction(updatedTx.data, {}, function(err) {
              if (err) $log.debug(err);
            });
          });
        });
      }
    });
  };

  var _sendToCopay = function(tx, accessToken, accountId) {
    if (!tx) return;
    var data = {
      to: tx.toAddr,
      amount: tx.amount.amount,
      currency: tx.amount.currency,
      description: 'To Copay Wallet'
    };
    root.sendTo(accessToken, accountId, data, function(err, res) {
      if (err) {
        _savePendingTransaction(tx, {
          status: 'error',
          error: err
        }, function(err) {
          if (err) $log.debug(err);
        });
      } else {
        if (!res.data.id) {
          _savePendingTransaction(tx, {
            status: 'error',
            error: err
          }, function(err) {
            if (err) $log.debug(err);
          });
          return;
        }
        root.getTransaction(accessToken, accountId, res.data.id, function(err, sendTx) {
          _savePendingTransaction(tx, {
            remove: true
          }, function(err) {
            _savePendingTransaction(sendTx.data, {}, function(err) {
              // TODO
            });
          });
        });
      }
    });
  };

  var _updateCoinbasePendingTransactions = function(obj /*, …*/ ) {
    for (var i = 1; i < arguments.length; i++) {
      for (var prop in arguments[i]) {
        var val = arguments[i][prop];
        if (typeof val == "object")
          _updateCoinbasePendingTransactions(obj[prop], val);
        else
          obj[prop] = val ? val : obj[prop];
      }
    }
    return obj;
  };

  root.logout = function(cb) {
    storageService.removeCoinbaseToken(credentials.NETWORK, function() {
      storageService.removeCoinbaseRefreshToken(credentials.NETWORK, function() {
        return cb();
      });
    });
  };

  var buy_request = {
    "data" : {
      "id": "a333743d-184a-5b5b-abe8-11612fc44ab5",
      "status": "created",
      "payment_method": {
        "id": "83562370-3e5c-51db-87da-752af5ab9559",
        "resource": "payment_method",
        "resource_path": "/v2/payment-methods/83562370-3e5c-51db-87da-752af5ab9559"
      },
      "transaction": {
        "id": "763d1401-fd17-5a18-852a-9cca5ac2f9c0",
        "resource": "transaction",
        "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/transactions/441b9494-b3f0-5b98-b9b0-4d82c21c252a"
      },
      "amount": {
        "amount": "10.00000000",
        "currency": "BTC"
      },
      "total": {
        "amount": "102.01",
        "currency": "USD"
      },
      "subtotal": {
        "amount": "101.00",
        "currency": "USD"
      },
      "created_at": "2015-04-01T18:43:37-07:00",
      "updated_at": "2015-04-01T18:43:37-07:00",
      "resource": "buy",
      "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/buys/a333743d-184a-5b5b-abe8-11612fc44ab5",
      "committed": false,
      "instant": false,
      "fee": {
        "amount": "1.01",
        "currency": "USD"
      },
      "payout_at": "2015-04-07T18:43:37-07:00"
    }
  };

  var payment_methods = {
    "pagination": {
      "ending_before": null,
      "starting_after": null,
      "limit": 25,
      "order": "desc",
      "previous_uri": null,
      "next_uri": null
    },
    "data": [
      {
        "id": "127b4d76-a1a0-5de7-8185-3657d7b526ec",
        "type": "fiat_account",
        "name": "USD Wallet",
        "currency": "USD",
        "primary_buy": false,
        "primary_sell": false,
        "allow_buy": true,
        "allow_sell": true,
        "allow_deposit": true,
        "allow_withdraw": true,
        "instant_buy": true,
        "instant_sell": true,
        "created_at": "2015-02-24T14:30:30-08:00",
        "updated_at": "2015-02-24T14:30:30-08:00",
        "resource": "payment_method",
        "resource_path": "/v2/payment-methods/127b4d76-a1a0-5de7-8185-3657d7b526ec",
        "fiat_account": {
          "id": "a077fff9-312b-559b-af98-146c33e27388",
          "resource": "account",
          "resource_path": "/v2/accounts/a077fff9-312b-559b-af98-146c33e27388"
        }
      },
      {
        "id": "83562370-3e5c-51db-87da-752af5ab9559",
        "type": "ach_bank_account",
        "name": "International Bank *****1111",
        "currency": "USD",
        "primary_buy": true,
        "primary_sell": true,
        "allow_buy": true,
        "allow_sell": true,
        "allow_deposit": true,
        "allow_withdraw": true,
        "instant_buy": false,
        "instant_sell": false,
        "created_at": "2015-01-31T20:49:02Z",
        "updated_at": "2015-02-11T16:53:57-08:00",
        "resource": "payment_method",
        "resource_path": "/v2/payment-methods/83562370-3e5c-51db-87da-752af5ab9559"
      }
    ]
  };

  var get_transaction = {
    "data" : {
      "id": "57ffb4ae-0c59-5430-bcd3-3f98f797a66c",
      "type": "send",
      "status": "completed",
      "amount": {
        "amount": "-0.00100000",
        "currency": "BTC"
      },
      "native_amount": {
        "amount": "-0.01",
        "currency": "USD"
      },
      "description": null,
      "created_at": "2015-03-11T13:13:35-07:00",
      "updated_at": "2015-03-26T15:55:43-07:00",
      "resource": "transaction",
      "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/transactions/57ffb4ae-0c59-5430-bcd3-3f98f797a66c",
      "network": {
        "status": "off_blockchain",
        "name": "bitcoin"
      },
      "to": {
        "id": "a6b4c2df-a62c-5d68-822a-dd4e2102e703",
        "resource": "user",
        "resource_path": "/v2/users/a6b4c2df-a62c-5d68-822a-dd4e2102e703"
      },
      "details": {
        "title": "Send bitcoin",
        "subtitle": "to User 2"
      }
    }
  };

  var buy_commit = {
    "data" : {
      "id": "a333743d-184a-5b5b-abe8-11612fc44ab5",
      "status": "created",
      "payment_method": {
        "id": "83562370-3e5c-51db-87da-752af5ab9559",
        "resource": "payment_method",
        "resource_path": "/v2/payment-methods/83562370-3e5c-51db-87da-752af5ab9559"
      },
      "transaction": {
        "id": "763d1401-fd17-5a18-852a-9cca5ac2f9c0",
        "resource": "transaction",
        "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/transactions/441b9494-b3f0-5b98-b9b0-4d82c21c252a"
      },
      "amount": {
        "amount": "10.00000000",
        "currency": "BTC"
      },
      "total": {
        "amount": "102.01",
        "currency": "USD"
      },
      "subtotal": {
        "amount": "101.00",
        "currency": "USD"
      },
      "created_at": "2015-04-01T18:43:37-07:00",
      "updated_at": "2015-04-01T18:43:37-07:00",
      "resource": "buy",
      "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/buys/a333743d-184a-5b5b-abe8-11612fc44ab5",
      "committed": true,
      "instant": false,
      "fee": {
        "amount": "1.01",
        "currency": "USD"
      },
      "payout_at": "2015-04-07T18:43:37-07:00"
    }
  };

  var send_to_copay = {
    "data" : {
      "id": "3c04e35e-8e5a-5ff1-9155-00675db4ac02",
      "type": "send",
      "status": "pending",
      "amount": {
        "amount": "-0.10000000",
        "currency": "BTC"
      },
      "native_amount": {
        "amount": "-1.00",
        "currency": "USD"
      },
      "description": null,
      "created_at": "2015-01-31T20:49:02Z",
      "updated_at": "2015-03-31T17:25:29-07:00",
      "resource": "transaction",
      "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/transactions/3c04e35e-8e5a-5ff1-9155-00675db4ac02",
      "network": {
        "status": "unconfirmed",
        "hash": "463397c87beddd9a61ade61359a13adc9efea26062191fe07147037bce7f33ed",
        "name": "bitcoin"
      },
      "to": {
        "resource": "bitcoin_address",
        "address": "1AUJ8z5RuHRTqD1eikyfUUetzGmdWLGkpT"
      },
      "details": {
        "title": "Send bitcoin",
        "subtitle": "to User 2"
      }
    }
  };

  return root;

});
