package com.docsign.dto.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignatureRequest {

    @NotBlank(message = "Document ID is required")
    private String documentId;

    @NotNull(message = "Page number is required")
    private Integer pageNumber;

    @NotNull(message = "X coordinate is required")
    private Double xCoordinate;

    @NotNull(message = "Y coordinate is required")
    private Double yCoordinate;

    private Double width;
    private Double height;

    @NotBlank(message = "Signature type is required")
    private String signatureType;

    private String signatureData;
}
