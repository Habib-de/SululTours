package com.sulultours.repository;

import com.sulultours.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, String> {
    List<Hotel> findByTenantId(String tenantId);
    List<Hotel> findByTenantIdAndStatus(String tenantId, String status);
    List<Hotel> findByCity(String city);
}