# 🗄️ Persistence Layer Documentation (JPA Entities)

This document provides a detailed technical description of the database objects (Entities), their relations, and the system rules for data integrity managed via Hibernate/JPA.

---

## 1. "Users and Security" Schema

### 👤 UserEntity (`users`)
The core object for storing user identity.
- **Identification:** Automatically generated `Integer id`.
- **Uniqueness:** The `username` and `email` fields have strict unique constraints and maximum lengths (50 and 100 characters respectively).
- **Security:** Passwords are stored encrypted in the `password_hash` field. Soft deletion is supported via the `is_active` flag.
- **Relations:**
  - `@ManyToMany`: Linked to `RoleEntity` via the `user_roles` table. This allows a single user to possess multiple administrative and functional access levels.

### 🔑 RoleEntity (`roles`)
Defines the static access levels.
- **Fields:** `id`, `name` (unique).
- **Purpose:** Used for permission filtering in the business logic (RBAC - Role-Based Access Control).

---

## 2. "Documents and Versioning" Schema

### 📄 DocumentEntity (`documents`)
The container that aggregates all versions of a single document.
- **Fields:** `title`, `description` (TEXT), `is_active`, `created_at`.
- **Relations:** - `@ManyToOne` to `UserEntity` (createdBy) - indicates the original author.

### 📑 VersionEntity (`versions`)
Stores a specific iteration (revision) of a given document.
- **DB-Level Protection:** Uses `@UniqueConstraint(columnNames = {"document_id", "version_number"})`, ensuring there cannot be two versions with the same number for the same document.
- **Content:** `content` is stored as a `TEXT` type to support long strings.
- **Relations:**
  - `@ManyToOne` to `DocumentEntity`.
  - `@ManyToOne` to `VersionEntity` (`parentVersion`) - allows tracking of the change tree.
  - Links to `UserEntity` for `createdBy` (author) and `approvedBy` (reviewer).

### 📌 DocumentActiveVersion (`document_active_versions`)
A specialized joining table for fast access to the current official version.
- **Key:** Uses `@OneToOne` with `@MapsId` to `DocumentEntity`, meaning the primary key is the same as the document itself.
- **Purpose:** Points to exactly one version (`VersionEntity`) that is currently considered officially approved and active.

---

## 3. "Communication, Audit and Notifications" Schema

### 💬 CommentEntity (`comments`)
Feedback provided by reviewers during the review process.
- **Relation:** Links directly to `VersionEntity`. Comments are contextual for each specific revision.
- **Content:** `comment_text` (`TEXT` type) and a link to the comment's author (`UserEntity`).

### 📜 AuditLog (`audit_logs`)
A comprehensive historical record of every administrative transaction in the system.
- **Fields:**
  - `user`: Which administrator performed the action.
  - `actionType`: The type of action (e.g., "ACTIVATE_USER", "ADD_ROLE").
  - `entityType` & `entityId`: Which specific object was affected.
  - `details`: Additional text information regarding the change.
- **Time:** Automatic `timestamp` for every event.

### 🔔 NotificationEntity (`notifications`)
System for asynchronous user notifications.
- **Relations:** `@ManyToOne` to the recipient (`UserEntity`).
- **Fields:** `message` (the notification text), `is_read` (flag indicating if read), `created_at`.

---

## ⚙️ Technical Configuration (JPA/Hibernate)

| Feature                | Value / Description                                                                                                  |
|:-----------------------|:---------------------------------------------------------------------------------------------------------------------|
| **ID Generation**      | `GenerationType.IDENTITY` (Auto-increment, managed by the database).                                                 |
| **Date/Time**          | Uses `LocalDateTime` (ISO standardized and compatible with Hibernate 6+).                                            |
| **Cascade & Fetching** | Relations are optimally configured (standard EAGER for ManyToOne), relying on the database for integrity management. |