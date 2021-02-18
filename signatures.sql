drop table if exists signatures;
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