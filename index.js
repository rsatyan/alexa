//-----------------------------------------------------------------------------
// Barclaycard Alex Skill
// Copyright Barclaycard 2016
// Author - Satyan Avatara
// Description : Alexa Skill used on Alexa app and support Echo/Dot/Tap devices
//-----------------------------------------------------------------------------

var _ = require('lodash');
var Alexa = require('alexa-app');
var app = new Alexa.app('barclaycard');
var moment = require('moment');
var pizzapi = require('dominos');
var pizzaHelper = require("./pizzahelper");
var bcusHelper = require("./bcushelper");
var bh = new bcusHelper();
var PIZZA_BUILDER_SESSION_KEY = 'pizza_builder';
var config = require('./order.json');
var isDataAvailable = false;
var username; var accessToken;
var getPizzaHelper = function(request) {
  var pizzaHelperData = request.session(PIZZA_BUILDER_SESSION_KEY);
  if (pizzaHelperData === undefined) {
    pizzaHelperData = {};
  }
  return new pizzaHelper(pizzaHelperData);
};
var generalGreeting = 'Welcome to the Barclay card help center. You can ask me for your'
    + ' current balance, rewards points, product features and review your'
    + ' statement and even make a payment on your credit card.... Now,'
    + ' how may we help you?';


app.pre = function(request,response,type) {
  console.log("Could be used for capturing analytics");
};

app.launch(function(req, res) {

  console.log("App launched");
  res.session('name','Curt');
  var prompt = generalGreeting;
  var reprompt = 'You can ask me for your current balance, rewards points, '
               + 'product features and review your statement';

  res.say(prompt).reprompt(reprompt).shouldEndSession(false);
  res.card('Welcome',prompt);

});

app.intent("AMAZON.HelpIntent", {},
  function(request, response) {
    var pizzaHelper = getPizzaHelper(request);
    var help = generalGreeting
    if (pizzaHelper.started) {
        help = pizzaHelper.getStep().help;
    }
    response.say(help).shouldEndSession(false);
});

app.intent('RequestUber',function(req,res){
  var prompt = 'We are working on it and excited to bring it to you, so hang in there!';
  res.say(prompt).shouldEndSession(false);
});

//-----------------------------------------------------------------------------
// Barclaycard specific intents -- see bcushelper
// ( Servicing intents )
//-----------------------------------------------------------------------------
app.intent('WhatSMyBalance', function(req,res){
  bh.authenticate(req);
  bh.getcurrentBalance(function(data){
    var prompt = 'Your current balance is ' + data + 'dollars';
    res.say(prompt).shouldEndSession(false).send();
  });
  return false;
});

app.intent('MinPayment',function(req,res){
  bh.authenticate(req);
  bh.getMinPayDue(function(data){
    var prompt = 'Your minimum payment due is ' + data + ' dollars';
    res.say(prompt).shouldEndSession(false).send();
  });
  return false;
});

app.intent('PleaseCallMe',function(req,res){
  var prompt = 'Absolutely! We will connect you to the next available agent';
  res.say(prompt).shouldEndSession(false);
});

app.intent('WhichCard',function(req,res){
  bh.authenticate(req);
  bh.getCardDescription(function(data){
    var prompt = 'You are using the  ' + data;
    res.say(prompt).shouldEndSession(false).send();
  });
  return false;
});

app.intent('HowMuchMoneyDidISpendThisMonth',function(req,res){
  bh.authenticate(req);
  bh.getTotalSpendThisMonth(function(data){
    var prompt = 'You spent a total of ' + data + ' dollars this month';
    res.say(prompt).shouldEndSession(false).send();
  });
  return false;
});

app.intent('WhatIsTheBalanceTransferRate',function(req,res){
  var prompt = 'The current promotional rate is 12.23 percent'
  res.say(prompt).shouldEndSession(false);
});

app.intent('WhenIsMyPaymentDue', function(req,res){
    bh.authenticate(req);
    bh.getdatePaymentDue(function(data){
      var prompt = 'Your payment is due on ' + data;
      res.say(prompt).shouldEndSession(false).send();
    });
    return false;
});

