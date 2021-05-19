const express=require("express");
const app=express();
const server=require("http").createServer(app);
const io=require("socket.io")(server);
const bodyParser=require('body-parser');
const session=require("express-session");
const MongoClient=require("mongodb").MongoClient;
const md5=require("md5");

var db;
var sess;
var userEmailId;

function db_connect(){
    MongoClient.connect("mongodb+srv://admin:BashAdminPassword@chat-app.yezha.mongodb.net/test",{useUnifiedTopology: true},async (err,client)=>{
        if(err){
            throw err;
        }
        db=await client.db("chatdb");
        await console.log("DB connection successful.");
    });
}
db_connect();

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname+"/views"));
app.use(express.static(__dirname+"/public"));
app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
}));

app.get("/",(req,res)=>{
    sess=req.session;
    userEmailId=sess.emailId;
    if(!sess.emailId){
        res.redirect("/login");
    }
    else{
        var result;
        async function getMsgs(){
            result=await db.collection("messages").find().toArray();
            res.render("index.ejs",{
                messages: result,
                emailId: userEmailId
            });
        }
        getMsgs();
    }
});
app.get("/login",(req,res)=>{
    sess=req.session;
    userEmailId=sess.emailId;
    if(sess.emailId){
        res.redirect("/");
    }
    else{
        res.render("login.ejs",{
            loginError: "",
            regError: ""
        });
    }
})
app.post("/login",(req,res)=>{
    sess=req.session;
    userEmailId=sess.emailId;
    if(sess.emailId){
        res.redirect("/");
    }
    else{
        async function checkUser(email, pass){
            let result=await db.collection("users").findOne({email: email});
            if(result===null){
                res.render("login.ejs",{
                    loginError: "Email Address not registered.",
                    regError: ""
                });
            }
            else{
                result=await db.collection("users").findOne({email: email,password: pass});
                if(result===null){
                    res.render("login.ejs",{
                        loginError: "Invalid Password.",
                        regError: ""
                    });
                }
                else{
                    sess.emailId=result["emailId"];
                    sess.email=email;
                    sess.name=result["name"];
                    req.session=sess;
                    userEmailId=sess.emailId;
                    res.redirect("/");
                }
            }
        }
        checkUser(req.body["email"],req.body["password"]);
    }
});
app.get("/register",(req,res)=>{
    sess=req.session;
    userEmailId=sess.emailId;
    if(sess.emailId){
        res.redirect("/");
    }
    else{
        res.render("login.ejs",{
            loginError: "",
            regError: ""
        });
    }
})
app.post("/register",(req,res)=>{
    sess=req.session;
    userEmailId=sess.emailId;
    if(sess.emailId){
        res.redirect("/");
    }
    else{
        async function addUser(email,pass,name){
            await db.collection("users").insertOne({email: email,password: pass, name: name,emailId: md5(email)});
            sess.emailId=md5(email);
            sess.email=email;
            sess.name=name;
            req.session=sess;
            userEmailId=sess.emailId;
            res.redirect("/");
        }
        async function checkUser(email,pass,name){
            let result=await db.collection("users").findOne({email: email});
            if(result===null){
                addUser(email,pass,name);
            }
            else{
                res.render("login.ejs",{
                    loginError: "Email already registered. Please Login.",
                    regError: ""
                })
            }
        }
        let email=req.body["email"];
        let password=req.body["password"];
        let name=req.body["name"];
        if(email.trim()==="" || password.trim()==="" || name.trim()===""){
            res.render("login.ejs",{
                regError: "All Fields are required.",
                loginError: ""
            })
        }
        else{
            checkUser(email,password,name);
        }
    }
})
app.get("/logout",(req,res)=>{
    sess=req.session;
    userEmailId=sess.emailId;
    if(sess.emailId){
        db.collection("users").updateOne({emailId: sess.emailId},{$set: {status: "offline"}});
        req.session.destroy();
        sess="";
    }
    res.redirect("/");
})
app.get("/profile/:emailId",(req,res)=>{
    let emailId=req.params.emailId;
    async function getDetails(emailId){
        let result=await db.collection("users").findOne({"emailId": emailId});
        if(result==null){
            await res.redirect("/");
        }
        else{
            await res.render("profile.ejs",{
                result: result
            });
        }
    }
    getDetails(emailId);
})

io.on("connection",async (socket)=>{  
    if(typeof(db)==='undefined'){
        await db_connect();
    }
    await db.collection("users").updateOne({emailId: userEmailId},{$set: {status: "online"}});
    socket.broadcast.emit("msgBox",`${sess.name} connected.`);
    socket.on("send-msg",async (message)=>{
        await db.collection("messages").insertOne({"emailId": userEmailId,"name": sess.name,"msg": message});
        await socket.broadcast.emit("add-msg",{message: message,type: "sender",name: sess.name});
    })
    socket.on("disconnect",()=>{
        socket.broadcast.emit("msgBox",`${sess.name} disconnected.`);
        db.collection("users").updateOne({emailId: userEmailId},{$set: {status: "offline"}});
    });
});
server.listen(3000);