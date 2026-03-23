package backend.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_active_versions")
public class DocumentActiveVersion {

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