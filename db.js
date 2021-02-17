const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432");

module.exports.getAllCities = () => {
    const q = `SELECT * FROM cities`;
    return db.query(q);
};

module.exports.addCity = (city, country, population) => {
    const q = ``;
};
