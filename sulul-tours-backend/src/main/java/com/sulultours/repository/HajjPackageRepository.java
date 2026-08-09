package com.sulultours.repository;

import com.sulultours.entity.HajjPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HajjPackageRepository extends JpaRepository<HajjPackage, String> {
    List<HajjPackage> findByTenantId(String tenantId);
    List<HajjPackage> findByTenantIdAndStatus(String tenantId, String status);
    List<HajjPackage> findByType(String type);
}