
/* GOALS:

1. create a FINISHED category
    * once clicked we will remove from list and move it to another list, the "finished" list

2. add a COMPLETED list button that sends the user to the FINISHED list

3. create an DELETE function
    * like the clear function in the to-do-list, DELETE the item from the FINISHED list so its gone forever.

*/


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

// Item model
const Item = mongoose.model("Item",itemsSchema);

// create "variables" to input into database
const item1 = new Item({
  name: "Welcome to your to-do List!"
});

const item2 = new Item({
  name: "Press '+' to add an item to the list"
});

const item3 = new Item({
  name: "Press the button to the left to delete the item from the list"
});

const defaultItems = [item1, item2, item3];

// finished schema
const finishedListSchema = {
  name: String,
  finished: [itemsSchema]
};

// finished model
const FinishedList = mongoose.model("FinishedList", finishedListSchema);


// list schema
const listSchema = {
  name: String,
  items: [itemsSchema],
  finishedList:[finishedListSchema]

};

// list model
const List = mongoose.model("List", listSchema);



// Will delete all entries of Model Item)
// Don't necessarily need to delete anything but this is a quick way to get rid of duplicates

// Item.deleteMany({},function(){});

app.get("/", function(req, res) {


  List.find({},(err,foundLists)=>{
    res.render("home",{
      lists: foundLists
    })
    }
  )

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

app.get("/:customListName/:finishedListName",(req,res)=>{

})

// create a app.get("/move") thats moves items from list to finished list
//  *find item, copy item, add copy to finished list, delete item from list.

app.post("/move", (req,res)=>{
  
})


app.post("/delete",function(req,res){

  // Determine whether user clicked a List or an Item

  const checkedListId = req.body.checkboxList;
  const checkedItemId = req.body.checkboxItem;
  const listName = req.body.listName;


  console.log(req.body);

  // case 1: list is to be deleted 
  if(checkedListId){
    List.deleteOne({name: listName},(err)=>{
      if(!err){
        console.log(listName + " has been deleted");
        res.redirect("/");
      }
    })
  // case 2: item is to be deleted
  }else if(checkedItemId){
    List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName);
      }
  })
  }


  /// THIS BLOCK OF CODE IS NOT NEEDED ANYMORE
  /// KEEP FOR REFERENCE

  // if(listName === "Today"){
  //   Item.findByIdAndRemove(checkedItemId, function(err){
  //     if(!err){
  //       console.log("Successfully deleted item");
  //       res.redirect("/");
  //     }
  //   });

  
  
 
  

});

app.post("/newList", (req,res)=>{
  const newListName = req.body.newList;
  console.log()
  res.redirect("/"+newListName);
  
})

app.get("/:customListName", function(req, res){


  const customListName = _.capitalize(req.params.customListName);

  // The browser looks for a Favicon.ico to display when visiting another website which will create 
  // a new list named "Favicon.ico"
  // FIXES TEMP PROBLEM
  
    

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


// Heroku Port
// This allows us to run our "node server" online and/or locally

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}


app.listen(port, function() {
  console.log("Server started on port 3000");
});
