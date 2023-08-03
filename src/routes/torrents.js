const express = require("express");
const router = express.Router();
const torrents = require("../controllers/torrents");

router.get("/movie", torrents.getMoviesTorrents);
router.get("/tv", torrents.getTVTorrents);

module.exports = router;
