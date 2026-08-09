package com.sulultours.repository;

import com.sulultours.entity.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, String> {
    List<RoomType> findByHotelId(String hotelId);
    List<RoomType> findByHotelIdAndStatus(String hotelId, String status);
    
    // ✅ Use hotel.tenant.id to find by tenant
    @Query("SELECT r FROM RoomType r WHERE r.hotel.tenant.id = :tenantId")
    List<RoomType> findByHotelTenantId(@Param("tenantId") String tenantId);
}