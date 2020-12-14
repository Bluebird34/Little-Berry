const express = require("express");
const app = express();
let bodyParser = require("body-parser");
app.use(bodyParser.raw({ type: "*/*" }));
let morgan = require("morgan");
app.use(morgan("combined"));
let cors = require("cors");
app.use(cors());

let count = 1;

let users = new Map();
let sessions = new Map();
let listing = [];
let cart = new Map();
let purchaseHistory = [];
let messages = [];

app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

// Q1--This endpoint lets users create an account.

app.post("/signup", (req, res) => {
  let parsed = JSON.parse(req.body);
  let userName = parsed.username;
  let passWord = parsed.password;

  if (users.has(userName)) {
    res.send(JSON.stringify({ success: false, reason: "Username exists" }));
    return;
  }

  if (passWord === undefined || passWord.length === 0) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }

  if (userName === undefined || userName.length === 0) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }

  users.set(userName, passWord);
  res.send(JSON.stringify({ success: true }));
});

// Q2--This endpoint lets users sign in an account.

app.post("/login", (req, res) => {
  let parsed = JSON.parse(req.body);
  let userName = parsed.username;
  let actualPassword = parsed.password;
  let expectedPassword = users.get(userName);

  if (actualPassword === "" || actualPassword === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "password field missing" })
    );
    return;
  }

  if (userName === "" || userName === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "username field missing" })
    );
    return;
  }

  if (!users.has(userName)) {
    res.send(JSON.stringify({ success: false, reason: "User does not exist" }));
    return;
  }

  if (actualPassword !== expectedPassword) {
    res.send(JSON.stringify({ success: false, reason: "Invalid password" }));
    return;
  }

  let token = "sess" + count;
  res.send(JSON.stringify({ success: true, token: token }));
  sessions.set(token, userName);
  count++;
});

// Q3--This endpoint lets users change their password.

app.post("/change-password", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let parsedBody = JSON.parse(req.body);
  let oldPassword = parsedBody.oldPassword;
  let newPassword = parsedBody.newPassword;

  if (token === "" || token === undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  let isFound = false;
  if (oldPassword === users.get(sessions.get(token))) {
    isFound = true;
  }
  if (isFound == false) {
    res.send(
      JSON.stringify({ success: false, reason: "Unable to authenticate" })
    );
    return;
  }

  res.send(JSON.stringify({ success: true }));
  users.set(sessions.get(token), newPassword);
});

// Q4--This endpoint adds an item to the marketplace, which can be purchased by any user.

app.post("/create-listing", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let parsedBody = JSON.parse(req.body);
  let price = parsedBody.price;
  let description = parsedBody.description;

  if (token === "" || token === undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (price === "" || price === undefined) {
    res.send(JSON.stringify({ success: false, reason: "price field missing" }));
    return;
  }

  if (description === "" || description === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "description field missing" })
    );
    return;
  }

  let listingId = "list" + count;
  res.send(JSON.stringify({ success: true, listingId: listingId }));
  let seller = sessions.get(token);
  listing.push({
    price: price,
    description: description,
    itemId: listingId,
    sellerUsername: seller
  });
  count++;
});

// Q5--This endpoint is used to get information about a particular item for sale.

app.get("/listing", (req, res) => {
  let query = req.query;
  let listingId = query.listingId;
  console.log("*******the listing length is:*****" + listing.length);

  let isFound = false;
  for (var i = 0; i < listing.length; i++)
    if (listing[i].itemId === listingId) {
      res.send(JSON.stringify({ success: true, listing: listing[i] }));
      console.log("****this list item price is:*****" + listing[i].price);
      isFound = true;
    }
  if (isFound == false) {
    res.send(JSON.stringify({ success: false, reason: "Invalid listing id" }));
    return;
  }
});

// Q6--This endpoint is used to modify a listing.

