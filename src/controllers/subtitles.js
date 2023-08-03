const OS = require("opensubtitles-api");
const stringSimilarity = require("string-similarity");

module.exports.getSubtitles = async (req, res, next) => {
  try {
    // const searchPT = req.body.searchPT;
    // const searchUS = req.body.searchUS;

    const searchPT = "The Dark Knight";
    const searchUS = "Batman: O Cavaleiro das Trevas";
    const similarity = req.body.similarity || 0.3;

    if (!searchPT || !searchUS) {
      const response = {
        message: "Search not found",
        subtitles: [],
      };

      res.status(401).send(response);
    }

    const OpenSubtitles = new OS({
      useragent: "UserAgent",
      username: process.env.OS_USERNAME,
      password: process.env.OS_PASSWORD,
      ssl: true,
    });

    OpenSubtitles.login()
      .then((res) => {})
      .catch((err) => {
        console.log(err);
      });

    const [listaBR, listaUS] = await Promise.all([
      OpenSubtitles.search({
        sublanguageid: "pob,por",
        extensions: ["srt", "vtt"],
        limit: "10",
        query: searchPT,
        gzip: false,
      }),

      OpenSubtitles.search({
        sublanguageid: "eng",
        extensions: ["srt", "vtt"],
        limit: "10",
        query: searchUS,
        gzip: false,
      }),
    ]);

    const { pb: pbUS = [], pt: ptUS = [] } = listaUS;
    const { pb: pbBR = [], pt: ptBR = [] } = listaBR;

    const subtitles = [...pbUS, ...ptUS, ...pbBR, ...ptBR];

    subtitles.forEach((sub) => {
      const { filename, id } = sub;

      const index = subtitles.findIndex((item) => item.id === id);

      const similarity1 = stringSimilarity.compareTwoStrings(
        searchPT,
        filename
      );
      const similarity2 = stringSimilarity.compareTwoStrings(
        searchUS,
        filename
      );

      if (index < 0 && (similarity1 || similarity2 >= similarity)) {
        subtitles[index] = {
          ...sub,
          language: "pob",
          url: sub.vtt,
          label: sub.langcode,
        };
      }
    });

    subtitles.sort(function (a, b) {
      return a.downloads > b.downloads ? -1 : a.downloads < b.downloads ? 1 : 0;
    });

    const response = {
      message: "Subtitles found",
      subtitles: subtitles,
    };

    res.status(201).send(response);
  } catch (err) {
    const response = {
      message: err,
      subtitles: [],
    };

    res.status(500).send(response);
  }
};
