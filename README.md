# About

This is a Read-Only Web-GUI for your [Pass](https://www.passwordstore.org/) Database.
The Idea is to upload your local database with post-commit hooks to any webserver so you can access the content from remote or in case of emergency like losing your Phone or something. Therefore its very basic.

The data is stored in a single file. To hide the names of your logins this file uses symetric encryption. Still you should probably use some kind of private URL to reduce the risk of leaking your encrypted-passwords.

## Decryption
All decryption is down inside the Browser using OpenPGP-JS

## Requirements 
Current Chrome. Firefox might also work. Safari will likely not work.

## PWA
Can be installed as an App for Offline Mode.

## Usage
* git clone
* npm install
* npm build
* upload dist/ to your server
* customize create_data.sh to create the dump & add some upload logic
