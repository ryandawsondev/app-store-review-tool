const express = require("express");
const cors = require("cors");
const path = require("path");
const store = require("app-store-scraper");

const app = express();
app.use(cors());
app.use(express.json());

// Search apps by name
app.get("/api/search", async (req, res) => {
  const { term, num = 5 } = req.query;
  if (!term) return res.status(400).json({ error: "term is required" });
  try {
    const results = await store.search({
      term,
      num: parseInt(num),
      country: "gb",
    });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get app details by ID
app.get("/api/app/:id", async (req, res) => {
  try {
    const result = await store.app({ id: req.params.id, country: "gb" });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get reviews by app ID
app.get("/api/reviews/:id", async (req, res) => {
  const { page = 1, sort = "recent" } = req.query;
  const sortMap = { recent: store.sort.RECENT, helpful: store.sort.HELPFUL };
  try {
    const results = await store.reviews({
      id: req.params.id,
      country: "gb",
      page: parseInt(page),
      sort: sortMap[sort] || store.sort.RECENT,
    });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get ratings summary
app.get("/api/ratings/:id", async (req, res) => {
  try {
    const result = await store.ratings({ id: req.params.id, country: "gb" });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const COUNTRIES = [
  "us", "gb", "au", "ca", "nz", "ie", "in", "sg", "za",
  "de", "fr", "it", "es", "nl", "se", "no", "dk", "fi", "pl", "pt", "at", "ch", "be", "gr", "cz", "hu", "ro",
  "jp", "kr", "hk", "tw", "th", "my", "ph", "id",
  "br", "mx", "ar", "cl", "co",
  "ae", "sa", "tr", "ru",
];

async function fetchCountryReviews(id, country) {
  const fetchSort = async (sort) => {
    const results = [];
    for (let p = 1; p <= 10; p++) {
      try {
        const batch = await store.reviews({ id, country, page: p, sort });
        results.push(...batch.map((r) => ({ ...r, country })));
        if (batch.length === 0) break;
      } catch (_) {
        break;
      }
    }
    return results;
  };
  const [recent, helpful] = await Promise.all([
    fetchSort(store.sort.RECENT),
    fetchSort(store.sort.HELPFUL),
  ]);
  return [...recent, ...helpful];
}

app.get("/api/export-all/:id", async (req, res) => {
  try {
    const appDetails = await store.app({ id: req.params.id, country: "gb" });
    const appName = appDetails.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    const allRaw = [];
    const batchSize = 5;
    for (let i = 0; i < COUNTRIES.length; i += batchSize) {
      const batch = COUNTRIES.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((c) => fetchCountryReviews(req.params.id, c))
      );
      for (const r of results) {
        if (r.status === "fulfilled") allRaw.push(...r.value);
      }
    }

    const seen = new Set();
    const unique = [];
    for (const r of allRaw) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        unique.push(r);
      }
    }

    const header = "id,userName,score,title,text,version,updated,country";
    const rows = unique.map((r) =>
      [r.id, r.userName, r.score, r.title, r.text, r.version, r.updated, r.country]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${appName}_all_reviews.csv"`);
    res.send("\uFEFF" + [header, ...rows].join("\n"));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/export/:id", async (req, res) => {
  const appDetails = await store.app({ id: req.params.id, country: "gb" });
  const appName = appDetails.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  const fetchAllPages = async (sort) => {
    const results = [];
    for (let p = 1; p <= 10; p++) {
      const batch = await store.reviews({
        id: req.params.id,
        country: "gb",
        page: p,
        sort,
      });
      results.push(...batch);
      if (batch.length === 0) break;
    }
    return results;
  };

  const [recent, helpful] = await Promise.all([
    fetchAllPages(store.sort.RECENT),
    fetchAllPages(store.sort.HELPFUL),
  ]);

  const seen = new Set();
  const allReviews = [];
  for (const r of [...recent, ...helpful]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      allReviews.push(r);
    }
  }

  const header = "id,userName,score,title,text,version,updated";
  const rows = allReviews.map((r) =>
    [r.id, r.userName, r.score, r.title, r.text, r.version, r.updated]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${appName}_reviews.csv"`,
  );
  res.send("\uFEFF" + [header, ...rows].join("\n"));
});

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ App Store Scraper running at http://localhost:${PORT}`);
});
