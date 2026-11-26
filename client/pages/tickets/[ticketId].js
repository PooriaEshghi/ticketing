import Router from 'next/router';
import Link from 'next/link';
import useRequest from '../../hooks/use-request';
import Empty from '../../components/empty';
import { money } from '../../lib/format';

const TicketShow = ({ ticket, currentUser, loadError }) => {
  const { doRequest, errors } = useRequest({
    url: '/api/orders',
    method: 'post',
    body: {
      ticketId: ticket?.id,
    },
    onSuccess: (order) => Router.push('/orders/[orderId]', `/orders/${order.id}`),
  });

  if (loadError || !ticket) {
    return (
      <Empty
        title="Ticket not found"
        body="That seat is gone, or the link is wrong."
        href="/"
        action="Back to the board"
      />
    );
  }

  return (
    <section className="page narrow">
      <Link className="back" href="/">
        All tickets
      </Link>
      <p className="eyebrow">Ticket</p>
      <h1>{ticket.title}</h1>
      <p className="price-line">{money(ticket.price)}</p>
      <p className="lede">
        Purchasing reserves this ticket for 15 minutes. You will land on an order page with a
        countdown and a test-mode card form.
      </p>
      {errors}
      {currentUser ? (
        <button type="button" className="button" onClick={() => doRequest()}>
          Reserve
        </button>
      ) : (
        <Link className="button" href="/auth/signin">
          Sign in to reserve
        </Link>
      )}
    </section>
  );
};

TicketShow.getInitialProps = async (context, client) => {
  try {
    const { ticketId } = context.query;
    const { data } = await client.get(`/api/tickets/${ticketId}`);
    return { ticket: data, loadError: false };
  } catch (_err) {
    return { ticket: null, loadError: true };
  }
};

export default TicketShow;
