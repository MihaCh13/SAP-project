# 🌐 Database Layer Overview (Persistence Layer)

This document describes the architecture, integration, and data flow within the `com.sap.project.database` package. The layer is designed as an independent module that serves the business logic (Services), ensuring security, traceability, and absolute data integrity.

---

## 1. Architectural Data Flow
In our system, data passes through three levels of processing within this package, strictly following the Separation of Concerns principle:

1.  **Storage (Entities):** Represents the physical description of the SQL tables (8 in total) via JPA/Hibernate annotations.
2.  **Access (Repositories):** Interfaces (Spring Data JPA) that abstract SQL queries and provide methods for data access and manipulation.
3.  **Transformation (Mappers):** Logic that isolates the database from the business models, converting raw records into clean Java objects ready for the business layer.

---

## 2. Package Components

### 🏗️ Entities (Data Objects)
Define the logical schema. The core modules are:
- **Identity Management:** `UserEntity` and `RoleEntity` (Linked via Many-to-Many).
- **Document Versioning:** `DocumentEntity`, `VersionEntity`, and the optimization table `DocumentActiveVersion`.
- **Communication and Audit:** `CommentEntity` (for reviewer feedback), `NotificationEntity` (for system notifications), and `AuditLog` (for the historical recording of administrative actions).

### 🗄️ Repositories (Data Access)
The layer contains 8 interfaces extending `JpaRepository`. It actively utilizes *Query Method Derivation* (e.g., `findByUserIdAndIsReadFalse` in `NotificationRepository` or `findByDocumentId` in `VersionRepository`), which eliminates the need to write manual SQL and significantly reduces the risk of errors.

### 🔄 Mappers (Transformation)
Mappers (`UserMapper` and `VersionMapper`) guarantee that the business logic operates with secure, flat Domain Models, rather than heavy, database-bound Hibernate objects. They also handle the *fallback* logic (e.g., automatically assigning the base `READER` role in the event of a data error).

---

## 3. Key Mechanisms and Safeguards

### 🔗 Linear Versioning and History
The system maintains strict version tracking. Every record in the `versions` table is linked via `parent_version_id` to its predecessor, forming a continuous chain of changes. Approving a version automatically marks it in `document_active_versions` for lightning-fast access (O(1) read complexity).

### 🛡️ Role-Based Security (RBAC)
Through the relational model between `UserEntity` and `RoleEntity`, the database supports complex combinations of permissions (AUTHOR, REVIEWER, ADMIN, READER), which are validated at the exact moment of mapping to the business model.

### 🔔 Traceability and Communication
Process integrity is secured by the `audit_logs` table, which acts as a "black box" for administrator actions. Concurrently, the `notifications` table ensures asynchronous communication between system processes and end-users.

---

## 🛠️ Maintenance and Development Guidelines

- **Transactionality:** All database writes are executed within a `@Transactional` context (managed by the Services layer) to avoid partial data persistence in the event of an error (Rollback).
- **Immutability:** Versions (`VersionEntity`) and Audit Logs (`AuditLog`) are conceptually immutable. When a change is required, a new row (a new version) is inserted, and the old records are preserved for historical reference.
- **Optimization:** `Lazy Loading` is predominantly used for collections (to prevent memory overloading), and the system relies on the database for cascade operations and Unique Constraints.