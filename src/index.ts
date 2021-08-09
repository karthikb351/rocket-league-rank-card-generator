import * as express from 'express';
const chromium = require('chrome-aws-lambda');
import {getRankDataFromTrackerGG} from './api';
import * as Mustache from 'mustache';
import {readFileSync} from 'fs';

const app = express();

app.get('/rank/:platform/:id', async (req, res) => {
  res.send(
    await (
      await getRankDataFromTrackerGG(req.params.platform, req.params.id)
    ).data
  );
});

app.get('/card/:platform/:id', async (req, res) => {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: true,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  page.setViewport({
    width: 640,
    height: 1200,
    deviceScaleFactor: 1,
  });
  const template = readFileSync('./src/views/card.mst', 'utf8').toString();
  const data = await getRankDataFromTrackerGG(
    req.params.platform,
    req.params.id
  );
  const view = {
    data: data,
    username: function () {
      return data.data.platformInfo.platformUserHandle;
    },
    avatarUrl: function () {
      return data.data.platformInfo.avatarUrl;
    },
    ranks: function () {
      const ranks: {
        name: string;
        rank: string;
        rank_icon: string;
        matches_played: string;
      }[] = [];
      data.data.segments.forEach((segment: any) => {
        if (segment.type === 'playlist') {
          ranks.push({
            name: segment.metadata.name,
            rank: segment.stats.tier.metadata.name,
            rank_icon: segment.stats.tier.metadata.iconUrl,
            matches_played: segment.stats.matchesPlayed.value,
          });
        }
      });
      return ranks;
    },
  };
  const html = Mustache.render(template, view);
  //res.send(html);
  await page.setContent(html);
  res.type('png');
  res.send(await page.screenshot());
});

app.get('/', (req, res) => {
  res.send("We're running!");
});

exports.app = app;
