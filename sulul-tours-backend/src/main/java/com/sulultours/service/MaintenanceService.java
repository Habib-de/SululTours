package com.sulultours.service;

import com.sulultours.entity.MaintenanceRecord;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.MaintenanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;

    @Transactional
    public MaintenanceRecord createMaintenance(MaintenanceRecord maintenance) {
        return maintenanceRepository.save(maintenance);
    }

    public MaintenanceRecord getMaintenanceById(String id) {
        return maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance record not found with id: " + id));
    }

    public List<MaintenanceRecord> getMaintenanceByTenant(String tenantId) {
        return maintenanceRepository.findByTenantId(tenantId);
    }

    public List<MaintenanceRecord> getMaintenanceByVehicle(String vehicleId) {
        return maintenanceRepository.findByVehicleId(vehicleId);
    }

    public List<MaintenanceRecord> getMaintenanceByStatus(String status) {
        return maintenanceRepository.findByStatus(status);
    }

    @Transactional
    public MaintenanceRecord updateMaintenance(String id, MaintenanceRecord maintenanceDetails) {
        MaintenanceRecord maintenance = getMaintenanceById(id);
        maintenance.setMaintenanceType(maintenanceDetails.getMaintenanceType());
        maintenance.setDescription(maintenanceDetails.getDescription());
        maintenance.setCost(maintenanceDetails.getCost());
        maintenance.setDate(maintenanceDetails.getDate());
        maintenance.setNextDueDate(maintenanceDetails.getNextDueDate());
        maintenance.setStatus(maintenanceDetails.getStatus());
        maintenance.setPriority(maintenanceDetails.getPriority());
        maintenance.setTechnician(maintenanceDetails.getTechnician());
        maintenance.setReceiptImage(maintenanceDetails.getReceiptImage());
        maintenance.setNotes(maintenanceDetails.getNotes());
        return maintenanceRepository.save(maintenance);
    }

    @Transactional
    public void deleteMaintenance(String id) {
        MaintenanceRecord maintenance = getMaintenanceById(id);
        maintenanceRepository.delete(maintenance);
    }
}