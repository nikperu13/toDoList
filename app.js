//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// express 
const app = express();

// ejs
app.set('view engine', 'ejs');

// necessary for using body-parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connect to mongodb database
// NOTE: make sure to run both mongodb and mongo on HyperTerminal !!
// mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser:true, useUnifiedTopology: true });


// connecting to CLOUD mongodb database via mongoDB atlas
mongoose.connect("mongodb+srv://admin-nicolas:Test123@cluster0.ghiv3.mongodb.net/todolistDB",{useNewUrlParser:true, useUnifiedTopology: true });


// create schema and Model(slightly different than the one from fruitsDB file)
const itemsSchema = {
  name: String
}

// model
const Item = mongoose.model("Item",itemsSchema);

// create "variables" to input into database
const item1 = new Item({
  name: "Welcome to your to-do List!"
});

const item2 = new Item({
  name: "Press '+' to add an item to the list"
});

const item3 = new Item({
  name: "Press '-' to delete the latest item on the list"
});

const defaultItems = [item1, item2, item3];

// list schema
const listSchema = {
  name: String,
  items: [itemsSchema],

};

// list model
const List = mongoose.model("List", listSchema);



// Will delete all entries of Model Item)
// Don't necessarily need to delete anything but this is a quick way to get rid of duplicates

// Item.deleteMany({},function(){});

app.get("/", function(req, res) {

  // only add items if items collection in database is empty is empty

  Item.find({},function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }
        else{
          console.log("Successfully saved default items to mongodb database");
        }
      });
      res.redirect("/");
    }
    
    else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
    
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    // mongoose shortcut to insert one
    item.save();

    // redirects to the route "/" app.get and renders our results
    res.redirect("/");
  }
  else{
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete",function(req,res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted item");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}}, function(err, foundList){
        if(!err){
          res.redirect("/"+listName);
        }
    })
  }
 
  

});


app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  // findOne() only returns a single document
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/"+customListName);
      }  
      else{
        // show an existing list
        res.render("list", {listTitle: foundList.name , newListItems: foundList.items})
      }
    }
  })

})

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
