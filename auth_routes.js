const express = require("express");
const router = express.Router();


exports.router = router;
// this has to be on the end

// for server.js, after the middleware
// authRoutes = require('/auth_routes')
// app.use(authRoutes.router)


//middleware.js can be put at any part of server.js 

function requireLoggedInUer(req, res, next){
    if(!req.session){res.redirect('/register')}

} else {
    next()
}

// const {requireLoggedInUser} = require("/middleware")
exports.requireLoggedOutUser = (req, res, next)=>{
    if(id){return res.redirect}
    next()
}

//app.use will use this in every route
//put it inside each route to protect specific route