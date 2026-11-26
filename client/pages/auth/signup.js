import { useState } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import useRequest from '../../hooks/use-request';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { doRequest, errors } = useRequest({
    url: '/api/users/signup',
    method: 'post',
    body: { email, password },
    onSuccess: () => Router.push('/'),
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    await doRequest();
  };

  return (
    <section className="page narrow">
      <p className="eyebrow">Account</p>
      <h1>Create an account</h1>
      <p className="lede">Password must be between 4 and 20 characters.</p>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={4}
            maxLength={20}
            required
          />
        </label>
        {errors}
        <button className="button" type="submit">
          Sign up
        </button>
      </form>
      <p className="form-note">
        Already registered? <Link href="/auth/signin">Sign in</Link>
      </p>
    </section>
  );
}
