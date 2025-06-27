const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { notionToMarkdown } = require("./notionToMarkdown");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/convert", (req, res) => {
  try {
    const blocks = req.body.blocks;
    if (!blocks) return res.status(400).json({ error: "Missing blocks" });

    const markdown = notionToMarkdown(blocks);
    res.json({ markdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed", details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Notion to Markdown server running on port ${port}`);
});