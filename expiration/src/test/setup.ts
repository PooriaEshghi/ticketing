jest.mock('../nats-wrapper');

process.env.NATS_CLIENT_ID = 'expiration-test';
process.env.NATS_URL = 'http://localhost:4222';
process.env.NATS_CLUSTER_ID = 'footlight';
process.env.REDIS_HOST = 'localhost';
