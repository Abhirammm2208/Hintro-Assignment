# Setup & Deployment Guide

## Quick Start (Local Development)

### Prerequisites Check

```bash
# Check Node.js version (should be 14+)
node --version

# Check npm version
npm --version

# Check PostgreSQL installation
psql --version
```

### Step 1: Database Setup

```bash
# Start PostgreSQL (Windows)
net start PostgreSQL15

# Or on Mac with Homebrew
brew services start postgresql

# Create database
createdb task_collaboration

# Run schema
psql task_collaboration < schema.sql

# Verify tables created
psql task_collaboration -c "\dt"
```

### Step 2: Backend Setup

```bash
cd backend

# Copy and configure environment
cp .env.example .env

# Edit .env file with your values
# IMPORTANT: Set strong JWT_SECRET for production

# Install dependencies
npm install

# Test database connection
npm run dev
# Should output: "Server running on port 5000"
# And: "WebSocket server is active"

# Stop with Ctrl+C
```

### Step 3: Frontend Setup

```bash
cd ../frontend

# Copy and configure environment
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
EOF

# Install dependencies
npm install

# Start development server
npm start
# Should open http://localhost:3000 automatically
```

### Step 4: Test the Application

1. **Sign Up**
   - Go to http://localhost:3000/signup
   - Create account: demo@example.com / demo_user / password123
   - Click Sign Up

2. **Create Board**
   - Click "+ New Board"
   - Enter "My First Board"
   - Click "Create Board"

3. **Create Lists**
   - Click into the board
   - Click "+ Add List"
   - Create lists: "To Do", "In Progress", "Done"

4. **Create Tasks**
   - In "To Do" list, click "Add a card..."
   - Enter task title
   - Click "Add"

5. **Drag & Drop**
   - Drag task from "To Do" to "In Progress"
   - See real-time update

6. **Test Real-Time**
   - Open another tab with same board
   - Make changes in Tab 1
   - Verify changes appear in Tab 2 instantly

## Configuration

### Backend .env File

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/task_collaboration

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

**Important:**
- `JWT_SECRET`: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `DATABASE_URL`: Format: `postgresql://user:password@host:port/database`
- For production, use environment variables or secrets manager

### Frontend .env File

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

**For Production:**
```env
REACT_APP_API_URL=https://api.example.com/api
REACT_APP_SOCKET_URL=https://api.example.com
```

## Database Initialization

### Option 1: Using psql

```bash
# Connect to database
psql task_collaboration

# Run schema
\i schema.sql

# Verify
\dt  # List tables
```

### Option 2: Using pgAdmin (GUI)

1. Open pgAdmin
2. Create new database: "task_collaboration"
3. Open Query Tool
4. Copy schema.sql content and execute
5. Verify tables created

### Option 3: Using Azure Data Studio

1. Connect to PostgreSQL
2. Create new query
3. Paste schema.sql
4. Execute
5. Verify in object explorer

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Database Connection Error

**Error:** `ECONNREFUSED 127.0.0.1:5432`

```bash
# Check PostgreSQL is running
psql -c "SELECT 1"

# Check connection string format
postgresql://user:password@localhost:5432/task_collaboration

# Verify database exists
psql -l | grep task_collaboration
```

### WebSocket Connection Error

**Error:** `WebSocket is closed before the connection is established`

```javascript
// Frontend console check:
// 1. Backend running and CORS configured
// 2. Socket URL matches backend address
// 3. No proxy interfering with WebSocket

// Solution: Update .env
REACT_APP_SOCKET_URL=http://localhost:5000
```

### CORS Errors

**Error:** `Access to XMLHttpRequest blocked by CORS policy`

```javascript
// backend/server.js - update CORS:
app.use(cors({
  origin: 'http://localhost:3000',  // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Backend `.env` configured with production values
- [ ] Database running on production PostgreSQL
- [ ] JWT_SECRET is strong and unique
- [ ] FRONTEND_URL points to production frontend
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] CORS origin set to production domain
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Backup strategy in place
- [ ] Load testing completed

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY server.js .

EXPOSE 5000

CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: task_collaboration
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/task_collaboration
      JWT_SECRET: your_secret_here
      NODE_ENV: production
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      REACT_APP_API_URL: http://localhost:5000/api
      REACT_APP_SOCKET_URL: http://localhost:5000

volumes:
  postgres_data:
```

**Run with Docker Compose:**
```bash
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down
```

### Azure Deployment

#### 1. Backend on Azure App Service

```bash
# Create resource group
az group create --name myResourceGroup --location eastus

# Create App Service plan
az appservice plan create --name myAppServicePlan --resource-group myResourceGroup --sku B1 --is-linux

# Create Web App
az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name myBackendApp --runtime "NODE|18-lts"

# Deploy from local git
az webapp deployment user set --user-name myDeploymentUser --password myPassword123!

# Configure connection string
az webapp config appsettings set --resource-group myResourceGroup --name myBackendApp --settings DATABASE_URL="postgresql://..." JWT_SECRET="..."

# Deploy
git remote add azure https://myDeploymentUser@myBackendApp.scm.azurewebsites.net:443/myBackendApp.git
git push azure main
```

#### 2. Frontend on Azure Static Web App

```bash
# Create Azure Static Web App
az staticwebapp create --name myFrontendApp --resource-group myResourceGroup --source https://github.com/your-repo

# Configure environment variables
az staticwebapp appsettings set --name myFrontendApp --setting-names REACT_APP_API_URL=https://myBackendApp.azurewebsites.net/api
```

