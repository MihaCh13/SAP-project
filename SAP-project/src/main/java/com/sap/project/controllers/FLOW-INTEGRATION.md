# 🔄 Request Lifecycle

This document explains how data flows through the system's layers, from the reception of an HTTP request to its persistence in the database.

---

## 🌊 Process Flow: "Document Approval"

This step demonstrates the power of the separated architecture (Separation of Concerns) and how the layers interact:

1. **Request (Client):** A user (Reviewer) sends a `PUT` request to `/api/documents/versions/{versionId}/approve` with an `X-User-Id` header and a comment.
2. **Controller Layer (`DocumentController`):**
   - Receives the request and validates the basic parameters.
   - Retrieves the `UserEntity` from the database by the provided ID and converts it into a business model via `UserMapper.toModel()` to protect the data.
   - Delegates the core execution to the service: `workflowService.approveDocument(reviewerModel, versionId, comment)`.
3. **Service Layer (`WorkflowService`):**
   - Initiates a `@Transactional` block (all-or-nothing execution; rolls back on error).
   - Extracts the `VersionEntity` and the associated `DocumentEntity`.
   - **Business Validation:** Verifies that the user has the `REVIEWER` role, is not the author of the same document, and that the version is in the `PENDING_REVIEW` status.
   - Changes the status to `APPROVED` and updates the active version of the document.
   - Creates a record for the comment.
   - Generates a system notification (`NotificationEntity`) for the author.
4. **Database Layer (H2 / Spring Data JPA):** Automatically executes all `UPDATE` and `INSERT` queries.
5. **Response:** The controller captures the result and returns an HTTP status `200 OK` with a success message.

---

## 🛠️ Technologies Used in the Integration

- **Dependency Injection (`@Autowired`):** Connects controllers with services and repositories, ensuring loose coupling.
- **Mappers:** Isolate the database from the business logic, facilitating a secure data transition between the `Entity` (Hibernate) and the `Model` (Business Logic).
- **Java Stream API:** Actively used in controllers for the efficient processing of collections (e.g., transforming a list of `NotificationEntity` objects into a list of `String` messages in the `NotificationController`).
- **Defensive API Design:** Catching exceptions via `try-catch` blocks at the controller level and transforming them into appropriate HTTP status codes (`400 Bad Request`, `500 Internal Server Error`).