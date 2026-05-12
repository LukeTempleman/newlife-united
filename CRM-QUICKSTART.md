# 🔐 Newlife United CRM - Quick Reference

## Admin Credentials
- **URL:** `https://newlife-united.pages.dev/admin`
- **Username:** `newlifeadmin`
- **Password:** `#tmW1^CRdAEW`

## Quick Start - Deploy in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Deploy to Cloudflare
```bash
wrangler deploy
```

### Step 3: Set Up Database
```bash
# Create D1 database
wrangler d1 create newlife-crm

# Apply schema
wrangler d1 execute newlife-crm --file=db/schema.sql
```

## What's Included

### ✅ Hidden Admin Login
- Secret `/admin` page with custom credentials
- JWT-based session management

### ✅ Event Management Dashboard
- Create events with title, date, time, location, description
- Assign events to any page (events, watch, youth, kids, etc.)
- Delete events
- Real-time sync to website

### ✅ Image Management
- Upload images to R2 storage
- Auto-generated unique filenames
- Support for JPEG, PNG, WebP, GIF

### ✅ Cloudflare Infrastructure
- **D1 Database:** Stores all events
- **R2 Storage:** Manages event images
- **Workers:** API backend (0ms cold starts)
- **Pages:** Website frontend

### ✅ Dynamic Event Loading
- All pages can fetch events from `/api/events`
- Automatic rendering with proper formatting
- No page reloads needed

## API Endpoints Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/login` | No | Login & get JWT token |
| GET | `/api/events` | No | Get all events |
| POST | `/api/events` | Yes | Create new event |
| PUT | `/api/events/:id` | Yes | Update event |
| DELETE | `/api/events/:id` | Yes | Delete event |
| POST | `/api/images/upload` | Yes | Upload image to R2 |
| GET | `/api/images/:key` | No | Download image |
| DELETE | `/api/images/:key` | Yes | Delete image |

## Project Structure
```
newlife-united/
├── workers/
│   ├── index.ts          (Router & main entry)
│   ├── auth.ts           (JWT authentication)
│   ├── events.ts         (Event CRUD endpoints)
│   └── images.ts         (Image upload/storage)
├── admin/
│   └── dashboard.html    (Admin UI)
├── db/
│   └── schema.sql        (D1 database schema)
├── js/
│   └── crm.js            (Updated with loadEvents)
├── events.html           (Updated to load from API)
├── wrangler.toml         (Cloudflare config)
├── package.json          (Dependencies)
├── .env.local            (Your Cloudflare account)
├── .gitignore            (Git exclusions)
└── CRM-SETUP.md          (Detailed guide)
```

## Key Features

### For Admins
- Login at `/admin` with hardcoded credentials
- Intuitive dashboard with tabs for Events/Settings
- Create/edit/delete events in seconds
- Upload images to R2
- Real-time updates to website

### For Visitors
- Events automatically sync across all pages
- No page rebuilds needed
- Events sorted by date
- Beautiful formatting maintained
- Fast API responses (edge cached)

## Security Notes

### Current Setup (Development)
- ✅ Credentials hardcoded (for convenience)
- ✅ All API endpoints allow CORS `*`
- ✅ JWT tokens valid for 7 days

### For Production
- 🔒 Change hardcoded password in `workers/auth.ts`
- 🔒 Move credentials to Cloudflare Environment Variables
- 🔒 Restrict CORS to your domain only
- 🔒 Update R2 image URL with your custom domain

## Useful Commands

```bash
# Start local development server
wrangler dev

# Deploy to production
wrangler deploy

# Manage D1 database
wrangler d1 list                           # List databases
wrangler d1 execute newlife-crm --command="SELECT * FROM events;"  # Query

# Manage R2 storage
wrangler r2 bucket list                    # List buckets
wrangler r2 bucket create newlife-images   # Create bucket

# Reset everything (warning: deletes data!)
wrangler d1 delete newlife-crm
wrangler r2 bucket delete newlife-images
```

## Testing the API

### Get Auth Token
```bash
curl -X POST https://newlife-united.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"newlifeadmin","password":"#tmW1^CRdAEW"}'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {"username": "newlifeadmin", "role": "admin"}
}
```

### Get Events
```bash
curl https://newlife-united.pages.dev/api/events
```

### Create Event
```bash
curl -X POST https://newlife-united.pages.dev/api/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sunday Service",
    "date": "2026-05-19",
    "time": "10:00 AM",
    "location": "Main Hall",
    "page": "events"
  }'
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `/admin` returns 404 | Run `wrangler deploy` |
| Events don't load | Check browser console for API errors |
| Can't login | Verify credentials (username/password exact match) |
| Images won't upload | Check R2 bucket exists: `wrangler r2 bucket list` |
| Database errors | Verify D1 exists: `wrangler d1 list` |

## Next Steps

1. **Deploy:** `wrangler deploy`
2. **Test:** Open `https://newlife-united.pages.dev/admin`
3. **Create Events:** Add your first event in the dashboard
4. **Verify:** Check that event appears on `/events` page
5. **Update Other Pages:** Copy the event loading script to watch.html, youth.html, etc.
6. **Configure R2:** Set up custom domain for image serving
7. **Security:** Update credentials and CORS for production

---

**Questions?** Check [CRM-SETUP.md](./CRM-SETUP.md) for detailed documentation.
