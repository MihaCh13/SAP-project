package com.sap.project.backend.models;

import com.sap.project.backend.enums.Status;
import java.time.LocalDateTime;

public class Version {

    // FINAL fields - they are immutable after the object is created!
    private final int id;
    private final int documentId;
    private final int versionNumber;
    private final String content;
    private final int createdBy;            // ID of the Author
    private final LocalDateTime createdAt;
    private final Integer parentVersionId;  // Can be null for the first version

    // Mutable fields - they change during the workflow process
    private Status status;
    private Integer approvedBy;             // ID of the Reviewer
    private LocalDateTime approvedAt;

    // Constructor
    public Version(int id, int documentId, int versionNumber, String content, int createdBy, Integer parentVersionId) {
        // Basic validation checks for numbers (IDs cannot be negative)
        if (id <= 0 || documentId <= 0 || versionNumber <= 0 || createdBy <= 0) {
            throw new IllegalArgumentException("IDs and version number must be positive numbers.");
        }

        // 1. CONTENT PROTECTION
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

        // Every new version starts as a draft
        this.status = Status.DRAFT;
    }

    // --- GETTERS (Read methods) ---
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


// --- BUSINESS LOGIC ---

    // 1. Sending for review
    public void submitForReview() {
        if (this.status != Status.DRAFT) {
            throw new IllegalStateException("Only drafts can be submitted for review.");
        }
        this.status = Status.PENDING_REVIEW;
    }

    // 2. Approval by a reviewer
    public void approve(Integer reviewerId) {
        // 2. REVIEWER PROTECTION
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

    // 3. Rejection by a reviewer
    public void reject() {
        if (this.status != Status.PENDING_REVIEW) {
            throw new IllegalStateException("The document must be pending review to be rejected.");
        }
        this.status = Status.REJECTED;
        // Note: In the database we do not have rejected_by, so here we only change the status
    }
}