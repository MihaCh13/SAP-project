
-- Използваме точно имената от твоята снимка
INSERT INTO users (id, username, email, password_hash, is_active, created_at) 
VALUES (1, 'Ivan_Author', 'ivan@sap.com', 'pass123', true, CURRENT_TIMESTAMP);

INSERT INTO users (id, username, email, password_hash, is_active, created_at) 
VALUES (2, 'Petyo_Reviewer', 'petyo@sap.com', 'pass456', true, CURRENT_TIMESTAMP);

 INSERT INTO roles (id, name) VALUES (1, 'AUTHOR'), (2, 'REVIEWER');
 -- Свързваме Иван (user_id = 1) с роля AUTHOR (role_id = 1)
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);

-- Свързваме Петьо (user_id = 2) с роля REVIEWER (role_id = 2)
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2);
-- Добавяме роля ADMIN (ако я няма)
INSERT INTO roles (id, name) VALUES (3, 'ADMIN');

-- Създаваме Супер Потребител
INSERT INTO users (id, username, email, password_hash, is_active, created_at) 
VALUES (3, 'SuperAdmin', 'admin@sap.com', 'admin123', true, CURRENT_TIMESTAMP);

-- Закачаме ролята ADMIN за SuperAdmin (user_id = 3)
INSERT INTO user_roles (user_id, role_id) VALUES (3, 3);
INSERT INTO roles (id, name) VALUES (4, 'READER');

-- Сверяваме брояча на базата данни да продължи от 4, защото 1, 2 и 3 са заети
ALTER TABLE users ALTER COLUMN id RESTART WITH 4;

ALTER TABLE roles ALTER COLUMN id RESTART WITH 5;