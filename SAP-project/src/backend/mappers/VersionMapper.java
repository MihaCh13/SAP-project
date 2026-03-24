package backend.mappers;

import backend.entities.VersionEntity;
import backend.models.Version;

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