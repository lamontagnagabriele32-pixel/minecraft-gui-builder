# Minecraft GUI Builder Website

This folder contains the website files for publishing on Altervista.

## Files

- `index.html` - Main landing page with SEO optimization
- `robots.txt` - Search engine permissions
- `sitemap.xml` - XML sitemap for search engines
- `.htaccess` - Apache configuration for HTTPS, compression, and caching

## SEO Keywords

The website is optimized for the following keywords:
- minecraft gui
- minecraft gui editor
- minecraft mod gui
- forge gui
- neoforge gui
- minecraft gui builder
- minecraft gui creator
- minecraft menu editor
- minecraft mod maker
- gui designer minecraft

## How to Upload to Altervista

1. Log in to your Altervista account
2. Go to "File Manager" (Gestione File)
3. Upload all files from this folder to the main directory (`/`)
4. Make sure `.htaccess` is uploaded (it may be hidden by default)
5. The website will be available at: `https://minecraft-gui-builder.altervista.org/`

## After Upload

1. Verify the website loads correctly
2. Submit the sitemap to Google Search Console:
   - Go to https://search.google.com/search-console
   - Add your property: `https://minecraft-gui-builder.altervista.org/`
   - Verify ownership (HTML file or DNS)
   - Submit sitemap: `https://minecraft-gui-builder.altervista.org/sitemap.xml`

3. Submit to Bing Webmaster Tools:
   - Go to https://www.bing.com/webmasters
   - Add your site and verify ownership
   - Submit sitemap

## Domain Configuration

If you have a custom domain:
1. In Altervista, go to "Domains" (Domini)
2. Add your custom domain
3. Update the canonical URL in `index.html` line 10
4. Update all URLs in `sitemap.xml` and `.htaccess`

## Performance Optimization

The `.htaccess` file includes:
- Gzip compression for text files
- Browser caching for static assets
- HTTPS redirect
- www removal

These settings will improve page load speed and SEO ranking.
