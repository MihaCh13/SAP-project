package com.sap.project.backend.services;
import com.sap.project.backend.enums.Role;
import com.sap.project.backend.enums.Status;
import com.sap.project.backend.models.Document;
import com.sap.project.backend.models.User;
import com.sap.project.backend.models.Version;
import com.sap.project.database.repositories.DocumentRepository;
import com.sap.project.database.repositories.NotificationRepository;
import com.sap.project.database.repositories.VersionRepository;
import com.sap.project.database.repositories.UserRepository; // НОВО: За да намираме потребителите
import com.sap.project.database.entities.DocumentEntity;
import com.sap.project.database.entities.NotificationEntity;
import com.sap.project.database.entities.VersionEntity;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.io.ByteArrayOutputStream;
@Service
public class WorkflowService {

    // Връзки към базата данни
    private DocumentRepository documentRepository;
    private VersionRepository versionRepository;
    private UserRepository userRepository; // НОВО
    @Autowired private NotificationRepository notificationRepository;

    // Конструктор за Dependency Injection - Spring ще ни ги "достави" автоматично
    @Autowired
    public WorkflowService(DocumentRepository documentRepository, VersionRepository versionRepository, UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.userRepository = userRepository;
    }

    // 1. Създаване на нов документ и първата му чернова
    public Document createDocument(User user, int documentId, String title, String description, String content) {
        // 1. Проверките на Михаела (не ги пипаме)
        if (user == null || !user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only authors can create documents.");
        }

        // 2. Подготвяме документа за Петьо
        DocumentEntity docEntity = new DocumentEntity();
        // docEntity.setId(documentId);  <-- ТОВА ГО ИЗТРИЙ ИЛИ КОМЕНТИРАЙ. Базата сама ще го сложи.
        docEntity.setTitle(title);
        docEntity.setDescription(description);
        
        userRepository.findById(user.getId()).ifPresent(u -> docEntity.setCreatedBy(u));

        // ВАЖНО: Запазваме документа първо и вземаме обекта, на който базата ВЕЧЕ е дала ID
        DocumentEntity savedDoc = documentRepository.save(docEntity);

        // 3. Сега правим версията и я закачаме за ВЕЧЕ записания документ
        VersionEntity verEntity = new VersionEntity();
        verEntity.setDocument(savedDoc); // Ползваме обекта от базата, той вече има вярното ID
        verEntity.setContent(content);
        verEntity.setVersionNumber(1);
        verEntity.setStatus(Status.DRAFT);
        
        userRepository.findById(user.getId()).ifPresent(u -> verEntity.setCreatedBy(u));
        versionRepository.save(verEntity);

        // Връщаме ID-то, което базата е генерирала реално
        return new Document(savedDoc.getId(), title, description, user.getId());
    }

