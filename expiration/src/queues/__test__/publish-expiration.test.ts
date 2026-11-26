import { publishExpirationComplete } from '../publish-expiration';
import { natsWrapper } from '../../nats-wrapper';

it('publishes expiration:complete for the order', async () => {
  await publishExpirationComplete('order-id');

  expect(natsWrapper.client.publish).toHaveBeenCalled();
  const mock = natsWrapper.client.publish as jest.Mock;
  const subject = mock.mock.calls[0][0];
  const payload = JSON.parse(mock.mock.calls[0][1]);

  expect(subject).toEqual('expiration:complete');
  expect(payload).toEqual({ orderId: 'order-id' });
});
