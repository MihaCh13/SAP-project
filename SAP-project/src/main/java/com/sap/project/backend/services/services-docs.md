# 🧠 Package: com.sap.project.backend.services

This package contains the core business logic of the application. The Services are designed to be **transactional** (`@Transactional`), secure, and fully traceable via an audit and history system.
It is divided into two main components that ensure security, proper document workflow, and strict management of user permissions.

---
## 🛠️ General Characteristics
- **Security:** Built-in checks for roles and access rights on every action.
- **Audit and Traceability:** Every critical action is automatically recorded in the `AuditLog` table. Decisions made by reviewers are stored along with detailed comments.
- **Integrity:** Use of ID-based methods to avoid conflicts with object states.
- **Automation:** Integrated system for automatic notifications upon document status changes.

---

## 1. WorkflowService.java
Manages the lifecycle of documents, versions, the approval process, and data export.

### 🔄 Version Lifecycle
The system maintains strict linear versioning:
- **DRAFT**: Initial state. Only the author can edit it.
- **PENDING_REVIEW**: The document is submitted for approval. During this time, editing is **forbidden**.
- **APPROVED / REJECTED**: Final states. Any subsequent edit generates a new draft (V+1).

### 🔑 Key Methods
| Method | Role | Description |
|:---|:---|:---|
| `createDocument` | AUTHOR | Creates a new document and its first version (V1) with a `DRAFT` status. |
| `editDocument` | AUTHOR | Generates a new version (V+1). Blocks the operation if the current version is still under review. |
| `submitForReview` | AUTHOR | Submits the draft for review (changes status to `PENDING_REVIEW`). |
| `approveDocument` | REVIEWER | Approves the version, saves a comment, sets it as "Active", and sends a notification to the author. |
| `rejectDocument` | REVIEWER | Rejects the version, saves the reason (comment), and sends a notification to the author. |
| `viewVersion` | ANY | Checks permissions: `READER` sees only `APPROVED`, while the author also sees their `REJECTED` versions. |
| `exportVersionToPdf / Txt`| ANY | Generates a physical file (PDF or TXT) containing the data of a specific version. |

### 🛡️ Business Defenses
- **Conflict of Interest:** The author of a document cannot act as its reviewer (checked in `approveDocument` and `rejectDocument`).
- **Linearity:** A new version is always calculated based on the total number of versions + 1 (old versions cannot be overwritten).

---

## 2. UserService.java
Responsible for user administration and permissions management.

### 🔑 Administrative Functions
All methods here require the user performing the action to have the `ADMIN` role.

| Function | Description | Defense (Safety First) |
|:---|:---|:---|
| `assignRole` | Adds a new role to a user. | Checks if the user already has this role. |
| `revokeRole` | Removes a role. | **Admin Lockout:** An admin cannot remove their own `ADMIN` role. |
| `deactivateUser` | Suspends user access. | An admin cannot deactivate themselves. |
| `activateUser` | Restores access. | Prevents redundant updates if the account is already active. |

### 🛡️ Security and Audit
- **Role Validation:** Every method strictly verifies `adminUser.hasRole(Role.ADMIN)`.
- **Minimum Role Requirement:** A user cannot be left without any roles in the system (safeguard in `revokeRole`).
- **Audit Logging:** Methods invoke `logAction`, recording in detail which admin performed what action on which user.

---

## 📝 Workflow Example

```java
// 1. Author creates a document (V1 - DRAFT)
workflowService.createDocument(author, "Application", "Description", "Content...");

// 2. Author submits for review
workflowService.submitForReview(author, versionId);

// 3. Reviewer approves (Saves a comment and sends a notification)
workflowService.approveDocument(reviewer, versionId, "Everything looks good. Approved!");

// 4. User exports the approved document to PDF
byte[] pdfData = workflowService.exportVersionToPdf(vEntity);