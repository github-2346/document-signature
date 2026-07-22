package com.docsign.dto.document;

import com.docsign.entity.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDTO {

    private String id;
    private String name;
    private String ownerId;
    private String ownerName;
    private LocalDateTime uploadTime;
    private LocalDateTime updatedAt;
    private String status;
    private String fileHash;
    private Long fileSize;
    private String contentType;
    private Integer pageCount;
    private String rejectionReason;
    private List<SignatureDTO> signatures;

    public static DocumentDTO fromEntity(Document document) {
        return DocumentDTO.builder()
                .id(document.getId())
                .name(document.getName())
                .ownerId(document.getOwnerId())
                .ownerName(document.getOwner() != null ? document.getOwner().getName() : null)
                .uploadTime(document.getUploadTime())
                .updatedAt(document.getUpdatedAt())
                .status(document.getStatus().name())
                .fileHash(document.getFileHash())
                .fileSize(document.getFileSize())
                .contentType(document.getContentType())
                .pageCount(document.getPageCount())
                .rejectionReason(document.getRejectionReason())
                .signatures(document.getSignatures() != null 
                        ? document.getSignatures().stream()
                            .map(SignatureDTO::fromEntity)
                            .collect(Collectors.toList())
                        : null)
                .build();
    }
}
