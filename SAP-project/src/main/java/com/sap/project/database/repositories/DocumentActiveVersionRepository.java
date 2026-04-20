package com.sap.project.database.repositories;
import com.sap.project.database.entities.DocumentActiveVersion;
import org.springframework.data.jpa.repository.JpaRepository;
public interface DocumentActiveVersionRepository extends JpaRepository<DocumentActiveVersion, Integer> {}