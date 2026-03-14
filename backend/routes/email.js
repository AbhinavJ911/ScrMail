const router = require('express').Router();
const { google } = require('googleapis');
const ensureAuth = require('../middleware/auth');

// @route   GET /api/email/search?q=keyword
// @desc    Search user's Gmail for emails matching keyword
router.get('/search', ensureAuth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const user = req.user;

    if (!user.accessToken) {
      return res.status(401).json({ message: 'No Gmail access token found. Please re-login.' });
    }

    // Create OAuth2 client with user's tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Search for messages matching the query
    const messageList = await gmail.users.messages.list({
      userId: 'me',
      q: q.trim(),
      maxResults: 20,
    });

    if (!messageList.data.messages || messageList.data.messages.length === 0) {
      return res.json({ emails: [], total: 0 });
    }

    // Fetch details for each message
    const emailPromises = messageList.data.messages.map(async (msg) => {
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = message.data.payload.headers;
      const fromHeader = headers.find((h) => h.name === 'From');
      const subjectHeader = headers.find((h) => h.name === 'Subject');
      const dateHeader = headers.find((h) => h.name === 'Date');

      // Extract email body
      let body = '';
      const payload = message.data.payload;

      if (payload.parts) {
        // Multipart message
        const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
        const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');

        if (htmlPart && htmlPart.body.data) {
          body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
        } else if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (payload.body && payload.body.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }

      return {
        id: msg.id,
        from: fromHeader ? fromHeader.value : 'Unknown',
        subject: subjectHeader ? subjectHeader.value : '(No Subject)',
        date: dateHeader ? dateHeader.value : '',
        snippet: message.data.snippet || '',
        body,
      };
    });

    const emails = await Promise.all(emailPromises);

    res.json({
      emails,
      total: messageList.data.resultSizeEstimate || emails.length,
    });
  } catch (error) {
    console.error('Email search error:', error.message);

    if (error.code === 401 || error.message.includes('invalid_grant')) {
      return res.status(401).json({
        message: 'Gmail access expired. Please log out and log in again.',
      });
    }

    res.status(500).json({ message: 'Failed to search emails' });
  }
});

module.exports = router;
