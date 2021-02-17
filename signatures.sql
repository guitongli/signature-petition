drop table if exists signatures;
CREATE TABLE signatures (
    id SERIAL primary key,
    firstname TEXT NOT NULL, 
    lastname TEXT NOT NULL, 
    img TEXT NOT NULL
);