#### 3. Database on Azure Database for PostgreSQL

```bash
# Create PostgreSQL server
az postgres server create --resource-group myResourceGroup --name myPostgresServer --location eastus --admin-user dbadmin --admin-password MyPassword123!

# Create database
az postgres db create --resource-group myResourceGroup --server-name myPostgresServer --name task_collaboration

# Run schema
psql -h myPostgresServer.postgres.database.azure.com -U dbadmin@myPostgresServer -d task_collaboration < schema.sql
```

### AWS Deployment

#### 1. Backend on EC2

```bash
# Launch EC2 instance (Ubuntu 20.04)
# SSH into instance
ssh -i keypair.pem ubuntu@instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/your-repo.git
cd your-repo/backend

# Install dependencies
npm install

# Setup PM2 for process management
sudo npm install -g pm2

# Start backend
pm2 start server.js --name "task-backend"
pm2 startup
pm2 save

# Setup reverse proxy with Nginx
sudo apt-get install -y nginx
```

#### 2. Frontend on CloudFront + S3

```bash
# Build frontend
cd frontend
npm run build

# Create S3 bucket
aws s3 mb s3://my-task-app

# Upload build files
aws s3 sync build/ s3://my-task-app --delete

# Create CloudFront distribution
# - Origin: S3 bucket
# - Default root object: index.html
# - Error pages: 404 → /index.html
```

#### 3. Database on RDS

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier task-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password MyPassword123! \
  --allocated-storage 20

# Get endpoint
aws rds describe-db-instances --db-instance-identifier task-db

# Connect and run schema
psql -h task-db.example.rds.amazonaws.com -U postgres < schema.sql
```

## Performance Tuning

### Database Optimization

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tasks WHERE board_id = $1;

-- Create index if needed
CREATE INDEX idx_tasks_board_id_created ON tasks(board_id, created_at DESC);

-- Monitor slow queries
ALTER DATABASE task_collaboration SET log_min_duration_statement = 1000;

-- Check index usage
SELECT * FROM pg_stat_user_indexes;
```

### Backend Optimization

```javascript
// Add caching
const cache = new Map();

app.get('/api/boards/:id', (req, res) => {
  const cached = cache.get(req.params.id);
  if (cached) return res.json(cached);

  // Fetch from DB
  // ...cache.set(req.params.id, data);
});

// Connection pooling
const pool = new Pool({
  max: 20,  // Max connections
  idleTimeoutMillis: 30000,
});
```

### Frontend Optimization

```javascript
// Code splitting
const Board = lazy(() => import('./pages/Board'));
const Boards = lazy(() => import('./pages/Boards'));

// Memoization
const TaskCard = memo(({ task }) => {...});

// Lazy loading images
<img loading="lazy" src="..." />
```

## Monitoring & Logging

### Backend Logging

```javascript
// Install Winston
npm install winston

const logger = require('winston');

logger.info('User logged in', { userId: user.id });
logger.error('Database error', { error: err.message });
```

### Application Insights (Azure)

```javascript
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY);
appInsights.start();
```

### CloudWatch (AWS)

```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

cloudwatch.putMetricData({
  Namespace: 'TaskApp',
  MetricData: [{
    MetricName: 'ActiveUsers',
    Value: activeUserCount
  }]
}, (err) => {
  if (err) console.error(err);
});
```

## Backup Strategy

### PostgreSQL Backup

```bash
# Full backup
pg_dump task_collaboration > backup.sql

# Restore
psql task_collaboration < backup.sql

# Scheduled backup (cron)
# 0 2 * * * pg_dump task_collaboration > /backups/backup-$(date +\%Y\%m\%d).sql
```

### Continuous Backup

- Use `pg_basebackup` for WAL archiving
- Store backups on S3/Azure Blob Storage
- Test recovery monthly

## Maintenance

### Regular Tasks

- [ ] Monitor disk usage
- [ ] Check database performance
- [ ] Review error logs
- [ ] Update dependencies
- [ ] Test backup restoration
- [ ] Review and optimize slow queries
- [ ] Monitor memory usage
- [ ] Check SSL certificate expiry

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update minor/patch versions
npm update

# Update major versions (review breaking changes)
npm install -g npm-check-updates
ncu -u
npm install
```

## Security Hardening

### HTTPS/TLS

- Use Let's Encrypt for free SSL
- Set HSTS header
- Enable SSL pinning

### Database Security

- Use VPC/Private subnet
- Enable encryption at rest
- Use parameterized queries (already done)
- Regular security audits

### API Security

- Rate limiting
- Input validation
- CORS configuration
- CSRF protection
- Helmet.js middleware

### Code Security

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Use snyk for detailed scanning
npm install -g snyk
snyk test
```

## Troubleshooting Production Issues

### High Memory Usage

```bash
# Check process memory
ps aux | grep node

# Enable heap snapshots
node --inspect server.js

# Use Chrome DevTools: chrome://inspect
```

### Slow Database Queries

```sql
-- Enable query logging
SET log_min_duration_statement = 1000;

-- Check slow query log
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC;
```

### WebSocket Connection Issues

```bash
# Check network
netstat -an | grep :5000

# Monitor socket connections
ss -tunap | grep :5000

# Check firewall
sudo ufw status
```

## Support Contacts

- Database: PostgreSQL documentation
- Backend: Node.js/Express documentation
- Frontend: React documentation
- Hosting: AWS/Azure support
