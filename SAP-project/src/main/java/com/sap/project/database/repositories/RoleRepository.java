package com.sap.project.database.repositories;

import com.sap.project.database.entities.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Integer> {
    Optional<RoleEntity> findByName(String name); // Трябва ни за UserService!
}