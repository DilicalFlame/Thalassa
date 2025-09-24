# Thalassa

> A friendly co‑pilot for exploring ocean data through interactive maps, visuals, and conversation.

Thalassa is an open‑source project that helps you make sense of ocean data. Ask questions in plain language, see the results on a globe or in charts, and understand the story behind the numbers.

---

## The Name: Thalassa (Θάλασσα)

In Greek, Thalassa means “sea” and refers to the primordial personification of the ocean. We chose the name because we’re building a digital window into the sea, something you can talk to, learn from, and explore.

---

## Our Vision

Ocean data is enormous and often hard to work with. That makes it tricky for researchers, educators, and curious minds to get answers fast.

With Thalassa, we’re lowering that barrier. Instead of another complex data viewer, we’re creating a “Living Digital Ocean”: an approachable way to discover patterns, ask questions, and share insights.

Here’s how it comes together:

1. **The Explorer**  
   An intuitive 3D globe for browsing the ocean. Fly around, track ARGO floats, and overlay layers like sea‑surface temperature and currents to spot patterns at a glance.

2. **FloatChat (AI co‑pilot)**  
   Ask questions in natural language. FloatChat turns them into data queries, builds clear visualizations on the fly, and explains what you’re seeing.

3. **The Storyteller**  
   Curated, thematic dashboards that turn raw data into narratives—connecting ocean trends to real‑world impacts like climate change, maritime safety, and the blue economy.

---

## Why it matters

We want to make ocean intelligence accessible to everyone. So researchers can move faster, learners can explore with curiosity, and decision‑makers can act with confidence.

## Time Range & Year Selection (New)

The globe now supports exploring float positions by individual year (2022–2024) or animating positions over a custom date range.

### Backend Additions

Endpoints now accept an optional `year` (default 2023):

- `GET /api/floats_in_box?min_lat=-90&max_lat=90&min_lon=-180&max_lon=180&year=2024`
- `GET /api/float/{platform_id}/path?year=2022`
- `GET /api/float/{platform_id}/profile?year=2024`
- `GET /api/float/{platform_id}/dossier?year=2022`
- `GET /api/float/all/platform_id?year=2024`

New range endpoint (unions distinct position tables across years):

```
GET /api/floats_in_box/range?min_lat=-90&max_lat=90&min_lon=-180&max_lon=180&start_date=2022-06-01&end_date=2023-03-01
```

Response shape:
```json
{
  "count": 1234,
  "start_date": "2022-06-01",
  "end_date": "2023-03-01",
  "positions": [ {"platform_id":123,"lat":-40.1,"lon":150.2,"date":"2022-06-04T00:00:00Z"} ]
}
```

### Frontend Usage

An overlay `TimeControls` panel (top-left) lets you:

1. Toggle between Year vs Range mode
2. Pick a year (loads latest positions for that year)
3. Choose start + end dates (range mode)
4. Play / pause an animation that progressively reveals positions through time.

Animation presently advances every 0.5s through the ordered positions (`distinct_float_positions_{year}` union). This is intentionally simple and can be upgraded (binning by day / month, tweening, etc.).

### Future Ideas

- Aggregate frames by month to reduce overdraw
- Color encoding by age or depth
- Scrubbable timeline bar instead of autoplay-only
- Server-side temporal clustering
