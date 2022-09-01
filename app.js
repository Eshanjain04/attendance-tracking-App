const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
mongoose.connect("mongodb://localhost/attendance_tracker");
const user = require("./Schemas/user");
const subject = require("./Schemas/subject");
const app = express();
const port = 3002;

function calculatepercent(a,b){
    return `${parseInt((a/(b))*100)}%`
}

app.set("view engine", "ejs");
app.set("views","views");

app.use(express.static(path.join(__dirname,"public")));

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get("/", (req,res)=>{
    subject.find()
    .then(subject_name=>{
        res.render("home.ejs",{subject_name})
        
    }).catch(err=>console.log(err));
})

app.get("/add",(req,res)=>{
    res.status(200).render("add.ejs");
})

app.post("/subject/add", async (req,res)=>{
    subject.find({name:req.body.subjectName}).then(()=>{
        return;
    })
    subject.create({name:req.body.subjectName,attendance:0,percentage:"0%",totalClass:0});
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

})

app.listen(port,() => console.log("Server is running on port "+[port]));
