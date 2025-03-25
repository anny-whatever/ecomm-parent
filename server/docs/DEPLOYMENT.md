# Deployment Guide

This document provides detailed instructions for deploying the e-commerce platform in various environments.

## System Requirements

### Minimum Requirements
- **Node.js**: v14.x or higher
- **MongoDB**: v4.4 or higher
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 20GB minimum
- **CPU**: 2 cores minimum
- **Operating System**: Ubuntu 20.04 LTS or higher / Windows Server 2019 or higher

### Recommended for Production
- **Node.js**: v16.x
- **MongoDB**: v5.0 or higher
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **CPU**: 4 cores
- **Redis**: v6.x (for caching and session management)

## Environment Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
NODE_ENV=production
PORT=3000
API_URL=https://api.yourdomain.com/api/v1

# Database
MONGODB_URI=mongodb://username:password@host:port/database
MONGODB_DB_NAME=ecommerce

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=1d
JWT_REFRESH_EXPIRY=30d

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Store Name

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5000000  # 5MB in bytes

# Logging
LOG_LEVEL=info

# Redis (Optional, for caching)
REDIS_URL=redis://username:password@host:port
```

### Security Considerations

1. Never commit the `.env` file to version control
2. Use strong, unique values for all secret keys
3. Restrict database user permissions to only what's necessary
4. Use environment-specific variables for different deployments

## Standard Deployment

### Prerequisites
- Node.js and npm installed
- MongoDB instance accessible
- Git installed

### Steps

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ecommerce-platform.git
cd ecommerce-platform
```

2. Install dependencies:
```bash
npm install --production
```

3. Setup environment variables (as described above)

4. Initialize the database (if needed):
```bash
npm run db:setup
```

5. Build the project (if using TypeScript):
```bash
npm run build
```

6. Start the server:
```bash
npm start
```

For production environments, consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "ecommerce-api" -- start
pm2 save
pm2 startup
```

## Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose installed (optional, for multi-container deployment)

### Single Container Deployment

1. Build the Docker image:
```bash
docker build -t ecommerce-api .
```

2. Run the container:
```bash
docker run -d -p 3000:3000 --name ecommerce-api \
  --env-file .env \
  ecommerce-api
```

### Docker Compose Deployment

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  api:
    build: .
    container_name: ecommerce-api
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:5.0
    container_name: ecommerce-mongo
    restart: always
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    ports:
      - "27017:27017"

  redis:
    image: redis:6.2-alpine
    container_name: ecommerce-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mongo-data:
  redis-data:
```

Then run:

```bash
docker-compose up -d
```

## Cloud Deployment

### AWS Elastic Beanstalk

1. Install the EB CLI:
```bash
pip install awsebcli
```

2. Initialize EB application:
```bash
eb init
```

3. Create an environment and deploy:
```bash
eb create production
```

4. For subsequent deployments:
```bash
eb deploy
```

### Heroku

1. Install Heroku CLI:
```bash
npm install -g heroku
```

2. Login to Heroku:
```bash
heroku login
```

3. Create a Heroku app:
```bash
heroku create your-app-name
```

4. Add MongoDB add-on:
```bash
heroku addons:create mongodb:hobby-dev
```

5. Configure environment variables:
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
# Add other environment variables
```

6. Deploy:
```bash
git push heroku main
```

### Digital Ocean App Platform

1. Create a new app on the Digital Ocean console
2. Connect your GitHub repository
3. Configure environment variables in the DO console
4. Deploy the app

## Database Setup and Migration

### Initial Setup

To initialize the database with starter data:

```bash
npm run db:seed
```

This will create:
- Admin user
- Basic product categories
- Sample products

### Database Migrations

To run database migrations:

```bash
npm run db:migrate
```

To create a new migration:

```bash
npm run db:create-migration migration_name
```

## SSL Configuration

For production environments, always use HTTPS. Here's how to set it up with Let's Encrypt and Nginx.

### Let's Encrypt with Nginx

1. Install Nginx and Certbot:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

2. Configure Nginx:
```
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Get SSL certificate:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

4. Certbot will automatically update the Nginx config to use SSL.

## Monitoring and Maintenance

### PM2 Monitoring

Basic monitoring with PM2:

```bash
pm2 monit
```

For web-based dashboard:

```bash
pm2 plus
```

### Application Logs

Logs are stored in:
- Standard deployment: `logs/` directory
- PM2 deployment: `~/.pm2/logs/`
- Docker deployment: View with `docker logs ecommerce-api`

### Database Backups

Scheduled MongoDB backups:

```bash
mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/$(date +%Y-%m-%d)
```

Set up a cron job to run this daily:

```
0 0 * * * mongodump --uri="mongodb://username:password@host:port/database" --out=/backup/$(date +%Y-%m-%d)
```

### Update Procedure

1. Pull the latest code:
```bash
git pull origin main
```

2. Install dependencies:
```bash
npm install --production
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Restart the service:
```bash
# With PM2
pm2 restart ecommerce-api

# With Docker
docker-compose down && docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Connection to MongoDB fails**
   - Check if MongoDB is running: `sudo systemctl status mongod`
   - Verify MongoDB connection string
   - Check network access and firewall settings

2. **Server won't start**
   - Check for syntax errors in code
   - Verify all environment variables are set
   - Check system resources (disk space, memory)

3. **File uploads not working**
   - Check upload directory permissions
   - Verify maximum file size settings
   - Check disk space

4. **High server load**
   - Check for memory leaks
   - Consider scaling horizontally
   - Implement or optimize caching strategies

### Support Resources

- [Documentation Website](https://docs.yourdomain.com)
- [GitHub Issues](https://github.com/yourusername/ecommerce-platform/issues)
- Email Support: support@yourdomain.com

## Performance Optimization

1. **Database Indexing**
   - Ensure appropriate indexes are created for frequently queried fields
   - Run `npm run db:optimize-indexes` to create recommended indexes

2. **Caching Strategy**
   - Enable Redis caching for products, categories, and other frequently accessed data
   - Configure cache TTL appropriately in `.env` file

3. **Load Balancing**
   - Use Nginx as a load balancer for multiple API instances
   - Configure sticky sessions if needed

4. **CDN Integration**
   - Configure CDN for serving static assets
   - Update `ASSET_URL` environment variable to point to CDN

## Security Hardening

1. **API Rate Limiting**
   - Configure rate limits in the `.env` file:
   ```
   RATE_LIMIT_WINDOW=15m
   RATE_LIMIT_MAX=100
   ```

2. **Security Headers**
   - The application uses Helmet.js for security headers
   - Custom headers can be configured in `server/config/security.js`

3. **Data Sanitization**
   - All inputs are sanitized to prevent injection attacks
   - Additional validation rules can be added in `server/validators/`

4. **Regular Security Audits**
   - Run `npm audit` regularly to check for vulnerable dependencies
   - Update dependencies with `npm update` 