# ⚙️ Configuration: DataInitializer (Data Seeding)

The `com.sap.project.config` package contains configuration classes for the Spring Boot application. The most important among them is `DataInitializer.java`, which serves to automatically populate the initial data (Data Seeding) into the database (H2) upon every server startup.

This class is critical for facilitating local development, testing API endpoints, and preparing the system for demonstration.

---

## 🎯 Primary Goals of DataInitializer

1.  **Automation:** Eliminates the need for writing manual SQL scripts to create mandatory system records (e.g., roles).
2.  **Test Readiness:** Provides the API and QA teams with pre-configured users with diverse roles and a ready workflow for testing.
3.  **Idempotence (Safety):** Guarantees that even with multiple server restarts, data will not be duplicated or corrupted.

---

## 🛠️ What is Automatically Created?

Upon starting the Spring Boot application, the following steps are executed:

### 1. System Roles
The four core roles are created if they do not already exist in the `roles` table:
* `ADMIN`
* `REVIEWER`
* `AUTHOR`
* `READER`

### 2. Test Users
A set of users is created covering all possible scenarios (pure and combined roles). All of them are created with a hashed password and marked as active (`isActive = true`).

| Username        | Password   | Roles                         | Testing Description                                          |
|:----------------|:-----------|:------------------------------|:-------------------------------------------------------------|
| **admin**       | `pass123`  | `ADMIN`                       | Testing the `UserService` (assigning/revoking roles).        |
| **reviewer**    | `rev123`   | `REVIEWER`                    | Testing the approval and rejection of versions.              |
| **author**      | `auth123`  | `AUTHOR`                      | Testing the creation of new documents.                       |
| **reader**      | `read123`  | `READER`                      | Testing safeguards when attempting to read drafts.           |
| **lead_author** | `lead123`  | `AUTHOR`, `REVIEWER`          | Testing conflict of interest (cannot review their own work). |
| **super_user**  | `super123` | `ADMIN`, `AUTHOR`, `REVIEWER` | "God" mode in the system – has full access to everything.    |

### 3. Workflow Seeding
To allow the API team to immediately test document approval, the following is generated:
* One test **Document** authored by `author`.
* One initial **Version (V1)** with the status `PENDING_REVIEW`, which is already awaiting a reviewer's inspection.

---

## 🛡️ Best Practices and Safeguards (Under the Hood)

The code in `DataInitializer` applies several important technical standards:

* **`@Transactional`:** The entire initialization process is wrapped in a single transaction. If an error occurs during data creation, the whole operation is rolled back to prevent the database from being left in an invalid state.
* **Safe Set Creation:** Uses `new HashSet<>(Set.of(...))` when assigning roles. This ensures the role collection