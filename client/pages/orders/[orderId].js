import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: { orderId: order?.id },
    onSuccess: () => Router.push('/orders'),
  });

  useEffect(() => {
    if (!order) return; // Prevents crashes if order is undefined

    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.max(0, Math.round(msLeft / 1000))); // Prevents negative values
    };

    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);

    return () => clearInterval(timerId);
  }, [order]);

  if (!order) {
    return <div>Order not found</div>; // Better handling if order is null
  }

  if (timeLeft <= 0) {
    return <div>Order Expired</div>;
  }

  const handleToken = ({ id }) => {
    doRequest({ token: id });
  };

  return (
    <div>
      <h2>Time left to pay: {timeLeft} seconds</h2>
      <StripeCheckout
        token={handleToken}
        stripeKey='pk_test_51PYp7qRpB4DKHl9a8HEZqB6yTw3DRPdQU6bs5jwci9iJOGRaaiNjtNPS06u9GIuadJ9cYxOz35aJTxXvyX0Ufrss00TMfhUhx5'
        amount={order.ticket.price * 100}
        email={currentUser.email}
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  try {
    const { orderId } = context.query;
    const { data } = await client.get(`/api/orders/${orderId}`);
    return { order: data };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { order: null };
  }
};

export default OrderShow;
