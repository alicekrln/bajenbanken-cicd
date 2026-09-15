CREATE TABLE IF NOT EXISTS users (
  id INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(256) NOT NULL,
  password VARCHAR(256) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_unique (username)
);

CREATE TABLE IF NOT EXISTS sessions (
  userId INT(11) UNSIGNED NOT NULL,
  token VARCHAR(6) NOT NULL,
  UNIQUE KEY sessions_token_unique (token)
);

CREATE TABLE IF NOT EXISTS accounts (
  id INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  userId INT(11) UNSIGNED NOT NULL,
  amount INT(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY accounts_id_unique (id)
);