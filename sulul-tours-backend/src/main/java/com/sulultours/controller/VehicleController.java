package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.VehicleDTO;
import com.sulultours.entity.CarOwner;
import com.sulultours.entity.Tenant;
import com.sulultours.entity.Vehicle;
import com.sulultours.entity.RoleEnum;
import com.sulultours.entity.User;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.CarOwnerRepository;
import com.sulultours.repository.TenantRepository;
import com.sulultours.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/vehicles")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'car_owner')")
public class VehicleController {

    private final VehicleService vehicleService;
    private final TenantRepository tenantRepository;      // ✅ ADD THIS
    private final CarOwnerRepository carOwnerRepository;  // ✅ ADD THIS
    private final com.sulultours.service.UserService userService;
    private final com.sulultours.service.CarOwnerService carOwnerService;

     @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<VehicleDTO>>> getAllVehicles() {
        List<Vehicle> vehicles = vehicleService.getAllVehicles();
        List<VehicleDTO> dtos = vehicles.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'car_owner', 'broker')")
    public ResponseEntity<ApiResponse<VehicleDTO>> createVehicle(@RequestBody VehicleDTO vehicleDTO) {
        // ✅ Convert DTO to Entity
        Vehicle vehicle = new Vehicle();
        
        // Set basic fields
        vehicle.setRegistration(vehicleDTO.getRegistration());
        vehicle.setVin(vehicleDTO.getVin());
        vehicle.setMake(vehicleDTO.getMake());
        vehicle.setModel(vehicleDTO.getModel());
        vehicle.setYear(vehicleDTO.getYear());
        vehicle.setColor(vehicleDTO.getColor());
        vehicle.setCategory(vehicleDTO.getCategory());
        vehicle.setStatus(vehicleDTO.getStatus() != null ? vehicleDTO.getStatus() : "active");
        vehicle.setMileage(vehicleDTO.getMileage());
        vehicle.setLocation(vehicleDTO.getLocation());
        vehicle.setCustodian(vehicleDTO.getCustodian());
        vehicle.setInsurance(vehicleDTO.getInsurance());
        vehicle.setPermit(vehicleDTO.getPermit());
        vehicle.setLicenseExpiry(vehicleDTO.getLicenseExpiry());
        vehicle.setRoadworthy(vehicleDTO.getRoadworthy());
        vehicle.setFuelType(vehicleDTO.getFuelType());
        vehicle.setEngineSize(vehicleDTO.getEngineSize());
        vehicle.setTransmission(vehicleDTO.getTransmission());
        vehicle.setAcquisitionDate(vehicleDTO.getAcquisitionDate());
        vehicle.setAcquisitionCost(vehicleDTO.getAcquisitionCost());
        vehicle.setPricePerDay(vehicleDTO.getPricePerDay());
        vehicle.setSeatingCapacity(vehicleDTO.getSeatingCapacity());
        vehicle.setDescription(vehicleDTO.getDescription());
        vehicle.setImages(vehicleDTO.getImages());
        
        // ✅ Set Tenant from tenantId
        if (vehicleDTO.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(vehicleDTO.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + vehicleDTO.getTenantId()));
            vehicle.setTenant(tenant);
        }
        
