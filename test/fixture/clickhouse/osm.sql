DROP TABLE IF EXISTS users;

CREATE TABLE "users" (
    uid String,
    char_col String,
    nullable_char_col Nullable(String),
    array_col Array(String),
    array_col_nullable Array(Nullable(String)),
    insert_date Date
) ENGINE = MergeTree(insert_date, (uid), 8192);
