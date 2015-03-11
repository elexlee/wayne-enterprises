CREATE DATABASE mailinglist;

CREATE TABLE email_schedule IF NOT EXISTS (
id serial NOT NULL PRIMARY KEY,
email_sender varchar(255),	
email_body text,
email_subject text,
email_sequence int,
email_interval varchar(50)
);

CREATE TABLE users IF NOT EXISTS (
id serial NOT NULL PRIMARY KEY,
email varchar(255),	
created timestamp NOT NULL DEFAULT clock_timestamp(),
last_email_sent timestamp
);