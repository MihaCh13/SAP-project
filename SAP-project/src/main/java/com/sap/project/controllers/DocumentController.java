package com.sap.project.controllers;

import com.sap.project.backend.models.User;
import com.sap.project.backend.enums.Role;
import com.sap.project.backend.services.WorkflowService;
import com.sap.project.database.entities.UserEntity;
import com.sap.project.database.entities.VersionEntity;
import com.sap.project.database.mappers.UserMapper;
import com.sap.project.database.repositories.UserRepository;
import com.sap.project.database.repositories.VersionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private UserRepository userRepository;

    // --- 1. СЪЗДАВАНЕ НА ДОКУМЕНТ ---
    @PostMapping
    public ResponseEntity<String> createNewDocument(
            @RequestHeader("X-User-Id") Integer userId,
            @RequestBody Map<String, String> request) {
        try {
            User authorModel = getUserModelById(userId);

            String title = request.get("title");
            String description = request.get("description");
            String content = request.getOrDefault("content", "No content provided.");

            workflowService.createDocument(authorModel, title, description, content);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Document '" + title + "' created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating document: " + e.getMessage());
        }
    }

    // --- 2. РЕДАКТИРАНЕ НА ДОКУМЕНТ (НОВА ВЕРСИЯ) ---
    @PostMapping("/{docId}/versions")
    public ResponseEntity<String> editDocument(
            @PathVariable Integer docId,
            @RequestHeader("X-User-Id") Integer userId,
            @RequestBody String newContent) {
        try {
            User authorModel = getUserModelById(userId);

            // Намираме последната версия на този документ
            List<VersionEntity> versions = versionRepository.findByDocumentId(docId);
            if (versions.isEmpty()) throw new RuntimeException("Document has no versions!");
            VersionEntity latestVersion = versions.get(versions.size() - 1);

            workflowService.editDocument(authorModel, latestVersion.getId(), newContent);

            return ResponseEntity.ok("New version created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error during editing: " + e.getMessage());
        }
    }

    // --- 3. ИЗПРАЩАНЕ ЗА ПРЕГЛЕД ---
    @PostMapping("/versions/{versionId}/submit")
    public ResponseEntity<String> submitForReview(
            @PathVariable Integer versionId,
            @RequestHeader("X-User-Id") Integer userId) {
        try {
            User authorModel = getUserModelById(userId);
            workflowService.submitForReview(authorModel, versionId);
            return ResponseEntity.ok("Document submitted for review successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 4. ОДОБРЯВАНЕ ---
    @PutMapping("/versions/{versionId}/approve")
    public ResponseEntity<String> approveVersion(
            @PathVariable Integer versionId,
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false, defaultValue = "No comment") String comment) {
        try {
            User reviewerModel = getUserModelById(userId);
            workflowService.approveDocument(reviewerModel, versionId, comment);
            return ResponseEntity.ok("Version approved successfully! Comment: " + comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 5. ОТХВЪРЛЯНЕ ---
    @PostMapping("/versions/{versionId}/reject")
    public ResponseEntity<String> rejectVersion(
            @PathVariable Integer versionId,
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false, defaultValue = "No comment") String comment) {
        try {
            User reviewerModel = getUserModelById(userId);
            workflowService.rejectDocument(reviewerModel, versionId, comment);
            return ResponseEntity.ok("Version rejected successfully. Reason: " + comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 6. ИСТОРИЯ НА ДОКУМЕНТ ---
    @GetMapping("/{docId}/history")
    public ResponseEntity<?> getDocumentHistory(@PathVariable Integer docId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            User userModel = getUserModelById(userId);

            // Филтрираме и "смачкваме" сложния обект до прост, четим масив
            List<Map<String, String>> historySummary = versionRepository.findByDocumentId(docId).stream()
                    .filter(v -> canViewVersion(userModel, v))
                    .map(v -> {
                        String content = v.getContent();
                        String preview = content.length() > 40 ? content.substring(0, 40) + "..." : content;
                        return Map.of(
                                "Version", "V" + v.getVersionNumber(),
                                "Status", v.getStatus().toString(),
                                "Author", v.getCreatedBy() != null ? v.getCreatedBy().getUsername() : "Unknown",
                                "Preview", preview
                        );
                    })
                    .toList();

            if (historySummary.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied or No History Found.");
            }
            return ResponseEntity.ok(historySummary);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- 7. ЕКСПОРТ (TXT И PDF) ---
    @GetMapping("/versions/{versionId}/txt")
    public ResponseEntity<?> exportToTxt(@PathVariable Integer versionId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            User userModel = getUserModelById(userId);
            VersionEntity vEntity = workflowService.viewVersion(userModel, versionId); // Твоят метод за сигурност

            String fileContent = workflowService.exportVersionToText(vEntity);
            byte[] data = fileContent.getBytes();

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=document_v" + vEntity.getVersionNumber() + ".txt");

            return ResponseEntity.ok().headers(headers).contentType(MediaType.TEXT_PLAIN).body(data);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/versions/{versionId}/pdf")
    public ResponseEntity<?> exportToPdf(@PathVariable Integer versionId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            User userModel = getUserModelById(userId);
            VersionEntity vEntity = workflowService.viewVersion(userModel, versionId); // Твоят метод за сигурност

            byte[] pdfData = workflowService.exportVersionToPdf(vEntity);

            HttpHeaders headers = new HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=sap_doc_v" + vEntity.getVersionNumber() + ".pdf");
            return ResponseEntity.ok().headers(headers).contentType(MediaType.APPLICATION_PDF).body(pdfData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    // ==========================================
    // ПОМОЩНИ МЕТОДИ
    // ==========================================

    /**
     * Използва твоя UserMapper, за да вземе потребителя.
     */
    private User getUserModelById(Integer userId) {
        UserEntity uEntity = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        return UserMapper.toModel(uEntity); // <-- Твоят чист мапър!
    }

    /**
     * Помощен метод на колегата за филтриране кой какво вижда в историята.
     */
    private boolean canViewVersion(User user, VersionEntity v) {
        boolean isOnlyReader = user.getRoles().contains(Role.READER) && user.getRoles().size() == 1;
        if (isOnlyReader && v.getStatus() != com.sap.project.backend.enums.Status.APPROVED) {
            return false;
        }
        if (v.getStatus() == com.sap.project.backend.enums.Status.REJECTED) {
            boolean isOwner = v.getCreatedBy() != null && v.getCreatedBy().getId().equals(user.getId());
            boolean isReviewerOrAdmin = user.getRoles().contains(Role.REVIEWER) || user.getRoles().contains(Role.ADMIN);
            return isOwner || isReviewerOrAdmin;
        }
        return true;
    }
}