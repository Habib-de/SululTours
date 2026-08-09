package com.sulultours.repository;

import com.sulultours.entity.Airline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AirlineRepository extends JpaRepository<Airline, String> {
    Optional<Airline> findByCode(String code);
    List<Airline> findByTenantId(String tenantId);
}