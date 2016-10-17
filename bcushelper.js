var _ = require('lodash');
var http = require('request');
var writtenNumber = require('written-number');
var rp = require('request-promise');
var request = require("request");
var cookieJar = request.jar();
var writtenNumber = require('written-number');
var moment = require('moment');

function BCUSHelper() {
  this.data = {};
  this.username = "";
  this.token = "";
  this.guid = 'dniudsbajbdkjasbkdaskjbdjksa';
  this.accounts = {};
  this.accountVO = {};
  this.rewardsVO = {};
  this.transactionVO = {};
  this.isDataAvailable = false;
}

BCUSHelper.prototype.cleanSession=function() {
  this.accounts = {};
  this.accountVO = {};
  this.rewardsVO = {};
  this.transactionVO = {};
  this.isDataAvailable = false;
};

BCUSHelper.prototype.getCardDescription = function(cb){
  if(this.isDataAvailable){
    cb(this.accounts[0].cpcDescription);
  } else {
    var bh = this;
    this.getData(function(data){
      cb(bh.accounts[0].cpcDescription);
    });
  }
};

BCUSHelper.prototype.getMinPayDue = function(cb) {
  if(this.isDataAvailable){
    cb(writtenNumber(this.accountVO.minPaymentDue));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(bh.accountVO.minPaymentDue));
    });
  }
}

BCUSHelper.prototype.getlastPaymentAmount = function(cb){
  if(this.isDataAvailable){
    cb(writtenNumber(this.accountVO.lastPaymentAmount));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(bh.accountVO.lastPaymentAmount));
    });
  }
}

BCUSHelper.prototype.getcreditLimit = function(cb){
  if(this.isDataAvailable){
    cb(writtenNumber(this.accountVO.creditLimit));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(bh.accountVO.creditLimit));
    });
  }
}

BCUSHelper.prototype.getcurrentBalance = function(cb){
  if(this.isDataAvailable){
    cb(writtenNumber(this.accountVO.currentBalance));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(bh.accountVO.currentBalance));
    });
  }
}

BCUSHelper.prototype.getstatementBalance = function(cb){
  if(this.isDataAvailable){
    cb(writtenNumber(this.accountVO.statementBalance));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(bh.accountVO.statementBalance));
    });
  }
}

BCUSHelper.prototype.getavailableCredit = function(cb){
  if(this.isDataAvailable){
    cb(writtenNumber(this.accountVO.availableCredit));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(bh.accountVO.availableCredit));
    });
  }
}

BCUSHelper.prototype.getdatePaymentDue = function(cb) {
  if(this.isDataAvailable){
    cb(moment(this.accountVO.datePaymentDue,'MM-DD-YYYY').format('MMM Do'));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(moment(bh.accountVO.datePaymentDue,'MM-DD-YYYY').format('MMM Do'));
    });
  }
}

BCUSHelper.prototype.getlastPaymentReceivedDate = function(cb) {
  if(this.isDataAvailable){
    cb(moment(this.accountVO.lastPaymentReceivedDate,'MM-DD-YYYY').format('MMM Do'));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(moment(bh.accountVO.lastPaymentReceivedDate,'MM-DD-YYYY').format('MMM Do'));
    });
  }
}

BCUSHelper.prototype.getlastFiveTransactions = function(cb) {
  var bh = this;
  if(this.isDataAvailable){
   var str = '';
   var postedList = _.reverse(this.transactionVO.postedList);
   for(var i=0;i<5;i++){
     var d = 'dollar';
     if(postedList[i].transactionAmount > 1) d = 'dollars';
      str += "A transaction of "
        + writtenNumber(postedList[i].transactionAmount) + ' ' + d + ' was made on '
        + moment(postedList[i].transactionDate,'MM-DD-YYYY').format('MMM Do')
        + ' at ' + postedList[i].transactionDescription + "... ";
    }
    console.log(str);
    cb(str);
  } else {
    this.getData(function(data){
      var str = '';
      var postedList = _.reverse(bh.transactionVO.postedList);
      for(var i=0;i<5;i++){
        var d = 'dollar';
        if(postedList[i].transactionAmount > 1) d = 'dollars';
         str += "A transaction of "
           + writtenNumber(postedList[i].transactionAmount) + ' ' + d + ' was made on '
           + moment(postedList[i].transactionDate,'MM-DD-YYYY').format('MMM Do')
           + ' at ' + postedList[i].transactionDescription + "... ";
       }
       console.log(str);
       cb(str);
    });
  }
}

