package com.sap.project.backend.services;

import com.sap.project.backend.enums.Role;
import com.sap.project.backend.enums.Status;
import com.sap.project.backend.models.Document;
import com.sap.project.backend.models.User;
import com.sap.project.backend.models.Version;
import com.sap.project.database.repositories.DocumentRepository;
import com.sap.project.database.repositories.VersionRepository;
import org.springframework.stereotype.Service;

@Service

public class WorkflowService {

    // Връзки към базата данни
    private final DocumentRepository documentRepository;
    private final VersionRepository versionRepository;

    // Конструктор за Dependency Injection - Spring ще ни ги "достави" автоматично
    public WorkflowService(DocumentRepository documentRepository, VersionRepository versionRepository) {
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
    }

    // 1. Създаване на нов документ и първата му чернова
    public Document createDocument(User user, int documentId, String title, String description, String content) {
        // ЗАЩИТА: Проверка за валидни входни обекти
        if (user == null) {
            throw new IllegalArgumentException("Error: The system cannot identify the user (null).");
        }

        // Проверка: Дали потребителят притежава роля AUTHOR
        if (!user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only users with the AUTHOR role can create documents.");
        }

        // Създаваме контейнера за документа
        Document newDocument = new Document(documentId, title, description, user.getId());

        // Създаваме първата версия (чернова). versionId тук е примерно 1, parentVersionId e null
        Version initialVersion = new Version(1, documentId, 1, content, user.getId(), null);

        // Вече можем да използваме хранилищата (repositories) за запис, когато сме готови!
        // Напр: documentRepository.save(...);

        // Забележка: В реална среда тук ще се извика функцията на архитекта , за да запишем обектите във файла!
        // Напр.: fileRepository.saveDocument(newDocument);
        //        fileRepository.saveVersion(initialVersion);

        return newDocument;
    }

    // 2. Редактиране на съществуващ документ (Създаване на V2, V3...)
    public Version editDocument(User user, Document document, int newVersionId, int newVersionNumber, String newContent, int parentVersionId) {
        if (user == null || document == null) throw new IllegalArgumentException("Error: Invalid data.");

        // Проверка: Има ли роля Автор?
        if (!user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only users with the AUTHOR role can edit documents.");
        }

        // БЕЗ ПРОВЕРКА ЗА СОБСТВЕНОСТ: Позволяваме на авторите взаимно да си редактират документите!
        // Генерираме новата чернова, като създател на ТАЗИ ВЕРСИЯ е текущият потребител.
        return new Version(newVersionId, document.getId(), newVersionNumber, newContent, user.getId(), parentVersionId);
    }

    // 3. Изпращане за преглед
    public void submitForReview(User user, Version version) {
        if (user == null || version == null) {
            throw new IllegalArgumentException("Error: User and version are required.");
        }

        // Проверка: Дали потребителят притежава роля AUTHOR
        if (!user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only users with the AUTHOR role can submit documents for review.");
        }

        // Проверка: Дали този потребител е собственикът на версията
        if (user.getId() != version.getCreatedBy()) {
            throw new SecurityException("Error: You cannot submit someone else's documents for review.");
        }

        // Действие: Сменяме статуса чрез логиката на самата версия
        version.submitForReview();
    }

    // 4. Одобряване на документ
    public void approveDocument(User user, Version version, Document document) {
        if (user == null || version == null || document == null) {
            throw new IllegalArgumentException("Error: A valid user, version, and document are required for approval.");
        }

        // Проверка 1: Дали потребителят притежава роля REVIEWER
        if (!user.hasRole(Role.REVIEWER)) {
            throw new SecurityException("Error: Only users with the REVIEWER role can approve documents.");
        }

        // Проверка 2: Конфликт на интереси - не можеш да одобряваш свой собствен документ
        if (user.getId() == version.getCreatedBy()) {
            throw new SecurityException("Error: You cannot approve your own document, even if you have reviewer permissions!");
        }

        // Действие: Одобряваме версията (това сменя статуса и записва кой го е одобрил)
        version.approve(user.getId());

        // Действие: Обновяваме документа, че това вече е активната му версия
        document.setActiveVersionId(version.getId());
    }

    // 5. Отхвърляне на документ
    public void rejectDocument(User user, Version version) {
        if (user == null || version == null) {
            throw new IllegalArgumentException("Error: A valid user and version are required for rejection.");
        }

        // Проверка 1: Дали потребителят притежава роля REVIEWER
        if (!user.hasRole(Role.REVIEWER)) {
            throw new SecurityException("Error: Only users with the REVIEWER role can reject documents.");
        }

        // Проверка 2: Не можеш да отхвърляш свой собствен документ
        if (user.getId() == version.getCreatedBy()) {
            throw new SecurityException("Error: You cannot reject your own edit!");
        }

        // Действие: Отхвърляме версията
        version.reject();
    }

    // 6. Четене на документ (За Читатели)
    public void viewVersion(User user, Version version) {
        if (user == null || version == null) throw new IllegalArgumentException("Error: Invalid data.");

        // Ако потребителят е САМО читател (няма права на Автор или Рецензент),
        // той може да чете САМО одобрени версии!
        boolean isOnlyReader = user.hasRole(Role.READER) && !user.hasRole(Role.AUTHOR) && !user.hasRole(Role.REVIEWER) && !user.hasRole(Role.ADMIN);

        if (isOnlyReader && version.getStatus() != Status.APPROVED) {
            throw new SecurityException("Error: Readers only have access to officially approved versions of the document.");
        }

        // Ако стигнем дотук, потребителят има право да чете документа (ще върнем съдържанието към конзолата)
    }
}