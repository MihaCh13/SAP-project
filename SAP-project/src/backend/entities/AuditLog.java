package backend.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    private String actionType;
    private String entityType;
    private Integer entityId;

    @Column(columnDefinition = "json")
    private String details;

    private LocalDateTime timestamp;
}