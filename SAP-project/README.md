# SAP Secure Document Manager

A robust, enterprise-level Document Management System (DMS) built with Java and Spring Boot. This project features a secure REST API backend and a dynamic, interactive Console Command Line Interface (CLI) client.

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Strict security enforcing roles like `ADMIN`, `AUTHOR`, `REVIEWER`, and `READER`.
* **Workflow State Machine:** Documents follow a strict business logic lifecycle: `DRAFT` ➔ `PENDING_REVIEW` ➔ `APPROVED` or `REJECTED`.
* **Version Control:** Complete tracking of document history and edits over time.
* **Notification System:** Inbox polling system alerting users in real-time about role updates, approvals, or rejections.
* **Export Capabilities:** Generate professional `.pdf` and `.txt` reports of any approved document.
* **Dynamic CLI:** An intelligent console client that adapts its UI/menu options based on the logged-in user's roles and permissions.

## 🛠️ Tech Stack

* **Backend:** Java, Spring Boot, Spring Web, Spring Data JPA
* **Database:** H2 (In-Memory Database) with Hibernate ORM
* **Client:** Core Java (`java.net.http.HttpClient` for API communication)
* **Libraries:** `OpenPDF` / `iText` (for PDF generation)

## 🏃‍♂️ How to Run

1.  **Start the Backend:** Run the main Spring Boot application class. The H2 database will automatically initialize and populate default roles and users via the `data.sql` script.
2.  **Start the Client:** Run the `main` method inside `ConsoleClient.java`.
3.  **Login:** Use one of the pre-configured credentials from the database to explore the system.

## 🔑 Default Credentials (from data.sql)

* **SuperAdmin** (Role: ADMIN) - Username: `SuperAdmin` | Password: `admin123`
* **Author** (Role: AUTHOR) - Username: `Ivan_Author` | Password: `pass123`
* **Reviewer** (Role: REVIEWER) - Username: `Petyo_Reviewer` | Password: `pass456`

============================================================================================================
# SAP Secure Document Manager

Надеждна система за управление на документи (DMS) на корпоративно ниво, изградена с Java и Spring Boot. Проектът включва защитен REST API бекенд и динамичен, интерактивен конзолен клиент (CLI).

## 🚀 Основни функционалности

* **Контрол на достъпа базиран на роли (RBAC):** Стриктна сигурност, прилагаща роли като `ADMIN`, `AUTHOR`, `REVIEWER` и `READER`.
* **Машина на състоянията (Workflow):** Документите следват строг жизнен цикъл: `DRAFT` ➔ `PENDING_REVIEW` ➔ `APPROVED` или `REJECTED`.
* **Контрол на версиите:** Пълно проследяване на историята на документите и направените редакции.
* **Система за известия:** Система за известяване, която алармира потребителите при промяна на роли, одобрение или отхвърляне на техни документи.
* **Експортиране на файлове:** Генериране на професионални `.pdf` и `.txt` отчети.
* **Динамичен конзолен клиент:** Интелигентен клиент, който адаптира менюто си спрямо правата на логнатия потребител.

## 🛠️ Използвани технологии

* **Бекенд:** Java, Spring Boot, Spring Web, Spring Data JPA
* **База данни:** H2 (In-Memory Database) с Hibernate ORM
* **Клиент:** Core Java (`java.net.http.HttpClient` за комуникация с API-то)
* **Библиотеки:** `OpenPDF` / `iText` (за генериране на PDF)

## 🏃‍♂️ Как да стартирате проекта

1.  **Стартиране на Сървъра:** Стартирайте главния Spring Boot клас. Базата данни H2 ще се инициализира автоматично и ще зареди първоначалните потребители чрез скрипта `data.sql`.
2.  **Стартиране на Клиента:** Стартирайте метода `main` в класа `ConsoleClient.java`.
3.  **Вход в системата:** Използвайте някой от предварително зададените профили, за да тествате системата.

## 🔑 Начални профили (от data.sql)

* **Администратор** (Роля: ADMIN) - Потребител: `SuperAdmin` | Парола: `admin123`
* **Автор** (Роля: AUTHOR) - Потребител: `Ivan_Author` | Парола: `pass123`
* **Рецензент** (Роля: REVIEWER) - Потребител: `Petyo_Reviewer` | Парола: `pass456`