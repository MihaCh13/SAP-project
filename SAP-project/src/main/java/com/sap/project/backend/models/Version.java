package com.sap.project.backend.models;

import com.sap.project.backend.enums.Status;
import java.time.LocalDateTime;

public class Version {

    // FINAL полета - те са неизменяеми след създаване на обекта!
    private final int id;
    private final int documentId;
    private final int versionNumber;
    private final String content;
    private final int createdBy;            // ID на Автора
    private final LocalDateTime createdAt;
    private final Integer parentVersionId;  // Може да е null за първа версия

    // Променливи полета - те се променят по време на работния процес
    private Status status;
    private Integer approvedBy;             // ID на Рецензента
    private LocalDateTime approvedAt;

    // Конструктор - тук задаваме всички начални стойности
    public Version(int id, int documentId, int versionNumber, String content, int createdBy, Integer parentVersionId) {
        // Базови проверки за валидност на числата (ID-тата не могат да са отрицателни)
        if (id <= 0 || documentId <= 0 || versionNumber <= 0 || createdBy <= 0) {
            throw new IllegalArgumentException("IDs and version number must be positive numbers.");
        }

        // 1. ЗАЩИТА НА СЪДЪРЖАНИЕТО
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Version content cannot be empty.");
        }

        this.id = id;
        this.documentId = documentId;
        this.versionNumber = versionNumber;
        this.content = content;
        this.createdBy = createdBy;
        this.createdAt = LocalDateTime.now();
        this.parentVersionId = parentVersionId;

        // Всяка нова версия започва като чернова
        this.status = Status.DRAFT;
    }

    // --- GETTERS (Методи за четене) ---
    public int getId() { return id; }
    public int getDocumentId() { return documentId; }
    public int getVersionNumber() { return versionNumber; }
    public String getContent() { return content; }
    public int getCreatedBy() { return createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Integer getParentVersionId() { return parentVersionId; }
    public Status getStatus() { return status; }
    public Integer getApprovedBy() { return approvedBy; }
    public LocalDateTime getApprovedAt() { return approvedAt; }


    // --- БИЗНЕС ЛОГИКА ---

    // 1. Изпращане за преглед
    public void submitForReview() {
        if (this.status != Status.DRAFT) {
            throw new IllegalStateException("Only drafts can be submitted for review.");
        }
        this.status = Status.PENDING_REVIEW;
    }

    // 2. Одобряване от рецензент
    public void approve(Integer reviewerId) {
        // 2. ЗАЩИТА НА РЕЦЕНЗЕНТА
        if (reviewerId == null || reviewerId <= 0) {
            throw new IllegalArgumentException("Invalid reviewer ID.");
        }
        if (this.status != Status.PENDING_REVIEW) {
            throw new IllegalStateException("The document must be pending review to be approved.");
        }
        this.status = Status.APPROVED;
        this.approvedBy = reviewerId;
        this.approvedAt = LocalDateTime.now();
    }

    // 3. Отхвърляне от рецензент
    public void reject() {
        if (this.status != Status.PENDING_REVIEW) {
            throw new IllegalStateException("The document must be pending review to be rejected.");
        }
        this.status = Status.REJECTED;
        // Забележка: В базата нямаме rejected_by, така че тук променяме само статуса
    }
}