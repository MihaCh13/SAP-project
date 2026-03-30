package com.sap.project.controllers;

import com.sap.project.database.entities.NotificationEntity;
import com.sap.project.database.entities.UserEntity;
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
    private com.sap.project.database.repositories.NotificationRepository notificationRepository;

    // Вход (Login)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");

        // Търсим потребителя по потребителско име
        Optional<UserEntity> userOpt = userRepository.findAll().stream()
                .filter(u -> u.getUsername().equals(username))
                .findFirst();

        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            // В реална система тук се ползва BCrypt за сравняване на хашове.
            // За нашия прототип проверяваме директно:
            if (user.getPasswordHash().equals(password)) {
            	String rolesStr = user.getRoles().stream().map(r -> r.getName()).reduce((a, b) -> a + "," + b).orElse("");

            	return ResponseEntity.ok(Map.of(
            	        "message", "Success!",
            	        "userId", user.getId().toString(),
            	        "username", user.getUsername(),
            	        "roles", rolesStr // Връщаме например "AUTHOR" или "ADMIN"
            	));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Wrong password!");
            }
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found!");
    }


    @Autowired
    private com.sap.project.database.repositories.RoleRepository roleRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(
            @RequestHeader("X-User-Id") Integer adminId,
            @RequestBody Map<String, String> payload) {
        
        try {
            // 1. Проверяваме дали човекът, който пуска заявката, е ADMIN
            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));
            
            boolean isAdmin = adminOpt.getRoles().stream()
                    .anyMatch(r -> r.getName().equals("ADMIN"));
            
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can create users!");
            }

            // 2. Създаваме новия потребител (Правим го ПРЕДИ ролите, за да е готов да ги приеме)
            UserEntity newUser = new UserEntity();
            newUser.setUsername(payload.get("username"));
            newUser.setEmail(payload.get("email"));
            newUser.setPasswordHash(payload.get("password")); 
            newUser.setCreatedAt(java.time.LocalDateTime.now());
            newUser.setActive(true);

            // 3. НОВОТО: Четем ролите, разделени със запетая, и ги добавяме една по една
            String rolesInput = payload.get("role"); 
            String[] roleNames = rolesInput.split(",");
            
            for (String rName : roleNames) {
                // Махаме излишните интервали и правим всичко с главни букви
                String cleanRoleName = rName.trim().toUpperCase();
                
                com.sap.project.database.entities.RoleEntity role = roleRepository.findByName(cleanRoleName)
                        .orElseThrow(() -> new RuntimeException("Role not found in database: " + cleanRoleName));
                
                // Добавяме ролята към списъка с роли на новия потребител
                newUser.getRoles().add(role);
            }

            // 4. Запазваме потребителя в базата
            userRepository.save(newUser);

            return ResponseEntity.status(HttpStatus.CREATED).body("User " + newUser.getUsername() + " created successfully with roles: " + rolesInput.toUpperCase());
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Registration Error: " + e.getMessage());
        }
    }
    @PostMapping("/add-role")
    public ResponseEntity<?> addRoleToExistingUser(
            @RequestHeader("X-User-Id") Integer adminId,
            @RequestBody Map<String, String> payload) {
        
        try {
            // 1. Проверяваме дали пускащият заявката е ADMIN
            UserEntity adminOpt = userRepository.findById(adminId)
                    .orElseThrow(() -> new RuntimeException("Administrator not found!"));
            
            boolean isAdmin = adminOpt.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
            if (!isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Error: Only administrators can assign roles.");
            }

            // 2. Намираме целевия потребител по Username
            String targetUsername = payload.get("username");
            UserEntity targetUser = userRepository.findAll().stream()
                    .filter(u -> u.getUsername().equals(targetUsername))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Target user '" + targetUsername + "' not found!"));

            // 3. Добавяме новите роли
            String rolesInput = payload.get("roles");
            String[] roleNames = rolesInput.split(",");
            
            for (String rName : roleNames) {
                String cleanRoleName = rName.trim().toUpperCase();
                com.sap.project.database.entities.RoleEntity role = roleRepository.findByName(cleanRoleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + cleanRoleName));
                
                targetUser.getRoles().add(role); // Set-ът автоматично игнорира дубликати!
            }

            userRepository.save(targetUser);
         // ПРАЩАМЕ ИЗВЕСТИЕ НА ПОТРЕБИТЕЛЯ
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