# 🚀 API Layer Documentation (Controllers Layer)

This document describes the implementation of the REST controllers within the system. They act as a "bridge" between the external world (client HTTP requests) and the internal business logic of our application (`Services`).

---

## 1. DocumentController (`/api/documents`)
This controller manages the lifecycle of documents and their respective versions.

### 📜 Fetch History (`getDocumentHistory`)
This method allows users to view the lifecycle of a specific document over time.
- **Input:** `Integer docId` (Unique document identifier) and `X-User-Id` header.
- **Logic:** Utilizes `VersionRepository` to fetch versions, then **filters** the results via the `canViewVersion()` method based on the user's role (e.g., users with the `READER` role cannot access unapproved drafts).
- **Result:** Returns a formatted and easy-to-read list (JSON array of objects) containing only essential metadata: Version, Status, Author, and Text Preview (instead of the entire heavy `VersionEntity`).

### ✅ Approve Version (`approveVersion`)
A critical function that drives the workflow forward.
- **Input:** `versionId` and a text comment.
- **Process:** 1. **Transformation:** Converts the raw `UserEntity` from the database into the `User` business model using `UserMapper.toModel()`.
  1. **Delegation:** Passes the execution directly to `workflowService.approveDocument()`.
  2. **Validation:** All security checks (whether the user has the `REVIEWER` role, whether they are attempting to approve their own document) are performed within `WorkflowService` to keep the controller clean.

### 💾 Document Export (`/txt` and `/pdf`)
- **Input:** `versionId` of the desired version.
- **Logic:** Allows downloading the document in the corresponding file format.
- **Protection:** Before exporting, the controller invokes `workflowService.viewVersion()` to ensure the requester has access rights to that specific version.

---

## 2. UserController (`/api/users`)
Manages authentication and user administration.

* **`POST /login`**: Accepts `username` and `password`. Performs security checks (account existence and active status) and returns the `userId` along with assigned roles.
* **`POST /register`**: A protected endpoint (requires `ADMIN` privileges). Creates new users and assigns them initial roles.
* **`POST /add-role`**: A protected endpoint. Adds new roles to existing users and automatically generates a system notification to the respective user regarding their new permissions.

---

## 3. NotificationController (`/api/notifications`)
Manages system notifications for users.

* **`GET /`**: Retrieves all unread messages for the provided `X-User-Id`.
* **Logic:** Automatically extracts only the text content of the messages and marks the `NotificationEntity` objects as read (`isRead = true`) in the database before returning them to the client.

---

## 🏗️ Integration with Other Layers

| Layer           | Component         | Role in this context                                                                                  |
|:----------------|:------------------|:------------------------------------------------------------------------------------------------------|
| **Persistence** | Repositories      | Used for quick, direct data reads (history, users, notifications) from the database.                  |
| **Business**    | `WorkflowService` | Handles all heavy business logic: status validation, approval, rejection, and PDF generation.         |
| **Mappers**     | `UserMapper`      | Ensures secure data transition by transforming `UserEntity` (DB object) into `User` (Business model). |

---

## 💡 Important for Developers
The API layer strictly adheres to the **Separation of Concerns** principle. Controllers **do not manually map** complex objects nor perform business validations (except for basic checks for `null` or empty fields in the request). They rely on mappers for secure data delivery and delegate the execution of business rules to the Service layer. This ensures that changes in the database structure will not directly "break" the application's business logic.