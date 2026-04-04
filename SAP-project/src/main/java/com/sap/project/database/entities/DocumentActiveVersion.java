package com.sap.project.database.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_active_versions")
public class DocumentActiveVersion {
    public Integer getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Integer documentId) {
        this.documentId = documentId;
    }

    public DocumentEntity getDocument() {
        return document;
    }

    public void setDocument(DocumentEntity document) {
        this.document = document;
    }

    public VersionEntity getVersion() {
        return version;
    }

    public void setVersion(VersionEntity version) {
        this.version = version;
    }

    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }

    public void setActivatedAt(LocalDateTime activatedAt) {
        this.activatedAt = activatedAt;
    }

    @Id
    @Column(name = "document_id")
    private Integer documentId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "document_id")
    private DocumentEntity document;

    @ManyToOne
    @JoinColumn(name = "version_id", nullable = false)
    private VersionEntity version;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;
}