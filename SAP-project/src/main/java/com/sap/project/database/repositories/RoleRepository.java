package com.sap.project.database.repositories;

import com.sap.project.database.entities.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<RoleEntity, Integer> {

    // Spring Data JPA is smart enough to understand what you want just from the method name!
    Optional<RoleEntity> findByName(String name);

}