//https://github.com/expressjs/csurf

const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
const { hash, compare } = require("./bc.js");
// const csurf = require("csurf");
// const bodyParser = require("body-parser");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// app.locals.helpers;

// var csrfProtection = csurf({ cookie: true });
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(csurf({ cookie: true }));

app.use(
    cookieSession({
        secret: `lastname matters`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
//add
app.use((req, res, next) => {
    // res.redirect("/signup"); !!!
    return next();
});

app.get("/", (req, res) => {
    if (req.session.userID) {
        if (req.session.signature) {
            res.redirect("/petition/signers");
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/signup");
    }
});

app.get("/signup", (req, res) => {
    res.render("signup", {
        layout: "welcoming",
        incomplete: false,
    });
});
app.post("/signup", (req, res) => {
    const { firstname, lastname, keys, email } = req.body;
    console.log(firstname, lastname, email, keys);
    if (!firstname || !lastname || !keys || !email) {
        res.render("signup", {
            layout: "welcoming",
            incomplete: true,
        });
        res.end();
    }

    hash(keys)
        .then((hashedkeys) => {
            return db
                .insertUser(firstname, lastname, email, hashedkeys)
                .then((returns) => {
                    res.session.userID = returns.rows[0].id;
                })
                .catch((err) => {
                    console.log(err);
                });
        })
        .catch((err) => {
            console.log(err);
            res.render("signup", {
                layout: "welcoming",
                internalErr: true,
            });
            res.end();
        });

    res.redirect("/petition");
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "welcoming",
    });
});
app.post("/login", (req, res) => {
    const { email, keys } = req.body;
    db.getInfo(email).then((info) => {
        const hashkeys = info.rows[0].hashkeys;
        req.session.userID = info.rows[0].id;
        compare(keys, hashkeys)
            .then((result) => {
                if (result == true) {
                    db.getImg(info.rows[0].id)
                        .then((signature) => {
                            if (!signature.rows[0]) {
                                res.redirect("/petition");
                            } else if (signature.row[0]) {
                                res.redirect("/signers");
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                            res.redirect("/petition");
                        });
                } else {
                    res.render("login", {
                        layout: "welcoming",
                        incomplete: true,
                    });
                }
            })
            .catch((err) => {
                console.log(err);
            });
    });
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
        // csrfToken: req.csrfToken(),
    });
});
app.post("/petition", (req, res) => {
    console.log(req.body);
    // console.log(req.body.fn, req.body.ln, req.body.canvasimg);
    if (!req.body.canvasimg) {
        res.render("petition", {
            layout: "main",
            uncomplete: true,
            // csrfToken: req.csrfToken(),
        });
    } else {
        db.insertSig(req.body.canvasimg)
            .then((result) => {
                console.log("returned it");
                console.log(result.rows);
                return result.rows;
            })
            .catch((err) => {
                console.log(err);
            });
        req.session.signature = req.body.canvasimg;
        res.redirect("/thanks");
    }
});

app.get("/thanks", (req, res) => {
    var img = req.session.signature;
    db.countUsers()
        .then((count) => {
            var signedNumber = count.rows[0].count;
            res.render("thanks", {
                layout: "signed",
                signedNumber,
                img,
                // csrfToken: req.csrfToken(),
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/petition/signers", (req, res) => {
    db.getNames()
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
                // csrfToken: req.csrfToken(),
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.listen(8080, () => console.log("hi"));
