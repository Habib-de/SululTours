package com.sulultours.repository;

import com.sulultours.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    Optional<Vehicle> findByRegistration(String registration);
    List<Vehicle> findByTenantId(String tenantId);
    List<Vehicle> findByTenantIdAndStatus(String tenantId, String status);
    List<Vehicle> findByOwnerId(String ownerId);
}