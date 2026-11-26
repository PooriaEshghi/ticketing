import Head from 'next/head';
import '../styles/globals.css';
import buildClient from '../api/build-client';
import Header from '../components/header';

const AppComponent = ({ Component, pageProps, currentUser, stripePublishableKey }) => {
  if (typeof window !== 'undefined' && stripePublishableKey) {
    window.sessionStorage.setItem('footlight.stripeKey', stripePublishableKey);
  }

  return (
    <>
      <Head>
        <title>Footlight</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Footlight is a small ticketing desk for live shows. Reserve a seat, then pay before the hold expires."
        />
      </Head>
      <Header currentUser={currentUser} />
      <main className="shell">
        <Component
          currentUser={currentUser}
          stripePublishableKey={stripePublishableKey}
          {...pageProps}
        />
      </main>
    </>
  );
};

function readStripeKey() {
  if (typeof window === 'undefined') {
    return (
      process.env.STRIPE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
      ''
    );
  }
  try {
    return window.sessionStorage.getItem('footlight.stripeKey') || '';
  } catch (_err) {
    return '';
  }
}

AppComponent.getInitialProps = async (appContext) => {
  const client = buildClient(appContext.ctx);
  let currentUser = null;

  try {
    const { data } = await client.get('/api/users/currentuser');
    currentUser = data.currentUser || null;
  } catch (_err) {
    currentUser = null;
  }

  let pageProps = {};
  if (appContext.Component.getInitialProps) {
    pageProps = await appContext.Component.getInitialProps(
      appContext.ctx,
      client,
      currentUser
    );
  }

  return {
    pageProps,
    currentUser,
    stripePublishableKey: readStripeKey(),
  };
};

export default AppComponent;