        // ✅ Set Owner from ownerId
        if (vehicleDTO.getOwnerId() != null) {
            CarOwner owner = carOwnerRepository.findById(vehicleDTO.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Car owner not found with id: " + vehicleDTO.getOwnerId()));
            vehicle.setOwner(owner);
        } else {
            // ✅ If caller is a broker, auto-attach their own CarOwner profile
            User current = userService.getCurrentUser();
            if (current != null && current.getRole() == RoleEnum.broker) {
                CarOwner myProfile = carOwnerService.getOrCreateProfileForUser(current);
                vehicle.setOwner(myProfile);
                System.out.println("✅ Broker " + current.getEmail()
                        + " — auto-attached CarOwner profile: " + myProfile.getId());
            }
        }
        
        Vehicle created = vehicleService.createVehicle(vehicle);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vehicle created successfully", convertToDTO(created)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<VehicleDTO>> getVehicleById(@PathVariable String id) {
        Vehicle vehicle = vehicleService.getVehicleById(id);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(vehicle)));
    }

    @GetMapping("/registration/{registration}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<VehicleDTO>> getVehicleByRegistration(@PathVariable String registration) {
        Vehicle vehicle = vehicleService.getVehicleByRegistration(registration);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(vehicle)));
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<VehicleDTO>>> getVehiclesByTenant(@PathVariable String tenantId) {
        List<Vehicle> vehicles = vehicleService.getVehiclesByTenant(tenantId);
        List<VehicleDTO> dtos = vehicles.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/tenant/{tenantId}/status/{status}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<VehicleDTO>>> getVehiclesByTenantAndStatus(
            @PathVariable String tenantId,
            @PathVariable String status) {
        List<Vehicle> vehicles = vehicleService.getVehiclesByTenantAndStatus(tenantId, status);
        List<VehicleDTO> dtos = vehicles.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/owner/{ownerId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<VehicleDTO>>> getVehiclesByOwner(@PathVariable String ownerId) {
        List<Vehicle> vehicles = vehicleService.getVehiclesByOwner(ownerId);
        List<VehicleDTO> dtos = vehicles.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager', 'car_owner', 'broker')")
    public ResponseEntity<ApiResponse<VehicleDTO>> updateVehicle(@PathVariable String id, @RequestBody VehicleDTO vehicleDTO) {
                // ✅ Convert DTO to Entity for update
        Vehicle vehicle = vehicleService.getVehicleById(id);

        // ✅ Brokers can only update vehicles they own
        User current = userService.getCurrentUser();
        if (current != null && current.getRole() == RoleEnum.broker) {
            if (vehicle.getOwner() == null
                    || vehicle.getOwner().getUser() == null
                    || !vehicle.getOwner().getUser().getId().equals(current.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("You can only update your own vehicles"));
            }
        }
        
        // Update basic fields
        vehicle.setRegistration(vehicleDTO.getRegistration());
        vehicle.setVin(vehicleDTO.getVin());
        vehicle.setMake(vehicleDTO.getMake());
        vehicle.setModel(vehicleDTO.getModel());
        vehicle.setYear(vehicleDTO.getYear());
        vehicle.setColor(vehicleDTO.getColor());
        vehicle.setCategory(vehicleDTO.getCategory());
        vehicle.setStatus(vehicleDTO.getStatus());
        vehicle.setMileage(vehicleDTO.getMileage());
        vehicle.setLocation(vehicleDTO.getLocation());
        vehicle.setCustodian(vehicleDTO.getCustodian());
        vehicle.setInsurance(vehicleDTO.getInsurance());
        vehicle.setPermit(vehicleDTO.getPermit());
        vehicle.setLicenseExpiry(vehicleDTO.getLicenseExpiry());
        vehicle.setRoadworthy(vehicleDTO.getRoadworthy());
        vehicle.setFuelType(vehicleDTO.getFuelType());
        vehicle.setEngineSize(vehicleDTO.getEngineSize());
        vehicle.setTransmission(vehicleDTO.getTransmission());
        vehicle.setAcquisitionDate(vehicleDTO.getAcquisitionDate());
        vehicle.setAcquisitionCost(vehicleDTO.getAcquisitionCost());
        vehicle.setPricePerDay(vehicleDTO.getPricePerDay());
        vehicle.setSeatingCapacity(vehicleDTO.getSeatingCapacity());
        vehicle.setDescription(vehicleDTO.getDescription());
        vehicle.setImages(vehicleDTO.getImages());
        
        // ✅ Update Tenant from tenantId
        if (vehicleDTO.getTenantId() != null) {
            Tenant tenant = tenantRepository.findById(vehicleDTO.getTenantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with id: " + vehicleDTO.getTenantId()));
            vehicle.setTenant(tenant);
        } else {
            vehicle.setTenant(null);
        }
        
        // ✅ Update Owner from ownerId — only if explicitly provided
        //    (prevents accidental un-assignment when ownerId is omitted in the payload)
        if (vehicleDTO.getOwnerId() != null) {
            CarOwner owner = carOwnerRepository.findById(vehicleDTO.getOwnerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Car owner not found with id: " + vehicleDTO.getOwnerId()));
            vehicle.setOwner(owner);
        }
        
        Vehicle updated = vehicleService.updateVehicle(id, vehicle);
        return ResponseEntity.ok(ApiResponse.success("Vehicle updated successfully", convertToDTO(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable String id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.ok(ApiResponse.success("Vehicle deleted successfully", null));
    }

    private VehicleDTO convertToDTO(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();
        dto.setId(vehicle.getId());
        dto.setTenantId(vehicle.getTenant() != null ? vehicle.getTenant().getId() : null);
        dto.setOwnerId(vehicle.getOwner() != null ? vehicle.getOwner().getId() : null);
        dto.setRegistration(vehicle.getRegistration());
        dto.setVin(vehicle.getVin());
        dto.setMake(vehicle.getMake());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setColor(vehicle.getColor());
        dto.setCategory(vehicle.getCategory());
        dto.setStatus(vehicle.getStatus());
        dto.setMileage(vehicle.getMileage());
        dto.setLocation(vehicle.getLocation());
        dto.setCustodian(vehicle.getCustodian());
        dto.setInsurance(vehicle.getInsurance());
        dto.setPermit(vehicle.getPermit());
        dto.setLicenseExpiry(vehicle.getLicenseExpiry());
        dto.setRoadworthy(vehicle.getRoadworthy());
        dto.setFuelType(vehicle.getFuelType());
        dto.setEngineSize(vehicle.getEngineSize());
        dto.setTransmission(vehicle.getTransmission());
        dto.setAcquisitionDate(vehicle.getAcquisitionDate());
        dto.setAcquisitionCost(vehicle.getAcquisitionCost());
        dto.setPricePerDay(vehicle.getPricePerDay());
        dto.setSeatingCapacity(vehicle.getSeatingCapacity());
        dto.setDescription(vehicle.getDescription());
        dto.setImages(vehicle.getImages());
        dto.setCreatedAt(vehicle.getCreatedAt());
        return dto;
    }
}