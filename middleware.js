exports.checkLoggedIn = (req, res, next) => {
    if (!req.session.userID) {
        return res.redirect("/");
    } else {
        next();
    }
};

exports.checkLoggedOut = (req, res, next) => {
    if (req.session.userID) {
        return res.redirect("/petition");
    } else {
        next();
    }
};

exports.checkNotSigned = (req, res, next) => {
    if (req.session.signature) {
        return res.redirect("/thanks");
    } else {
        next();
    }
};

exports.checkSigned = (req, res, next) => {
    if (!req.session.signature) {
        return res.redirect("/petition");
    } else {
        next();
    }
};
