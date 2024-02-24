const TorrentSearchApi = require("torrent-search-api");
const xtorrent = require("xtorrent");
const getmagnet = require("get-magnet");
const stringSimilarity = require("string-similarity");

module.exports.getTorrents = async (req, res, next) => {
  try {
    const search = req.query.search;
    const provider = req.query.provider;
    const numberTorrents = parseInt(req.query.numberTorrent) || 20;
    const similarity = req.query.similarity || 0.3;

    if (!search) {
      res.status(401).send({ message: "Search not found", });
    }

    TorrentSearchApi.enableProvider(provider);

    const data = await
      TorrentSearchApi.search([provider], search, "All", numberTorrents);

    const torrents = await Promise.all(
      data.map(async (value) => {
        if (value.provider === "1337x") {
          try {
            const response = await xtorrent.info(value.desc);
            return {
              title: value.title,
              size: value.size,
              seeds: value.seeds,
              magnet: response.download.magnet,
            };
          } catch {
            return {};
          }
        }

        if (
          value.provider === "Torrent9" ||
          value.provider === "Limetorrents" ||
          value.provider === "Yts" ||
          value.provider === "TorrentProject"
        ) {
          try {
            const response = await getmagnet.get(value.desc);
            return {
              title: value.title,
              size: value.size,
              seeds: value.seeds,
              magnet: response.magnet,
            };
          } catch {
            return {};
          }
        }

        if (
          value.provider === "Rarbg" ||
          value.provider === "ThePirateBay" ||
          value.provider === "KickassTorrents" ||
          value.provider === "Eztv"
        ) {
          return {
            title: value.title,
            seeds: value.seeds,
            size: value.size,
            magnet: value.magnet,
          };
        }
      })
    );

    torrents.forEach((torrent, index) => {
      let { title, seeds, size, magnet } = torrent;

      const similarityTorrrent = stringSimilarity.compareTwoStrings(
        search,
        title
      );

      if (similarityTorrrent >= similarity) {
        torrent[index] = {
          title: title,
          seeds: parseFloat(seeds),
          size: size,
          magnet: magnet,
        };
      }
    });

    torrents.sort(function (a, b) {
      return a.seeds > b.seeds ? -1 : a.seeds < b.seeds ? 1 : 0;
    });

    res.status(201).send(torrents);
  } catch (err) {
    res.status(500).send({ message: err.message, });
  }
};

 