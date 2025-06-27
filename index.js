const express = require('express');
const { NotionToMarkdown } = require('notion-to-md');
const { Client } = require('@notionhq/client');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Initialize NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Notion to Markdown API is running!' });
});

app.post('/convert', async (req, res) => {
  try {
    const { pageId } = req.body;
    
    if (!pageId) {
      return res.status(400).json({ error: 'Page ID is required' });
    }

    const mdblocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdblocks);
    
    res.json({ markdown: mdString });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
