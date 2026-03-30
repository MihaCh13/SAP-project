package com.sap.project.backend.services;

import com.sap.project.database.entities.DocumentActiveVersion;
import com.sap.project.database.repositories.DocumentActiveVersionRepository;

import com.sap.project.backend.enums.Role;
import com.sap.project.backend.enums.Status;
import com.sap.project.backend.models.User;
import com.sap.project.database.entities.CommentEntity;
import com.sap.project.database.entities.DocumentEntity;
import com.sap.project.database.entities.VersionEntity;
import com.sap.project.database.repositories.CommentRepository;
import com.sap.project.database.repositories.DocumentRepository;
import com.sap.project.database.repositories.UserRepository;
import com.sap.project.database.repositories.VersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
@Transactional // ГАРАНТИРА: Или всичко се записва в базата, или нищо!
public class WorkflowService {

    // Връзки към всички необходими таблици
    private final DocumentRepository documentRepository;
    private final VersionRepository versionRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final DocumentActiveVersionRepository activeVersionRepository;

    public WorkflowService(DocumentRepository documentRepository,
                           VersionRepository versionRepository,
                           UserRepository userRepository,
                           CommentRepository commentRepository,
                           DocumentActiveVersionRepository activeVersionRepository) { // <-- ДОБАВЕНО
        this.documentRepository = documentRepository;
        this.versionRepository = versionRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.activeVersionRepository = activeVersionRepository;
    }

    // 1. Създаване на нов документ
    public void createDocument(User user, String title, String description, String content) {
        if (user == null) throw new IllegalArgumentException("Error: User is null.");
        if (!user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only users with the AUTHOR role can create documents.");
        }

        // Записваме Документа в базата
        DocumentEntity docEntity = new DocumentEntity();
        docEntity.setTitle(title);
        docEntity.setDescription(description);
        docEntity.setCreatedBy(userRepository.getReferenceById(user.getId()));
        docEntity.setCreatedAt(LocalDateTime.now());
        docEntity = documentRepository.save(docEntity);

        // Записваме първата Версия в базата
        VersionEntity verEntity = new VersionEntity();
        verEntity.setDocument(docEntity);
        verEntity.setVersionNumber(1);
        verEntity.setContent(content);
        verEntity.setStatus(Status.DRAFT);
        verEntity.setCreatedBy(userRepository.getReferenceById(user.getId()));
        verEntity.setCreatedAt(LocalDateTime.now());
        versionRepository.save(verEntity);
    }

    // 2. Редактиране (Нова версия)
    public void editDocument(User user, int parentVersionId, String newContent) {
        if (!user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only users with the AUTHOR role can edit documents.");
        }

        // Намираме старата версия от базата
        VersionEntity parentVersion = versionRepository.findById(parentVersionId)
                .orElseThrow(() -> new IllegalArgumentException("Error: Parent version not found."));

        if (parentVersion.getStatus() == Status.PENDING_REVIEW) {
            throw new IllegalStateException("Error: Cannot create a new version while the current one is PENDING_REVIEW.");
        }

        // Намираме общия брой версии на този документ до момента
        int currentVersionCount = versionRepository.findByDocumentId(parentVersion.getDocument().getId()).size();

        // Ако номерът на версията, която се опитват да редактират, е по-малък от общия брой, значи това е стара версия!
        if (parentVersion.getVersionNumber() < currentVersionCount) {
            throw new IllegalStateException("Error: You can only create a new draft from the latest active version.");
        }

        // Записваме новата версия
        VersionEntity newVersion = new VersionEntity();
        newVersion.setDocument(parentVersion.getDocument());
        newVersion.setVersionNumber(currentVersionCount + 1);
        newVersion.setContent(newContent);
        newVersion.setStatus(Status.DRAFT);
        newVersion.setCreatedBy(userRepository.getReferenceById(user.getId()));
        newVersion.setCreatedAt(LocalDateTime.now());
        newVersion.setParentVersion(parentVersion);
        versionRepository.save(newVersion);
    }

