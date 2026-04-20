# Package: com.sap.project.backend.models

This package contains the core business objects (Entities) that correspond to the database tables.

## 1. Version (Document Version)
This class represents a specific version of a given document.

**Core Principles and Defenses (Defensive Programming):**
* **Immutability:** The `content` and identifiers are `final`. Once created, the version cannot be edited. If changes are needed, a new version is created.
* **Data Validation:** Strict checks are built into the constructor to ensure that identifiers are valid positive numbers and that the `content` can never be empty.
* **Workflow:** The class internally manages its status transitions through business methods (`submitForReview()`, `approve()`, `reject()`) to prevent invalid state changes. Approval is protected and requires a valid reviewer ID.

**Key Fields:**
* `versionNumber`: The sequential number of the version for the corresponding document.
* `content`: A full copy (snapshot) of the text/content.
* `parentVersionId`: The ID of the previous version upon which the current one is based.

## 2. Document
This class acts as the main container, storing only the metadata of a given document, while its actual content resides in the separate versions.

**Core Principles and Defenses (Defensive Programming):**
* **Separation of Concerns:** The document does not store text. It serves to logically group all its versions and carries the global information (title, description, active status).
* **Data Protection:** The core identifiers and creation info (`id`, `createdBy`, `createdAt`) are `final` and cannot be modified after initial creation.
* **Validation and Null-Safety:** Strict checks prevent the creation of documents without a title or with invalid IDs. The description is protected against `NullPointerException` (if `null` is provided, it is saved as an empty string `""`).
* **State Management:** The class uses business methods like `archive()` and `activate()` to control its lifecycle, rather than allowing direct modifications to the `isActive` field.

**Key Fields:**
* `title` and `description`: Metadata that can be freely edited without requiring the creation of a new text version.
* `activeVersionId`: A reference to the ID of the currently officially approved (active) version. It is initially `null` until a draft is approved. It is protected to accept only positive numbers.

## 3. User
This class represents the system participants and their access credentials. It is the foundation of the Role-Based Access Control (RBAC) model and permissions management.

**Core Principles and Defenses (Defensive Programming):**
* **Identity Protection:** The `id`, `username`, and `email` fields are `final`. They are strictly validated upon creation to prevent incomplete profiles.
* **Role Relations (Many-to-Many):** The class is fully synchronized with the database, maintaining a collection (set) of roles via `Set<Role> roles`. This allows a user to combine multiple permissions.
* **Principle of Least Privilege:** If no explicit role is provided during registration, the system automatically assigns the base `READER` role.
* **Security Encapsulation:**
  * External access to the roles set is granted exclusively through `Collections.unmodifiableSet()`, preventing external manipulation of permissions.
  * The `removeRole()` method contains safeguard logic that prevents the deletion of a user's last remaining role.
* **Access Management:** Instead of deleting users, the class implements `activate()` and `deactivate()` methods, which keeps their action history intact.