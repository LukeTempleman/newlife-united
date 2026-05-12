# Newlife United CRM System - Setup & Deployment Guide

## Overview

Your Newlife United website now has a complete **Content & Event Management System (CRM)** powered by **Cloudflare Workers**, **D1 Database**, and **R2 Object Storage**.

### Key Features
- ✅ **Hidden Admin Login** (`/admin`) - Username: `newlifeadmin`, Password: `#tmW1^CRdAEW`
- ✅ **Event Management Dashboard** - Create, edit, delete events
- ✅ **Image Upload & Management** - Store images in R2
- ✅ **Dynamic Event Loading** - Events automatically sync across all pages
- ✅ **Database-First Architecture** - All events stored in Cloudflare D1
- ✅ **Zero Cold Starts** - Runs on edge with millisecond latency

---

## Architecture

```
┌─────────────────────────────────────────┐
│        Website Visitors                  │
│        (All Pages)                       │
└──────────────┬──────────────────────────┘
               │
               ├─→ GET /api/events
               │   (fetch latest events)
               │
               └─→ https://newlife-united.pages.dev/
                   (Cloudflare Pages)
                         ↓
               ┌─────────────────────┐
               │  Cloudflare Worker  │ (workers/index.ts)
               │  - Auth (/api/auth) │
               │  - Events CRUD      │
               │  - Images (R2)      │
               └────────┬────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    ┌────────┐     ┌─────────┐   ┌──────────┐
    │ D1 DB  │     │ R2 Bucket│   │ JWT Auth │
    │ Events │     │ Images   │   │  Tokens  │
    └────────┘     └─────────┘   └──────────┘
```

---

## Files Created

### Core Files
- **`wrangler.toml`** - Cloudflare configuration (D1 & R2 bindings)
- **`package.json`** - Dependencies
- **`workers/index.ts`** - Main Worker entry point with routing
- **`workers/auth.ts`** - JWT authentication logic
- **`workers/events.ts`** - Event CRUD API handlers
- **`workers/images.ts`** - Image upload/download handlers
- **`db/schema.sql`** - D1 database schema
- **`admin/dashboard.html`** - Full admin dashboard UI

### Updated Files
- **`events.html`** - Now loads events dynamically from API
- **`js/crm.js`** - New `loadEvents()` method added

### Configuration
- **`.env.local`** - Already contains your church's Cloudflare account

---

## Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create D1 Database

```bash
# Create the D1 database
wrangler d1 create newlife-crm

# Apply the schema
wrangler d1 execute newlife-crm --file=db/schema.sql

# Verify with sample data:
wrangler d1 execute newlife-crm --command="SELECT * FROM events;"
```

### 3. Create R2 Bucket

```bash
# Create the R2 bucket
wrangler r2 bucket create newlife-images
```

### 4. Deploy Worker

```bash
# Deploy to Cloudflare
wrangler deploy
```

### 5. Verify Deployment

Test the login page:
```
https://newlife-united.pages.dev/admin
```

Login with:
- **Username:** `newlifeadmin`
- **Password:** `#tmW1^CRdAEW`

---

## API Endpoints

### Authentication
```
POST /api/auth/login
Headers: Content-Type: application/json
Body: { "username": "newlifeadmin", "password": "#tmW1^CRdAEW" }
Response: { "token": "...", "user": { "username": "newlifeadmin" } }
```

### Events - Get All
```
GET /api/events
Response: { "success": true, "data": [...] }
```

### Events - Create
```
POST /api/events
Headers: Authorization: Bearer {token}
         Content-Type: application/json
Body: {
  "title": "Sunday Service",
  "date": "2026-05-19",
  "time": "10:00 AM",
  "location": "Main Hall",
  "description": "...",
  "image_url": "https://...",
  "page": "events"
}
```

### Events - Update
```
PUT /api/events/{id}
Headers: Authorization: Bearer {token}
Body: { ...updated fields... }
```

### Events - Delete
```
DELETE /api/events/{id}
Headers: Authorization: Bearer {token}
```

