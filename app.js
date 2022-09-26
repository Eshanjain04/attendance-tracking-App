const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
mongoose.connect("mongodb+srv://admin:admin@attendancetracker.j2lmwhi.mongodb.net/?retryWrites=true&w=majority");
const user = require("./Schemas/user");
const subject = require("./Schemas/subject");
const app = express();
const port = process.env.PORT || 8080;
const bcrypt = require("bcrypt");
const session = require("express-session");
const middleware = require("./middleware");

function calculatepercent(a,b){
    return `${parseInt((a/(b))*100)}%`
}

app.use(session({
    secret:"sessionInProgress",
    resave : true,
    saveUninitialized : true
}))

app.set("view engine", "ejs");
app.set("views","views");

app.use(express.static(path.join(__dirname,"public")));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/add",(req,res)=>{
    res.status(200).render("add.ejs");
})

app.post("/subject/add", async (req,res)=>{
    subject.find({name:req.body.subjectName}).then(()=>{
        return;
    });

    await subject.create({name:req.body.subjectName,attendance:0,percentage:"0%",totalClass:0,users:req.session.user._id});
    res.redirect("/add");
})

app.post("/attend/:id",async (req,res)=>{
    const data = await subject.findOne({_id:req.params.id});
    let totalClass = data.totalClass;
    totalClass += 1;
    const previousAttendance = data.attendance;
    const updatedAttendance = previousAttendance + 1;
    const percentage = calculatepercent(updatedAttendance,totalClass);
    await subject.updateOne({_id:req.params.id},{attendance:updatedAttendance});
    await subject.updateOne({_id:req.params.id},{percentage:percentage}); 
    await subject.updateOne({_id:req.params.id},{totalClass:totalClass}); 
    res.redirect("/")
})

app.post("/missed/:id",async (req,res)=>{
    const data = await subject.findOne({_id:req.params.id});
    let totalClass = data.totalClass;
    totalClass += 1;
    const previousAttendance = data.attendance;
    const percentage = calculatepercent(previousAttendance,totalClass);
    await subject.updateOne({_id:req.params.id},{percentage:percentage}); 
    await subject.updateOne({_id:req.params.id},{totalClass:totalClass}); 
    res.redirect("/")
});

app.post("/subject/:id/delete",async (req,res)=>{
    await subject.deleteOne({_id:req.params.id});
    res.redirect("/")

});

app.get("/register",async (req,res)=>{
    res.render("register.ejs");
});

app.post("/register" ,async(req,res)=>{
    try{
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var email = req.body.email;
        var password = req.body.password;

        password = await bcrypt.hash(password,10);
        req.body.password = password;
        await user.create({
            firstName:firstName,
            lastName : lastName,
            email:email,
            password:password,
        });

        var userData = await user.findOne({email:email});
        req.session.user = userData;
        
        res.redirect("/");
    }catch(e){
        console.log(e);
    }
    
});

app.get("/",middleware.requireLogin,async (req,res)=>{
    subject.find().populate("users").then(data=>{
        var subject_name = new Set();
        for(var i of data){
            if(i.users._id.valueOf()===req.session.user._id){
                subject_name.add(i);
            }
        }
        res.render("home",{subject_name});
    })
    

});

app.get("/login",(req,res)=>{
    res.render("login")
})

app.post("/login",async(req,res)=>{
    var email = req.body.email;
    var password = req.body.password;
    var userData = await user.findOne({email:email});

    if(userData != null){
        var result = await bcrypt.compare(password,userData.password);
        if(result===true){
            req.session.user = userData;
            return res.redirect("/");
        }
    }

    res.status(400).json({message:"UserData not Found"});
});

app.get("/logout",(req,res,next)=>{
    if(req.session){
        req.session.destroy(() =>{
            res.redirect("/login");
        })
    }
});

app.listen(port,() => console.log("Server is running on port "+[port]));
