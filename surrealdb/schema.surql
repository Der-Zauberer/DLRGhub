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

DEFINE TABLE OVERWRITE post SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE post;
DEFINE FIELD OVERWRITE title ON TABLE post TYPE string;
DEFINE FIELD OVERWRITE author ON TABLE post TYPE string;
DEFINE FIELD OVERWRITE message ON TABLE post TYPE string;
DEFINE FIELD OVERWRITE created ON TABLE post TYPE option<datetime> DEFAULT time::now() READONLY;
DEFINE FIELD OVERWRITE updated ON TABLE post TYPE option<datetime> VALUE time::now();

DEFINE TABLE OVERWRITE file SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE file;
DEFINE FIELD OVERWRITE name ON TABLE file TYPE string;
DEFINE FIELD OVERWRITE type ON TABLE file TYPE string;
DEFINE FIELD OVERWRITE content ON TABLE file TYPE bytes;
DEFINE FIELD OVERWRITE created.user ON TABLE file TYPE record<user> DEFAULT $auth.id READONLY;
DEFINE FIELD OVERWRITE created.timestamp ON TABLE file TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD OVERWRITE updated.user ON TABLE file TYPE record<user> VALUE $auth.id;
DEFINE FIELD OVERWRITE updated.timestamp ON TABLE file TYPE datetime VALUE time::now();

DEFINE TABLE OVERWRITE user SCHEMAFULL TYPE NORMAL
	PERMISSIONS
		FOR select, update WHERE id = $auth.id || $auth.admin,
        FOR create, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE name ON TABLE user TYPE string;
DEFINE FIELD OVERWRITE email ON TABLE user TYPE string ASSERT string::is::email($value);
DEFINE FIELD OVERWRITE password ON TABLE user TYPE string VALUE (IF !$value.starts_with('$argon2id$') { crypto::argon2::generate($value) } ELSE { $value })
    PERMISSIONS
        FOR select NONE,
        FOR create, update, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE admin ON TABLE user TYPE bool DEFAULT false
    PERMISSIONS
        FOR select WHERE id = $auth.id || $auth.admin,
        FOR create, update, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE account ON TABLE user TYPE object DEFAULT {}
    PERMISSIONS
        FOR select WHERE id = $auth.id || $auth.admin,
        FOR create, update, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE account.enabled ON TABLE user TYPE bool DEFAULT true;
DEFINE FIELD OVERWRITE account.expiry ON TABLE user TYPE option<datetime>;

DEFINE INDEX OVERWRITE email ON user FIELDS email UNIQUE;

DEFINE ACCESS OVERWRITE user ON DATABASE TYPE RECORD
	SIGNIN {
		LET $user = SELECT * FROM ONLY type::thing("user", <string>$username) WHERE crypto::argon2::compare(password, $password);
        IF !$user {
            THROW 'error.user.password.invalid: Your credentials are invalid!';
        } ELSE IF $user.account.enabled == false || (type::is::datetime($user.account.expiry) && $user.account.expiry < time::now()) {
            THROW 'error.user.deactivated: Your account is deactivated!';
        };
        RETURN $user;
    }
	SIGNUP (
		CREATE user CONTENT {
            id: $username,
			name: $name,
			email: $email,
			password: crypto::argon2::generate($password),
            accoount: {
                enabled = false
            }
		}
	) DURATION FOR TOKEN 1h, FOR SESSION 1h;