
/* GOALS:

1. create a FINISHED category ** DONE (1/2)**
    * once clicked we will remove from list and move it to another list, the "finished" list

2.** DONE (2/2)**
  render "list.ejs" when in /:customList/finish 
    * code looks right but doesn't render... might be problem with routing parameter

3. create an DELETE function
    * like the clear function in the to-do-list, DELETE the item from the FINISHED list so its gone forever.

4. make it mobile friendly
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
  name: "Press the button to the left to move item to Completed List"
});

const defaultItems = [item1, item2, item3];

// finished schema
const finishedItemSchema = {
  name: String,
};

// finished model
const FinishedItem = mongoose.model("Finished-Item", finishedItemSchema);

const finishedItem1 = new FinishedItem ({
  name: "Collection of completed Items"
})

const finishedItem2 = new FinishedItem({
  name: "Click the button on the left to permanently delete item"
})

const defaultFinishedItems = [finishedItem1,finishedItem2];

// list schema
const listSchema = {
  name: String,
  items: [itemsSchema],
  finishedItems:[finishedItemSchema]

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

  List.findOne({name:listName}, function(err, foundList){
    if(!err){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    }
  })


});


// create a app.get("/move") thats moves items from list to finished list
//  *find item, copy item, add copy to finished list, delete item from list.

app.post("/move", (req,res)=>{

  const currentItemId = req.body.checkboxItem;
  const currentItemName = req.body.itemName;
  const currentList = req.body.listName;

 
  

  const newFinishedItem = new FinishedItem({
    name: currentItemName
  });

  List.findOneAndUpdate({name:currentList},{$pull:{items:{_id:currentItemId}}},(err, foundList)=>{
    
    if(!err){
      foundList.finishedItems.push(newFinishedItem);
      foundList.save();
      res.redirect("/"+currentList)
    }
    
  })

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
  // case 2.5: determine whether item is "finished" or not
  }else if(checkedItemId){
    List.findOneAndUpdate({name: listName},{$pull:{finishedItems:{_id:checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/"+listName+"/finish");
      }
  })
  }

  
});

app.post("/newList", (req,res)=>{

  const newListName = req.body.newList;
  res.redirect("/"+newListName);
  
})




app.get("/:customListName", function(req, res){

  

  const customListName = _.capitalize(req.params.customListName);
  
  const urlName = customListName.replace(/ /g,"%20");

  

  // findOne() only returns a single document
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems,
          finishedItems: defaultFinishedItems
        });

        list.save();

        console.log("Shouldn't make it here since list already exists")
        
        res.redirect("/"+customListName);
      }
      else{
        console.log(foundList.name)
        
        //show an existing list
        res.render("list",
        {
          listTitle: foundList.name ,
          listItems: foundList.items,
          path: urlName+"/finish",
          task:"Completed"
          
        })
        
      }
    }
  })

})

app.get("/:customList/finish",(req,res)=>{

  const customList = _.capitalize(req.params.customList);

  
  const urlName = customList.replace(/ /g,"%20");

 console.log("TEST");


  List.findOne({name:customList}, (err, completedList)=>{
    // show an existing list
    if(!err){
      if(!completedList){
        //create new list
        const list = new List({
          name: customList,
          items: defaultItems,
          finishedItems: defaultFinishedItems
        });

        list.save();
          
        res.redirect("/"+customList+"/finish");
      }

      else{
        res.render("finished",
        {
          listTitle: completedList.name ,
          listItems: completedList.finishedItems,
          path: "/"+urlName,
          task:"To-Do List"
        })
        
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
