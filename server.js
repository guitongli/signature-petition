//  adjust login, css,

const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
const { hash, compare } = require("./bc.js");
const csurf = require("csurf");
// const bodyParser = require("body-parser");
let cookie_sec;

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// app.locals.helpers;

var csrfProtection = csurf();
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(csurf());

if (process.env.COOKIE_SECRET) {
    cookie_sec = process.env.COOKIE_SECRET;
} else {
    cookie_sec = require("./secrets.json").cookie_secret;
}

app.use(
    cookieSession({
        secret: cookie_sec,
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

app.get("/signup", csrfProtection, (req, res) => {
    res.render("signup", {
        layout: "welcoming",
        incomplete: false,
        csrfToken: req.csrfToken(),
    });
});
app.post("/signup", csrfProtection, (req, res) => {
    const { firstname, lastname, keys, email } = req.body;
    console.log(firstname, lastname, email, keys);
    if (!firstname || !lastname || !keys || !email) {
        res.render("signup", {
            layout: "welcoming",
            incomplete: true,
            csrfToken: req.csrfToken(),
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
                csrfToken: req.csrfToken(),
            });
            res.end();
        });
});

app.get("/login", csrfProtection, (req, res) => {
    res.render("login", {
        layout: "welcoming",
        csrfToken: req.csrfToken(),
    });
});
app.post("/login", csrfProtection, (req, res) => {
    const { email, keys } = req.body;
    if (!email || !keys) {
        res.render("login", {
            layout: "welcoming",
            incomplete: true,
            csrfToken: req.csrfToken(),
        });
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
                                    console.log(signature);
                                    // res.redirect("/petition");
                                    if (!signature.rows[0]) {
                                        res.redirect("/petition");
                                    } else if (signature.row[0]) {
                                        res.redirect("/thanks");
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
                                csrfToken: req.csrfToken(),
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
                    csrfToken: req.csrfToken(),
                });
            });
    }
});

app.get("/profile", csrfProtection, (req, res) => {
    res.render("profile", {
        layout: "welcoming",
        csrfToken: req.csrfToken(),
    });
});

app.post("/profile", csrfProtection, (req, res) => {
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

app.get("/petition", csrfProtection, (req, res) => {
    res.render("petition", {
        layout: "main",
        csrfToken: req.csrfToken(),
    });
});
app.post("/petition", csrfProtection, (req, res) => {
    console.log(req.body);
    // console.log(req.body.fn, req.body.ln, req.body.canvasimg);
    if (!req.body.canvasimg) {
        res.render("petition", {
            layout: "main",
            uncomplete: true,
            csrfToken: req.csrfToken(),
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
    var id = req.session.userID;
    console.log(img);
    db.getProgress(id)
        .then((result) => {
            const { firstname, lastname } = result.rows[0];

            db.countUsers()
                .then((count) => {
                    var signedNumber = count.rows[0].count;
                    res.render("thanks", {
                        layout: "signed",
                        signedNumber,
                        img,
                        firstname,
                        lastname,
                        // csrfToken: req.csrfToken(),
                    });
                })
                .catch((err) => {
                    console.log(err);
                });
        })
        .catch((err) => {
            console.log(err);
        });
});
app.post("/thanks", (req, res) => {
    console.log(req.body);
    const id = req.session.userID;
    db.deleteSig(id)
        .then((result) => {
            res.redirect("/petition");
            req.session.signature = null;
        })
        .catch((Err) => {
            console.log(Err);
        });
});
app.get("/petition/signers", (req, res) => {
    const id = req.session.userID;
    db.getProgress(id)
        .then((joint) => {
            const city = joint.rows[0].city;
            console.log(city);
            db.getNames()
                .then((joint) => {
                    const infoList = joint.rows;
                    res.render("signers", {
                        layout: "signed",
                        infoList,
                        city,
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

app.get("/profile/edit", csrfProtection, (req, res) => {
    const id = req.session.userID;
    db.getProgress(id)
        .then((joint) => {
            const infoList = joint.rows[0];
            res.render("edit", {
                layout: "signed",
                infoList,
                csrfToken: req.csrfToken(),
            });
        })
        .catch((err) => {
            console.log(err);
        });
});
app.post("/profile/edit", csrfProtection, (req, res) => {
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

    db.updateUser(newFirstname, newLastname, newEmail, id)
        .then((result) => {
            console.log(result);
        })
        .catch((Err) => {
            console.log(Err);
        });
    if (newKeys) {
        console.log(newKeys);
        hash(newKeys).then((hashedKey) => {
            console.log(hashedKey);
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

app.listen(process.env.PORT || 8080, () => console.log("hi"));
