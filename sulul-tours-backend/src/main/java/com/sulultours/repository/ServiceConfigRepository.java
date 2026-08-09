package com.sulultours.repository;

import com.sulultours.entity.ServiceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceConfigRepository extends JpaRepository<ServiceConfig, String> {
    Optional<ServiceConfig> findByTenantIdAndServiceId(String tenantId, String serviceId);
    List<ServiceConfig> findByTenantId(String tenantId);
}