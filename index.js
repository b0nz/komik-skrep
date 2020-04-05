/**
 * CRAWL COMIC ALL EPISODE
 * https://\m\a\n\g\a\b\a\t[dot]com/
 */
const readline = require("readline");
const cheerio = require("cheerio");
const request = require("request");
const fs = require("fs");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Please input URL: ", siteUrl => {
  const defaultDir = "./data";

  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir);
  }

  console.log(`\n\n=====[CURRENT: ${siteUrl}]=====\n`);
  let data = [];
  let currentComic = {};
  let detailInfo = [];
  let chapterDetail = [];

  request(siteUrl, (err, response, html) => {
    try {
      if (response.statusCode === 200) {
        const $ = cheerio.load(html);
        // GET COMIC INFO
        $("div.panel-story-info div.story-info-left img.img-loading").each(
          (index, elements) => {
            Object.assign(currentComic, { cover: $(elements).attr("src") });
          }
        );

        $("div.panel-story-info-description").each((index, elements) => {
          Object.assign(currentComic, { description: $(elements).text() });
        });

        $("div.panel-story-info div.story-info-right").each(
          (index, elements) => {
            let source = {
              title: $(elements)
                .find("h1")
                .text()
            };
            if (!fs.existsSync(`./data/${source.title}`)) {
              fs.mkdirSync(`./data/${source.title}`);
            }
            Object.assign(currentComic, source);
          }
        );

        $(
          "div.panel-story-info div.story-info-right table.variations-tableInfo tbody tr"
        ).each((index, elements) => {
          let source = {
            label: $(elements)
              .find("td.table-label")
              .text(),
            value: $(elements)
              .find("td.table-value")
              .text()
          };
          detailInfo.push(source);
        });
        $("div.panel-story-info div.story-info-right-extent p").each(
          (index, elements) => {
            let source = {
              label: $(elements)
                .find("span.stre-label")
                .text(),
              value: $(elements)
                .find("span.stre-value")
                .text()
            };
            detailInfo.push(source);
          }
        );
        Object.assign(currentComic, { detail_info: detailInfo });
        if (!fs.existsSync(`./data/${currentComic.title}/info.json`)) {
          fs.writeFile(
            `./data/${currentComic.title}/info.json`,
            JSON.stringify(currentComic),
            { flag: "w" },
            function(err) {
              if (err) throw err;
              console.log(`./data/${currentComic.title}/info.json | SAVED!`);
            }
          );
        }

        // GET CHAPTER
        $("ul.row-content-chapter li.a-h").each((index, elements) => {
          let chapterName = $(elements)
            .find("a")
            .text();
          let chapterLink = $(elements)
            .find("a")
            .attr("href");
          let uploadedAt = $(elements)
            .find("span")
            .attr("title");

          data.push({
            id: index,
            chapter: chapterName,
            link: chapterLink,
            uploaded: uploadedAt
          });
        });
      } else {
        console.log(err);
      }
      Object.assign(currentComic, { data });

      data.map(item => {
        setTimeout(
          () =>
            request(item.link, (err, response, html) => {
              const $ = cheerio.load(html);
              let dataImage = [];

              if (response.statusCode === 200) {
                $("div.container-chapter-reader img").each(
                  (index, elements) => {
                    dataImage.push({
                      url: $(elements).attr("src"),
                      name: $(elements)
                        .attr("src")
                        .split("/")
                        .pop()
                    });
                  }
                );
                chapterDetail.push({
                  chapter: item.chapter,
                  images: dataImage
                });
                fs.writeFile(
                  `./data/${currentComic.title}/chapter.json`,
                  JSON.stringify({ data: chapterDetail }),
                  { flag: "w" },
                  function(err) {
                    if (err) throw err;
                    console.log(
                      `${item.chapter} >> ${currentComic.title}/chapter.json | SAVED!`
                    );
                  }
                );
              }
            }),
          3000
        );
      });
    } catch (error) {
      console.log(error);
    }
  });

  rl.close();
});
