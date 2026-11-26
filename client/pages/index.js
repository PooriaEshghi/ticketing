import Link from 'next/link';
import Empty from '../components/empty';
import { money } from '../lib/format';

const LandingPage = ({ currentUser, tickets, loadError }) => {
  if (loadError) {
    return (
      <Empty
        title="The board is unavailable"
        body="Tickets could not be loaded. Check that the tickets service is running, then refresh."
      />
    );
  }

  return (
    <section className="page">
      <div className="page-intro">
        <p className="eyebrow">Tonight&apos;s board</p>
        <h1>Find a seat before the house lights drop.</h1>
        <p className="lede">
          Footlight lists shows from independent sellers. A hold lasts fifteen minutes. Pay in that
          window or the seat goes back on the board.
        </p>
      </div>

      {tickets.length === 0 ? (
        <Empty
          title="No tickets yet"
          body={
            currentUser
              ? 'The board is empty. List the first show.'
              : 'Nobody is selling yet. Sign in when you have a seat to offer.'
          }
          href={currentUser ? '/tickets/new' : '/auth/signin'}
          action={currentUser ? 'Sell a ticket' : 'Sign in'}
        />
      ) : (
        <ul className="ticket-grid">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="ticket-card">
              <div>
                <p className="eyebrow">General admission</p>
                <h2>{ticket.title}</h2>
              </div>
              <div className="ticket-card-foot">
                <strong>{money(ticket.price)}</strong>
                <Link href="/tickets/[ticketId]" as={`/tickets/${ticket.id}`}>
                  Details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

LandingPage.getInitialProps = async (_context, client) => {
  try {
    const { data } = await client.get('/api/tickets');
    return { tickets: data, loadError: false };
  } catch (_err) {
    return { tickets: [], loadError: true };
  }
};

export default LandingPage;
