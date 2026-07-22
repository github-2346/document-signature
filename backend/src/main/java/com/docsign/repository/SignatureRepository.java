package com.docsign.repository;

import com.docsign.entity.Signature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SignatureRepository extends JpaRepository<Signature, String> {

    List<Signature> findByDocumentId(String documentId);

    List<Signature> findBySignerId(String signerId);

    List<Signature> findByDocumentIdAndStatus(String documentId, Signature.SignatureStatus status);

    @Query("SELECT s FROM Signature s WHERE s.documentId = :documentId ORDER BY s.pageNumber, s.createdAt")
    List<Signature> findByDocumentIdOrderByPageNumber(@Param("documentId") String documentId);

    @Query("SELECT COUNT(s) FROM Signature s WHERE s.documentId = :documentId AND s.status = :status")
    long countByDocumentIdAndStatus(@Param("documentId") String documentId, 
                                    @Param("status") Signature.SignatureStatus status);

    @Query("SELECT COUNT(s) FROM Signature s WHERE s.signerId = :signerId")
    long countBySignerId(@Param("signerId") String signerId);

    boolean existsByDocumentIdAndSignerId(String documentId, String signerId);
}
