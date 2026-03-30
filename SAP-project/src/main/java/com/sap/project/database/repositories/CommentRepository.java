package com.sap.project.database.repositories;
import com.sap.project.database.entities.CommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CommentRepository extends JpaRepository<CommentEntity, Integer> {}