    // 2. Редактиране на съществуващ документ (Създаване на V2, V3...)
    public Version editDocument(User user, Document document, Version parentVersion, int newVersionId, int newVersionNumber, String newContent) {
        if (user == null || document == null || parentVersion == null) {
            throw new IllegalArgumentException("Error: Invalid input data (User, Document, or ParentVersion is null).");
        }
        // Проверка: Има ли роля Автор?
        if (!user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only users with the AUTHOR role can edit documents.");
        }

        // ЛОГИЧЕСКА ДУПКА: Не позволяваме редакция, ако документът е "заключен" за преглед
        if (parentVersion.getStatus() == Status.PENDING_REVIEW) {
            throw new IllegalStateException("Error: Cannot create a new version while the current one is PENDING_REVIEW.");
        }

        // БЕТОНИРАНЕ: Записваме новата версия в базата на Петьо
        documentRepository.findById(document.getId()).ifPresent(docEntity -> {
            VersionEntity newVerEntity = new VersionEntity();
            newVerEntity.setDocument(docEntity);
            newVerEntity.setContent(newContent);
            newVerEntity.setVersionNumber(newVersionNumber);
            newVerEntity.setStatus(Status.DRAFT);
            userRepository.findById(user.getId()).ifPresent(u -> newVerEntity.setCreatedBy(u));
            versionRepository.save(newVerEntity);
        });

        // БЕЗ ПРОВЕРКА ЗА СОБСТВЕНОСТ: Позволяваме на авторите взаимно да си редактират документите!
        // Генерираме новата чернова, като създател на ТАЗИ ВЕРСИЯ е текущият потребител.
        return new Version(newVersionId, document.getId(), newVersionNumber, newContent, user.getId(), parentVersion.getId());
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

        // ПРОВЕРКА НА СТАТУС: Само Draft може да ходи към Review
        if (version.getStatus() != Status.DRAFT) {
            throw new IllegalStateException("Error: Only versions in DRAFT status can be submitted for review.");
        }

        version.submitForReview(); // Тук статусът става PENDING_REVIEW

        // БЕТОНИРАНЕ: Обновяваме статуса в SQL таблицата
        versionRepository.findById(version.getId()).ifPresent(vEntity -> {
            vEntity.setStatus(Status.PENDING_REVIEW);
            versionRepository.save(vEntity);
        });
    }

    // 4. Одобряване на документ
    public void approveDocument(User user, Version version, Document document) {
        if (user == null || version == null || document == null) {
            throw new IllegalArgumentException("Error: A valid user, version, and document are required for approval.");
        }

        if (!user.hasRole(Role.REVIEWER)) {
            throw new SecurityException("Error: Only users with the REVIEWER role can approve documents.");
        }

        if (user.getId() == version.getCreatedBy()) {
            throw new SecurityException("Error: You cannot approve your own document!");
        }

        if (version.getStatus() != Status.PENDING_REVIEW) {
            throw new IllegalStateException("Error: Only versions in PENDING_REVIEW status can be approved.");
        }

        // 1. Промяна в Java обектите (в паметта)
        version.approve(user.getId());
        document.setActiveVersionId(version.getId());

        // 2. БЕТОНИРАНЕ: Обновяваме само Версията (тук Петьо има всички полета)
        versionRepository.findById(version.getId()).ifPresent(vEntity -> {
            vEntity.setStatus(Status.APPROVED);
         // ПРАЩАМЕ ИЗВЕСТИЕ НА АВТОРА
            userRepository.findById(version.getCreatedBy()).ifPresent(author -> {
                NotificationEntity notif = new NotificationEntity();
                notif.setUser(author);
                notif.setMessage("Good news! Your document V" + version.getVersionNumber() + " was APPROVED by " + user.getUsername() + ".");
                notificationRepository.save(notif);
            });
            // Намираме потребителя в базата, за да го сетнем като одобрител
            userRepository.findById(user.getId()).ifPresent(userEntity -> {
                vEntity.setApprovedBy(userEntity); 
            });
            
            versionRepository.save(vEntity);
        });

        // 3. БЕТОНИРАНЕ: Документът
        documentRepository.findById(document.getId()).ifPresent(dEntity -> {
            // Тъй като Петьо няма setActiveVersionId, просто отбелязваме, че документът е активен
            dEntity.setActive(true); 
            documentRepository.save(dEntity);
        });
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

        // Логика за статус
        if (version.getStatus() != Status.PENDING_REVIEW) {
            throw new IllegalStateException("Error: Only versions in PENDING_REVIEW status can be rejected.");
        }

        // Действие: Отхвърляме версията
        version.reject();

        // БЕТОНИРАНЕ: Записваме статуса REJECTED
        versionRepository.findById(version.getId()).ifPresent(vEntity -> {
            vEntity.setStatus(Status.REJECTED);
            versionRepository.save(vEntity);
        });
     // ПРАЩАМЕ ИЗВЕСТИЕ НА АВТОРА
        userRepository.findById(version.getCreatedBy()).ifPresent(author -> {
            NotificationEntity notif = new NotificationEntity();
            notif.setUser(author);
            notif.setMessage("Attention! Your document V" + version.getVersionNumber() + " was REJECTED by " + user.getUsername() + ".");
            notificationRepository.save(notif);
        });
    }