app.intent('RecentTransactions',function(req,res){
  bh.authenticate(req);
  bh.getlastFiveTransactions(function(data){
    var prompt = data;
    res.say(prompt).shouldEndSession(false).send();
  });
  return false;
});

app.intent('CreditLimit',function(req,res){
  bh.authenticate(req);
  bh.getcreditLimit(function(data){
    var prompt = 'You credit limit is ' + data + ' dollars';
    res.say(prompt).shouldEndSession(false).send();
  });
  return false;
});

app.intent('LastPaymentReceived',function(req,res){
  bh.authenticate(req);
  bh.getlastPaymentReceivedDate(function(data){
    var prompt = 'You payment was received on ' + data;
    res.say(prompt).shouldEndSession(false).send();
  });
  return false;
});

app.intent('RewardsBalance', function(req,res){
  bh.authenticate(req);
    bh.getrewardsPoints(function(data){
      var prompt = 'You have ' + data;
      res.say(prompt).shouldEndSession(false).send();
    });
    return false;
});

app.intent('FreezCard', function(req,res){
  var prompt = 'We have temporarily frozen your account to prevent any new '
  + 'purchases, cash advances and balance transfers. Simply unfreeze your '
  + 'account at any time to turn everything back on.';
  res.say(prompt).shouldEndSession(true);
});

app.intent('UnFreezeCard', function(req,res){
  var prompt = 'Your card is now turned back on. You can now use it for purchases,'
  + ' cash advances and balance transfers.';
  res.say(prompt).shouldEndSession(true);
});


app.intent('RequestStatement', {
  "slots": {
    "stmtmonth" : "AMAZON.DATE"
  },
  "utterances": ["{send|request} {me|a|} {statement} {|for} {stmtmonth |} "]
}, function(req,res){
    var value = req.slot("stmtmonth");
    var prompt = 'You statement has been emailed to you. Please check your email.';
    res.say(prompt).shouldEndSession(false);
});

app.intent('travelnotify',function(req,res){
  var prompt = 'Thank you for notifying us of your travel plans. '
  +' Have a safe trip!';
  res.say(prompt).shouldEndSession(true);
});

app.intent('whatsmyspendoutlook',function(req,res){
  // var stepValue = req.slot("STEPVALUE");
  // if (stepValue !== undefined) {
    var prompt = 'Looks like your on track! You spent thirteen hundred'
    +' dollars against your goal of twenty five hundred dollars.'
    +' The top three categories were groceries, dining and gas station.';
    res.say(prompt).shouldEndSession(true);
 //  } else if (stepValue == "yes") {
 //   var prompt = 'Ok! You have spent three hundred dollars in groceries. Two '
 //    + ' hundred ninety five at resturants and hundred and ninety at gas stations.'
 //    + ' Look out for the threeteen hundred points on your next monthly statement!';
 //   res.say(prompt).shouldEndSession(false);
 // } else {
 //   res.shouldEndSession(true);
 //}

});

app.intent('PayMyBill', function(req,res){
  var prompt = 'Thank you for the payment! We have debited the amount '
      + ' from your checking account ending in 3423.';
  res.say(prompt).shouldEndSession(false);
});

//-----------------------------------------------------------------------------
// Barclaycard specific intents
// ( Marketing intents )
//-----------------------------------------------------------------------------

app.intent('NeedInformation',{
  'slots': { 'productsslot': 'PRODUCTS'},
  'utterances': ['{info} {on|for} {productsslot}']
}, function(req,res){
  //console.log('NeedInformation')
  // console.log(req.slot);
  //console.log(req.slot('productsslot'));
  var productCode = req.slot('productsslot');
  var reprompt = 'You can say Arrival, Ring, Cashforward';
  if (_.isEmpty(productCode)) {
    var prompt = 'Which product would you like information on?';
    res.say(prompt).reprompt(reprompt).shouldEndSession(false);
    return true;
  } else  {
    res.say(productCode + ' information').shouldEndSession(false).send();
    res.card('Product Information',"Additonal information can be found online");
    return false;
  }

});

