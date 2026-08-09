package com.sulultours.repository;

import com.sulultours.entity.CarOwner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarOwnerRepository extends JpaRepository<CarOwner, String> {
    Optional<CarOwner> findByUserId(String userId);
    List<CarOwner> findByTenantId(String tenantId);
    List<CarOwner> findByStatus(String status);
}