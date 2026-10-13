/* عجلة حياتك · قعدة صراحة — خادم بسيط: يقدّم الصفحة ويجمع الإحصائيات */
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const STATS_KEY = process.env.STATS_KEY || "";            // اختياري: كلمة سر لصفحة الإحصائيات
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "stats.json");

app.disable("x-powered-by");
app.use(express.json({ limit: "4kb" }));

/* ====== الإحصائيات ====== */
const TYPES = ["عجلة متوازنة ومتينة", "عجلة قوية فيها نقطة ضعف", "عجلة متوازنة تحتاج دفعة", "عجلة تحتاج إعادة ضبط"];
const AXES = ["روحي", "نفسي", "عقلي", "صحي", "مهني", "مالي", "اجتماعي", "عائلي"];
const blank = () => ({ starts: 0, completes: 0, types: {}, priorities: {}, fit: { sum: 0, n: 0 }, days: {}, since: new Date().toISOString() });
let S = blank();
try { fs.mkdirSync(DATA_DIR, { recursive: true }); S = Object.assign(blank(), JSON.parse(fs.readFileSync(FILE, "utf8"))); } catch (e) { /* أول تشغيل */ }

let dirty = false;
const save = () => { if (!dirty) return; dirty = false; fs.writeFile(FILE, JSON.stringify(S), () => {}); };
setInterval(save, 5000);
process.on("SIGTERM", () => { save(); process.exit(0); });

const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };
app.post("/api/event", (req, res) => {
  const e = req.body || {};
  const day = new Date().toISOString().slice(0, 10);
  S.days[day] = S.days[day] || { s: 0, c: 0 };
  if (e.t === "start") { S.starts++; S.days[day].s++; }
  else if (e.t === "done") {
    S.completes++; S.days[day].c++;
    if (TYPES.includes(e.type)) inc(S.types, e.type);
    if (AXES.includes(e.pr)) inc(S.priorities, e.pr);
    const f = Number(e.fit); if (Number.isFinite(f) && f >= 0 && f <= 100) { S.fit.sum += f; S.fit.n++; }
  } else return res.status(400).end();
  dirty = true; res.status(204).end();
});

const allowed = req => !STATS_KEY || req.query.key === STATS_KEY;
app.get("/api/stats", (req, res) => allowed(req) ? res.json(S) : res.status(401).json({ error: "مطلوب مفتاح" }));
app.get("/stats", (req, res) => res.sendFile(path.join(__dirname, "public", "stats.html")));
app.get("/healthz", (req, res) => res.send("ok"));

/* ====== الملفات ====== */
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  setHeaders(res, p) {
    if (p.endsWith("sw.js") || p.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
    if (p.endsWith(".webmanifest")) res.setHeader("Content-Type", "application/manifest+json");
  }
}));
app.use((req, res) => res.redirect("/"));

app.listen(PORT, () => console.log(`عجلة حياتك تعمل على المنفذ ${PORT}`));