app.post("/modify-listing", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let parsedBody = JSON.parse(req.body);
  let itemId = parsedBody.itemid;
  let newPrice = parsedBody.price;
  let newDescription = parsedBody.description;

  if (token === "" || token === undefined) {
    res.send(JSON.stringify({ success: false, reason: "token field missing" }));
    return;
  }

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (itemId === "" || itemId === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "itemid field missing" })
    );
    return;
  }

  for (var i = 0; i < listing.length; i++) {
    console.log("\n" + itemId + " # " + sessions.get(token));
    console.log(listing[i].itemId + " | " + listing[i].sellerUsername);
    console.log("****this list item price before is:*****" + listing[i].price);
    if (listing[i].itemId === itemId) {
      console.log(typeof newPrice);

      if (newPrice != "" && newPrice != undefined) {
        console.log(newPrice);
        listing[i].price = newPrice;
        console.log(
          "****this list item price after is:*****" + listing[i].price
        );
        console.log(newPrice);
      }

      if (newDescription != "" && newDescription != undefined) {
        listing[i].description = newDescription;
      }
    }
  }

  res.send(JSON.stringify({ success: true }));
});

// Q7--This endpoint is used to add an item to a user's cart.

app.post("/add-to-cart", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let parsedBody = JSON.parse(req.body);
  let wantedItemId = parsedBody.itemid;

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (wantedItemId == "" || wantedItemId == undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "itemid field missing" })
    );
    return;
  }

  let isFound = false;
  for (var i = 0; i < listing.length; i++){
    if (wantedItemId === listing[i].itemId) {
      isFound = true;
    }
  }
  if (isFound == false) {
    res.send(JSON.stringify({ success: false, reason: "Item not found" }));
    return;
  }

  res.send(JSON.stringify({ success: true }));

  let itemList;
  if (cart.get(sessions.get(token)) != undefined && cart.get(sessions.get(token)) != null) {
    itemList = cart.get(sessions.get(token));
    console.log(itemList);
  } else {
    itemList = [];
  }
  
  for (var i = 0; i < listing.length; i++) {
    if (wantedItemId == listing[i].itemId) {
      itemList.push({
        price: listing[i].price,
        description: listing[i].description,
        itemId: listing[i].itemId,
        sellerUsername: listing[i].sellerUsername
      });
    }
  }
  cart.set(sessions.get(token), itemList);
  return;
});

// Q8--This endpoint is used to retrieve a list of items in a user's cart.

app.get("/cart", (req, res) => {
  let header = req.headers;
  let token = header.token;
  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  res.send(JSON.stringify({ success: true, cart: cart.get(sessions.get(token))}));
});

// Q9--This endpoint is used to purchase all the items in a user's cart.

app.post("/checkout", (req, res) => {
  let header = req.headers;
  let token = header.token;

  let checkOut = new Map();

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

   if (cart.get(sessions.get(token)) == "" || cart.get(sessions.get(token)) == undefined) {
    res.send(JSON.stringify({ success: false, reason: "Empty cart" }));
    return;
  }
  
  for (var i = 0; i < cart.get(sessions.get(token)).length; i++) {
    for (var j = 0; j < purchaseHistory.length; j++) {
      for (let list of purchaseHistory[j].values()) {
        for (var k = 0; k < list.length; k++){
          if (cart.get(sessions.get(token))[i].itemId == list[k].itemId) {
          res.send(
            JSON.stringify({
              success: false,
              reason: "Item in cart no longer available"
            })
          );
          return;
        }
          
        }
        
      }
    }
  }
  
  checkOut.set(sessions.get(token), cart.get(sessions.get(token)));
  cart.delete(sessions.get(token));
  purchaseHistory.push(checkOut);
  // [milk,egg]
  res.send(JSON.stringify({ success: true }));
  return;
});

// Q10--This endpoint is used to get a list of items that were purchased by a particular user.

