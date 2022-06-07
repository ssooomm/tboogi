const express = require("express");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { Post, User, Hashtag, Comment } = require("../models");

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user
    ? req.user.Followings.map((f) => f.id)
    : [];
  //res.locals.likerIdList = req.user ? req.user.Liker.map(l => l.id) : [];

  next();
});

router.get("/profile", isLoggedIn, (req, res) => {
  //res.render("profile", { title: "Profile - prj-name"});
  const query = req.query.able;
  try {
    return res.render("profile", { able: query });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get("/join", isNotLoggedIn, (req, res) => {
  res.render("join", { title: "Join to - prj-name" });
});

router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "nick", "lockId"],
        },
        {
          model: User,
          attributes: ["id", "nick"],
          as: "Liker",
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    //console.log(posts);
    res.render("main", {
      title: "prj-name",
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/hashtag", async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect("/");
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }

    return res.render("main", {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

//숨 - 게시글 수정 페이지
router.get("/update", isLoggedIn, async (req, res, next) => {
  const query = req.query.twitId;
  if (!query) {
    return res.redirect("/");
  }
  try {
    const twit = await Post.findOne({ where: { id: query } });
    return res.render("update", { twit: twit });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

//숨 - 게시글 상세 페이지
// router.get("/detail", isLoggedIn, async (req, res, next) => {
//   const query = req.query.twitId;
//   if (!query) {
//     return res.redirect("/");
//   }
//   try {
//     const twit = await Post.findOne({ where: { id: query } });
//     return res.render("detail", { twit: twit });
//   } catch (error) {
//     console.error(error);
//     return next(error);
//   }
// });
//디테일
router.get("/detail", async (req, res, next) => {
  const query = req.query.twitId;
  if (!query) {
    return res.redirect("/");
  }
  try {
    const twit = await Post.findOne({
      include: [
        {
          model: User,
        },
      ],
      where: { id: query },
    });
    const comments = await Comment.findAll({
      include: [
        {
          model: User,
        },
      ],
      where: { postId: query },
    });
    console.log(comments);
    return res.render("detail", {
      twit: twit,
      comments: comments,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;
