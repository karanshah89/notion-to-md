require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { NotionToMarkdown } = require("notion-to-md");
const { Client } = require('@notionhq/client');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/convert', async (req, res) => {
  const pageId = req.body?.pageId;
  if (!pageId) return res.status(400).json({ error: 'pageId not provided' });

  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const n2m = new NotionToMarkdown({ notionClient: notion });
    const blocks = await n2m.pageToMarkdown(pageId);
    const md = n2m.toMarkdownString(blocks);
    return res.json({ markdown: md.parent || md });
  } catch (err) {
    console.error('[ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});