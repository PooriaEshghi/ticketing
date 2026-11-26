import Link from 'next/link';
import Empty from '../../components/empty';
import { money, orderStatusLabel } from '../../lib/format';

const OrderIndex = ({ currentUser, orders, loadError }) => {
  if (!currentUser) {
    return (
      <Empty
        title="Sign in to see orders"
        body="Your reservations are tied to your account."
        href="/auth/signin"
        action="Sign in"
      />
    );
  }

  if (loadError) {
    return (
      <Empty
        title="Orders are unavailable"
        body="The orders service did not respond. Refresh in a moment."
      />
    );
  }

  if (!orders.length) {
    return (
      <Empty
        title="No orders yet"
        body="Reserve a ticket from the board. It will show up here with its status."
        href="/"
        action="Browse tickets"
      />
    );
  }

  return (
    <section className="page">
      <div className="page-intro">
        <p className="eyebrow">Your desk</p>
        <h1>Orders</h1>
      </div>
      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id}>
            <div>
              <h2>{order.ticket?.title || 'Ticket'}</h2>
              <p>{order.ticket ? money(order.ticket.price) : ''}</p>
            </div>
            <div className="order-list-meta">
              <span className={`status status-${order.status}`}>{orderStatusLabel(order.status)}</span>
              <Link href="/orders/[orderId]" as={`/orders/${order.id}`}>
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

OrderIndex.getInitialProps = async (_context, client, currentUser) => {
  if (!currentUser) {
    return { orders: [], loadError: false };
  }
  try {
    const { data } = await client.get('/api/orders');
    return { orders: data, loadError: false };
  } catch (_err) {
    return { orders: [], loadError: true };
  }
};

export default OrderIndex;
