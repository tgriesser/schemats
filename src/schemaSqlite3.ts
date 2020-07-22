import { transform } from 'lodash'
import type * as Sqlite3Db from 'better-sqlite3'
import * as path from 'path'
import { TableDefinition, Database } from './schemaInterfaces'
import Options from './options'

export class Sqlite3Database implements Database {
    private db: Sqlite3Db

    constructor(public connectionString: string) {
        let DBConstructor: typeof import('better-sqlite3')
        if (!path.isAbsolute(connectionString)) {
            this.connectionString = path.join(process.cwd(), connectionString)
        }
        try {
            DBConstructor = require('better-sqlite3')
        } catch (e) {
            throw new Error('better-sqlite3 is required as a dependency of schemats')
        }
        this.db = DBConstructor(this.connectionString, { fileMustExist: true })
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
                typeof options.options.customTypes?.[tableName]?.[columnName] !== 'undefined'
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
                column.tsType = 'Buffer';
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
                tableDefinition[columnName] = {
                    udtName: schemaItem.type,
                    nullable: schemaItem.notnull === 0,
                    defaultValue: schemaItem.dflt_value
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
        const schemaTables = this.db.prepare(
          'SELECT name FROM sqlite_master WHERE type = ?'
        ).all('table')
        return schemaTables.map(
            (schemaItem: { name: string }) => schemaItem.name
        )
    }

    public getDefaultSchema(): string {
        return ''
    }
    
    public async query() {
      return []
    }
}
