package com.sap.project.database.repositories;

import com.sap.project.database.entities.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<RoleEntity, Integer> {
    
    // Spring Data JPA е достатъчно умен, за да разбере какво искаш само от името на метода!
    Optional<RoleEntity> findByName(String name);
    
}