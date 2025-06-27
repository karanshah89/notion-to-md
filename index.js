const express = require('express');
const { NotionToMarkdown } = require('notion-to-md');
const { Client } = require('@notionhq/client');

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON - with size limit and error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add CORS headers for browser requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers['content-type']
  });
  next();
});

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Initialize NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Notion to Markdown API is running!',
    status: 'healthy',
    endpoints: {
      convert: 'POST /convert with { "pageId": "your-page-id" }',
      health: 'GET /'
    },
    environment: {
      hasNotionToken: !!process.env.NOTION_TOKEN,
      nodeVersion: process.version,
      port: port
    }
  });
});

// Convert endpoint with better error handling
app.post('/convert', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Check if body exists
    if (!req.body) {
      return res.status(400).json({ 
        error: 'Request body is missing. Make sure to send JSON with Content-Type: application/json',
        example: { pageId: "your-notion-page-id" }
      });
    }
    
    const { pageId } = req.body;
    
    // Validate pageId
    if (!pageId) {
      return res.status(400).json({ 
        error: 'Page ID is required',
        received: req.body,
        example: { pageId: "your-notion-page-id" }
      });
    }
    
    // Validate pageId format (basic check)
    if (typeof pageId !== 'string' || pageId.length < 10) {
      return res.status(400).json({ 
        error: 'Invalid page ID format',
        received: pageId,
        note: 'Page ID should be a valid Notion page ID (32 characters)'
      });
    }
    
    // Check if Notion token is configured
    if (!process.env.NOTION_TOKEN) {
      return res.status(500).json({ 
        error: 'Notion token not configured. Please set NOTION_TOKEN environment variable.'
      });
    }

    console.log(`Converting page: ${pageId}`);
    
    // Convert page to markdown
    const mdblocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdblocks);
    
    res.json({ 
      success: true,
      pageId: pageId,
      markdown: mdString.parent || mdString,
      blocksCount: mdblocks.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Conversion error:', error);
    
    // Handle specific Notion API errors
    if (error.code === 'object_not_found') {
      return res.status(404).json({ 
        error: 'Page not found. Make sure the page ID is correct and the integration has access to it.',
        pageId: req.body?.pageId
      });
    }
    
    if (error.code === 'unauthorized') {
      return res.status(401).json({ 
        error: 'Unauthorized. Make sure your Notion token is valid and the integration has access to the page.',
        pageId: req.body?.pageId
      });
    }
    
    res.status(500).json({ 
      error: error.message,
      success: false,
      pageId: req.body?.pageId,
      errorCode: error.code || 'unknown'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: {
      'GET /': 'Health check and API info',
      'POST /convert': 'Convert Notion page to Markdown'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

app.listen(port, () => {
  console.log(`🚀 Notion-to-MD API running on port ${port}`);
  console.log(`📝 Health check: http://localhost:${port}/`);
  console.log(`🔄 Convert endpoint: POST http://localhost:${port}/convert`);
  console.log(`🔑 Notion token configured: ${!!process.env.NOTION_TOKEN}`);
});
