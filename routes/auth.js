const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const User = require("../models/user");
const db = require("../models");

const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const upload2 = multer();

router.post("/join", isNotLoggedIn, upload2.none(), async (req, res, next) => {
  const { email, nick, password, introd } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect("/join?error=exist");
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
      introd,
      img: req.body.url,
      bgm: req.body.bgms,
      lockId: parseInt("0"),
    });
    return res.redirect("/");
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect("/");
    });
  })(req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get("/logout", isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect("/");
});

router.get("/lock", isLoggedIn, (req, res) => {
  try {
    //console.log(req.user);
    //const user = await User.findOne({ where: { id: req.user.id } });  // 사용자를 찾고
    User.update({ lockId: parseInt("1") }, { where: { id: req.user.id } });
    //res.send('success');
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    next(error);
  }
});
router.get("/unlock", isLoggedIn, (req, res) => {
  try {
    //console.log(req.user);
    //const user = await User.findOne({ where: { id: req.user.id } });  // 사용자를 찾고
    User.update({ lockId: parseInt("0") }, { where: { id: req.user.id } });
    //res.send('success');
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    next(error);
  }
});
router.get("/kakao", passport.authenticate("kakao"));

router.get(
  "/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

module.exports = router;