BCUSHelper.prototype.authenticate = function(req) {
  var usernameAndaccessToken = req.sessionDetails.accessToken;
  if(usernameAndaccessToken === null) {
    req.linkAccount().shouldEndSession(true)
    .say('Your barclaycard account is not linked. Please use the Alexa app to link the account.');
    return true;
  }
  var usernameAndaccessTokenArray = _.split(usernameAndaccessToken,'|')
  username = usernameAndaccessTokenArray[0];
  accessToken = usernameAndaccessToken.substr(username.length+1,usernameAndaccessToken.length);
  console.log("Username: " + username);
  console.log("Token" + accessToken);
  console.log("Session" + req.sessionDetails);
  this.setUserName(username);
  this.setToken(accessToken);
}

BCUSHelper.prototype.setUserName = function(username) {
  this.username = username;
};
BCUSHelper.prototype.setToken = function (token) {
  this.token = token;
};

BCUSHelper.prototype.getTotalSpendThisMonth = function(cb) {
  if(this.isDataAvailable){
    var s = _.reduce(this.transactionVO.postedList,function(s, entry) {
      return s + parseFloat(entry.transactionAmount);
    }, 0);
    cb(writtenNumber(s));
  } else {
    var bh = this;
    this.getData(function(data){
      var s = _.reduce(bh.transactionVO.postedList,function(s, entry) {
        return s + parseFloat(entry.transactionAmount);
      }, 0);
      cb(writtenNumber(s));
    });
  }
};

BCUSHelper.prototype.getrewardsPoints = function(cb) {
  if(this.isDataAvailable){
    cb(writtenNumber(this.rewardsVO.rewardsPoints) + ' ' + this.rewardsVO.rewardsDescription);
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(this.rewardsVO.rewardsPoints) + ' ' + this.rewardsVO.rewardsDescription);
    });
  }
}

BCUSHelper.prototype.getlastRedeemedAmount = function(cb) {
  if(this.isDataAvailable){
    cb(writtenNumber(this.rewardsVO.lastRedeemedAmount));
  } else {
    var bh = this;
    this.getData(function(data){
      cb(writtenNumber(this.rewardsVO.lastRedeemedAmount));
    });
  }
}

BCUSHelper.prototype.hasData = function() {
  return this.isDataAvailable;
}

BCUSHelper.prototype.getData = function(cb) {
  console.log("in get data...")
  var cookieJar = request.jar();
  var bh = this;
  //var URL = 'https://m.barclaycardus.com/mobileservice/authenticate/v3';
  var URL = 'https://m.barclaycardus.com/mobileservice/token/v3/authenticate';
  URL += '?userID=' + this.username;
  URL += '&accessToken=' + this.token;
  URL += '&appVersion=6.15.0';
  URL += '&version=3.1';
  URL += '&osVersion=1';
  URL += '&platform=iOS';
  request.post({
      url: URL,
      jar: cookieJar,
      headers: {'guid': bh.guid}
  }, function(error, response, body){
    console.log("authenticating...")
      var obj = JSON.parse(body);
      response.headers.guid = bh.guid;
      response.headers.hmacToken = obj.hmacToken;
      bh.accounts = obj.accounts;
      request.get({
          url:"https://m.barclaycardus.com/mobileservice/account/v3/1/summary",
          jar: cookieJar,
          headers: response.headers
      },function(error, response, body){
          var obj = JSON.parse(body);
          console.log(obj.accountVO);
          bh.accountVO = obj.accountVO;
          bh.rewardsVO = obj.rewardsVO;
          bh.transactionVO = obj.transactionVO;
          bh.isDataAvailable = true;
          cb(obj);
      });
  });
}

module.exports = BCUSHelper;
