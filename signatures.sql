drop table if exists signatures;
CREATE TABLE signatures (
    id SERIAL primary key,
    firstname TEXT, 
    lastname TEXT, 
    img TEXT
);