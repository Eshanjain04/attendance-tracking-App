const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();
const dbUrl = process.env.DATABASE_URL;
mongoose.connect(dbUrl,()=>console.log("DB is Connected"));
const user = require("./Schemas/user");
const subject = require("./Schemas/subject");
const app = express();
const port = process.env.PORT || 8080;
const bcrypt = require("bcrypt");
const session = require("express-session");
const middleware = require("./middleware");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const secret = process.env.SECRET;

app.use(cors());

app.use("/student",(req,res,next)=>{
    try{
        const token = req.headers.authorization;
        const decoded = jwt.verify(token,secret);
        if(decoded){
            req.user = decoded.data;
            next();
        }else{
            res.json({message:"Not Authorized"})
        }
   }catch(e){
        res.status(400).json({message:e.message});
   }
})

app.use("/subject/add",(req,res,next)=>{
    try{
        const token = req.headers.authorization;
        const decoded = jwt.verify(token,secret);
        if(decoded){
            req.user = decoded.data;
            next();
        }else{
            res.json({message:"Not Authorized"})
        }
   }catch(e){
        res.status(400).json({message:e.message});
   }
})

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
    try{
        subject.find({name:req.body.subjectName}).then(()=>{
            return;
        });
    
        await subject.create({name:req.body.subjectName,attendance:0,percentage:"0%",totalClass:0,users:req.user});
        res.status(201).json({message:"Created"})
    }
    catch(e){
        res.status(400).json({message:e.message});
    }
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
    res.json({message:"missed"})
})

app.post("/missed/:id",async (req,res)=>{
    const data = await subject.findOne({_id:req.params.id});
    let totalClass = data.totalClass;
    totalClass += 1;
    const previousAttendance = data.attendance;
    const percentage = calculatepercent(previousAttendance,totalClass);
    await subject.updateOne({_id:req.params.id},{percentage:percentage}); 
    await subject.updateOne({_id:req.params.id},{totalClass:totalClass}); 
    res.json({message:"Attended"})
});

app.delete("/subject/:id/delete",async (req,res)=>{
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

        const userData = await user.findOne({email:email});
        if(!userData){
            password = await bcrypt.hash(password,10);
            req.body.password = password;
            await user.create({
                firstName:firstName,
                lastName : lastName,
                email:email,
                password:password,
            });
            const data = await user.findOne({email:email});
            const token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * 60),
                data: data._id
              }, secret);

              res.status(200).json({token:token})
        }else{
            res.status(400).json({message:"User Already Exists"});
        }


    }catch(e){
        res.status(400).json({message:e.message});
    }
    
});

app.get("/student",async (req,res)=>{
    subject.find().populate("users").then(data=>{
        var subject_name = new Set();
        for(var i of data){
            if(i.users._id.valueOf()===req.user){
                subject_name.add(i);
            }
        }
        let finalArr = [];
        for(let i of subject_name){
            finalArr.push(i);
        }
        console.log(subject_name);
        res.status(200).json({data:finalArr});
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
            const token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * 60),
                data: userData._id
              }, secret);

              res.status(200).json({token:token})
        }else{
            res.status(400).json({message:"Password Does not match"})
        }
    }else{
        res.status(400).json({message:"User not Found"})
    }
});

app.get("/logout",(req,res,next)=>{
    if(req.session){
        req.session.destroy(() =>{
            res.redirect("/login");
        })
    }
});

app.listen(port,() => console.log("Server is running on port "+[port]));
