DEFINE TABLE OVERWRITE plan SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE plan;
DEFINE FIELD OVERWRITE name ON TABLE plan TYPE string;
DEFINE FIELD OVERWRITE roles ON TABLE plan TYPE array<string> DEFAULT [];

DEFINE TABLE OVERWRITE shift SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE shift;
DEFINE FIELD OVERWRITE name ON TABLE shift TYPE option<string>;
DEFINE FIELD OVERWRITE date ON TABLE shift TYPE datetime;
DEFINE FIELD OVERWRITE begin ON TABLE shift TYPE option<string> ASSERT $value.matches('\\d{2}:\\d{2}');
DEFINE FIELD OVERWRITE end ON TABLE shift TYPE option<string> ASSERT $value.matches('\\d{2}:\\d{2}');
DEFINE FIELD OVERWRITE people ON TABLE shift TYPE array<object> DEFAULT [];
DEFINE FIELD OVERWRITE people[*].name ON TABLE shift TYPE string;
DEFINE FIELD OVERWRITE people[*].role ON TABLE shift TYPE option<string>;

DEFINE TABLE OVERWRITE schedules SCHEMAFULL TYPE RELATION IN plan OUT shift
    PERMISSIONS FOR select, create, update, delete WHERE $auth.id != NONE;

DEFINE EVENT OVERWRITE schedules_delete ON TABLE schedules WHEN $event == 'DELETE' THEN {
    DELETE $before.out;
};

DEFINE TABLE OVERWRITE file SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;^
DEFINE FIELD OVERWRITE id ON TABLE file;
DEFINE FIELD OVERWRITE name ON TABLE file TYPE string;
DEFINE FIELD OVERWRITE type ON TABLE file TYPE string;
DEFINE FIELD OVERWRITE content ON TABLE file TYPE bytes;
DEFINE FIELD OVERWRITE created.user ON TABLE files TYPE record<user> DEFAULT $auth.id READONLY;
DEFINE FIELD OVERWRITE created.datetime ON TABLE files TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD OVERWRITE updated.user ON TABLE files TYPE record<user> VALUE $auth.id;
DEFINE FIELD OVERWRITE updated.datetime ON TABLE files TYPE datetime VALUE time::now();

DEFINE TABLE OVERWRITE user SCHEMAFULL TYPE NORMAL
    PERMISSIONS FOR select WHERE $auth.id == id;
DEFINE FIELD OVERWRITE password ON TABLE user TYPE string
    VALUE (IF !$value.starts_with('$argon2id$') { crypto::argon2::generate($value) } ELSE { $value });

DEFINE ACCESS OVERWRITE user ON DATABASE TYPE RECORD
	SIGNIN (SELECT * FROM ONLY type::thing('user', $username) WHERE crypto::argon2::compare(password, $password));

INSERT IGNORE INTO user [
    {
        id: user:admin,
        password: 'admin',
    }
];