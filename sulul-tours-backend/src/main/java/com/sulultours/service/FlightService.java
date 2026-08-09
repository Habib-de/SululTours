package com.sulultours.service;

import com.sulultours.entity.Flight;
import com.sulultours.exception.ResourceNotFoundException;
import com.sulultours.repository.FlightRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FlightService {

    private final FlightRepository flightRepository;

    @Transactional
    public Flight createFlight(Flight flight) {
        return flightRepository.save(flight);
    }

    public Flight getFlightById(String id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));
    }

    public List<Flight> getFlightsByTenant(String tenantId) {
        return flightRepository.findByTenantId(tenantId);
    }

    public List<Flight> getFlightsByTenantAndStatus(String tenantId, String status) {
        return flightRepository.findByTenantIdAndStatus(tenantId, status);
    }

    public List<Flight> getFlightsByAirline(String airline) {
        return flightRepository.findByAirline(airline);
    }

    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    @Transactional
    public Flight updateFlight(String id, Flight flightDetails) {
        Flight flight = getFlightById(id);
        flight.setAirline(flightDetails.getAirline());
        flight.setFlightNumber(flightDetails.getFlightNumber());
        flight.setOrigin(flightDetails.getOrigin());
        flight.setDestination(flightDetails.getDestination());
        flight.setFlightType(flightDetails.getFlightType());
        flight.setDepartureDate(flightDetails.getDepartureDate());
        flight.setDepartureTime(flightDetails.getDepartureTime());
        flight.setArrivalDate(flightDetails.getArrivalDate());
        flight.setArrivalTime(flightDetails.getArrivalTime());
        flight.setDuration(flightDetails.getDuration());
        flight.setEconomyPrice(flightDetails.getEconomyPrice());
        flight.setBusinessPrice(flightDetails.getBusinessPrice());
        flight.setFirstClassPrice(flightDetails.getFirstClassPrice());
        flight.setEconomySeats(flightDetails.getEconomySeats());
        flight.setBusinessSeats(flightDetails.getBusinessSeats());
        flight.setFirstClassSeats(flightDetails.getFirstClassSeats());
        flight.setStatus(flightDetails.getStatus());
        flight.setTerminal(flightDetails.getTerminal());
        flight.setGate(flightDetails.getGate());
        flight.setBaggageAllowance(flightDetails.getBaggageAllowance());
        flight.setAmenities(flightDetails.getAmenities());
        flight.setImage(flightDetails.getImage());
        flight.setNotes(flightDetails.getNotes());
        return flightRepository.save(flight);
    }

    @Transactional
    public void deleteFlight(String id) {
        Flight flight = getFlightById(id);
        flightRepository.delete(flight);
    }
}