package com.sap.project.database.mappers;

import com.sap.project.database.entities.VersionEntity;
import com.sap.project.backend.models.Version;

public class VersionMapper {

    public static Version toModel(VersionEntity e) {
        return new Version(
                e.getId(),
                e.getDocument().getId(),
                e.getVersionNumber(),
                e.getContent(),
                e.getCreatedBy().getId(),
                e.getParentVersion() != null ? e.getParentVersion().getId() : null
        );
    }
}