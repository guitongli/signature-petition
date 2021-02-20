//to do: https://github.com/expressjs/csurf, adjust login, css, city api

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
        maxAge: 1000 * 60 * 60 * 24,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
//add
app.use((req, res, next) => {
    // res.redirect("/signup"); !!!
    // need to solve double entry problem
    // need to detect both signed and registered and redirect
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
                    req.session.userID = returns.rows[0].id;
                    res.redirect("/profile");
                    res.end();
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
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "welcoming",
    });
});
app.post("/login", (req, res) => {
    const { email, keys } = req.body;
    if (!email || !keys) {
        res.render("login", {
            layout: "welcoming",
            incomplete: true,
        });
        res.end();
    } else {
        db.getInfo(email)
            .then((info) => {
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
            })
            .catch((err) => {
                console.log(err);
                res.render("login", {
                    layout: "welcoming",
                    nonexist: true,
                });
            });
    }
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "welcoming",
    });
});

app.post("/profile", (req, res) => {
    var { age, city, url, statement } = req.body;
    if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
        url = "http://" + url;
    }
    const id = req.session.userID;

    db.insertPro(age, city, url, statement, id)
        .then((result) => {
            console.log(result);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
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
        const user_id = req.session.userID;
        db.insertSig(req.body.canvasimg, user_id)
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
app.post("/thanks", (req, res) => {
    if (!req.body) {
        const id = req.session.userID;
        db.updateSig(null, id)
            .then((result) => {
                res.redirect("/petition");
            })
            .catch((Err) => {
                console.log(Err);
            });
    }
});
app.get("/petition/signers", (req, res) => {
    const id = req.session.userID;
    db.getProgress(id)
        .then((joint) => {
            const city = joint.rows[0].city;
            db.getNames()
                .then((joint) => {
                    const infoList = joint.rows;
                    res.render("signers", {
                        layout: "signed",
                        infoList,
                        city,
                        // csrfToken: req.csrfToken(),
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
        })
        .catch((Err) => {
            console.log("cant find city", Err);
        });
});

app.get("/petition/signers/:city", (req, res) => {
    const { city } = req.params;
    db.getCitySigners(city).then((infoList) => {
        const userList = infoList.rows;
        res.render("citysigners", {
            layout: "signed",
            userList,
            city,
        });
    });
});

app.get("/profile/edit", (req, res) => {
    const id = req.session.userID;
    db.getProgress(id)
        .then((joint) => {
            const infoList = joint.rows[0];
            res.render("edit", {
                layout: "signed",
                infoList,
            });
        })
        .catch((err) => {
            console.log(err);
        });
});
app.post("/profile/edit", (req, res) => {
    const id = req.session.userID;
    var {
        newFirstname,
        newLastname,
        newEmail,
        newKeys,
        newAge,
        newCity,
        newUrl,
    } = req.body;

    const q1 = db.updateUser("firstname", newFirstname, id);
    const q2 = db.updateUser("lastname", newLastname, id);
    const q3 = db.updateUser("email", newEmail, id);

    Promise.all([q1, q2, q3])
        .then((result) => {
            console.log(result);
        })
        .catch((Err) => {
            console.log(Err);
        });
    if (newKeys !== "******") {
        hash(newKeys).then((hashedKey) => {
            db.updateUser("hashkeys", hashedKey, id);
        });
    }
    if (newUrl.indexOf("http://") !== 0 && newUrl.indexOf("https://") !== 0) {
        newUrl = "http://" + newUrl;
    }
    db.insertUserPro(newAge, newCity, newUrl, id)
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            console.log(err);
        });

    res.redirect("/profile");
});
app.listen(8080, () => console.log("hi"));
