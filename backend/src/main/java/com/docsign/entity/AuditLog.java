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
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "document_id")
    private String documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", insertable = false, updatable = false)
    private Document document;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Column(name = "performed_by", nullable = false)
    private String performedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by", referencedColumnName = "id", insertable = false, updatable = false)
    private User performer;

    @Column(name = "performer_name")
    private String performerName;

    @Column(name = "performer_email")
    private String performerEmail;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "document_name")
    private String documentName;

    public enum AuditAction {
        DOCUMENT_UPLOADED,
        DOCUMENT_VIEWED,
        DOCUMENT_DOWNLOADED,
        DOCUMENT_DELETED,
        SIGNATURE_PLACED,
        SIGNATURE_COMPLETED,
        SIGNATURE_REJECTED,
        PUBLIC_LINK_CREATED,
        PUBLIC_LINK_ACCESSED,
        PUBLIC_LINK_EXPIRED,
        USER_LOGIN,
        USER_LOGOUT,
        USER_REGISTERED
    }
}
