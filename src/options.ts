import { camelCase, upperFirst } from 'lodash'
import { ParserOptions } from 'prettier'

const DEFAULT_OPTIONS: OptionValues = {
    prettier: true,
    writeHeader: true,
    camelCase: false,
    tableNamespaces: true
    // inlineEnum: false
}

export type OptionValues = {
    prettier?: boolean
    prettierConfig?: ParserOptions
    camelCase?: boolean
    writeHeader?: boolean // write schemats description header
    customHeader?: string
    tableNamespaces?: boolean // whether to namespace field types
    // inlineEnum?: boolean // whether to create/export enum types
}

export default class Options {
    public options: OptionValues

    constructor(options: OptionValues = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options }
    }

    transformTypeName(typename: string) {
        return this.options.camelCase
            ? upperFirst(camelCase(typename))
            : typename
    }

    transformColumnName(columnName: string) {
        return this.options.camelCase ? camelCase(columnName) : columnName
    }
}
