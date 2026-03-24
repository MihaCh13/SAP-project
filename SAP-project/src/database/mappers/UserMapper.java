package database.mappers;

import database.entities.UserEntity;
import backend.models.User;
import backend.enums.Role;
import java.util.Set;
import java.util.stream.Collectors;

public class UserMapper {

    public static User toModel(UserEntity entity) {
        // Превръщам ти RoleEntity обектите в моите Role enum-и
        Set<Role> userRoles = entity.getRoles().stream()
                .map(roleEntity -> {
                    try {
                        // Вземаме името на ролята (напр. "ADMIN") и го превръщаме в Enum
                        return Role.valueOf(roleEntity.getName().toUpperCase());
                    } catch (Exception e) {
                        return Role.READER; // Ако нещо се обърка, даваме най-ниската роля
                    }
                })
                .collect(Collectors.toSet());
        // Подаваме ВЕЧЕ ГОТОВИТЕ роли на конструктора
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getEmail(),
                entity.getPasswordHash(),
                userRoles  // <--- Използваме променливата отгоре, без да пишем нов стрийм тук
        );
    }

    public static UserEntity toEntity(User model) {
        UserEntity entity = new UserEntity();
        // Тук просто прехвърляме данните обратно, ако ни потрябват за запис
        entity.setUsername(model.getUsername());
        entity.setEmail(model.getEmail());
        entity.setPasswordHash(model.getPasswordHash());

        // ролите ще ги сетнеш отделно (по-сложно е)

        return entity;
    }
}