import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import cds from '@sap/cds';
import path from 'node:path';

const fixtureDir = path.resolve(__dirname, 'fixture');

cds.root = fixtureDir;
const tester: any = cds.test(fixtureDir);
const { GET, POST, PATCH } = tester;

describe('cap-user-info plugin', () => {
  test('UPSERTs UserInfo on CREATE for an authenticated user', async () => {
    const res = await POST('/odata/v4/test/Things', { name: 'a' }, {
      auth: { username: 'alice' }
    });
    assert.equal(res.status, 201);

    const { UserInfo } = cds.entities('cap.userinfo');
    const rows = await SELECT.from(UserInfo).where({ ID: 'alice' });
    assert.equal(rows.length, 1, 'one UserInfo row for alice');
    assert.equal(rows[0].ID, 'alice');
  });

  test('UPSERTs only once per transaction (parent + children)', async () => {
    await POST('/odata/v4/test/Parents', {
      name: 'p',
      children: [{ label: 'c1' }, { label: 'c2' }, { label: 'c3' }]
    }, { auth: { username: 'bob' } });

    const { UserInfo } = cds.entities('cap.userinfo');
    const rows = await SELECT.from(UserInfo).where({ ID: 'bob' });
    assert.equal(rows.length, 1, 'bob has exactly one UserInfo row');
  });

  test('skips anonymous user', async () => {
    await POST('/odata/v4/test/Things', { name: 'b' });
    const { UserInfo } = cds.entities('cap.userinfo');
    const rows = await SELECT.from(UserInfo).where({ ID: 'anonymous' });
    assert.equal(rows.length, 0, 'no UserInfo row for anonymous');
  });

  test('sets _toCreatedUserInfo via createdBy association', async () => {
    const create = await POST('/odata/v4/test/Things',
      { name: 'with-expand' },
      { auth: { username: 'carol' } });
    const id = create.data.ID;
    const res = await GET(`/odata/v4/test/Things(${id})?$expand=_toCreatedUserInfo`,
      { auth: { username: 'carol' } });
    assert.equal(res.data._toCreatedUserInfo?.ID, 'carol');
  });

  test('UPDATE creates _toModifiedUserInfo for a different user', async () => {
    const create = await POST('/odata/v4/test/Things',
      { name: 'mod' },
      { auth: { username: 'dave' } });
    const id = create.data.ID;

    await PATCH(`/odata/v4/test/Things(${id})`,
      { name: 'modified' },
      { auth: { username: 'erin' } });

    const res = await GET(`/odata/v4/test/Things(${id})?$expand=_toModifiedUserInfo`,
      { auth: { username: 'dave' } });
    assert.equal(res.data._toModifiedUserInfo?.ID, 'erin');
  });
});
