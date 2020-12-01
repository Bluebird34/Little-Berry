const express = require("express");
const app = express();
let bodyParser = require('body-parser')
app.use(bodyParser.raw({ type: "*/*" }))
let morgan = require("morgan");
app.use(morgan("combined"));
let cors = require("cors");
app.use(cors());

let count=1
let users = new Map()
let sessions= new Map()
let channels= new Map()
let joined=new Map()
let banned=new Map()
let messages=new Map()


app.get("/sourcecode", (req, res) => {
res.send(require('fs').readFileSync(__filename).toString())
})


// Q1--This endpoint lets users create an account.

app.post("/signup", (req, res) => {
    let parsed = JSON.parse(req.body)
    let userName = parsed.username
    let passWord = parsed.password
    console.log("password", passWord)

    if (users.has(userName)) {
        res.send(JSON.stringify({ success: false, reason: "Username exists" }))
        return
    }
  
    if (passWord===undefined||passWord.length ===0) {      
        res.send(JSON.stringify({ success: false, reason: "password field missing" }))
        return
    }
  
    if (userName===undefined||userName.length ===0) {
        res.send(JSON.stringify({ success: false, reason: "username field missing" }))
        return
    }
  
    users.set(userName, passWord)
    res.send(JSON.stringify({ success: true }))
})


// Q2--This endpoint lets users sign in an account.

app.post("/login", (req, res) => {    
    let parsed = JSON.parse(req.body)
    let userName = parsed.username
    let actualPassword = parsed.password
    let expectedPassword = users.get(userName)    

    if (actualPassword===""||actualPassword===undefined) {
        res.send(JSON.stringify({ success: false, reason: "password field missing" }))
        return
    } 
  
    if (userName===""||userName===undefined) {        
        res.send(JSON.stringify({ success: false, reason: "username field missing" }))
        return
    } 
  
    if (!users.has(userName)) {
        res.send(JSON.stringify({ success: false, reason: "User does not exist" }))
        return
    } 
  
    if (actualPassword!== expectedPassword) {
        res.send(JSON.stringify({ success: false, reason: "Invalid password" }))
        return
    } 
  
  let token = "sess"+count
  res.send(JSON.stringify({success:true,token:token}))  
  sessions.set(token,userName)
  count++
})


// Q3--This endpoint lets users create an channel.

app.post("/create-channel", (req, res) => {
    let header = req.headers  
    let token=header.token
    let parsedBody= JSON.parse(req.body)
    let channelName = parsedBody.channelName 
  
    if (token===""||token===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return
    }
  
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } 
  
    if (!sessions.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channelName === channels.get(token)) {
        res.send(JSON.stringify({ success: false, reason: "Channel already exists" }))
        return
    }
  
  res.send(JSON.stringify({ success: true}))
  channels.set(token,channelName)
})


// Q4--This endpoint lets users join a channel.

app.post("/join-channel", (req, res) => {
    let header = req.headers  
    let token = header.token
    let parsedBody = JSON.parse(req.body)
    let channelName = parsedBody.channelName     

    if (token===""||token===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return
    }
  
    if (!sessions.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }  
  
    let isFound = false;
    for(let name of channels.values()){
      if(channelName === name){
      isFound = true;
      }
    }
    if(isFound == false){
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }  
  
    if (channelName === joined.get(token)) {
        res.send(JSON.stringify({ success: false, reason: "User has already joined" }))
        return
    }  

    if (sessions.get(token) === banned.get(channelName)) {
        res.send(JSON.stringify({ success: false, reason: "User is banned" }))
        return
    } 
    
  res.send(JSON.stringify({ success: true}))
  joined.set(token,channelName)
})


// Q5--This endpoint lets users leave an channel.

app.post("/leave-channel", (req, res) => {
    let header = req.headers  
    let token=header.token
    let parsedBody= JSON.parse(req.body)
    let channelName = parsedBody.channelName     

    if (token===""||token===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return 
    }
  
    if (!sessions.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } 
  
    let isFound = false;
    for(let name of channels.values()){
      if(channelName === name){
      isFound = true;
      }
    }
    if(isFound == false){
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    } 
  
    let isBelong = false
    if (channelName === joined.get(token)) {
      isBelong = true
    }   
    if(isBelong== false){
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    }   
    // error here?
    //   if(!joined.get(token)===channelName){
    //     res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
    //     return
    // }
  res.send(JSON.stringify({ success: true})) 
  joined.delete(token)
})


// Q6--This endpoint provides the usernames of everyone in the channel.

app.get("/joined", (req, res) => {
    let header = req.headers  
    let token=header.token
    let query = req.query
    let channelName =query.channelName    
 
    
    if (token===""||token===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return 
    }
  
    if (!sessions.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }        
    
    let isFound = false;
    for(let name of channels.values()){
      if(channelName === name){
      isFound = true;
      }
    }
    if(isFound == false){
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    } 
  
    let isBelong = false
    if (channelName === joined.get(token)) {
      isBelong = true
    }   
    if(isBelong== false){
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    }  

    let joinedUsers=[]
    for (let tokenList of joined.keys()) {
      if(channelName===joined.get(tokenList)){
          let joinedUserName=""
          joinedUserName=sessions.get(tokenList)
          joinedUsers.push(joinedUserName)
      }
    }
  res.send(JSON.stringify({ success: true,joined: joinedUsers})) 
})


