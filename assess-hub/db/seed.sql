-- Seed users (idempotent via ON DUPLICATE KEY UPDATE on unique email)
INSERT INTO User (id, email, name, role, isActive, createdAt)
VALUES (REPLACE(UUID(),'-',''), 'admin@example.com', 'Admin User', 'admin', 1, NOW(3))
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), isActive=VALUES(isActive);

INSERT INTO User (id, email, name, role, isActive, createdAt)
VALUES (REPLACE(UUID(),'-',''), 'reader@example.com', 'Reader User', 'reader', 1, NOW(3))
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), isActive=VALUES(isActive);

INSERT INTO User (id, email, name, role, isActive, createdAt)
VALUES (REPLACE(UUID(),'-',''), 'assessor@example.com', 'Assessor User', 'sa', 1, NOW(3))
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), isActive=VALUES(isActive);

INSERT INTO User (id, email, name, role, isActive, createdAt)
VALUES (REPLACE(UUID(),'-',''), 'moayad.ismail@gmail.com', 'Moayad Ismail', 'admin', 1, NOW(3))
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), isActive=VALUES(isActive);

-- Seed customers (idempotent via ON DUPLICATE KEY UPDATE on unique name)
INSERT INTO Customer (id, name, createdAt, updatedAt)
VALUES (REPLACE(UUID(),'-',''), 'Acme Corp', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updatedAt=NOW(3);

INSERT INTO Customer (id, name, createdAt, updatedAt)
VALUES (REPLACE(UUID(),'-',''), 'TechStart Inc', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updatedAt=NOW(3);

INSERT INTO Customer (id, name, createdAt, updatedAt)
VALUES (REPLACE(UUID(),'-',''), 'GlobalBank', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updatedAt=NOW(3);

INSERT INTO Customer (id, name, createdAt, updatedAt)
VALUES (REPLACE(UUID(),'-',''), 'HealthFirst Solutions', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updatedAt=NOW(3);

INSERT INTO Customer (id, name, createdAt, updatedAt)
VALUES (REPLACE(UUID(),'-',''), 'RetailMax', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE updatedAt=NOW(3);
