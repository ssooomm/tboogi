const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/user");

const { isLoggedIn } = require("./middlewares");

const router = express.Router();

//프로필사진 저장하는 폴더 생성
try {
  fs.readdirSync("uploads1");
} catch (error) {
  console.error("uploads1 폴더가 없어 uploads1 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}

//bgm 저장하는 폴더 생성
try {
  fs.readdirSync("bgms");
} catch (error) {
  console.error("bgms 폴더가 없어 bgms 폴더를 생성합니다.");
  fs.mkdirSync("bgms");
}

//프로필 사진 업로드하는 미들웨어
const upload1 = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads1/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

//프로필 음악 업로드하는 미들웨어
const uploadbgm = multer({
  storage: multer.diskStorage({
    destination(req, fild, cb) {
      cb(null, "bgms/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
});

const upload2 = multer();
const uploadbgm2 = multer();

//프로필 사진 upload1폴더에 저장해줌
router.post("/img1", upload1.single("img1"), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img1/${req.file.filename}` });
});

router.post("/bgms", uploadbgm.single("bgms"), async (req, res, next) => {
  console.log(req.body);
  //res.json({url: `/bgm/${req.file.filename}`});

  // const bgm = await User.update(
  //   { bgm: `/bgms/${req.file.filename}`,},
  //   { where: { id: req.user.id,},}
  // );
  res.json({ url: `/bgms/${req.file.filename}` });
});

// router.post("/bgm", uploadbgm2.single("bgm"), async (req, res, next) => {
//   const bgm = await User.create({
//     bgm: req.body.bgm,
//   });
// });

router.post("/:id/follow", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.addFollowing(parseInt(req.params.id, 10));
      res.send("success");
    } else {
      res.status(404).send("no user");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/:id/unfollow", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    if (user) {
      await user.removeFollowing(parseInt(req.params.id, 10));
      res.send("success");
    } else {
      res.status(404).send("no user");
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post("/profile", async (req, res, next) => {
  try {
    await User.update(
      {
        nick: req.body.nick,
        introd: req.body.introd,
        img: req.body.url,
        bgm: req.body.bgms,
      },
      { where: { id: req.user.id } }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
