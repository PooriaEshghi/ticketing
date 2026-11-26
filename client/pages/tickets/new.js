import { useState } from 'react';
import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const NewTicket = ({ currentUser }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const { doRequest, errors } = useRequest({
    url: '/api/tickets',
    method: 'post',
    body: {
      title,
      price,
    },
    onSuccess: () => Router.push('/'),
  });

  const onSubmit = (event) => {
    event.preventDefault();
    doRequest();
  };

  const onBlur = () => {
    const value = parseFloat(price);
    if (Number.isNaN(value)) {
      return;
    }
    setPrice(value.toFixed(2));
  };

  if (!currentUser) {
    return (
      <section className="page narrow">
        <h1>Sign in to sell</h1>
        <p className="lede">Listing a ticket requires an account.</p>
        <a className="button" href="/auth/signin">
          Sign in
        </a>
      </section>
    );
  }

  return (
    <section className="page narrow">
      <p className="eyebrow">Seller</p>
      <h1>List a ticket</h1>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label>
          Price in USD
          <input
            value={price}
            onBlur={onBlur}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            required
          />
        </label>
        {errors}
        <button className="button" type="submit">
          Publish
        </button>
      </form>
    </section>
  );
};

export default NewTicket;
