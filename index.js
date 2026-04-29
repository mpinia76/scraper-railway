const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ status: 'error', message: 'Falta el parámetro url' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });

        const page = await browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        );

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        });

        // Espera a que la red esté idle (Cloudflare challenge resuelto)
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        // Si Cloudflare muestra challenge, esperar hasta 10s extra
        const title = await page.title();
        if (title.includes('Just a moment')) {
            await new Promise(r => setTimeout(r, 8000));
        }

        const html = await page.content();
        await browser.close();

        return res.send(html);

    } catch (err) {
        if (browser) await browser.close();
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Scraper corriendo en puerto ${PORT}`);
});
