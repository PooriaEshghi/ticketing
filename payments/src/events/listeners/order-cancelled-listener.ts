import {
  OrderCancelledEvent,
  Subjects,
  Listener,
  OrderStatus,
} from '@petickets/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Order } from '../../models/order';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    // A cancel published with version 0 can never match version -1.
    const order =
      data.version > 0
        ? await Order.findOne({
            _id: data.id,
            version: data.version - 1,
          })
        : await Order.findById(data.id);

    if (!order) {
      throw new Error('Order not found');
    }

    order.set({ status: OrderStatus.Cancelled });
    await order.save();

    msg.ack();
  }
}
