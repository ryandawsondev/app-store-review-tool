# App Store Scraper

A self-hosted web UI for browsing and exporting iOS App Store reviews. Search any app, inspect ratings and metadata, and download reviews as a CSV — for the GB store or across 44 countries at once.

## Features

- **App search** — find any iOS app by name, showing icon, title, and developer
- **App details** — rating, review count, version, price, size, release/update dates, and description
- **Rating breakdown** — visual histogram of 1–5 star distributions
- **Review browser** — paginated reviews sortable by most recent or most helpful
- **CSV export (GB)** — downloads all available GB reviews deduplicated across both sort orders
- **CSV export (all countries)** — scrapes 44 App Store regions in parallel and exports a single deduplicated CSV with a `country` column

## Tech Stack

- **Backend:** Node.js, Express, [`app-store-scraper`](https://github.com/nickhould/app-store-scraper)
- **Frontend:** Vanilla HTML/CSS/JS (no build step)

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
git clone https://github.com/your-username/app-review-scraper.git
cd app-review-scraper
npm install
```

### Running

```bash
node server.js
```

Then open [http://localhost:3001](http://localhost:3001) in your browser.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?term=&num=` | Search apps by name |
| GET | `/api/app/:id` | Get app details by App Store ID |
| GET | `/api/reviews/:id?page=&sort=` | Get paginated reviews (`sort`: `recent` or `helpful`) |
| GET | `/api/ratings/:id` | Get rating histogram |
| GET | `/api/export/:id` | Download GB reviews as CSV |
| GET | `/api/export-all/:id` | Download reviews from all 44 countries as CSV |

## Supported Countries (All Countries Export)

Covers 44 regions including US, GB, AU, CA, DE, FR, JP, KR, BR, and more.

## License

ISC
