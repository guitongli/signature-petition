module.exports.checkLoggedIn = (req, res, next) => {
    if (!req.session.userID) {
        return res.redirect("/login");
    } else {
        next();
    }
};

module.exports.checkLoggedOut = (req, res, next) => {
    if (req.session.userID) {
        return res.redirect("/petition");
    } else {
        next();
    }
};

module.exports.checkNotSigned = (req, res, next) => {
    if (req.session.signature) {
        return res.redirect("/thanks");
    } else {
        next();
    }
};

module.exports.checkSigned = (req, res, next) => {
    if (!req.session.signature) {
        return res.redirect("/petition");
    } else {
        next();
    }
};

module.exports.checkExisting = (req, res, next) => {
    if (req.session.userID) {
        return res.redirect("/petition");
    } else {
        next();
    }
};
