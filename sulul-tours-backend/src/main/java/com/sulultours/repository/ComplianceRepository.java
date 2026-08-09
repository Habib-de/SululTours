package com.sulultours.repository;

import com.sulultours.entity.Compliance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplianceRepository extends JpaRepository<Compliance, String> {
    List<Compliance> findByTenantId(String tenantId);
    List<Compliance> findByVehicleId(String vehicleId);
    List<Compliance> findByStatus(String status);
}