//-----------------------------------------------------------------------------
// Barclaycard specific demo intents
// ( Invisible payments demo )
//-----------------------------------------------------------------------------
app.intent('OrderMeAPizza',{
  "slots":{
     "STEPVALUE": "PIZZAVALUES"
  },
  "utterances": ["{order|want|get} {pizza|dominos}"]
  },
 function(req,res){
   var stepValue = req.slot("STEPVALUE");
   var pizzaHelper = getPizzaHelper(req);
   pizzaHelper.started = true;
   if (stepValue !== undefined) {
      pizzaHelper.getStep().value = stepValue;
   }
   if (pizzaHelper.completed()) {
     if(_.lowerCase(stepValue) == "yes") {
        //  pizzaHelper.placeOrder(function(data){
        //     if(data.result.Order.Status==-1){
        //       res.say("You order could not be placed!");
        //     } else {
              res.say("Thank you. You order has been placed.");
        //    }
            res.shouldEndSession(true).send();
        // });
        // return false;
      } else if(_.lowerCase(stepValue) == "no") {
         res.say("You made me hungry!! Oh well i guess i will starve..");
         res.shouldEndSession(true).send();
       } else {
       var completedPizzaOrder = pizzaHelper.buildOrder();
       //pizzaHelper.priceAndPlaceOrder(function(data){
       pizzaHelper.priceOrder(function(data){
        res.say("Fantastic!"  + completedPizzaOrder + ". Your order total is " +
                pizzaHelper.convertCurrency(data.Amounts.Customer)
                + " . Shall i place the order?");
        //pizzaHelper.order = data;
        console.log(data);
        res.shouldEndSession(false).send();
       });
       return false;
      }
   } else {
       if (stepValue !== undefined) {
        pizzaHelper.currentStep++;
       }
       res.say(pizzaHelper.getPrompt());
       res.reprompt("I didn't hear anything. " + pizzaHelper.getHelp() + " to continue.");
       res.shouldEndSession(false);
   }
   res.session(PIZZA_BUILDER_SESSION_KEY, pizzaHelper);
});

app.intent('TrackMyOrder',function(req,res){
    pizzapi.Track.byPhone(config["order"].customer.phone,function(pizzaData){
        console.log(pizzaData);
        var orderCount = 0;
        var speechText = "";
        if (!pizzaData || !pizzaData["orders"] || !pizzaData["orders"]["OrderStatus"]) {
           orderCount = 0;
           speechText = "Sorry! I didn't find any active orders."
        } else {
           var order = pizzaData["orders"]["OrderStatus"];
           if (orderStatus === "routing station") {
             orderStatus = "being quality checked";
           } else if (orderStatus === "makeline") {
             orderStatus = "being prepared";
           } else if (orderStatus === "oven") {
             orderStatus = "in the oven";
           } else if (orderStatus === "complete") {
              orderStatus = " complete and has been delivered";
           }
           speechText =  'Your order is ' + orderStatus;
        }
        res.say(speechText);
        res.shouldEndSession(true).send();
    });
    return false;
});

app.intent('ThankYou',function(req,res){
  var speechOutput = 'Thank you for using Barclays';
  bh.cleanSession();
  res.say(speechOutput).shouldEndSession(true);
});

//-----------------------------------------------------------------------------
// Error Handlers & Other Alexa specific functions
//-----------------------------------------------------------------------------

app.sessionEnded = function(req,res) {
  bh.cleanSession();
};

var exitFunction = function(request, response) {
  bh.cleanSession();
  var speechOutput = 'Thank you for using Barclays';
  response.say(speechOutput).shouldEndSession(true);
};

app.intent('AMAZON.StopIntent', exitFunction);
app.intent('AMAZON.CancelIntent', exitFunction);


// Error Handling
app.error = function(exception, request, response) {
    response.say("Sorry, something really bad happened");
};

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
