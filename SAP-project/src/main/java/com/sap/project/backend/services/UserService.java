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

    // Connection to the database
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // 1. Adding a role to a user
    public void assignRole(User adminUser, int targetUserId, Role newRole) {
        // Check for a valid admin
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Check that the action performer is an ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can assign roles.");
        }

        // Check for adding a null role
        if (newRole == null) {
            throw new IllegalArgumentException("The role to be added cannot be empty.");
        }

        // Retrieve the actual user from the database by their ID
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found in database."));

        // Find the RoleEntity
        RoleEntity roleEntity = roleRepository.findByName(newRole.name())
                .orElseThrow(() -> new RuntimeException("Role '" + newRole.name() + "' not found in database setup."));

        // Check: Does the user already have this role?
        boolean alreadyHasRole = target.getRoles().stream()
                .anyMatch(r -> r.getName().equalsIgnoreCase(newRole.name()));
        if (alreadyHasRole) {
            throw new IllegalStateException("Error: The user already has this role.");
        }

        // Update the database
        target.getRoles().add(roleEntity);
        userRepository.save(target);

        // RECORD THE ACTION IN THE AUDIT LOG
        logAction(adminUser, "ASSIGN_ROLE", "USER", targetUserId, "Assigned role: " + newRole.name());

    }

    // 2. Removing a role from a user
    public void revokeRole(User adminUser, int targetUserId, Role roleToRemove) {
        // Check for a valid admin
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Check that the action performer is an ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can remove roles.");
        }

        // Check for attempt to remove a null role
        if (roleToRemove == null) {
            throw new IllegalArgumentException("The role to be removed cannot be empty.");
        }

        // Protection against "Admin Lockout" - an admin cannot remove their own ADMIN role!
        if (adminUser.getId() == targetUserId && roleToRemove == Role.ADMIN) {
            throw new SecurityException("Error: You cannot remove your own administrator role to avoid losing access!");
        }

        // Retrieve the actual user from the database
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found."));

        // Remove the role from the entity's set and check if there was actually something to remove
        boolean isRemoved = target.getRoles().removeIf(r -> r.getName().equalsIgnoreCase(roleToRemove.name()));
        if (!isRemoved) {
            throw new IllegalArgumentException("Error: The user does not have this role to remove.");
        }

        // Small protection: A user cannot remain without any role in the database
        if (target.getRoles().isEmpty()) {
            throw new IllegalStateException("Error: A user must have at least one role.");
        }

        // Update the database
        userRepository.save(target);

        // RECORD THE ACTION IN THE AUDIT LOG
        logAction(adminUser, "REVOKE_ROLE", "USER", targetUserId, "Revoked role: " + roleToRemove.name());
    }

    // 3. Deactivating a user (only Admin can do this)
    public void deactivateUser(User adminUser, int targetUserId) {
        // Check for a valid admin
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Check for ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can deactivate accounts.");
        }

        // An admin cannot deactivate their own account!
        if (adminUser.getId() == targetUserId) {
            throw new SecurityException("Error: You cannot deactivate your own account.");
        }

        // Update the database
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (!target.isActive()) {
            throw new IllegalStateException("Error: The user is already deactivated.");
        }

        target.setActive(false);
        userRepository.save(target);

        // RECORD THE ACTION IN THE AUDIT LOG
        logAction(adminUser, "DEACTIVATE_USER", "USER", targetUserId, "Deactivated user account");
    }

    // 4. Activating a user (only Admin can do this)
    public void activateUser(User adminUser, int targetUserId) {
        // Check for a valid admin
        if (adminUser == null) {
            throw new IllegalArgumentException("Error: Invalid admin user.");
        }

        // Check for ADMIN
        if (!adminUser.hasRole(Role.ADMIN)) {
            throw new SecurityException("Error: Only an administrator (ADMIN) can activate accounts.");
        }

        // Update the database
        UserEntity target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (target.isActive()) {
            throw new IllegalStateException("Error: The user is already active.");
        }

        target.setActive(true);
        userRepository.save(target);

        // RECORD THE ACTION IN THE AUDIT LOG
        logAction(adminUser, "ACTIVATE_USER", "USER", targetUserId, "Activated user account");
    }

    // --- HELPER METHOD FOR AUDIT LOG ---
    private void logAction(User admin, String actionType, String entityType, Integer entityId, String details) {
        AuditLog log = new AuditLog();
        log.setUser(userRepository.getReferenceById(admin.getId())); // Who performed it (the Admin)
        log.setActionType(actionType);
        log.setEntityType(entityType);
        log.setEntityId(entityId); // On whom it was performed
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());

        auditLogRepository.save(log);
    }
}