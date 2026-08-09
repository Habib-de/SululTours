package com.sulultours.service;

import com.sulultours.entity.Hotel;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HotelService {

    private final HotelRepository hotelRepository;

    @Transactional
    public Hotel createHotel(Hotel hotel) {
        return hotelRepository.save(hotel);
    }

    public Hotel getHotelById(String id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + id));
    }

    public List<Hotel> getHotelsByTenant(String tenantId) {
        return hotelRepository.findByTenantId(tenantId);
    }

    public List<Hotel> getHotelsByTenantAndStatus(String tenantId, String status) {
        return hotelRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<Hotel> getHotelsByCity(String city) {
        return hotelRepository.findByCity(city);
    }

    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll();
    }

    @Transactional
    public Hotel updateHotel(String id, Hotel hotelDetails) {
        Hotel hotel = getHotelById(id);
        hotel.setName(hotelDetails.getName());
        hotel.setAddress(hotelDetails.getAddress());
        hotel.setCity(hotelDetails.getCity());
        hotel.setCountry(hotelDetails.getCountry());
        hotel.setPhone(hotelDetails.getPhone());
        hotel.setEmail(hotelDetails.getEmail());
        hotel.setWebsite(hotelDetails.getWebsite());
        hotel.setDescription(hotelDetails.getDescription());
        hotel.setStarRating(hotelDetails.getStarRating());
        hotel.setStatus(hotelDetails.getStatus());
        hotel.setCheckIn(hotelDetails.getCheckIn());
        hotel.setCheckOut(hotelDetails.getCheckOut());
        hotel.setContactPerson(hotelDetails.getContactPerson());
        hotel.setContactPhone(hotelDetails.getContactPhone());
        hotel.setAmenities(hotelDetails.getAmenities());
        hotel.setImages(hotelDetails.getImages());
        hotel.setAgreementType(hotelDetails.getAgreementType());
        hotel.setAgreementDate(hotelDetails.getAgreementDate());
        hotel.setAgreementEndDate(hotelDetails.getAgreementEndDate());
        hotel.setCommissionRate(hotelDetails.getCommissionRate());
        hotel.setSupplierName(hotelDetails.getSupplierName());
        hotel.setSupplierContact(hotelDetails.getSupplierContact());
        hotel.setPaymentTerms(hotelDetails.getPaymentTerms());
        hotel.setNotes(hotelDetails.getNotes());
        return hotelRepository.save(hotel);
    }

    @Transactional
    public void deleteHotel(String id) {
        Hotel hotel = getHotelById(id);
        hotelRepository.delete(hotel);
    }
}