# Render Deployment

Deploy this repository as one Docker web service.

## Render Settings

- Service type: Web Service
- Runtime: Docker
- Root directory: leave empty
- Dockerfile path: `./Dockerfile`

## Required Environment Variables

Set these in Render, not in the repo:

```env
APP_NAME=FleetTrack
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:replace_with_generated_key
APP_URL=https://your-service-name.onrender.com
FRONTEND_URL=https://your-service-name.onrender.com

DB_CONNECTION=mysql
DB_HOST=your_database_host
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr
RUN_MIGRATIONS=true
```

Generate `APP_KEY` locally from the backend folder:

```powershell
php artisan key:generate --show
```

The frontend is built into Laravel's `public` directory and calls the API on the same domain via `/api/v1`.
