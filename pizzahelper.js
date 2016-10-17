var _ = require('lodash');
var pizzapi = require('dominos');
var config = require('./order.json');
var pCode = config["order"].customer.address.PostalCode;
var writtenNumber = require('written-number');

function PizzaHelper (obj) {
  this.started = false;
  this.questionIndex = 0;
  this.currentStep = 0;
  this.store = {};
  this.order = {};
  this.storeMenu;
  this.questions = [
    {
      template: 'Just to confirm it is a ${size} ${crust} ${type}', //with ${topping}.',
      steps : [
        {
          value : null,
          template_key:'type',
          prompt :'What kind of pizza are you looking for today?',
          help :'You can say plain, deluxe, meatzza, buffalo chicken, memphis barbecue chicken,'
               +'cali chicken bacon ranch, wisconsin six cheese, philly cheese steak, pacific veggie,'
               +'ultimate pepperoni, honolulu hawaiian, extravaganzza or cheese'
        },
        {
          value : null,
          template_key:'topping',
          prompt :'Would you like other toppings?',
          help :'You can say pepperoni, black olives, mushrooms, italian sausage'
        },
        {
          value : null,
          template_key:'crust',
          prompt:'Oh, that sounds great. What kind of crust would top this off?',
          help :'You can say thin, brooklyn, hand tossed'
        },
        {
          value : null,
          template_key:'sauce',
          prompt:'Any particular sauce?',
          help :'You can say white garlic, tomatoe'
        },
        {
          value : null,
          template_key:'size',
          prompt:'Size?',
          help :'You can say small, medium or large'
        }
      ]
    }
  ];
  for (var prop in obj) this[prop] = obj[prop];
}

PizzaHelper.prototype.completed = function() {
  return this.currentStep === (this.currentQuestion().steps.length - 1);
};


PizzaHelper.prototype.getHelp = function() {
  return this.getStep().help;
};

PizzaHelper.prototype.getPrompt = function() {
  return this.getStep().prompt;
};

PizzaHelper.prototype.getStep = function() {
  return this.currentQuestion().steps[this.currentStep];
};

PizzaHelper.prototype.IsOpen = function() {
  return (this.store.IsOnlineCapable && this.store.IsOpen)
}

PizzaHelper.prototype.getStore = function(cb) {
  pizzapi.Util.findNearbyStores(pCode,'Delivery',function(storeData){
     this.store = new pizzapi.Store({ID: storeData.result.Stores[0].StoreID});
     cb(this.store);
  });
};

PizzaHelper.prototype.getMenu = function(cb) {
  if(pizzapi){
    if(pizzapi.Util){
      pizzapi.Util.findNearbyStores(pCode,'Delivery',function(storeData){
           this.store = new pizzapi.Store({ID: storeData.result.Stores[0].StoreID});
           this.store.getFriendlyNames(function(d){
             cb(d.result);
           });
        });
    }
  }
};

PizzaHelper.prototype.testKey = function (ptype,crust,size) {
  this.questions[0].steps[0].value = ptype; //'buffalo chicken';
  this.questions[0].steps[2].value = crust; // 'brooklyn';
  this.questions[0].steps[4].value = size; //'large';
}

PizzaHelper.prototype.getKey = function() {
    var currentQuestion = this.currentQuestion();
    var templateValues = _.reduce(currentQuestion.steps, function(accumulator, step) {
      accumulator[step.template_key] = step.value;
      return accumulator;
    }, {});

    var type = templateValues["type"];
    var crust = templateValues["crust"];
    var size = templateValues["size"];
    var sz = 'Large (14\") '; // Default...

    if(_.lowerCase(type) == 'cheese') {
      type = 'Pizza';
    }
    if(_.lowerCase(type) == 'plain') {
      type = 'Pizza';
    }
    if(_.lowerCase(crust) == 'plain') {
      crust = 'hand tossed';
    }
    if(_.lowerCase(size) == 'large') {
       sz = 'Large (14\") ';
    }
    if(_.lowerCase(size) == 'medium') {
       sz = 'Medium (12\") ';
    }
    if(_.lowerCase(size) == 'small') {
       sz = 'Small (10\") ';
    }
    //console.log(sz + _.startCase(crust) + ' ' + _.startCase(type));
    return sz + _.startCase(crust) + ' ' + _.startCase(type);
}

PizzaHelper.prototype.getItemCode = function(cb) {
  var k = this.getKey()
  this.getMenu(function(menu){
      var code='NOTFOUND';
      var found = _.find(menu, k);
      if(found) { code = _.get(found,k) };
      cb(code);
  });
}

