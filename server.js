const express = require("express");
const app = express();
// const db = require("./db");
const cookieParser = require("cookie-parser");
const hb = require("express-handlebars");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// app.locals.helpers;
app.use((req, res, next) => {
    if (req.cookies == undefined) {
        return next();
    }
    res.redirect("/signed");
});

app.use(cookieParser());

app.use(express.static("public"));
//add

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});
app.post("/petition", (req, res) => {
    console.log(req.body);
    // if (req.body) {
    //     console.log(JSON.parse(req.body));
    //     res.cookie("signed", "true");
    // } else {
    //     res.send("no cookie no page");
    // }
});

app.get("/signed", (req, res) => {
    res.render("signers", {
        layout: "signed",
    });
});

app.listen(8080, () => console.log("hi"));

// db.getAllCities()
//     .then(({ rows }) => {
//         console.log(rws);
//     })
//     .catch((err) => console.log(err));
