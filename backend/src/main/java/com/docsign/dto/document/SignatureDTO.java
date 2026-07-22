package com.docsign.dto.document;

import com.docsign.entity.Signature;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignatureDTO {

    private String id;
    private String documentId;
    private String signerId;
    private String signerName;
    private String signerEmail;
    private Integer pageNumber;
    private Double xCoordinate;
    private Double yCoordinate;
    private Double width;
    private Double height;
    private String status;
    private String signatureType;
    private LocalDateTime createdAt;
    private LocalDateTime signedAt;

    public static SignatureDTO fromEntity(Signature signature) {
        return SignatureDTO.builder()
                .id(signature.getId())
                .documentId(signature.getDocumentId())
                .signerId(signature.getSignerId())
                .signerName(signature.getSignerName())
                .signerEmail(signature.getSignerEmail())
                .pageNumber(signature.getPageNumber())
                .xCoordinate(signature.getXCoordinate())
                .yCoordinate(signature.getYCoordinate())
                .width(signature.getWidth())
                .height(signature.getHeight())
                .status(signature.getStatus().name())
                .signatureType(signature.getSignatureType() != null ? signature.getSignatureType().name() : null)
                .createdAt(signature.getCreatedAt())
                .signedAt(signature.getSignedAt())
                .build();
    }
}
