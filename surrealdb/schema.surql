---------------
-- functions --
---------------

DEFINE FUNCTION OVERWRITE fn::search::normalize($name: string, $seperator: option<string>) {
    LET $result = $name.lowercase().replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').slug();
    IF ($seperator != NONE && $seperator != '-') {
        RETURN string::replace($result, '-', $seperator);
    };
    RETURN $result;
};

------------
--- post ---
------------

DEFINE TABLE OVERWRITE post SCHEMAFULL TYPE NORMAL
    PERMISSIONS
        FOR select, create, update, delete WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE post;
DEFINE FIELD OVERWRITE title ON TABLE post TYPE string;
DEFINE FIELD OVERWRITE author ON TABLE post TYPE string;
DEFINE FIELD OVERWRITE message ON TABLE post TYPE string;
DEFINE FIELD OVERWRITE created ON TABLE post TYPE option<datetime> DEFAULT time::now() READONLY;
DEFINE FIELD OVERWRITE updated ON TABLE post TYPE option<datetime> VALUE time::now();

------------
--- plan ---
------------

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
DEFINE FIELD OVERWRITE description ON TABLE shift TYPE option<string> VALUE (IF $value == '' { NONE } ELSE { $value });
DEFINE FIELD OVERWRITE people ON TABLE shift TYPE array<object> DEFAULT [];
DEFINE FIELD OVERWRITE people[*].name ON TABLE shift TYPE string;
DEFINE FIELD OVERWRITE people[*].role ON TABLE shift TYPE option<string>;

DEFINE TABLE OVERWRITE schedules SCHEMAFULL TYPE RELATION IN plan OUT shift
    PERMISSIONS FOR select, create, update, delete WHERE $auth.id != NONE;

DEFINE EVENT OVERWRITE schedules_delete ON TABLE schedules WHEN $event == 'DELETE' THEN {
    DELETE $before.out;
};

------------
--- file ---
------------

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

------------
--- user ---
------------

DEFINE TABLE OVERWRITE user SCHEMAFULL TYPE NORMAL
	PERMISSIONS
		FOR select, update WHERE id = $auth.id || $auth.admin,
        FOR create, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE email ON TABLE user TYPE string ASSERT string::is::email($value);
DEFINE FIELD OVERWRITE name ON TABLE user TYPE string;
DEFINE FIELD OVERWRITE displayname ON TABLE user TYPE string;
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
DEFINE FIELD OVERWRITE account.enabled ON TABLE user TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE account.valid ON TABLE user TYPE option<datetime>;
DEFINE FIELD OVERWRITE account.expiry ON TABLE user TYPE option<datetime>;
DEFINE FIELD OVERWRITE credentials ON TABLE user TYPE object DEFAULT {}
    PERMISSIONS
        FOR select WHERE id = $auth.id || $auth.admin,
        FOR create, update, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE credentials.change ON TABLE user TYPE bool DEFAULT false;
DEFINE FIELD OVERWRITE credentials.expiry ON TABLE user TYPE option<datetime>;
DEFINE FIELD OVERWRITE login ON TABLE user TYPE option<datetime>    
    PERMISSIONS
        FOR select WHERE id = $auth.id || $auth.admin,
        FOR create, update, delete NONE;

DEFINE INDEX OVERWRITE email ON user FIELDS email UNIQUE;
DEFINE INDEX OVERWRITE name ON user FIELDS name UNIQUE;

DEFINE TABLE OVERWRITE _password_change_request SCHEMAFULL
	PERMISSIONS
		FOR create FULL;
DEFINE FIELD OVERWRITE id ON TABLE _password_change_request;
DEFINE FIELD OVERWRITE username ON TABLE _password_change_request TYPE string DEFAULT (IF !$input.username && $auth { $auth.name });
DEFINE FIELD OVERWRITE old ON TABLE _password_change_request TYPE string;
DEFINE FIELD OVERWRITE new ON TABLE _password_change_request TYPE string;
DEFINE FIELD OVERWRITE repeat ON TABLE _password_change_request TYPE string;
DEFINE FIELD OVERWRITE created ON TABLE _password_change_request TYPE datetime VALUE time::now() READONLY;

