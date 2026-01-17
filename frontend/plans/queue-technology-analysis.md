# Queue Technology Analysis

## Overview

This document provides a detailed comparison of queue technology options for the headless export server job queue system.

## Options Comparison

### 1. BullMQ (Redis-based)

**Description**: BullMQ is a Redis-based queue for Node.js, built on top of Redis Streams.

#### Pros
- **Native Node.js**: Built specifically for Node.js applications
- **Rich Feature Set**: Job priorities, delays, retries, rate limiting, backoff strategies
- **Real-time Monitoring**: Built-in UI (Bull Board) for job inspection
- **Low Latency**: In-memory Redis provides sub-millisecond job processing
- **Self-hosted**: Full control over infrastructure
- **Cost Effective**: Redis is lightweight and inexpensive
- **Developer Experience**: Excellent TypeScript support, intuitive API

#### Cons
- **Redis Dependency**: Requires Redis infrastructure management
- **Scaling Complexity**: Horizontal scaling requires Redis Cluster
- **Persistence**: Redis persistence configuration needed for durability
- **Memory Usage**: All job data stored in memory (can be mitigated with Redis persistence)

#### Technical Specifications
```typescript
// Example BullMQ Queue Setup
import { Queue, Worker } from 'bullmq';

const queue = new Queue('exports', {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

const worker = new Worker('exports', async (job) => {
  return await renderExport(job.data);
}, {
  connection: { host: process.env.REDIS_HOST, port: 6379 },
  concurrency: 5, // Process 5 jobs concurrently
});
```

#### Cost Estimate
- Redis (managed): $15-50/month (AWS ElastiCache, GCP Memorystore)
- Self-hosted: $5-20/month (small instance)

---

### 2. Google Cloud Tasks

**Description**: Fully managed task queue service by Google Cloud Platform.

#### Pros
- **Fully Managed**: No infrastructure to maintain
- **Auto-scaling**: Automatically scales based on queue depth
- **High Availability**: Built-in redundancy and failover
- **Integration**: Native GCP integration (Cloud Functions, Cloud Run)
- **Security**: IAM-based access control
- **Monitoring**: Built-in Cloud Monitoring integration

#### Cons
- **Vendor Lock-in**: Tied to Google Cloud Platform
- **Latency**: Higher latency than in-memory Redis
- **Complexity**: More complex setup for custom workers
- **Cost**: Can be expensive at scale
- **Limited Features**: Fewer features than BullMQ (no built-in UI)

#### Technical Specifications
```typescript
// Example Cloud Tasks Setup
import { CloudTasksClient } from '@google-cloud/tasks';

const client = new CloudTasksClient();

async function createExportJob(config: PosterConfig) {
  const parent = client.queuePath(
    process.env.GCP_PROJECT_ID,
    process.env.GCP_LOCATION,
    'export-queue'
  );

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: 'https://export-service.example.com/render',
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify(config)).toString('base64'),
    },
    scheduleTime: { seconds: Math.floor(Date.now() / 1000) + 60 },
  };

  const [response] = await client.createTask({ parent, task });
  return response.name;
}
```

#### Cost Estimate
- Task execution: $0.40 per million tasks
- Storage: $0.01 per GB-month
- Network: Standard GCP egress rates
- **Estimated monthly cost**: $50-200 for 10,000-100,000 tasks

---

### 3. Amazon SQS (Simple Queue Service)

**Description**: Fully managed message queue service by AWS.

#### Pros
- **Fully Managed**: No infrastructure to maintain
- **Highly Scalable**: Virtually unlimited throughput
- **High Availability**: Built-in redundancy across AZs
- **Integration**: Native AWS integration (Lambda, ECS, Fargate)
- **Security**: IAM-based access control, VPC support
- **Mature**: Battle-tested, extensive documentation

#### Cons
- **Vendor Lock-in**: Tied to AWS
- **Latency**: Higher latency than in-memory Redis
- **Limited Features**: No built-in delays, priorities, or retries (must implement)
- **Complexity**: Requires additional services for advanced features
- **Cost**: Can be expensive at scale

#### Technical Specifications
```typescript
// Example SQS Setup
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const client = new SQSClient({ region: 'us-east-1' });

async function createExportJob(config: PosterConfig) {
  const command = new SendMessageCommand({
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(config),
    DelaySeconds: 0,
    MessageAttributes: {
      Priority: { DataType: 'String', StringValue: 'normal' },
    },
  });

  const response = await client.send(command);
  return response.MessageId;
}
```

