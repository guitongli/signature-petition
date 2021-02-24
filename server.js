const express = require("express");
const app = express();
const db = require("./db");
const cookieSession = require("cookie-session");
const hb = require("express-handlebars");
const { hash, compare } = require("./bc.js");
const csurf = require("csurf");
// const bodyParser = require("body-parser");
const {
    checkLoggedIn,
    checkExisting,
    checkLoggedOut,
    checkNotSigned,
    checkSigned,
} = require("./middleware");
var currentID;
let cookie_sec;

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// app.locals.helpers;

var csrfProtection = csurf();
// app.use(bodyParser.urlencoded({ extended: false }));

if (process.env.COOKIE_SECRET) {
    cookie_sec = process.env.COOKIE_SECRET;
} else {
    cookie_sec = require("./secrets.json").cookie_secret;
}

app.use(
    cookieSession({
        secret: cookie_sec,
        maxAge: 1000 * 60 * 60 * 24,
        ecure: false,
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
//add
app.use((req, res, next) => {
    console.log("redireted", req.session.userID);
    res.setHeader("X-Frame-Options", "DENY");
    next();
    // res.redirect("/signup"); !!!
    // need to solve double entry problem
    // need to detect both signed and registered and redirect
});

app.get("/", checkLoggedOut, (req, res) => {
    res.render("landing", {
        layout: "landing_signup",
    });
});

app.get("/signup", checkLoggedOut, csrfProtection, (req, res) => {
    res.render("signup", {
        layout: "landing_signup",
        incomplete: false,
        csrfToken: req.csrfToken(),
    });
});
app.post("/signup", csrfProtection, (req, res) => {
    const { firstname, lastname, keys, email } = req.body;
    console.log(req.session);
    if (!firstname || !lastname || !keys || !email) {
        res.render("signup", {
            layout: "landing_signup",
            incomplete: true,
            csrfToken: req.csrfToken(),
        });
    }

    hash(keys)
        .then((hashedkeys) => {
            return db
                .insertUser(firstname, lastname, email, hashedkeys)
                .then((returns) => {
                    req.session.userID = returns.rows[0].id;
                    currentID = returns.rows[0].id;
                    console.log("signup id", req.session.userID);
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
                layout: "landing_signup",
                internalErr: true,
                csrfToken: req.csrfToken(),
            });
            res.end();
        });
});

app.get("/login", checkLoggedOut, csrfProtection, (req, res) => {
    res.render("login", {
        layout: "forlogin",
        csrfToken: req.csrfToken(),
    });
});
app.post("/login", csrfProtection, (req, res) => {
    const { email, keys } = req.body;
    if (!email || !keys) {
        res.render("login", {
            layout: "forlogin",
            incomplete: true,
            csrfToken: req.csrfToken(),
        });
    } else {
        db.getInfo(email)
            .then((info) => {
                const hashkeys = info.rows[0].hashkeys;
                req.session.userID = info.rows[0].id;
                currentID = info.rows[0].id;
                console.log("loggedid", info.rows[0].id);
                console.log(req.session.userID);
                compare(keys, hashkeys)
                    .then((result) => {
                        if (result == true) {
                            db.getImg(info.rows[0].id)
                                .then((signature) => {
                                    console.log(
                                        "verified",
                                        req.session.userID,
                                        info.rows[0].id
                                    );
                                    // res.redirect("/petition");
                                    if (signature.rows[0].canvasimg) {
                                        req.session.signature =
                                            signature.rows[0].canvasimg;
                                        console.log(
                                            "sigeed id",
                                            req.session.userID
                                        );

                                        res.redirect("/thanks");
                                    } else {
                                        res.redirect("/petition");
                                    }
                                })
                                .catch((err) => {
                                    console.log(err);
                                    res.redirect("/petition");
                                });
                        } else {
                            res.render("login", {
                                layout: "forlogin",
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
                    layout: "forlogin",
                    nonexist: true,
                    csrfToken: req.csrfToken(),
                });
            });
    }
});

app.get("/profile", checkLoggedIn, csrfProtection, (req, res) => {
    res.render("profile", {
        layout: "landing_signup",
        csrfToken: req.csrfToken(),
    });
});

app.post("/profile", csrfProtection, (req, res) => {
    var { age, city, url, statement } = req.body;
    if (url && url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
        url = "http://" + url;
    }
    const id = req.session.userID;

    db.insertPro(age, city, url, statement, id)
        .then((result) => {
            console.log(id);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/petition", checkNotSigned, csrfProtection, (req, res) => {
    req.session.userID = currentID;
    res.render("petition", {
        layout: "signature",
        csrfToken: req.csrfToken(),
    });
    console.log("notsidned yet", req.session.userID);
});
app.post("/petition", csrfProtection, (req, res) => {
    console.log("petition", req.session.userID);
    // console.log(req.body.fn, req.body.ln, req.body.canvasimg);
    if (!req.body.canvasimg) {
        res.render("petition", {
            layout: "signature",
            uncomplete: true,
            csrfToken: req.csrfToken(),
        });
    } else {
        const user_id = req.session.userID;
        db.insertSig(req.body.canvasimg, user_id)
            .then((result) => {
                console.log("returned it");
                console.log(user_id);
                return result.rows;
            })
            .catch((err) => {
                console.log(err);
            });
        req.session.signature = req.body.canvasimg;
        res.redirect("/thanks");
    }
});

app.get("/thanks", checkSigned, checkLoggedIn, (req, res) => {
    var img = req.session.signature;
    var id = req.session.userID;

    db.getProgress(id)
        .then((result) => {
            console.log(result);
            const { firstname, lastname } = result.rows[0];

            db.countSigners()
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
    console.log(req.session.userID);
    const id = req.session.userID;
    db.deleteSig(id)
        .then((result) => {
            req.session.signature = null;
            res.redirect("/petition");
        })
        .catch((Err) => {
            console.log(Err);
        });
});
app.get("/petition/signers", checkLoggedIn, (req, res) => {
    const id = req.session.userID;
    db.getProgress(id)
        .then((joint) => {
            const city = joint.rows[0].city;
            console.log(city);
            db.getNames()
                .then((joint) => {
                    const infoList = joint.rows;
                    res.render("signers", {
                        layout: "signerlist",
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

app.get("/petition/:city", checkLoggedIn, (req, res) => {
    const { city } = req.params;
    db.getCitySigners(city).then((infoList) => {
        const userList = infoList.rows;
        res.render("citysigners", {
            layout: "signerlist",
            userList,
            city,
        });
    });
});

app.get("/edit", checkLoggedIn, csrfProtection, (req, res) => {
    const id = req.session.userID;
    console.log(id);
    db.getProgress(id)
        .then((joint) => {
            const infoList = joint.rows[0];
            console.log("infolist", infoList);
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
app.post("/edit", csrfProtection, (req, res) => {
    const id = req.session.userID;
    console.log(id);
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
        hash(newKeys).then((hashedKey) => {
            console.log(req.session.userID);
            db.updateUser("hashkeys", hashedKey, id);
        });
    }
    if (newUrl.indexOf("http://") !== 0 && newUrl.indexOf("https://") !== 0) {
        newUrl = "http://" + newUrl;
        console.log("new url", newUrl);
    }
    db.insertUserPro(newAge, newCity, newUrl, id)
        .then((result) => {
            console.log(id);
        })
        .catch((err) => {
            console.log(err);
        });

    res.redirect("/petition/signers");
});

app.get("/logout", (req, res) => {
    res.render("loggedout", {
        layout: "landing_signup",
    });
    req.session.userID = null;
    req.session.signature = null;
});
app.get("/home", (req, res) => {
    res.render("home", {
        layout: "home",
    });
});
app.get("/goodbye", (req, res) => {
    var id = req.session.userID;
    db.deleteSig(id)
        .then((result) => {
            db.deleteUserpro(id).then((result) => {
                db.deleteUser(id)
                    .then((result) => {
                        req.session.userID = null;
                        req.session.signature = null;
                    })
                    .catch((err) => {
                        console.log(err);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            });
        })
        .catch((err) => {
            console.log(err);
        });

    res.render("landing", {
        layout: "landing_signup",
        deleted: true,
    });
});

app.listen(process.env.PORT || 8080, () => console.log("hi"));
