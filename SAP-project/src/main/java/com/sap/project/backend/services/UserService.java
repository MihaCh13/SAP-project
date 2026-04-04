package com.sap.project.backend.services;

import com.sap.project.backend.enums.Role;
import com.sap.project.backend.models.User;
import com.sap.project.database.entities.AuditLog;
import com.sap.project.database.entities.RoleEntity;
import com.sap.project.database.entities.UserEntity;
import com.sap.project.database.repositories.AuditLogRepository;
import com.sap.project.database.repositories.RoleRepository;
import com.sap.project.database.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional
public class UserService {

    // Връзката с базата данни
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       AuditLogRepository auditLogRepository) { // <-- ДОБАВЕНО
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // 1. Добавяне на роля на потребител
    public void assignRole(User adminUser, int targetUserId, Role newRole) {
        // Проверка за валиден админ
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Проверка дали вършителят на действието е ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can assign roles.");
        }

        // Проверка за добавяне на null роля
        if (newRole == null) {
            throw new IllegalArgumentException("The role to be added cannot be empty.");
        }

        // Взимаме реалния потребител от базата чрез неговото ID
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found in database."));

        // Намираме RoleEntity-то
        RoleEntity roleEntity = roleRepository.findByName(newRole.name())
                .orElseThrow(() -> new RuntimeException("Role '" + newRole.name() + "' not found in database setup."));

        // Проверка: Има ли вече тази роля?
        boolean alreadyHasRole = target.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase(newRole.name()));
        if (alreadyHasRole) {
            throw new IllegalStateException("Error: The user already has this role.");
        }

        // Обновяваме базата данни
        target.getRoles().add(roleEntity);
        userRepository.save(target);

        // ЗАПИСВАМЕ ДЕЙСТВИЕТО В ОДИТ ЛОГА
        logAction(adminUser, "ASSIGN_ROLE", "USER", targetUserId, "Assigned role: " + newRole.name());

    }

    // 2. Премахване на роля от потребител
    public void revokeRole(User adminUser, int targetUserId, Role roleToRemove) {
        // Проверка за валиден админ
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Проверка дали вършителят на действието е ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can remove roles.");
        }

        // Проверка за опит за премахване на null роля
        if (roleToRemove == null) {
            throw new IllegalArgumentException("The role to be removed cannot be empty.");
        }

        // Защита против "Admin Lockout" - Админът не може да премахне собствената си ADMIN роля!
        if (adminUser.getId() == targetUserId && roleToRemove == Role.ADMIN) {
            throw new SecurityException("Error: You cannot remove your own administrator role to avoid losing access!");
        }

        // Взимаме реалния потребител от базата
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found."));

        // Премахваме ролята от сета на Entity-то и проверяваме дали реално е имало какво да се премахне
        boolean isRemoved = target.getRoles().removeIf(r -> r.getName().equalsIgnoreCase(roleToRemove.name()));
        if (!isRemoved) {
            throw new IllegalArgumentException("Error: The user does not have this role to remove.");
        }

        // Малка защита: Потребителят не може да остане без нито една роля в базата
        if (target.getRoles().isEmpty()) {
            throw new IllegalStateException("Error: A user must have at least one role.");
        }

        // Обновяваме базата данни
        userRepository.save(target);

        // ЗАПИСВАМЕ ДЕЙСТВИЕТО В ОДИТ ЛОГА
        logAction(adminUser, "REVOKE_ROLE", "USER", targetUserId, "Revoked role: " + roleToRemove.name());
    }

    // 3. Деактивиране на потребител (само Админ може да го прави)
    public void deactivateUser(User adminUser, int targetUserId) {
        // Проверка за валиден админ
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Проверка за ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can deactivate accounts.");
        }

        // Админът не може да деактивира сам себе си!
        if (adminUser.getId() == targetUserId) {
            throw new SecurityException("Error: You cannot deactivate your own account.");
        }

        // Обновяваме базата данни
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (!target.isActive()) {
            throw new IllegalStateException("Error: The user is already deactivated.");
        }

        target.setActive(false);
        userRepository.save(target);

        // ЗАПИСВАМЕ ДЕЙСТВИЕТО В ОДИТ ЛОГА
        logAction(adminUser, "DEACTIVATE_USER", "USER", targetUserId, "Deactivated user account");
    }

    // 4. Активиране на потребител (само Админ може да го прави)
    public void activateUser(User adminUser, int targetUserId) {
        // Проверка за валиден админ
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Проверка за ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can activate accounts.");
        }

        // Обновяваме базата данни
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (target.isActive()) {
            throw new IllegalStateException("Error: The user is already active.");
        }

        target.setActive(true);
        userRepository.save(target);

        // ЗАПИСВАМЕ ДЕЙСТВИЕТО В ОДИТ ЛОГА
        logAction(adminUser, "ACTIVATE_USER", "USER", targetUserId, "Activated user account");
    }

    // --- ПОМОЩЕН МЕТОД ЗА ОДИТ ЛОГ ---
    private void logAction(User admin, String actionType, String entityType, Integer entityId, String details) {
        AuditLog log = new AuditLog();
        log.setUser(userRepository.getReferenceById(admin.getId())); // Кой го е направил (Админът)
        log.setActionType(actionType);
        log.setEntityType(entityType);
        log.setEntityId(entityId); // На кого го е направил
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());

        auditLogRepository.save(log);
    }
}