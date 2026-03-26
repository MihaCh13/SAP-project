package com.sap.project.controllers;

import com.sap.project.backend.models.User;
import com.sap.project.backend.models.Version;
import com.sap.project.backend.models.Document;
import com.sap.project.backend.enums.Role;
import com.sap.project.backend.services.WorkflowService;
import com.sap.project.database.repositories.VersionRepository;
import com.sap.project.database.entities.VersionEntity;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class DocumentController {

    @Autowired
    private WorkflowService workflowService;

    @Autowired
    private VersionRepository versionRepository;

    public List<VersionEntity> getDocumentHistory(Integer docId) {
        return versionRepository.findByDocumentId(docId);
    }

    public String approveVersion(Integer versionId, String comment) {

        VersionEntity vEntity = versionRepository.findById(versionId)
                .orElseThrow(() -> new RuntimeException("Version not found with ID: " + versionId));

        Document docModel = new Document(
                vEntity.getDocument().getId(),
                "Title from DB",
                "Description from DB",
                vEntity.getCreatedBy().getId()
        );

        Version versionModel = new Version(
                vEntity.getId(),
                vEntity.getDocument().getId(),
                vEntity.getVersionNumber(),
                vEntity.getContent(),
                vEntity.getCreatedBy().getId(),
                vEntity.getParentVersion() != null ? vEntity.getParentVersion().getId() : null
        );


        Set<Role> reviewerRoles = new HashSet<>();
        reviewerRoles.add(Role.REVIEWER);

        User reviewerModel = new User(
                2,
                "ReviewerAlpha",
                "reviewer@sap.com",
                "hashed_pass_123",
                reviewerRoles
        );

        workflowService.approveDocument(reviewerModel, versionModel, docModel);

        return "Версията е одобрена успешно! Коментар: " + comment;
    }
}