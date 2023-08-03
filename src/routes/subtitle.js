const express = require("express");

const router = express.Router();

const subtitles = require("../controllers/subtitles");

router.get("/", subtitles.getSubtitles);

module.exports = router;
