import test from 'ava'

import { DatabaseAdapter } from '../../src/drivers/cordova-sqlite-storage/adapter'
import { MockDatabase } from '../../src/drivers/cordova-sqlite-storage/mock'
import { initTestable } from '../../src/drivers/cordova-sqlite-storage/test'
import { MockSQLitePluginTransaction } from '../../src/drivers/sqlite-plugin/mock'
import { QualifiedTablename } from '../../src/util/tablename'

test('electrify returns an equivalent database client', async (t) => {
  const [original, _notifier, db] = await initTestable('test.db')

  const originalKeys = Object.getOwnPropertyNames(original)
  const originalPrototype = Object.getPrototypeOf(original)
  const allKeys = originalKeys.concat(Object.keys(originalPrototype))

  allKeys.forEach((key) => {
    t.assert(key in db)
  })
})

test('running a transaction runs potentiallyChanged', async (t) => {
  const [_original, notifier, db] = await initTestable('test.db')

  t.is(notifier.notifications.length, 0)

  const tx = new MockSQLitePluginTransaction()
  db.addTransaction(tx)

  t.is(notifier.notifications.length, 1)
})

test('running a read only transaction does not potentiallyChanged', async (t) => {
  const [_original, notifier, db] = await initTestable('test.db')

  t.is(notifier.notifications.length, 0)

  const tx = new MockSQLitePluginTransaction(true)
  db.addTransaction(tx)

  t.is(notifier.notifications.length, 0)
})

test('database adapter run works', async (t) => {
  const db = new MockDatabase('test.db')
  const adapter = new DatabaseAdapter(db)

  const sql = 'select foo from bars'
  const result = await adapter.run({ sql })

  t.is(result, undefined)
})

test('database adapter query works', async (t) => {
  const db = new MockDatabase('test.db')
  const adapter = new DatabaseAdapter(db)

  const sql = 'select foo from bars'
  const result = await adapter.query({ sql })

  t.deepEqual(result, [{ i: 0 }])
})

test('database adapter tableNames works', async (t) => {
  const db = new MockDatabase('test.db')
  const adapter = new DatabaseAdapter(db)

  const sql = 'select foo from bar'
  const r1 = adapter.tableNames({ sql })

  t.deepEqual(r1, [new QualifiedTablename('main', 'bar')])
})
