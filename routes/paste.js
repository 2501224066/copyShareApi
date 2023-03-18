let express = require("express");
let router = express.Router();
let result = require("../utils/result");

// 校验
function postVerify(props, res) {
  try {
    if (!props.language) throw "语言不能为空";
    if (!props.theme) throw "主题不能为空";
    if (!props.content) throw "内容不能为空";
    if (!props.time) throw "保存时间不能为空";
    if (props.isEncrypt && !props.password) throw "密码不能为空";
  } catch (e) {
    result.error(e, res);
    return;
  }
  return true;
}

// 校验
function getVerify(props, res) {
  try {
    if (!props.code) throw "编码不能为空";
  } catch (e) {
    result.error(e, res);
    return;
  }
  return true;
}

// 编码生成
async function getCode() {
  let str = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 10; i > 0; --i) {
    code += str[Math.floor(Math.random() * str.length)];
  }
  if (await Db.table("paste").where("code", code).count()) code = getCode();
  return code;
}

// 新增信息
router.post("/", async (req, res, next) => {
  if (!postVerify(req.body, res)) return;
  let code = await getCode();
  await Db.table("paste").insert({
    code,
    language: req.body.language,
    theme: req.body.theme,
    content: req.body.content,
    time: req.body.time,
    is_encrypt: req.body.isEncrypt || 0,
    password: req.body.isEncrypt ? req.body.password : "",
    created_at: new Date().getTime(),
  });
  result.success({ code }, res);
});

// 获取信息
router.get("/", async (req, res, next) => {
  if (!getVerify(req.query, res)) return;
  if (!(await Db.table("paste").where("code", req.query.code).count()))
    result.error("无相关信息", res);
  let data = await Db.table("paste").where("code", req.query.code).find();
  if (data.time != 0 && new Date().getTime() - data.created_at > data.time)
    result.error("内容已销毁", res);
  delete data.password;
  delete data.time;
  delete data.is_encrypt;
  result.success(data, res);
});

// 加密状态
router.get("/encryptStatus", async (req, res, next) => {
  let status = false;
  let data = await Db.table("paste").where("code", req.query.code).find();
  if (data && data.is_encrypt) status = true;
  result.success({ status }, res);
});

module.exports = router;
