# 🗄️ Документация на Репозитория (Data Access Layer)

Пакетът `com.sap.project.database.repositories` служи като връзка между бизнес логиката и базата данни. Всички интерфейси разширяват `JpaRepository`, което автоматизира стандартните CRUD операции.

---

## 1. Общ списък на репозиториите

| Репозитори | Свързано Entity | Основна роля |
| :--- | :--- | :--- |
| `UserRepository` | `UserEntity` | Управление на профили и данни за вход. |
| `RoleRepository` | `RoleEntity` | Управление на достъпа (RBAC). |
| `DocumentRepository` | `DocumentEntity` | Метаданни за документите. |
| `VersionRepository` | `VersionEntity` | Пълна история на съдържанието. |
| `CommentRepository` | `CommentEntity` | Коментари на рецензенти към версиите. |
| `AuditLogRepository` | `AuditLog` | Проследяване на действията в системата. |
| `DocumentActiveVersionRepository` | `DocumentActiveVersion` | Маркиране на текущо одобрената версия. |

---

## 2. Детайлно описание и специфични методи

### 👤 UserRepository
Използва се за автентикация и проверка на уникалност на данните.
- **Custom Methods:**
  - `findByUsername(String username)`: Използва се при вход в системата.
  - `findByEmail(String email)`: Използва се за предотвратяване на дублиращи се регистрации.

### 🔑 RoleRepository
Критичен компонент за `UserService` при управление на правата.
- **Custom Method:**
  - `findByName(String name)`: Намира `RoleEntity` по името на ролята от енъма (напр. "ADMIN").

### 📑 VersionRepository
Сърцето на управлението на версиите.
- **Custom Method:**
  - `findByDocumentId(Integer documentId)`: Извлича всички версии на даден документ, позволявайки визуализация на историята му.
- **Употреба:** Всеки път, когато авторът редактира документ или рецензент го преглежда, `WorkflowService` комуникира с това репозитори.

### 🧾 AuditLogRepository
Осигурява пълна прозрачност (Audit Trail) чрез съхраняване на историята на административните действия и промените по работните потоци.

### 💬 CommentRepository
Позволява на рецензентите да добавят обратна връзка към версии със статус `APPROVED` или `REJECTED`. Тези коментари са трайно свързани с конкретната версия.

### 🔗 DocumentActiveVersionRepository
Специализирано репозитори, което поддържа връзката "1 Документ ➔ 1 Активна версия". Когато версия се одобри, това репозитори се актуализира, за да сочи към новата `APPROVED` версия.

---

## 🛠️ Технически стек
- **Framework:** Spring Data JPA
- **ORM:** Hibernate
- **Database:** H2 (In-Memory)
- **Транзакции:** Всички репозитории работят под контрола на `@Transactional` анотациите в Service слоя, осигурявайки ACID съвместимост.

---