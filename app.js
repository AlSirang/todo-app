const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const _ = require("lodash");



const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const itemSchema = {
    name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome to your todo list"
});

const item2 = new Item({
    name: "Hit + to add more items"
});

const item3 = new Item({
    name: "<-- Hit this to delte items"
});

const defaultItems = [item1, item2, item3];


// new Schema for custom list

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get('/', (req, res) => {

    Item.find({}, (err, result) => {
        if (result.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully inserted items");
                }
                res.redirect('/')
            })
        } else {
            res.render("list", { listTitle: "Today", items: result });
        }
    });

});


// create a new custome list
app.get("/:customListName", (req, res) => {

    const listName = _.capitalize(req.params.customListName);
    List.findOne({ name: listName }, (err, result) => {
        if (!err) {
            if (result) {
                return res.render("list", { listTitle: result.name, items: result.items });
            } else {
                // if there are no list of given name
                const list = new List({
                    name: listName,
                    items: defaultItems
                });
                list.save();
                res.redirect(`/${listName}`);
            }
        } else {
            console.log(err);
            return res.sendStatus(400)
        }
    });
});


app.post("/", (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    // create item
    const item = Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect('/');

    } else {
        List.findOne({ name: listName }, (err, foundList) => {
            if (!err) {
                foundList.items.push(item);
                foundList.save();

                // display updated page
                res.redirect(`/${listName}`);
            }
            else {
                console.log(err)
            }
        });
    }
});


app.post('/delete', (req, res) => {
    const itemID = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(itemID, (err) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: itemID } } }, (err, foundList) => {
            if (!err) {
                res.redirect(`/${listName}`);
            }
        });
    }
});





app.listen(PORT, () => {
    console.log(`Server is live at http://localhost:${PORT}`);
});






