const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.insertUser = (firstname, lastname, email, hashkeys) => {
    const q = `INSERT INTO users (firstname, lastname, email, hashkeys)
    VALUES($1, $2, $3, $4)
    RETURNING *`;

    const params = [firstname, lastname, email, hashkeys];

    return db.query(q, params);
};

module.exports.insertSig = (img) => {
    const q = `INSERT INTO signatures (canvasimg)
    VALUES($1)
    RETURNING *`;
    // console.log(firstname, lastname, img);
    const params = [img];

    return db.query(q, params);
};
module.exports.countUsers = () => {
    const q = `SELECT COUNT(*) FROM users;`;
    return db.query(q);
};

module.exports.getNames = () => {
    const q = `SELECT firstname, lastname FROM users;`;
    return db.query(q);
};

module.exports.getInfo = (email) => {
    const q = `SELECT * FROM users WHERE email = $1;`;
    const params = [email];
    return db.query(q, params);
};
module.exports.getImg = (id) => {
    const q = `SELECT * FROM signatures WHERE user_id = $1;`;
    const params = [id];
    return db.query(q, params);
};

// module.exports.insert = () => {
//     const q = `INSERT INTO signatures (firstname, lastname, img)
//      VALUES("name", "name", "img") RETURNING *;`;
//     console.log("inserted it");
//     // const params = [firstname, lastname, img];
//     const params = [firstname, lastname, img];
//     return db.query(q, params);
// };
