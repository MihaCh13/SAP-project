# 🌐 Package: com.sap.project.api

This package manages the communication between the external world and the core business logic of the system. It contains the REST controllers and the Data Transfer Objects (DTOs).

## 📦 Data Transfer Objects (DTO)
We use DTOs to validate incoming payloads and to encapsulate and protect the internal database structure.

### 1. CreateDocumentRequestDTO
Used when creating a new document.
- **title**: The title of the document.
- **description**: A brief description.
- **content**: The initial content that will form Version 1 (V1).

---

## 🚦 Request Flow
1. The client sends a JSON payload (e.g., from the `ConsoleClient`).
2. Spring Boot automatically maps the payload to a **DTO**.
3. The controller passes the DTO data to the `WorkflowService`.
4. The `WorkflowService` creates the actual **Entities** and persists them into the database.