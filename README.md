# mySTAR (Student Tracker for Attendance and Recitation)

A cyber-academic educator dashboard for attendance, cold-call recitation, seating charts, and CSV reporting.

## Tech Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- Credentials auth with bcrypt + server-side session cookies
- CSV parsing via `csv-parse`

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL via Docker**
   ```bash
   docker compose up -d db
   ```

4. **Run migrations and generate Prisma client**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Seed the initial admin account**
   ```bash
   npm run seed
   ```

6. **Run the app**
   ```bash
   npm run dev
   ```

## Database Migration Commands
- **Create a new migration**: `npx prisma migrate dev`
- **Deploy migrations (prod)**: `npx prisma migrate deploy`
- **Generate Prisma client**: `npx prisma generate`

## Create Admin User
Set the following environment variables and run the seed script:
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
ADMIN_DISPLAY_NAME="System Admin"
npm run seed
```

## AWS Lightsail UI Deployment (Step-by-Step)
These instructions are written for first-time users of Lightsail. Each step includes where to find the UI elements in the Lightsail console and where to get the values you need.

### 1) Create a Lightsail Instance
1. Open the AWS Lightsail console: https://lightsail.aws.amazon.com/.
2. In the **Instances** tab, click **Create instance** (top-right).
3. **Region/Zone**: pick the closest region to your users (top-left region selector).
4. **Platform**: choose **Linux/Unix**.
5. **Blueprint**: choose **Ubuntu 22.04 LTS** (scroll down if you don’t see it).
6. **Plan**: start with **2 GB RAM / 1 vCPU** (upgrade later if needed).
7. **Identify your instance**: enter a name like `mystar-prod`.
8. Click **Create instance** and wait for the instance to show **Running**.

### 2) Configure Networking / Firewall
1. Click your instance name in the **Instances** tab.
2. Open the **Networking** tab.
3. Under **IPv4 firewall**, click **+ Add rule** and add:
   - `22` TCP (SSH)
   - `80` TCP (HTTP)
   - `443` TCP (HTTPS)
4. The public IP address you will use later is visible at the top of the instance detail page under **Public IPv4 address**.

### 3) Connect to the Instance (Browser or Local SSH)
1. Use the **Connect using SSH** button on the instance page (this opens a browser-based terminal).
2. Update system packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

### 4) Install Docker + Docker Compose
```bash
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```
Log out and back in (or restart the shell) to pick up Docker permissions.

### 5) Upload the Code (Git Clone)
```bash
git clone <your-repo-url> mystar
cd mystar
```
**Where to get your repo URL:** In GitHub, open your repository, click the green **Code** button, and copy the HTTPS URL (it looks like `https://github.com/<org>/<repo>.git`). If you use another Git host, look for a **Clone** or **Code** button.

### 6) Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
Set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
- This `.env` file lives in the project root (the `mystar` folder you cloned) next to `package.json`.
- You can see the required variable names in `.env.example` (open it with `cat .env.example`).
- Example database URL for the Docker database in this repo:
  `DATABASE_URL=postgresql://mystar:mystar@db:5432/mystar`
- Use strong credentials for `ADMIN_PASSWORD`.

### 7) Set Up the Database on Lightsail
This deployment uses the PostgreSQL container from `docker-compose.yml`.
1. Start the database service (creates the `mystar_db` Docker volume):
   ```bash
   docker compose up -d db
   ```
2. Verify the database is healthy:
   ```bash
   docker compose ps
   ```
3. (Optional) Connect to PostgreSQL for troubleshooting:
   ```bash
   docker compose exec db psql -U mystar -d mystar
   ```
4. Keep your `.env` aligned with the compose database credentials:
   - Example: `DATABASE_URL=postgresql://mystar:mystar@db:5432/mystar`
   - The DB username, password, and database name are defined in `docker-compose.yml`.

### 8) Build and Run with Docker Compose
```bash
docker compose up -d --build
```
Check that the containers are up:
```bash
docker compose ps
```

### 9) Run Migrations + Seed Admin
```bash
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run seed
```
If you see errors, re-check your `DATABASE_URL` in `.env` and confirm the `db` container is running.
If you see `service "web" is not running`, make sure the web container is up:
```bash
docker compose ps
docker compose up -d --build
docker compose logs --tail=100 web
```
If `docker compose up -d --build` fails with `npm run build` exit code `1`, check the build output for the exact error and verify prerequisites:
```bash
docker compose logs --tail=200 web
docker compose exec web node -v
docker compose exec web npm -v
```
- Confirm your `.env` values are present and valid (missing env vars can break the Next.js build).

### 10) Basic HTTP Deployment (Quick)
- Access the app via `http://<your-lightsail-ip>:3000`.
- If you want it on port 80, set up a reverse proxy (recommended below).
**Where to find your IP:** on the instance detail page, the **Public IPv4 address** value is your `<your-lightsail-ip>`.

### 11) HTTPS Deployment (Recommended)
**Option A: Nginx + Let's Encrypt**
1. Install Nginx and Certbot:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```
2. Create an Nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/mystar
   ```
   Example:
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;

     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
     }
   }
   ```
3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mystar /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
4. Get HTTPS certificate:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```
   - Replace `yourdomain.com` with the domain name you bought (from any registrar).

### 12) Connect a Domain
1. In Lightsail, create a **Static IP** and attach it to your instance.
2. Create a **DNS Zone** in Lightsail for your domain.
3. Point your domain registrar to Lightsail name servers.
4. Add an **A record** for `@` and `www` to the static IP.
5. Wait for DNS to propagate, then run Certbot for HTTPS.
**Where to find DNS info:** after creating the DNS zone, Lightsail shows the name servers you must copy into your registrar’s DNS settings.

---

## CSV Formats
- **Import Students**: `firstName,lastName,studentId,nickname,contactNumber,photoUrl`
- **Exports**:
  - Daily Snapshot
  - Attendance Matrix (rows = students, columns = dates)
  - Recitation Matrix (total participation per student)

## Notes
- Students belong to classes (not sections) for simplified roster management.
- Attendance defaults to **Present** until changed.
- Weighted recitation uses an exponential decay with class-defined lambda.
