package com.sulultours.repository;

import com.sulultours.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findByTenantId(String tenantId);
    List<Expense> findByVehicleId(String vehicleId);
    List<Expense> findByCategory(String category);
    
    @Modifying
    @Query("update Expense e set e.createdBy = null where e.createdBy.id = :userId")
    int nullifyCreatedBy(@Param("userId") String userId);
}