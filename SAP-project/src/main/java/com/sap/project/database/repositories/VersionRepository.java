package com.sap.project.database.repositories;

import com.sap.project.database.entities.VersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VersionRepository extends JpaRepository<VersionEntity, Integer> {

    List<VersionEntity> findByDocumentId(Integer documentId);
}