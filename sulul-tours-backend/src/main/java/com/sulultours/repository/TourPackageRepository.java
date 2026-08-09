package com.sulultours.repository;

import com.sulultours.entity.TourPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TourPackageRepository extends JpaRepository<TourPackage, String> {
    List<TourPackage> findByTenantId(String tenantId);
    List<TourPackage> findByTenantIdAndStatus(String tenantId, String status);
    List<TourPackage> findByCategory(String category);
}