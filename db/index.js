const mysql = require("mysql");
const dbConfig = require("./config.js");

class Orm {
  constructor(debug = 0) {
    this.sql = "";
    this._table = "";
    this.filter = "";
    this.debug = debug;
    this.bind = [];
  }

  table(table) {
    this._table = table;
    return this;
  }

  select(..._cols) {
    let cols = [..._cols];
    if (cols.length != 0) {
      let c = "";
      for (let i = 0; i < cols.length; i++) {
        let char = cols[i];
        if (i != cols.length - 1) {
          c += `${char},`;
        } else {
          c += `${char}`;
        }
      }
      this.sql = `SELECT ${c} FROM ${this._table} ${this.filter}`;
    } else {
      this.sql = `SELECT * FROM ${this._table} ${this.filter}`;
    }
    return this.run();
  }

  where(...arg) {
    let arr = [...arg];
    let column = arr[0] || null,
      op = arr[1] || null,
      val = arr[2] || null;
    if (arr.length == 2) {
      column = arr[0];
      val = arr[1];
      op = "=";
    }
    if (this.filter) {
      this.filter += ` AND ${column} ${op} '${val}'`;
    } else {
      this.filter = `WHERE ${column} ${op} '${val}'`;
    }
    return this;
  }

  insert(obj) {
    let keys = "",
      values = "";
    let objArr = Object.keys(obj);
    for (let i = 0; i < objArr.length; i++) {
      let key = objArr[i];
      let val = obj[key];
      if (i != objArr.length - 1) {
        keys += `${key},`;
        //注意 value最好用''括起来
        values += `?,`;
      } else {
        keys += `${key}`;
        values += `?`;
      }
      this.bind.push(val);
    }
    this.sql = `INSERT INTO ${this._table} (${keys}) VALUES (${values})`;
    return this.run();
  }

  async count() {
    let result = await this.select();
    return new Promise((resolve, reject) => {
      resolve(result.length);
    });
  }

  async find() {
    let result = await this.select();
    return new Promise((resolve, reject) => {
      resolve(result[0] || null);
    });
  }

  run() {
    let _sql = this.sql;
    let _bind = this.bind;
    if (this.debug) console.log(_sql, _bind);
    let table = this._table;
    this.done();
    return new Promise((resolve, reject) => {
      if (!table) {
        reject("表名不可为空");
      } else {
        var pool = mysql.createPool(dbConfig.mysql);
        pool.getConnection((err, con) => {
          if (err) {
            reject(err);
          } else {
            con.query(_sql, _bind, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve(result);
                con.release();
              }
            });
          }
        });
      }
    });
  }

  // 清空缓存的字符串
  done() {
    this.sql = "";
    this._table = "";
    this.filter = "";
    this.bind = [];
  }
}

module.exports = {
  Orm,
};
