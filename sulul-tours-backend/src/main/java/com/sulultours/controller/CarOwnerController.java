package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.CarOwnerDTO;
import com.sulultours.entity.CarOwner;
import com.sulultours.service.CarOwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/car-owners")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class CarOwnerController {

    private final CarOwnerService carOwnerService;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<CarOwnerDTO>>> getAllCarOwners() {
        List<CarOwner> carOwners = carOwnerService.getAllCarOwners();
        List<CarOwnerDTO> dtos = carOwners.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
     @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<CarOwnerDTO>> createCarOwner(@RequestBody CarOwner carOwner) {
        CarOwner created = carOwnerService.createCarOwner(carOwner);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Car owner created successfully", convertToDTO(created)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<CarOwnerDTO>> getCarOwnerById(@PathVariable String id) {
        CarOwner carOwner = carOwnerService.getCarOwnerById(id);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(carOwner)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<CarOwnerDTO>> getCarOwnerByUserId(@PathVariable String userId) {
        CarOwner carOwner = carOwnerService.getCarOwnerByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(carOwner)));
    }

    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<CarOwnerDTO>>> getCarOwnersByTenant(@PathVariable String tenantId) {
        List<CarOwner> carOwners = carOwnerService.getCarOwnersByTenant(tenantId);
        List<CarOwnerDTO> dtos = carOwners.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<CarOwnerDTO>>> getCarOwnersByStatus(@PathVariable String status) {
        List<CarOwner> carOwners = carOwnerService.getCarOwnersByStatus(status);
        List<CarOwnerDTO> dtos = carOwners.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<CarOwnerDTO>> updateCarOwner(@PathVariable String id, @RequestBody CarOwner carOwner) {
        CarOwner updated = carOwnerService.updateCarOwner(id, carOwner);
        return ResponseEntity.ok(ApiResponse.success("Car owner updated successfully", convertToDTO(updated)));
    }

    @PatchMapping("/{id}/approve")
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")  // ✅ Changed
public ResponseEntity<ApiResponse<CarOwnerDTO>> approveCarOwner(@PathVariable String id) {
    CarOwner updated = carOwnerService.approveCarOwner(id);
    return ResponseEntity.ok(ApiResponse.success("Car owner approved successfully", convertToDTO(updated)));
}

    @DeleteMapping("/{id}")
@PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")  // ✅ Changed
public ResponseEntity<ApiResponse<Void>> deleteCarOwner(@PathVariable String id) {
    carOwnerService.deleteCarOwner(id);
    return ResponseEntity.ok(ApiResponse.success("Car owner deleted successfully", null));
}

    private CarOwnerDTO convertToDTO(CarOwner carOwner) {
        CarOwnerDTO dto = new CarOwnerDTO();
        dto.setId(carOwner.getId());
        dto.setTenantId(carOwner.getTenant() != null ? carOwner.getTenant().getId() : null);
        dto.setUserId(carOwner.getUser() != null ? carOwner.getUser().getId() : null);
        dto.setName(carOwner.getName());
        dto.setEmail(carOwner.getEmail());
        dto.setPhone(carOwner.getPhone());
        dto.setIdNumber(carOwner.getIdNumber());
        dto.setAddress(carOwner.getAddress());
        dto.setCompanyName(carOwner.getCompanyName());
        dto.setStatus(carOwner.getStatus());
        dto.setVehicleCount(carOwner.getVehicleCount());
        dto.setApprovedAt(carOwner.getApprovedAt());
        dto.setCreatedAt(carOwner.getCreatedAt());
        return dto;
    }
}