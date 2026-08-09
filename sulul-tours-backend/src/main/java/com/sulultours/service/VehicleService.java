package com.sulultours.service;

import com.sulultours.entity.Vehicle;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    @Transactional
    public Vehicle createVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    public Vehicle getVehicleById(String id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
    }

    public Vehicle getVehicleByRegistration(String registration) {
        return vehicleRepository.findByRegistration(registration)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with registration: " + registration));
    }

    public List<Vehicle> getVehiclesByTenant(String tenantId) {
        return vehicleRepository.findByTenantId(tenantId);
    }

    public List<Vehicle> getVehiclesByTenantAndStatus(String tenantId, String status) {
        return vehicleRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<Vehicle> getVehiclesByOwner(String ownerId) {
        return vehicleRepository.findByOwnerId(ownerId);
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @Transactional
    public Vehicle updateVehicle(String id, Vehicle vehicleDetails) {
        Vehicle vehicle = getVehicleById(id);
        vehicle.setRegistration(vehicleDetails.getRegistration());
        vehicle.setVin(vehicleDetails.getVin());
        vehicle.setMake(vehicleDetails.getMake());
        vehicle.setModel(vehicleDetails.getModel());
        vehicle.setYear(vehicleDetails.getYear());
        vehicle.setColor(vehicleDetails.getColor());
        vehicle.setCategory(vehicleDetails.getCategory());
        vehicle.setStatus(vehicleDetails.getStatus());
        vehicle.setMileage(vehicleDetails.getMileage());
        vehicle.setLocation(vehicleDetails.getLocation());
        vehicle.setCustodian(vehicleDetails.getCustodian());
        vehicle.setInsurance(vehicleDetails.getInsurance());
        vehicle.setPermit(vehicleDetails.getPermit());
        vehicle.setLicenseExpiry(vehicleDetails.getLicenseExpiry());
        vehicle.setRoadworthy(vehicleDetails.getRoadworthy());
        vehicle.setFuelType(vehicleDetails.getFuelType());
        vehicle.setEngineSize(vehicleDetails.getEngineSize());
        vehicle.setTransmission(vehicleDetails.getTransmission());
        vehicle.setAcquisitionDate(vehicleDetails.getAcquisitionDate());
        vehicle.setAcquisitionCost(vehicleDetails.getAcquisitionCost());
        vehicle.setPricePerDay(vehicleDetails.getPricePerDay());
        vehicle.setSeatingCapacity(vehicleDetails.getSeatingCapacity());
        vehicle.setDescription(vehicleDetails.getDescription());
        vehicle.setImages(vehicleDetails.getImages());
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public void deleteVehicle(String id) {
        Vehicle vehicle = getVehicleById(id);
        vehicleRepository.delete(vehicle);
    }
}