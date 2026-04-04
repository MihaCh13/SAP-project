# Package: com.sap.project.backend.enums

This package contains all the enumerated types (Enums) that define the fixed lists of values within the system.

## 1. Role
Defines the access levels and user permissions within the system.
It includes the following system roles:
* **AUTHOR** - Author of documents.
* **REVIEWER** - Reviewer who inspects and approves/rejects versions.
* **READER** - Reader (read-only access).
* **ADMIN** - System administrator.

## 2. Status
Defines the lifecycle and state of a specific document version.
The statuses follow a strict workflow:
* **DRAFT** - Initial draft. Only the author can edit it before submission.
* **PENDING_REVIEW** - Submitted for review. Awaiting a decision from a reviewer.
* **APPROVED** - Approved version.
* **REJECTED** - Rejected version.