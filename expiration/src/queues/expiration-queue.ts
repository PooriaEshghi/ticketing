import Queue from 'bull';
import Redis from 'ioredis';
import { publishExpirationComplete } from './publish-expiration';

interface Payload {
  orderId: string;
}

function createRedisClient() {
  return new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

let expirationQueue: Queue.Queue<Payload> | undefined;

export function getExpirationQueue() {
  if (!process.env.REDIS_HOST) {
    throw new Error('REDIS_HOST must be defined');
  }

  if (!expirationQueue) {
    expirationQueue = new Queue<Payload>('order:expiration', {
      createClient: () => createRedisClient(),
    });

    expirationQueue.process(async (job) => {
      await publishExpirationComplete(job.data.orderId);
    });
  }

  return expirationQueue;
}
