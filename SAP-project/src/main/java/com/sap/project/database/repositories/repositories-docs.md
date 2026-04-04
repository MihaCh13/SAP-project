# 🗄️ Repository Documentation (Data Access Layer)

The `com.sap.project.database.repositories` package contains the interfaces that manage direct communication with the database. They extend `JpaRepository`, which provides built-in methods for CRUD (Create, Read, Update, Delete) operations without the need to write manual SQL.

---

## 1. General Concept

The repositories work directly with **Database Entities** and are utilized by the **Services** layer via Dependency Injection (`@Autowired`). All methods here are executed within a transaction, ensuring data integrity. The system relies heavily on the *Query Method Derivation* feature of Spring Data JPA – automatically generating SQL queries based on the method name.

---

## 2. Interface Descriptions

### 👤 User and Role Management
* **`UserRepository`**: Responsible for managing user data.
  * *Custom Methods:* `findByUsername(String username)`, `findByEmail(String email)` (returns `Optional`).
* **`RoleRepository`**: Manages system access levels (RBAC).
  * *Custom Methods:* `findByName(String name)`.

### 📄 Document and Version Management
* **`DocumentRepository`**: Manages document metadata and their global statuses (e.g., archiving).
* **`VersionRepository`**: Manages the content and history of versions.
  * *Custom Methods:* `findByDocumentId(Integer documentId)` – Retrieves the full version history for a specific document.
* **`DocumentActiveVersionRepository`**: A specialized repository for quick access to the currently officially approved version of a given document (works with the `@MapsId` relation).

### ⚙️ Communication and Audit
* **`NotificationRepository`**: Manages system notifications for users.
  * *Custom Methods:* `findByUserIdAndIsReadFalse(Integer userId)` – Finds all unread notifications for a given user.
* **`CommentRepository`**: Stores reviewer feedback (comments) linked to a specific version.
* **`AuditLogRepository`**: Stores historical records of every critical administrative action in the system (who did what and when).

---

## 🛠️ Technical Details for the Team

| Feature          | Description                                                                                                                                                                |
|:-----------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Technology**   | Spring Data JPA (Hibernate under the hood)                                                                                                                                 |
| **Database**     | H2 Database (In-Memory for development) / SQL database compatible                                                                                                          |
| **Query Logic**  | Uses *Query Derivation* – Spring automatically translates names like `findByUserIdAndIsReadFalse` into precise and optimized SQL `SELECT` queries.                         |
| **Entity Types** | All repositories work **strictly** with raw `Entity` objects. The transformation to business models (`Domain Models`) occurs in the Controller/Service layers via mappers. |