// Q7--This endpoint lets users delete a channel that they had previously created.

app.post("/delete", (req, res) => {
    let header = req.headers  
    let ownerToken=header.token
    let parsedBody= JSON.parse(req.body)
    let channelName = parsedBody.channelName     

    if (ownerToken===""||ownerToken===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return 
    }
  
    if (!sessions.has(ownerToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } 
  
    let isFound = false;
    for(let name of channels.values()){
      if(channelName === name){
      isFound = true;
      }
    }
    if(isFound == false){
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
    let isOwner = false
    if (channelName===channels.get(ownerToken)) {
        isOwner = true
    }
    if(isOwner == false){
        res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
        return
    }   
  
  res.send(JSON.stringify({ success: true})) 
  channels.delete(ownerToken)
})  


// Q8--This endpoint lets users kick someone off of a channel.

app.post("/kick", (req, res) => {
    let header = req.headers  
    let ownerToken=header.token
    let parsedBody= JSON.parse(req.body)
    let channelName = parsedBody.channelName
    let kickedUser = parsedBody.target

    if (ownerToken===""||ownerToken===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return 
    }
  
    if (!sessions.has(ownerToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
  
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } 
  
    if (kickedUser===""||kickedUser===undefined) {
        res.send(JSON.stringify({ success: false, reason: "target field missing" }))
        return
    }
  

    let isOwner = false
    if (channelName===channels.get(ownerToken)) {
        isOwner = true
    }
    if(isOwner == false){
        res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
        return
    }         

 
  // kick off a target user
    for (let tokenList of joined.keys()) {
        if(sessions.get(tokenList)===kickedUser & joined.get(tokenList)===channelName ){
           joined.delete(tokenList)
        }
    }
  
  res.send(JSON.stringify({ success: true}))     
})  

// Q9--This endpoint lets users ban someone from a channel.

app.post("/ban", (req, res) => {
    let header = req.headers  
    let ownerToken=header.token
    let parsedBody= JSON.parse(req.body)
    let channelName = parsedBody.channelName
    let bannedUser = parsedBody.target

    if (ownerToken===""||ownerToken===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return 
    }
  
    if (!sessions.has(ownerToken)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    }
  
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    } 
  
    if (bannedUser===""||bannedUser===undefined) {
        res.send(JSON.stringify({ success: false, reason: "target field missing" }))
        return
    }
  
    let isOwner = false
    if (channelName===channels.get(ownerToken)) {
        isOwner = true
    }
    if(isOwner == false){
        res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
        return
    }     
  
  res.send(JSON.stringify({ success: true}))
  banned.set(channelName,bannedUser)
})

// Q10--This endpoint lets users send a message to a particular channel.

app.post("/message", (req, res) => {
    let header = req.headers  
    let token=header.token
    let parsedBody= JSON.parse(req.body)
    let channelName = parsedBody.channelName
    let contents = parsedBody.contents

    if (token===""||token===undefined) {
        res.send(JSON.stringify({ success: false, reason: "token field missing" }))
        return 
    }
  
    if (!sessions.has(token)) {
        res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
        return
    } 
        
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }

    let isBelong = false
    if (channelName === joined.get(token)) {
      isBelong = true
    }   
    if(isBelong== false){
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    }
  
    if (contents===""||contents===undefined) {
        res.send(JSON.stringify({ success: false, reason: "contents field missing" }))
        return
    }   
  //directMessages can't set as a global var.
  //directMessages should collect all the messages in one channel.

    let directMessages
    if(messages.has(channelName)){
      directMessages=messages.get(channelName)
    }
    else{
    directMessages=[]
    }
    let user = sessions.get(token)
    directMessages.push({ from: user, contents: contents })
    messages.set(channelName,directMessages) 


   res.send(JSON.stringify({ success: true}))
})


// Q11--This endpoint lets users see all the messages in a particular endpoint.

app.get("/messages", (req, res) => {
    let header = req.headers  
    let token=header.token
    let query = req.query
    let channelName =query.channelName          
 
    if (channelName===""||channelName===undefined) {
        res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
        return
    }
  
  
    let isFound = false;
    for(let name of channels.values()){
      if(channelName === name){
      isFound = true;
      }
    }
    if(isFound == false){
        res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
        return
    }
  
  
    let isBelong = false
    if (channelName === joined.get(token)) {
      isBelong = true
    }   
    if(isBelong== false){
        res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" }))
        return
    } 
  
    let msgs=messages.get(channelName)
    if(msgs==undefined){
      res.send(JSON.stringify({ success: true, messages:[]}))
    }
  res.send(JSON.stringify({ success: true, messages:msgs})) 
})


// listen for requests :)
app.listen(process.env.PORT||3000)