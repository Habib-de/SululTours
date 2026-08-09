package com.sulultours.service;

import com.sulultours.entity.Airline;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.AirlineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AirlineService {

    private final AirlineRepository airlineRepository;

    @Transactional
    public Airline createAirline(Airline airline) {
        return airlineRepository.save(airline);
    }

    public Airline getAirlineById(String id) {
        return airlineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Airline not found with id: " + id));
    }

    public Airline getAirlineByCode(String code) {
        return airlineRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Airline not found with code: " + code));
    }

    public List<Airline> getAirlinesByTenant(String tenantId) {
        return airlineRepository.findByTenantId(tenantId);
    }

    @Transactional
    public Airline updateAirline(String id, Airline airlineDetails) {
        Airline airline = getAirlineById(id);
        airline.setName(airlineDetails.getName());
        airline.setCode(airlineDetails.getCode());
        airline.setCountry(airlineDetails.getCountry());
        airline.setHeadquarters(airlineDetails.getHeadquarters());
        airline.setFounded(airlineDetails.getFounded());
        airline.setFleetSize(airlineDetails.getFleetSize());
        airline.setDestinations(airlineDetails.getDestinations());
        airline.setWebsite(airlineDetails.getWebsite());
        airline.setPhone(airlineDetails.getPhone());
        airline.setEmail(airlineDetails.getEmail());
        airline.setStatus(airlineDetails.getStatus());
        airline.setAlliance(airlineDetails.getAlliance());
        airline.setStarRating(airlineDetails.getStarRating());
        airline.setBaggageAllowance(airlineDetails.getBaggageAllowance());
        airline.setAmenities(airlineDetails.getAmenities());
        airline.setDescription(airlineDetails.getDescription());
        airline.setImage(airlineDetails.getImage());
        airline.setNotes(airlineDetails.getNotes());
        return airlineRepository.save(airline);
    }

    @Transactional
    public void deleteAirline(String id) {
        Airline airline = getAirlineById(id);
        airlineRepository.delete(airline);
    }
}