#### Cost Estimate
- Standard queue: $0.40 per million requests
- Long polling: $0.25 per million requests
- Data transfer: Standard AWS rates
- **Estimated monthly cost**: $40-150 for 10,000-100,000 messages

---

## Comparison Matrix

| Feature | BullMQ | Cloud Tasks | SQS |
|---------|--------|-------------|-----|
| **Infrastructure** | Self-hosted Redis | Fully managed | Fully managed |
| **Latency** | < 1ms | 10-100ms | 10-100ms |
| **Setup Complexity** | Low | Medium | Medium |
| **Maintenance** | Medium | Low | Low |
| **Vendor Lock-in** | None | High (GCP) | High (AWS) |
| **Job Priorities** | ✅ Native | ✅ Native | ❌ Custom |
| **Delays** | ✅ Native | ✅ Native | ❌ Custom |
| **Retries** | ✅ Native | ✅ Native | ❌ Custom |
| **Rate Limiting** | ✅ Native | ✅ Native | ❌ Custom |
| **Monitoring UI** | ✅ Bull Board | ❌ Custom | ❌ Custom |
| **Auto-scaling** | ❌ Custom | ✅ Native | ❌ Custom |
| **Cost (10k jobs)** | $15-50 | $50-100 | $40-80 |
| **Cost (100k jobs)** | $15-50 | $100-200 | $80-150 |
| **TypeScript Support** | ✅ Excellent | ✅ Good | ✅ Good |

---

## Recommendation

### Primary Recommendation: **BullMQ**

**Rationale**:

1. **Best Fit for Use Case**: The export service is a Node.js application, and BullMQ is built specifically for Node.js with excellent TypeScript support.

2. **Feature Richness**: Native support for all required features:
   - Job priorities (high-priority for API requests)
   - Exponential backoff retries
   - Rate limiting (prevent overwhelming the browser pool)
   - Job delays (schedule exports for off-peak times)

3. **Performance**: Sub-millisecond latency ensures minimal delay between job submission and processing.

4. **Cost Effective**: Redis is lightweight and inexpensive, even at scale.

5. **Developer Experience**: Built-in monitoring UI (Bull Board) for job inspection and debugging.

6. **Flexibility**: Self-hosted Redis allows for custom configurations and optimizations.

### Alternative: **Cloud Tasks** (if using GCP)

**Use Case**: If the entire infrastructure is already on Google Cloud Platform, Cloud Tasks provides a fully managed solution with excellent integration.

### Alternative: **SQS** (if using AWS)

**Use Case**: If the entire infrastructure is already on AWS, SQS provides a mature, battle-tested solution with excellent integration.

---

## Implementation Plan for BullMQ

### Phase 1: Setup (Week 1)
1. Deploy Redis instance (managed or self-hosted)
2. Install BullMQ dependencies
3. Set up basic queue and worker
4. Configure Bull Board for monitoring

### Phase 2: Integration (Week 2)
1. Integrate queue with export API
2. Implement job schema and validation
3. Add error handling and retry logic
4. Set up job priorities

### Phase 3: Production (Week 3)
1. Configure Redis persistence
2. Set up Redis Cluster for high availability
3. Implement monitoring and alerting
4. Load testing and optimization

### Configuration Example

```typescript
// queue-config.ts
export const queueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
      count: 5000, // Keep last 5000 jobs
    },
  },
  limiter: {
    max: 10, // Max 10 jobs per window
    duration: 1000, // Per second
  },
};
```

---

## Monitoring and Observability

### Bull Board
- Web UI for job inspection
- Real-time queue statistics
- Job retry and requeue capabilities
- Failed job analysis

### Metrics to Track
- Queue depth (pending jobs)
- Processing rate (jobs/second)
- Average wait time
- Failure rate
- Retry rate
- Worker utilization

### Alerting
- Queue depth > threshold
- Failure rate > 5%
- Worker not processing jobs
- Redis connection issues

---

## Conclusion

**BullMQ** is the recommended choice for the headless export server due to its:
- Native Node.js and TypeScript support
- Rich feature set matching all requirements
- Excellent performance and cost efficiency
- Developer-friendly tooling and monitoring

The self-hosted Redis requirement is a minor trade-off compared to the benefits of control, performance, and feature completeness.

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-17  
**Recommendation**: BullMQ (Primary), Cloud Tasks (GCP), SQS (AWS)
