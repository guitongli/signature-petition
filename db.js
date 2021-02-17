const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432");

module.exports.insert = (fn, ln, img) => {
    const q = `INSERT into signatures (firstname, lastname, img)
    VALUES(${fn},${ln},${img}) RETURNING * `;
    return db.query(q);
};
