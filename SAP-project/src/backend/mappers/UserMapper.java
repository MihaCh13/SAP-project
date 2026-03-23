package backend.mappers;

import backend.entities.UserEntity;
import backend.models.User;
import backend.enums.Role;

import java.util.stream.Collectors;

public class UserMapper {

    public static User toModel(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getEmail(),
                entity.getPasswordHash(),
                entity.getRoles().stream()
                        .map(r -> Role.valueOf(r.getName().toUpperCase()))
                        .collect(Collectors.toSet())
        );
    }

    public static UserEntity toEntity(User model) {
        UserEntity entity = new UserEntity();

        entity.setUsername(model.getUsername());
        entity.setEmail(model.getEmail());
        entity.setPasswordHash(model.getPasswordHash());

        // ролите ще ги сетнеш отделно (по-сложно е)

        return entity;
    }
}