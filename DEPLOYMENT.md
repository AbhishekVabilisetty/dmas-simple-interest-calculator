# Deployment Notes

## Live URL

- `https://dmas-simple-interest-calculator.vercel.app`

## Easy deploy commands

```powershell
npm run deploy
npm run deploy:prod
```

## Custom domain

When you have a domain name, add it to the existing Vercel project:

```powershell
vercel domains add your-domain.com dmas-simple-interest-calculator --scope vabilisettiabhishek-2138s-projects
vercel domains inspect your-domain.com
```

Then update these files to the final domain:

- `index.html`
- `public/robots.txt`
- `public/sitemap.xml`

And update Supabase Auth:

- Site URL
- Redirect URLs

## Google indexing

After the final domain is connected:

1. Open Google Search Console
2. Add the final domain or URL-prefix property
3. Submit `/sitemap.xml`
4. Request indexing for the homepage

## Git workflow

Typical future flow:

```powershell
git status
git add .
git commit -m "Describe the change"
npm run deploy:prod
```
