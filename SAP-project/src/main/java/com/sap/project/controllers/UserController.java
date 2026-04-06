package com.sap.project.controllers;

import com.sap.project.database.entities.NotificationEntity;
import com.sap.project.database.entities.RoleEntity;
import com.sap.project.database.entities.UserEntity;
import com.sap.project.database.repositories.NotificationRepository;
import com.sap.project.database.repositories.RoleRepository;
import com.sap.project.database.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private RoleRepository roleRepository;

    // ==========================================
    // 1. Вход (Login)
    // ==========================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {

        String username = credentials.get("username");
        String password = credentials.get("password");

        // НОВАТА СТРОГА ЗАЩИТА И ЗА LOGIN:
        if (username == null || username.trim().isEmpty() ||
                password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Username and password are required and cannot be empty.");
        }

        Optional<UserEntity> userOpt = userRepository.findAll().stream()
                .filter(u -> u.getUsername().equals(username))
                .findFirst();

        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();

            // ЗАЩИТА: Деактивиран ли е акаунтът?
            if (!user.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Your account has been deactivated!");
            }

            if (user.getPasswordHash().equals(password)) {
                String rolesStr = user.getRoles().stream().map(RoleEntity::getName).reduce((a, b) -> a + "," + b).orElse("");
                return ResponseEntity.ok(Map.of(
                        "message", "Success!",
                        "userId", user.getId().toString(),
                        "username", user.getUsername(),
                        "roles", rolesStr
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Wrong password!");
            }
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Error: User not found!");
    }

    // ==========================================
    // 2. Регистрация на нов потребител (Само ADMIN)
    // ==========================================
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestHeader("X-User-Id") Integer adminId,
            @RequestBody Map<String, String> payload) {

        try {
            String username = payload.get("username");
            String password = payload.get("password");
            String email = payload.get("email");
            String role = payload.get("role");

            if (username == null || username.trim().isEmpty() ||
                    password == null || password.trim().isEmpty() ||
                    email == null || email.trim().isEmpty() ||
                    role == null || role.trim().isEmpty()) {

                return ResponseEntity.badRequest().body("Error: All fields (username, password, email, role) are required and cannot be empty.");
            }

            // ЗАЩИТА: Заето ли е потребителското име?
            boolean usernameExists = userRepository.findAll().stream()
                    .anyMatch(u -> u.getUsername().equalsIgnoreCase(username.trim()));
            if (usernameExists) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: Username already exists!");
            }

            boolean emailExists = userRepository.findAll().stream()
                    .anyMatch(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email.trim()));
            if (emailExists) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: Email already exists!");
            }

            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));

            boolean isAdmin = adminOpt.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can create users!");
            }

            UserEntity newUser = new UserEntity();
            newUser.setUsername(username.trim());
            newUser.setEmail(email.trim());
            newUser.setPasswordHash(password);
            newUser.setCreatedAt(java.time.LocalDateTime.now());
            newUser.setActive(true);

            String[] roleNames = role.split(",");

            for (String rName : roleNames) {
                String cleanRoleName = rName.trim().toUpperCase();
                RoleEntity roleEntity = roleRepository.findByName(cleanRoleName)
                        .orElseThrow(() -> new RuntimeException("Role not found in database: " + cleanRoleName));
                newUser.getRoles().add(roleEntity);
            }

            userRepository.save(newUser);
            return ResponseEntity.status(HttpStatus.CREATED).body("User " + newUser.getUsername() + " created successfully with roles: " + role.toUpperCase());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registration Error: " + e.getMessage());
        }
    }

    // ==========================================
    // 3. Добавяне на роля
    // ==========================================
    @PostMapping("/add-role")
    public ResponseEntity<?> addRoleToExistingUser(
            @RequestHeader("X-User-Id") Integer adminId,
            @RequestBody Map<String, String> payload) {

        try {
            // 1. Извличаме данните от заявката
            String targetUsername = payload.get("username");
            String rolesInput = payload.get("roles");

            // 2. СТРОГА ЗАЩИТА (Новият код): Проверяваме за null или празни стрингове ("")
            if (targetUsername == null || targetUsername.trim().isEmpty() ||
                    rolesInput == null || rolesInput.trim().isEmpty()) {

                return ResponseEntity.badRequest().body("Error: Username and roles cannot be empty.");
            }

            // 3. Проверка дали заявителят е Админ
            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));

            boolean isAdmin = adminOpt.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can assign roles.");
            }

            // 4. Намиране на целевия потребител
            UserEntity targetUser = userRepository.findAll().stream()
                    .filter(u -> u.getUsername().equals(targetUsername))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Target user '" + targetUsername + "' not found!"));

            // 5. Добавяне на ролите
            // НОВА ЛОГИКА: Ако потребителят е бил деактивиран, го връщаме към живот!
            boolean wasDeactivated = false;
            if (!targetUser.isActive()) {
                targetUser.setActive(true);
                wasDeactivated = true;
            }

            String[] roleNames = rolesInput.split(",");
            for (String rName : roleNames) {
                String cleanRoleName = rName.trim().toUpperCase();

                // Защита от празни елементи при две запетаи (напр. "AUTHOR,,ADMIN")
                if(cleanRoleName.isEmpty()) continue;

                RoleEntity role = roleRepository.findByName(cleanRoleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + cleanRoleName));

                // Проверяваме дали вече няма тази роля, за да не я дублираме
                if (!targetUser.getRoles().contains(role)) {
                    targetUser.getRoles().add(role);
                }
            }

            userRepository.save(targetUser);

            // 6. Изпращане на известие
            NotificationEntity notif = new NotificationEntity();
            notif.setUser(targetUser);
            notif.setMessage("System Update: You have been granted new roles -> " + rolesInput.toUpperCase());
            notif.setCreatedAt(java.time.LocalDateTime.now()); // Добра практика е да има дата
            notificationRepository.save(notif);

            // Съставяме съобщението
            String responseMessage = "Roles [" + rolesInput.toUpperCase() + "] successfully added to user: " + targetUsername;
            if (wasDeactivated) {
                responseMessage += " (User account was dormant and has been REACTIVATED!).";
            }

            return ResponseEntity.ok(responseMessage);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error adding role: " + e.getMessage());
        }
    }

    // ==========================================
    // 4. Премахване на роля от съществуващ потребител
    // ==========================================
    @PostMapping("/remove-role")
    public ResponseEntity<?> removeRoleFromUser(
            @RequestHeader("X-User-Id") Integer adminId,
            @RequestBody Map<String, String> payload) {

        try {
            String targetUsername = payload.get("username");
            String rolesInput = payload.get("roles");

            if (targetUsername == null || targetUsername.trim().isEmpty() ||
                    rolesInput == null || rolesInput.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Error: Username and roles cannot be empty.");
            }

            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));

            boolean isAdmin = adminOpt.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can remove roles.");
            }

            UserEntity targetUser = userRepository.findAll().stream()
                    .filter(u -> u.getUsername().equals(targetUsername))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Target user '" + targetUsername + "' not found!"));

            String[] roleNames = rolesInput.split(",");
            for (String rName : roleNames) {
                String cleanRoleName = rName.trim().toUpperCase();
                if (cleanRoleName.isEmpty()) continue;

                // Намираме ролята в списъка на потребителя и я премахваме
                targetUser.getRoles().removeIf(r -> r.getName().equals(cleanRoleName));
            }

            // НОВА ЛОГИКА: Защита от "потребител без нито една роля"
            boolean demotedToReader = false;
            if (targetUser.getRoles().isEmpty()) {
                RoleEntity readerRole = roleRepository.findByName("READER")
                        .orElseThrow(() -> new RuntimeException("READER role not found!"));
                targetUser.getRoles().add(readerRole);
                demotedToReader = true;
            }

            userRepository.save(targetUser);

            String responseMessage = "Roles [" + rolesInput.toUpperCase() + "] successfully removed from user: " + targetUsername;

            if (demotedToReader) {
                responseMessage += "\n[!] WARNING: The user had no roles left and was automatically demoted to a regular READER.\n" +
                        "If your intention was to remove them from the system completely, please use the 'Deactivate' option.";
            }

            return ResponseEntity.ok(responseMessage);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error removing role: " + e.getMessage());
        }
    }

    // ==========================================
    // 5. Премахване (Деактивиране) на потребител
    // ==========================================
    @PostMapping("/deactivate")
    public ResponseEntity<?> deactivateUser(
            @RequestHeader("X-User-Id") Integer adminId,
            @RequestBody Map<String, String> payload) {

        try {
            String targetUsername = payload.get("username");

            if (targetUsername == null || targetUsername.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Error: Username cannot be empty.");
            }

            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));

            boolean isAdmin = adminOpt.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can deactivate users.");
            }

            // ЗАЩИТА: Предпазваме админа да не изтрие сам себе си по погрешка!
            if (adminOpt.getUsername().equals(targetUsername)) {
                return ResponseEntity.badRequest().body("Error: You cannot deactivate your own admin account!");
            }

            UserEntity targetUser = userRepository.findAll().stream()
                    .filter(u -> u.getUsername().equals(targetUsername))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Target user '" + targetUsername + "' not found!"));

            // Soft Delete: Правим потребителя неактивен
            targetUser.setActive(false);
            userRepository.save(targetUser);

            return ResponseEntity.ok("User '" + targetUsername + "' has been successfully deactivated. They can no longer log in.");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error deactivating user: " + e.getMessage());
        }
    }
}