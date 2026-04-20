# 🔄 Transformation Layer Documentation (Mappers)

The `com.sap.project.database.mappers` package is responsible for converting objects between the persistence layer (JPA Entities) and the business logic layer (Domain Models). This separation ensures that changes in the database structure will not directly break the business rules.

---

## 1. Mapping Concept

The system follows the **Separation of Concerns** principle. Mappers are defined as static utility classes that perform deep copying of data, providing:
- **Type Safety:** Converting database strings into specific Java Enums.
- **Data Protection:** Preventing the exposure of raw Entity objects to the external layers of the application.

---

## 2. UserMapper.java

This mapper is responsible for the transformation of user data and their permissions.

### 🛠️ Methods:
- **`toModel(UserEntity entity)`**:
  - Converts the list of `RoleEntity` into a `Set<Role>`.
  - **Error Handling:** Built-in safety logic – if the role name in the database is invalid or corrupted, the system automatically assigns the base `READER` role instead of terminating the operation (Fail-safe).
  - Constructs a clean `User` model for the backend services.

- **`toEntity(User model)`**:
  - Prepares the data for persisting back into the database.
  - Transfers the base fields such as `username`, `email`, and `passwordHash`.

---

## 3. VersionMapper.java

Manages the transformation of document versions, which is critical for the functioning of the **WorkflowService**.

### 🛠️ Methods:
- **`toModel(VersionEntity entity)`**:
  - **ID Mapping:** Extracts the IDs of related objects (`DocumentEntity`, `UserEntity`) to populate the flat structure of the `Version` business model.
  - **Hierarchy Handling:** Checks if a parent version exists (`parentVersion`). If it is missing (as in V1), it correctly assigns `null`, maintaining the linear history of the document.

---

## 📊 Transformation Comparison Table

| From (Source)   | To (Target)   | Data Processing                                      |
|:----------------|:--------------|:-----------------------------------------------------|
| `UserEntity`    | `User`        | Conversion of `Set<RoleEntity>` ➔ `Set<Role>` (Enum) |
| `VersionEntity` | `Version`     | Extraction of references (IDs) from objects          |
| `String` (DB)   | `Role` (Enum) | Case-insensitive conversion with fallback logic      |

---

## ⚠️ Technical Notes for Developers

1. **Lazy Initialization:** Mappers should be invoked within an active transaction if the `Entity` objects contain `Lazy`-loaded associations (such as user roles).
2. **Stateless:** The classes are designed without internal state (Stateless), making them thread-safe and easy to test.
3. **Evolution:** When adding new fields to the tables, the mappers are the first place where logic must be added to transfer this data to the models.