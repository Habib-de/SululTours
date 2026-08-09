package com.sulultours.repository;

import com.sulultours.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaintenanceRepository extends JpaRepository<MaintenanceRecord, String> {
    List<MaintenanceRecord> findByTenantId(String tenantId);
    List<MaintenanceRecord> findByVehicleId(String vehicleId);
    List<MaintenanceRecord> findByStatus(String status);
}