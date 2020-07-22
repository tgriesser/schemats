/* tslint:disable */

export namespace usersFields {
    export type blob_col = Buffer | null
    export type blob_col_default = Buffer | null
    export type bool_col = number | null
    export type date_col = number | null
    export type float_col = number
    export type float_col_default = number | null
    export type float_col_nullable = number | null
    export type int_col = number
    export type int_col_default = number | null
    export type int_col_nullable = number | null
    export type text_col = string
    export type text_col_default = string | null
    export type text_col_nullable = string | null
    export type varchar_col = string | null
}

export interface users {
    blob_col: usersFields.blob_col
    blob_col_default: usersFields.blob_col_default
    bool_col: usersFields.bool_col
    date_col: usersFields.date_col
    float_col: usersFields.float_col
    float_col_default: usersFields.float_col_default
    float_col_nullable: usersFields.float_col_nullable
    int_col: usersFields.int_col
    int_col_default: usersFields.int_col_default
    int_col_nullable: usersFields.int_col_nullable
    text_col: usersFields.text_col
    text_col_default: usersFields.text_col_default
    text_col_nullable: usersFields.text_col_nullable
    varchar_col: usersFields.varchar_col
}
