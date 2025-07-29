DEFINE TABLE OVERWRITE plan SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE plan;
DEFINE FIELD OVERWRITE name ON TABLE plan TYPE string;
DEFINE FIELD OVERWRITE roles ON TABLE plan TYPE array<string>;

DEFINE TABLE OVERWRITE shift SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE shift;
DEFINE FIELD OVERWRITE name ON TABLE shift TYPE option<string>;
DEFINE FIELD OVERWRITE date ON TABLE shift TYPE datetime;
DEFINE FIELD OVERWRITE begin ON TABLE shift TYPE option<string> ASSERT $value.matches('\\d{2}:\\d{2}');
DEFINE FIELD OVERWRITE end ON TABLE shift TYPE option<string> ASSERT $value.matches('\\d{2}:\\d{2}');
DEFINE FIELD OVERWRITE people ON TABLE shift TYPE array<object>;
DEFINE FIELD OVERWRITE people[*].name ON TABLE shift TYPE string;
DEFINE FIELD OVERWRITE people[*].role ON TABLE shift TYPE option<string>;

DEFINE TABLE OVERWRITE scedules SCHEMAFULL TYPE RELATION IN plan OUT shift
    PERMISSIONS FOR select, create, update, delete WHERE $auth.id != NONE;

DEFINE TABLE OVERWRITE user SCHEMAFULL TYPE NORMAL
    PERMISSIONS FOR select WHERE $auth.id == id;
DEFINE FIELD OVERWRITE password ON TABLE user TYPE string
    VALUE (IF !$value.starts_with('$argon2id$') { crypto::argon2::generate($value) } ELSE { $value });

DEFINE ACCESS OVERWRITE user ON DATABASE TYPE RECORD
	SIGNIN (SELECT * FROM ONLY type::thing('user', 'admin') WHERE crypto::argon2::compare(password, 'admin'));

INSERT IGNORE INTO user [
    {
        id: user:admin,
        password: 'admin',
    }
];