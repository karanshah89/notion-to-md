const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const pageId = '21fea8b840df80f89107dc2edfb233c3';

(async () => {
  try {
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    console.log("✅ Successfully fetched blocks:");
    console.dir(blocks.results, { depth: null });
  } catch (err) {
    console.error("❌ Error fetching blocks:");
    console.error(err.body || err);
  }
})();
