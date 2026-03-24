package backend.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "versions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"document_id", "version_number"}))
public class VersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "document_id", nullable = false)
    private DocumentEntity document;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    private Status status;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private UserEntity approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne
    @JoinColumn(name = "parent_version_id")
    private VersionEntity parentVersion;
}