DEFINE EVENT OVERWRITE _password_change_request ON TABLE _password_change_request WHEN $event = 'CREATE' THEN {
    LET $user = (SELECT * FROM ONLY user WHERE name = $after.username AND crypto::argon2::compare(password, $after.old));
    IF !$user {
        THROW 'error.user.password.invalid: Your credentials are invalid!';
    } ELSE IF $after.new != $after.repeat {
        THROW 'error.user.password.change.repeat: Your new passwords have to be the same!';
    } ELSE IF $after.old == $after.new {
        THROW 'error.user.password.change.different: Your new password must be different from the old one!';
    } ELSE {
        UPDATE $user.id SET password = $after.new, credentials.change = false, credentials.expiry = NONE, account.valid = time::now();
    };
    DELETE $after.id;
};

DEFINE TABLE OVERWRITE _invalidate_all_devices_request SCHEMAFULL
	PERMISSIONS
		FOR create WHERE $auth.id != NONE;
DEFINE FIELD OVERWRITE id ON TABLE _invalidate_all_devices_request;
DEFINE FIELD OVERWRITE user ON TABLE _invalidate_all_devices_request TYPE record<user> DEFAULT $auth.id;
DEFINE FIELD OVERWRITE created ON TABLE _invalidate_all_devices_request TYPE datetime VALUE time::now() READONLY;

DEFINE EVENT OVERWRITE _invalidate_all_devices_request ON TABLE _invalidate_all_devices_request WHEN $event = 'CREATE' THEN {
    UPDATE user SET account.valid = $after.created;
    DELETE $after.id;
};

DEFINE TABLE OVERWRITE registration SCHEMAFULL
	PERMISSIONS
		FOR create FULL,
        FOR select, update, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE id ON TABLE registration;
DEFINE FIELD OVERWRITE email ON TABLE registration TYPE string ASSERT string::is::email($value);
DEFINE FIELD OVERWRITE firstname ON TABLE registration TYPE string;
DEFINE FIELD OVERWRITE lastname ON TABLE registration TYPE string;
DEFINE FIELD OVERWRITE password ON TABLE registration TYPE string VALUE (IF !$value.starts_with('$argon2id$') { crypto::argon2::generate($value) } ELSE { $value }) PERMISSIONS
        FOR select NONE,
        FOR create, update, delete WHERE $auth.admin;
DEFINE FIELD OVERWRITE approve ON TABLE registration TYPE bool PERMISSIONS FOR select, create, update, delete WHERE $auth.admin DEFAULT false;

DEFINE EVENT OVERWRITE registration_update ON TABLE registration WHEN $event = 'CREATE' OR $event = 'UPDATE' THEN {
    IF $after.approve {
        INSERT INTO user {
            email: $after.email,
            name: fn::search::normalize($after.firstname, '_') + '.' + fn::search::normalize($after.lastname, '_'),
            displayname: $after.firstname + ' ' + $after.lastname,
            password: $after.password,
            account: { enabled: true }
        };
        DELETE $after.id;
    }
};

DEFINE ACCESS OVERWRITE user ON DATABASE TYPE RECORD
	SIGNIN {
		LET $user = SELECT * FROM user WHERE (email = $username OR name = $username) AND crypto::argon2::compare(password, $password);
        IF !$user {
            THROW 'error.user.password.invalid: Your credentials are invalid!';
        } ELSE IF $user.account.enabled == false || (type::is::datetime($user.account.expiry) && $user.account.expiry < time::now()) {
            THROW 'error.user.deactivated: Your account is deactivated!';
        } ELSE IF $user.credentials.change == true || (type::is::datetime($user.credentials.expiry) && $user.credentials.expiry < time::now()) {
            THROW 'error.user.password.change.required: Your password have to be changed!';
        };
        UPDATE $user.id SET login = time::now();
        RETURN $user;
    }
    AUTHENTICATE {
        IF $auth.account.enabled == false || (type::is::datetime($auth.account.expiry) && $auth.account.expiry < time::now()) {
            THROW 'error.user.deactivated: Your account is deactivated!';
        } ELSE IF type::is::datetime($auth.account.valid) && time::unix($auth.account.valid) > $token.iat {
            THROW 'error.user.authentication: Your authentication is expired!';
        };
        RETURN $auth;
    } DURATION FOR TOKEN 8h, FOR SESSION 8h;

INSERT IGNORE INTO user {
    id: user:admin,
    name: 'admin',
    displayname: 'admin',
    email: 'admin@drlg.derzauberer.eu',
    password: 'admin',
    account: {
		enabled: true
	}
};
