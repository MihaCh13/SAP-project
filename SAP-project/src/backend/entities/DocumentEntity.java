package backend.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class DocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}