import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import { natsWrapper } from '../nats-wrapper';

export async function publishExpirationComplete(orderId: string) {
  await new ExpirationCompletePublisher(natsWrapper.client).publish({
    orderId,
  });
}