app.get("/purchase-history", (req, res) => {
  let header = req.headers;
  let token = header.token;

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }
  
  let userPurchaseHistory = [];

    
  for (var i = 0; i < purchaseHistory.length; i++) {
    console.log(purchaseHistory[i].keys().next().value);
    console.log(sessions.get(token));
    if(sessions.get(token) == purchaseHistory[i].keys().next().value){
      let tempArray = purchaseHistory[i].get(purchaseHistory[i].keys().next().value);
      console.log(tempArray);
       for (var j = 0; j < tempArray.length; j++) {
          userPurchaseHistory.push(tempArray[j]);
       } 
      console.log(userPurchaseHistory);
    }      
  }
  
  
  res.send(JSON.stringify({ success: true, purchased: userPurchaseHistory }));
});

// Q11--This endpoint lets a user contact another user in the marketplace.

app.post("/chat", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let parsedBody;
  if(req.body !== undefined){
    parsedBody = JSON.parse(req.body);
  }else{
    parsedBody = "";
  }
   
  let destination = parsedBody.destination;
  let contents = parsedBody.contents;

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (destination === "" || destination === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "destination field missing" })
    );
    return;
  }

  if (contents === "" || contents === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "contents field missing" })
    );
    return;
  }

  if (!users.has(destination)) {
    res.send(
      JSON.stringify({
        success: false,
        reason: "Destination user does not exist"
      })
    );
    return;
  }

  messages.push({
    from: sessions.get(token),
    to: destination,
    contents: contents
  });

  res.send(JSON.stringify({ success: true }));
});

// Q12--This endpoint lets a user retrieve all the messages sent between themselves and another user.

app.post("/chat-messages", (req, res) => {
  let header = req.headers;
  let token = header.token;
  let parsedBody = JSON.parse(req.body);
  let destination = parsedBody.destination;

  let chatsHistory = [];

  if (!sessions.has(token)) {
    res.send(JSON.stringify({ success: false, reason: "Invalid token" }));
    return;
  }

  if (destination === "" || destination === undefined) {
    res.send(
      JSON.stringify({ success: false, reason: "destination field missing" })
    );
    return;
  }

  if (!users.has(destination)) {
    res.send(
      JSON.stringify({ success: false, reason: "Destination user not found" })
    );
    return;
  }

  for (var i = 0; i < messages.length; i++) {
    if (
      messages[i].from == sessions.get(token) ||
      messages[i].from == destination
    ) {
      chatsHistory.push({
        from: messages[i].from,
        contents: messages[i].contents
      });
    }

    if (
      messages[i].to == sessions.get(token) ||
      messages[i].to == destination
    ) {
      chatsHistory.push({
        from: messages[i].from,
        contents: messages[i].contents
      });
    }
  }
  res.send(JSON.stringify({ success: true, messages: chatsHistory }));
});

/**

 // Q13--This endpoint is used by a seller of an item to indicate that it has shipped to a purchaser of an item.
  
app.post("/ship", (req, res) => {

  

 
  res.send(JSON.stringify({ success: true }));
});  
       


  
 // Q14--This endpoint gets the shipping status of an item.
  
app.get("/status", (req, res) => {

  

 
  res.send(JSON.stringify({ success: true, status: }));
});  



 // Q15--This endpoint is used by a seller of an item to indicate that it has shipped to a purchaser of an item.
  
app.post("/review-seller", (req, res) => {

  

 
  res.send(JSON.stringify({ success: true }));
});  




 // Q16--This endpoint is used by a seller of an item to indicate that it has shipped to a purchaser of an item.
  
app.post("/reviews", (req, res) => {

  

 
  res.send(JSON.stringify({ success: true, reviews: }));
});  
  
  
  


 // Q17--This endpoint is used by a seller of an item to indicate that it has shipped to a purchaser of an item.
  
app.post("/selling", (req, res) => {

  

 
  res.send(JSON.stringify({ success: true, selling: }));
});  
  
**/

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
