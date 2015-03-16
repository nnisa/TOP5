
var http       = require('http'),
    path       = require('path'),
    fs         = require('fs'),
    url        = require('url'),
    mongo      = require('mongodb'),
    mongoose   = require('mongoose'),
    express    = require('express'),
    jade       = require('jade'),
    bodyParser = require('body-parser');

var app = express();
var router = express.Router();
var pub = path.join(__dirname, 'public');

//all environments
app.set('port', process.env.PORT || 3000);
app.use(express.static(pub));
app.set('views', pub + '/views');
app.set('view engine', 'jade');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// establish mongo connection
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/data';
var db = mongoose.createConnection(mongoUri);
db.on('error', function(err) {
  console.log('MongoDB connection error:', err);
});
db.once('open', function() {
  console.log("MongoDB connected");
});


// New mongoose schema to create our
var Schema = mongoose.Schema;
var Collection = mongoose.Collection;

var Dish = new Schema({
  name           : { type: String , required: true },
  category       : { type: String , required: true },
  description    : { type: String , required: true },
  likes          : { type: Number , required: true },
  restaurant_id  : { type: String , required: false } 
});
var DishModel = db.model('Dish', Dish);

var Restaurant = new Schema({
  name      : { type: String, required: true },
  lat       : { type: Number, required: true },
  lon      : { type: Number, required: true },
});
var RestaurantModel = db.model('Restaurant', Restaurant);

var User = new Schema({
  name            : { type: String,  required: true  },
  fb_id           : { type: Number,  required: true  },
  favorited       : { type: Array ,  required: false }
});
var UserModel = db.model('User', User);

router.get('/', function (req, res) {
  res.render('index');
});

router.post('/login', function (req, res) {
  UserModel.findOne({
    fb_id: req.body.fb_id
  }, function(err, user) {
    if (err) { res.send(JSON.stringify(err)); } else {
      if (user === null) {
        var user = new UserModel({
          name       : req.body.first_name,
          fb_id      : parseInt(req.body.fb_id),
          favorited  : new Array()
        });

        user.save(function(userErr) {
          if (userErr) { res.send(JSON.stringify(userErr)); } else {
            res.send(JSON.stringify({
              user  : user,
              isNew : true
            }));
          }
        });
      } else {
        res.send(JSON.stringify({
          user  : user,
          isNew : false
        }));
      }
    }
  });
});

// get all dishes for restaurant given longitude and latitude
router.get('/getrestaurant/:long/:lat', function(req, res) {
 RestaurantModel.findOne({
    long : parseInt(req.params.long),
    lat  : parseInt(req.params.lat)
 }, function(restaurantErr, restaurant) {

    if (restaurantErr) { res.send(JSON.stringify(restaurantErr)); }

    var rest = restaurant;
    DishModel.find({
      restuarant_id : restaurant._id
    }, function(dishErr, dishes) {

      if (dishErr) { res.send(JSON.stringify(dishErr)); } 

      rest.dishes = dishes;
      rest.selected = dishes[0];
      res.send(JSON.stringify(rest));
    });
  });
});

router.post('/updatefavorite', function(req, res) {
  DishModel.findOne({
    id: req.body.dishId
  }, function(err, dish) {
    if (err) { res.send(JSON.stringify(err)); }
    if (req.body.liked === 1) {
      dish.likes += 1;
    } else {
      dish.likes -= 1;
    }
    dish.save(function(err) {
      if (err) {
        res.send(JSON.stringify(err));
      } else {
        res.send(dish);
      }
    });
  });

  UserModel.findOne({
    id: req.body.userId
  }, function(err, user) {
    if (err) { res.send(JSON.stringify(err)); }

    if (req.body.liked === 1) {
      user.favorited.push(req.body.dishId);
    } else {
      var i = user.favorited.indexOf(req.body.dishId);
      user.favorited.splice(i, 1);
    }
  });

});

router.post('/addrestaurant', function(req, res) {
  var restaurant = new RestaurantModel({
    name: req.body.name,
    lat: req.body.lat,
    lon: req.body.lon
  });
  restaurant.save(function(err){
    if (err) { res.send(err) }
    res.send(restaurant);
  });
});

router.post('/adddish', function(req, res) {
  RestaurantModel.findOne({
    _id: req.body.restaurant
  }, function (err, restaurant) {
    if (err) { res.send(err) } else {
      var dish = new DishModel({
        name: req.body.name,
        category: req.body.category,
        description: req.body.description,
        likes: req.body.likes,
        restaurant_id: restaurant._id
      });
      dish.save(function(err) {
        if (err) { res.send(err) } else {
          res.send(dish);
        }
      });
    }
  });
});

app.use('/', router);

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});