package com.sulultours.repository;

import com.sulultours.entity.Flight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FlightRepository extends JpaRepository<Flight, String> {
    List<Flight> findByTenantId(String tenantId);
    List<Flight> findByTenantIdAndStatus(String tenantId, String status);
    List<Flight> findByAirline(String airline);
}