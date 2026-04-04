# 🏗️ Backend System Overview: Document Version Control System (DVCS)

This document provides a detailed technical description of the backend architecture, business logic, and security mechanisms implemented in the core of the system.

---

## 1. Architectural Model
The project is built on the **Spring Boot** framework, following the Separation of Concerns principle:

* **Domain Models (`backend.models` / `database.entities`)**: Objects encapsulating data, basic validation, and ORM mapping to the database.
* **Services (`backend.services`)**: The heart of the system (`WorkflowService`, `UserService`). This is where business rules, role-based access, workflow logic, and auditing are applied.
* **Controllers (`controllers`)**: The REST API layer that receives HTTP requests, validates them, and manages communication with external clients.
* **Persistence Layer (`database.repositories`)**: Uses Spring Data JPA to manage the lifecycle of objects in the database (H2).

---

## 2. Version Management (Workflow Logic)

The system guarantees **linear versioning** and data **Immutability** through the following mechanisms:

### 🛡️ State Machine
Every version passes through a strict cycle of statuses managed by the `WorkflowService`:
1.  **DRAFT**: Initial state. Allows editing only by the author.
2.  **PENDING_REVIEW**: The version is "locked". Creating new versions is forbidden while the document is under review.
3.  **APPROVED**: The version becomes official and active for the document. *(Automatically generates a notification to the author)*.
4.  **REJECTED**: The version remains in the history but is not accessible to end-users. *(Automatically generates a notification to the author)*.

### 🔒 Edit Protections
The `editDocument` method requires a parent version object to check its status. If the document is currently under review, the system blocks the creation of a new draft to prevent conflicts.

### 📄 Document Export
Approved versions can be exported to readable formats (**PDF** via the `OpenPDF` library, as well as **TXT**) directly through the API, preserving metadata (title, status, author).

---

## 3. Role Model and Security (RBAC)

The system implements **Role-Based Access Control**, defined in `UserService` and `WorkflowService`:

| Role | Permissions and Restrictions |
| :--- | :--- |
| **AUTHOR** | Can create documents and submit their versions for review. |
| **REVIEWER** | Can approve or reject versions. **Defense:** Cannot approve their own work. |
| **READER** | Sees only approved (`APPROVED`) versions of the documents. |
| **ADMIN** | Manages users and roles. **Defense:** Admin Lockout protection (cannot delete their own access). |

---

## 4. Audit & Notifications System

* **Audit Log:** All critical administrative actions (e.g., adding/removing roles, activating users) are automatically recorded in the `audit_logs` table with the exact timestamp, executor, and details of the change.
* **Notifications:** The system features a notifications module that informs users in real-time about system updates (e.g., a newly granted role) or status changes of their document.

---

## ⚠️ 5. Exception Handling

The backend communicates with the API layer via specific exceptions:
* `SecurityException`: Thrown upon a lack of permissions or a conflict of interest (e.g., an Author attempting to act as their own Reviewer).
* `IllegalStateException`: Thrown upon an attempt at an invalid status change (e.g., direct approval of a draft).
* `IllegalArgumentException`: Thrown upon an attempt to provide empty data, invalid IDs, or `null` objects.
* `RuntimeException`: Thrown upon issues with locating records in the database.

---

## ⚙️ 6. Technical Configuration
- **Database:** H2 In-Memory Database (configured in `application.properties`).
- **Dependency Injection:** All services are registered as `@Service` and injected via constructors.
- **Transactional Integrity:** All Service methods are annotated with `@Transactional`, ensuring that related records (e.g., approving a document and sending a notification) are executed as a single indivisible operation – either everything succeeds, or nothing is saved.