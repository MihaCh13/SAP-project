package com.sap.project.controllers;

import com.sap.project.backend.models.User;
import com.sap.project.backend.models.Version;
import com.sap.project.backend.models.Document;
import com.sap.project.backend.enums.Role;
import com.sap.project.backend.services.WorkflowService;
import com.sap.project.database.repositories.VersionRepository;
import com.sap.project.database.repositories.UserRepository;
import com.sap.project.database.entities.VersionEntity;
import com.sap.project.database.entities.UserEntity;
//import com.sap.project.api.dto.CreateDocumentRequestDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private VersionRepository versionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<String> createNewDocument(
            @RequestHeader("X-User-Id") Integer userId, 
            @RequestBody Map<String, String> request) { // <-- Използваме Map вместо DTO за по-лесно
        try {
            UserEntity uEntity = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found!"));
            User authorModel = mapToUserModel(uEntity);

            // Вземаме данните от JSON-а
            String title = request.get("title");
            String description = request.get("description");
            String content = request.getOrDefault("content", "No content provided."); // <-- ВЗЕМАМЕ ИСТИНСКИЯ ТЕКСТ

            workflowService.createDocument(authorModel, 1001, title, description, content);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Document '" + title + "' created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error creating document: " + e.getMessage());
        }
    }

   
    @GetMapping("/{docId}/history")
    public ResponseEntity<?> getDocumentHistory(@PathVariable Integer docId, @RequestHeader("X-User-Id") Integer userId) {
        UserEntity uEntity = userRepository.findById(userId).orElseThrow();
        User userModel = mapToUserModel(uEntity);

        // Филтрираме и "смачкваме" сложния обект до прост, четим масив
        List<Map<String, String>> historySummary = versionRepository.findByDocumentId(docId).stream()
                .filter(v -> canViewVersion(userModel, v))
                .map(v -> {
                    // Правим кратко превю на текста (първите 40 символа)
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
    }

    @PostMapping("/versions/{versionId}/submit")
    public ResponseEntity<String> submitForReview(
            @PathVariable Integer versionId,
            @RequestHeader("X-User-Id") Integer userId) {
        try {
            VersionEntity vEntity = versionRepository.findById(versionId)
                    .orElseThrow(() -> new RuntimeException("Version not found!"));
            UserEntity uEntity = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found!"));
            
            Version versionModel = mapToVersionModel(vEntity);
            User authorModel = mapToUserModel(uEntity);

            workflowService.submitForReview(authorModel, versionModel);

            return ResponseEntity.ok("Document submitted for review successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error during submission: " + e.getMessage());
        }
    }

    @PostMapping("/versions/{versionId}/reject")
    public ResponseEntity<String> rejectVersion(
            @PathVariable Integer versionId, 
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false, defaultValue = "No comment") String comment) {
        try {
            VersionEntity vEntity = versionRepository.findById(versionId)
                    .orElseThrow(() -> new RuntimeException("Version not found!"));
            UserEntity uEntity = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found!"));
            
            Version versionModel = mapToVersionModel(vEntity);
            //versionModel.submitForReview(); // Prepare model state
            User reviewerModel = mapToUserModel(uEntity);
            
            workflowService.rejectDocument(reviewerModel, versionModel);

            return ResponseEntity.ok("Version rejected successfully. Reason: " + comment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error during rejection: " + e.getMessage());
        }
    }

    @GetMapping("/versions/{versionId}")
    public ResponseEntity<?> viewVersion(
            @PathVariable Integer versionId, 
            @RequestHeader("X-User-Id") Integer userId) {
        try {
            VersionEntity vEntity = versionRepository.findById(versionId)
                    .orElseThrow(() -> new RuntimeException("Version not found!"));
            
            UserEntity uEntity = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found!"));
            
            Version versionModel = mapToVersionModel(vEntity);
            User userModel = mapToUserModel(uEntity);
            workflowService.viewVersion(userModel, versionModel);

            return ResponseEntity.ok(vEntity);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/versions/{versionId}/approve")
    public ResponseEntity<String> approveVersion(
            @PathVariable Integer versionId, 
            @RequestHeader("X-User-Id") Integer userId,
            @RequestParam(required = false, defaultValue = "No comment") String comment) {

        try {
            VersionEntity vEntity = versionRepository.findById(versionId)
                    .orElseThrow(() -> new RuntimeException("Version not found with ID: " + versionId));
            UserEntity uEntity = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found!"));

            Document docModel = new Document(
                    vEntity.getDocument().getId(),
                    vEntity.getDocument().getTitle(),
                    vEntity.getDocument().getDescription(),
                    vEntity.getCreatedBy() != null ? vEntity.getCreatedBy().getId() : 1
            );

            Version versionModel = mapToVersionModel(vEntity);
           // versionModel.submitForReview(); 

            User reviewerModel = mapToUserModel(uEntity);

            workflowService.approveDocument(reviewerModel, versionModel, docModel);

            return ResponseEntity.ok("Version approved successfully! Comment: " + comment);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error during approval: " + e.getMessage());
        }
    }

    @PostMapping("/{docId}/versions")
    public ResponseEntity<String> editDocument(
            @PathVariable Integer docId,
            @RequestHeader("X-User-Id") Integer userId,
            @RequestBody String newContent) {
        
        try {
            com.sap.project.database.entities.DocumentEntity docEntity = versionRepository.findAll()
                    .stream()
                    .filter(v -> v.getDocument().getId().equals(docId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Document not found!"))
                    .getDocument();

            List<VersionEntity> versions = versionRepository.findByDocumentId(docId);
            VersionEntity latestVEntity = versions.get(versions.size() - 1); 

            UserEntity uEntity = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found!"));
            User authorModel = mapToUserModel(uEntity);
            
            Document docModel = new Document(docEntity.getId(), docEntity.getTitle(), docEntity.getDescription(), docEntity.getCreatedBy().getId());
            Version parentVersionModel = mapToVersionModel(latestVEntity);

            int newVersionNumber = latestVEntity.getVersionNumber() + 1;
            
            workflowService.editDocument(
                    authorModel, 
                    docModel, 
                    parentVersionModel, 
                    1, 
                    newVersionNumber, 
                    newContent
            );

            return ResponseEntity.ok("New version V" + newVersionNumber + " created successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error during editing: " + e.getMessage());
        }
    }

    @GetMapping("/versions/{versionId}/export/txt")
    public ResponseEntity<?> exportToTxt(@PathVariable Integer versionId,@RequestHeader("X-User-Id") Integer userId) {
        try {
        	 VersionEntity vEntity = versionRepository.findById(versionId).orElseThrow();
             UserEntity uEntity = userRepository.findById(userId).orElseThrow();
            if (!canViewVersion(mapToUserModel(uEntity), vEntity)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied! You cannot export this document.");
            }
            
            String fileContent = workflowService.exportVersionToText(vEntity);
            byte[] data = fileContent.getBytes();

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=document_v" + vEntity.getVersionNumber() + ".txt");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(org.springframework.http.MediaType.TEXT_PLAIN)
                    .body(data);
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping("/versions/{versionId}/pdf")
    public ResponseEntity<?> exportToPdf(@PathVariable Integer versionId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            VersionEntity vEntity = versionRepository.findById(versionId).orElseThrow();
            UserEntity uEntity = userRepository.findById(userId).orElseThrow();
            
            // Проверка за достъп преди експорт
            if (!canViewVersion(mapToUserModel(uEntity), vEntity)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied! You cannot export this document.");
            }

            byte[] pdfData = workflowService.exportVersionToPdf(vEntity);
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.add("Content-Disposition", "attachment; filename=sap_doc_v" + vEntity.getVersionNumber() + ".pdf");
            return ResponseEntity.ok().headers(headers).contentType(org.springframework.http.MediaType.APPLICATION_PDF).body(pdfData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }


    private User mapToUserModel(UserEntity uEntity) {
        Set<Role> roles = new HashSet<>();
        
        for (com.sap.project.database.entities.RoleEntity rEntity : uEntity.getRoles()) {
            try {
                roles.add(Role.valueOf(rEntity.getName().toUpperCase()));
            } catch (Exception e) {
                System.out.println("Unknown role in database: " + rEntity.getName());
            }
        }
        
        return new User(
                uEntity.getId(), 
                uEntity.getUsername(), 
                uEntity.getEmail(), 
                uEntity.getPasswordHash(), 
                roles
        );
    }
    @GetMapping
    public ResponseEntity<?> getAllDocuments(@RequestHeader("X-User-Id") Integer userId) {
        UserEntity uEntity = userRepository.findById(userId).orElseThrow();
        User userModel = mapToUserModel(uEntity);

        // Филтрираме документите според правата
        List<Map<String, Object>> docs = versionRepository.findAll().stream()
                .filter(v -> canViewVersion(userModel, v)) // <-- ТУК РАБОТИ ЗАЩИТАТА
                .map(v -> Map.<String, Object>of(
                        "docId", v.getDocument().getId(),
                        "versionId", v.getId(),
                        "title", v.getDocument().getTitle(),
                        "status", v.getStatus().toString()
                )).toList();
        
        return ResponseEntity.ok(docs);
    }
    private Version mapToVersionModel(VersionEntity vEntity) {
        Version model = new Version(
                vEntity.getId(),
                vEntity.getDocument().getId(),
                vEntity.getVersionNumber(),
                vEntity.getContent(),
                vEntity.getCreatedBy() != null ? vEntity.getCreatedBy().getId() : 1,
                vEntity.getParentVersion() != null ? vEntity.getParentVersion().getId() : null
        );

        // Стандартизираме мапването, за да спазим правилата на модела
        if (vEntity.getStatus() == com.sap.project.backend.enums.Status.PENDING_REVIEW) {
            model.submitForReview(); 
        } 
        else if (vEntity.getStatus() == com.sap.project.backend.enums.Status.APPROVED) {
            // Трябва първо да минем през Pending, за да е доволен моделът
            model.submitForReview(); 
            model.approve(vEntity.getApprovedBy() != null ? vEntity.getApprovedBy().getId() : 0);
        } 
        else if (vEntity.getStatus() == com.sap.project.backend.enums.Status.REJECTED) {
            // Трябва първо да минем през Pending, за да е доволен моделът
            model.submitForReview(); 
            model.reject();
        }

        return model;
    }
 // Помощен метод, който проверява дали даден потребител има право да ВИЖДА дадена версия
    private boolean canViewVersion(User user, VersionEntity v) {
        // Правило 1: READER вижда САМО Approved
        boolean isOnlyReader = user.getRoles().contains(Role.READER) && user.getRoles().size() == 1;
        if (isOnlyReader && v.getStatus() != com.sap.project.backend.enums.Status.APPROVED) {
            return false;
        }

        // Правило 2: REJECTED се вижда само от Автора си, Reviewer или Admin
        if (v.getStatus() == com.sap.project.backend.enums.Status.REJECTED) {
            boolean isOwner = v.getCreatedBy() != null && v.getCreatedBy().getId().equals(user.getId());
            boolean isReviewerOrAdmin = user.getRoles().contains(Role.REVIEWER) || user.getRoles().contains(Role.ADMIN);
            return isOwner || isReviewerOrAdmin;
        }

        // За всички останали случаи (напр. Draft, Pending) предполагаме, че могат да се видят
        // (Освен от Reader, което вече блокирахме горе)
        return true;
    }
    }