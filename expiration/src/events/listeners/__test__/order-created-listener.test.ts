import { Message } from 'node-nats-streaming';
import { OrderCreatedEvent, OrderStatus } from '@petickets/common';
import { OrderCreatedListener } from '../order-created-listener';
import { getExpirationQueue } from '../../../queues/expiration-queue';

jest.mock('../../../queues/expiration-queue', () => ({
  getExpirationQueue: jest.fn(),
}));

const setup = () => {
  const add = jest.fn().mockResolvedValue(undefined);
  (getExpirationQueue as jest.Mock).mockReturnValue({ add });

  const listener = new OrderCreatedListener({} as never);
  const expiresAt = new Date(Date.now() + 10_000).toISOString();
  const data: OrderCreatedEvent['data'] = {
    id: 'order-id',
    version: 0,
    expiresAt,
    userId: 'user-id',
    status: OrderStatus.Created,
    ticket: {
      id: 'ticket-id',
      price: 20,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, add };
};

it('enqueues an expiration job for the order', async () => {
  const { listener, data, msg, add } = setup();

  await listener.onMessage(data, msg);

  expect(add).toHaveBeenCalled();
  const payload = add.mock.calls[0][0];
  const options = add.mock.calls[0][1];
  expect(payload).toEqual({ orderId: data.id });
  expect(options.delay).toBeGreaterThan(8_000);
  expect(options.delay).toBeLessThan(12_000);
});

it('acks the message', async () => {
  const { listener, data, msg } = setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
