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

### 1) Create a Lightsail Instance
1. Open AWS Lightsail console.
2. Click **Create instance**.
3. **Platform**: Linux/Unix.
4. **Blueprint**: Ubuntu 22.04 LTS.
5. **Plan**: Start with 2 GB RAM / 1 vCPU (or higher for teams).
6. **Name** the instance (e.g., `mystar-prod`).
7. Click **Create instance**.

### 2) Configure Networking / Firewall
1. Open your instance in Lightsail.
2. Go to the **Networking** tab.
3. Add firewall rules:
   - `22` TCP (SSH)
   - `80` TCP (HTTP)
   - `443` TCP (HTTPS)

### 3) Connect to the Instance (Browser or Local SSH)
1. Use the **Connect using SSH** button in Lightsail.
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

### 6) Configure Environment Variables
```bash
cp .env.example .env
nano .env
```
Set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.

### 7) Build and Run with Docker Compose
```bash
docker compose up -d --build
```

### 8) Run Migrations + Seed Admin
```bash
docker compose exec web npx prisma migrate deploy
docker compose exec web npm run seed
```

### 9) Basic HTTP Deployment (Quick)
- Access the app via `http://<your-lightsail-ip>:3000`.
- If you want it on port 80, set up a reverse proxy (recommended below).

### 10) HTTPS Deployment (Recommended)
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

### 11) Connect a Domain
1. In Lightsail, create a **Static IP** and attach it to your instance.
2. Create a **DNS Zone** in Lightsail for your domain.
3. Point your domain registrar to Lightsail name servers.
4. Add an **A record** for `@` and `www` to the static IP.
5. Wait for DNS to propagate, then run Certbot for HTTPS.

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
