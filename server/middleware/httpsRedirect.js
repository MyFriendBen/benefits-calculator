/**
 * HTTPS Redirect Middleware
 *
 * Redirects HTTP to HTTPS in production environments.
 * Heroku sets the 'x-forwarded-proto' header to indicate the original protocol.
 */

function httpsRedirect(req, res, next) {
  const proto = req.header('x-forwarded-proto');

  if (proto !== 'https' && process.env.NODE_ENV === 'production') {
    const httpsUrl = `https://${req.hostname}${req.url}`;
    return res.redirect(301, httpsUrl);
  }

  next();
}

module.exports = httpsRedirect;