    // 3. Изпращане за преглед
    public void submitForReview(User user, int versionId) {
        VersionEntity version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Error: Version not found."));

        if (!user.hasRole(Role.AUTHOR)) {
            throw new SecurityException("Error: Only authors can submit for review.");
        }
        if (user.getId() != version.getCreatedBy().getId()) {
            throw new SecurityException("Error: You cannot submit someone else's document.");
        }
        if (version.getStatus() != Status.DRAFT) {
            throw new IllegalStateException("Error: Only DRAFT versions can be submitted.");
        }

        version.setStatus(Status.PENDING_REVIEW);
        versionRepository.save(version);
    }

    // 4. Одобряване
    public void approveDocument(User user, int versionId, String commentText) {
        VersionEntity version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Error: Version not found."));

        if (!user.hasRole(Role.REVIEWER)) {
            throw new SecurityException("Error: Only REVIEWER role can approve.");
        }
        if (user.getId() == version.getCreatedBy().getId()) {
            throw new SecurityException("Error: You cannot approve your own document!");
        }
        if (version.getStatus() != Status.PENDING_REVIEW) {
            throw new IllegalStateException("Error: Only PENDING_REVIEW status can be approved.");
        }

        version.setStatus(Status.APPROVED);
        version.setApprovedBy(userRepository.getReferenceById(user.getId()));
        version.setApprovedAt(LocalDateTime.now());
        versionRepository.save(version);

        // Запазваме коментара
        saveComment(user.getId(), version, commentText);

        DocumentActiveVersion activeVersion = activeVersionRepository.findById(version.getDocument().getId())
                .orElse(new DocumentActiveVersion());

        activeVersion.setDocument(version.getDocument());
        activeVersion.setVersion(version);
        activeVersion.setActivatedAt(LocalDateTime.now());
        activeVersionRepository.save(activeVersion);// Записваме в таблицата за активни версии
    }

    // 5. Отхвърляне
    public void rejectDocument(User user, int versionId, String commentText) {
        VersionEntity version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Error: Version not found."));

        if (!user.hasRole(Role.REVIEWER)) {
            throw new SecurityException("Error: Only REVIEWER role can reject.");
        }
        if (user.getId() == version.getCreatedBy().getId()) {
            throw new SecurityException("Error: You cannot reject your own work!");
        }
        if (version.getStatus() != Status.PENDING_REVIEW) {
            throw new IllegalStateException("Error: Only PENDING_REVIEW status can be rejected.");
        }

        version.setStatus(Status.REJECTED);
        versionRepository.save(version);

        // Запазваме коментара
        saveComment(user.getId(), version, commentText);
    }

    // Помощен метод за записване на коментари
    private void saveComment(int userId, VersionEntity version, String commentText) {
        if (commentText != null && !commentText.trim().isEmpty()) {
            CommentEntity comment = new CommentEntity();
            comment.setVersion(version);
            comment.setUser(userRepository.getReferenceById(userId));
            comment.setCommentText(commentText);
            comment.setCreatedAt(LocalDateTime.now());
            commentRepository.save(comment);
        }
    }

    // 6. Четене на документ
    public VersionEntity viewVersion(User user, int versionId) {
        VersionEntity version = versionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Error: Version not found."));

        boolean isOnlyReader = user.hasRole(Role.READER) && !user.hasRole(Role.AUTHOR) && !user.hasRole(Role.REVIEWER) && !user.hasRole(Role.ADMIN);
        if (isOnlyReader && version.getStatus() != Status.APPROVED) {
            throw new SecurityException("Error: Readers only have access to officially APPROVED versions.");
        }

        if (version.getStatus() == Status.REJECTED) {
            boolean hasAccess = user.getId() == version.getCreatedBy().getId() || user.hasRole(Role.REVIEWER) || user.hasRole(Role.ADMIN);
            if (!hasAccess) {
                throw new SecurityException("Error: Access denied. REJECTED versions are only visible to the owner and reviewers.");
            }
        }

        return version; // Връщаме обекта, за да може API-то да го покаже!
    }
}