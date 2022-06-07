const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { Post, Hashtag, Comment } = require("../models");
const { isLoggedIn } = require("./middlewares");

const router = express.Router();

try {
  fs.readdirSync("uploads");
} catch (error) {
  console.error("uploads 폴더가 없어 uploads 폴더를 생성합니다.");
  fs.mkdirSync("uploads");
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/img", isLoggedIn, upload.single("img"), (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
router.post("/", isLoggedIn, upload2.none(), async (req, res, next) => {
  try {
    console.log(req.user);
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]*/g);
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          });
        })
      );
      await post.addHashtags(result.map((r) => r[0]));
    }
    res.redirect("/");
  } catch (error) {
    console.error(error);
    next(error);
  }
});
router.post("/:id/unlike", async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } }); // 게시글을 찾고
    console.log(post);
    await post.removeLiker(parseInt(req.user.id)); // 좋아요 누른 사람 제거
    res.send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});
router.post("/:id/like", async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } }); // 게시글을 찾고
    await post.addLiker(parseInt(req.user.id)); // 좋아요 누른 사람 추가
    res.send("success");
  } catch (error) {
    console.error(error);
    next(error);
  }
});

//----수민 - 게시물 삭제, 수정--------
router
  .route("/:id")
  .patch(async (req, res, next) => {
    try {
      const postUpdate = await Post.update(
        {
          content: req.body.content,
          img: req.body.url,
        },
        { where: { id: req.params.id, UserId: req.user.id } }
      );
      const hashtags = req.body.content.match(/#[^\s#]*/g);
      // if (hashtags) {
      //   const result = await Promise.all(
      //     hashtags.map((tag) => {
      //       return Hashtag.findOrCreate({
      //         where: { title: tag.slice(1).toLowerCase() },
      //       });
      //     })
      //   );
      //   await postUpdate.addHashtags(result.map((r) => r[0]));
      // }
      //res.redirect("/");
      res.json(postUpdate);
    } catch (err) {
      console.error(err);
      next(err);
    }
  })
  .delete(async (req, res, next) => {
    try {
      const result = await Post.destroy({
        where: { id: req.params.id, UserId: req.user.id },
      });
      res.json(result);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

//-----------------------------
//comment
router.post("/:id/comment", isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id },
    });
    if (!post) {
      return res.status(403).send("존재하지 않는 게시글입니다.");
    }
    const comment = await Comment.create({
      content: req.body.content,
      postId: req.params.id,
      UserId: req.user.id,
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(err);
    next(err);
  }
});
//댓글 수정 삭제
router
  .route("/:id/:comment")
  .patch(async (req, res, next) => {
    const postId = req.params.id;
    const commentId = req.params.comment;
    try {
      const commentUpdate = await Comment.update(
        {
          content: req.body.content,
        },
        {
          where: { id: commentId, UserId: req.user.id, PostId: postId },
        }
      );
      res.json(commentUpdate);
    } catch (error) {
      console.error(err);
      next(err);
    }
  })
  .delete(async (req, res, next) => {
    const postId = req.params.id;
    const commentId = req.params.comment;
    try {
      const result = await Comment.destroy({
        where: { id: commentId, UserId: req.user.id, PostId: postId },
      });
      res.json(result);
    } catch (error) {
      console.error(error);
      next(error);
    }
  });

module.exports = router;
