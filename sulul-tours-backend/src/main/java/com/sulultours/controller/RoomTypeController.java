package com.sulultours.controller;

import com.sulultours.dto.ApiResponse;
import com.sulultours.dto.RoomTypeDTO;
import com.sulultours.entity.RoomType;
import com.sulultours.service.RoomTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/room-types")
@RequiredArgsConstructor
// @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
public class RoomTypeController {

    private final RoomTypeService roomTypeService;

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<RoomTypeDTO>>> getAllRoomTypes() {
        List<RoomType> roomTypes = roomTypeService.getAllRoomTypes();
        List<RoomTypeDTO> dtos = roomTypes.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<RoomTypeDTO>> createRoomType(@RequestBody RoomType roomType) {
        RoomType created = roomTypeService.createRoomType(roomType);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Room type created successfully", convertToDTO(created)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<RoomTypeDTO>> getRoomTypeById(@PathVariable String id) {
        RoomType roomType = roomTypeService.getRoomTypeById(id);
        return ResponseEntity.ok(ApiResponse.success(convertToDTO(roomType)));
    }

    @GetMapping("/hotel/{hotelId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<RoomTypeDTO>>> getRoomTypesByHotel(@PathVariable String hotelId) {
        List<RoomType> roomTypes = roomTypeService.getRoomTypesByHotel(hotelId);
        List<RoomTypeDTO> dtos = roomTypes.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @GetMapping("/hotel/{hotelId}/status/{status}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<RoomTypeDTO>>> getRoomTypesByHotelAndStatus(
            @PathVariable String hotelId,
            @PathVariable String status) {
        List<RoomType> roomTypes = roomTypeService.getRoomTypesByHotelAndStatus(hotelId, status);
        List<RoomTypeDTO> dtos = roomTypes.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    // ✅ ADD THIS METHOD
    @GetMapping("/tenant/{tenantId}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<List<RoomTypeDTO>>> getRoomTypesByTenant(@PathVariable String tenantId) {
        List<RoomType> roomTypes = roomTypeService.getRoomTypesByTenant(tenantId);
        List<RoomTypeDTO> dtos = roomTypes.stream().map(this::convertToDTO).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<RoomTypeDTO>> updateRoomType(@PathVariable String id, @RequestBody RoomType roomType) {
        RoomType updated = roomTypeService.updateRoomType(id, roomType);
        return ResponseEntity.ok(ApiResponse.success("Room type updated successfully", convertToDTO(updated)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('super_admin', 'fleet_manager')")
    public ResponseEntity<ApiResponse<Void>> deleteRoomType(@PathVariable String id) {
        roomTypeService.deleteRoomType(id);
        return ResponseEntity.ok(ApiResponse.success("Room type deleted successfully", null));
    }

    private RoomTypeDTO convertToDTO(RoomType roomType) {
        RoomTypeDTO dto = new RoomTypeDTO();
        dto.setId(roomType.getId());
        dto.setHotelId(roomType.getHotel() != null ? roomType.getHotel().getId() : null);
        dto.setName(roomType.getName());
        dto.setType(roomType.getType());
        dto.setDescription(roomType.getDescription());
        dto.setPrice(roomType.getPrice());
        dto.setCapacity(roomType.getCapacity());
        dto.setBeds(roomType.getBeds());
        dto.setBedType(roomType.getBedType());
        dto.setSize(roomType.getSize());
        dto.setQuantity(roomType.getQuantity());
        dto.setStatus(roomType.getStatus());
        dto.setAmenities(roomType.getAmenities());
        dto.setImages(roomType.getImages());
        dto.setNotes(roomType.getNotes());
        dto.setCreatedAt(roomType.getCreatedAt());
        dto.setUpdatedAt(roomType.getUpdatedAt());
        return dto;
    }
}