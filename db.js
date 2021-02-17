const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.insert = (firstname, lastname, img) => {
    const q = `INSERT INTO signatures (firstname, lastname, img)
    VALUES($1, $2, $3)
    RETURNING *`;
    // console.log(firstname, lastname, img);
    const params = [firstname, lastname, img];

    return db.query(q, params);
};
module.exports.count = () => {
    const q = `SELECT COUNT(*) FROM signatures;`;
    return db.query(q);
};

module.exports.names = () => {
    const q = `SELECT firstname, lastname FROM signatures;`;
    return db.query(q);
};

// module.exports.insert = () => {
//     const q = `INSERT INTO signatures (firstname, lastname, img)
//      VALUES("name", "name", "img") RETURNING *;`;
//     console.log("inserted it");
//     // const params = [firstname, lastname, img];
//     const params = [firstname, lastname, img];
//     return db.query(q, params);
// };
