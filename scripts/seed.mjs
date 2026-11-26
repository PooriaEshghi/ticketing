const base = process.env.SEED_BASE_URL || 'http://localhost';
const email = process.env.SEED_EMAIL || 'demo@footlight.app';
const password = process.env.SEED_PASSWORD || 'password';

const samples = [
  { title: 'Footlight Gala', price: 45 },
  { title: 'North Pier Jazz', price: 28 },
  { title: 'Late Show Improv', price: 15 },
  { title: 'River Opera', price: 62 },
];

async function request(path, { method = 'GET', body, cookie } = {}) {
  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = response.headers.get('set-cookie');
  const nextCookie = setCookie ? setCookie.split(';')[0] : cookie;
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = text;
    }
  }
  return { status: response.status, data, cookie: nextCookie };
}

async function signIn() {
  let result = await request('/api/users/signup', {
    method: 'POST',
    body: { email, password },
  });

  if (result.status === 400) {
    result = await request('/api/users/signin', {
      method: 'POST',
      body: { email, password },
    });
  }

  if (!result.cookie || (result.status !== 200 && result.status !== 201)) {
    throw new Error(`Could not authenticate demo user (${result.status})`);
  }

  console.log(`Signed in as ${email}`);
  return result.cookie;
}

async function main() {
  const cookie = await signIn();
  const existing = await request('/api/tickets', { cookie });
  if (existing.status !== 200 || !Array.isArray(existing.data)) {
    throw new Error(`Could not list tickets (${existing.status})`);
  }
  if (existing.data.length > 0) {
    console.log(`Board already has ${existing.data.length} ticket(s). Nothing to seed.`);
    return;
  }

  for (const ticket of samples) {
    const created = await request('/api/tickets', {
      method: 'POST',
      body: ticket,
      cookie,
    });
    if (created.status !== 201) {
      throw new Error(`Could not create "${ticket.title}" (${created.status})`);
    }
    console.log(`Created ${ticket.title} at $${ticket.price}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
