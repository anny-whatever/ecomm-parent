# Performance Optimization Guide

This document outlines performance optimization strategies and best practices for the e-commerce platform.

## Performance Metrics

Key performance metrics we monitor and optimize for:

1. **Response Time**: The time taken to process a request and return a response
2. **Throughput**: Number of requests the system can handle per second
3. **Resource Utilization**: CPU, memory, and network usage
4. **Database Performance**: Query execution time and database load
5. **Time to First Byte (TTFB)**: Time until the first byte of response is received
6. **Load Testing Results**: Performance under various loads

## Database Optimization

### MongoDB Indexing

Proper indexing is critical for query performance. Indexes have been created for:

```javascript
// Examples of critical indexes
db.products.createIndex({ name: 1 });
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ category: 1 });
db.products.createIndex({ "price.effective": 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ featured: 1, "price.effective": 1 });
db.products.createIndex({ tags: 1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "profile.firstName": 1, "profile.lastName": 1 });

db.orders.createIndex({ user: 1, createdAt: -1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ "payment.status": 1 });

db.reviews.createIndex({ product: 1, status: 1, createdAt: -1 });
db.reviews.createIndex({ user: 1 });
```

### Query Optimization

Best practices for writing efficient MongoDB queries:

1. **Project Only Needed Fields**:
```javascript
// Instead of
const product = await Product.findById(productId);

// Use
const product = await Product.findById(productId).select('name price images');
```

2. **Use Pagination**:
```javascript
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const products = await Product.find(query)
  .sort(sortOption)
  .skip(skip)
  .limit(limit);
```

3. **Optimize Aggregation Pipelines**:
```javascript
// Add $match stages early to reduce documents flowing through pipeline
const result = await Order.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$user', totalSpent: { $sum: '$total' } } },
  { $sort: { totalSpent: -1 } },
  { $limit: 100 }
]);
```

### Database Connection Management

- Connection pooling is configured with appropriate pool size
- Mongoose connections are reused across requests
- Connection health monitoring is implemented

## Caching Strategy

### Redis Caching

We use Redis for caching frequently accessed data:

1. **Product Catalog Caching**:
```javascript
// Get products with Redis caching
async function getProducts(query, options) {
  const cacheKey = `products:${JSON.stringify(query)}:${JSON.stringify(options)}`;
  
  // Try to get from cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  // If not in cache, fetch from database
  const products = await Product.find(query, {}, options);
  
  // Store in cache with expiration
  await redisClient.set(cacheKey, JSON.stringify(products), 'EX', 3600); // 1 hour
  
  return products;
}
```

2. **User Session Caching**:
```javascript
// Store user sessions in Redis
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### Cache Invalidation

Strategies for keeping cache data fresh:

1. **Time-based Expiration**: All cached items have an expiration time
2. **Event-based Invalidation**: Cache is invalidated when data changes
3. **Selective Cache Updates**: Only update affected cache entries

Example of event-based cache invalidation:

```javascript
// When a product is updated
async function updateProduct(productId, updateData) {
  // Update in database
  const product = await Product.findByIdAndUpdate(productId, updateData, { new: true });
  
  // Invalidate specific product cache
  await redisClient.del(`product:${productId}`);
  
  // Invalidate product listing caches
  const keys = await redisClient.keys('products:*');
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
  
  return product;
}
```

## API Optimization

### Response Compression

Responses are compressed to reduce network transfer time:

```javascript
const compression = require('compression');

