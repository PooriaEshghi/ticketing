const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('the client no longer uses the old product name or checkout widget', () => {
  const header = fs.readFileSync(path.join(root, 'components', 'header.js'), 'utf8');
  const order = fs.readFileSync(path.join(root, 'pages', 'orders', '[orderId].js'), 'utf8');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  assert.equal(header.includes('GitTix'), false);
  assert.equal(header.includes('Footlight'), true);
  assert.equal(order.includes('react-stripe-checkout'), false);
  assert.equal(order.includes('@stripe/react-stripe-js'), true);
  assert.equal(order.includes('4242 4242 4242 4242'), true);
  assert.equal(pkg.dependencies['react-stripe-checkout'], undefined);
});
