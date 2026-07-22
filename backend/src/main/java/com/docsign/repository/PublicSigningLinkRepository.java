package com.docsign.repository;

import com.docsign.entity.PublicSigningLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PublicSigningLinkRepository extends JpaRepository<PublicSigningLink, String> {

    Optional<PublicSigningLink> findByToken(String token);

    List<PublicSigningLink> findByDocumentId(String documentId);

    List<PublicSigningLink> findBySignerEmail(String signerEmail);

    @Query("SELECT p FROM PublicSigningLink p WHERE p.documentId = :documentId AND p.status IN ('PENDING', 'ACCESSED')")
    List<PublicSigningLink> findActiveByDocumentId(@Param("documentId") String documentId);

    @Query("SELECT p FROM PublicSigningLink p WHERE p.expiresAt < :now AND p.status IN ('PENDING', 'ACCESSED')")
    List<PublicSigningLink> findExpiredLinks(@Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE PublicSigningLink p SET p.status = 'EXPIRED' WHERE p.expiresAt < :now AND p.status IN ('PENDING', 'ACCESSED')")
    int expireOldLinks(@Param("now") LocalDateTime now);

    boolean existsByTokenAndStatus(String token, PublicSigningLink.LinkStatus status);
}
