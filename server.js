const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// app.locals.helpers;
app.use((req, res, next) => {
    if (req.session == undefined) {
        return next();
    }
    res.redirect("/petition/signers");
});

app.use(
    cookieSession({
        secret: `lastname matters`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
//add

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});
app.post("/petition", (req, res) => {
    // console.log(req.body.fn, req.body.ln, req.body.canvasimg);
    if (
        req.body.fn == undefined ||
        req.body.ln == undefined ||
        req.body.canvasimg == undefined
    ) {
        res.render("petition", {
            layout: "main",
            uncomplete: true,
        });
    } else {
        db.insert(req.body.fn, req.body.ln, req.body.canvasimg)
            .then((result) => {
                console.log("returned it");
                console.log(result.rows);
                return result.rows;
            })
            .catch((err) => {
                console.log(err);
            });
        req.session.signature = req.body.canvasimg;
        res.redirect("/signed");
    }
});

app.get("/signed", (req, res) => {
    db.count();
    var img = req.session.signature
        .then((count) => {
            var signedNumber = count.rows[0].count;
            res.render("thanks", {
                layout: "signed",
                signedNumber,
                img,
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/petition/signers", (req, res) => {
    db.names()
        .then((fullnames) => {
            const names = fullnames.rows;
            var nameList = [];
            for (var i = 0; i < names.length; i++) {
                var fullname = [names[i].firstname, names[i].lastname].join(
                    " "
                );

                nameList.push(fullname);
            }

            res.render("signers", {
                layout: "signed",
                nameList,
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.listen(8080, () => console.log("hi"));
