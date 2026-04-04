package com.sap.project.database.repositories;

import com.sap.project.database.entities.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<DocumentEntity, Integer> {
}