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

  console.log(siteUrl);
  let data = [];
  let info = {};
  let detailInfo = [];

  request(siteUrl, (err, response, html) => {
    if (response.statusCode === 200) {
      const $ = cheerio.load(html);
      // GET COMIC INFO
      $("div.panel-story-info div.story-info-left img.img-loading").each(
        (index, elements) => {
          Object.assign(info, { cover: $(elements).attr("src") });
        }
      );

      $("div.panel-story-info div.story-info-right").each((index, elements) => {
        let source = {
          title: $(elements)
            .find("h1")
            .text()
        };
        if (!fs.existsSync(`./data/${source.title}`)) {
          fs.mkdirSync(`./data/${source.title}`);
        }
        Object.assign(info, source);
      });

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
      Object.assign(info, { detail_info: detailInfo });
      if (!fs.existsSync(`./data/${info.title}/info.json`)) {
        fs.writeFile(
          `./data/${info.title}/info.json`,
          JSON.stringify(info),
          { flag: "wx" },
          function(err) {
            if (err) throw err;
            console.log(`./data/${info.title}/info.json | SAVED!`);
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

    data.map(item => {
      if (!fs.existsSync(`./data/${info.title}/${item.chapter}`)) {
        fs.mkdirSync(`./data/${info.title}/${item.chapter}`);
        request(item.link, (err, response, html) => {
          const $ = cheerio.load(html);
          let dataImage = [];

          if (response.statusCode === 200) {
            $("div.container-chapter-reader img").each((index, elements) => {
              dataImage.push({
                url: $(elements).attr("src"),
                name: $(elements)
                  .attr("src")
                  .split("/")
                  .pop()
              });
            });
            fs.writeFile(
              `./data/${info.title}/${item.chapter}/chapter.json`,
              JSON.stringify({ data: dataImage }),
              { flag: "wx" },
              function(err) {
                if (err) throw err;
                console.log(
                  `./data/${info.title}/${item.chapter}/chapter.json | SAVED!`
                );
              }
            );
          }
          console.log(err);
        });
      }
    });
  });

  rl.close();
});
