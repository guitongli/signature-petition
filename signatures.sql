drop table if exists signatures;

drop table if exists userpro;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL primary key,
    firstname TEXT NOT NULL CHECK (firstname <> ''), 
    lastname TEXT NOT NULL CHECK(lastname <> ''), 
    email TEXT NOT NULL CHECK (email <> ''),
    hashkeys TEXT NOT NULL CHECK (hashkeys <> ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id SERIAL primary key,
    canvasimg TEXT NOT NULL CHECK (canvasimg <> ''),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE userpro (
    id SERIAL primary key,
    age INT,
    city VARCHAR (100),
    url VARCHAR (300),
    statement VARCHAR(300),
    user_id INTEGER NOT NULL UNIQUE REFERENCES users (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);