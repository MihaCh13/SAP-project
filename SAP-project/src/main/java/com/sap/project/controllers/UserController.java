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
            String[] roleNames = rolesInput.split(",");
            for (String rName : roleNames) {
                String cleanRoleName = rName.trim().toUpperCase();

                // Защита от празни елементи при две запетаи (напр. "AUTHOR,,ADMIN")
                if(cleanRoleName.isEmpty()) continue;

                RoleEntity role = roleRepository.findByName(cleanRoleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + cleanRoleName));
                targetUser.getRoles().add(role);
            }

            userRepository.save(targetUser);

            // 6. Изпращане на известие
            NotificationEntity notif = new NotificationEntity();
            notif.setUser(targetUser);
            notif.setMessage("System Update: You have been granted new roles -> " + rolesInput.toUpperCase());
            notif.setCreatedAt(java.time.LocalDateTime.now()); // Добра практика е да има дата
            notificationRepository.save(notif);

            return ResponseEntity.ok("Roles [" + rolesInput.toUpperCase() + "] successfully added to user: " + targetUsername);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error adding role: " + e.getMessage());
        }
    }
}