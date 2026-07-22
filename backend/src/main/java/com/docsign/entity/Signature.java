package com.docsign.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "signatures")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Signature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "document_id", nullable = false)
    private String documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", insertable = false, updatable = false)
    private Document document;

    @Column(name = "signer_id", nullable = false)
    private String signerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signer_id", insertable = false, updatable = false)
    private User signer;

    @Column(name = "signer_name")
    private String signerName;

    @Column(name = "signer_email")
    private String signerEmail;

    @Column(name = "page_number", nullable = false)
    private Integer pageNumber;

    @Column(name = "x_coordinate", nullable = false)
    private Double xCoordinate;

    @Column(name = "y_coordinate", nullable = false)
    private Double yCoordinate;

    @Column(name = "width")
    private Double width;

    @Column(name = "height")
    private Double height;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SignatureStatus status;

    @Column(name = "signature_image_path")
    private String signatureImagePath;

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData;

    @Enumerated(EnumType.STRING)
    @Column(name = "signature_type")
    private SignatureType signatureType;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    @Column(name = "ip_address")
    private String ipAddress;

    public enum SignatureStatus {
        PENDING, COMPLETED, REJECTED
    }

    public enum SignatureType {
        DRAW, TYPE, UPLOAD
    }
}
