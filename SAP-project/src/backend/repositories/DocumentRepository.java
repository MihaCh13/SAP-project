package backend.repositories;

import backend.entities.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<DocumentEntity, Integer> {
}