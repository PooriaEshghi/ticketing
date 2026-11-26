import { useEffect, useState } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import useRequest from '../../hooks/use-request';
import Empty from '../../components/empty';
import { formatCountdown, money, orderStatusLabel } from '../../lib/format';

const cardStyle = {
  style: {
    base: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#1a140f',
      '::placeholder': { color: '#8a7b6d' },
    },
    invalid: { color: '#9c3b2e' },
  },
};

const CheckoutForm = ({ order, doRequest, errors }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setSubmitting(true);
    setCardError('');
    const card = elements.getElement(CardElement);
    const { error, token } = await stripe.createToken(card);
    if (error || !token) {
      setCardError(error?.message || 'The card could not be tokenized.');
      setSubmitting(false);
      return;
    }
    await doRequest({ token: token.id });
    setSubmitting(false);
  };

  return (
    <form className="pay-form" onSubmit={onSubmit}>
      <CardElement options={cardStyle} />
      {cardError ? (
        <div className="alert" role="alert">
          <h4>Card error</h4>
          <ul>
            <li>{cardError}</li>
          </ul>
        </div>
      ) : null}
      {errors}
      <button className="button" type="submit" disabled={!stripe || submitting}>
        {submitting ? 'Sending…' : `Pay ${money(order.ticket.price)}`}
      </button>
    </form>
  );
};

const OrderShow = ({ order, loadError, stripePublishableKey }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [stripePromise, setStripePromise] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: { orderId: order?.id },
    onSuccess: () => Router.push('/orders'),
  });

  useEffect(() => {
    if (!order?.expiresAt) {
      return undefined;
    }
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, Math.round(msLeft / 1000)));
    };
    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);
    return () => clearInterval(timerId);
  }, [order]);

  useEffect(() => {
    if (stripePublishableKey) {
      setStripePromise(loadStripe(stripePublishableKey));
    }
  }, [stripePublishableKey]);

  if (loadError || !order) {
    return (
      <Empty
        title="Order not found"
        body="It may belong to another account, or the link is stale."
        href="/orders"
        action="My orders"
      />
    );
  }

  const cancelOrder = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      await axios.delete(`/api/orders/${order.id}`);
      Router.push('/orders');
    } catch (err) {
      const message = err.response?.data?.errors?.[0]?.message || 'Could not cancel the order.';
      setCancelError(message);
      setCancelling(false);
    }
  };

  if (order.status === 'complete') {
    return (
      <section className="page narrow">
        <p className="eyebrow">Order</p>
        <h1>{order.ticket.title}</h1>
        <p className="status status-complete">Paid</p>
        <p className="lede">This seat is yours. Stripe test mode recorded the charge.</p>
        <Link className="button secondary" href="/orders">
          All orders
        </Link>
      </section>
    );
  }

  if (order.status === 'cancelled' || timeLeft <= 0) {
    return (
      <section className="page narrow">
        <p className="eyebrow">Order</p>
        <h1>{order.ticket?.title || 'Order'}</h1>
        <p className="status status-cancelled">
          {order.status === 'cancelled' ? orderStatusLabel('cancelled') : 'Expired'}
        </p>
        <p className="lede">
          {order.status === 'cancelled'
            ? 'This reservation was cancelled and the ticket is free for someone else.'
            : 'The fifteen-minute hold ran out before payment. The ticket is back on the board.'}
        </p>
        <Link className="button" href="/">
          Back to the board
        </Link>
      </section>
    );
  }

  return (
    <section className="page pay-layout">
      <div>
        <Link className="back" href="/orders">
          All orders
        </Link>
        <p className="eyebrow">Hold</p>
        <h1>{order.ticket.title}</h1>
        <p className="price-line">{money(order.ticket.price)}</p>
        <p className={`countdown ${timeLeft < 60 ? 'countdown-late' : ''}`}>
          <span>Time left to pay</span>
          <strong>{formatCountdown(timeLeft)}</strong>
        </p>
        <button
          type="button"
          className="text-button"
          onClick={cancelOrder}
          disabled={cancelling}
        >
          {cancelling ? 'Cancelling…' : 'Release this hold'}
        </button>
        {cancelError ? <p className="form-note">{cancelError}</p> : null}
      </div>
      <div className="pay-panel">
        <h2>Pay with a test card</h2>
        <p>
          Stripe is in test mode. Use <code>4242 4242 4242 4242</code>, any future expiry, any CVC
          and any postal code. No real charge is created.
        </p>
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <CheckoutForm order={order} doRequest={doRequest} errors={errors} />
          </Elements>
        ) : (
          <div className="alert" role="alert">
            <h4>Stripe is not configured</h4>
            <ul>
              <li>Set STRIPE_PUBLISHABLE_KEY to a pk_test value and reload.</li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  try {
    const { orderId } = context.query;
    const { data } = await client.get(`/api/orders/${orderId}`);
    return { order: data, loadError: false };
  } catch (_err) {
    return { order: null, loadError: true };
  }
};

export default OrderShow;
