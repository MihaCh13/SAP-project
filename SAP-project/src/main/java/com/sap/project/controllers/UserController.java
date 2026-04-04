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
        // ЗАЩИТА: Липсващи данни
        if (!credentials.containsKey("username") || !credentials.containsKey("password")) {
            return ResponseEntity.badRequest().body("Error: Username and password are required.");
        }

        String username = credentials.get("username");
        String password = credentials.get("password");

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
            // ЗАЩИТА: Липсващи данни
            if (!payload.containsKey("username") || !payload.containsKey("password") || !payload.containsKey("role")) {
                return ResponseEntity.badRequest().body("Error: Missing required fields (username, password, role).");
            }

            // ЗАЩИТА: Заето ли е потребителското име?
            boolean usernameExists = userRepository.findAll().stream()
                    .anyMatch(u -> u.getUsername().equals(payload.get("username")));
            if (usernameExists) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("Error: Username already exists!");
            }

            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));

            boolean isAdmin = adminOpt.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can create users!");
            }

            UserEntity newUser = new UserEntity();
            newUser.setUsername(payload.get("username"));
            newUser.setEmail(payload.get("email")); // Може да е null, ако не го пратят, което е ок за прототип
            newUser.setPasswordHash(payload.get("password"));
            newUser.setCreatedAt(java.time.LocalDateTime.now());
            newUser.setActive(true);

            String rolesInput = payload.get("role");
            String[] roleNames = rolesInput.split(",");

            for (String rName : roleNames) {
                String cleanRoleName = rName.trim().toUpperCase();
                RoleEntity role = roleRepository.findByName(cleanRoleName)
                        .orElseThrow(() -> new RuntimeException("Role not found in database: " + cleanRoleName));
                newUser.getRoles().add(role);
            }

            userRepository.save(newUser);
            return ResponseEntity.status(HttpStatus.CREATED).body("User " + newUser.getUsername() + " created successfully with roles: " + rolesInput.toUpperCase());

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
            // ЗАЩИТА: Липсващи данни
            if (!payload.containsKey("username") || !payload.containsKey("roles")) {
                return ResponseEntity.badRequest().body("Error: Missing required fields (username, roles).");
            }

            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));

            boolean isAdmin = adminOpt.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can assign roles.");
            }

            String targetUsername = payload.get("username");
            UserEntity targetUser = userRepository.findAll().stream()
                    .filter(u -> u.getUsername().equals(targetUsername))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Target user '" + targetUsername + "' not found!"));

            String rolesInput = payload.get("roles");
            String[] roleNames = rolesInput.split(",");

            for (String rName : roleNames) {
                String cleanRoleName = rName.trim().toUpperCase();
                RoleEntity role = roleRepository.findByName(cleanRoleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + cleanRoleName));
                targetUser.getRoles().add(role);
            }

            userRepository.save(targetUser);

            // Пращаме известие
            NotificationEntity notif = new NotificationEntity();
            notif.setUser(targetUser);
            notif.setMessage("System Update: You have been granted new roles -> " + rolesInput.toUpperCase());
            notificationRepository.save(notif);

            return ResponseEntity.ok("Roles [" + rolesInput.toUpperCase() + "] successfully added to user: " + targetUsername);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error adding role: " + e.getMessage());
        }
    }
}