// Enable compression for all responses
app.use(compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  // Don't compress responses for these mime types
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### Response Payload Optimization

Strategies to minimize response payload size:

1. **Selective Field Projection**: Only return needed fields
2. **Pagination**: Limit number of results returned
3. **Nested Data Limiting**: Control depth of nested objects
4. **Versioned API Responses**: Allow clients to request minimal versions

Example of field selection in API:

```javascript
router.get('/products', async (req, res) => {
  const { fields } = req.query;
  let select = '';
  
  if (fields) {
    select = fields.split(',').join(' ');
  }
  
  const products = await Product.find({})
    .select(select || 'name price images.thumbnail slug')
    .limit(20);
    
  res.json({ success: true, data: { products } });
});
```

## Code Optimization

### Asynchronous Processing

Heavy tasks are processed asynchronously:

1. **Email Sending**:
```javascript
// Instead of sending emails synchronously
function sendOrderConfirmation(order) {
  // Queue email sending task
  emailQueue.add('orderConfirmation', { 
    orderId: order._id,
    email: order.customer.email 
  }, { 
    attempts: 3,
    backoff: 5000
  });
  
  return { success: true };
}
```

2. **Report Generation**:
```javascript
// Queue a long-running report
function generateSalesReport(dateRange, format) {
  const jobId = `report-${Date.now()}`;
  
  reportQueue.add('salesReport', { 
    dateRange,
    format,
    jobId
  });
  
  return { 
    success: true, 
    message: 'Report generation started',
    jobId
  };
}
```

### Efficient Data Processing

Strategies for optimizing data processing:

1. **Batch Processing**:
```javascript
// Instead of updating items one by one
async function updateProductPrices(products) {
  const operations = products.map(product => ({
    updateOne: {
      filter: { _id: product.id },
      update: { $set: { "price.effective": product.newPrice } }
    }
  }));
  
  return await Product.bulkWrite(operations);
}
```

2. **Data Streaming**:
```javascript
// Stream large files instead of loading into memory
function exportOrdersCsv(res, query) {
  const cursor = Order.find(query).cursor();
  const csvStream = csv.format({ headers: true });
  
  csvStream.pipe(res);
  
  cursor.on('data', (order) => {
    csvStream.write({
      orderNumber: order.orderNumber,
      customer: order.customer.email,
      total: order.total,
      status: order.status,
      date: order.createdAt
    });
  });
  
  cursor.on('end', () => {
    csvStream.end();
  });
}
```

## Load Balancing and Scaling

### Horizontal Scaling

The application is designed for horizontal scaling:

1. **Stateless Architecture**: No local server state
2. **Shared Session Store**: Sessions stored in Redis
3. **Distributed File Storage**: Files stored in S3-compatible storage
4. **Database Connection Pooling**: Efficient database connections

### Load Balancer Configuration

Example Nginx load balancer configuration:

```nginx
upstream api_servers {
    least_conn;
    server api1.example.com:3000;
    server api2.example.com:3000;
    server api3.example.com:3000;
}

server {
    listen 80;
    server_name api.example.com;
    
    location / {
        proxy_pass http://api_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Content Delivery Optimization

### CDN Integration

Static assets are served via CDN:

1. **Images**: Product and user images served from CDN
2. **Static Files**: CSS, JavaScript, and other static files
3. **Generated PDFs**: Invoices and reports served via CDN

CDN configuration in application:

```javascript
// Environment variables for asset URLs
const imageBaseUrl = process.env.IMAGE_CDN_URL || '/uploads';

// When returning product data
function formatProduct(product) {
  return {
    ...product,
    images: product.images.map(image => ({
      ...image,
      url: `${imageBaseUrl}/${image.path}`
    }))
  };
}
```

### Image Optimization

Images are optimized for web delivery:

1. **Automatic Resizing**: Multiple sizes generated for responsive display
2. **Format Conversion**: WebP and AVIF formats for supported browsers
3. **Lazy Loading**: Images loaded only when needed
4. **Compression**: Optimal compression for quality vs. size

Example of image processing middleware:

```javascript
// See server/src/middleware/imageProcessor.middleware.js for implementation
```

## Memory Management

### Memory Leak Prevention

Strategies to prevent memory leaks:

1. **Proper Closure Management**: Avoid holding references unnecessarily
2. **Stream Processing**: Use streams for large data processing
3. **Memory Monitoring**: Track memory usage in production
4. **Regular Process Recycling**: Restart processes periodically

### Garbage Collection Optimization

Node.js garbage collection tuning:

```bash
# Start Node.js with optimized garbage collection
NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size --gc-interval=100" npm start
```

## Performance Monitoring

### APM Setup

Application Performance Monitoring with New Relic or similar:

```javascript
// Initialize APM agent
require('newrelic');

// Or use custom performance tracking
const { performance } = require('perf_hooks');

function trackEndpoint(req, res, next) {
  const start = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - start;
    logger.info({
      type: 'api_performance',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Math.round(duration),
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0
    });
  });
  
  next();
}

app.use(trackEndpoint);
```

### Custom Metrics

Key metrics we track:

1. **Endpoint Response Times**: Per API endpoint
2. **Database Query Times**: Slow query monitoring
3. **External Service Calls**: API calls to payment gateways, etc.
4. **Error Rates**: Tracking of API and database errors
5. **Queue Processing Times**: Time to process background jobs

## Testing and Benchmarking

### Load Testing

Load testing is performed using k6:

```javascript
// k6 load test script example
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '3m', target: 50 }, // Stay at 50 users
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_duration{staticAsset:true}': ['p(95)<100'], // 95% of static asset requests must complete below 100ms
    'http_req_duration{staticAsset:false}': ['p(95)<1000'], // 95% of API requests must complete below 1s
  },
};

export default function() {
  // Test homepage
  let res = http.get('https://ecommerce.example.com/', {
    tags: { staticAsset: false },
  });
  check(res, { 'homepage status was 200': (r) => r.status == 200 });
  sleep(1);
  
  // Test product API
  res = http.get('https://api.ecommerce.example.com/api/v1/products?limit=20', {
    tags: { staticAsset: false },
  });
  check(res, { 'products API status was 200': (r) => r.status == 200 });
  sleep(2);
  
  // Test static asset
  res = http.get('https://static.ecommerce.example.com/images/logo.png', {
    tags: { staticAsset: true },
  });
  check(res, { 'static asset status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

### Performance Benchmarks

Baseline performance benchmarks:

| Endpoint | Expected Response Time | Max Load (req/s) |
|----------|------------------------|------------------|
| GET /products | < 200ms | 500 |
| GET /products/:id | < 100ms | 1000 |
| POST /cart | < 300ms | 200 |
| GET /user/profile | < 150ms | 300 |
| POST /orders | < 500ms | 50 |
| GET /search | < 500ms | 100 |

## Best Practices Checklist

Before deployment, ensure these performance optimizations are implemented:

- [ ] Database indexes created for common queries
- [ ] Response compression enabled
- [ ] Redis caching configured
- [ ] Image optimization middleware active
- [ ] Pagination implemented for all list endpoints
- [ ] Heavy processing moved to background jobs
- [ ] Memory usage optimized and monitored
- [ ] Load testing performed and passing
- [ ] CDN integration for static assets
- [ ] Performance monitoring set up

## Additional Resources

- [Node.js Performance Guide](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/core/query-optimization/)
- [Redis Caching Best Practices](https://redis.io/topics/client-side-caching)
- [Web Performance Best Practices](https://web.dev/performance-scoring/)
- [Nginx Load Balancing Documentation](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/) 