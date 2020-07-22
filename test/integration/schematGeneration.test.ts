import * as assert from 'power-assert'
import * as path from 'path'
import { Database, getDatabase } from '../../src/index'
import { writeTsFile, compare, loadSchema, writeTsFileSqlite3 } from '../testUtility'

describe('schemat generation integration testing', () => {
  describe('postgres', () => {
    let db: Database
    before(async function() {
      if (!process.env.POSTGRES_URL) {
        return this.skip()
      }
      db = getDatabase(process.env.POSTGRES_URL)
      await loadSchema(db, './test/fixture/postgres/initCleanup.sql')
    })

    it('Basic generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql'
      const outputFile = './test/actual/postgres/osm.ts'
      const expectedFile = './test/expected/postgres/osm.ts'
      const config: any = './fixture/postgres/osm.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))
    })
    it('Camelcase generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql'
      const outputFile = './test/actual/postgres/osm-camelcase.ts'
      const expectedFile = './test/expected/postgres/osm-camelcase.ts'
      const config: any = './fixture/postgres/osm-camelcase.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))
    })
    it('No namespaces generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql'
      const outputFile = './test/actual/postgres/osm-no-namespace.ts'
      const expectedFile = './test/expected/postgres/osm-no-namespace.ts'
      const config: any = './fixture/postgres/osm-no-namespace.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))
    })
    it('For insert generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql'
      const outputFile = './test/actual/postgres/osm-for-insert.ts'
      const expectedFile = './test/expected/postgres/osm-for-insert.ts'
      const config: any = './fixture/postgres/osm-for-insert.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))
    })
    it('For insert generation, requiring null fields', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql'
      const outputFile = './test/actual/postgres/osm-for-insert-with-null.ts'
      const expectedFile = './test/expected/postgres/osm-for-insert-with-null.ts'
      const config: any = './fixture/postgres/osm-for-insert-with-null.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))
    })    
  })

  describe('mysql', () => {
    let db: Database
    before(async function() {
      if (!process.env.MYSQL_URL) {
        return this.skip()
      }
      db = getDatabase(`${process.env.MYSQL_URL}?multipleStatements=true`)
      await loadSchema(db, './test/fixture/mysql/initCleanup.sql')
    })
    it('Basic generation', async () => {
      const inputSQLFile = 'test/fixture/mysql/osm.sql'
      const outputFile = './test/actual/mysql/osm.ts'
      const expectedFile = './test/expected/mysql/osm.ts'
      const config: any = './fixture/mysql/osm.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))
    })
    it('for insert generation', async () => {
      const inputSQLFile = 'test/fixture/mysql/osm.sql'
      const outputFile = './test/actual/mysql/osm-for-insert.ts'
      const expectedFile = './test/expected/mysql/osm-for-insert.ts'
      const config: any = './fixture/mysql/osm-for-insert.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))      
    })
    it('for insert generation, requiring null fields', async () => {
      const inputSQLFile = 'test/fixture/mysql/osm.sql'
      const outputFile = './test/actual/mysql/osm-for-insert-with-null.ts'
      const expectedFile = './test/expected/mysql/osm-for-insert-with-null.ts'
      const config: any = './fixture/mysql/osm-for-insert-with-null.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))      
    })    
    it('Enum conflict in columns', async () => {
      const inputSQLFile = 'test/fixture/mysql/conflict.sql'
      const outputFile = './test/actual/mysql/conflict.ts'
      const config: any = './fixture/mysql/conflict.json'
      try {
        await writeTsFile(inputSQLFile, config, outputFile, db)
      } catch (e) {
        assert.equal(
          e.message,
          'Multiple enums with the same name and contradicting types were found: location_type: ["city","province","country"] and ["city","state","country"]'
        )
      }
    })
  })

  describe('clickhouse', () => {
    let db: Database
    before(async function() {
      if (!process.env.CLICKHOUSE_URL) {
        return this.skip()
      }
      db = getDatabase(`${process.env.CLICKHOUSE_URL}?multipleStatements=true`)
      await loadSchema(db, './test/fixture/clickhouse/initCleanup.sql')
    })
    it('Basic generation', async () => {
      const inputSQLFile = 'test/fixture/clickhouse/osm.sql'
      const outputFile = './test/actual/clickhouse/osm.ts'
      const expectedFile = './test/expected/clickhouse/osm.ts'
      const config: any = './fixture/clickhouse/osm.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))
    })
    it('for insert generation', async () => {
      const inputSQLFile = 'test/fixture/clickhouse/osm.sql'
      const outputFile = './test/actual/clickhouse/osm-for-insert.ts'
      const expectedFile = './test/expected/clickhouse/osm-for-insert.ts'
      const config: any = './fixture/clickhouse/osm-for-insert.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))      
    })
    it('for insert generation, requiring null fields', async () => {
      const inputSQLFile = 'test/fixture/clickhouse/osm.sql'
      const outputFile = './test/actual/clickhouse/osm-for-insert-with-null.ts'
      const expectedFile = './test/expected/clickhouse/osm-for-insert-with-null.ts'
      const config: any = './fixture/clickhouse/osm-for-insert-with-null.json'
      await writeTsFile(inputSQLFile, config, outputFile, db)
      return assert(await compare(expectedFile, outputFile))      
    })
  })

  describe('sqlite3', () => {
    let db: Database
    before(async function() {
      db = getDatabase(path.join(__dirname, '../fixture/sqlite3/fixture.sqlite'), {sqlite3: true})
    })
    it('Basic generation', async () => {
      const outputFile = './test/actual/sqlite3/osm.ts'
      const expectedFile = './test/expected/sqlite3/osm.ts'
      const config: any = './fixture/sqlite3/osm.json'
      await writeTsFileSqlite3(db, config, outputFile)
      return assert(await compare(expectedFile, outputFile))
    })
    it('no namespace', async () => {
      const outputFile = './test/actual/sqlite3/osm-no-namespace.ts'
      const expectedFile = './test/expected/sqlite3/osm-no-namespace.ts'
      const config: any = './fixture/sqlite3/osm-no-namespace.json'
      await writeTsFileSqlite3(db, config, outputFile)
      return assert(await compare(expectedFile, outputFile))      
    })
    it('for insert generation', async () => {
      const outputFile = './test/actual/sqlite3/osm-for-insert.ts'
      const expectedFile = './test/expected/sqlite3/osm-for-insert.ts'
      const config: any = './fixture/sqlite3/osm-for-insert.json'
      await writeTsFileSqlite3(db, config, outputFile)
      return assert(await compare(expectedFile, outputFile))      
    })
    it('for insert generation, requiring null fields', async () => {
      const outputFile = './test/actual/sqlite3/osm-for-insert-with-null.ts'
      const expectedFile = './test/expected/sqlite3/osm-for-insert-with-null.ts'
      const config: any = './fixture/sqlite3/osm-for-insert-with-null.json'
      await writeTsFileSqlite3(db, config, outputFile)
      return assert(await compare(expectedFile, outputFile))      
    })
  })


})
