package com.docsign.repository;

import com.docsign.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    List<Document> findByOwnerId(String ownerId);

    Page<Document> findByOwnerId(String ownerId, Pageable pageable);

    List<Document> findByOwnerIdAndStatus(String ownerId, Document.DocumentStatus status);

    @Query("SELECT d FROM Document d WHERE d.ownerId = :ownerId ORDER BY d.uploadTime DESC")
    List<Document> findRecentByOwnerId(@Param("ownerId") String ownerId, Pageable pageable);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.ownerId = :ownerId")
    long countByOwnerId(@Param("ownerId") String ownerId);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.ownerId = :ownerId AND d.status = :status")
    long countByOwnerIdAndStatus(@Param("ownerId") String ownerId, @Param("status") Document.DocumentStatus status);

    @Query("SELECT d FROM Document d WHERE d.ownerId = :ownerId AND " +
           "(LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Document> searchByOwnerIdAndName(@Param("ownerId") String ownerId, 
                                          @Param("search") String search, 
                                          Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.uploadTime BETWEEN :startDate AND :endDate")
    List<Document> findByUploadTimeBetween(@Param("startDate") LocalDateTime startDate, 
                                           @Param("endDate") LocalDateTime endDate);

    boolean existsByFileHash(String fileHash);
}
