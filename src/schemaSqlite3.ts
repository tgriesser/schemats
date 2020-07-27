import { transform } from 'lodash'
import type * as Sqlite3Db from 'better-sqlite3'
import * as path from 'path'
import { TableDefinition, Database } from './schemaInterfaces'
import Options from './options'
import _ = require('lodash')

export class Sqlite3Database implements Database {
    private db: Sqlite3Db
    private increments: Record<string, string>

    constructor(public connectionString: string) {
        let DBConstructor: typeof import('better-sqlite3')
        if (!path.isAbsolute(connectionString)) {
            this.connectionString = path.join(process.cwd(), connectionString)
        }
        try {
            DBConstructor = require('better-sqlite3')
        } catch (e) {
            throw new Error(
                'better-sqlite3 is required as a dependency of schemats'
            )
        }
        this.db = DBConstructor(this.connectionString, { fileMustExist: true })
        this.increments = this.getAutoIncrements()
    }

    // uses the type mappings from https://github.com/mysqljs/ where sensible
    private static mapTableDefinitionToType(
        tableDefinition: TableDefinition,
        options: Options,
        tableName: string
    ): TableDefinition {
        if (!options) throw new Error()
        return transform(tableDefinition, (acc, column, columnName) => {
            acc[columnName] = column
            const type = column.udtName.toUpperCase()
            if (
                typeof options.options.customTypes?.[tableName]?.[
                    columnName
                ] !== 'undefined'
            ) {
                column.tsCustomType = true
                column.tsType =
                    options.options.customTypes[tableName][columnName]
                return
            }

            // https://www.sqlite.org/datatype3.html#determination_of_column_affinity
            if (/INT/.test(type)) {
                column.tsType = 'number'
            } else if (/(CHAR|CLOB|TEXT)/.test(type)) {
                column.tsType = 'string'
            } else if (/BLOB/.test(type)) {
                column.tsType = 'Buffer'
            } else if (/(REAL|FLOA|DOUB)/) {
                column.tsType = 'number'
            } else if (type === 'BOOLEAN') {
                column.tsType = '1 | 0'
            } else {
                column.tsType = 'numeric'
            }
        })
    }

    public async getEnumTypes(schema?: string) {
        //
    }

    public async getTableDefinition(tableName: string, tableSchema: string) {
        let tableDefinition: TableDefinition = {}

        const tableColumns = await this.db.pragma(`table_info(${tableName})`)

        tableColumns.map(
            (schemaItem: {
                cid: number
                name: string
                notnull: 0 | 1
                type: string
                dflt_value: string | null
            }) => {
                const columnName = schemaItem.name
                let defaultValue = schemaItem.dflt_value
                if (this.increments[tableName] === `"${schemaItem.name}"`) {
                    defaultValue = ':autoincrement:'
                }

                tableDefinition[columnName] = {
                    udtName: schemaItem.type,
                    nullable: schemaItem.notnull === 0,
                    defaultValue,
                }
            }
        )
        return tableDefinition
    }

    public async getTableTypes(
        tableName: string,
        tableSchema: string = '',
        options: Options
    ) {
        return Sqlite3Database.mapTableDefinitionToType(
            await this.getTableDefinition(tableName, tableSchema),
            options,
            tableName
        )
    }

    public async getSchemaTables(): Promise<string[]> {
        const schemaTables = this.db
            .prepare('SELECT name FROM sqlite_master WHERE type = ?')
            .all('table')
        return schemaTables
            .map((schemaItem: { name: string }) => schemaItem.name)
            .sort()
    }

    public getDefaultSchema(): string {
        return ''
    }

    public async query() {
        return []
    }

    public getAutoIncrements() {
        // https://stackoverflow.com/a/47458402
        const rows = this.db
            .prepare(
                `
            WITH RECURSIVE
                a AS (
                    SELECT name, lower(replace(replace(sql, char(13), ' '), char(10), ' ')) AS sql
                    FROM sqlite_master
                    WHERE lower(sql) LIKE '%integer% autoincrement%'
                ),
                b AS (
                    SELECT name, trim(substr(sql, instr(sql, '(') + 1)) AS sql
                    FROM a
                ),
                c AS (
                    SELECT b.name, sql, '' AS col
                    FROM b
                    UNION ALL
                    SELECT 
                    c.name, 
                    trim(substr(c.sql, ifnull(nullif(instr(c.sql, ','), 0), instr(c.sql, ')')) + 1)) AS sql, 
                    trim(substr(c.sql, 1, ifnull(nullif(instr(c.sql, ','), 0), instr(c.sql, ')')) - 1)) AS col
                    FROM c JOIN b ON c.name = b.name
                    WHERE c.sql != ''
                ),
                d AS (
                    SELECT name, substr(col, 1, instr(col, ' ') - 1) AS col
                    FROM c
                    WHERE col LIKE '%autoincrement%'
                )
                SELECT name, col  
                FROM d
                ORDER BY name, col;
        `
            )
            .all()

        return _.mapValues(_.keyBy(rows, 'name'), 'col')
    }
}
