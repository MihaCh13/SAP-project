package backend.services;

import backend.enums.Role;
import backend.models.User;

public class UserService {

    // 1. Добавяне на роля на потребител
    public void assignRole(User adminUser, User targetUser, Role newRole) {
        // Проверка за валидни обекти?
        if (adminUser == null || targetUser == null) {
            throw new IllegalArgumentException("Error: Invalid users.");
        }

        // Проверка дали вършителя на действието е ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can assign roles.");
        }

        // Проверка за добавяне на null роля
        if (newRole == null) {
            throw new IllegalArgumentException("The role to be added cannot be empty.");
        }

        // Добавяне на ролята
        targetUser.addRole(newRole);

        // В реална среда тук ще извикаме метода на Архитекта, за да запазим промяната в базата/файла.
    }

    // 2. Премахване на роля от потребител
    public void revokeRole(User adminUser, User targetUser, Role roleToRemove) {
        // Проверка за валидни обекти
        if (adminUser == null || targetUser == null) {
            throw new IllegalArgumentException("Error: Invalid users.");
        }

        // Проверка дали вършителя на действието е ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can remove roles.");
        }

        // Проверка за опит за премахне на null роля
        if (roleToRemove == null) {
            throw new IllegalArgumentException("The role to be removed cannot be empty.");
        }

        // Защита против "Admin Lockout" - Админът не може да премахне собствената си ADMIN роля!
        if (adminUser.getId() == targetUser.getId() && roleToRemove == Role.ADMIN) {
            throw new SecurityException("Error: You cannot remove your own administrator role to avoid losing access!");
        }

        // Премахване на роля
        targetUser.removeRole(roleToRemove);
    }

    // 3. Деактивиране на потребител (само Админ може да го прави)
    public void deactivateUser(User adminUser, User targetUser) {
        if (adminUser == null || targetUser == null) {
            throw new IllegalArgumentException("Error: Invalid users.");
        }

        // Проверка за ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can deactivate accounts.");
        }

        // Админът не може да деактивира сам себе си!
        if (adminUser.getId() == targetUser.getId()) {
            throw new SecurityException("Error: You cannot deactivate your own account.");
        }

        targetUser.deactivate();
    }

    // 4. Активиране на потребител (само Админ може да го прави)
    public void activateUser(User adminUser, User targetUser) {
        if (adminUser == null || targetUser == null) {
            throw new IllegalArgumentException("Error: Invalid users.");
        }

        // Проверка за ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can activate accounts.");
        }

        targetUser.activate();
    }
}
