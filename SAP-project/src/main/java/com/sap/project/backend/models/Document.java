package com.sap.project.backend.models;

import java.time.LocalDateTime;

public class Document {

    // --- Immutable after creation ---
    private final int id;
    private final int createdBy;          // ID of the creator (author)
    private final LocalDateTime createdAt; // Date and time of creation

    // --- Editable metadata ---
    private String title;                 // Title
    private String description;           // Description
    private boolean isActive;             // Whether the document is active or archived
    private Integer activeVersionId;      // ID of the current active version (can be null)

    // Constructor
    public Document(int id, String title, String description, int createdBy) {
        // 1. NUMBER PROTECTION
        if (id <= 0 || createdBy <= 0) {
            throw new IllegalArgumentException("Document and creator IDs must be positive numbers.");
        }
        this.id = id;
        this.createdBy = createdBy;

        // 2. TITLE PROTECTION (using setter logic)
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("The title cannot be empty.");
        }
        this.title = title;

        // 3. DESCRIPTION PROTECTION (Prevents NullPointerException)
        this.description = (description != null) ? description : "";

        this.createdAt = LocalDateTime.now();

        // By default, when a new document is created, it is active
        this.isActive = true;

        // Initially, the document has no active (approved) version
        this.activeVersionId = null;
    }

    // --- GETTERS (Read methods) ---
    public int getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getCreatedBy() { return createdBy; }
    public boolean isActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Active version
    public Integer getActiveVersionId() { return activeVersionId; }

// --- SETTERS & BUSINESS LOGIC ---

    // Allowing title editing
    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("The title cannot be empty.");
        }
        this.title = title;
    }

    // Allowing description editing
    public void setDescription(String description) {
        // Again, protecting against null
        this.description = (description != null) ? description : "";
    }

    // Active version (called when a reviewer approves a version)
    public void setActiveVersionId(Integer activeVersionId) {
        // 4. ACTIVE VERSION PROTECTION (If not null, must be greater than 0)
        if (activeVersionId != null && activeVersionId <= 0) {
            throw new IllegalArgumentException("The active version ID must be a positive number.");
        }
        this.activeVersionId = activeVersionId;
    }

    // Archiving/deactivating the document
    public void archive() {
        if (!this.isActive) {
            throw new IllegalStateException("The document is already archived.");
        }
        this.isActive = false;
    }

    // Restoring the document
    public void activate() {
        if (this.isActive) {
            throw new IllegalStateException("The document is already active.");
        }
        this.isActive = true;
    }
}