const { test } = require('node:test');
const assert = require('node:assert/strict');
const { migrate } = require('../scripts/migrate');

function database({ fail = false, history = [] } = {}) {
  const pending = [];
  const commands = [];
  return { commands, history, async query(sql, values) {
    commands.push(sql);
    if (sql.startsWith('SELECT name')) return { rows: history.map(row => ({ ...row })) };
    if (sql.startsWith('INSERT INTO public.schema_migrations')) pending.push({ name: values[0], checksum: values[1] });
    if (fail && sql.includes('CREATE TABLE public.users')) throw new Error('simulated SQL error');
    if (sql === 'COMMIT') history.push(...pending.splice(0));
    if (sql === 'ROLLBACK') pending.splice(0);
    return { rows: [] };
  } };
}

test('migration runner applies ordered files, records checksums, and skips unchanged history', async () => {
  const client = database();
  assert.equal(await migrate(client), 5);
  assert.deepEqual(client.history.map(row => row.name),
    ['001_faculties_majors.sql', '002_users.sql', '003_posts.sql', '004_media.sql', '005_post_images.sql']);
  assert.ok(client.history.every(row => /^[a-f0-9]{64}$/.test(row.checksum)));
  assert.equal(await migrate(client), 0);
});

test('migration failure rolls back the entire pending batch', async () => {
  const client = database({ fail: true });
  await assert.rejects(migrate(client), /simulated SQL error/);
  assert.equal(client.commands.at(-1), 'ROLLBACK');
  assert.ok(!client.commands.includes('COMMIT'));
  assert.deepEqual(client.history, []);
});

test('edited or missing migration history is rejected before applying SQL', async () => {
  const client = database({ history: [{ name: '001_faculties_majors.sql', checksum: 'edited' }] });
  await assert.rejects(migrate(client), /history mismatch/);
  assert.ok(!client.commands.some(sql => sql.includes('CREATE TABLE public.faculties')));
  assert.equal(client.commands.at(-1), 'ROLLBACK');
});
