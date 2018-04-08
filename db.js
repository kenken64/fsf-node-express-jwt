const singleton = Symbol();
const singletonEnforcer = Symbol();
const mysql = require("mysql");
const q = require("q");

var makeQuery = function (sql, pool) {
    console.log(sql);
    return function (args) {
        var defer = q.defer();
        pool.getConnection(function (err, conn) {
            if (err) {
                defer.reject(err);
                return;
            }
            conn.query(sql, args || [], function (err, results) {
                conn.release();
                if (err) {
                    defer.reject(err);
                    return;
                }
                defer.resolve(results);
            });
        });
        return defer.promise;
    }
  };

var pool = mysql.createPool({
    host: process.env.MYSQL_SERVER,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: process.env.MYSQL_CONNECTION
});

const getOneUserByEmailSql = "SELECT username, email, bio, hash, salt, imageurl FROM users where email=?";
const saveOneUserSql = "INSERT INTO users (username, email, bio, hash, salt, imageurl) VALUES (? ,? ,? ,?,?,?)";
const getAllUsersSql = "SELECT username, email, bio, hash, salt, imageurl FROM users";
const updateUserSql = "UPDATE users set bio=?, imageUrl=? where email=?";


class DbConnection {
    constructor(enforcer){
        if(enforcer != singletonEnforcer) throw "Cannot construct singleton";
        this._type = 'DbConnection';
    }
    
    static get instance() {
        if(!this[singleton]) {
          this[singleton] = new DbConnection(singletonEnforcer);
        }
        return this[singleton];
    }
}

DbConnection.prototype.getOneUserByEmail = makeQuery(getOneUserByEmailSql, pool);
DbConnection.prototype.saveOneUser = makeQuery(saveOneUserSql, pool);
DbConnection.prototype.getAllUsers = makeQuery(getAllUsersSql, pool);
DbConnection.prototype.updateUser = makeQuery(updateUserSql, pool);


module.exports = DbConnection;