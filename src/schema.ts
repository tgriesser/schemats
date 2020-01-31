import { Database } from './schemaInterfaces'
import { PostgresDatabase } from './schemaPostgres'
import { MysqlDatabase } from './schemaMysql'
import { ClickHouseDatabase } from './schemaClickhouse'

enum SQLVersion {
    POSTGRES = 1,
    MYSQL = 2,
    CLICKHOUSE = 3,
    UNKNOWN = 4
}

function getSQLVersion(connection: string): SQLVersion {
    if (/^postgres(ql)?:\/\//i.test(connection)) {
        return SQLVersion.POSTGRES
    } else if (/^mysql:\/\//i.test(connection)) {
        return SQLVersion.MYSQL
    } else if (/^clickhouse:\/\//i.test(connection)) {
        return SQLVersion.CLICKHOUSE
    } else {
        return SQLVersion.UNKNOWN
    }
}

export function getDatabase(connection: string): Database {
    switch (getSQLVersion(connection)) {
        case SQLVersion.MYSQL:
            return new MysqlDatabase(connection)
        case SQLVersion.POSTGRES:
            return new PostgresDatabase(connection)
        case SQLVersion.CLICKHOUSE:
            return new ClickHouseDatabase(connection)
        default:
            throw new Error(
                `SQL version unsupported in connection: ${connection}`
            )
    }
}

export { Database } from './schemaInterfaces'
