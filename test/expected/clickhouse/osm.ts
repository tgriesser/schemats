/* tslint:disable */

export namespace usersFields {
    export type array_col = Array<string>
    export type array_col_nullable = Array<string | null>
    export type char_col = string
    export type insert_date = string
    export type nullable_char_col = string | null
    export type uid = string
}

export interface users {
    array_col: usersFields.array_col
    array_col_nullable: usersFields.array_col_nullable
    char_col: usersFields.char_col
    insert_date: usersFields.insert_date
    nullable_char_col: usersFields.nullable_char_col
    uid: usersFields.uid
}
