const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.insert = (fn, ln, img) => {
    const q = `INSERT INTO signatures (firstname, lastname, img)
    VALUES(${fn},${ln},${img}) 
    RETURNING * `;
    const params = [fn, ln, img];
    return db.query(q, params);
};
