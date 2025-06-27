const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { NotionToMarkdown } = require("notion-to-md");
const { Client } = require('@notionhq/client');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/convert', async (req, res) => {
  console.log('[RAW BODY]', req.body);
  console.log('[TOKEN]', process.env.NOTION_TOKEN?.slice(0, 8));
  console.log('[PAGE]', req.body?.pageId);

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid or missing JSON body.' });
  }

  const pageId = req.body.pageId;
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