PizzaHelper.prototype.priceOrder = function(cb) {
  var pz = this;
  var itmCode = this.getItemCode(function(code){
    pizzapi.Util.findNearbyStores(pCode,'Delivery',function(storeData){
      var storeInfo = storeData.result.Stores[0];
      //if(storeInfo.IsOnlineCapable && storeInfo.IsOpen){
          config["order"]["storeID"] = storeInfo.StoreID;
          var order = new pizzapi.Order(config["order"]);
          var items = config["items"];
          for (var i=0; i<items.length; i++) {
              items[i].code = code;
              order.addItem(new pizzapi.Item(items[i]));
          }
          order.validate(function(result){
              order.price(function(o){
                cb(order,o.result);
              });
          });
      //}
    });
  });
}

PizzaHelper.prototype.setOrder = function(o){
  this.order = o;
}


PizzaHelper.prototype.priceAndPlaceOrder = function(cb) {
  var pz = this;
  var itmCode = this.getItemCode(function(code){
    pizzapi.Util.findNearbyStores(pCode,'Delivery',function(storeData){
      var storeInfo = storeData.result.Stores[0];
      //if(storeInfo.IsOnlineCapable && storeInfo.IsOpen){
          config["order"]["storeID"] = storeInfo.StoreID;
          var order = new pizzapi.Order(config["order"]);
          var items = config["items"];
          for (var i=0; i<items.length; i++) {
              items[i].code = code;
              order.addItem(new pizzapi.Item(items[i]));
          }
          order.validate(function(result){
              order.price(function(o){
                var cardInfo = new order.PaymentObject();
                if (order.Amounts.Customer) {
                  cardInfo.Amount = order.Amounts.Customer;
                  cardInfo.Number = config["cardNum"];
                  cardInfo.CardType = order.validateCC(config["cardNum"]);
                  cardInfo.Expiration = config["cardExp"];
                  cardInfo.SecurityCode = config["cardSec"];
                  cardInfo.PostalCode = config["cardPost"]; // Billing Zipcode
                  order.Payments.push(cardInfo);
                  order.place(function(result){
                      cb(order,o.result);
                      //console.log("Estimated Wait Time",result.result.Order.EstimatedWaitMinutes, "minutes");
                      // pizzapi.Track.byPhone(config["order"].customer.phone,function(pizzaData){
                      //     console.log(pizzaData);
                      // });
                  });
                }
              });
          });
      //}
    });
  });
}

PizzaHelper.prototype.placeOrder = function(cb) {
    var pz = this;
    console.log(pz);
    var cardInfo = new pz.order.PaymentObject();
    if (pz.order.Amounts.Customer) {
      cardInfo.Amount = pz.order.Amounts.Customer;
      cardInfo.Number = config["cardNum"];
      cardInfo.CardType = pz.order.validateCC(config["cardNum"]);
      cardInfo.Expiration = config["cardExp"];
      cardInfo.SecurityCode = config["cardSec"];
      cardInfo.PostalCode = config["cardPost"]; // Billing Zipcode
      pz.order.Payments.push(cardInfo);
      console.log(pz);
      // order.place(function(result){
      //     console.log("Estimated Wait Time",result.result.Order.EstimatedWaitMinutes, "minutes");
      //     pizzapi.Track.byPhone(config["order"].customer.phone,function(pizzaData){
      //         console.log(pizzaData);
      //     });
      // });
    }

}

PizzaHelper.prototype.convertCurrency = function(num) {
  var cur = _.replace(num, ',', '');
  var arr = cur.toString().split(".");
  var currency = '';
  for (i=0;i<arr.length;i++) {
    if(i==0) currency += writtenNumber(arr[i]) + ' dollars and ';
    else currency += writtenNumber(arr[i]) + ' cents';
  }
  return _.replace(currency, '-', ' ');
}

PizzaHelper.prototype.buildOrder = function() {
  var currentQuestion = this.currentQuestion();
  var templateValues = _.reduce(currentQuestion.steps, function(accumulator, step) {
    accumulator[step.template_key] = step.value;
    return accumulator;
  }, {});
  var compiledTemplate = _.template(currentQuestion.template);
  return compiledTemplate(templateValues);
};

PizzaHelper.prototype.currentQuestion = function() {
  return this.questions[this.questionIndex];
};

module.exports = PizzaHelper;
