'use strict';

angular.module('copayApp.services').factory('glideraService', function($http, $log, $window, platformInfo, storageService, buyAndSellService, lodash) {
  var root = {};
  var credentials = {};
  var isCordova = platformInfo.isCordova;
  var isWindowsPhoneApp = platformInfo.isWP && platformInfo.isCordova;

  var setCredentials = function() {
    if (!$window.externalServices || !$window.externalServices.glidera) {
      return;
    }

    var glidera = $window.externalServices.glidera;

    /*
     * Development: 'testnet'
     * Production: 'livenet'
     */
    credentials.NETWORK = 'livenet';
    //credentials.NETWORK = 'testnet';

    if (credentials.NETWORK == 'testnet') {
      credentials.HOST = glidera.sandbox.host;
      if (isCordova) {
        credentials.REDIRECT_URI = glidera.sandbox.mobile.redirect_uri;
        credentials.CLIENT_ID = glidera.sandbox.mobile.client_id;
        credentials.CLIENT_SECRET = glidera.sandbox.mobile.client_secret;
      } else {
        credentials.REDIRECT_URI = glidera.sandbox.desktop.redirect_uri;
        credentials.CLIENT_ID = glidera.sandbox.desktop.client_id;
        credentials.CLIENT_SECRET = glidera.sandbox.desktop.client_secret;
      }
    } else {
      credentials.HOST = glidera.production.host;
      if (isCordova) {
        credentials.REDIRECT_URI = glidera.production.mobile.redirect_uri;
        credentials.CLIENT_ID = glidera.production.mobile.client_id;
        credentials.CLIENT_SECRET = glidera.production.mobile.client_secret;
      } else {
        credentials.REDIRECT_URI = glidera.production.desktop.redirect_uri;
        credentials.CLIENT_ID = glidera.production.desktop.client_id;
        credentials.CLIENT_SECRET = glidera.production.desktop.client_secret;
      }
    };
  };

  root.getNetwork = function() {
    return credentials.NETWORK;
  };

  root.getSignupUrl = function() {
    return credentials.HOST + '/register';
  }

  root.getSupportUrl = function() {
    return 'https://twitter.com/GlideraInc';
  }

  root.getOauthCodeUrl = function() {
    return credentials.HOST + '/oauth2/auth?response_type=code&client_id=' + credentials.CLIENT_ID + '&redirect_uri=' + credentials.REDIRECT_URI;
  };

  root.remove = function(cb) {
    storageService.removeGlideraToken(credentials.NETWORK, function() {
      storageService.removeGlideraPermissions(credentials.NETWORK, function() {
        storageService.removeGlideraStatus(credentials.NETWORK, function() {
          buyAndSellService.updateLink('glidera', false);
          return cb();
        });
      });
    });
  };

  root.getToken = function(code, cb) {
    var req = {
      method: 'POST',
      url: credentials.HOST + '/api/v1/oauth/token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        grant_type: 'authorization_code',
        code: code,
        client_id: credentials.CLIENT_ID,
        client_secret: credentials.CLIENT_SECRET,
        redirect_uri: credentials.REDIRECT_URI
      }
    };

    $http(req).then(function(data) {
      $log.info('Glidera Authorization Access Token: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Authorization Access Token: ERROR ' + data.statusText);
      return cb('Glidera Authorization Access Token: ERROR ' + data.statusText);
    });
  };

  root.authorize = function(code, cb) {
    root.getToken(code, function(err, data) {
      if (err) return cb(err);
      if (data && !data.access_token) return cb('No access token');
      var accessToken = data.access_token;
      root.getAccessTokenPermissions(accessToken, function(err, p) {
        if (err) return cb(err);
        root.getStatus(accessToken, function(err, status) {
          if (err) $log.error(err);
          storageService.setGlideraToken(credentials.NETWORK, accessToken, function() {
            storageService.setGlideraPermissions(credentials.NETWORK, JSON.stringify(p), function() {
              storageService.setGlideraStatus(credentials.NETWORK, JSON.stringify(status), function() {
                return cb(null, {
                  token: accessToken,
                  permissions: p,
                  status: status
                });
              });
            });
          });
        });
      });
    }); 
  };

  var _get = function(endpoint, token) {
    return {
      method: 'GET',
      url: credentials.HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
  };

  root.getAccessTokenPermissions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/oauth/token', token)).then(function(data) {
      $log.info('Glidera Access Token Permissions: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Access Token Permissions: ERROR ' + data.statusText);
      return cb('Glidera Access Token Permissions: ERROR ' + data.statusText);
    });
  };

  root.getEmail = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/email', token)).then(function(data) {
      $log.info('Glidera Get Email: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Email: ERROR ' + data.statusText);
      return cb('Glidera Get Email: ERROR ' + data.statusText);
    });
  };

  root.getPersonalInfo = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/personalinfo', token)).then(function(data) {
      $log.info('Glidera Get Personal Info: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Get Personal Info: ERROR ' + data.statusText);
      return cb('Glidera Get Personal Info: ERROR ' + data.statusText);
    });
  };

  root.getStatus = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/status', token)).then(function(data) {
      $log.info('Glidera User Status: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera User Status: ERROR ' + data.statusText);
      return cb('Glidera User Status: ERROR ' + data.statusText);
    });
  };

  root.getLimits = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/limits', token)).then(function(data) {
      $log.info('Glidera Transaction Limits: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction Limits: ERROR ' + data.statusText);
      return cb('Glidera Transaction Limits: ERROR ' + data.statusText);
    });
  };

  root.getTransactions = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/transaction', token)).then(function(data) {
      $log.info('Glidera Transactions: SUCCESS');
      return cb(null, data.data.transactions);
    }, function(data) {
      $log.error('Glidera Transactions: ERROR ' + data.statusText);
      return cb('Glidera Transactions: ERROR ' + data.statusText);
    });
  };

  root.getTransaction = function(token, txid, cb) {
    if (!token) return cb('Invalid Token');
    if (!txid) return cb('TxId required');
    $http(_get('/transaction/' + txid, token)).then(function(data) {
      $log.info('Glidera Transaction: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Transaction: ERROR ' + data.statusText);
      return cb('Glidera Transaction: ERROR ' + data.statusText);
    });
  };

  root.getSellAddress = function(token, cb) {
    if (!token) return cb('Invalid Token');
    $http(_get('/user/create_sell_address', token)).then(function(data) {
      $log.info('Glidera Create Sell Address: SUCCESS');
      return cb(null, data.data.sellAddress);
    }, function(data) {
      $log.error('Glidera Create Sell Address: ERROR ' + data.statusText);
      return cb('Glidera Create Sell Address: ERROR ' + data.statusText);
    });
  };

  root.get2faCode = function(token, cb) {
    if (!token) {
      $log.error('Glidera Sent 2FA code by SMS: ERROR Invalid Token');
      return cb('Invalid Token');
    }

    $http(_get('/authentication/get2faCode', token)).then(function(data) {

      $log.info('Glidera Sent 2FA code by SMS: SUCCESS');
      return cb(null, data.status == 200 ? true : false);
    }, function(data) {
      $log.error('Glidera Sent 2FA code by SMS: ERROR ' + data.statusText);
      return cb('Glidera Sent 2FA code by SMS: ERROR ' + data.statusText);
    });
  };

  var _post = function(endpoint, token, twoFaCode, data) {
    return {
      method: 'POST',
      url: credentials.HOST + '/api/v1' + endpoint,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token,
        '2FA_CODE': twoFaCode
      },
      data: data
    };
  };

  root.sellPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/sell', token, null, data)).then(function(data) {
      $log.info('Glidera Sell Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Sell Price: ERROR ' + data.statusText);
      return cb('Glidera Sell Price: ERROR ' + data.statusText);
    });
  };

  root.sell = function(token, twoFaCode, data, cb) {
    var data = {
      refundAddress: data.refundAddress,
      signedTransaction: data.signedTransaction,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/sell', token, twoFaCode, data)).then(function(data) {
      $log.info('Glidera Sell: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Sell Request: ERROR ' + data.statusText);
      return cb('Glidera Sell Request: ERROR ' + data.statusText);
    });
  };

  root.buyPrice = function(token, price, cb) {
    var data = {
      qty: price.qty,
      fiat: price.fiat
    };
    $http(_post('/prices/buy', token, null, data)).then(function(data) {
      $log.info('Glidera Buy Price: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Buy Price: ERROR ' + data.statusText);
      return cb('Glidera Buy Price: ERROR ' + data.statusText);
    });
  };

  root.buy = function(token, twoFaCode, data, cb) {
    var data = {
      destinationAddress: data.destinationAddress,
      qty: data.qty,
      priceUuid: data.priceUuid,
      useCurrentPrice: data.useCurrentPrice,
      ip: data.ip
    };
    $http(_post('/buy', token, twoFaCode, data)).then(function(data) {
      $log.info('Glidera Buy: SUCCESS');
      return cb(null, data.data);
    }, function(data) {
      $log.error('Glidera Buy Request: ERROR ' + data.statusText);
      return cb('Glidera Buy Request: ERROR ' + data.statusText);
    });
  };

  root.init = function(cb) {
    if (lodash.isEmpty(credentials.CLIENT_ID)) {
      return cb('Glidera is Disabled');
    }
    $log.debug('Trying to initialise Glidera...');

    storageService.getGlideraToken(credentials.NETWORK, function(err, accessToken) {
      if (err || lodash.isEmpty(accessToken)) return cb();
        
      storageService.getGlideraPermissions(credentials.NETWORK, function(err, permissions) {
        if (lodash.isString(permissions)) permissions = JSON.parse(permissions);
        storageService.getGlideraStatus(credentials.NETWORK, function(err, status) {
          if (lodash.isString(status)) status = JSON.parse(status);
          buyAndSellService.updateLink('glidera', true);
          return cb(null, {
            token: accessToken,
            permissions: permissions,
            status: status
          });
        });
      });
    });
  };

  root.updateStatus = function(data) {
    storageService.getGlideraToken(credentials.NETWORK, function(err, accessToken) {
      if (err) return;
      root.getAccessTokenPermissions(accessToken, function(err, permissions) {
        if (err) return;
        storageService.setGlideraPermissions(credentials.NETWORK, JSON.stringify(permissions), function() {});
        data.permissions = permissions;
        root.getStatus(accessToken, function(err, status) {
          data.status = status;
          storageService.setGlideraStatus(credentials.NETWORK, JSON.stringify(status), function() {});
          
          root.getLimits(accessToken, function(err, limits) {
            data.limits = limits;
            
            if (permissions.transaction_history) {
              root.getTransactions(accessToken, function(err, txs) {
                data.txs = txs;
              });
            }

            if (permissions.view_email_address) {
              root.getEmail(accessToken, function(err, email) {
                data.email = email;
              });
            }
            if (permissions.personal_info) {
              root.getPersonalInfo(accessToken, function(err, info) {
                data.personalInfo = info;
              });
            }
          }); 
        }); 
      }); 
    }); 
  };

  var register = function() {
    if (isWindowsPhoneApp) return;

    storageService.getGlideraToken(credentials.NETWORK, function(err, token) {
      if (err) return cb(err);

      buyAndSellService.register({
        name: 'glidera',
        logo: 'img/glidera-logo.png',
        location: 'US Only',
        sref: 'tabs.buyandsell.glidera',
        configSref: 'tabs.preferences.glidera',
        linked: !!token,
      });
    });
  };

  setCredentials();
  register();
  return root;
});
