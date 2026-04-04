package com.sap.project.config;

import com.sap.project.backend.enums.Role;
import com.sap.project.backend.enums.Status;
import com.sap.project.database.entities.DocumentEntity;
import com.sap.project.database.entities.RoleEntity;
import com.sap.project.database.entities.UserEntity;
import com.sap.project.database.entities.VersionEntity;
import com.sap.project.database.repositories.DocumentRepository;
import com.sap.project.database.repositories.RoleRepository;
import com.sap.project.database.repositories.UserRepository;
import com.sap.project.database.repositories.VersionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    @Transactional
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            RoleRepository roleRepository,
            DocumentRepository documentRepository,
            VersionRepository versionRepository) {

        return args -> {
            // Списък, в който ще събираме съобщенията, за да ги принтираме накрая
            List<String> initSummary = new ArrayList<>();

            // --- 1. СЪЗДАВАНЕ НА РОЛИ ---
            RoleEntity adminRole = roleRepository.findByName(Role.ADMIN.name())
                    .orElseGet(() -> {
                        RoleEntity role = new RoleEntity();
                        role.setName(Role.ADMIN.name());
                        return roleRepository.save(role);
                    });

            RoleEntity reviewerRole = roleRepository.findByName(Role.REVIEWER.name())
                    .orElseGet(() -> {
                        RoleEntity role = new RoleEntity();
                        role.setName(Role.REVIEWER.name());
                        return roleRepository.save(role);
                    });

            RoleEntity authorRole = roleRepository.findByName(Role.AUTHOR.name())
                    .orElseGet(() -> {
                        RoleEntity role = new RoleEntity();
                        role.setName(Role.AUTHOR.name());
                        return roleRepository.save(role);
                    });

            RoleEntity readerRole = roleRepository.findByName(Role.READER.name())
                    .orElseGet(() -> {
                        RoleEntity role = new RoleEntity();
                        role.setName(Role.READER.name());
                        return roleRepository.save(role);
                    });

            // --- 2. СЪЗДАВАНЕ НА ПОТРЕБИТЕЛИ ---
            createUser(userRepository, "admin", "admin@sap.com", "pass123", Set.of(adminRole), initSummary);
            createUser(userRepository, "reviewer", "reviewer@sap.com", "rev123", Set.of(reviewerRole), initSummary);
            UserEntity pureAuthor = createUser(userRepository, "author", "author@sap.com", "auth123", Set.of(authorRole), initSummary);
            createUser(userRepository, "reader", "reader@sap.com", "read123", Set.of(readerRole), initSummary);
            createUser(userRepository, "lead_author", "lead@sap.com", "lead123", Set.of(authorRole, reviewerRole), initSummary);
            createUser(userRepository, "super_user", "super@sap.com", "super123", Set.of(adminRole, authorRole, reviewerRole), initSummary);

            // --- 3. СЪЗДАВАНЕ НА ТЕСТОВ ДОКУМЕНТ ---
            if (documentRepository.count() == 0) {
                DocumentEntity doc = new DocumentEntity();
                doc.setTitle("First test document");
                doc.setDescription("Automatically generated document for API testing.");
                doc.setCreatedBy(pureAuthor);
                doc.setActive(true);
                doc.setCreatedAt(LocalDateTime.now());
                doc = documentRepository.save(doc);

                VersionEntity v1 = new VersionEntity();
                v1.setDocument(doc);
                v1.setVersionNumber(1);
                v1.setContent("This is the initial content of our test document.");
                v1.setStatus(Status.PENDING_REVIEW);
                v1.setCreatedBy(pureAuthor);
                v1.setCreatedAt(LocalDateTime.now());
                versionRepository.save(v1);

                initSummary.add("📄 Test Document and Version (V1 - PENDING_REVIEW) created!");
            }

            // --- 4. ПРИНТИРАНЕ НА КРАСИВ РЕЗУЛТАТ НАКРАЯ ---
            if (!initSummary.isEmpty()) {
                System.out.println("\n=========================================================");
                System.out.println("✅ DATABASE INITIALIZATION SUMMARY:");
                System.out.println("=========================================================");
                for (String log : initSummary) {
                    System.out.println(log);
                }
                System.out.println("=========================================================\n");
            }
        };
    }

    // --- ПОМОЩЕН МЕТОД ЗА СЪЗДАВАНЕ НА ПОТРЕБИТЕЛИ ---
    private UserEntity createUser(UserRepository repo, String username, String email, String password, Set<RoleEntity> roles, List<String> initSummary) {
        return repo.findByUsername(username).orElseGet(() -> {
            UserEntity user = new UserEntity();
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(password);
            user.setActive(true);
            user.setCreatedAt(LocalDateTime.now());

            user.setRoles(new HashSet<>(roles));
            UserEntity saved = repo.save(user);

            // Добавяме съобщението в списъка, вместо да го принтираме веднага
            initSummary.add("👤 User created: " + username + " (Roles: " + roles.size() + ")");
            return saved;
        });
    }
}