    // 6. Четене на документ (За Читатели)
    public void viewVersion(User user, Version version) {
        if (user == null || version == null) {
            throw new IllegalArgumentException("Error: Invalid data.");
        }
        // Ако потребителят е САМО читател (няма права на Автор или Рецензент), той може да чете САМО одобрени версии!
        boolean isOnlyReader = user.hasRole(Role.READER) && !user.hasRole(Role.AUTHOR) && !user.hasRole(Role.REVIEWER) && !user.hasRole(Role.ADMIN);
        if (isOnlyReader && version.getStatus() != Status.APPROVED) {
            throw new SecurityException("Error: Readers only have access to officially APPROVED versions.");
        }

        // Правило 2: Ако версията е REJECTED, само Авторът и Рецензентът (или Админът) могат да я виждат
        if (version.getStatus() == Status.REJECTED) {
            boolean hasAccess = user.getId() == version.getCreatedBy() || user.hasRole(Role.REVIEWER) || user.hasRole(Role.ADMIN);
            if (!hasAccess) {
                throw new SecurityException("Error: Access denied. REJECTED versions are only visible to the owner and reviewers.");
            }
        }
    }
    public String exportVersionToText(VersionEntity vEntity) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== SAP DOCUMENT EXPORT ===\n");
        sb.append("Title: ").append(vEntity.getDocument().getTitle()).append("\n");
        sb.append("Version №: ").append(vEntity.getVersionNumber()).append("\n");
        sb.append("Status: ").append(vEntity.getStatus()).append("\n");
        sb.append("Author: ").append(vEntity.getCreatedBy() != null ? vEntity.getCreatedBy().getUsername() : "Unknown").append("\n");
        
        if (vEntity.getApprovedBy() != null) {
            sb.append("Approved by: ").append(vEntity.getApprovedBy().getUsername()).append("\n");
        }
        
        sb.append("---------------------------\n");
        sb.append("Content:\n");
        sb.append(vEntity.getContent()).append("\n");
        sb.append("===========================\n");
        
        return sb.toString();
    }
    public byte[] exportVersionToPdf(VersionEntity vEntity) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        // 1. Използваме ПЪЛНОТО име на класа от библиотеката, за да няма объркване
        com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4);
        com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
        
        document.open();
        
        // 2. Добавяме стилно заглавие (Тук също ползваме пълните пътища за сигурност)
        com.lowagie.text.Font titleFont = com.lowagie.text.FontFactory.getFont(com.lowagie.text.FontFactory.HELVETICA_BOLD, 18);
        com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("SAP DOCUMENT REPORT", titleFont);
        title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        document.add(title);
        
        document.add(new com.lowagie.text.Paragraph(" ")); // Празен ред
        
        // 3. Метаданни
        document.add(new com.lowagie.text.Paragraph("Document Title: " + vEntity.getDocument().getTitle()));
        document.add(new com.lowagie.text.Paragraph("Version: " + vEntity.getVersionNumber()));
        document.add(new com.lowagie.text.Paragraph("Status: " + vEntity.getStatus()));
        document.add(new com.lowagie.text.Paragraph("Author: " + (vEntity.getCreatedBy() != null ? vEntity.getCreatedBy().getUsername() : "N/A")));
        
        document.add(new com.lowagie.text.Paragraph("-----------------------------------------------------------------------"));
        
        // 4. Съдържание
        document.add(new com.lowagie.text.Paragraph("CONTENT:"));
        document.add(new com.lowagie.text.Paragraph(vEntity.getContent()));
        
        document.close();
        return out.toByteArray();
    }
}