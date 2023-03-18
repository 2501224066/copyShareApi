var express = require("express");
var router = express.Router();

// 成功返回
success = function (data, res) {
  res.json({
    status: "SUCCESS",
    msg: "",
    data: data || {},
  });
};

// 失败返回
error = function (errMsg, res) {
  res.json({
    status: "ERROR",
    msg: errMsg,
    data: {},
  });
};

module.exports = {
  success,
  error,
};
