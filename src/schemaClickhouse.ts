import { ClickHouse } from 'clickhouse'
import { transform } from 'lodash'
import { keys } from 'lodash'
import { parse as urlParse } from 'url'
import Options from './options'

import { TableDefinition, Database } from './schemaInterfaces'

function isAbstract(t: string) {
    return isArray(t) || isNullable(t)
}

function isNullable(t: string) {
    return t.startsWith('Nullable(')
}

function isArray(t: string) {
    return t.startsWith('Nullable(')
}

export class ClickHouseDatabase implements Database {
    private db: ClickHouse

    constructor(public connectionString: string) {
        const parsed = urlParse(connectionString)
        this.db = new ClickHouse({
            url: `http://${parsed.hostname}`,
            port: parsed.port || 8123
        })
    }

    private static mapTableDefinitionToType(
        tableDefinition: TableDefinition,
        customTypes: string[],
        options: Options,
        tableName: string
    ): TableDefinition {
        return transform(tableDefinition, (acc, column, columnName) => {
            acc[columnName] = column
            if (
                options.options.customTypes &&
                options.options.customTypes[tableName] &&
                typeof options.options.customTypes[tableName][columnName] !==
                    'undefined'
            ) {
                column.tsCustomType = true
                column.tsType =
                    options.options.customTypes[tableName][columnName]
                return
            }

            let arrays: boolean[] = []
            while (column.udtName.startsWith('Array(')) {
                column.udtName = column.udtName.slice(6, -1)
                if (column.udtName.startsWith('Nullable(')) {
                    arrays.push(true)
                    column.udtName = column.udtName.slice(9, -1)
                } else {
                    arrays.push(false)
                }
            }

            // console.log(column, columnName)
            switch (column.udtName) {
                case 'Decimal':
                case 'Float32':
                case 'Float64':
                case 'Int':
                case 'Int16':
                case 'Int32':
                case 'Int64':
                case 'Int8':
                case 'UInt':
                case 'UInt16':
                case 'UInt32':
                case 'UInt64':
                case 'UInt8':
                    column.tsType = 'number'
                    break
                case 'Date':
                case 'DateTime':
                case 'FixedString':
                case 'String':
                case 'UUID':
                case 'IPv4':
                case 'IPv6':
                    column.tsType = 'string'
                    break
                default:
                    if (customTypes.indexOf(column.udtName) !== -1) {
                        column.tsType = options.transformTypeName(
                            column.udtName
                        )
                    } else {
                        console.log(
                            `Type [${column.udtName} has been mapped to [any] because no specific type has been found.`
                        )
                        column.tsType = 'any'
                    }
            }

            if (arrays.length) {
                column.tsType = arrays.reduce((result, a) => {
                    if (a) {
                        return `Array<${result} | null>`
                    }
                    return `Array<${result}>`
                }, column.tsType)
            }
        })
    }

    public async query(queryString: string) {
        const queries = queryString
            .split(';')
            .map(q => q.trim())
            .filter(Boolean)

        let results: any[] = []
        for (const q of queries) {
            results.push(await this.db.query(q).toPromise())
        }

        return queries.length === 1 ? results[0] : results
    }

    public async getEnumTypes(schema?: string) {
        return {}
    }

    public async getTableDefinition(tableName: string, tableSchema: string) {
        let tableDefinition: TableDefinition = {}
        const rows = await this.db
            .query(
                `SELECT * FROM system.columns WHERE database = '${tableSchema}' AND table = '${tableName}'`
            )
            .toPromise()

        type ColRow = {
            database: string
            table: string
            name: string
            type: string
            default_kind: string | null
            comment: string | null
            default_expression: string | null
        }

        rows.forEach((row: ColRow) => {
            const nullable = row.type.startsWith('Nullable(')
            const type = nullable ? row.type.slice(9, -1) : row.type

            const defaultValue =
                row.default_kind || row.default_expression ? true : null

            tableDefinition[row.name] = {
                udtName: type,
                nullable: nullable,
                defaultValue,
                rawType: row.type
            } as TableDefinition[any]
        })

        return tableDefinition
    }

    public async getTableTypes(
        tableName: string,
        tableSchema: string,
        options: Options
    ) {
        let enumTypes = await this.getEnumTypes()
        let customTypes = keys(enumTypes)
        return ClickHouseDatabase.mapTableDefinitionToType(
            await this.getTableDefinition(tableName, tableSchema),
            customTypes.sort(),
            options,
            tableName
        )
    }

    public async getSchemaTables(schemaName: string): Promise<string[]> {
        const rows = await this.db
            .query(
                `SELECT * FROM system.tables WHERE database = '${schemaName}'`
            )
            .toPromise()
        return (rows as any[]).map(row => row.name)
    }

    getDefaultSchema(): string {
        return 'default'
    }
}