### Images - Upload
```
POST /api/images/upload
Headers: Authorization: Bearer {token}
Body: FormData with "file" field
Response: { "key": "...", "url": "https://..." }
```

---

## Admin Dashboard Features

### 1. Events Tab
- View all events in a card grid
- Create new events with:
  - Title, description
  - Date & time
  - Location
  - Associated page (events, watch, youth, kids, etc.)
  - Image URL
- Delete events
- Events auto-sync to website (if fetching API)

### 2. Settings Tab
- View API endpoint information
- Quick links to events API
- Logout button

---

## Using the CRM from Your Website Pages

### Load Events on Any Page

Add this to your HTML page (after importing `crm.js`):

```html
<div id="eventsList"></div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    if (window.CRM && window.CRM.loadEvents) {
      // Load events for the "watch" page (max 10)
      window.CRM.loadEvents('#eventsList', 'watch', 10);
    }
  });
</script>
```

### API Format

Events fetched from the API have this structure:

```javascript
{
  "id": "evt_1715895600000_abc123def",
  "title": "Sunday Service",
  "description": "Join us for worship and teaching",
  "date": "2026-05-19",
  "time": "10:00 AM",
  "location": "Main Hall",
  "image_url": "https://...",
  "page": "events",
  "is_active": true,
  "created_at": "2026-05-11T10:30:00Z",
  "updated_at": "2026-05-11T10:30:00Z"
}
```

---

## Important Notes

### Security
⚠️ **For Production:**
1. Change the hardcoded password in `workers/auth.ts`
2. Change `JWT_SECRET` to a strong random string
3. Never commit secrets to git
4. Use Cloudflare Pages Environment Variables for sensitive data

### Database
- Events are stored in D1 and will persist across deployments
- Use the Cloudflare Dashboard to backup your database
- The `is_active` field can be used to hide/show events

### Images
- R2 bucket requires a custom domain configured in Cloudflare to serve images publicly
- Update the image URL pattern in `workers/images.ts` line with your domain:
  ```typescript
  const imageUrl = `https://images.newlife-united.com/${key}`;
  ```

### CORS
- All API endpoints allow cross-origin requests (`*`)
- Update this in `workers/index.ts` for production security

---

## Local Development

### Run Locally
```bash
wrangler dev
```

Access:
- Website: http://localhost:8787
- Admin: http://localhost:8787/admin
- Events API: http://localhost:8787/api/events

### Test with curl
```bash
# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"newlifeadmin","password":"#tmW1^CRdAEW"}'

# Get events
curl http://localhost:8787/api/events

# Create event
curl -X POST http://localhost:8787/api/events \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","date":"2026-05-19","time":"10:00 AM"}'
```

---

## Troubleshooting

### 404 on /admin
- Make sure Worker is deployed: `wrangler deploy`
- Check Pages routing in Cloudflare Dashboard

### Events not loading
- Check browser console for errors
- Verify API endpoint: `curl https://newlife-united.pages.dev/api/events`
- Check authentication token validity

### Database errors
- Verify D1 exists: `wrangler d1 list`
- Check schema was applied: `wrangler d1 execute newlife-crm --command="SELECT name FROM sqlite_master WHERE type='table';"`

### Image upload fails
- Verify R2 bucket exists: `wrangler r2 bucket list`
- Check file size (should be under limits)
- Verify image format (JPEG, PNG, WebP, GIF)

---

## Next Steps

1. ✅ Deploy to production: `wrangler deploy`
2. ✅ Test admin login at `/admin`
3. ✅ Create your first event
4. ✅ Update other pages (watch.html, youth.html, etc.) to load events dynamically
5. ✅ Configure R2 custom domain for image serving
6. ✅ Update security settings for production

---

## Support

For Cloudflare docs:
- Workers: https://developers.cloudflare.com/workers/
- D1: https://developers.cloudflare.com/d1/
- R2: https://developers.cloudflare.com/r2/
- Pages: https://developers.cloudflare.com/pages/

---

**Built with ❤️ by Newlife United**
