package com.sulultours.service;

import com.sulultours.entity.RoomType;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.RoomTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;

    @Transactional
    public RoomType createRoomType(RoomType roomType) {
        return roomTypeRepository.save(roomType);
    }

    public RoomType getRoomTypeById(String id) {
        return roomTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + id));
    }

    public List<RoomType> getRoomTypesByHotel(String hotelId) {
        return roomTypeRepository.findByHotelId(hotelId);
    }

    public List<RoomType> getRoomTypesByHotelAndStatus(String hotelId, String status) {
        return roomTypeRepository.findByHotelIdAndStatus(hotelId, status);
    }

    // ✅ Get room types by tenant (via hotel)
    public List<RoomType> getRoomTypesByTenant(String tenantId) {
        return roomTypeRepository.findByHotelTenantId(tenantId);
    }

    public List<RoomType> getAllRoomTypes() {
        return roomTypeRepository.findAll();
    }

    @Transactional
    public RoomType updateRoomType(String id, RoomType roomTypeDetails) {
        RoomType roomType = getRoomTypeById(id);
        roomType.setName(roomTypeDetails.getName());
        roomType.setType(roomTypeDetails.getType());
        roomType.setDescription(roomTypeDetails.getDescription());
        roomType.setPrice(roomTypeDetails.getPrice());
        roomType.setCapacity(roomTypeDetails.getCapacity());
        roomType.setBeds(roomTypeDetails.getBeds());
        roomType.setBedType(roomTypeDetails.getBedType());
        roomType.setSize(roomTypeDetails.getSize());
        roomType.setQuantity(roomTypeDetails.getQuantity());
        roomType.setStatus(roomTypeDetails.getStatus());
        roomType.setAmenities(roomTypeDetails.getAmenities());
        roomType.setImages(roomTypeDetails.getImages());
        roomType.setNotes(roomTypeDetails.getNotes());
        return roomTypeRepository.save(roomType);
    }

    @Transactional
    public void deleteRoomType(String id) {
        RoomType roomType = getRoomTypeById(id);
        roomTypeRepository.delete(roomType);
    }
}