'use strict';


var _ = require('lodash');
var chai = chai || require('chai');
var sinon = sinon || require('sinon');
var should = chai.should();
var crypto = require('../js/util/crypto.js');

describe('cryptoUtil', function() {
  it('should generate a passphrase similar to v0.6.3',function(){

    // This test case was generated with CrytoJS
    var test = {
      salt: 'mjuBtGybi/4=',
      iterations: 10,
      phraseHex: '2283fe11b9a189b82f1c09200806920cbdd8ef752f53dea910f90ab526f441acdbd5128555647a7e390a1a9fea042226963ccd0f7851030b3d6e282ccebaa17e',
      phraseBase64: 'IoP+EbmhibgvHAkgCAaSDL3Y73UvU96pEPkKtSb0Qazb1RKFVWR6fjkKGp/qBCImljzND3hRAws9bigszrqhfg==',
    };

    var pass = '123456';
    var phrase = crypto.kdf(pass, null, test.salt, test.iterations);
    phrase.should.equal(test.phraseBase64);
  });

  it('should generate a passphrase similar to v0.6.3 case 2',function(){

    // This test case was generated with CrytoJS
    var test = {
      salt: 'mjuBtGybi/4=',
      iterations: 100,
      phraseBase64: legacyPassphrase,
    };

    var phrase = crypto.kdf(legacyPassword, null, test.salt, test.iterations);
    phrase.should.equal(test.phraseBase64);
  });



  it('should be able to decrypt an old backup',function(){

    var wo = crypto.decrypt(legacyPassword, encryptedLegacy1);
console.log('[cryptoUtil.js.43:wo:]',wo); //TODO
    should.exist(wo);
    wo.opts.id.should.equal('48ba2f1ffdfe9708');
    wo.opts.spendUnconfirmed.should.equal(true);
    wo.opts.requiredCopayers.should.equal(1);
    wo.opts.totalCopayers.should.equal(1);
    wo.opts.name.should.equal('pepe wallet');
    wo.opts.version.should.equal('0.4.7');
    wo.publicKeyRing.walletId.should.equal('48ba2f1ffdfe9708');
    wo.publicKeyRing.networkName.should.equal('testnet');
    wo.publicKeyRing.requiredCopayers.should.equal(1);
    wo.publicKeyRing.totalCopayers.should.equal(1);
    wo.publicKeyRing.indexes.length.should.equal(2);
    JSON.stringify(wo.publicKeyRing.indexes[0]).should.equal('{"copayerIndex":2147483647,"changeIndex":0,"receiveIndex":1}');
    JSON.stringify(wo.publicKeyRing.indexes[1]).should.equal('{"copayerIndex":0,"changeIndex":0,"receiveIndex":1}');
    wo.publicKeyRing.copayersBackup.length.should.equal(1);
    wo.publicKeyRing.copayersBackup[0].should.equal('0298f65b2694c55f9048bc05f10368242727c7f9d2065cbd788c3ecde1ec57f33f');
    wo.publicKeyRing.copayersExtPubKeys.length.should.equal(1);
    wo.publicKeyRing.copayersExtPubKeys[0].should.equal('tpubD9SGoP7CXsqSKTiQxCZSCpicDcophqnE4yuqjfw5M9tAR3fSjT9GDGwPEUFCN7SSmRKGDLZgKQePYFaLWyK32akeSan45TNTd8sgef9Ymh6');
    wo.privateKey.extendedPrivateKeyString.should.equal('tprv8ZgxMBicQKsPfQCscb7CtJKzixxcVSyrCVcfr3WCFbtT8kYTzNubhjQ5R7AuYJgPCcSH4R8T34YVxeohKGhAB9wbB4eFBbQFjUpjGCqptHm');
    wo.privateKey.networkName.should.equal('testnet');
  });

});
 

var legacyPassword = '1';
var legacyPassphrase = '1DUpLRbuVpgLkcEY8gY8iod/SmA7+OheGZJ9PtvmTlvNE0FkEWpCKW9STdzXYJqbn0wiAapE4ojHNYj2hjYYAQ==';
var encryptedLegacy1 = 'U2FsdGVkX19yGM1uBAIzQa8Po/dvUicmxt1YyRk/S97PcZ6I6rHMp9dMagIrehg4Qd6JHn/ustmFHS7vmBYj0EBpf6rdXiQezaWnVAJS9/xYjAO36EFUbl+NmUanuwujAxgYdSP/sNssRLeInvExmZYW993EEclxkwL6YUyX66kKsxGQo2oWng0NreBJNhFmrbOEWeFje2PiWP57oUjKsurFzwpluAAarUTYSLud+nXeabC7opzOP5yqniWBMJz0Ou8gpNCWCMhG/P9F9ccVPY7juyd0Hf41FVse8nd2++axKB57+paozLdO+HRfV6zkMqC3h8gWY7LkS75j3bvqcTw9LhXmzE0Sz21n9yDnRpA4chiAvtwQvvBGgj1pFMKhNQU6Obac9ZwKYzUTgdDn3Uzg1UlDzgyOh9S89rbRTV84WB+hXwhuVluWzbNNYV3vXe5PFrocVktIrtS3xQh+k/7my4A6/gRRrzNYpKrUASJqDS/9u9WBkG35xD63J/qXjtG2M0YPwbI57BK1IK4K510b8V72lz5U2XQrIC4ldBwni1rpSavwCJV9xF6hUdOmNV8fZsVHP0NeN1PYlLkSb2QgfuoWnkcsJerwuFR7GZC/i6efrswtpO0wMEQr/J0CLbeXlHAru6xxjCBhWoJvZpMGw72zgnDLoyMNsEVglNhx/VlV9ZMYkkdaEYAxPOEIyZdQ5MS+2jEAlXf818n/xzJSVrniCn9be8EPePvkw35pivprvy09vbW4cKsWBKvgIyoT6A3OhUOCCS8E9cg0WAjjav2EymrbKmGWRHaiD+EoJqaDg6s20zhHn1YEa/YwvGGSB5+Hg8baLHD8ZASvxz4cFFAAVZrBUedRFgHzqwaMUlFXLgueivWUj7RXlIw6GuNhLoo1QkhZMacf23hrFxxQYvGBRw1hekBuDmcsGWljA28udBxBd5f9i+3gErttMLJ6IPaud590uvrxRIclu0Sz9R2EQX64YJxqDtLpMY0PjddSMu8vaDRpK9/ZSrnz/xrXsyabaafz4rE/ItFXjwFUFkvtmuauHTz6nmuKjVfxvNLNAiKb/gI7vQyUhnTbKIApe7XyJsjedNDtZqsPoJRIzdDmrZYxGStbAZ7HThqFJlSJ9NPNhH+E2jm3TwL5mwt0fFZ5h+p497lHMtIcKffESo7KNa2juSVNMDREk0NcyxGXGiVB2FWl4sLdvyhcsVq0I7tmW6OGZKRf8W49GCJXq6Ie69DJ9LB1DO67NV1jsYbsLx9uhE2yEmpWZ3jkoCV/Eas4grxt0CGN6EavzQ==';


