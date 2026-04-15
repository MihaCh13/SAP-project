package com.sap.project.database.mappers;

import com.sap.project.database.entities.UserEntity;
import com.sap.project.backend.models.User;
import com.sap.project.backend.enums.Role;
import java.util.Set;
import java.util.stream.Collectors;

public class UserMapper {

    public static User toModel(UserEntity entity) {
        // Converting RoleEntity objects into Role enums
        Set<Role> userRoles = entity.getRoles().stream()
                .map(roleEntity -> {
                    try {
                        // Get the role name (e.g., "ADMIN") and convert it to Enum
                        return Role.valueOf(roleEntity.getName().toUpperCase());
                    } catch (Exception e) {
                        return Role.READER; // If something goes wrong, assign the lowest role
                    }
                })
                .collect(Collectors.toSet());

        // Passing the PREPARED roles to the constructor
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getEmail(),
                entity.getPasswordHash(),
                userRoles  // <--- Using the variable from above without writing a new stream here
        );
    }

    public static UserEntity toEntity(User model) {
        UserEntity entity = new UserEntity();
        // Simply transferring data back if needed for saving
        entity.setUsername(model.getUsername());
        entity.setEmail(model.getEmail());
        entity.setPasswordHash(model.getPasswordHash());

        return entity;
    }
}