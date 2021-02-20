const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.insertUser = (firstname, lastname, email, hashkeys) => {
    const q = `INSERT INTO users (firstname, lastname, email, hashkeys)
    VALUES($1, $2, $3, $4)
    RETURNING *;`;

    const params = [firstname, lastname, email, hashkeys];

    return db.query(q, params);
};
module.exports.insertPro = (age, city, url, statement, user_id) => {
    const q = `INSERT INTO userpro (age, city, url, statement, user_id)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *;`;

    const params = [age, city, url, statement, user_id];
    return db.query(q, params);
};
module.exports.insertSig = (canvasimg, user_id) => {
    const q = `INSERT INTO signatures (canvasimg, user_id)
    VALUES($1, $2)
    ON CONFLICT (user_id)
DO UPDATE SET canvasimg = $1

    RETURNING *;`;
    // console.log(firstname, lastname, img);
    const params = [canvasimg, user_id];

    return db.query(q, params);
};
module.exports.countUsers = () => {
    const q = `SELECT COUNT(*) FROM users;`;
    return db.query(q);
};

module.exports.getNames = () => {
    const q = `SELECT users.firstname, users.lastname, signatures.canvasimg, userpro.age, userpro.city, userpro.url
    FROM users
    INNER JOIN signatures
    ON users.id = signatures.user_id
    LEFT JOIN userpro 
    ON users.id = userpro.user_id;`;
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

module.exports.getProgress = (id) => {
    const q = `SELECT users.firstname, users.lastname, users.email, signatures.canvasimg, userpro.age, userpro.city, userpro.url
    FROM users
    LEFT JOIN signatures
    ON users.id = signatures.user_id
    LEFT JOIN userpro 
    ON users.id = userpro.user_id
    WHERE users.id = $1;`;
    const params = [id];
    return db.query(q, params);
};
module.exports.getCitySigners = (city) => {
    const q = `SELECT users.firstname, users.lastname, signatures.canvasimg, userpro.age, userpro.url
    FROM users
    INNER JOIN signatures
    ON users.id = signatures.user_id
    LEFT JOIN userpro 
    ON users.id = userpro.user_id
    WHERE LOWER (userpro.city) = LOWER ($1);`;
    const param = [city];
    return db.query(q, param);
};

module.exports.updatetUser = (column, value, id) => {
    const q = `UPDATE users
    SET $1 = '$2'
    WHERE id = $3;`;
    const params = [column, value, id];
    return db.query(q, params);
};
module.exports.insertUserPro = (age, city, url, user_id) => {
    const q = `INSERT INTO userpro (age, city, url, user_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id)
DO UPDATE SET age = $1, city = $2, url = $3
RETURNING *;`;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

module.exports.updateSig = (value, id) => {
    const q = `UPDATE signatures
    SET canvasimg = '$1'
    WHERE user_id = $2;`;
    const params = [value, id];
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
