package com.sulultours.repository;

import com.sulultours.entity.TourGuide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TourGuideRepository extends JpaRepository<TourGuide, String> {
    List<TourGuide> findByTenantId(String tenantId);
    List<TourGuide> findByTenantIdAndStatus(String tenantId, String status);
    List<TourGuide> findByAvailability(String availability);
}