require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { NotionToMarkdown } = require("notion-to-md");
const { Client } = require('@notionhq/client');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const N8N_INTERNAL_URL = process.env.N8N_INTERNAL_URL;
console.log('[ENV] N8N_INTERNAL_URL:', N8N_INTERNAL_URL);

app.post('/convert', async (req, res) => {
  const pageId = req.body?.pageId;
  console.log('[RAW BODY]', req.body);
  console.log('[TOKEN]', process.env.NOTION_TOKEN?.slice(0, 8));
  console.log('[PAGE]', pageId);

  if (!pageId) {
    return res.status(400).json({ error: 'pageId not provided' });
  }

  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const n2m = new NotionToMarkdown({ notionClient: notion });

    const blocks = await n2m.pageToMarkdown(pageId);
    if (!blocks || blocks.length === 0) {
      return res.status(500).json({ error: 'Missing blocks', blocks });
    }

    const md = n2m.toMarkdownString(blocks);

    // Notify n8n webhook with real pageId
    if (N8N_INTERNAL_URL) {
      await axios.post(`${N8N_INTERNAL_URL}/webhook/my-webhook`, {
        pageId,
        markdown: md.parent || md
      });
    }

    return res.json({ markdown: md.parent || md });
  } catch (err) {
    console.error('[ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Notion to Markdown server running on port ${port}`);
});